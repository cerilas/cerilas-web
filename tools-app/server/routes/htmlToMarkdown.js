import express from 'express';
import dns from 'dns/promises';
import net from 'net';

const router = express.Router();

// ============================================================================
// SSRF & URL SAFETY UTILITIES
// ============================================================================
function isPrivateIP(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-local / AWS / Cloud Metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    // ::1 (Loopback)
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // fc00::/7 (Unique local)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // fe80::/10 (Link-local)
    if (lower.startsWith('fe80:')) return true;
    return false;
  }
  return false;
}

async function validateAndResolveUrl(inputUrl) {
  let parsed;
  try {
    let urlStr = inputUrl.trim();
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = 'https://' + urlStr;
    }
    parsed = new URL(urlStr);
  } catch {
    throw new Error('Invalid URL format provided.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS protocols are supported.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Local and internal domain requests are forbidden.');
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIP(addr.address)) {
        throw new Error(`Security Exception: ${hostname} resolves to restricted IP ${addr.address}`);
      }
    }
  } catch (err) {
    if (err.message.startsWith('Security Exception')) throw err;
    throw new Error(`Could not resolve domain: ${hostname}`);
  }

  return parsed.toString();
}

// ============================================================================
// HTML ENTITY DECODER
// ============================================================================
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&bull;/gi, '•')
    .replace(/&copy;/gi, '©')
    .replace(/&reg;/gi, '®')
    .replace(/&trade;/gi, '™')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ============================================================================
// HTML TO GFM MARKDOWN ENGINE
// ============================================================================
function convertHtmlToMarkdown(html, options = {}) {
  const {
    removeImages = false,
    removeLinks = false,
    extractArticleOnly = true,
    addFrontmatter = true,
    sourceUrl = ''
  } = options;

  let content = html;

  // 1. Extract metadata from raw HTML head before stripping
  let title = '';
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) title = decodeHtmlEntities(titleMatch[1].trim());

  let description = '';
  const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
                    content.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i) ||
                    content.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i);
  if (descMatch) description = decodeHtmlEntities(descMatch[1].trim());

  let author = '';
  const authorMatch = content.match(/<meta[^>]*name=["']author["'][^>]*content=["']([\s\S]*?)["']/i);
  if (authorMatch) author = decodeHtmlEntities(authorMatch[1].trim());

  // 2. Remove non-content tags & boilerplate tags completely
  content = content
    .replace(/<!--[\s\S]*?-->/g, '') // comments
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<canvas\b[^<]*(?:(?!<\/canvas>)<[^<]*)*<\/canvas>/gi, '');

  // Strip layout chrome if article extraction is requested
  if (extractArticleOnly) {
    // Try to locate <article>, <main>, or [role="main"]
    const articleMatch = content.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
                         content.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
                         content.match(/<div[^>]*role=["']main["'][^>]*>([\s\S]*?)<\/div>/i);
    if (articleMatch) {
      content = articleMatch[1];
    } else {
      // Remove header, nav, footer, aside if not isolating article
      content = content
        .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '');
    }
  }

  // 3. Pre-process Tables into GFM Tables
  content = content.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (tableHtml) => {
    try {
      const rows = [];
      const rowMatches = tableHtml.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi) || [];

      for (const rowHtml of rowMatches) {
        const cells = [];
        const cellMatches = rowHtml.match(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi) || [];
        for (const c of cellMatches) {
          const inner = c.replace(/^<(th|td)[^>]*>/i, '').replace(/<\/(th|td)>$/i, '');
          const text = decodeHtmlEntities(inner.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
          cells.push(text || ' ');
        }
        if (cells.length > 0) rows.push(cells);
      }

      if (rows.length === 0) return '';

      const maxCols = Math.max(...rows.map((r) => r.length));
      if (maxCols === 0) return '';

      const normalizedRows = rows.map((r) => {
        const copy = [...r];
        while (copy.length < maxCols) copy.push(' ');
        return copy;
      });

      let mdTable = '\n\n| ' + normalizedRows[0].join(' | ') + ' |\n';
      mdTable += '| ' + new Array(maxCols).fill('---').join(' | ') + ' |\n';

      for (let i = 1; i < normalizedRows.length; i++) {
        mdTable += '| ' + normalizedRows[i].join(' | ') + ' |\n';
      }
      return mdTable + '\n';
    } catch {
      return '';
    }
  });

  // 4. Pre-process Code Blocks `<pre><code>`
  content = content.replace(/<pre\b[^>]*><code\b(?:\s+class=["'](?:language-)?([a-z0-9_-]+)["'])?[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, lang, code) => {
    const cleanCode = decodeHtmlEntities(code.replace(/<[^>]+>/g, ''));
    return `\n\n\`\`\`${lang || ''}\n${cleanCode.trim()}\n\`\`\`\n\n`;
  });

  content = content.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (match, code) => {
    const cleanCode = decodeHtmlEntities(code.replace(/<[^>]+>/g, ''));
    return `\n\n\`\`\`\n${cleanCode.trim()}\n\`\`\`\n\n`;
  });

  // 5. Inline Code
  content = content.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (match, code) => {
    const clean = decodeHtmlEntities(code.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ');
    return ` \`${clean.trim()}\` `;
  });

  // 6. Headings
  content = content
    .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n\n# ${cleanText(text)}\n\n`)
    .replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n\n## ${cleanText(text)}\n\n`)
    .replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n\n### ${cleanText(text)}\n\n`)
    .replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, (_, text) => `\n\n#### ${cleanText(text)}\n\n`)
    .replace(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi, (_, text) => `\n\n##### ${cleanText(text)}\n\n`)
    .replace(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi, (_, text) => `\n\n###### ${cleanText(text)}\n\n`);

  // 7. Blockquotes
  content = content.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, quote) => {
    const lines = cleanText(quote).split('\n').filter(Boolean);
    return '\n\n' + lines.map((l) => `> ${l}`).join('\n') + '\n\n';
  });

  // 8. Lists & List Items
  content = content.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => {
    return `\n- ${cleanText(item)}`;
  });
  content = content
    .replace(/<\/ul>/gi, '\n\n')
    .replace(/<\/ol>/gi, '\n\n')
    .replace(/<ul\b[^>]*>/gi, '\n')
    .replace(/<ol\b[^>]*>/gi, '\n');

  // 9. Links
  if (removeLinks) {
    content = content.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, (_, anchor) => cleanText(anchor));
  } else {
    content = content.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const cleanHref = href.trim();
      const cleanAnchor = cleanText(text);
      if (!cleanAnchor || cleanHref.startsWith('javascript:') || cleanHref === '#') {
        return cleanAnchor || '';
      }
      return `[${cleanAnchor}](${cleanHref})`;
    });
  }

  // 10. Images
  if (removeImages) {
    content = content.replace(/<img\b[^>]*>/gi, '');
  } else {
    content = content.replace(/<img\b[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi, (_, alt, src) => {
      return `![${decodeHtmlEntities(alt.trim())}](${src.trim()})`;
    });
    content = content.replace(/<img\b[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, (_, src, alt) => {
      return `![${decodeHtmlEntities(alt.trim())}](${src.trim()})`;
    });
    content = content.replace(/<img\b[^>]*src=["']([^"']*)["'][^>]*>/gi, (_, src) => {
      return `![](${src.trim()})`;
    });
  }

  // 11. Text formatting: bold, italics, strike
  content = content
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => `**${cleanText(text)}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => `*${cleanText(text)}*`)
    .replace(/<(del|s|strike)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => `~~${cleanText(text)}~~`)
    .replace(/<hr\b[^>]*>/gi, '\n\n---\n\n')
    .replace(/<br\b[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<div\b[^>]*>/gi, '');

  // 12. Strip remaining HTML tags
  content = content.replace(/<[^>]+>/g, ' ');

  // 13. Decode entities and format whitespace
  let markdown = decodeHtmlEntities(content);

  // Normalize lines and whitespace
  markdown = markdown
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Metrics calculation
  const charCount = markdown.length;
  const wordCount = markdown ? markdown.split(/\s+/).filter(Boolean).length : 0;
  // Standard token estimation: ~4 chars per token
  const estimatedTokens = Math.max(1, Math.round(charCount / 4));

  // 14. Optional Frontmatter
  if (addFrontmatter) {
    const frontmatterLines = ['---'];
    if (title) frontmatterLines.push(`title: "${title.replace(/"/g, '\\"')}"`);
    if (sourceUrl) frontmatterLines.push(`source: "${sourceUrl}"`);
    if (author) frontmatterLines.push(`author: "${author.replace(/"/g, '\\"')}"`);
    frontmatterLines.push(`date_converted: "${new Date().toISOString().split('T')[0]}"`);
    frontmatterLines.push(`word_count: ${wordCount}`);
    frontmatterLines.push(`estimated_tokens: ${estimatedTokens}`);
    frontmatterLines.push('---\n\n');
    markdown = frontmatterLines.join('\n') + markdown;
  }

  return {
    markdown,
    metadata: {
      title,
      description,
      author,
      sourceUrl,
      wordCount,
      charCount,
      estimatedTokens
    }
  };
}

function cleanText(htmlSnippet) {
  if (!htmlSnippet) return '';
  return decodeHtmlEntities(htmlSnippet.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

// ============================================================================
// API ENDPOINT: POST /api/tools/html-to-markdown/convert
// ============================================================================
router.post('/convert', async (req, res) => {
  try {
    const { url, html, options = {} } = req.body;

    if (!url && !html) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a "url" to fetch or raw "html" to convert.'
      });
    }

    let rawHtml = '';
    let targetUrl = '';
    let originalSizeBytes = 0;

    if (url) {
      targetUrl = await validateAndResolveUrl(url);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 (compatible; CerilasMarkdownBot/1.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(400).json({
          success: false,
          error: `Target website returned HTTP ${response.status} ${response.statusText}`
        });
      }

      rawHtml = await response.text();
      originalSizeBytes = Buffer.byteLength(rawHtml, 'utf8');

      // Cap maximum payload at 5MB
      if (originalSizeBytes > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Webpage HTML exceeds maximum 5MB size limit.'
        });
      }
    } else {
      rawHtml = html;
      originalSizeBytes = Buffer.byteLength(rawHtml, 'utf8');
      if (originalSizeBytes > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Provided HTML exceeds maximum 5MB size limit.'
        });
      }
    }

    const { markdown, metadata } = convertHtmlToMarkdown(rawHtml, {
      ...options,
      sourceUrl: targetUrl
    });

    const markdownSizeBytes = Buffer.byteLength(markdown, 'utf8');
    const savingsPercent = originalSizeBytes > 0
      ? Math.max(0, Math.round(((originalSizeBytes - markdownSizeBytes) / originalSizeBytes) * 100))
      : 0;

    return res.json({
      success: true,
      data: {
        markdown,
        title: metadata.title || 'Untitled Webpage',
        description: metadata.description || '',
        originalSizeBytes,
        markdownSizeBytes,
        savingsPercent,
        wordCount: metadata.wordCount,
        estimatedTokens: metadata.estimatedTokens,
        sourceUrl: targetUrl,
        metadata
      }
    });
  } catch (err) {
    console.error('HTML to Markdown conversion error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to convert HTML to Markdown'
    });
  }
});

export default router;
