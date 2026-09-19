import { encode as encodeO200k, decode as decodeO200k } from 'gpt-tokenizer/model/gpt-4o';
import { encode as encodeCl100k } from 'gpt-tokenizer/model/gpt-4';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * 2026 Model Catalog: Context Windows and API Pricing ($ per 1M tokens)
 */
export const MODEL_CATALOG = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    badge: 'Flagship Omni',
    tokenizer: 'o200k',
    contextWindow: 128000,
    maxOutput: 16384,
    inputPricePerM: 2.50,
    outputPricePerM: 10.00,
    color: '#10a37f'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    badge: 'Affordable & Fast',
    tokenizer: 'o200k',
    contextWindow: 128000,
    maxOutput: 16384,
    inputPricePerM: 0.15,
    outputPricePerM: 0.60,
    color: '#0e8b6d'
  },
  {
    id: 'o1',
    name: 'o1',
    provider: 'OpenAI',
    badge: 'Reasoning Pro',
    tokenizer: 'o200k',
    contextWindow: 200000,
    maxOutput: 100000,
    inputPricePerM: 15.00,
    outputPricePerM: 60.00,
    color: '#6366f1'
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'OpenAI',
    badge: 'Fast Reasoning',
    tokenizer: 'o200k',
    contextWindow: 200000,
    maxOutput: 100000,
    inputPricePerM: 1.10,
    outputPricePerM: 4.40,
    color: '#818cf8'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    badge: 'Legacy Flagship',
    tokenizer: 'cl100k',
    contextWindow: 128000,
    maxOutput: 4096,
    inputPricePerM: 10.00,
    outputPricePerM: 30.00,
    color: '#059669'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    badge: 'Classic',
    tokenizer: 'cl100k',
    contextWindow: 16384,
    maxOutput: 4096,
    inputPricePerM: 0.50,
    outputPricePerM: 1.50,
    color: '#14b8a6'
  },

  // Anthropic Claude
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    badge: 'Hybrid Reasoning',
    tokenizer: 'claude',
    contextWindow: 200000,
    maxOutput: 64000,
    inputPricePerM: 3.00,
    outputPricePerM: 15.00,
    color: '#d97706'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Coding & Analysis',
    tokenizer: 'claude',
    contextWindow: 200000,
    maxOutput: 8192,
    inputPricePerM: 3.00,
    outputPricePerM: 15.00,
    color: '#f59e0b'
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    badge: 'Speed Demon',
    tokenizer: 'claude',
    contextWindow: 200000,
    maxOutput: 8192,
    inputPricePerM: 0.80,
    outputPricePerM: 4.00,
    color: '#fbbf24'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    badge: 'Deep Intelligence',
    tokenizer: 'claude',
    contextWindow: 200000,
    maxOutput: 4096,
    inputPricePerM: 15.00,
    outputPricePerM: 75.00,
    color: '#b45309'
  },

  // Google Gemini
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    badge: '2M Context Frontier',
    tokenizer: 'gemini',
    contextWindow: 2000000,
    maxOutput: 8192,
    inputPricePerM: 1.25,
    outputPricePerM: 5.00,
    color: '#3b82f6'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    badge: 'Ultra Fast & SOTA',
    tokenizer: 'gemini',
    contextWindow: 1048576,
    maxOutput: 8192,
    inputPricePerM: 0.10,
    outputPricePerM: 0.40,
    color: '#2563eb'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    badge: '2M Multi-Modal',
    tokenizer: 'gemini',
    contextWindow: 2000000,
    maxOutput: 8192,
    inputPricePerM: 1.25,
    outputPricePerM: 5.00,
    color: '#1d4ed8'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    badge: 'High Volume Efficiency',
    tokenizer: 'gemini',
    contextWindow: 1048576,
    maxOutput: 8192,
    inputPricePerM: 0.075,
    outputPricePerM: 0.30,
    color: '#60a5fa'
  },

  // DeepSeek
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    provider: 'DeepSeek',
    badge: 'MoE Open SOTA',
    tokenizer: 'deepseek',
    contextWindow: 64000,
    maxOutput: 8000,
    inputPricePerM: 0.28,
    outputPricePerM: 2.19,
    color: '#06b6d4'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1',
    provider: 'DeepSeek',
    badge: 'Open Reasoning',
    tokenizer: 'deepseek',
    contextWindow: 64000,
    maxOutput: 8000,
    inputPricePerM: 0.55,
    outputPricePerM: 2.19,
    color: '#0891b2'
  },

  // Meta & Open Source
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    badge: 'Open Weights Flagship',
    tokenizer: 'llama3',
    contextWindow: 128000,
    maxOutput: 8192,
    inputPricePerM: 0.59,
    outputPricePerM: 0.79,
    color: '#ec4899'
  },
  {
    id: 'llama-3.1-405b',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    badge: 'Frontier Open Weights',
    tokenizer: 'llama3',
    contextWindow: 128000,
    maxOutput: 8192,
    inputPricePerM: 2.50,
    outputPricePerM: 3.50,
    color: '#db2777'
  },
  {
    id: 'mistral-large-2',
    name: 'Mistral Large 2',
    provider: 'Mistral',
    badge: 'European Frontier',
    tokenizer: 'cl100k',
    contextWindow: 128000,
    maxOutput: 8192,
    inputPricePerM: 2.00,
    outputPricePerM: 6.00,
    color: '#f97316'
  },
  {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B',
    provider: 'Alibaba',
    badge: 'Multilingual & Code',
    tokenizer: 'o200k',
    contextWindow: 128000,
    maxOutput: 8192,
    inputPricePerM: 0.35,
    outputPricePerM: 0.40,
    color: '#a855f7'
  }
];

/**
 * Clean common unicode ligatures from document text.
 */
function cleanLigatures(text) {
  return text
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    .replace(/\uFB05/g, 'ft')
    .replace(/\uFB06/g, 'st')
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, ' - ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

/**
 * Extract plain text from various file formats (PDF, code, plain text, data).
 */
export async function extractTextFromFile(file) {
  if (!file) return null;
  const fileName = file.name;
  const fileSize = file.size;
  const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item) => cleanLigatures(item.str || ''))
        .join(' ');
      pageTexts.push(`--- Page ${pageNum} ---\n` + pageString.trim());
    }

    const fullText = pageTexts.join('\n\n');
    return {
      text: fullText,
      fileName,
      fileSize,
      fileType: 'PDF Document',
      pageCount: numPages,
      charCount: fullText.length
    };
  }

  // Text, code, Markdown, CSV, JSON etc.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result || '';
      resolve({
        text,
        fileName,
        fileSize,
        fileType: getFileTypeLabel(fileName),
        pageCount: 1,
        charCount: text.length
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

function getFileTypeLabel(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map = {
    txt: 'Plain Text',
    md: 'Markdown',
    markdown: 'Markdown',
    json: 'JSON Data',
    csv: 'CSV Spreadsheet',
    tsv: 'TSV Data',
    xml: 'XML Document',
    yaml: 'YAML File',
    yml: 'YAML File',
    js: 'JavaScript',
    jsx: 'React JSX',
    ts: 'TypeScript',
    tsx: 'React TSX',
    py: 'Python Script',
    html: 'HTML File',
    css: 'CSS Stylesheet',
    go: 'Go Source',
    rs: 'Rust Source',
    java: 'Java Source',
    c: 'C Source',
    cpp: 'C++ Source',
    sql: 'SQL Script',
    sh: 'Shell Script',
    log: 'Server Log'
  };
  return map[ext] || 'Text Document';
}

/**
 * Calculate comprehensive text stats.
 */
export function calculateTextStats(text) {
  if (!text) {
    return {
      chars: 0,
      charsNoSpaces: 0,
      words: 0,
      lines: 0,
      bytes: 0,
      readingTimeMin: 0,
      speakingTimeMin: 0
    };
  }

  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;
  const bytes = new TextEncoder().encode(text).length;

  return {
    chars,
    charsNoSpaces,
    words,
    lines,
    bytes,
    readingTimeMin: Math.max(0.1, +(words / 225).toFixed(1)),
    speakingTimeMin: Math.max(0.1, +(words / 135).toFixed(1))
  };
}

/**
 * Tokenize text for o200k_base (GPT-4o, o1, o3, Qwen 2.5) with individual token parts.
 */
export function tokenizeO200kWithDetails(text, maxVisualTokens = 1500) {
  if (!text) return { count: 0, tokens: [], isTruncated: false, totalCount: 0 };

  try {
    const rawTokens = encodeO200k(text);
    const totalCount = rawTokens.length;
    const isTruncated = totalCount > maxVisualTokens;
    const sliceTokens = isTruncated ? rawTokens.slice(0, maxVisualTokens) : rawTokens;

    // Decode each token piece for visualization
    const tokens = sliceTokens.map((tokenId, index) => {
      let piece = '';
      try {
        piece = decodeO200k([tokenId]);
      } catch {
        piece = `[${tokenId}]`;
      }

      return {
        id: tokenId,
        index,
        text: piece,
        display: piece.replace(/ /g, '·').replace(/\n/g, '↵\n').replace(/\t/g, '⇥ ')
      };
    });

    return {
      count: totalCount,
      tokens,
      isTruncated,
      totalCount
    };
  } catch (err) {
    console.error('o200k tokenization failed:', err);
    const fallbackCount = Math.ceil(text.length / 3.8);
    return { count: fallbackCount, tokens: [], isTruncated: false, totalCount: fallbackCount };
  }
}

/**
 * Tokenize for cl100k_base (GPT-4 Turbo, GPT-3.5, Mistral Large).
 */
export function countCl100k(text) {
  if (!text) return 0;
  try {
    return encodeCl100k(text).length;
  } catch {
    return Math.ceil(text.length / 3.7);
  }
}

/**
 * Compute token counts across all models in catalog.
 */
export function computeAllModelTokens(text) {
  if (!text) {
    return MODEL_CATALOG.map((m) => ({
      ...m,
      tokenCount: 0,
      contextPercentage: 0,
      inputCost: 0,
      outputCost1k: 0
    }));
  }

  // Exact base token counts
  let o200kCount = 0;
  let cl100kCount = 0;
  try {
    o200kCount = encodeO200k(text).length;
  } catch {
    o200kCount = Math.ceil(text.length / 3.8);
  }

  try {
    cl100kCount = encodeCl100k(text).length;
  } catch {
    cl100kCount = Math.ceil(text.length / 3.7);
  }

  return MODEL_CATALOG.map((m) => {
    let tokenCount = 0;
    if (m.tokenizer === 'o200k') {
      tokenCount = o200kCount;
    } else if (m.tokenizer === 'cl100k') {
      tokenCount = cl100kCount;
    } else if (m.tokenizer === 'claude') {
      // Claude BPE typically registers ~1.04x of cl100k
      tokenCount = Math.round(cl100kCount * 1.038);
    } else if (m.tokenizer === 'gemini') {
      // Gemini SentencePiece tokenizes code and multilingual text slightly differently (~1.02x of o200k)
      tokenCount = Math.round(o200kCount * 1.025);
    } else if (m.tokenizer === 'deepseek') {
      // DeepSeek 128k BPE vocabulary closely mirrors o200k
      tokenCount = Math.round(o200kCount * 1.01);
    } else if (m.tokenizer === 'llama3') {
      // Llama 3 128k tiktoken
      tokenCount = Math.round(o200kCount * 1.015);
    } else {
      tokenCount = o200kCount;
    }

    const contextPercentage = +((tokenCount / m.contextWindow) * 100).toFixed(2);
    const inputCost = +((tokenCount / 1000000) * m.inputPricePerM).toFixed(6);
    const outputCost1k = +((1000 / 1000000) * m.outputPricePerM).toFixed(5);

    return {
      ...m,
      tokenCount,
      contextPercentage,
      inputCost,
      outputCost1k
    };
  });
}

/**
 * 1-Click Prompt Reducer & Token Clean-up.
 */
export function optimizeTextTokens(text, mode = 'whitespace') {
  if (!text) return { original: '', optimized: '', savedCount: 0, savedPercentage: 0 };

  let optimized = text;

  if (mode === 'whitespace') {
    // Collapse multiple horizontal spaces to single space, trim trailing spaces, condense 3+ newlines to 2
    optimized = text
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .trim();
  } else if (mode === 'comments') {
    // Strip JavaScript, Python, and C-style comments
    optimized = text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .replace(/# [^\n]*/g, '')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  } else if (mode === 'html') {
    // Strip HTML/XML tags
    optimized = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  }

  const origCount = encodeO200k(text).length;
  const optCount = encodeO200k(optimized).length;
  const savedCount = Math.max(0, origCount - optCount);
  const savedPercentage = origCount > 0 ? +((savedCount / origCount) * 100).toFixed(1) : 0;

  return {
    original: text,
    optimized,
    origCount,
    optCount,
    savedCount,
    savedPercentage
  };
}

/**
 * Sample Preset Texts for instant testing.
 */
export const SAMPLE_PRESETS = [
  {
    id: 'ai-prompt',
    label: 'System Prompt & User Context',
    text: `You are an elite Senior Staff Full-Stack Engineer and AI Solutions Architect.
Your task is to analyze production architecture diagrams, identify database connection bottlenecks, and recommend horizontal scaling strategies using Redis caching and Postgres read replicas.

Constraints:
1. Ground all recommendations with explicit code examples in TypeScript and Node.js.
2. Provide step-by-step migration scripts with zero-downtime blue/green deployment.
3. Calculate exact latency improvements (p95 and p99 metrics) for 50,000 requests per second.

User Query:
"Our e-commerce checkout service experiences 429 Too Many Requests errors and 1.8s response latencies during flash sales. How do we refactor the cart checkout queue using BullMQ and optimistic concurrency control?"`
  },
  {
    id: 'code-snippet',
    label: 'React & TypeScript Code',
    text: `import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface ModelMetric {
  id: string;
  name: string;
  contextUsage: number;
  costEstimate: number;
}

export const TokenAnalyticsDashboard: React.FC<{ prompt: string }> = ({ prompt }) => {
  const [metrics, setMetrics] = useState<ModelMetric[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const totalCharacters = useMemo(() => prompt.length, [prompt]);
  const estimatedTokens = useMemo(() => Math.ceil(totalCharacters / 3.8), [totalCharacters]);

  const handleAudit = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/token-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, timestamp: Date.now() })
      });
      const data = await response.json();
      setMetrics(data.results);
    } catch (error) {
      console.error('Audit execution error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  return (
    <div className="analytics-card">
      <h3>Context Window Budget ({estimatedTokens.toLocaleString()} tokens)</h3>
      <button onClick={handleAudit} disabled={isLoading}>
        {isLoading ? 'Auditing...' : 'Run Token Optimization'}
      </button>
    </div>
  );
};`
  },
  {
    id: 'multilingual-article',
    label: 'Multilingual Essay (Turkish & English)',
    text: `Yapay zekâ modellerinde tokenizasyon, girdi metinlerinin sayısal vektörlere dönüştürülmesindeki ilk ve en kritik adımdır. İngilizce kelimeler çoğunlukla tek bir token ile temsil edilirken, Türkçe gibi sondan eklemeli dillerde ekler ve karakter yapıları nedeniyle aynı kelime 2 veya 3 farklı token'a bölünebilmektedir.

For example, the word "understanding" corresponds to a single token in the OpenAI o200k vocabulary, whereas its Turkish translation "anlayabilmek" may be split into multiple sub-word chunks.

Bu durum, çok dilli yapay zekâ uygulamalarında bağlam penceresi (context window) optimizasyonunu ve API maliyet yönetimini doğrudan etkilemektedir. Doğru model seçimi ve prompt tasarımı, aylık yapay zekâ bütçenizde %80'e varan tasarruf sağlayabilir.`
  },
  {
    id: 'json-payload',
    label: 'JSON API Payload',
    text: `{
  "apiVersion": "2026-03-15",
  "pipeline": "rag-hybrid-search",
  "documentId": "doc_9841289410",
  "metadata": {
    "title": "Quarterly Financial Analysis & Risk Forecast",
    "author": "Cerilas AI Research Labs",
    "tags": ["finance", "risk", "predictive-modeling", "quarterly-report"],
    "confidentiality": "internal-use-only",
    "vectorEmbeddings": [0.0142, -0.0891, 0.4128, -0.1923, 0.0048, 0.2917, -0.0412],
    "chunkCount": 42
  },
  "summary": "Revenue increased by 38.4% YoY driven by enterprise AI agent subscriptions and automated workflow tooling adoption.",
  "confidenceScore": 0.984
}`
  }
];
