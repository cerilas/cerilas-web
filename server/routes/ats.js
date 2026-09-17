import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

router.post('/check', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Resume text and job description are required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. ATS checker cannot function.");
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer and HR professional.
I will provide you with a resume and a job description. 
Your task is to analyze the resume against the job description and output a JSON object containing the evaluation.

Output exactly this JSON structure and nothing else (do not wrap it in markdown block like \`\`\`json):
{
  "score": <number between 0 and 100 representing the match percentage>,
  "missingKeywords": [<array of important keywords from JD missing in resume>],
  "matchingKeywords": [<array of important keywords from JD present in resume>],
  "formattingIssues": [<array of strings describing potential ATS formatting issues based on the text provided, e.g. "Missing contact info", "Unclear section headings">],
  "suggestions": [<array of actionable suggestions to improve the resume for this specific job>]
}

=== JOB DESCRIPTION ===
${jobDescription}

=== RESUME ===
${resumeText}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    let result;
    try {
      result = JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse JSON from AI response:", response.text);
      throw new Error("Invalid JSON response from AI");
    }

    res.json(result);
  } catch (error) {
    console.error('ATS Check Error:', error);
    res.status(500).json({ error: 'Failed to analyze resume', details: error.message });
  }
});

export default router;
