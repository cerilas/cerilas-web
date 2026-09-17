import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

const AI_CLICHE_PATTERNS = [
  /\bdelve\b/gi,
  /\bcrucial\b/gi,
  /\bpivotal\b/gi,
  /\btestament\b/gi,
  /\btapestry\b/gi,
  /\bmultifaceted\b/gi,
  /\bparamount\b/gi,
  /\bfostering\b/gi,
  /\binterplay\b/gi,
  /\bseamlessly\b/gi,
  /\bunderscores\b/gi,
  /\bnavigating\b/gi,
  /\blandscape\b/gi,
  /\bin conclusion\b/gi,
  /\bfurthermore\b/gi,
  /\bmoreover\b/gi,
  /\bit is important to note\b/gi
];

/**
 * Extract plain text from PDF in browser memory.
 */
export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      fullText += pageText + '\n\n';
    }

    const trimmed = fullText.trim();
    return {
      success: true,
      text: trimmed,
      numPages: pdf.numPages,
      wordCount: trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
    };
  } catch (err) {
    console.error('PDF extraction error in AI detector:', err);
    return {
      success: false,
      error: 'Failed to read PDF document: ' + (err.message || 'Corrupted format'),
      text: '',
      numPages: 0,
      wordCount: 0
    };
  }
}

/**
 * Compute local heuristic stats: sentence count, burstiness (standard deviation of sentence lengths).
 */
export function computeLocalStats(text) {
  if (!text || !text.trim()) {
    return { wordCount: 0, charCount: 0, sentenceCount: 0, burstinessScore: 0, clicheCount: 0 };
  }

  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = clean.length;

  // Split into sentences using punctuation boundaries (. ! ?)
  const sentences = clean.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 3);
  const sentenceCount = Math.max(1, sentences.length);

  // Compute sentence word lengths
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

  // Standard deviation (Burstiness indicator: humans have high burstiness, LLMs have low variance)
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);

  // Normalized burstiness score (0 to 100: higher = more varied/human rhythm)
  const burstinessScore = Math.min(100, Math.round((stdDev / (avgLen || 1)) * 100));

  // Count cliché markers
  let clicheCount = 0;
  AI_CLICHE_PATTERNS.forEach(pattern => {
    const matches = clean.match(pattern);
    if (matches) clicheCount += matches.length;
  });

  return {
    wordCount,
    charCount,
    sentenceCount,
    avgSentenceLength: Math.round(avgLen * 10) / 10,
    burstinessScore,
    clicheCount
  };
}
