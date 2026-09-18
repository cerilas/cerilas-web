/**
 * Enterprise URL & Reference Extractor for AI-Generated Texts
 */

// Regex patterns
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
const HTML_LINK_REGEX = /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
const BARE_URL_REGEX = /https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,8}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*/gi;
const DOI_REGEX = /\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/g;

/**
 * Clean URL string (remove trailing punctuation like period, comma, closing parenthesis if mismatched)
 */
function cleanUrl(rawUrl) {
  let url = rawUrl.trim();
  // Strip trailing punctuation that often attaches to URLs in prose
  while (/[.,;:!?'"”’)]$/.test(url)) {
    if (url.endsWith(')') && url.includes('(')) {
      // Balanced parenthesis, leave it
      break;
    }
    url = url.slice(0, -1);
  }
  return url;
}

/**
 * Finds the sentence or surrounding context for a given position in text
 */
function extractContext(text, startIndex, length) {
  const windowRadius = 80;
  const start = Math.max(0, startIndex - windowRadius);
  const end = Math.min(text.length, startIndex + length + windowRadius);

  let snippet = text.slice(start, end).replace(/\s+/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

/**
 * Parses all URLs and citations from text
 */
export function extractLinksFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const extracted = [];
  const seenUrls = new Set();

  // 1. Extract Markdown Links [anchor](url)
  let mdMatch;
  while ((mdMatch = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
    const rawUrl = mdMatch[2];
    const anchor = mdMatch[1];
    const url = cleanUrl(rawUrl);

    try {
      new URL(url); // Check validity
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        extracted.push({
          id: `link_${extracted.length + 1}`,
          url,
          anchor: anchor.trim() || url,
          type: 'markdown',
          context: extractContext(text, mdMatch.index, mdMatch[0].length),
          rawMatch: mdMatch[0]
        });
      }
    } catch {
      // Invalid URL format
    }
  }

  // 2. Extract HTML Links <a href="...">
  let htmlMatch;
  while ((htmlMatch = HTML_LINK_REGEX.exec(text)) !== null) {
    const rawUrl = htmlMatch[1];
    const anchor = htmlMatch[2].replace(/<[^>]+>/g, '').trim();
    const url = cleanUrl(rawUrl);

    try {
      new URL(url);
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        extracted.push({
          id: `link_${extracted.length + 1}`,
          url,
          anchor: anchor || url,
          type: 'html',
          context: extractContext(text, htmlMatch.index, htmlMatch[0].length),
          rawMatch: htmlMatch[0]
        });
      }
    } catch {
      // Invalid URL format
    }
  }

  // 3. Extract Bare URLs https://...
  let bareMatch;
  while ((bareMatch = BARE_URL_REGEX.exec(text)) !== null) {
    const url = cleanUrl(bareMatch[0]);

    try {
      new URL(url);
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        extracted.push({
          id: `link_${extracted.length + 1}`,
          url,
          anchor: url,
          type: 'bare_url',
          context: extractContext(text, bareMatch.index, bareMatch[0].length),
          rawMatch: bareMatch[0]
        });
      }
    } catch {
      // Invalid URL format
    }
  }

  // 4. Extract DOIs (e.g., 10.1000/182) that aren't already full URLs
  let doiMatch;
  while ((doiMatch = DOI_REGEX.exec(text)) !== null) {
    const doi = doiMatch[1];
    const doiUrl = `https://doi.org/${doi}`;

    if (!seenUrls.has(doiUrl) && !seenUrls.has(doi)) {
      seenUrls.add(doiUrl);
      extracted.push({
        id: `link_${extracted.length + 1}`,
        url: doiUrl,
        anchor: `DOI: ${doi}`,
        type: 'doi_citation',
        context: extractContext(text, doiMatch.index, doiMatch[0].length),
        rawMatch: doiMatch[0]
      });
    }
  }

  return extracted;
}

/**
 * Sanitizes text by removing or converting broken/hallucinated links
 * @param {string} originalText
 * @param {Array} brokenUrls Array of URL strings flagged as hallucinated or dead
 * @param {'unlink' | 'strip'} mode 'unlink' keeps anchor text, 'strip' removes link entirely
 */
export function sanitizeText(originalText, brokenUrls, mode = 'unlink') {
  if (!originalText || !brokenUrls || brokenUrls.length === 0) {
    return originalText;
  }

  const urlSet = new Set(brokenUrls.map(u => u.toLowerCase()));
  let result = originalText;

  // 1. Replace markdown links [anchor](broken_url)
  result = result.replace(MARKDOWN_LINK_REGEX, (match, anchor, rawUrl) => {
    const cleaned = cleanUrl(rawUrl);
    if (urlSet.has(cleaned.toLowerCase()) || urlSet.has(rawUrl.toLowerCase())) {
      return mode === 'unlink' ? anchor : '';
    }
    return match;
  });

  // 2. Replace HTML links <a href="broken_url">anchor</a>
  result = result.replace(HTML_LINK_REGEX, (match, rawUrl, anchor) => {
    const cleaned = cleanUrl(rawUrl);
    if (urlSet.has(cleaned.toLowerCase()) || urlSet.has(rawUrl.toLowerCase())) {
      return mode === 'unlink' ? anchor : '';
    }
    return match;
  });

  // 3. Replace bare URLs
  result = result.replace(BARE_URL_REGEX, (match) => {
    const cleaned = cleanUrl(match);
    if (urlSet.has(cleaned.toLowerCase()) || urlSet.has(match.toLowerCase())) {
      return mode === 'unlink' ? `[Removed Hallucinated Link: ${cleaned}]` : '';
    }
    return match;
  });

  return result;
}

/**
 * Exports audit results into a formatted Markdown report
 */
export function exportMarkdownReport(results, stats, originalTextSnippet = '') {
  const timestamp = new Date().toUTCString();
  let md = `# AI Link Hallucination Audit Report\n\n`;
  md += `**Date:** ${timestamp}\n`;
  md += `**Audit Tool:** Cerilas AI Link Hallucination Checker (v2026)\n\n`;

  md += `## Summary Metrics\n\n`;
  md += `- **Total Links Analyzed:** ${stats.total}\n`;
  md += `- **Verified Alive (200 OK):** ${stats.alive}\n`;
  md += `- **Hallucinated / Dead Links:** ${stats.hallucinated}\n`;
  md += `- **Fabricated Domains (NXDOMAIN):** ${stats.nxdomain}\n`;
  md += `- **404 Not Found Paths:** ${stats.notFound}\n`;
  md += `- **Hallucination Rate:** ${stats.hallucinationRate}%\n\n`;

  md += `## Detailed Link Diagnostic Findings\n\n`;
  md += `| Status | Anchor / Label | URL | HTTP Code | Diagnostic |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  results.forEach(item => {
    const statusIcon = item.status === 'alive'
      ? '🟢 Alive'
      : item.status === 'nxdomain'
      ? '🔴 NXDOMAIN (Fake)'
      : item.status === 'not_found'
      ? '🔴 404 Dead Path'
      : item.status === 'soft_404_redirect'
      ? '🟡 Redirect to Home'
      : item.status === 'restricted'
      ? '⚪ Restricted'
      : '🟠 Unresolvable';

    const http = item.httpCode ? item.httpCode : 'N/A';
    const diag = (item.diagnostic || '').replace(/\|/g, '\\|');
    const label = (item.anchor || item.url).replace(/\|/g, '\\|');

    md += `| ${statusIcon} | ${label} | [${item.url}](${item.url}) | ${http} | ${diag} |\n`;
  });

  return md;
}

/**
 * Exports audit results to CSV format
 */
export function exportCsvReport(results) {
  const headers = ['URL', 'Anchor', 'Status', 'HTTP Code', 'Is Hallucination', 'Risk Level', 'Diagnostic'];
  const rows = results.map(r => [
    `"${(r.url || '').replace(/"/g, '""')}"`,
    `"${(r.anchor || '').replace(/"/g, '""')}"`,
    `"${r.status || ''}"`,
    r.httpCode || '',
    r.isHallucination ? 'YES' : 'NO',
    `"${r.riskLevel || ''}"`,
    `"${(r.diagnostic || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Realistic preloaded demo samples
 */
export const DEMO_SAMPLES = {
  blog: `Recent advancements in autonomous multi-agent architectures have accelerated rapidly in 2026. According to the foundational paper published on [arXiv AI Agents Benchmark](https://arxiv.org/abs/2499.99999), agentic workflows achieve up to 40% higher accuracy when paired with verifiable tool grounding.

For practitioners looking to deploy these models into production, open-source repositories such as [Official AutoGen GitHub](https://github.com/microsoft/autogen) provide state-of-the-art orchestration pipelines. However, developers should also review the recent security advisory on [Autonomous Agent Security Framework](https://github.com/microsoft/non-existent-security-audit-2026) to prevent prompt injection and unauthorized API execution.

Furthermore, leading researchers at the [Neural Inference Analytics Hub](https://neural-inference-analytics-hub.io/paper.pdf) argue that token-level self-consistency is crucial for long-horizon planning. Additional validation can be referenced under DOI citation 10.1038/fake.nature.2026.00192 and the official documentation at [Cerilas Platform](https://cerilas.com).`,

  tech: `# Production Setup for Enterprise LLM Pipeline

To configure the vector database connection, install the official client driver:
\`\`\`bash
pip install pgvector-fastsync-client
\`\`\`

Refer to the official database documentation at [PostgreSQL Vector Extension](https://github.com/pgvector/pgvector) for index optimization parameters. 

If you encounter connection timeouts, consult the troubleshooting guide at [Postgres Cloud Troubleshooting](https://cloud.google.com/sql/docs/postgres/troubleshooting-non-existent-cluster-path-999) and configure connection pooling via [Node.js PG Pool](https://node-postgres.com).

For academic citations on embeddings clustering, see [Semantic Retrieval Research 2026](https://ai-research-deep-learning-foundation.org/papers/2026-clustering.pdf).`
};
