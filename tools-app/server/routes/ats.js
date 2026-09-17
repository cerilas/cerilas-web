import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import pool from '../db.js';
import { getClientIp, checkAiRateLimit } from '../utils/aiRateLimit.js';

const router = Router();

// Quota check endpoint
router.get(['/quota', '/ai-quota'], async (req, res) => {
  try {
    const visitorId = req.query.visitorId;
    const clientIp = getClientIp(req);
    const quota = await checkAiRateLimit(pool, 'ats-resume-checker', visitorId, clientIp);
    res.json({ status: 'success', quota });
  } catch (error) {
    console.error('Error fetching ATS AI quota:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch AI quota' });
  }
});

// ATS Resume Checker AI analysis endpoint
router.post('/check', async (req, res) => {
  try {
    const { resumeText, jobDescription, visitorId } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Both resume text and job description are required.' });
    }

    const clientIp = getClientIp(req);
    const quota = await checkAiRateLimit(pool, 'ats-resume-checker', visitorId, clientIp);

    if (!quota.allowed) {
      return res.status(429).json({
        error: `Hourly AI limit reached (${quota.limit} scans per hour). Your quota will reset in ${quota.resetInMinutes} minutes.`,
        quota
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer, technical recruiter, and executive resume coach.
Your job is to thoroughly analyze the candidate's resume text against the provided target job description.

Evaluate:
1. ATS Match Score (0 to 100 based on relevant skills, keywords, experience match).
2. Missing Keywords: Critical skills, tools, certifications, or keywords found in the JD but absent in the resume.
3. Matching Keywords: Skills, technologies, and qualifications in the JD that are strongly present in the resume.
4. Formatting Issues: ATS structural red flags (e.g. missing sections, contact info clarity, measurable metrics/bullet points, readability).
5. Suggestions: Concrete, actionable, high-impact bullet points to boost interview selection rate.

Respond with ONLY a valid JSON object (no markdown, no backticks):
{
  "score": <number 0-100>,
  "missingKeywords": [<string>, ...],
  "matchingKeywords": [<string>, ...],
  "formattingIssues": [<string>, ...],
  "suggestions": [<string>, ...]
}

=== JOB DESCRIPTION ===
${jobDescription}

=== RESUME TEXT ===
${resumeText}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    if (!response.text) {
      throw new Error('Empty response received from AI model');
    }

    let result;
    try {
      result = JSON.parse(response.text);
    } catch (parseErr) {
      console.error('Failed to parse AI JSON response:', response.text);
      throw new Error('Invalid JSON format returned by AI model');
    }

    // Record tool usage and rate limit event in background
    try {
      await pool.query(`
        UPDATE cerilas_tools 
        SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() 
        WHERE slug = 'ats-resume-checker'
      `);
      await pool.query(`
        INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata)
        VALUES ('ats-resume-checker', 'ai_scan', $1, $2)
      `, [visitorId || null, JSON.stringify({ score: result.score, ip: clientIp })]);
    } catch (dbErr) {
      console.warn('Could not record ATS event in DB:', dbErr.message);
    }

    const updatedQuota = {
      limit: quota.limit,
      remaining: Math.max(0, quota.remaining - 1),
      resetInMinutes: quota.resetInMinutes || 60
    };

    res.json({ ...result, quota: updatedQuota });
  } catch (error) {
    console.error('Error in ATS check:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze resume with AI.' });
  }
});

export default router;
