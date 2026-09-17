import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import pool from '../db.js';
import { getClientIp, checkAiRateLimit } from '../utils/aiRateLimit.js';

const router = Router();

// AI Neural Clean Endpoint for PDF to RAG
router.post('/ai-clean', async (req, res) => {
  try {
    const { rawText, visitorId } = req.body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'rawText is required for AI polishing.' });
    }

    const clientIp = getClientIp(req);
    const quota = await checkAiRateLimit(pool, 'pdf-rag-cleaner', visitorId, clientIp);

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
You are an expert Document Parsing and RAG (Retrieval-Augmented Generation) preprocessing engine.
Your task is to take this extracted raw PDF text and reconstruct it into pristine, perfectly structured GitHub-flavored Markdown optimized for LLM vector embeddings.

Rules:
1. Remove all running headers, running footers, isolated page numbers, and repetitive copyright notices.
2. Fix all hyphenated words split across lines (e.g., "architec- ture" -> "architecture").
3. Detect visual hierarchy and format headers properly (# H1 Document Title, ## H2 Major Sections, ### H3 Subsections).
4. Reconstruct broken tabular data into clean Markdown tables (| Header 1 | Header 2 |).
5. Format bullet points and numbered lists cleanly.
6. Preserve ALL technical terms, formulas, citations, and data accurately without summarizing or deleting content.
7. Return ONLY the polished Markdown text directly without meta-commentary, code fences, or intro words.

Raw PDF Text to Clean:
"""
${rawText.slice(0, 15000)}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    const polishedMarkdown = (response.text || '').trim();

    // Insert usage event
    await pool.query(
      'INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata) VALUES ($1, $2, $3, $4)',
      ['pdf-rag-cleaner', 'ai_scan', visitorId || null, JSON.stringify({ ip: clientIp, length: rawText.length })]
    );

    // Increment tool use count
    await pool.query(
      'UPDATE cerilas_tools SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() WHERE slug = $1',
      ['pdf-rag-cleaner']
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
      polishedMarkdown,
      quota: updatedQuota
    });
  } catch (error) {
    console.error('PDF RAG AI clean error:', error);
    res.status(500).json({ success: false, error: 'Failed to polish document with AI.' });
  }
});

export default router;
