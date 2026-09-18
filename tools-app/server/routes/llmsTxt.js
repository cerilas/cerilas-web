import { Router } from 'express';
import dns from 'dns';
import { promisify } from 'util';
import pool from '../db.js';

const router = Router();
const dnsLookup = promisify(dns.lookup);

// SSRF prevention: private and loopback IP ranges
const PRIVATE_IP_REGEX = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|0\.|::1|fe80:|fc00:|fd00:)/i;

/**
 * Validates whether a URL is safe to fetch (SSRF check)
 */
function isSafeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Unsupported protocol (only http and https are allowed)' };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.arpa')
    ) {
      return { safe: false, reason: 'Restricted or internal domain' };
    }
    if (PRIVATE_IP_REGEX.test(hostname)) {
      return { safe: false, reason: 'Private or loopback IP address' };
    }
    return { safe: true, parsed };
  } catch {
    return { safe: false, reason: 'Malformed URL format' };
  }
}

/**
 * Resolves DNS and ensures destination IP is not private
 */
async function resolveAndValidateDns(hostname) {
  try {
    const lookupResult = await dnsLookup(hostname);
    if (lookupResult && lookupResult.address && PRIVATE_IP_REGEX.test(lookupResult.address)) {
      return { safe: false, reason: 'Domain resolves to a private or internal IP address' };
    }
    return { safe: true, ip: lookupResult?.address };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { safe: false, reason: 'Domain does not exist in DNS (NXDOMAIN)' };
    }
    return { safe: false, reason: `DNS lookup failed (${err.code || err.message})` };
  }
}

/**
 * SSRF-Safe HTTP Fetcher with redirect checks and streaming byte limit
 */
async function safeFetch(initialUrl, options = {}) {
  const {
    maxRedirects = 5,
    maxBytes = 3 * 1024 * 1024,
    timeoutMs = 8000,
    method = 'GET',
    customHeaders = {}
  } = options;

  let currentUrl = initialUrl;
  let redirectCount = 0;
  const redirectChain = [];

  while (redirectCount <= maxRedirects) {
    const validation = isSafeUrl(currentUrl);
    if (!validation.safe) {
      throw new Error(`SSRF Block: ${validation.reason}`);
    }

    const dnsCheck = await resolveAndValidateDns(validation.parsed.hostname);
    if (!dnsCheck.safe) {
      throw new Error(`SSRF Block: ${dnsCheck.reason}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (compatible; CerilasLLMsTxtAuditor/1.0; +https://tools.cerilas.com/tool/llms-txt)',
      'Accept': 'text/markdown,text/plain,text/html,application/xml,text/xml,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      ...customHeaders
    };

    let response;
    try {
      response = await fetch(currentUrl, {
        method,
        headers,
        signal: controller.signal,
        redirect: 'manual'
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw fetchErr;
    }

    clearTimeout(timeoutId);

    redirectChain.push({
      url: currentUrl,
      status: response.status,
      statusText: response.statusText
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) break;
      const nextUrl = new URL(location, currentUrl).toString();
      currentUrl = nextUrl;
      redirectCount++;
      continue;
    }

    // If method was HEAD, return headers only
    if (method === 'HEAD') {
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: '',
        finalUrl: currentUrl,
        redirectChain,
        byteLength: 0
      };
    }

    // Read body with limit
    const reader = response.body.getReader();
    const chunks = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedBytes += value.length;
      if (receivedBytes > maxBytes) {
        await reader.cancel();
        break;
      }
    }

    const totalBuffer = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const text = new TextDecoder('utf-8').decode(totalBuffer);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
      finalUrl: currentUrl,
      redirectChain,
      byteLength: receivedBytes
    };
  }

  throw new Error(`Exceeded maximum redirect limit of ${maxRedirects}`);
}

/**
 * Extracts meta title, description, and h1 from HTML
 */
function extractHtmlMetadata(html, url) {
  let title = '';
  let description = '';
  let h1 = '';

  if (html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    const metaDesc = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                     html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i) ||
                     html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (metaDesc && metaDesc[1]) {
      description = metaDesc[1].trim();
    }

    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      h1 = h1Match[1].trim();
    }
  }

  // Fallback title from path
  if (!title) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      title = parts.length > 0
        ? parts[parts.length - 1].replace(/[-_]/g, ' ').replace(/\.[a-z0-9]+$/i, '')
        : u.hostname;
      title = title.charAt(0).toUpperCase() + title.slice(1);
    } catch {
      title = url;
    }
  }

  // Clean description of common boilerplate
  let cleanDesc = (description || h1 || '').replace(/\s+/g, ' ');
  cleanDesc = cleanDesc.replace(/^(home|welcome to|read about|learn more about)\s+/i, '');
  if (cleanDesc.length > 180) {
    cleanDesc = cleanDesc.substring(0, 177).trim() + '...';
  }

  return { title, description: cleanDesc, h1 };
}

/**
 * Classifies a URL path into an llms.txt v2 section
 */
function classifySection(url, title = '') {
  let pathname = '';
  try {
    pathname = new URL(url).pathname.toLowerCase();
  } catch {
    pathname = url.toLowerCase();
  }

  const combined = `${pathname} ${title.toLowerCase()}`;

  if (pathname === '/' || pathname === '') return 'About';
  if (/(\/api|\/developer|\/developers|\/sdk|\/endpoints|\/reference)/.test(pathname)) return 'API';
  if (/(\/doc|\/docs|\/documentation|\/help|\/faq|\/knowledge-base)/.test(pathname)) return 'Documentation';
  if (/(\/guide|\/guides|\/tutorial|\/tutorials|\/how-to|\/learn)/.test(pathname)) return 'Guides';
  if (/(\/product|\/products|\/feature|\/features|\/tool|\/tools|\/app|\/apps|\/pricing|\/plans)/.test(pathname)) return 'Products';
  if (/(\/service|\/services|\/solution|\/solutions|\/consulting)/.test(pathname)) return 'Services';
  if (/(\/about|\/company|\/team|\/story|\/mission|\/careers|\/jobs)/.test(pathname)) return 'About';
  if (/(\/blog|\/article|\/articles|\/post|\/posts|\/news|\/updates)/.test(pathname)) return 'Blog';
  if (/(\/resource|\/resources|\/whitepaper|\/case-studies|\/downloads)/.test(pathname)) return 'Resources';
  if (/(\/contact|\/support|\/feedback|\/get-in-touch)/.test(pathname)) return 'Contact';
  if (/(\/privacy|\/terms|\/legal|\/security|\/compliance|\/cookie)/.test(pathname)) return 'Policies';

  return 'Optional';
}

/**
 * Normalizes and extracts Markdown links from llms.txt content
 */
function parseMarkdownLinks(content) {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)(?::\s*([^\n\r]+))?/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      title: match[1].trim(),
      url: match[2].trim(),
      description: match[3] ? match[3].trim() : '',
      raw: match[0]
    });
  }

  return links;
}

/**
 * Parses full llms.txt into structured tree
 */
function parseLlmsTxtStructure(content) {
  const lines = content.split(/\r?\n/);
  let title = '';
  let summary = '';
  let info = '';
  const sections = [];

  let currentSection = null;
  let inSummary = false;
  let foundH1 = false;
  let preSectionLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // H1 detection
    if (line.startsWith('# ') && !foundH1) {
      title = line.substring(2).trim();
      foundH1 = true;
      inSummary = true;
      continue;
    }

    // Blockquote summary detection right after H1
    if (inSummary && line.startsWith('>')) {
      summary += (summary ? ' ' : '') + line.replace(/^>\s*/, '').trim();
      continue;
    } else if (inSummary && foundH1 && !line.startsWith('## ')) {
      inSummary = false;
    }

    // H2 section detection
    if (line.startsWith('## ')) {
      inSummary = false;
      const sectionName = line.substring(3).trim();
      currentSection = {
        name: sectionName,
        resources: []
      };
      sections.push(currentSection);
      continue;
    }

    // Markdown link item
    if (line.startsWith('- [') || line.startsWith('* [')) {
      const match = line.match(/^[-*]\s*\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)(?::\s*(.*))?$/);
      if (match) {
        const item = {
          title: match[1].trim(),
          url: match[2].trim(),
          description: match[3] ? match[3].trim() : ''
        };
        if (currentSection) {
          currentSection.resources.push(item);
        } else {
          // If links appear before H2, put under general
          if (!currentSection) {
            currentSection = { name: 'Resources', resources: [] };
            sections.push(currentSection);
          }
          currentSection.resources.push(item);
        }
        continue;
      }
    }

    // General descriptive content before first H2
    if (!currentSection) {
      preSectionLines.push(line);
    }
  }

  info = preSectionLines.join('\n');

  return { title, summary, info, sections };
}

/**
 * -------------------------------------------------------------
 * ENDPOINT 1: POST /api/tools/llms-txt/generate
 * Analyzes site, parses sitemap, extracts high-value pages, classifies
 * -------------------------------------------------------------
 */
router.post('/generate', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'A valid website URL is required.' });
  }

  let rawUrl = url.trim();
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = 'https://' + rawUrl;
  }

  const validation = isSafeUrl(rawUrl);
  if (!validation.safe) {
    return res.status(400).json({ success: false, error: `Invalid or restricted URL: ${validation.reason}` });
  }

  const { hostname, origin } = validation.parsed;

  // Track DB usage
  try {
    await pool.query(`
      UPDATE cerilas_tools 
      SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() 
      WHERE slug = 'llms-txt'
    `);
  } catch (err) {
    console.error('DB tracking error:', err.message);
  }

  try {
    // 1. Fetch homepage
    let homepageMeta = { title: hostname, description: '', h1: '' };
    let discoveredUrls = new Set();
    discoveredUrls.add(origin + '/');

    try {
      const homeResp = await safeFetch(rawUrl, { maxBytes: 3 * 1024 * 1024, timeoutMs: 8000 });
      homepageMeta = extractHtmlMetadata(homeResp.body, homeResp.finalUrl);

      // Extract navigation links from homepage HTML
      const linkMatches = homeResp.body.matchAll(/href=["'](\/[a-z0-9-_/]+|https?:\/\/[^"'>\s]+)["']/gi);
      for (const m of linkMatches) {
        try {
          const resolved = new URL(m[1], homeResp.finalUrl).toString();
          const p = new URL(resolved);
          if (p.hostname === hostname && !p.pathname.includes('#') && !p.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip|css|js)$/i)) {
            discoveredUrls.add(p.origin + p.pathname);
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Homepage fetch warning:', err.message);
    }

    // 2. Fetch Sitemap
    const sitemapCandidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
    for (const sUrl of sitemapCandidates) {
      try {
        const sResp = await safeFetch(sUrl, { maxBytes: 5 * 1024 * 1024, timeoutMs: 6000 });
        if (sResp.status === 200) {
          const locMatches = sResp.body.matchAll(/<loc>([^<]+)<\/loc>/gi);
          let count = 0;
          for (const lm of locMatches) {
            if (count >= 100) break; // Limit sitemap scanning to 100 for fast response
            const u = lm[1].trim();
            try {
              const p = new URL(u);
              if (p.hostname === hostname && !p.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip|xml)$/i)) {
                discoveredUrls.add(p.origin + p.pathname);
                count++;
              }
            } catch {}
          }
          if (count > 0) break;
        }
      } catch {}
    }

    // 3. Prioritize up to 30 high-value pages
    const rawList = Array.from(discoveredUrls);
    const filterKeywords = ['page/', 'tag/', 'category/', 'author/', 'wp-content', 'wp-json', 'cart', 'checkout', 'login', 'signup', 'search'];
    const filteredList = rawList.filter(u => {
      const lower = u.toLowerCase();
      return !filterKeywords.some(kw => lower.includes(kw));
    });

    // Sort to prioritize root, about, docs, products, api
    filteredList.sort((a, b) => {
      const score = (str) => {
        const lower = str.toLowerCase();
        if (lower === origin + '/' || lower === origin) return 100;
        if (lower.includes('/doc') || lower.includes('/api')) return 90;
        if (lower.includes('/product') || lower.includes('/pricing')) return 85;
        if (lower.includes('/guide') || lower.includes('/tutorial')) return 80;
        if (lower.includes('/about')) return 75;
        return 50 - str.split('/').length;
      };
      return score(b) - score(a);
    });

    const candidateUrls = filteredList.slice(0, 25);

    // 4. Fetch metadata for priority pages in parallel (concurrency 5)
    const resources = [];
    const siteTitle = homepageMeta.title.replace(/\s*[-–|].*$/, '').trim() || hostname;
    const siteSummary = homepageMeta.description || `${siteTitle} documentation and resources guide for LLM agents.`;

    // Root entry
    resources.push({
      id: 'root-home',
      title: 'Homepage',
      url: origin + '/',
      description: siteSummary,
      section: 'About',
      selected: true
    });

    // Parallel fetch for remaining
    const fetchPromises = candidateUrls
      .filter(u => u !== origin + '/' && u !== origin)
      .slice(0, 18)
      .map(async (pageUrl) => {
        try {
          const resp = await safeFetch(pageUrl, { maxBytes: 1024 * 1024, timeoutMs: 4500 });
          if (resp.status === 200) {
            const meta = extractHtmlMetadata(resp.body, pageUrl);
            const section = classifySection(pageUrl, meta.title);
            let displayTitle = meta.title.replace(/\s*[-–|].*$/, '').trim();
            if (!displayTitle || displayTitle.length < 3) displayTitle = meta.h1 || 'Page';

            return {
              id: Buffer.from(pageUrl).toString('base64').slice(0, 12),
              title: displayTitle,
              url: pageUrl,
              description: meta.description || `${displayTitle} information on ${siteTitle}.`,
              section,
              selected: true
            };
          }
        } catch {}
        return null;
      });

    const fetchedResources = (await Promise.all(fetchPromises)).filter(Boolean);
    resources.push(...fetchedResources);

    // Group into sections for initial output
    const sectionMap = new Map();
    for (const res of resources) {
      if (!sectionMap.has(res.section)) {
        sectionMap.set(res.section, []);
      }
      sectionMap.get(res.section).push(res);
    }

    // Build initial Markdown string
    let initialMarkdown = `# ${siteTitle}\n\n> ${siteSummary}\n\nThis file provides a curated index of key pages, developer documentation, and resources on ${siteTitle}.\n\n`;

    const sectionOrder = ['About', 'Products', 'Services', 'Documentation', 'API', 'Guides', 'Resources', 'Blog', 'Policies', 'Contact', 'Optional'];
    for (const sec of sectionOrder) {
      if (sectionMap.has(sec) && sectionMap.get(sec).length > 0) {
        initialMarkdown += `## ${sec}\n\n`;
        for (const item of sectionMap.get(sec)) {
          initialMarkdown += `- [${item.title}](${item.url}): ${item.description}\n`;
        }
        initialMarkdown += '\n';
      }
    }

    return res.json({
      success: true,
      data: {
        siteTitle,
        siteSummary,
        domain: hostname,
        origin,
        totalDiscovered: rawList.length,
        analyzedCount: resources.length,
        resources,
        initialMarkdown: initialMarkdown.trim()
      }
    });

  } catch (error) {
    console.error('LLMs.txt generator error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to analyze website: ${error.message || 'Unknown network error'}`
    });
  }
});

/**
 * -------------------------------------------------------------
 * ENDPOINT 2: POST /api/tools/llms-txt/check
 * Inspects root & path-level llms.txt, link health, rel=describedby, sitemap
 * -------------------------------------------------------------
 */
router.post('/check', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'A valid website URL is required.' });
  }

  let rawUrl = url.trim();
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = 'https://' + rawUrl;
  }

  const validation = isSafeUrl(rawUrl);
  if (!validation.safe) {
    return res.status(400).json({ success: false, error: `Invalid or restricted URL: ${validation.reason}` });
  }

  const { hostname, origin, pathname } = validation.parsed;

  try {
    // 1. Check Root llms.txt
    const rootLlmsUrl = `${origin}/llms.txt`;
    let rootReport = null;

    try {
      const startTime = Date.now();
      const resp = await safeFetch(rootLlmsUrl, { maxBytes: 1024 * 1024, timeoutMs: 8000 });
      const responseTimeMs = Date.now() - startTime;

      const hasBom = resp.body.charCodeAt(0) === 0xFEFF;
      const cleanContent = hasBom ? resp.body.slice(1) : resp.body;
      const links = parseMarkdownLinks(cleanContent);
      const structure = parseLlmsTxtStructure(cleanContent);

      rootReport = {
        url: rootLlmsUrl,
        status: resp.status === 200 ? 'found' : 'not_found',
        httpCode: resp.status,
        contentType: resp.headers['content-type'] || 'text/plain',
        sizeBytes: resp.byteLength,
        responseTimeMs,
        hasBom,
        content: cleanContent,
        linksCount: links.length,
        sectionsCount: structure.sections.length,
        structure,
        extractedLinks: links
      };
    } catch (err) {
      rootReport = {
        url: rootLlmsUrl,
        status: 'unreachable',
        httpCode: null,
        error: err.message,
        content: '',
        extractedLinks: []
      };
    }

    // 2. Path-level check if applicable (e.g. /docs/llms.txt)
    let pathReport = null;
    const cleanPath = pathname.replace(/\/llms\.txt$/i, '').replace(/\/+$/, '');
    if (cleanPath && cleanPath !== '') {
      const pathLlmsUrl = `${origin}${cleanPath}/llms.txt`;
      try {
        const resp = await safeFetch(pathLlmsUrl, { maxBytes: 1024 * 1024, timeoutMs: 6000 });
        if (resp.status === 200) {
          const links = parseMarkdownLinks(resp.body);
          const structure = parseLlmsTxtStructure(resp.body);
          pathReport = {
            url: pathLlmsUrl,
            status: 'found',
            httpCode: 200,
            sizeBytes: resp.byteLength,
            linksCount: links.length,
            sectionsCount: structure.sections.length,
            structure,
            content: resp.body
          };
        }
      } catch {}
    }

    // 3. Check Homepage for rel="describedby" discovery link
    let describedByDetected = false;
    let describedByHref = null;
    try {
      const homeResp = await safeFetch(origin + '/', { maxBytes: 1024 * 1024, timeoutMs: 5000 });
      const descMatch = homeResp.body.match(/<link\s+[^>]*rel=["']describedby["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                        homeResp.body.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']describedby["'][^>]*>/i);
      if (descMatch) {
        describedByDetected = true;
        describedByHref = descMatch[1];
      }
      const linkHeader = homeResp.headers['link'] || '';
      if (linkHeader.includes('rel="describedby"') || linkHeader.includes('rel=describedby')) {
        describedByDetected = true;
      }
    } catch {}

    // 4. Test Links Health inside llms.txt (sample first 20 links)
    const activeContent = rootReport.content || pathReport?.content || '';
    const allLinks = parseMarkdownLinks(activeContent);
    const auditedLinks = [];

    const linkAuditSample = allLinks.slice(0, 15);
    const linkPromises = linkAuditSample.map(async (link) => {
      const t0 = Date.now();
      try {
        const resp = await safeFetch(link.url, { method: 'HEAD', timeoutMs: 4000 });
        const time = Date.now() - t0;
        let status = 'valid';
        if (resp.status >= 200 && resp.status < 300) status = 'valid';
        else if ([301, 302, 307, 308].includes(resp.status)) status = 'redirect';
        else if (resp.status === 404) status = 'not_found';
        else if (resp.status === 403 || resp.status === 401) status = 'forbidden';
        else status = 'warning';

        // Check for markdown alternative header in link response
        const altHeader = resp.headers['link'] || '';
        const hasMarkdownAlt = altHeader.includes('type="text/markdown"') || altHeader.includes('type=text/markdown');

        return {
          ...link,
          httpCode: resp.status,
          status,
          responseTimeMs: time,
          hasMarkdownAlt
        };
      } catch (err) {
        return {
          ...link,
          httpCode: null,
          status: 'error',
          responseTimeMs: Date.now() - t0,
          error: err.message
        };
      }
    });

    const testedLinks = await Promise.all(linkPromises);
    auditedLinks.push(...testedLinks);

    const validLinksCount = auditedLinks.filter(l => l.status === 'valid').length;
    const redirectLinksCount = auditedLinks.filter(l => l.status === 'redirect').length;
    const brokenLinksCount = auditedLinks.filter(l => l.status === 'not_found' || l.status === 'error').length;
    const markdownAltsCount = auditedLinks.filter(l => l.hasMarkdownAlt).length;

    // 5. Compare with Sitemap & Robots.txt
    let sitemapUrlCount = null;
    try {
      const sResp = await safeFetch(`${origin}/sitemap.xml`, { maxBytes: 1024 * 1024, timeoutMs: 4000 });
      if (sResp.status === 200) {
        const matches = sResp.body.match(/<loc>/g);
        sitemapUrlCount = matches ? matches.length : null;
      }
    } catch {}

    const isAppropriatelyCurated = allLinks.length > 0 && (!sitemapUrlCount || allLinks.length <= Math.max(50, sitemapUrlCount * 0.3));

    return res.json({
      success: true,
      data: {
        domain: hostname,
        origin,
        checkedUrl: rawUrl,
        rootReport,
        pathReport,
        discoverability: {
          describedByDetected,
          describedByHref,
          markdownAltsCount,
          testedCount: auditedLinks.length
        },
        linksSummary: {
          totalFound: allLinks.length,
          testedCount: auditedLinks.length,
          validCount: validLinksCount,
          redirectCount: redirectLinksCount,
          brokenCount: brokenLinksCount,
          auditedLinks
        },
        curationComparison: {
          sitemapUrlsEstimated: sitemapUrlCount,
          llmsTxtResourcesCount: allLinks.length,
          isAppropriatelyCurated,
          feedback: isAppropriatelyCurated
            ? 'llms.txt appears appropriately curated for AI agent discovery.'
            : sitemapUrlCount && allLinks.length > sitemapUrlCount * 0.7
              ? 'Warning: llms.txt contains nearly all sitemap URLs. Consider curating to key documentation and resources.'
              : 'Sufficiently concise.'
        }
      }
    });

  } catch (error) {
    console.error('LLMs.txt checker error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to check llms.txt: ${error.message || 'Unknown network error'}`
    });
  }
});

/**
 * -------------------------------------------------------------
 * ENDPOINT 3: POST /api/tools/llms-txt/validate
 * Strict RFC v2 parser, 3-level validations, Quality Score, Auto-Fix
 * -------------------------------------------------------------
 */
router.post('/validate', async (req, res) => {
  const { content, url } = req.body;
  let text = content || '';

  // If URL provided without content, fetch it
  if (url && !text) {
    let fetchUrl = url.trim();
    if (!/^https?:\/\//i.test(fetchUrl)) fetchUrl = 'https://' + fetchUrl;
    const v = isSafeUrl(fetchUrl);
    if (!v.safe) return res.status(400).json({ success: false, error: `SSRF Block: ${v.reason}` });

    try {
      const resp = await safeFetch(fetchUrl, { maxBytes: 1024 * 1024, timeoutMs: 6000 });
      text = resp.body;
    } catch (err) {
      return res.status(400).json({ success: false, error: `Failed to fetch URL: ${err.message}` });
    }
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Content or a valid URL is required for validation.' });
  }

  const errors = [];
  const warnings = [];
  const recommendations = [];

  const lines = text.split(/\r?\n/);
  const links = parseMarkdownLinks(text);
  const structure = parseLlmsTxtStructure(text);

  // 1. Structure Check: H1 Title
  const h1Matches = text.match(/^#\s+[^\n\r]+/gm) || [];
  if (h1Matches.length === 0) {
    errors.push({
      rule: 'H1_REQUIRED',
      message: 'Missing required H1 project/site title (e.g. # Project Name). H1 is the primary required element.'
    });
  } else if (h1Matches.length > 1) {
    warnings.push({
      rule: 'MULTIPLE_H1',
      message: `Found ${h1Matches.length} H1 headings. The specification recommends exactly one primary H1.`
    });
  }

  // Check if H1 is the first content element
  let firstContentLine = lines.find(l => l.trim() && !l.startsWith('<!--'));
  if (firstContentLine && !firstContentLine.startsWith('# ')) {
    warnings.push({
      rule: 'H1_POSITION',
      message: 'H1 title should be the first content element in the document (before paragraphs or other text).'
    });
  }

  // 2. Summary Check (Blockquote immediately following H1)
  if (!structure.summary) {
    recommendations.push({
      rule: 'SUMMARY_RECOMMENDED',
      message: 'Add an optional blockquote summary immediately following the H1 title (e.g. > Concise project summary).'
    });
  }

  // 3. Section Check (H2 syntax)
  if (structure.sections.length === 0) {
    warnings.push({
      rule: 'NO_SECTIONS',
      message: 'No H2 resource sections found (e.g. ## Documentation, ## Products). Consider categorizing resources.'
    });
  }

  // Check for duplicate sections
  const sectionNames = new Set();
  for (const sec of structure.sections) {
    const lower = sec.name.toLowerCase();
    if (sectionNames.has(lower)) {
      warnings.push({
        rule: 'DUPLICATE_SECTION',
        message: `Duplicate section name detected: "## ${sec.name}".`
      });
    }
    sectionNames.add(lower);

    if (sec.resources.length === 0) {
      warnings.push({
        rule: 'EMPTY_SECTION',
        message: `Section "## ${sec.name}" contains no resources.`
      });
    }

    if (sec.resources.length > 50) {
      warnings.push({
        rule: 'LARGE_SECTION',
        message: `Section "## ${sec.name}" contains ${sec.resources.length} links. Consider keeping sections curated under 30 resources.`
      });
    }
  }

  // 4. Link Checks
  if (links.length === 0) {
    warnings.push({
      rule: 'NO_LINKS',
      message: 'No Markdown resource links detected. Resources should follow: - [Title](URL): Description'
    });
  }

  const seenUrls = new Set();
  let missingDescCount = 0;
  let boilerplateDescCount = 0;

  for (const l of links) {
    // Relative URL check
    if (!l.url.startsWith('http://') && !l.url.startsWith('https://')) {
      errors.push({
        rule: 'RELATIVE_URL',
        message: `Relative URL detected: ${l.url}. llms.txt requires absolute canonical URLs.`
      });
    }

    // Duplicate URL check
    if (seenUrls.has(l.url)) {
      warnings.push({
        rule: 'DUPLICATE_URL',
        message: `Duplicate URL detected: ${l.url}`
      });
    }
    seenUrls.add(l.url);

    // Description quality check
    if (!l.description) {
      missingDescCount++;
    } else {
      const dLower = l.description.toLowerCase().trim();
      if (['click here', 'read more', 'link', 'page', 'untitled', 'here'].includes(dLower)) {
        boilerplateDescCount++;
      }
    }
  }

  if (missingDescCount > 0) {
    recommendations.push({
      rule: 'MISSING_DESCRIPTIONS',
      message: `${missingDescCount} resource(s) are missing descriptions. Descriptions provide valuable context for LLMs.`
    });
  }

  if (boilerplateDescCount > 0) {
    warnings.push({
      rule: 'BOILERPLATE_DESCRIPTION',
      message: `${boilerplateDescCount} resource(s) use generic placeholder descriptions (e.g. "click here", "read more").`
    });
  }

  if (links.length > 500) {
    warnings.push({
      rule: 'OVERLY_LARGE',
      message: `File contains ${links.length} links. llms.txt is intended to be a curated guide, not a sitemap replacement.`
    });
  }

  // 5. Calculate Quality Score (0 to 100)
  let score = 100;
  score -= errors.length * 20;
  score -= warnings.length * 6;
  score -= recommendations.length * 2;
  score = Math.min(100, Math.max(10, Math.round(score)));

  let statusLabel = 'Valid with recommendations';
  let statusColor = 'success';
  if (errors.length > 0) {
    statusLabel = 'Invalid structure';
    statusColor = 'danger';
  } else if (warnings.length > 2) {
    statusLabel = 'Needs improvement';
    statusColor = 'warning';
  }

  // 6. Generate Auto-Fix
  let fixedContent = text;
  // If no H1, prepend one
  if (errors.some(e => e.rule === 'H1_REQUIRED')) {
    fixedContent = '# Website Name\n\n> Summary of site resources for LLM agents.\n\n' + fixedContent;
  }
  // Convert bare links: http://... to - [Title](http://...)
  fixedContent = fixedContent.replace(/^(https?:\/\/[^\s\n\r]+)$/gm, (m) => {
    try {
      const u = new URL(m);
      const name = u.pathname.split('/').filter(Boolean).pop() || u.hostname;
      return `- [${name}](${m}): Resource description.`;
    } catch {
      return `- [Resource](${m})`;
    }
  });

  return res.json({
    success: true,
    data: {
      score,
      statusLabel,
      statusColor,
      stats: {
        errorsCount: errors.length,
        warningsCount: warnings.length,
        recommendationsCount: recommendations.length,
        linksCount: links.length,
        sectionsCount: structure.sections.length
      },
      errors,
      warnings,
      recommendations,
      structure,
      fixedContent
    }
  });
});

export default router;
