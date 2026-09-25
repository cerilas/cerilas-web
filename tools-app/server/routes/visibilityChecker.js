import { Router } from 'express';
import dns from 'dns/promises';
import net from 'net';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import pool from '../db.js';
import { getClientIp, checkAiRateLimit } from '../utils/aiRateLimit.js';

const router = Router();

// ============================================================================
// SSRF & URL SAFETY UTILITIES
// ============================================================================
function isPrivateIP(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 127) return true; // Loopback
    if (parts[0] === 10) return true;  // Private
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true; // Link-local
    if (parts[0] === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80:')) return true;
    return false;
  }
  return false;
}

async function validateAndNormalizeUrl(inputUrl) {
  let urlStr = (inputUrl || '').trim();
  if (!urlStr) {
    throw new Error('Please provide a valid website URL.');
  }

  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = 'https://' + urlStr;
  }

  let parsed;
  try {
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
        throw new Error(`Restricted IP address detected: ${hostname} (${addr.address})`);
      }
    }
  } catch (err) {
    if (err.message.startsWith('Restricted IP')) throw err;
    throw new Error(`Could not resolve domain DNS: ${hostname}`);
  }

  return {
    normalizedUrl: parsed.origin + parsed.pathname,
    hostname: hostname.replace(/^www\./, ''),
    fullHost: hostname
  };
}

// ============================================================================
// STEP 1: SCRAPE WEBSITE (WITHOUT AI)
// ============================================================================
async function scrapeWebsiteContent(targetUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr,en-US;q=0.9,en;q=0.8'
      },
      redirect: 'follow'
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Website connection timed out after 12 seconds.');
    }
    throw new Error(`Failed to fetch website: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Website responded with HTTP status ${response.status} (${response.statusText})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract metadata
  const title = (
    $('title').first().text() ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    ''
  ).trim();

  const description = (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    ''
  ).trim();

  const brandCandidate = title
    ? title.split(/[-|–•:]/)[0].trim()
    : '';

  // Extract main headings
  const headings = [];
  $('h1, h2, h3').each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    if (txt && txt.length > 3 && txt.length < 150 && !headings.includes(txt)) {
      headings.push(txt);
    }
  });

  // Remove boilerplates before extracting body text
  $('script, style, noscript, svg, iframe, form, nav, footer, header, [role="navigation"], [role="banner"], [role="complementary"], .cookie-banner, #cookie-banner, .advertisement, .ads, link').remove();

  // Extract clean text paragraphs
  const paragraphs = [];
  $('p, article, section, li').each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    if (txt && txt.length > 20 && !paragraphs.includes(txt)) {
      paragraphs.push(txt);
    }
  });

  const bodyText = paragraphs.join(' ').slice(0, 5000);
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  const lang = $('html').attr('lang') || 'tr';

  return {
    title,
    description,
    brandCandidate,
    headings: headings.slice(0, 10),
    bodyText,
    wordCount,
    lang
  };
}

// ============================================================================
// SIMULATION GENERATOR (For instant testing when API key is not configured)
// ============================================================================
function generateRealisticSimulation({ domain, title, brandName, headings, description, lang }) {
  const cleanBrand = brandName || domain.split('.')[0];
  const queries = [
    {
      id: 1,
      query: `How much does ${headings[0] || cleanBrand} cost in 2026?`,
      intent: 'Commercial',
      rationale: 'Prospective customers actively researching pricing, budgets, and packages'
    },
    {
      id: 2,
      query: `Best alternatives and top competitors to ${cleanBrand} in 2026`,
      intent: 'Comparison',
      rationale: 'Users comparing market leaders and service alternatives'
    },
    {
      id: 3,
      query: `Is ${cleanBrand} reputable, legit, and worth it? User reviews`,
      intent: 'Commercial',
      rationale: 'High-intent buyers verifying brand trust and reputation before purchase'
    },
    {
      id: 4,
      query: `Top rated companies and experts for ${headings[1] || 'specialized services'}`,
      intent: 'Informational',
      rationale: 'Market research into industry authorities and certified specialists'
    },
    {
      id: 5,
      query: `How to choose the best ${headings[0] || 'service'} provider step-by-step`,
      intent: 'Informational',
      rationale: 'Educational buyer guides and criteria evaluation'
    },
    {
      id: 6,
      query: `${cleanBrand} customer support, direct contact, and booking`,
      intent: 'Transactional',
      rationale: 'Direct intent to contact sales, book a consultation, or schedule an appointment'
    },
    {
      id: 7,
      query: `Leading providers and clinics for ${headings[0] || 'expert solutions'} near me`,
      intent: 'Local',
      rationale: 'Geographic and local proximity search for recognized service centers'
    },
    {
      id: 8,
      query: `${cleanBrand} key features, technological differentiators, and offerings`,
      intent: 'Commercial',
      rationale: 'In-depth feature and capability exploration prior to onboarding'
    },
    {
      id: 9,
      query: `Real customer results, before and after cases for ${cleanBrand}`,
      intent: 'Informational',
      rationale: 'Verification of tangible outcomes, case studies, and customer proof'
    },
    {
      id: 10,
      query: `Current promotions, deals, and package discounts for ${cleanBrand}`,
      intent: 'Commercial',
      rationale: 'Value-oriented buyers looking for immediate incentives'
    }
  ];

  // Realistic mock audit results
  const results = queries.map((q, idx) => {
    const isCited = idx === 0 || idx === 2 || idx === 5;
    const isMentioned = !isCited && (idx === 1 || idx === 7);
    const status = isCited ? 'cited' : (isMentioned ? 'mentioned' : 'not_cited');

    return {
      id: q.id,
      query: q.query,
      intent: q.intent,
      rationale: q.rationale,
      status,
      isCited,
      isMentioned,
      aiAnswer: isCited
        ? `Gemini AI directly cited ${cleanBrand} (${domain}) as an authoritative source and included a hyperlinked citation in its response.`
        : isMentioned
        ? `Gemini mentioned ${cleanBrand} by name as a recognized provider in this sector, but did not include a direct clickable website link.`
        : `Gemini did not cite your website for this query; competitor portals and directory guides were referenced instead.`,
      targetDomainCited: isCited ? `https://${domain}` : null,
      citedSources: [
        ...(isCited ? [{ title: `${cleanBrand} - Official Website`, uri: `https://${domain}`, domain }] : []),
        { title: `${q.intent} Industry Guide & Benchmark 2026`, uri: `https://industry-insights.org/${q.id}`, domain: 'industry-insights.org' },
        { title: 'Consumer Reports & Comparison Hub', uri: 'https://comparison-hub.com/reviews', domain: 'comparison-hub.com' }
      ]
    };
  });

  const citedCount = results.filter(r => r.isCited).length;
  const mentionedCount = results.filter(r => r.isMentioned).length;
  const uncitedCount = results.filter(r => r.status === 'not_cited').length;
  const visibilityScore = Math.round(((citedCount * 10) + (mentionedCount * 5)) / (results.length * 10) * 100);

  let visibilityGrade = 'C';
  if (visibilityScore >= 80) visibilityGrade = 'A+';
  else if (visibilityScore >= 65) visibilityGrade = 'A';
  else if (visibilityScore >= 50) visibilityGrade = 'B';
  else if (visibilityScore >= 35) visibilityGrade = 'C';
  else if (visibilityScore >= 20) visibilityGrade = 'D';
  else visibilityGrade = 'F';

  return {
    isSimulated: true,
    domain,
    title,
    brandName,
    visibilityScore,
    visibilityGrade,
    totalQueries: results.length,
    citedCount,
    mentionedCount,
    uncitedCount,
    results,
    topCompetitors: [
      { domain: 'comparison-hub.com', count: 8 },
      { domain: 'industry-insights.org', count: 6 },
      { domain: 'wikipedia.org', count: 4 }
    ],
    aeoRecommendations: [
      {
        title: 'Implement Complete Schema.org Structured Data',
        description: 'Add Organization, LocalBusiness, FAQPage, and MedicalBusiness/Product JSON-LD schema so LLMs understand your exact entity boundaries.'
      },
      {
        title: 'Publish Direct Q&A-Formatted Knowledge Pages',
        description: 'Create comprehensive FAQ guides answering high-intent questions (e.g., "2026 pricing", "step-by-step procedures", "best practices") in clear, self-contained paragraphs.'
      },
      {
        title: 'Build Digital Brand Authority & Knowledge Graph Presence',
        description: 'Secure citations and profile mentions across recognized industry directories, Wikipedia, and verified trade publications to strengthen your Knowledge Graph entity.'
      }
    ]
  };
}

const SUPPORTED_COUNTRIES = {
  US: 'United States',
  GB: 'United Kingdom',
  TR: 'Turkey',
  DE: 'Germany',
  FR: 'France',
  CA: 'Canada',
  AU: 'Australia',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  GLOBAL: 'Global / International'
};

const SUPPORTED_LANGUAGES = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  nl: 'Dutch',
  pt: 'Portuguese',
  ar: 'Arabic'
};

function resolveMarketAndLanguage(country, language, hostname, lang) {
  let resolvedCountryCode = (country || 'auto').toUpperCase();
  let resolvedCountryName = 'Global';
  let isCountryAuto = resolvedCountryCode === 'AUTO';

  if (!isCountryAuto && SUPPORTED_COUNTRIES[resolvedCountryCode]) {
    resolvedCountryName = SUPPORTED_COUNTRIES[resolvedCountryCode];
  } else {
    if (hostname.endsWith('.tr')) {
      resolvedCountryCode = 'TR';
      resolvedCountryName = 'Turkey';
    } else if (hostname.endsWith('.uk') || hostname.endsWith('.co.uk')) {
      resolvedCountryCode = 'GB';
      resolvedCountryName = 'United Kingdom';
    } else if (hostname.endsWith('.de')) {
      resolvedCountryCode = 'DE';
      resolvedCountryName = 'Germany';
    } else if (hostname.endsWith('.fr')) {
      resolvedCountryCode = 'FR';
      resolvedCountryName = 'France';
    } else if (hostname.endsWith('.ca')) {
      resolvedCountryCode = 'CA';
      resolvedCountryName = 'Canada';
    } else if (hostname.endsWith('.au') || hostname.endsWith('.com.au')) {
      resolvedCountryCode = 'AU';
      resolvedCountryName = 'Australia';
    } else if (hostname.endsWith('.es')) {
      resolvedCountryCode = 'ES';
      resolvedCountryName = 'Spain';
    } else if (hostname.endsWith('.it')) {
      resolvedCountryCode = 'IT';
      resolvedCountryName = 'Italy';
    } else if (hostname.endsWith('.nl')) {
      resolvedCountryCode = 'NL';
      resolvedCountryName = 'Netherlands';
    } else {
      resolvedCountryCode = 'US';
      resolvedCountryName = 'United States';
    }
  }

  let resolvedLanguageCode = (language || 'auto').toLowerCase();
  let resolvedLanguageName = 'English';
  let isLanguageAuto = resolvedLanguageCode === 'auto';

  if (!isLanguageAuto && SUPPORTED_LANGUAGES[resolvedLanguageCode]) {
    resolvedLanguageName = SUPPORTED_LANGUAGES[resolvedLanguageCode];
  } else {
    const cleanLang = (lang || '').toLowerCase().slice(0, 2);
    if (cleanLang === 'tr' || hostname.endsWith('.tr')) {
      resolvedLanguageCode = 'tr';
      resolvedLanguageName = 'Turkish';
    } else if (cleanLang === 'de' || hostname.endsWith('.de')) {
      resolvedLanguageCode = 'de';
      resolvedLanguageName = 'German';
    } else if (cleanLang === 'fr' || hostname.endsWith('.fr')) {
      resolvedLanguageCode = 'fr';
      resolvedLanguageName = 'French';
    } else if (cleanLang === 'es' || hostname.endsWith('.es')) {
      resolvedLanguageCode = 'es';
      resolvedLanguageName = 'Spanish';
    } else if (cleanLang === 'it' || hostname.endsWith('.it')) {
      resolvedLanguageCode = 'it';
      resolvedLanguageName = 'Italian';
    } else if (cleanLang === 'nl' || hostname.endsWith('.nl')) {
      resolvedLanguageCode = 'nl';
      resolvedLanguageName = 'Dutch';
    } else if (cleanLang === 'pt') {
      resolvedLanguageCode = 'pt';
      resolvedLanguageName = 'Portuguese';
    } else if (cleanLang === 'ar') {
      resolvedLanguageCode = 'ar';
      resolvedLanguageName = 'Arabic';
    } else {
      resolvedLanguageCode = 'en';
      resolvedLanguageName = 'English';
    }
  }

  return {
    resolvedCountryCode,
    resolvedCountryName,
    isCountryAuto,
    resolvedLanguageCode,
    resolvedLanguageName,
    isLanguageAuto
  };
}

// ============================================================================
// MAIN VISIBILITY CHECK ENDPOINT
// ============================================================================
router.post('/analyze', async (req, res) => {
  try {
    const { url, country, language, apiKey: userApiKey, visitorId, mockMode } = req.body;

    if (!url || typeof url !== 'string' || url.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Please enter a valid website URL.' });
    }

    // Step 0: Validate & Normalize URL
    const { normalizedUrl, hostname } = await validateAndNormalizeUrl(url);

    // Step 1: Scrape website (No AI)
    let scrapedData;
    try {
      scrapedData = await scrapeWebsiteContent(normalizedUrl);
    } catch (scrapeErr) {
      return res.status(422).json({
        success: false,
        error: `Could not reach website: ${scrapeErr.message}. Please verify the link is publicly accessible.`
      });
    }

    const { title, description, brandCandidate, headings, bodyText, wordCount, lang } = scrapedData;
    const cleanBrandName = brandCandidate || hostname.split('.')[0];

    // Resolve Target Market Country & Language
    const {
      resolvedCountryCode,
      resolvedCountryName,
      isCountryAuto,
      resolvedLanguageCode,
      resolvedLanguageName,
      isLanguageAuto
    } = resolveMarketAndLanguage(country, language, hostname, lang);

    // Check API Key from server environment
    const apiKey = (userApiKey || '').trim() || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI search engine API is not configured on the server.'
      });
    }

    // If explicit mock mode requested by user
    if (mockMode) {
      const simulatedReport = generateRealisticSimulation({
        domain: hostname,
        title,
        brandName: cleanBrandName,
        headings,
        description,
        lang: resolvedLanguageCode
      });

      return res.json({
        success: true,
        scraped: {
          url: normalizedUrl,
          domain: hostname,
          title,
          description,
          headingsCount: headings.length,
          wordCount,
          lang
        },
        market: {
          countryCode: resolvedCountryCode,
          countryName: resolvedCountryName,
          languageCode: resolvedLanguageCode,
          languageName: resolvedLanguageName,
          isCountryAuto,
          isLanguageAuto
        },
        report: simulatedReport
      });
    }

    // Rate limit check for real API usage
    const clientIp = getClientIp(req);
    const quota = await checkAiRateLimit(pool, 'ai-visibility-checker', visitorId, clientIp);
    if (!quota.allowed && !userApiKey) {
      return res.status(429).json({
        success: false,
        error: `Hourly AI limit reached (${quota.limit} audits per hour). Your quota will reset in ${quota.resetInMinutes} minutes.`,
        quota
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Step 2: Ask Gemini to generate TOP 10 user queries with Geotargeting and Language precision
    const queryGenerationPrompt = `
You are an expert AI Search Engine Optimization (GEO/AEO) and User Search Intent Specialist.
A website was scraped with the following details:
- Domain: ${hostname}
- Title: ${title}
- Meta Description: ${description}
- Key Headings: ${headings.join(' | ')}
- Content Sample: ${bodyText.slice(0, 3000)}

TARGET AUDIENCE CONTEXT:
- Target Market / Geolocation: ${resolvedCountryName} (${resolvedCountryCode})
- Target Search Query Language: ${resolvedLanguageName} (${resolvedLanguageCode})

TASK:
Generate the TOP 10 most realistic, high-intent, real-world questions, queries, or prompts that potential customers, clients, or researchers located in ${resolvedCountryName} would ask AI models (ChatGPT, Gemini, Perplexity) or Google Search when looking for the products, services, or expertise offered by this website.

RULES:
1. Return EXACTLY 10 queries.
2. All 10 queries MUST be written strictly in ${resolvedLanguageName}.
3. Queries must reflect real regional search intent, local pricing currency, regional terminology, and search conventions typical for users in ${resolvedCountryName}.
4. Mix intents: Commercial/Transactional (pricing, hiring, purchasing), Informational (how it works, guides, requirements), Comparison/Best-of ("best...", "top rated", "alternatives"), and Local/Regional queries when applicable.
5. Return ONLY a valid JSON array of objects (no markdown, no backticks, no code block wrap):
[
  {
    "id": 1,
    "query": "string in ${resolvedLanguageName}",
    "intent": "Commercial" | "Informational" | "Local" | "Comparison",
    "rationale": "Brief 1-sentence reason"
  }
]`;

    let generatedQueries = [];
    try {
      const queryRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: queryGenerationPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const rawText = (queryRes.text || '').trim();
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      generatedQueries = JSON.parse(cleanJson);
      if (!Array.isArray(generatedQueries) || generatedQueries.length === 0) {
        throw new Error('AI query output was not an array');
      }
      generatedQueries = generatedQueries.slice(0, 10);
    } catch (queryErr) {
      console.warn('Gemini query generation fallback:', queryErr.message);
      // Fallback to simulation queries if model query generation fails
      const fallbackSim = generateRealisticSimulation({
        domain: hostname,
        title,
        brandName: cleanBrandName,
        headings,
        description,
        lang
      });
      generatedQueries = fallbackSim.results.map(r => ({
        id: r.id,
        query: r.query,
        intent: r.intent,
        rationale: r.rationale
      }));
    }

    // Step 3: Probe Gemini with Google Search Grounding for each of the 10 queries
    const queryResults = [];
    const normalizedTargetDomain = hostname.toLowerCase();

    const probeQuery = async (qItem) => {
      try {
        const probeRes = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Location Context: User search originating from ${resolvedCountryName}.
Query Language: ${resolvedLanguageName}.
Please provide an accurate, objective, and informative answer to this user search query tailored to an audience in ${resolvedCountryName}. Highlight reputable providers, trusted websites, clinics, or sources where applicable:\n\n"${qItem.query}"`,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const answerText = (probeRes.text || '').trim();
        const candidate = probeRes.candidates?.[0];
        const groundingMeta = candidate?.groundingMetadata || {};
        const chunks = groundingMeta.groundingChunks || [];

        const citedSources = [];
        let isCited = false;
        let targetDomainCited = null;

        for (const chunk of chunks) {
          if (chunk.web && (chunk.web.uri || chunk.web.title)) {
            const uri = chunk.web.uri || '';
            const chunkTitle = chunk.web.title || uri;
            let srcDomain = '';
            try {
              const host = new URL(uri).hostname.replace(/^www\./, '').toLowerCase();
              if (host.includes('vertexaisearch') || host.includes('google.com')) {
                srcDomain = chunkTitle.replace(/^www\./, '').toLowerCase();
              } else {
                srcDomain = host;
              }
            } catch {
              srcDomain = chunkTitle.replace(/^www\./, '').toLowerCase();
            }

            citedSources.push({
              title: chunkTitle,
              uri,
              domain: srcDomain || chunkTitle
            });

            const isHit = 
              (srcDomain && srcDomain.includes(normalizedTargetDomain)) ||
              (chunkTitle && chunkTitle.toLowerCase().includes(normalizedTargetDomain)) ||
              (uri && uri.toLowerCase().includes(normalizedTargetDomain));

            if (isHit) {
              isCited = true;
              targetDomainCited = uri || `https://${normalizedTargetDomain}`;
            }
          }
        }

        const isMentioned = !isCited && (
          answerText.toLowerCase().includes(normalizedTargetDomain) ||
          (cleanBrandName.length >= 3 && answerText.toLowerCase().includes(cleanBrandName.toLowerCase()))
        );

        const status = isCited ? 'cited' : (isMentioned ? 'mentioned' : 'not_cited');

        return {
          id: qItem.id,
          query: qItem.query,
          intent: qItem.intent || 'Informational',
          rationale: qItem.rationale || '',
          status,
          isCited,
          isMentioned,
          aiAnswer: answerText.slice(0, 450) + (answerText.length > 450 ? '...' : ''),
          targetDomainCited,
          citedSources: citedSources.slice(0, 6)
        };
      } catch (probeErr) {
        console.warn(`Probe failed for query "${qItem.query}":`, probeErr.message);
        return {
          id: qItem.id,
          query: qItem.query,
          intent: qItem.intent || 'Informational',
          rationale: qItem.rationale || '',
          status: 'not_cited',
          isCited: false,
          isMentioned: false,
          aiAnswer: 'A temporary network timeout occurred while querying the search grounding engine.',
          targetDomainCited: null,
          citedSources: []
        };
      }
    };

    // Run in parallel batches of 3 for fast execution
    const batchSize = 3;
    for (let i = 0; i < generatedQueries.length; i += batchSize) {
      const batch = generatedQueries.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(q => probeQuery(q)));
      queryResults.push(...batchResults);
    }

    // Step 4: Aggregate report metrics
    const citedCount = queryResults.filter(r => r.isCited).length;
    const mentionedCount = queryResults.filter(r => r.isMentioned).length;
    const uncitedCount = queryResults.filter(r => r.status === 'not_cited').length;
    const visibilityScore = Math.round(((citedCount * 10) + (mentionedCount * 5)) / (queryResults.length * 10) * 100);

    let visibilityGrade = 'C';
    if (visibilityScore >= 80) visibilityGrade = 'A+';
    else if (visibilityScore >= 65) visibilityGrade = 'A';
    else if (visibilityScore >= 50) visibilityGrade = 'B';
    else if (visibilityScore >= 35) visibilityGrade = 'C';
    else if (visibilityScore >= 20) visibilityGrade = 'D';
    else visibilityGrade = 'F';

    // Aggregate competitor domains
    const competitorCounts = {};
    for (const resItem of queryResults) {
      for (const src of resItem.citedSources) {
        const d = (src.domain || '').toLowerCase().trim();
        if (d && !d.includes(normalizedTargetDomain) && !d.includes('vertexaisearch') && !d.includes('google.com')) {
          competitorCounts[d] = (competitorCounts[d] || 0) + 1;
        }
      }
    }
    const topCompetitors = Object.entries(competitorCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Track usage in database
    try {
      await pool.query(
        'INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata) VALUES ($1, $2, $3, $4)',
        ['ai-visibility-checker', 'ai_scan', visitorId || null, JSON.stringify({ ip: clientIp, domain: hostname, score: visibilityScore })]
      );
      await pool.query(
        'UPDATE cerilas_tools SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() WHERE slug = $1',
        ['ai-visibility-checker']
      );
    } catch (dbErr) {
      console.warn('Tool usage event record failed:', dbErr.message);
    }

    const report = {
      isSimulated: false,
      domain: hostname,
      title,
      brandName: cleanBrandName,
      visibilityScore,
      visibilityGrade,
      totalQueries: queryResults.length,
      citedCount,
      mentionedCount,
      uncitedCount,
      results: queryResults,
      topCompetitors,
      aeoRecommendations: [
        {
          title: 'Implement Complete Schema.org Structured Data',
          description: 'Add Organization, LocalBusiness, FAQPage, and MedicalBusiness/Product JSON-LD schema so LLMs understand your exact entity boundaries.'
        },
        {
          title: 'Publish Direct Q&A-Formatted Knowledge Pages',
          description: 'Create comprehensive FAQ guides answering high-intent questions (e.g., "2026 pricing", "step-by-step procedures", "best practices") in clear, self-contained paragraphs.'
        },
        {
          title: 'Build Digital Brand Authority & Knowledge Graph Presence',
          description: 'Secure citations and profile mentions across recognized industry directories, Wikipedia, and verified trade publications to strengthen your Knowledge Graph entity.'
        }
      ]
    };

    const updatedQuota = {
      allowed: quota.remaining - 1 > 0,
      limit: quota.limit,
      used: quota.used + 1,
      remaining: Math.max(0, quota.remaining - 1),
      resetInMinutes: quota.resetInMinutes || 60
    };

    return res.json({
      success: true,
      scraped: {
        url: normalizedUrl,
        domain: hostname,
        title,
        description,
        headingsCount: headings.length,
        wordCount,
        lang
      },
      market: {
        countryCode: resolvedCountryCode,
        countryName: resolvedCountryName,
        languageCode: resolvedLanguageCode,
        languageName: resolvedLanguageName,
        isCountryAuto,
        isLanguageAuto
      },
      report,
      quota: updatedQuota
    });
  } catch (error) {
    console.error('AI Visibility Checker error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during the AI Visibility audit.'
    });
  }
});

// ============================================================================
// REAL-TIME PROGRESS STREAMING ENDPOINT (SSE)
// ============================================================================
router.post('/analyze-stream', async (req, res) => {
  if (req.socket) {
    req.socket.setKeepAlive(true, 1000);
    req.socket.setNoDelay(true);
    req.socket.setTimeout(0);
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  let isAborted = false;
  const heartbeatTimer = setInterval(() => {
    if (!isAborted && !res.writableEnded) {
      res.write(': ping\n\n');
      if (typeof res.flush === 'function') res.flush();
    }
  }, 2500);

  res.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
      clearInterval(heartbeatTimer);
      console.log('[AI Visibility Stream] Client disconnected before stream completion.');
    }
  });

  const sendEvent = (event, data) => {
    if (!isAborted && !res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') {
        res.flush();
      }
    }
  };

  try {
    const { url, country, language, apiKey: userApiKey, visitorId } = req.body;
    console.log('[AI Visibility Stream] Incoming stream request for:', url);

    if (!url || typeof url !== 'string' || url.trim().length < 3) {
      sendEvent('error', { error: 'Please enter a valid website URL.' });
      return res.end();
    }

    sendEvent('step', { stepIndex: 0, title: 'Connecting to target website and downloading raw HTML...' });

    // Step 0: Validate & Normalize URL
    const { normalizedUrl, hostname } = await validateAndNormalizeUrl(url);
    console.log('[AI Visibility Stream] URL validated:', normalizedUrl, hostname);

    // Step 1: Scrape website (No AI)
    let scrapedData;
    try {
      scrapedData = await scrapeWebsiteContent(normalizedUrl);
      console.log('[AI Visibility Stream] Website scraped successfully, word count:', scrapedData.wordCount);
    } catch (scrapeErr) {
      console.warn('[AI Visibility Stream] Scrape error:', scrapeErr.message);
      sendEvent('error', {
        error: `Could not reach website: ${scrapeErr.message}. Please verify the link is publicly accessible.`
      });
      return res.end();
    }

    const { title, description, brandCandidate, headings, bodyText, wordCount, lang } = scrapedData;
    const cleanBrandName = brandCandidate || hostname.split('.')[0];

    // Resolve Market & Language
    const {
      resolvedCountryCode,
      resolvedCountryName,
      isCountryAuto,
      resolvedLanguageCode,
      resolvedLanguageName,
      isLanguageAuto
    } = resolveMarketAndLanguage(country, language, hostname, lang);

    sendEvent('step', {
      stepIndex: 1,
      title: 'Extracting title, meta tags, and body content without AI...',
      scraped: {
        url: normalizedUrl,
        domain: hostname,
        title,
        description,
        headingsCount: headings.length,
        wordCount,
        lang
      }
    });

    const apiKey = (userApiKey || '').trim() || process.env.GEMINI_API_KEY;
    console.log('[AI Visibility Stream] API key present?', !!apiKey);
    if (!apiKey) {
      sendEvent('error', { error: 'AI search engine API is not configured on the server.' });
      return res.end();
    }

    // Rate limit check
    const clientIp = getClientIp(req);
    const quota = await checkAiRateLimit(pool, 'ai-visibility-checker', visitorId, clientIp);
    console.log('[AI Visibility Stream] Quota check:', quota);
    if (!quota.allowed && !userApiKey) {
      sendEvent('error', {
        error: `Hourly AI limit reached (${quota.limit} audits per hour). Your quota will reset in ${quota.resetInMinutes} minutes.`,
        quota
      });
      clearInterval(heartbeatTimer);
      return res.end();
    }

    const ai = new GoogleGenAI({ apiKey });
    console.log('[AI Visibility Stream] GoogleGenAI instance created. Generating queries...');

    sendEvent('step', {
      stepIndex: 2,
      title: 'Generating top 10 realistic user search queries with advanced AI models...'
    });

    const queryGenerationPrompt = `
You are an expert AI Search Engine Optimization (GEO/AEO) and User Search Intent Specialist.
A website was scraped with the following details:
- Domain: ${hostname}
- Title: ${title}
- Meta Description: ${description}
- Key Headings: ${headings.join(' | ')}
- Content Sample: ${bodyText.slice(0, 3000)}

TARGET AUDIENCE CONTEXT:
- Target Market / Geolocation: ${resolvedCountryName} (${resolvedCountryCode})
- Target Search Query Language: ${resolvedLanguageName} (${resolvedLanguageCode})

TASK:
Generate the TOP 10 most realistic, high-intent, real-world questions, queries, or prompts that potential customers, clients, or researchers located in ${resolvedCountryName} would ask AI models (ChatGPT, Gemini, Perplexity) or Google Search when looking for the products, services, or expertise offered by this website.

RULES:
1. Return EXACTLY 10 queries.
2. All 10 queries MUST be written strictly in ${resolvedLanguageName}.
3. Queries must reflect real regional search intent, local pricing currency, regional terminology, and search conventions typical for users in ${resolvedCountryName}.
4. Mix intents: Commercial/Transactional (pricing, hiring, purchasing), Informational (how it works, guides, requirements), Comparison/Best-of ("best...", "top rated", "alternatives"), and Local/Regional queries when applicable.
5. Return ONLY a valid JSON array of objects (no markdown, no backticks, no code block wrap):
[
  {
    "id": 1,
    "query": "string in ${resolvedLanguageName}",
    "intent": "Commercial" | "Informational" | "Local" | "Comparison",
    "rationale": "Brief 1-sentence reason"
  }
]`;

    let generatedQueries = [];
    try {
      const queryRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: queryGenerationPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });
      const rawText = (queryRes.text || '').trim();
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      generatedQueries = JSON.parse(cleanJson);
      if (!Array.isArray(generatedQueries) || generatedQueries.length === 0) {
        throw new Error('AI query output was not an array');
      }
      generatedQueries = generatedQueries.slice(0, 10);
    } catch (queryErr) {
      console.warn('Gemini query generation fallback:', queryErr.message);
      const fallbackSim = generateRealisticSimulation({
        domain: hostname,
        title,
        brandName: cleanBrandName,
        headings,
        description,
        lang: resolvedLanguageCode
      });
      generatedQueries = fallbackSim.results.map(r => ({
        id: r.id,
        query: r.query,
        intent: r.intent,
        rationale: r.rationale
      }));
    }

    console.log('[AI Visibility Stream] Generated queries ready:', generatedQueries.length);
    if (isAborted) {
      clearInterval(heartbeatTimer);
      return res.end();
    }

    sendEvent('queries_ready', {
      queries: generatedQueries,
      market: {
        countryCode: resolvedCountryCode,
        countryName: resolvedCountryName,
        languageCode: resolvedLanguageCode,
        languageName: resolvedLanguageName
      }
    });

    sendEvent('step', {
      stepIndex: 3,
      title: 'Querying Google Search Grounding for each prompt against live web data...'
    });

    const queryResults = [];
    const normalizedTargetDomain = hostname.toLowerCase();
    let completedCount = 0;

    const probeSingleQuery = async (qItem, qIdx) => {
      if (isAborted) return null;

      sendEvent('probe_start', {
        id: qItem.id,
        query: qItem.query,
        index: qIdx + 1,
        total: generatedQueries.length
      });

      try {
        const probeRes = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Location Context: User search originating from ${resolvedCountryName}.
Query Language: ${resolvedLanguageName}.
Please provide an accurate, objective, and informative answer to this user search query tailored to an audience in ${resolvedCountryName}. Highlight reputable providers, trusted websites, clinics, or sources where applicable:\n\n"${qItem.query}"`,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const answerText = (probeRes.text || '').trim();
        const candidate = probeRes.candidates?.[0];
        const groundingMeta = candidate?.groundingMetadata || {};
        const chunks = groundingMeta.groundingChunks || [];

        const citedSources = [];
        let isCited = false;
        let targetDomainCited = null;

        for (const chunk of chunks) {
          if (chunk.web && (chunk.web.uri || chunk.web.title)) {
            const uri = chunk.web.uri || '';
            const chunkTitle = chunk.web.title || uri;
            let srcDomain = '';
            try {
              const host = new URL(uri).hostname.replace(/^www\./, '').toLowerCase();
              if (host.includes('vertexaisearch') || host.includes('google.com')) {
                srcDomain = chunkTitle.replace(/^www\./, '').toLowerCase();
              } else {
                srcDomain = host;
              }
            } catch {
              srcDomain = chunkTitle.replace(/^www\./, '').toLowerCase();
            }

            citedSources.push({
              title: chunkTitle,
              uri,
              domain: srcDomain || chunkTitle
            });

            const isHit =
              (srcDomain && srcDomain.includes(normalizedTargetDomain)) ||
              (chunkTitle && chunkTitle.toLowerCase().includes(normalizedTargetDomain)) ||
              (uri && uri.toLowerCase().includes(normalizedTargetDomain));

            if (isHit) {
              isCited = true;
              targetDomainCited = uri || `https://${normalizedTargetDomain}`;
            }
          }
        }

        const isMentioned = !isCited && (
          answerText.toLowerCase().includes(normalizedTargetDomain) ||
          (cleanBrandName.length >= 3 && answerText.toLowerCase().includes(cleanBrandName.toLowerCase()))
        );

        const status = isCited ? 'cited' : (isMentioned ? 'mentioned' : 'not_cited');
        completedCount++;

        const resObj = {
          id: qItem.id,
          query: qItem.query,
          intent: qItem.intent || 'Informational',
          rationale: qItem.rationale || '',
          status,
          isCited,
          isMentioned,
          aiAnswer: answerText.slice(0, 450) + (answerText.length > 450 ? '...' : ''),
          targetDomainCited,
          citedSources: citedSources.slice(0, 6)
        };

        sendEvent('probe_result', {
          id: resObj.id,
          query: resObj.query,
          intent: resObj.intent,
          status: resObj.status,
          isCited: resObj.isCited,
          isMentioned: resObj.isMentioned,
          completedCount,
          total: generatedQueries.length
        });

        return resObj;
      } catch (probeErr) {
        completedCount++;
        const fallbackObj = {
          id: qItem.id,
          query: qItem.query,
          intent: qItem.intent || 'Informational',
          rationale: qItem.rationale || '',
          status: 'not_cited',
          isCited: false,
          isMentioned: false,
          aiAnswer: 'A temporary network timeout occurred while querying the search grounding engine.',
          targetDomainCited: null,
          citedSources: []
        };

        sendEvent('probe_result', {
          id: fallbackObj.id,
          query: fallbackObj.query,
          intent: fallbackObj.intent,
          status: fallbackObj.status,
          isCited: false,
          isMentioned: false,
          completedCount,
          total: generatedQueries.length
        });

        return fallbackObj;
      }
    };

    // Run probes in parallel batches of 2 for fast yet observable real-time progress
    const batchSize = 2;
    for (let i = 0; i < generatedQueries.length; i += batchSize) {
      if (isAborted) break;
      const batch = generatedQueries.slice(i, i + batchSize);
      const batchRes = await Promise.all(batch.map((q, bIdx) => probeSingleQuery(q, i + bIdx)));
      queryResults.push(...batchRes.filter(Boolean));
    }

    if (isAborted) return res.end();

    sendEvent('step', {
      stepIndex: 4,
      title: 'Calculating citation rates, brand mentions, and competitor rankings...'
    });

    const citedCount = queryResults.filter(r => r.isCited).length;
    const mentionedCount = queryResults.filter(r => r.isMentioned).length;
    const uncitedCount = queryResults.filter(r => r.status === 'not_cited').length;
    const visibilityScore = Math.round(((citedCount * 10) + (mentionedCount * 5)) / (queryResults.length * 10) * 100);

    let visibilityGrade = 'C';
    if (visibilityScore >= 80) visibilityGrade = 'A+';
    else if (visibilityScore >= 65) visibilityGrade = 'A';
    else if (visibilityScore >= 50) visibilityGrade = 'B';
    else if (visibilityScore >= 35) visibilityGrade = 'C';
    else if (visibilityScore >= 20) visibilityGrade = 'D';
    else visibilityGrade = 'F';

    const competitorCounts = {};
    for (const resItem of queryResults) {
      for (const src of resItem.citedSources) {
        const d = (src.domain || '').toLowerCase().trim();
        if (d && !d.includes(normalizedTargetDomain) && !d.includes('vertexaisearch') && !d.includes('google.com')) {
          competitorCounts[d] = (competitorCounts[d] || 0) + 1;
        }
      }
    }
    const topCompetitors = Object.entries(competitorCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    try {
      await pool.query(
        'INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata) VALUES ($1, $2, $3, $4)',
        ['ai-visibility-checker', 'ai_scan', visitorId || null, JSON.stringify({ ip: clientIp, domain: hostname, score: visibilityScore })]
      );
      await pool.query(
        'UPDATE cerilas_tools SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() WHERE slug = $1',
        ['ai-visibility-checker']
      );
    } catch (dbErr) {
      console.warn('Tool usage event record failed:', dbErr.message);
    }

    const report = {
      isSimulated: false,
      domain: hostname,
      title,
      brandName: cleanBrandName,
      visibilityScore,
      visibilityGrade,
      totalQueries: queryResults.length,
      citedCount,
      mentionedCount,
      uncitedCount,
      results: queryResults,
      topCompetitors,
      aeoRecommendations: [
        {
          title: 'Implement Complete Schema.org Structured Data',
          description: 'Add Organization, LocalBusiness, FAQPage, and MedicalBusiness/Product JSON-LD schema so LLMs understand your exact entity boundaries.'
        },
        {
          title: 'Publish Direct Q&A-Formatted Knowledge Pages',
          description: 'Create comprehensive FAQ guides answering high-intent questions (e.g., "2026 pricing", "step-by-step procedures", "best practices") in clear, self-contained paragraphs.'
        },
        {
          title: 'Build Digital Brand Authority & Knowledge Graph Presence',
          description: 'Secure citations and profile mentions across recognized industry directories, Wikipedia, and verified trade publications to strengthen your Knowledge Graph entity.'
        }
      ]
    };

    const updatedQuota = {
      allowed: quota.remaining - 1 > 0,
      limit: quota.limit,
      used: quota.used + 1,
      remaining: Math.max(0, quota.remaining - 1),
      resetInMinutes: quota.resetInMinutes || 60
    };

    sendEvent('complete', {
      success: true,
      scraped: {
        url: normalizedUrl,
        domain: hostname,
        title,
        description,
        headingsCount: headings.length,
        wordCount,
        lang
      },
      market: {
        countryCode: resolvedCountryCode,
        countryName: resolvedCountryName,
        languageCode: resolvedLanguageCode,
        languageName: resolvedLanguageName,
        isCountryAuto,
        isLanguageAuto
      },
      report,
      quota: updatedQuota
    });

    clearInterval(heartbeatTimer);
    res.end();
  } catch (err) {
    clearInterval(heartbeatTimer);
    console.error('AI Visibility stream error:', err);
    sendEvent('error', { error: err.message || 'Stream processing error' });
    res.end();
  }
});

export default router;
