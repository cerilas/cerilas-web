import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Replace common PDF ligatures and unicode quirks.
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
 * Estimate LLM token count from text using standard ~4 chars/token heuristic.
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4);
}

/**
 * Extract raw structured layout items from PDF.
 */
export async function parsePdfStructure(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pagesData = [];
  const allFontSizes = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const items = textContent.items.map((item) => {
      const fontSize = Math.round(Math.hypot(item.transform[0], item.transform[1]));
      if (fontSize > 4) allFontSizes.push(fontSize);

      return {
        str: cleanLigatures(item.str),
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height || fontSize,
        fontSize,
        fontName: item.fontName
      };
    }).filter(it => it.str.trim().length > 0);

    pagesData.push({
      pageNum,
      width: viewport.width,
      height: viewport.height,
      items
    });
  }

  // Calculate median body font size
  allFontSizes.sort((a, b) => a - b);
  const medianFontSize = allFontSizes.length > 0
    ? allFontSizes[Math.floor(allFontSizes.length / 2)]
    : 12;

  // Identify repetitive header / footer candidates
  const headerFooterCounts = {};
  pagesData.forEach(({ height, items }) => {
    items.forEach(item => {
      const isTop = item.y > height * 0.92;
      const isBottom = item.y < height * 0.08;
      const isPageNumber = /^\s*(page\s+)?\d+(\s+of\s+\d+)?\s*$/i.test(item.str);

      if (isTop || isBottom || isPageNumber) {
        const key = item.str.trim();
        if (key.length > 0) {
          headerFooterCounts[key] = (headerFooterCounts[key] || 0) + 1;
        }
      }
    });
  });

  // Filter out headers/footers appearing on multiple pages or pure page numbers
  const noiseStrings = new Set();
  Object.entries(headerFooterCounts).forEach(([str, count]) => {
    if (count >= Math.max(2, Math.floor(numPages * 0.4)) || /^\s*(page\s+)?\d+(\s+of\s+\d+)?\s*$/i.test(str)) {
      noiseStrings.add(str);
    }
  });

  return {
    numPages,
    medianFontSize,
    noiseStrings,
    pagesData
  };
}

/**
 * Clean layout lines and build semantic Markdown.
 */
export function buildCleanMarkdown(structure, fileName, fileSize) {
  const { numPages, medianFontSize, noiseStrings, pagesData } = structure;
  let totalRawChars = 0;
  const cleanedPages = [];

  pagesData.forEach(({ pageNum, items }) => {
    const validItems = items.filter(it => !noiseStrings.has(it.str.trim()));
    totalRawChars += items.reduce((sum, it) => sum + it.str.length, 0);

    // Group items into lines based on Y coordinate proximity (~3px)
    const lines = [];
    validItems.forEach(item => {
      const existingLine = lines.find(l => Math.abs(l.y - item.y) <= 3.5);
      if (existingLine) {
        existingLine.items.push(item);
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    });

    // Sort lines top to bottom (PDF Y is from bottom up)
    lines.sort((a, b) => b.y - a.y);

    // Sort items within each line left to right
    lines.forEach(l => {
      l.items.sort((a, b) => a.x - b.x);
    });

    // Synthesize Markdown blocks for this page
    const pageBlocks = [];
    let currentParagraph = '';
    let currentHeading = null;

    lines.forEach(line => {
      const lineText = line.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
      if (!lineText) return;

      const maxFontSize = Math.max(...line.items.map(it => it.fontSize));
      const isH1 = maxFontSize >= medianFontSize * 1.45 && lineText.length < 120;
      const isH2 = maxFontSize >= medianFontSize * 1.25 && !isH1 && lineText.length < 140;
      const isH3 = maxFontSize >= medianFontSize * 1.12 && !isH1 && !isH2 && lineText.length < 160;
      const isList = /^[-*•]\s+/.test(lineText) || /^\d+[\.)]\s+/.test(lineText);

      if (isH1 || isH2 || isH3) {
        if (currentParagraph) {
          pageBlocks.push(repairHyphenation(currentParagraph.trim()));
          currentParagraph = '';
        }
        const prefix = isH1 ? '# ' : isH2 ? '## ' : '### ';
        const cleanHeading = lineText.replace(/^#+\s*/, '');
        pageBlocks.push(`${prefix}${cleanHeading}`);
        currentHeading = cleanHeading;
      } else if (isList) {
        if (currentParagraph) {
          pageBlocks.push(repairHyphenation(currentParagraph.trim()));
          currentParagraph = '';
        }
        // Normalize bullet points to Markdown `- `
        const cleanList = lineText.replace(/^[-*•]\s*/, '- ');
        pageBlocks.push(cleanList);
      } else {
        // Body text: append to paragraph with line break or space
        if (currentParagraph.endsWith('-')) {
          // De-hyphenate across lines
          currentParagraph = currentParagraph.slice(0, -1) + lineText;
        } else if (currentParagraph) {
          currentParagraph += ' ' + lineText;
        } else {
          currentParagraph = lineText;
        }
      }
    });

    if (currentParagraph) {
      pageBlocks.push(repairHyphenation(currentParagraph.trim()));
    }

    cleanedPages.push({
      pageNum,
      content: pageBlocks.join('\n\n'),
      lastHeading: currentHeading
    });
  });

  const fullMarkdown = cleanedPages
    .map(p => `<!-- Page ${p.pageNum} -->\n${p.content}`)
    .join('\n\n')
    .trim();

  const totalCleanChars = fullMarkdown.length;
  const noiseCharsRemoved = Math.max(0, totalRawChars - totalCleanChars);
  const cleanRatio = totalRawChars > 0 ? Math.round((noiseCharsRemoved / totalRawChars) * 100) : 0;
  const wordCount = fullMarkdown.split(/\s+/).filter(Boolean).length;
  const tokenCount = estimateTokens(fullMarkdown);

  return {
    markdown: fullMarkdown,
    cleanText: fullMarkdown.replace(/<!--.*?-->/g, '').replace(/#+\s*/g, '').trim(),
    cleanedPages,
    metadata: {
      fileName,
      fileSize,
      pageCount: numPages,
      wordCount,
      charCount: totalCleanChars,
      estimatedTokens: tokenCount,
      noiseCharsRemoved,
      cleanRatio
    }
  };
}

/**
 * Repair hyphenated words split across lines: e.g. "com- puter" or "transfor- mation".
 */
function repairHyphenation(text) {
  return text
    .replace(/(\w+)-\s+(\w+)/g, '$1$2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * RAG Chunking Engine.
 * Supports:
 *  - 'semantic' (by Markdown headings)
 *  - 'tokens' (sliding token window with overlap)
 *  - 'page' (page by page)
 */
export function chunkForRag(cleanedData, options = {}) {
  const {
    strategy = 'semantic', // 'semantic' | 'tokens' | 'page'
    targetTokenSize = 500,
    overlapRatio = 0.1 // 10% overlap
  } = options;

  const { markdown, cleanedPages, metadata } = cleanedData;
  const chunks = [];

  if (strategy === 'page') {
    cleanedPages.forEach(page => {
      const text = page.content.trim();
      if (!text) return;
      const tokens = estimateTokens(text);

      chunks.push({
        id: `chunk_${chunks.length + 1}`,
        index: chunks.length,
        strategy: 'page',
        pageNumber: page.pageNum,
        sectionTitle: page.lastHeading || `Page ${page.pageNum}`,
        charCount: text.length,
        estimatedTokens: tokens,
        content: text,
        metadata: {
          source: metadata.fileName,
          page: page.pageNum,
          section: page.lastHeading || `Page ${page.pageNum}`,
          tokens
        }
      });
    });
    return chunks;
  }

  if (strategy === 'semantic') {
    // Split by Markdown headers (# H1, ## H2, ### H3)
    const sections = markdown.split(/\n(?=#{1,3}\s)/);
    let currentSectionTitle = 'Overview / Preamble';

    sections.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return;

      const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/m);
      if (headingMatch) {
        currentSectionTitle = headingMatch[1].trim();
      }

      const tokens = estimateTokens(trimmed);

      // If a section is very large (> 1200 tokens), sub-chunk it with token window
      if (tokens > targetTokenSize * 2) {
        const subChunks = splitByTokenWindow(trimmed, targetTokenSize, overlapRatio);
        subChunks.forEach((sub, subIdx) => {
          chunks.push({
            id: `chunk_${chunks.length + 1}`,
            index: chunks.length,
            strategy: 'semantic-window',
            sectionTitle: `${currentSectionTitle} (Part ${subIdx + 1})`,
            charCount: sub.length,
            estimatedTokens: estimateTokens(sub),
            content: sub,
            metadata: {
              source: metadata.fileName,
              section: currentSectionTitle,
              part: subIdx + 1,
              tokens: estimateTokens(sub)
            }
          });
        });
      } else {
        chunks.push({
          id: `chunk_${chunks.length + 1}`,
          index: chunks.length,
          strategy: 'semantic',
          sectionTitle: currentSectionTitle,
          charCount: trimmed.length,
          estimatedTokens: tokens,
          content: trimmed,
          metadata: {
            source: metadata.fileName,
            section: currentSectionTitle,
            tokens
          }
        });
      }
    });

    return chunks;
  }

  // Strategy: 'tokens' (Fixed Sliding Window)
  const plainText = cleanedData.cleanText;
  const tokenWindows = splitByTokenWindow(plainText, targetTokenSize, overlapRatio);

  tokenWindows.forEach((winText, idx) => {
    const tokens = estimateTokens(winText);
    chunks.push({
      id: `chunk_${idx + 1}`,
      index: idx,
      strategy: 'token-window',
      sectionTitle: `Window ${idx + 1}`,
      charCount: winText.length,
      estimatedTokens: tokens,
      content: winText,
      metadata: {
        source: metadata.fileName,
        chunk_size: targetTokenSize,
        tokens
      }
    });
  });

  return chunks;
}

/**
 * Sliding token window with character boundary approximation.
 */
function splitByTokenWindow(text, targetTokens = 500, overlapRatio = 0.1) {
  const targetChars = targetTokens * 4;
  const overlapChars = Math.floor(targetChars * overlapRatio);
  const words = text.split(/\s+/);
  const result = [];

  let currentWords = [];
  let currentLen = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);
    currentLen += word.length + 1;

    if (currentLen >= targetChars && i < words.length - 1) {
      result.push(currentWords.join(' '));

      // Calculate overlap word count
      const overlapWords = [];
      let overlapCount = 0;
      for (let j = currentWords.length - 1; j >= 0; j--) {
        overlapWords.unshift(currentWords[j]);
        overlapCount += currentWords[j].length + 1;
        if (overlapCount >= overlapChars) break;
      }

      currentWords = [...overlapWords];
      currentLen = overlapCount;
    }
  }

  if (currentWords.length > 0) {
    result.push(currentWords.join(' '));
  }

  return result;
}
