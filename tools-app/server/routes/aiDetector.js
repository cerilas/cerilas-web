import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import pool from '../db.js';
import { getClientIp, checkAiRateLimit } from '../utils/aiRateLimit.js';

const router = Router();

// AI Content Detector Analysis Endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { text, localStats = {}, visitorId } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return res.status(400).json({ success: false, error: 'Text must be at least 50 characters long.' });
    }

    const clientIp = getClientIp(req);
    const quota = await checkAiRateLimit(pool, 'ai-content-detector', visitorId, clientIp);

    if (!quota.allowed) {
      return res.status(429).json({
        success: false,
        error: `Hourly AI limit reached (${quota.limit} scans per hour). Your quota will reset in ${quota.resetInMinutes} minutes.`,
        quota
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
      return res.status(500).json({ success: false, error: 'Gemini API key is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert computational linguist, academic honesty auditor, and AI text detector (specialized in detecting ChatGPT, Claude, Gemini, DeepSeek, and Llama).
Your task is to thoroughly analyze the provided text and determine the probability (0 to 100%) that it was generated or heavily assisted by an AI model.

Evaluation Criteria:
1. Perplexity & Vocabulary Surprisal: Does the text use statistically predictable n-gram token chains, or authentic idiosyncratic human vocabulary?
2. Burstiness & Cadence: Are sentence lengths uniform and formulaic (AI), or do they oscillate with natural human rhythm?
3. Formulaic Transitions: Look for AI clichés like "delve", "crucial", "testament", "multifaceted", "pivotal", "in conclusion", "furthermore", "it is important to note".
4. Personal Voice & Specificity: Are claims concrete with authentic human detail, or generic, diplomatic, and hedging?

Return ONLY a valid JSON object matching this exact schema (no markdown, no backticks):
{
  "aiScore": number (0 to 100, where 0 is 100% human, 100 is 100% AI),
  "confidence": "High" | "Medium" | "Low",
  "verdict": "Likely Human-Written" | "Mixed / Paraphrased" | "Highly Likely AI-Generated",
  "perplexityRating": "High (Human)" | "Moderate" | "Low (AI)",
  "burstinessScore": number (0 to 100),
  "clicheCount": number,
  "humanMarkers": [
    {
      "title": "Short title of organic signal (e.g. Conversational Cadence)",
      "description": "Clear explanation why this indicates human authorship",
      "excerpt": "Brief sentence or phrase from the text demonstrating this"
    }
  ],
  "aiMarkers": [
    {
      "title": "Short title of synthetic signal (e.g. Formulaic Transition Cliché)",
      "description": "Clear explanation why this indicates machine generation",
      "excerpt": "Brief sentence or phrase from the text demonstrating this"
    }
  ],
  "highlightedSentences": [
    {
      "sentence": "The exact sentence text",
      "isAi": boolean (true if flagged as AI, false if human),
      "explanation": "Brief reason"
    }
  ],
  "actionableSummary": "A 2-3 sentence executive summary of the forensic findings."
}

Text to Analyze:
"""
${text.slice(0, 14000)}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    const responseText = (response.text || '').trim();
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    let analysis;
    try {
      analysis = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse AI detector JSON response:', responseText);
      throw new Error('Analysis engine returned an invalid format.');
    }

    // Insert usage event into tool_usage_events
    await pool.query(
      'INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata) VALUES ($1, $2, $3, $4)',
      ['ai-content-detector', 'ai_scan', visitorId || null, JSON.stringify({ ip: clientIp, aiScore: analysis.aiScore })]
    );

    // Increment tool use count
    await pool.query(
      'UPDATE cerilas_tools SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() WHERE slug = $1',
      ['ai-content-detector']
    );

    const updatedQuota = {
      allowed: quota.remaining - 1 > 0,
      limit: quota.limit,
      used: quota.used + 1,
      remaining: Math.max(0, quota.remaining - 1),
      resetInMinutes: quota.resetInMinutes || 60
    };

    res.json({
      success: true,
      analysis,
      quota: updatedQuota
    });
  } catch (error) {
    console.error('AI detector server error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze text.' });
  }
});

export default router;
