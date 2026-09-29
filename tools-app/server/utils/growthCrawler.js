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
          description: 'Sayfa meta robots noindex etiketi içeriyor; arama motorları bu sayfayı dizine ekleyemez.'
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
        description: 'Ana sayfada tek bir birincil H1 başlığı bulunamadı. H1 etiketi SEO ve arama motoru anlamlandırması için kritiktir.'
      });
    }

    // H2s (sample up to 5)
    const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    result.h2s = h2Matches.slice(0, 8).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

    // Favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i);
    if (faviconMatch) {
      const favHref = faviconMatch[1].trim();
      result.faviconUrl = favHref.startsWith('http') ? favHref : new URL(favHref, baseUrl).href;
    } else {
      result.faviconUrl = new URL('/favicon.ico', baseUrl).href;
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
        description: 'Sitede JSON-LD yapılandırılmış veri bulunamadı. Organization veya WebSite şeması eklemek Google ve AI (GEO) görünürlüğünü artırır.'
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
        description: 'Arama sonuçlarında ve AI özetlerinde snippet oluşturmak için birincil meta açıklama bulunamadı.'
      });
    }

    if (!result.title) {
      result.issues.push({
        type: 'missing_title',
        severity: 'critical',
        title: 'Sayfa Başlığı (Title) Eksik',
        description: 'Sayfanın arama motoru başlığı (title tag) bulunamadı.'
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
  if (!meta.hasSsl) technicalScore -= 25;
  if (!meta.title) technicalScore -= 20;
  if (!meta.metaDescription) technicalScore -= 15;
  if (!meta.h1) technicalScore -= 15;
  if (meta.schemaTypes.length === 0) technicalScore -= 15;
  if (!robotsTxtFound) technicalScore -= 5;
  if (loadTimeMs > 2500) technicalScore -= 10;
  technicalScore = Math.max(20, Math.min(100, technicalScore));

  // Calculate Initial GEO (AI Visibility) Readiness Score (0 - 100)
  let geoScore = 50;
  if (llmsTxtFound) geoScore += 25;
  if (meta.schemaTypes.includes('Organization') || meta.schemaTypes.includes('Corporation')) geoScore += 15;
  if (meta.schemaTypes.includes('FAQPage') || meta.schemaTypes.includes('Article')) geoScore += 10;
  if (meta.wordCount > 600) geoScore += 10;
  if (meta.wordCount < 200) geoScore -= 15;
  geoScore = Math.max(10, Math.min(100, geoScore));

  return {
    url: cleanUrl,
    domain,
    statusCode,
    loadTimeMs,
    meta,
    robotsTxtFound,
    llmsTxtFound,
    technicalScore,
    geoScore
  };
}

/**
 * AI-powered brand information and competitor extractor using Gemini
 */
export async function extractBrandProfileWithAi(scanResult) {
  const { domain, meta, url } = scanResult;

  const defaultBrandName = domain
    .split('.')[0]
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      brandName: meta.title ? meta.title.split(/[-|:]/)[0].trim() : defaultBrandName,
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
Title: ${meta.title}
Meta Description: ${meta.metaDescription}
H1: ${meta.h1}
H2 Sample: ${meta.h2s.join(' | ')}
Schema Types: ${meta.schemaTypes.join(', ')}

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
    { "name": "Competitor 3 Name", "domain": "competitor3.com" }
  ]
}

Only return pure JSON, no markdown codeblocks, no extra explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const responseText = response.text ? response.text.trim() : '';
    const cleanJsonText = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJsonText);

    return {
      brandName: parsed.brandName || defaultBrandName,
      industry: parsed.industry || 'Technology & Digital Services',
      businessModel: parsed.businessModel || 'B2B',
      description: parsed.description || meta.metaDescription || '',
      targetAudience: parsed.targetAudience || '',
      valueProposition: parsed.valueProposition || meta.h1 || '',
      primaryKeywords: Array.isArray(parsed.primaryKeywords) ? parsed.primaryKeywords : [defaultBrandName.toLowerCase()],
      mainProducts: Array.isArray(parsed.mainProducts) ? parsed.mainProducts : [],
      suggestedCompetitors: Array.isArray(parsed.suggestedCompetitors) ? parsed.suggestedCompetitors : []
    };
  } catch (err) {
    console.warn('AI Brand Extraction fallback:', err.message);
    return {
      brandName: meta.title ? meta.title.split(/[-|:]/)[0].trim() : defaultBrandName,
      industry: 'Technology & Digital Services',
      businessModel: 'B2B',
      description: meta.metaDescription || `${defaultBrandName} official web platform.`,
      targetAudience: 'Customers seeking digital excellence.',
      valueProposition: meta.h1 || `${defaultBrandName} solutions.`,
      primaryKeywords: [defaultBrandName.toLowerCase(), 'digital tools'],
      mainProducts: [],
      suggestedCompetitors: []
    };
  }
}
