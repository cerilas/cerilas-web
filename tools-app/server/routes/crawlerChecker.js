import { Router } from 'express';
import dns from 'dns';
import { promisify } from 'util';
import pool from '../db.js';

const router = Router();
const dnsLookup = promisify(dns.lookup);

// List of private/reserved IP patterns for SSRF prevention
const PRIVATE_IP_REGEX = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|0\.|::1|fe80:|fc00:|fd00:)/i;

const CRAWLER_DEFINITIONS = [
  // 1. AI Search & Discovery
  {
    id: 'oai-searchbot',
    name: 'ChatGPT Search',
    userAgent: 'OAI-SearchBot',
    group: 'search',
    groupTitle: 'AI Search & Discovery',
    purpose: 'Allows OpenAI\'s search crawler to discover, browse, and index content for ChatGPT Search citations and answers.',
    isSearch: true,
    isTraining: false,
    simulatedUa: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)'
  },
  {
    id: 'claude-searchbot',
    name: 'Claude Search',
    userAgent: 'Claude-SearchBot',
    group: 'search',
    groupTitle: 'AI Search & Discovery',
    purpose: 'Allows Anthropic\'s search crawler to discover and index content for real-time Claude search experiences.',
    isSearch: true,
    isTraining: false,
    simulatedUa: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +https://anthropic.com/claudebot)'
  },
  {
    id: 'perplexitybot',
    name: 'Perplexity Search',
    userAgent: 'PerplexityBot',
    group: 'search',
    groupTitle: 'AI Search & Discovery',
    purpose: 'Allows Perplexity AI to crawl and index web pages for its conversational search engine and live citations.',
    isSearch: true,
    isTraining: false,
    simulatedUa: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'
  },

  // 2. User-Initiated AI Retrieval
  {
    id: 'claude-user',
    name: 'Claude User Requests',
    userAgent: 'Claude-User',
    group: 'user_retrieval',
    groupTitle: 'User-Initiated AI Retrieval',
    purpose: 'Used when an active Claude user enters a URL in chat and explicitly asks Claude to browse or summarize that specific page.',
    isSearch: false,
    isTraining: false,
    isUserTriggered: true,
    simulatedUa: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +https://anthropic.com)'
  },
  {
    id: 'perplexity-user',
    name: 'Perplexity User Requests',
    userAgent: 'Perplexity-User',
    group: 'user_retrieval',
    groupTitle: 'User-Initiated AI Retrieval',
    purpose: 'Used when a Perplexity user triggers on-demand live browsing of a link rather than general automated index crawling.',
    isSearch: false,
    isTraining: false,
    isUserTriggered: true,
    simulatedUa: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai)'
  },

  // 3. Model Training / AI Development
  {
    id: 'gptbot',
    name: 'OpenAI Training',
    userAgent: 'GPTBot',
    group: 'training',
    groupTitle: 'Model Training / AI Development',
    purpose: 'Used by OpenAI to train generative foundation models (GPT-4, GPT-5). Blocking GPTBot does NOT reduce ChatGPT Search visibility.',
    isSearch: false,
    isTraining: true,
    simulatedUa: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)'
  },
  {
    id: 'claudebot',
    name: 'Claude Training',
    userAgent: 'ClaudeBot',
    group: 'training',
    groupTitle: 'Model Training / AI Development',
    purpose: 'Used by Anthropic to train Claude AI models. Blocking ClaudeBot does NOT block Claude-SearchBot or Claude-User.',
    isSearch: false,
    isTraining: true,
    simulatedUa: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +https://anthropic.com/claudebot)'
  },
  {
    id: 'google-extended',
    name: 'Google / Gemini AI Access',
    userAgent: 'Google-Extended',
    group: 'training',
    groupTitle: 'Model Training / AI Development',
    purpose: 'A robots.txt product token for Gemini foundation training and vertex AI grounding. Blocking it does NOT remove your site from regular Google Search.',
    isSearch: false,
    isTraining: true,
    isProductToken: true
  },

  // 4. Other OpenAI Crawlers (expandable)
  {
    id: 'oai-adsbot',
    name: 'OpenAI AdsBot',
    userAgent: 'OAI-AdsBot',
    group: 'other_openai',
    groupTitle: 'Other OpenAI Crawlers',
    purpose: 'OpenAI advertising landing-page crawler. Excluded from primary AI visibility scores.',
    isSearch: false,
    isTraining: false,
    simulatedUa: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-AdsBot/1.0; +https://openai.com)'
  },

  // 5. Traditional Search (Comparison)
  {
    id: 'googlebot',
    name: 'Googlebot',
    userAgent: 'Googlebot',
    group: 'traditional',
    groupTitle: 'Traditional Search',
    purpose: 'Google\'s primary web crawler for standard Google Search indexing and ranking.',
    isSearch: true,
    isTraditional: true,
    isTraining: false,
    simulatedUa: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
  }
];

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
    return { safe: true, ip: lookupResult.address };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { safe: false, reason: 'Domain does not exist in DNS (NXDOMAIN)' };
    }
    return { safe: false, reason: `DNS lookup failed (${err.code || err.message})` };
  }
}

/**
 * SSRF-Safe HTTP Fetcher with max 5 redirects and size streaming limit
 */
async function safeFetch(initialUrl, options = {}) {
  const {
    maxRedirects = 5,
    maxBytes = 3 * 1024 * 1024,
    timeoutMs = 8000,
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
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (compatible; CerilasCrawlerAuditor/1.0; +https://tools.cerilas.com/tool/ai-crawler-checker)',
      'Accept': 'text/html,text/plain,application/xml,text/xml,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      ...customHeaders
    };

    let response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
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

    // Check for redirects (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        break; // No location header, treat as end
      }
      const nextUrl = new URL(location, currentUrl).toString();
      currentUrl = nextUrl;
      redirectCount++;
      continue;
    }

    // Read body up to maxBytes
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

    // Combine chunks
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
 * Standard RFC 9309 Compliant Robots.txt Parser
 */
function parseRobotsTxt(rawContent) {
  const lines = rawContent.split(/\r?\n/);
  const records = []; // Array of { userAgents: string[], rules: Array<{ type: 'allow'|'disallow', path: string, length: number }>, crawlDelay?: number }
  const sitemaps = [];

  let currentUserAgents = [];
  let currentRules = [];
  let currentCrawlDelay = null;

  function flushRecord() {
    if (currentUserAgents.length > 0) {
      records.push({
        userAgents: currentUserAgents.map(ua => ua.toLowerCase().trim()),
        rules: currentRules,
        crawlDelay: currentCrawlDelay
      });
    }
    currentUserAgents = [];
    currentRules = [];
    currentCrawlDelay = null;
  }

  for (let line of lines) {
    // Strip comments
    const hashIndex = line.indexOf('#');
    if (hashIndex !== -1) {
      line = line.substring(0, hashIndex);
    }
    line = line.trim();
    if (!line) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    if (directive === 'user-agent') {
      // If we previously had rules, start a new record
      if (currentRules.length > 0 || currentCrawlDelay !== null) {
        flushRecord();
      }
      currentUserAgents.push(value);
    } else if (directive === 'allow') {
      currentRules.push({
        type: 'allow',
        path: value,
        length: value.length,
        raw: line
      });
    } else if (directive === 'disallow') {
      currentRules.push({
        type: 'disallow',
        path: value,
        length: value.length,
        raw: line
      });
    } else if (directive === 'crawl-delay') {
      const delay = parseFloat(value);
      if (!isNaN(delay)) currentCrawlDelay = delay;
    } else if (directive === 'sitemap') {
      if (value) sitemaps.push(value);
    }
  }

  flushRecord();

  return { records, sitemaps };
}

/**
 * Matches a specific path against a rule pattern (supports prefix and wildcard *)
 */
function pathMatchesRule(rulePath, testPath) {
  if (!rulePath) return false;
  if (rulePath === '/') return true;

  // Exact or prefix matching
  if (!rulePath.includes('*') && !rulePath.endsWith('$')) {
    return testPath.startsWith(rulePath);
  }

  // Convert robots.txt pattern to regex
  let escaped = rulePath.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
  escaped = escaped.replace(/\\\*/g, '.*');
  if (escaped.endsWith('\\$')) {
    escaped = escaped.slice(0, -2) + '$';
  } else {
    escaped = '^' + escaped;
  }

  try {
    const regex = new RegExp(escaped);
    return regex.test(testPath);
  } catch {
    return testPath.startsWith(rulePath);
  }
}

/**
 * Evaluates crawler access for root path '/' based on RFC 9309
 */
function evaluateCrawlerAccess(crawlerUserAgent, robotsParsed, targetPath = '/') {
  if (!robotsParsed || !robotsParsed.records || robotsParsed.records.length === 0) {
    return {
      status: 'default_allowed',
      label: 'No specific restriction',
      badgeColor: 'neutral',
      matchedRule: null,
      matchedRecordUserAgent: null,
      crawlDelay: null,
      summary: 'No robots.txt rules were found. General crawling access is permitted.'
    };
  }

  const targetUaLower = crawlerUserAgent.toLowerCase().trim();

  // 1. Find specific matching record for this user-agent
  let matchedRecord = robotsParsed.records.find(rec =>
    rec.userAgents.some(ua => ua === targetUaLower || targetUaLower.includes(ua) || ua.includes(targetUaLower))
  );

  let isSpecific = true;

  // 2. If no specific record, fallback to wildcard '*'
  if (!matchedRecord) {
    matchedRecord = robotsParsed.records.find(rec => rec.userAgents.includes('*'));
    isSpecific = false;
  }

  // If still no matching record
  if (!matchedRecord || matchedRecord.rules.length === 0) {
    return {
      status: 'default_allowed',
      label: 'No specific restriction',
      badgeColor: 'neutral',
      matchedRule: null,
      matchedRecordUserAgent: null,
      crawlDelay: null,
      summary: isSpecific
        ? `No restriction found for ${crawlerUserAgent}. General access permitted.`
        : 'No specific rule was found. General robots.txt defaults apply.'
    };
  }

  // Find all matching rules for targetPath
  const applicableRules = matchedRecord.rules.filter(rule => pathMatchesRule(rule.path, targetPath));

  // Check if root '/' is allowed or blocked
  // Longest match rule: Sort descending by path length. If equal length, Allow takes precedence.
  applicableRules.sort((a, b) => {
    if (b.length !== a.length) {
      return b.length - a.length;
    }
    return a.type === 'allow' ? -1 : 1;
  });

  const bestMatch = applicableRules[0];

  // Also check if there are subpath disallows when root is allowed
  const hasSubpathBlocks = matchedRecord.rules.some(r => r.type === 'disallow' && r.path && r.path !== '/' && r.path !== '');

  if (!bestMatch) {
    // No rule matched root '/'
    if (hasSubpathBlocks) {
      return {
        status: 'partial',
        label: 'Partially Restricted',
        badgeColor: 'warning',
        matchedRule: `User-agent: ${matchedRecord.userAgents.join(', ')}\n(Specific subpaths blocked)`,
        matchedRecordUserAgent: matchedRecord.userAgents[0],
        crawlDelay: matchedRecord.crawlDelay,
        summary: 'Root page is accessible, but specific internal paths or directories are blocked.'
      };
    }
    return {
      status: isSpecific ? 'allowed' : 'default_allowed',
      label: isSpecific ? 'Allowed' : 'No specific restriction',
      badgeColor: isSpecific ? 'success' : 'neutral',
      matchedRule: null,
      matchedRecordUserAgent: matchedRecord.userAgents[0],
      crawlDelay: matchedRecord.crawlDelay,
      summary: isSpecific
        ? `robots.txt allows ${crawlerUserAgent} without restriction.`
        : 'No specific restriction found for this crawler in wildcard rules.'
    };
  }

  if (bestMatch.type === 'disallow') {
    // Disallow with empty path means "Allow everything"
    if (!bestMatch.path || bestMatch.path.trim() === '') {
      return {
        status: 'allowed',
        label: 'Allowed',
        badgeColor: 'success',
        matchedRule: `User-agent: ${matchedRecord.userAgents.join(', ')}\nDisallow:`,
        matchedRecordUserAgent: matchedRecord.userAgents[0],
        crawlDelay: matchedRecord.crawlDelay,
        summary: 'robots.txt explicitly permits full site access via empty Disallow directive.'
      };
    }

    return {
      status: 'blocked',
      label: 'Blocked',
      badgeColor: 'danger',
      matchedRule: `User-agent: ${matchedRecord.userAgents.join(', ')}\n${bestMatch.raw}`,
      matchedRecordUserAgent: matchedRecord.userAgents[0],
      crawlDelay: matchedRecord.crawlDelay,
      summary: `robots.txt prevents this crawler from accessing the website (Rule: ${bestMatch.raw}).`
    };
  } else {
    // Allow rule matched root
    if (hasSubpathBlocks) {
      return {
        status: 'partial',
        label: 'Partially Restricted',
        badgeColor: 'warning',
        matchedRule: `User-agent: ${matchedRecord.userAgents.join(', ')}\n${bestMatch.raw}`,
        matchedRecordUserAgent: matchedRecord.userAgents[0],
        crawlDelay: matchedRecord.crawlDelay,
        summary: 'Crawler can access the homepage, but specific internal subdirectories are disallowed.'
      };
    }

    return {
      status: 'allowed',
      label: 'Allowed',
      badgeColor: 'success',
      matchedRule: `User-agent: ${matchedRecord.userAgents.join(', ')}\n${bestMatch.raw}`,
      matchedRecordUserAgent: matchedRecord.userAgents[0],
      crawlDelay: matchedRecord.crawlDelay,
      summary: `robots.txt explicitly allows ${crawlerUserAgent} access to this website.`
    };
  }
}

/**
 * Checks Homepage Indexability (HTML meta tags and X-Robots-Tag header)
 */
function checkIndexability(html, headers) {
  const results = {
    isIndexable: true,
    metaRobots: null,
    xRobotsTag: null,
    canonicalUrl: null,
    directives: [],
    details: 'Page is fully indexable with no blocking directives detected.'
  };

  // 1. Check HTTP header X-Robots-Tag
  const xRobots = headers['x-robots-tag'];
  if (xRobots) {
    results.xRobotsTag = xRobots;
    const tokens = xRobots.toLowerCase().split(/,\s*/);
    results.directives.push(...tokens);
  }

  // 2. Check HTML <meta name="robots" content="...">
  if (html) {
    const metaRobotsMatch = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                            html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);
    if (metaRobotsMatch && metaRobotsMatch[1]) {
      results.metaRobots = metaRobotsMatch[1];
      const tokens = metaRobotsMatch[1].toLowerCase().split(/,\s*/);
      results.directives.push(...tokens);
    }

    // Canonical check
    const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                           html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
    if (canonicalMatch && canonicalMatch[1]) {
      results.canonicalUrl = canonicalMatch[1];
    }
  }

  // Deduplicate directives
  results.directives = [...new Set(results.directives)];

  // Evaluate blocking tokens
  const hasNoindex = results.directives.some(d => d.includes('noindex') || d === 'none');
  if (hasNoindex) {
    results.isIndexable = false;
    results.details = 'noindex detected. Your page may be crawlable by AI bots, but excluded from indexing, search experiences, and citations.';
  }

  return results;
}

/**
 * Detects Bot Protection or WAF headers / statuses
 */
function detectBotProtection(statusCode, headers) {
  const isBlockedStatus = [403, 429].includes(statusCode);
  const serverHeader = (headers['server'] || '').toLowerCase();
  const cfRay = headers['cf-ray'];
  const cfCache = headers['cf-cache-status'];
  const ddHeader = headers['x-datadome'];
  const akamaiHeader = headers['x-akamai-transformed'];

  const hasWafHeaders = !!(cfRay || cfCache || serverHeader.includes('cloudflare') || ddHeader || akamaiHeader);

  return {
    isProtected: isBlockedStatus || (statusCode !== 200 && hasWafHeaders),
    reason: isBlockedStatus
      ? `HTTP ${statusCode} returned. WAF, anti-bot protection, or rate limiting may be actively filtering server requests.`
      : hasWafHeaders ? 'WAF infrastructure (e.g. Cloudflare) detected on domain.' : null
  };
}

/**
 * Calculates AI Search Accessibility Score (0 to 100)
 */
function calculateAccessibilityScore({
  crawlerEvaluations,
  indexability,
  robotsFound,
  sitemapFound,
  httpStatus,
  hasLlmsTxt,
  hasCanonical
}) {
  let score = 0;

  // 1. AI Search Crawler Access (40%)
  // OAI-SearchBot, Claude-SearchBot, PerplexityBot
  const searchCrawlers = crawlerEvaluations.filter(c => c.isSearch && !c.isTraditional);
  if (searchCrawlers.length > 0) {
    let crawlerPoints = 0;
    const pointsPerCrawler = 40 / searchCrawlers.length;
    for (const c of searchCrawlers) {
      if (c.status === 'allowed' || c.status === 'default_allowed') {
        crawlerPoints += pointsPerCrawler;
      } else if (c.status === 'partial') {
        crawlerPoints += pointsPerCrawler * 0.5;
      }
    }
    score += crawlerPoints;
  }

  // 2. Homepage Indexability (20%)
  if (indexability.isIndexable) {
    score += 20;
  }

  // 3. robots.txt presence and valid status (15%)
  if (robotsFound) {
    score += 15;
  }

  // 4. Sitemap availability (10%)
  if (sitemapFound) {
    score += 10;
  }

  // 5. HTTP Accessibility (10%)
  if (httpStatus === 200) {
    score += 10;
  } else if ([301, 302, 307, 308].includes(httpStatus)) {
    score += 5;
  }

  // 6. Basic Structured Accessibility / llms.txt (5%)
  if (hasLlmsTxt) {
    score += 3;
  }
  if (hasCanonical) {
    score += 2;
  }

  const roundedScore = Math.min(100, Math.max(0, Math.round(score)));

  let tier = 'Restricted';
  let tierColor = 'danger';
  if (roundedScore >= 85) {
    tier = 'Excellent';
    tierColor = 'success';
  } else if (roundedScore >= 70) {
    tier = 'Good';
    tierColor = 'brand';
  } else if (roundedScore >= 50) {
    tier = 'Fair';
    tierColor = 'warning';
  }

  return {
    score: roundedScore,
    tier,
    tierColor
  };
}

/**
 * Generates Actionable Recommendations
 */
function generateRecommendations(crawlers) {
  const recommendations = [];

  // Search crawlers that are blocked
  const blockedSearch = crawlers.filter(c => c.isSearch && !c.isTraditional && c.status === 'blocked');
  for (const c of blockedSearch) {
    recommendations.push({
      id: `allow-${c.id}`,
      type: 'search_allow',
      title: `Allow ${c.name}`,
      priority: 'high',
      crawlerName: c.name,
      userAgent: c.userAgent,
      description: `Your robots.txt currently blocks ${c.userAgent}. Allowing this crawler enables AI search engines to discover and index your content for live answers.`,
      suggestedSnippet: `User-agent: ${c.userAgent}\nAllow: /`
    });
  }

  // Training crawlers: Provide neutral policy choices (Allow vs Disallow)
  const trainingCrawlers = crawlers.filter(c => c.isTraining);
  for (const c of trainingCrawlers) {
    recommendations.push({
      id: `policy-${c.id}`,
      type: 'training_policy',
      title: `Configure ${c.name} Policy`,
      priority: 'medium',
      crawlerName: c.name,
      userAgent: c.userAgent,
      description: `This crawler relates to AI foundation model training or commercial AI development. Deciding whether to allow or block ${c.userAgent} is a publisher policy decision.`,
      snippets: {
        allow: `User-agent: ${c.userAgent}\nAllow: /`,
        disallow: `User-agent: ${c.userAgent}\nDisallow: /`
      }
    });
  }

  return recommendations;
}

/**
 * Main Analysis Endpoint: POST /api/tools/ai-crawler-checker/analyze
 */
router.post('/analyze', async (req, res) => {
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

  // Track DB view/usage
  try {
    await pool.query(`
      UPDATE cerilas_tools 
      SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() 
      WHERE slug = 'ai-crawler-checker'
    `);
  } catch (err) {
    console.error('DB use_count update error:', err.message);
  }

  // Progress metrics & responses
  let robotsResult = null;
  let homepageResult = null;
  let llmsResult = null;
  let sitemapResult = null;

  try {
    // 1. Fetch robots.txt
    const robotsUrl = `${origin}/robots.txt`;
    try {
      const resp = await safeFetch(robotsUrl, { maxBytes: 1024 * 1024, timeoutMs: 8000 });
      if (resp.status === 200) {
        const parsed = parseRobotsTxt(resp.body);
        robotsResult = {
          status: 'found',
          httpCode: 200,
          url: robotsUrl,
          rawContent: resp.body,
          byteLength: resp.byteLength,
          parsed
        };
      } else {
        robotsResult = {
          status: resp.status === 404 ? 'not_found' : 'unreachable',
          httpCode: resp.status,
          url: robotsUrl,
          rawContent: '',
          parsed: { records: [], sitemaps: [] },
          error: `Server responded with HTTP ${resp.status}`
        };
      }
    } catch (err) {
      robotsResult = {
        status: 'unreachable',
        httpCode: null,
        url: robotsUrl,
        rawContent: '',
        parsed: { records: [], sitemaps: [] },
        error: err.message
      };
    }

    // 2. Fetch Homepage
    const startTime = Date.now();
    try {
      const resp = await safeFetch(rawUrl, { maxBytes: 3 * 1024 * 1024, timeoutMs: 8000 });
      const responseTimeMs = Date.now() - startTime;
      const botProtection = detectBotProtection(resp.status, resp.headers);
      const indexability = checkIndexability(resp.body, resp.headers);

      homepageResult = {
        status: resp.status === 200 ? 'ok' : 'status_warning',
        httpCode: resp.status,
        finalUrl: resp.finalUrl,
        redirectChain: resp.redirectChain,
        responseTimeMs,
        headers: resp.headers,
        botProtection,
        indexability
      };
    } catch (err) {
      homepageResult = {
        status: 'error',
        httpCode: null,
        finalUrl: rawUrl,
        redirectChain: [],
        responseTimeMs: Date.now() - startTime,
        headers: {},
        botProtection: { isProtected: false, reason: null },
        indexability: {
          isIndexable: false,
          directives: [],
          details: `Unable to inspect homepage HTML (${err.message})`
        },
        error: err.message
      };
    }

    // 3. Fetch llms.txt
    const llmsUrl = `${origin}/llms.txt`;
    try {
      const resp = await safeFetch(llmsUrl, { maxBytes: 1024 * 1024, timeoutMs: 6000 });
      if (resp.status === 200 && resp.body.trim()) {
        llmsResult = {
          status: 'found',
          httpCode: 200,
          url: llmsUrl,
          sizeBytes: resp.byteLength,
          snippet: resp.body.slice(0, 1500)
        };
      } else {
        llmsResult = {
          status: 'not_found',
          httpCode: resp.status,
          url: llmsUrl
        };
      }
    } catch {
      llmsResult = {
        status: 'not_found',
        httpCode: null,
        url: llmsUrl
      };
    }

    // 4. Check Sitemap
    const sitemapsFromRobots = robotsResult?.parsed?.sitemaps || [];
    let sitemapUrl = sitemapsFromRobots[0] || `${origin}/sitemap.xml`;
    try {
      const resp = await safeFetch(sitemapUrl, { maxBytes: 5 * 1024 * 1024, timeoutMs: 6000 });
      if (resp.status === 200 && (resp.body.includes('<urlset') || resp.body.includes('<sitemapindex') || resp.body.includes('<loc>'))) {
        // Approximate URL count
        const matches = resp.body.match(/<loc>/g);
        sitemapResult = {
          status: 'found',
          httpCode: 200,
          url: sitemapUrl,
          fromRobotsTxt: sitemapsFromRobots.length > 0,
          estimatedUrls: matches ? matches.length : null
        };
      } else {
        sitemapResult = {
          status: 'not_found',
          httpCode: resp.status,
          url: sitemapUrl,
          fromRobotsTxt: sitemapsFromRobots.length > 0
        };
      }
    } catch {
      sitemapResult = {
        status: 'not_found',
        httpCode: null,
        url: sitemapUrl,
        fromRobotsTxt: sitemapsFromRobots.length > 0
      };
    }

    // 5. Evaluate each crawler
    const crawlerEvaluations = CRAWLER_DEFINITIONS.map(crawler => {
      const evaluation = evaluateCrawlerAccess(crawler.userAgent, robotsResult.parsed, '/');
      return {
        ...crawler,
        ...evaluation
      };
    });

    // 6. Summary Stats
    const searchBots = crawlerEvaluations.filter(c => c.isSearch && !c.isTraditional);
    const searchAllowedCount = searchBots.filter(c => c.status === 'allowed' || c.status === 'default_allowed').length;

    const trainingBots = crawlerEvaluations.filter(c => c.isTraining);
    const trainingAllowedCount = trainingBots.filter(c => c.status === 'allowed' || c.status === 'default_allowed').length;

    // 7. Score Calculation
    const scoring = calculateAccessibilityScore({
      crawlerEvaluations,
      indexability: homepageResult.indexability,
      robotsFound: robotsResult.status === 'found',
      sitemapFound: sitemapResult.status === 'found',
      httpStatus: homepageResult.httpCode || 0,
      hasLlmsTxt: llmsResult.status === 'found',
      hasCanonical: !!homepageResult.indexability.canonicalUrl
    });

    // 8. Deterministic Recommendations
    const recommendations = generateRecommendations(crawlerEvaluations);

    return res.json({
      success: true,
      data: {
        domain: hostname,
        origin,
        checkedUrl: rawUrl,
        timestamp: new Date().toISOString(),
        score: scoring,
        summary: {
          searchAccessibility: {
            allowedCount: searchAllowedCount,
            totalCount: searchBots.length,
            label: `${searchAllowedCount} / ${searchBots.length} major AI search crawlers accessible`
          },
          trainingAccess: {
            allowedCount: trainingAllowedCount,
            totalCount: trainingBots.length,
            label: `${trainingAllowedCount} / ${trainingBots.length} allowed`
          },
          homepageIndexability: {
            isIndexable: homepageResult.indexability.isIndexable,
            label: homepageResult.indexability.isIndexable ? 'Indexable' : 'noindex detected'
          }
        },
        crawlers: crawlerEvaluations,
        robotsTxt: {
          status: robotsResult.status,
          httpCode: robotsResult.httpCode,
          url: robotsResult.url,
          rawContent: robotsResult.rawContent,
          error: robotsResult.error,
          sitemaps: robotsResult.parsed.sitemaps
        },
        homepage: {
          status: homepageResult.status,
          httpCode: homepageResult.httpCode,
          finalUrl: homepageResult.finalUrl,
          redirectChain: homepageResult.redirectChain,
          responseTimeMs: homepageResult.responseTimeMs,
          botProtection: homepageResult.botProtection,
          indexability: homepageResult.indexability
        },
        llmsTxt: llmsResult,
        sitemap: sitemapResult,
        recommendations
      }
    });

  } catch (error) {
    console.error('Crawler check processing error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to analyze domain: ${error.message || 'Unknown network error'}`
    });
  }
});

/**
 * Advanced User-Agent Simulation Endpoint: POST /api/tools/ai-crawler-checker/simulate-ua
 */
router.post('/simulate-ua', async (req, res) => {
  const { url, crawlerId } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required.' });
  }

  const crawler = CRAWLER_DEFINITIONS.find(c => c.id === crawlerId) || CRAWLER_DEFINITIONS[0];
  const userAgentString = crawler.simulatedUa || 'Mozilla/5.0 (compatible; CerilasSimulatedBot/1.0)';

  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  const validation = isSafeUrl(targetUrl);
  if (!validation.safe) {
    return res.status(400).json({ success: false, error: `Blocked: ${validation.reason}` });
  }

  const startTime = Date.now();
  try {
    const resp = await safeFetch(targetUrl, {
      maxBytes: 1024 * 1024,
      timeoutMs: 8000,
      customHeaders: {
        'User-Agent': userAgentString
      }
    });
    const responseTimeMs = Date.now() - startTime;
    const botProtection = detectBotProtection(resp.status, resp.headers);

    return res.json({
      success: true,
      simulation: {
        simulatedCrawler: crawler.name,
        userAgentHeader: userAgentString,
        httpCode: resp.status,
        statusText: resp.statusText,
        responseTimeMs,
        botProtection,
        disclaimer: 'This request simulates the HTTP User-Agent header only. It does not originate from the crawler provider\'s official ASN/IP infrastructure.'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Simulation request failed: ${err.message}`
    });
  }
});

export default router;
