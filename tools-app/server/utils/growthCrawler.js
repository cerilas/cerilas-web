import { GoogleGenAI } from '@google/genai';

/**
 * Validates that a URL is safe to fetch (basic SSRF protection)
 */
export function validatePublicUrl(targetUrl) {
  try {
    const u = new URL(targetUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are supported.' };
    }
    const hostname = u.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      return { valid: false, error: 'Private or local IP addresses are not permitted.' };
    }
    return { valid: true, url: u.href, domain: hostname.replace(/^www\./, '') };
  } catch (err) {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

/**
 * Extracts metadata, SEO tags, schema, and text from HTML
 */
export function extractPageMetadata(html, baseUrl) {
  const result = {
    title: '',
    metaDescription: '',
    h1: '',
    h2s: [],
    canonical: '',
    robots: '',
    faviconUrl: '',
    ogImage: '',
    schemaTypes: [],
    wordCount: 0,
    internalLinksCount: 0,
    externalLinksCount: 0,
    hasSsl: baseUrl.startsWith('https://'),
    isIndexable: true,
    issues: []
  };

  try {
    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) result.title = titleMatch[1].trim();

    // Meta Description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    if (metaDescMatch) result.metaDescription = metaDescMatch[1].trim();

    // Canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    if (canonicalMatch) result.canonical = canonicalMatch[1].trim();

    // Robots
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    if (robotsMatch) {
      result.robots = robotsMatch[1].trim();
      if (/noindex/i.test(result.robots)) {
        result.isIndexable = false;
        result.issues.push({
          type: 'noindex_detected',
          severity: 'critical',
          title: 'Sayfa noindex ile engellenmiş',
          description: 'Sayfa meta robots noindex etiketi içeriyor; arama motorları bu sayfayı dizine ekleyemez.',
          recommendedFix: 'Sayfanın arama motorlarında dizine girmesini istiyorsanız robots meta etiketindeki "noindex" değerini kaldırın.'
        });
      }
    }

    // H1
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      result.h1 = h1Match[1].replace(/<[^>]+>/g, '').trim();
    } else {
      result.issues.push({
        type: 'missing_h1',
        severity: 'high',
        title: 'H1 Başlığı Eksik',
        description: 'Bu sayfada tek bir birincil H1 başlığı bulunamadı. H1 etiketi SEO ve arama motoru anlamlandırması için kritiktir.',
        recommendedFix: 'Sayfanın ana konusunu özetleyen tek ve güçlü bir <h1> etiketi ekleyin.'
      });
    }

    // H2s (sample up to 5)
    const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    result.h2s = h2Matches.slice(0, 8).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

    // Favicon extraction with flexible attribute matching
    let favHref = '';
    const faviconLinkMatches = [...html.matchAll(/<link\s+[^>]*>/gi)];
    for (const linkTag of faviconLinkMatches) {
      const tag = linkTag[0];
      const relMatch = tag.match(/rel=["']([^"']*)["']/i);
      if (relMatch && /\b(?:icon|apple-touch-icon|shortcut icon)\b/i.test(relMatch[1])) {
        const hrefMatch = tag.match(/href=["']([^"']*)["']/i);
        if (hrefMatch && hrefMatch[1]) {
          favHref = hrefMatch[1].trim();
          break;
        }
      }
    }

    if (favHref) {
      try {
        result.faviconUrl = favHref.startsWith('http') ? favHref : new URL(favHref, baseUrl).href;
      } catch {
        result.faviconUrl = '';
      }
    } else {
      result.faviconUrl = '';
    }

    // OpenGraph Image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    if (ogImageMatch) {
      const ogHref = ogImageMatch[1].trim();
      result.ogImage = ogHref.startsWith('http') ? ogHref : new URL(ogHref, baseUrl).href;
    }

    // Schema.org JSON-LD
    const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed['@type']) {
          if (Array.isArray(parsed['@type'])) {
            result.schemaTypes.push(...parsed['@type']);
          } else {
            result.schemaTypes.push(parsed['@type']);
          }
        } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
          for (const item of parsed['@graph']) {
            if (item['@type']) result.schemaTypes.push(item['@type']);
          }
        }
      } catch (e) {}
    }
    result.schemaTypes = [...new Set(result.schemaTypes)];

    if (result.schemaTypes.length === 0) {
      result.issues.push({
        type: 'missing_schema',
        severity: 'medium',
        title: 'Yapılandırılmış Veri (Schema.org) Yok',
        description: 'Sitede JSON-LD yapılandırılmış veri bulunamadı. Organization veya WebSite şeması eklemek Google ve AI (GEO) görünürlüğünü artırır.',
        recommendedFix: 'Sayfaya JSON-LD formatında Organization veya WebSite Schema.org etiketi entegre edin.'
      });
    }

    // Word Count
    const textOnly = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = textOnly.split(' ').filter(w => w.length > 1);
    result.wordCount = words.length;

    if (!result.metaDescription) {
      result.issues.push({
        type: 'missing_meta_description',
        severity: 'high',
        title: 'Meta Açıklama Eksik',
        description: 'Arama sonuçlarında ve AI özetlerinde snippet oluşturmak için birincil meta açıklama bulunamadı.',
        recommendedFix: 'Sayfa için 140-160 karakter uzunluğunda, harekete geçirici özgün bir <meta name="description"> etiketi ekleyin.'
      });
    }

    if (!result.title) {
      result.issues.push({
        type: 'missing_title',
        severity: 'critical',
        title: 'Sayfa Başlığı (Title) Eksik',
        description: 'Sayfanın arama motoru başlığı (title tag) bulunamadı.',
        recommendedFix: 'Sayfanın <head> alanına 50-60 karakter uzunluğunda benzersiz bir <title> etiketi ekleyin.'
      });
    }

    // Links count
    const linkMatches = [...html.matchAll(/<a[^>]*href=["']([^"']*)["']/gi)];
    const baseHost = new URL(baseUrl).hostname;
    for (const l of linkMatches) {
      const href = l[1];
      if (href.startsWith('#') || href.startsWith('javascript:')) continue;
      try {
        const resolved = new URL(href, baseUrl);
        if (resolved.hostname === baseHost) {
          result.internalLinksCount++;
        } else {
          result.externalLinksCount++;
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Metadata parsing error:', err.message);
  }

  return result;
}

/**
 * Comprehensive crawler for a single domain entrypoint
 */
export async function scanDomain(targetUrl) {
  const check = validatePublicUrl(targetUrl);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const cleanUrl = check.url;
  const domain = check.domain;

  const startTime = Date.now();
  let statusCode = 200;
  let html = '';
  let loadTimeMs = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CerilasGrowthBot/1.0; +https://tools.cerilas.com/growth)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeoutId);

    statusCode = res.status;
    html = await res.text();
    loadTimeMs = Date.now() - startTime;
  } catch (err) {
    throw new Error(`Web sitesine ulaşılamadı (${err.message}). Lütfen adresi kontrol edin.`);
  }

  const meta = extractPageMetadata(html, cleanUrl);

  // Check /robots.txt
  let robotsTxtFound = false;
  let robotsAllowsAi = true;
  try {
    const robotsRes = await fetch(new URL('/robots.txt', cleanUrl).href, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    if (robotsRes.ok) robotsTxtFound = true;
  } catch (e) {}

  // Check /llms.txt (GEO differentiator)
  let llmsTxtFound = false;
  try {
    const llmsRes = await fetch(new URL('/llms.txt', cleanUrl).href, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    if (llmsRes.ok) llmsTxtFound = true;
  } catch (e) {}

  // Calculate Initial Technical Health Score (0 - 100)
  let technicalScore = 100;
  if (!meta?.hasSsl) technicalScore -= 25;
  if (!meta?.title) technicalScore -= 20;
  if (!meta?.metaDescription) technicalScore -= 15;
  if (!meta?.h1) technicalScore -= 15;
  if (!meta?.schemaTypes || meta.schemaTypes.length === 0) technicalScore -= 15;
  if (!robotsTxtFound) technicalScore -= 5;
  if (loadTimeMs > 2500) technicalScore -= 10;
  technicalScore = Math.max(20, Math.min(100, technicalScore));

  // Calculate Initial GEO (AI Visibility) Readiness Score (0 - 100)
  let geoScore = 50;
  if (llmsTxtFound) geoScore += 25;
  if (meta?.schemaTypes?.includes('Organization') || meta?.schemaTypes?.includes('Corporation')) geoScore += 15;
  if (meta?.schemaTypes?.includes('FAQPage') || meta?.schemaTypes?.includes('Article')) geoScore += 10;
  if ((meta?.wordCount || 0) > 600) geoScore += 10;
  if ((meta?.wordCount || 0) < 200) geoScore -= 15;
  geoScore = Math.max(10, Math.min(100, geoScore));

  return {
    url: cleanUrl,
    domain,
    statusCode,
    loadTimeMs,
    robotsTxtFound,
    robotsAllowsAi,
    llmsTxtFound,
    technicalScore: Math.max(0, technicalScore),
    geoScore,
    meta
  };
}

/**
 * Parses sitemap.xml (including sitemap indexes) and concurrently crawls pages for deeper audit
 */
export async function scanSitemapAndPages(targetUrl) {
  const baseResult = await scanDomain(targetUrl);
  const cleanUrl = baseResult.url;
  
  const results = {
    domainScan: baseResult,
    pages: [baseResult.meta],
    urls: [cleanUrl],
    sitemapFound: false,
    sitemapTotalUrls: 0
  };
  
  try {
    const sitemapCandidates = ['/sitemap.xml', '/sitemap_index.xml'];
    let xmlContent = '';
    let foundSitemapUrl = '';

    for (const path of sitemapCandidates) {
      try {
        const testUrl = new URL(path, cleanUrl).href;
        const res = await fetch(testUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CerilasGrowthBot/1.0; +https://tools.cerilas.com/growth)' }
        });
        if (res.ok) {
          const text = await res.text();
          if (text.includes('<loc>')) {
            xmlContent = text;
            foundSitemapUrl = testUrl;
            results.sitemapFound = true;
            break;
          }
        }
      } catch (err) {}
    }

    if (results.sitemapFound && xmlContent) {
      const locMatches = [...xmlContent.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(m => m[1].trim());
      
      let allPageUrls = [];
      const subSitemaps = locMatches.filter(u => u.endsWith('.xml') || u.includes('sitemap'));

      if (subSitemaps.length > 0 && subSitemaps.length <= 5) {
        // Fetch up to 3 sub-sitemaps
        for (const subUrl of subSitemaps.slice(0, 3)) {
          try {
            const subRes = await fetch(subUrl, {
              signal: AbortSignal.timeout(5000),
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CerilasGrowthBot/1.0)' }
            });
            if (subRes.ok) {
              const subXml = await subRes.text();
              const subMatches = [...subXml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(m => m[1].trim());
              allPageUrls.push(...subMatches.filter(u => !u.endsWith('.xml')));
            }
          } catch (e) {}
        }
      }

      // Add direct page URLs from main sitemap
      allPageUrls.push(...locMatches.filter(u => !u.endsWith('.xml')));
      
      // Clean and deduplicate
      const uniquePageUrls = [...new Set(allPageUrls)]
        .filter(u => u !== cleanUrl && u.startsWith('http') && !u.match(/\.(jpg|jpeg|png|gif|svg|pdf|webp)$/i));

      results.sitemapTotalUrls = uniquePageUrls.length > 0 ? uniquePageUrls.length : locMatches.length;

      // Crawl all discovered pages up to 300 URLs in concurrency batches of 20
      const targetUrlsToCrawl = uniquePageUrls.slice(0, 300);
      const concurrency = 20;

      for (let i = 0; i < targetUrlsToCrawl.length; i += concurrency) {
        const batch = targetUrlsToCrawl.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(async (u) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const t0 = Date.now();
            const res = await fetch(u, {
              signal: controller.signal,
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CerilasGrowthBot/1.0; +https://tools.cerilas.com/growth)' }
            });
            const loadTimeMs = Date.now() - t0;
            clearTimeout(timeoutId);

            if (!res.ok) {
              return {
                url: u,
                statusCode: res.status,
                loadTimeMs,
                meta: {
                  url: u,
                  statusCode: res.status,
                  title: '',
                  metaDescription: '',
                  h1: '',
                  h2s: [],
                  canonical: u,
                  isIndexable: false,
                  wordCount: 0,
                  internalLinksCount: 0,
                  externalLinksCount: 0,
                  schemaTypes: [],
                  issues: [{
                    type: 'http_error',
                    severity: 'critical',
                    title: `Erişim Hatası (HTTP ${res.status})`,
                    description: `Bu sayfa HTTP ${res.status} durum kodu ile yanıt verdi. Sayfa arama motorları ve ziyaretçiler için erişilemez.`,
                    recommendedFix: 'Kırık URL yönlendirmesini (301) veya sunucu yapılandırmasını düzeltin.'
                  }]
                }
              };
            }

            const html = await res.text();
            const meta = extractPageMetadata(html, u);
            return { url: u, statusCode: res.status, meta, loadTimeMs };
          } catch (e) {
            return null;
          }
        }));

        for (const item of batchResults) {
          if (item && item.meta) {
            item.meta.url = item.url;
            item.meta.statusCode = item.statusCode;
            item.meta.loadTimeMs = item.loadTimeMs || 350;
            results.pages.push(item.meta);
            results.urls.push(item.url);
          }
        }
      }
    }
  } catch (e) {
    console.warn('[scanSitemapAndPages] Error:', e.message);
  }

  return results;
}


/**
 * AI-powered brand information and competitor extractor using Gemini
 */
export async function extractBrandProfileWithAi(scanResult) {
  const meta = scanResult?.meta || {};
  const url = scanResult?.url || '';
  let domain = scanResult?.domain;
  if (!domain && url) {
    try {
      domain = new URL(url).hostname.replace(/^www\./i, '');
    } catch {}
  }
  domain = typeof domain === 'string' ? domain.trim() : '';

  const defaultBrandName = domain
    ? domain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Website';

  const cleanTitle = typeof meta?.title === 'string' ? meta.title : '';
  const brandFromTitle = cleanTitle ? cleanTitle.split(/[-|:]/)[0].trim() : defaultBrandName;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      brandName: brandFromTitle || defaultBrandName,
      industry: 'Technology & Digital Services',
      description: meta.metaDescription || `${defaultBrandName} digital products and services.`,
      targetAudience: 'Businesses and consumers seeking specialized digital solutions.',
      valueProposition: meta.h1 || `Comprehensive solutions for modern businesses.`,
      primaryKeywords: [defaultBrandName.toLowerCase(), 'online services', 'platform'],
      suggestedCompetitors: []
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a high-level digital marketing analyst. Analyze this website metadata:
Domain: ${domain}
URL: ${url}
Title: ${cleanTitle}
Meta Description: ${meta.metaDescription || ''}
H1: ${meta.h1 || ''}
H2 Sample: ${Array.isArray(meta.h2s) ? meta.h2s.join(' | ') : ''}
Schema Types: ${Array.isArray(meta.schemaTypes) ? meta.schemaTypes.join(', ') : ''}

Return a strict, valid JSON object with the following fields:
{
  "brandName": "Official name of the brand or company",
  "industry": "Specific industry (e.g. SaaS, E-Commerce, Healthcare, Hair Clinic, EdTech, Real Estate, Agency)",
  "businessModel": "B2B | B2C | D2C | Marketplace | Local",
  "description": "Crisp 2-sentence summary of what this brand provides",
  "targetAudience": "Who their target customers are",
  "valueProposition": "Their core unique selling point",
  "primaryKeywords": ["3 to 6 high-intent primary search keywords"],
  "mainProducts": ["2 to 4 key products or service categories"],
  "suggestedCompetitors": [
    { "name": "Competitor 1 Name", "domain": "competitor1.com" },
    { "name": "Competitor 2 Name", "domain": "competitor2.com" },
    { "name": "Competitor 3 Name", "domain": "competitor3.com" },
    { "name": "Competitor 4 Name", "domain": "competitor4.com" },
    { "name": "Competitor 5 Name", "domain": "competitor5.com" }
  ]
}

CRITICAL RULES FOR "suggestedCompetitors":
- You MUST return AT LEAST 5 real, high-relevance direct or industry/search competitors (return between 5 and 8 competitors). NEVER return fewer than 5 competitors.
- Each competitor must have a realistic official domain name (e.g., "example.com" or "example.com.tr", without protocol or slashes) and official brand name.
- If the brand or content is located in Turkey (e.g. Turkish language, .tr domain, Turkish target market), prioritize prominent Turkish and regional market competitors in that sector.
- Do NOT include the analyzed brand itself (${domain}) in suggestedCompetitors.

Only return pure JSON, no markdown codeblocks, no extra explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    const responseText = response.text ? response.text.trim() : '';
    const cleanJsonText = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJsonText);

    // Sanitize and ensure at least 5 competitors if possible
    const rawCompetitors = Array.isArray(parsed.suggestedCompetitors) ? parsed.suggestedCompetitors : [];
    const seenDomains = new Set([domain.toLowerCase()]);
    const sanitizedCompetitors = [];

    for (const c of rawCompetitors) {
      if (!c) continue;
      const rawDomain = String(c.domain || c.name || '')
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]
        .trim()
        .toLowerCase();
      const rawName = String(c.name || rawDomain).trim();
      if (rawDomain && !seenDomains.has(rawDomain)) {
        seenDomains.add(rawDomain);
        sanitizedCompetitors.push({
          name: rawName,
          domain: rawDomain
        });
      }
    }

    return {
      brandName: parsed.brandName || brandFromTitle || defaultBrandName,
      industry: parsed.industry || 'Technology & Digital Services',
      businessModel: parsed.businessModel || 'B2B',
      description: parsed.description || meta.metaDescription || '',
      targetAudience: parsed.targetAudience || '',
      valueProposition: parsed.valueProposition || meta.h1 || '',
      primaryKeywords: Array.isArray(parsed.primaryKeywords) ? parsed.primaryKeywords : [defaultBrandName.toLowerCase()],
      mainProducts: Array.isArray(parsed.mainProducts) ? parsed.mainProducts : [],
      suggestedCompetitors: sanitizedCompetitors
    };
  } catch (err) {
    console.warn('AI Brand Extraction fallback:', err.message);
    return {
      brandName: brandFromTitle || defaultBrandName,
      industry: 'Technology & Digital Services',
      businessModel: 'B2B',
      description: meta?.metaDescription || `${defaultBrandName} official web platform.`,
      targetAudience: 'Customers seeking digital excellence.',
      valueProposition: meta?.h1 || `${defaultBrandName} solutions.`,
      primaryKeywords: [defaultBrandName.toLowerCase(), 'digital tools'],
      mainProducts: [],
      suggestedCompetitors: []
    };
  }
}

/**
 * Live, real-time audit of AI Search Readiness (GEO Standards)
 * Tests Robots.txt for AI bots, /llms.txt standard, and Schema.org Entity/Organization JSON-LD
 */
export async function auditGeoReadiness(rawDomain) {
  if (!rawDomain) throw new Error('Alan adı belirtilmedi.');

  let domain = String(rawDomain).trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const baseUrl = `https://${domain}`;

  // 1. Robots.txt AI Bot Crawlers
  let robotsTxtFound = false;
  let robotsContent = '';
  let robotsUrl = `${baseUrl}/robots.txt`;

  try {
    const res = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CerilasGrowthBot/1.0; +https://tools.cerilas.com/growth)'
      }
    });
    if (res.ok) {
      robotsTxtFound = true;
      robotsContent = await res.text();
    }
  } catch (err) {
    try {
      const httpRes = await fetch(`http://${domain}/robots.txt`, {
        signal: AbortSignal.timeout(4000)
      });
      if (httpRes.ok) {
        robotsTxtFound = true;
        robotsContent = await httpRes.text();
        robotsUrl = `http://${domain}/robots.txt`;
      }
    } catch {}
  }

  const aiBotDefinitions = [
    { id: 'google-extended', name: 'Google-Extended', token: 'google-extended', company: 'Google Gemini & Vertex', logo: '/AI-logos/gemini-color.svg' },
    { id: 'gptbot', name: 'GPTBot', token: 'gptbot', company: 'OpenAI ChatGPT', logo: '/AI-logos/chatgpt-black.svg' },
    { id: 'perplexity', name: 'PerplexityBot', token: 'perplexitybot', company: 'Perplexity AI', logo: '/AI-logos/perplexity-color.svg' },
    { id: 'claudebot', name: 'ClaudeBot', token: 'claudebot', company: 'Anthropic Claude', logo: '/AI-logos/claude-color.svg' }
  ];

  let robotsParsed = { records: [] };
  if (robotsTxtFound && robotsContent) {
    const lines = robotsContent.split(/\r?\n/);
    let currentUas = [];
    let currentRules = [];

    const flush = () => {
      if (currentUas.length > 0) {
        robotsParsed.records.push({
          userAgents: currentUas.map(u => u.toLowerCase().trim()),
          rules: currentRules
        });
      }
      currentUas = [];
      currentRules = [];
    };

    for (let line of lines) {
      const hash = line.indexOf('#');
      if (hash !== -1) line = line.substring(0, hash);
      line = line.trim();
      if (!line) continue;

      const colon = line.indexOf(':');
      if (colon === -1) continue;

      const key = line.substring(0, colon).trim().toLowerCase();
      const val = line.substring(colon + 1).trim();

      if (key === 'user-agent') {
        if (currentRules.length > 0) flush();
        currentUas.push(val);
      } else if (key === 'allow') {
        currentRules.push({ type: 'allow', path: val });
      } else if (key === 'disallow') {
        currentRules.push({ type: 'disallow', path: val });
      }
    }
    flush();
  }

  const checkBotAccess = (token) => {
    if (!robotsTxtFound) return { allowed: true, status: 'no_robots_file', rule: null };

    const specificRecord = robotsParsed.records.find(r => r.userAgents.includes(token.toLowerCase()));
    if (specificRecord) {
      const rootDisallow = specificRecord.rules.find(r => r.type === 'disallow' && (r.path === '/' || r.path === '/*'));
      const rootAllow = specificRecord.rules.find(r => r.type === 'allow' && (r.path === '/' || r.path === '/*'));
      if (rootDisallow && !rootAllow) return { allowed: false, status: 'explicit_disallowed', rule: 'Disallow: /' };
      if (rootAllow) return { allowed: true, status: 'explicit_allowed', rule: 'Allow: /' };
      const emptyDisallow = specificRecord.rules.find(r => r.type === 'disallow' && r.path === '');
      if (emptyDisallow) return { allowed: true, status: 'explicit_allowed', rule: 'Disallow: (Boş)' };
      return { allowed: true, status: 'partial_allowed', rule: null };
    }

    const starRecord = robotsParsed.records.find(r => r.userAgents.includes('*'));
    if (starRecord) {
      const rootDisallow = starRecord.rules.find(r => r.type === 'disallow' && (r.path === '/' || r.path === '/*'));
      const rootAllow = starRecord.rules.find(r => r.type === 'allow' && (r.path === '/' || r.path === '/*'));
      if (rootDisallow && !rootAllow) return { allowed: false, status: 'wildcard_disallowed', rule: 'User-agent: * Disallow: /' };
      return { allowed: true, status: 'wildcard_allowed', rule: 'User-agent: *' };
    }

    return { allowed: true, status: 'default_allowed', rule: null };
  };

  const crawlerStatuses = aiBotDefinitions.map(bot => {
    const access = checkBotAccess(bot.token);
    return {
      ...bot,
      allowed: access.allowed,
      ruleText: access.rule,
      status: access.status
    };
  });

  const allAiAllowed = crawlerStatuses.every(c => c.allowed);
  const anyAiBlocked = crawlerStatuses.some(c => !c.allowed);

  // 2. /llms.txt Standard
  let llmsTxtFound = false;
  let llmsTxtUrl = `${baseUrl}/llms.txt`;
  let llmsTxtSnippet = '';
  let llmsTxtSize = 0;

  try {
    const llmsRes = await fetch(llmsTxtUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CerilasGrowthBot/1.0; +https://tools.cerilas.com/growth)'
      }
    });
    if (llmsRes.ok) {
      const text = await llmsRes.text();
      const isHtml = /^\s*<!doctype html|<html/i.test(text);
      if (!isHtml && text.trim().length > 15) {
        llmsTxtFound = true;
        llmsTxtSize = text.length;
        llmsTxtSnippet = text.trim().slice(0, 300);
      }
    }
  } catch {}

  // 3. Homepage Schema.org Organization & Entity Extraction
  let schemaFound = false;
  let hasOrganizationSchema = false;
  let schemaTypes = [];
  let pageTitle = '';
  let metaDescription = '';
  let wordCount = 0;
  let hasEntityLogo = false;
  let sameAsLinks = [];

  try {
    const pageRes = await fetch(baseUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CerilasGrowthBot/1.0; +https://tools.cerilas.com/growth)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (pageRes.ok) {
      const html = await pageRes.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) pageTitle = titleMatch[1].trim();

      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      if (descMatch) metaDescription = descMatch[1].trim();

      const textOnly = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      wordCount = textOnly.split(' ').filter(w => w.length > 1).length;

      const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of jsonLdMatches) {
        try {
          const parsed = JSON.parse(m[1]);
          const checkItem = (item) => {
            if (!item) return;
            const type = item['@type'];
            if (type) {
              if (Array.isArray(type)) schemaTypes.push(...type);
              else schemaTypes.push(type);

              const lowerType = String(type).toLowerCase();
              if (lowerType.includes('organization') || lowerType.includes('corporation') || lowerType.includes('localbusiness')) {
                hasOrganizationSchema = true;
                if (item.logo) hasEntityLogo = true;
                if (Array.isArray(item.sameAs)) sameAsLinks.push(...item.sameAs);
                else if (item.sameAs) sameAsLinks.push(item.sameAs);
              }
            }
          };

          if (Array.isArray(parsed)) {
            parsed.forEach(checkItem);
          } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
            parsed['@graph'].forEach(checkItem);
          } else {
            checkItem(parsed);
          }
        } catch {}
      }
      schemaTypes = [...new Set(schemaTypes)];
      schemaFound = schemaTypes.length > 0;
    }
  } catch (err) {
    console.warn('[GEO HTML Scan Warning]:', err.message);
  }

  // 4. Calculate Real GEO Readiness Score (0 - 100)
  let geoScore = 0;

  // Robots.txt & AI Crawlers: up to 35 pts
  if (robotsTxtFound) geoScore += 5;
  crawlerStatuses.forEach(c => {
    if (c.allowed) {
      if (c.id === 'google-extended') geoScore += 8;
      else if (c.id === 'gptbot') geoScore += 10;
      else if (c.id === 'perplexity') geoScore += 7;
      else if (c.id === 'claudebot') geoScore += 5;
    }
  });

  // /llms.txt Standard: 25 pts
  if (llmsTxtFound) geoScore += 25;

  // Schema & Knowledge Graph: up to 25 pts
  if (hasOrganizationSchema) geoScore += 15;
  if (schemaTypes.length > 1) geoScore += 5;
  if (hasEntityLogo || sameAsLinks.length > 0) geoScore += 5;

  // AI Content Baseline: up to 15 pts
  if (pageTitle) geoScore += 5;
  if (metaDescription) geoScore += 5;
  if (wordCount >= 250) geoScore += 5;

  geoScore = Math.max(15, Math.min(100, geoScore));

  return {
    domain,
    geoScore,
    auditedAt: new Date().toISOString(),
    robots: {
      found: robotsTxtFound,
      url: robotsUrl,
      crawlers: crawlerStatuses,
      allAllowed: allAiAllowed,
      anyBlocked: anyAiBlocked
    },
    llmsTxt: {
      found: llmsTxtFound,
      url: llmsTxtUrl,
      sizeBytes: llmsTxtSize,
      snippet: llmsTxtSnippet
    },
    schema: {
      found: schemaFound,
      hasOrganization: hasOrganizationSchema,
      types: schemaTypes,
      hasEntityLogo,
      sameAsCount: sameAsLinks.length
    },
    content: {
      pageTitle,
      hasMetaDescription: !!metaDescription,
      wordCount
    }
  };
}
