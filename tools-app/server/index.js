import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'node:process';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import pool from './db.js';
import atsRouter from './routes/ats.js';
import pdfRagRouter from './routes/pdfRag.js';
import aiDetectorRouter from './routes/aiDetector.js';
import webhookTesterRouter from './routes/webhookTester.js';
import linkCheckerRouter from './routes/linkChecker.js';
import crawlerCheckerRouter from './routes/crawlerChecker.js';
import llmsTxtRouter from './routes/llmsTxt.js';
import htmlToMarkdownRouter from './routes/htmlToMarkdown.js';
import scrapersRouter from './routes/scrapers.js';
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import { detectBot } from './utils/botDetector.js';
import { recordToolEvent, ensureToolAnalyticsSchema } from './utils/toolAnalytics.js';
import { buildStatsOverview } from './utils/toolStatsOverview.js';
import { getRequestContext } from './utils/userActivity.js';
import { initScrapersDb } from './migrations/init-scrapers-db.js';
import { initMcpDb } from './migrations/init-mcp-db.js';
import { initGrowthDb } from './migrations/init-growth-db.js';
import googleMcpRouter from './routes/googleMcp.js';
import growthRouter from './routes/growth.js';
import { checkAiRateLimit, getClientIp } from './utils/aiRateLimit.js';
import { CATEGORIES, TOOLS_SEO_REGISTRY, getAllToolSlugs, TOOL_CANONICAL_ALIASES } from './seo/toolsSeoRegistry.js';
import { renderToolPageHtml, renderCategoryPageHtml, renderHomePageHtml, renderLegalPageHtml, renderPricingPageHtml, renderGrowthPageHtml } from './seo/ssrRenderer.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '..', 'dist');
const publicPath = path.resolve(__dirname, '..', 'public');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 301 URL Standardization & Redirect Middleware
app.use((req, res, next) => {
  const p = req.path;

  // 1. Redirect legacy plural /tools/:slug -> canonical /tool/:slug
  if (p.startsWith('/tools/')) {
    const rawSlug = p.replace(/^\/tools\//, '').replace(/\/+$/, '').toLowerCase();
    const targetSlug = TOOL_CANONICAL_ALIASES[rawSlug] || rawSlug;
    return res.redirect(301, `/tool/${targetSlug}`);
  }

  // 2. Redirect /tool/:slug casing or alias
  if (p.startsWith('/tool/')) {
    const segments = p.replace(/^\/tool\//, '').split('/');
    const rawSlug = segments[0];
    if (rawSlug) {
      const cleanSlug = rawSlug.toLowerCase();
      // Alias redirect
      if (TOOL_CANONICAL_ALIASES[cleanSlug]) {
        const canonical = TOOL_CANONICAL_ALIASES[cleanSlug];
        const rest = segments.slice(1).join('/');
        return res.redirect(301, `/tool/${canonical}${rest ? '/' + rest : ''}`);
      }
      // Uppercase redirect
      if (rawSlug !== cleanSlug) {
        const rest = segments.slice(1).join('/');
        return res.redirect(301, `/tool/${cleanSlug}${rest ? '/' + rest : ''}`);
      }
      // Strip trailing slash on single tool path
      if (segments.length === 1 && p.endsWith('/') && p.length > 6) {
        return res.redirect(301, `/tool/${cleanSlug}`);
      }
    }
  }

  // 3. Bare tool slug links (/ai-visibility-checker) -> canonical /tool/:slug
  const bareSlug = p.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (bareSlug && !bareSlug.includes('/') && !CATEGORIES[bareSlug]) {
    const target = TOOL_CANONICAL_ALIASES[bareSlug] || bareSlug;
    if (TOOLS_SEO_REGISTRY[target]) {
      return res.redirect(301, `/tool/${target}`);
    }
  }

  // 3b. Category alias /category/:slug -> /:slug
  if (p.startsWith('/category/')) {
    const catSlug = p.replace(/^\/category\//, '').replace(/\/+$/, '').toLowerCase();
    if (CATEGORIES[catSlug]) {
      return res.redirect(301, `/${catSlug}`);
    }
  }

  // 4. Trailing slash redirect for top-level paths (except root /)
  if (p.length > 1 && p.endsWith('/')) {
    return res.redirect(301, p.slice(0, -1));
  }

  next();
});

// robots.txt is maintained as a static file so AI crawler rules live in one place
const ROBOTS_TXT_PATH = [path.join(distPath, 'robots.txt'), path.join(publicPath, 'robots.txt')].find(p => fs.existsSync(p));
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  if (ROBOTS_TXT_PATH) return res.sendFile(ROBOTS_TXT_PATH);
  res.send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://tools.cerilas.com/sitemap.xml\n');
});

// lastmod must reflect real content changes; a per-request date teaches crawlers to ignore it
const SITEMAP_LASTMOD = (() => {
  try {
    return fs.statSync(path.join(distPath, 'index.html')).mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
})();

app.get('/sitemap.xml', (req, res) => {
  const urls = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/growth', changefreq: 'weekly', priority: '1.0' },
    { loc: '/pricing', changefreq: 'monthly', priority: '0.6' },
    ...Object.values(CATEGORIES).map(cat => ({ loc: `/${cat.slug}`, changefreq: 'weekly', priority: '0.8' })),
    ...Object.values(TOOLS_SEO_REGISTRY).map(tool => ({
      loc: `/tool/${tool.slug}`,
      changefreq: 'weekly',
      priority: tool.slug === 'ai-visibility-checker' ? '0.95' : '0.8'
    })),
    ...['terms', 'privacy', 'refund', 'cookies'].map(slug => ({ loc: `/${slug}`, changefreq: 'yearly', priority: '0.3' }))
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const u of urls) {
    xml += `  <url>\n    <loc>https://tools.cerilas.com${u.loc}</loc>\n    <lastmod>${SITEMAP_LASTMOD}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
  }
  xml += `</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Serve static assets from build output
app.use(express.static(distPath));
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Explicit static mounts for tool icons
app.use('/tool-icons', express.static(path.join(distPath, 'tool-icons')));
app.use('/tool-icons', express.static(path.join(publicPath, 'tool-icons')));

// Mount auth router
app.use('/api/auth', authRouter);

// Mount admin router (is_admin only)
app.use('/api/admin', adminRouter);

// Mount Cerilas Growth SaaS router
app.use('/api/growth', growthRouter);

// Mount webhook tester router
app.use('/api/webhook-test', webhookTesterRouter);

// Mount scrapers router (Funding & Matcher Scrapers)
app.use('/api/scrapers', scrapersRouter);

// Mount Google Marketing MCP router (OAuth, REST Actions & MCP SSE)
app.use('/api/mcp', googleMcpRouter);
app.use('/api/oauth', (req, res, next) => {
  req.url = '/oauth' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  googleMcpRouter(req, res, next);
});
app.use('/.well-known', (req, res, next) => {
  req.url = '/.well-known' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  googleMcpRouter(req, res, next);
});
app.use('/api/auth/google', (req, res, next) => {
  req.url = req.url.startsWith('/') ? req.url : '/' + req.url;
  googleMcpRouter(req, res, next);
});

// Google AdSense ads.txt verification route
app.get('/ads.txt', (req, res) => {
  res.type('text/plain');
  res.send('google.com, pub-9892289069070642, DIRECT, f08c47fec0942fa0\n');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', tools: true });
});

// Database check endpoint
app.get('/api/db-check', async (req, res) => {
  let host = 'none';
  let hasEnv = false;
  try {
    hasEnv = !!process.env.DATABASE_URL;
    if (process.env.DATABASE_URL) {
      try {
        const u = new URL(process.env.DATABASE_URL);
        host = u.host;
      } catch (e) {
        host = 'invalid-url';
      }
    }
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'success', time: result.rows[0].now, host, hasEnv });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to connect to database', 
      errorName: error?.name,
      errorMessage: error?.message,
      errorCode: error?.code,
      host, 
      hasEnv 
    });
  }
});

// Tools endpoint
app.get('/api/tools', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, title, slug, short_description, icon_name, cover_image_url, target_url, seo_title, seo_description, 
        is_active, sort_order, category, 
        COALESCE(view_count, 0) as view_count, 
        COALESCE(unique_visitors_count, 0) as unique_visitors_count,
        COALESCE(download_count, 0) as download_count,
        COALESCE(copy_count, 0) as copy_count,
        COALESCE(use_count, 0) as use_count, 
        last_used_at, created_at, updated_at,
        CASE 
          WHEN COALESCE(unique_visitors_count, 0) > 0 
          THEN ROUND((COALESCE(download_count, 0)::numeric / unique_visitors_count::numeric) * 100, 1)
          ELSE 0 
        END as download_cvr,
        CASE 
          WHEN COALESCE(unique_visitors_count, 0) > 0 
          THEN ROUND(((COALESCE(download_count, 0) + COALESCE(copy_count, 0))::numeric / unique_visitors_count::numeric) * 100, 1)
          ELSE 0 
        END as total_cvr
      FROM cerilas_tools 
      WHERE is_active = true 
      ORDER BY sort_order ASC, created_at DESC
    `);
    res.json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tools' });
  }
});

// Single tool endpoint
app.get('/api/tools/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT 
        id, title, slug, short_description, icon_name, cover_image_url, target_url, seo_title, seo_description, 
        is_active, sort_order, category, 
        COALESCE(view_count, 0) as view_count, 
        COALESCE(unique_visitors_count, 0) as unique_visitors_count,
        COALESCE(download_count, 0) as download_count,
        COALESCE(copy_count, 0) as copy_count,
        COALESCE(use_count, 0) as use_count, 
        last_used_at, created_at, updated_at,
        CASE 
          WHEN COALESCE(unique_visitors_count, 0) > 0 
          THEN ROUND((COALESCE(download_count, 0)::numeric / unique_visitors_count::numeric) * 100, 1)
          ELSE 0 
        END as download_cvr,
        CASE 
          WHEN COALESCE(unique_visitors_count, 0) > 0 
          THEN ROUND(((COALESCE(download_count, 0) + COALESCE(copy_count, 0))::numeric / unique_visitors_count::numeric) * 100, 1)
          ELSE 0 
        END as total_cvr
      FROM cerilas_tools 
      WHERE slug = $1
    `, [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Tool not found' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tool' });
  }
});

// Record event and update tool stats with unique visitor tracking (Human vs Bot separation)
app.post('/api/tools/:slug/event', async (req, res) => {
  try {
    const { slug } = req.params;
    const classification = await recordToolEvent(req, slug, req.body || {});

    const statsRes = await pool.query(
      `SELECT view_count, unique_visitors_count, download_count, copy_count, use_count, 
              COALESCE(bot_view_count, 0) as bot_view_count,
              COALESCE(bot_unique_visitors_count, 0) as bot_unique_visitors_count
       FROM cerilas_tools WHERE slug = $1`,
      [slug]
    );

    res.json({ 
      status: 'success', 
      message: 'Event tracked successfully',
      isBot: classification.isBot,
      botName: classification.botName,
      stats: statsRes.rows[0] || {}
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ status: 'error', message: error.message });
    }
    console.error('Error tracking tool event:', error);
    res.status(500).json({ status: 'error', message: 'Failed to track event' });
  }
});

// Public aggregate stats (visitor-level feeds are only served via /api/admin/analytics/overview)
app.get('/api/tools/stats/overview', async (req, res) => {
  try {
    const data = await buildStatsOverview(req.query, { detailed: false });
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Error fetching stats overview:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
  }
});

const AI_HOURLY_LIMIT = 3;

// Mount modular tool routes
app.use(['/api/ats', '/api/tools/ats'], atsRouter);
app.use(['/api/tools/pdf-rag-cleaner', '/api/pdf-rag-cleaner'], pdfRagRouter);
app.use(['/api/tools/ai-content-detector', '/api/ai-content-detector'], aiDetectorRouter);
app.use(['/api/tools/ai-link-hallucination-checker', '/api/link-checker'], linkCheckerRouter);
app.use(['/api/tools/ai-crawler-checker', '/api/crawler-checker'], crawlerCheckerRouter);
app.use(['/api/tools/llms-txt', '/api/llms-txt'], llmsTxtRouter);
app.use(['/api/tools/html-to-markdown', '/api/html-to-markdown', '/api/tools/html-to-llm-markdown'], htmlToMarkdownRouter);
app.use(['/api/tools/website-email-extractor', '/api/email-extractor'], async (req, res, next) => {
  try {
    const mod = await import('./routes/emailExtractor.js');
    return mod.default(req, res, next);
  } catch (err) {
    next(err);
  }
});
app.use(['/api/tools/ai-visibility-checker', '/api/visibility-checker'], async (req, res, next) => {
  try {
    const mod = await import('./routes/visibilityChecker.js');
    return mod.default(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Generic AI tool quota check endpoint
app.get('/api/tools/:slug/ai-quota', async (req, res) => {
  try {
    const { slug } = req.params;
    const visitorId = req.query.visitorId;
    const clientIp = getClientIp(req);
    const quota = await checkAiRateLimit(pool, slug, visitorId, clientIp);
    res.json({ status: 'success', quota });
  } catch (error) {
    console.error('Error fetching AI quota:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch AI quota' });
  }
});

// Generic consume AI tool quota endpoint
app.post('/api/tools/:slug/consume-ai-quota', async (req, res) => {
  try {
    const { slug } = req.params;
    const { visitorId, metadata = {} } = req.body;
    const clientIp = getClientIp(req);
    const quota = await checkAiRateLimit(pool, slug, visitorId, clientIp);

    if (!quota.allowed) {
      return res.status(429).json({
        status: 'error',
        error: `Hourly AI limit reached (${quota.limit} scans per hour). Your quota will reset in ${quota.resetInMinutes} minutes.`,
        quota
      });
    }

    // Insert usage event
    await pool.query(
      'INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata) VALUES ($1, $2, $3, $4)',
      [slug, 'ai_scan', visitorId || null, JSON.stringify({ ...metadata, ip: clientIp })]
    );

    // Increment use count
    await pool.query(
      'UPDATE cerilas_tools SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() WHERE slug = $1',
      [slug]
    );

    const updatedQuota = {
      allowed: quota.remaining - 1 > 0,
      limit: quota.limit,
      used: quota.used + 1,
      remaining: Math.max(0, quota.remaining - 1),
      resetInMinutes: quota.resetInMinutes || 60
    };

    res.json({ status: 'success', quota: updatedQuota });
  } catch (error) {
    console.error('Error consuming AI quota:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process AI quota' });
  }
});



// Dynamic XML Sitemap for Scraped EU & Cascade Funding Opportunities
app.get('/sitemap-grants.xml', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT slug, last_scraped_at, last_changed_at, first_scraped_at
      FROM funding_opportunities
      WHERE status = 'open' AND slug IS NOT NULL
      ORDER BY last_scraped_at DESC
    `);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const row of result.rows) {
      const date = (row.last_changed_at || row.last_scraped_at || row.first_scraped_at || new Date()).toISOString().slice(0, 10);
      xml += `  <url>\n`;
      xml += `    <loc>https://tools.cerilas.com/tool/eu-funding-opportunities/${row.slug}</loc>\n`;
      xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Error generating grants sitemap:', err.message);
    res.status(500).send('Error generating sitemap');
  }
});

app.get(['/llms.txt', '/llm.txt'], (req, res) => {
  const llmsPath = path.join(distPath, 'llms.txt');
  if (fs.existsSync(llmsPath)) {
    res.type('text/plain');
    return res.sendFile(llmsPath);
  }
  const publicLlms = path.join(__dirname, '..', 'public', 'llms.txt');
  if (fs.existsSync(publicLlms)) {
    res.type('text/plain');
    return res.sendFile(publicLlms);
  }
  res.status(404).send('llms.txt not found');
});

// Full SSR Pre-rendering Engine for Tool Pages, Category Hubs & Googlebot Crawlers
app.get('{*path}', async (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  try {
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('Not found');
    }
    let html = await fs.promises.readFile(indexPath, 'utf-8');

    // 1. Admin routes: Strictly noindex, nofollow
    if (req.path === '/admin' || req.path.startsWith('/admin/') || req.path === '/reset-password') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.setHeader('Referrer-Policy', 'no-referrer');
      html = html.replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>');
      return res.send(html);
    }

    // 2. Check if URL matches an individual grant opportunity sub-path
    const grantMatch = req.path.match(/^\/tool\/eu-funding-opportunities\/([a-zA-Z0-9_-]+)\/?$/);
    if (grantMatch) {
      const grantSlug = grantMatch[1];
      try {
        const grantRes = await pool.query(
          `SELECT id, title, slug, seo_title, meta_description, meta_keywords, schema_json, short_description 
           FROM funding_opportunities 
           WHERE slug = $1 OR external_id = $1 LIMIT 1`,
          [grantSlug]
        );
        if (grantRes.rows.length > 0) {
          const opp = grantRes.rows[0];
          const canonicalUrl = `https://tools.cerilas.com/tool/eu-funding-opportunities/${opp.slug}`;
          const ogImg = 'https://tools.cerilas.com/tool-icons/eu-funding-opportunities.webp';
          const pageTitle = opp.seo_title || `${opp.title} | EU Horizon Grants`;
          const pageDesc = opp.meta_description || opp.short_description || `Apply for ${opp.title} on Cerilas Tools.`;
          const pageKeywords = opp.meta_keywords || 'EU funding, Horizon Europe, Cascade funding, grants 2026';

          html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);
          const metaTags = [
            `<meta name="description" content="${pageDesc.replace(/"/g, '&quot;')}" />`,
            `<meta name="keywords" content="${pageKeywords.replace(/"/g, '&quot;')}" />`,
            `<meta name="robots" content="index, follow" />`,
            `<link rel="canonical" href="${canonicalUrl}" />`,
            `<meta property="og:type" content="article" />`,
            `<meta property="og:title" content="${pageTitle.replace(/"/g, '&quot;')}" />`,
            `<meta property="og:description" content="${pageDesc.replace(/"/g, '&quot;')}" />`,
            `<meta property="og:url" content="${canonicalUrl}" />`,
            `<meta property="og:image" content="${ogImg}" />`,
            `<meta name="twitter:card" content="summary_large_image" />`,
            `<meta name="twitter:title" content="${pageTitle.replace(/"/g, '&quot;')}" />`,
            `<meta name="twitter:description" content="${pageDesc.replace(/"/g, '&quot;')}" />`,
            `<meta name="twitter:image" content="${ogImg}" />`,
            opp.schema_json ? `<script type="application/ld+json">\n    ${JSON.stringify(opp.schema_json, null, 2)}\n    </script>` : ''
          ].filter(Boolean).join('\n    ');

          html = html.replace('</head>', `    ${metaTags}\n  </head>`);
          return res.send(html);
        }
      } catch (err) {
        console.warn('Error fetching grant SEO metadata for SSR:', err.message);
      }
    }

    // 3. Tool page SSR pre-rendering (/tool/:slug)
    const toolMatch = req.path.match(/^\/tool\/([a-zA-Z0-9_-]+)\/?$/);
    if (toolMatch) {
      const slug = toolMatch[1].toLowerCase();

      // Asynchronously track crawler visits for SEO analytics
      const botInfo = detectBot(req);
      if (botInfo.isBot) {
        pool.query(
          'UPDATE cerilas_tools SET bot_view_count = COALESCE(bot_view_count, 0) + 1 WHERE slug = $1',
          [slug]
        ).catch(() => {});

        const ctx = getRequestContext(req);
        pool.query(
          `INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata, is_bot, bot_name, client_type, user_agent, country, device_type)
           VALUES ($1, 'crawler_visit', $2, $3, true, $4, $5, $6, $7, 'bot')`,
          [
            slug,
            botInfo.botName || 'crawler',
            JSON.stringify({ ip: ctx.ip }),
            botInfo.botName,
            botInfo.category,
            ctx.userAgent || null,
            ctx.country
          ]
        ).catch(() => {});
      }

      // Pre-render semantic HTML body and dynamic <head> tags
      html = renderToolPageHtml(html, slug);
      return res.send(html);
    }

    // 4. Legal Compliance pages SSR pre-rendering (/terms, /privacy, /refund, /cookies, /legal/:slug)
    const legalRouteMap = {
      'terms': 'terms',
      'terms-of-service': 'terms',
      'privacy': 'privacy',
      'privacy-policy': 'privacy',
      'refund': 'refund',
      'refund-policy': 'refund',
      'cancellation-refund': 'refund',
      'cookies': 'cookies',
      'cookie-policy': 'cookies'
    };

    let targetLegalSlug = null;
    if (req.path.startsWith('/legal/')) {
      const sub = req.path.replace(/^\/legal\//, '').replace(/\/+$/, '').toLowerCase();
      if (legalRouteMap[sub]) targetLegalSlug = legalRouteMap[sub];
    } else {
      const cleanReq = req.path.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (legalRouteMap[cleanReq]) targetLegalSlug = legalRouteMap[cleanReq];
    }

    if (targetLegalSlug) {
      html = renderLegalPageHtml(html, targetLegalSlug);
      return res.send(html);
    }

    // 4a. GrowthControl landing SSR (/growth); signed-in app routes are noindex
    const normalizedPath = req.path.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (normalizedPath === 'growth' || normalizedPath.startsWith('growth/')) {
      html = renderGrowthPageHtml(html, { isAppRoute: normalizedPath !== 'growth' });
      return res.send(html);
    }

    // 4b. Pricing page SSR pre-rendering (/pricing)
    if (normalizedPath === 'pricing') {
      html = renderPricingPageHtml(html);
      return res.send(html);
    }

    // 5. Category page SSR pre-rendering (e.g. /research-tools, /ai-tools, etc.)
    const cleanPath = req.path.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (CATEGORIES[cleanPath]) {
      html = renderCategoryPageHtml(html, cleanPath);
      return res.send(html);
    }

    // 6. Homepage SSR pre-rendering
    if (req.path === '/' || req.path === '') {
      html = renderHomePageHtml(html);
      return res.send(html);
    }

    // Default fallback: send client template
    res.send(html);
  } catch (err) {
    console.error('Error rendering HTML with SEO:', err);
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

app.listen(PORT, async () => {
  try {
    // 1. Ensure tools table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cerilas_tools (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        short_description TEXT,
        icon_name VARCHAR(100),
        cover_image_url TEXT,
        target_url TEXT,
        seo_title VARCHAR(255),
        seo_description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        category VARCHAR(100) DEFAULT 'General',
        view_count INTEGER DEFAULT 0,
        use_count INTEGER DEFAULT 0,
        last_used_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Add columns if table already existed without them
    await pool.query(`
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS unique_visitors_count INTEGER DEFAULT 0;
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS copy_count INTEGER DEFAULT 0;
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0;
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP DEFAULT NOW();
    `);

    // 3. Ensure tool_unique_visitors table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_unique_visitors (
        id SERIAL PRIMARY KEY,
        tool_slug VARCHAR(255) NOT NULL,
        visitor_id VARCHAR(100) NOT NULL,
        first_visited_at TIMESTAMP DEFAULT NOW(),
        last_visited_at TIMESTAMP DEFAULT NOW(),
        view_count INTEGER DEFAULT 1,
        UNIQUE(tool_slug, visitor_id)
      );
      CREATE INDEX IF NOT EXISTS idx_unique_visitors_slug ON tool_unique_visitors(tool_slug);
    `);

    // 4. Ensure tool_usage_events table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_usage_events (
        id SERIAL PRIMARY KEY,
        tool_slug VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        visitor_id VARCHAR(100),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tool_events_slug ON tool_usage_events(tool_slug);
    `);
    await ensureToolAnalyticsSchema();

    // 5. Ensure core tools exist in database
    await pool.query(`
      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'QR Code Generator',
        'qr-code-generator',
        'Generate high-resolution custom QR codes for URLs, text, Wi-Fi, vCard, and email with sleek Apple styling.',
        'QrCode',
        '#/tool/qr-code-generator',
        'Free QR Code Generator That Never Expires (No Sign-Up) | 100% Free Unlimited Scans',
        '100% free permanent QR code generator that never expires. Zero sign-up, no subscriptions, unlimited lifetime scans.',
        'Generator',
        1,
        true
      ) ON CONFLICT (slug) DO NOTHING;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'Image Compressor',
        'image-compressor',
        'Lossless & high-efficiency in-browser image compression with zero server uploads. Supports JPG, PNG, WebP, AVIF, and SVG with instant batch export.',
        'Minimize2',
        '#/tool/image-compressor',
        'Free Image Compressor Without Quality Loss (No Upload Limit) | Cerilas Tools',
        '100% free client-side image compressor. Compress JPG, PNG, WebP, AVIF, and SVG without quality loss or server storage. Batch compress and download as ZIP.',
        'Optimizer',
        2,
        true
      ) ON CONFLICT (slug) DO NOTHING;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'Pomodoro Timer',
        'pomodoro-timer',
        'Minimalist in-browser Pomodoro timer with fluid wave animation, acoustic alert sounds, and customizable focus & break intervals.',
        'Clock',
        '#/tool/pomodoro-timer',
        'Free Online Pomodoro Timer with Fluid Wave & Sound Alerts | Cerilas Tools',
        'Free aesthetic in-browser Pomodoro timer with dynamic fluid wave physics and customizable intervals.',
        'Productivity',
        3,
        true
      ) ON CONFLICT (slug) DO NOTHING;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'PDF Compressor',
        'pdf-compressor',
        'Compress PDF documents locally in your browser with zero server uploads. Multi-level compression presets, visual page 1 thumbnails, and batch ZIP export.',
        'FileText',
        '#/tool/pdf-compressor',
        'Free Online PDF Compressor (100% In-Browser Privacy, No Upload Limit) | Cerilas Tools',
        'Compress PDF files directly in your web browser with zero server uploads and total privacy.',
        'Document Utility',
        4,
        true
      ) ON CONFLICT (slug) DO NOTHING;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'ATS Resume Checker',
        'ats-resume-checker',
        'AI-powered ATS Resume Checker & Scanner. Match your resume against any job description, detect missing keywords, and get ATS formatting suggestions.',
        'FileCheck',
        '#/tool/ats-resume-checker',
        'Free AI ATS Resume Checker (2026) – Test CV Bot Readability & Job Match | Cerilas Tools',
        '100% free AI ATS resume checker & PDF bot scanner. Upload your CV to inspect machine readability, calculate job description match percentage, and discover missing keywords without server uploads.',
        'Career & HR',
        5,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'Background Remover',
        'background-remover',
        '100% free in-browser AI background remover. Cut out portraits, products, and logos instantly with zero server uploads and transparent HD PNG export.',
        'Sparkles',
        '#/tool/background-remover',
        'Free AI Background Remover (100% In-Browser Privacy, HD PNG) | Cerilas Tools',
        'Remove image backgrounds online for free with zero server uploads. 100% private in-browser AI cutout for portraits, Amazon/Shopify products, and graphics. Export transparent HD PNG.',
        'Optimizer',
        6,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'PDF → RAG Cleaner',
        'pdf-rag-cleaner',
        'Transform raw, messy PDFs into clean Markdown, structured JSON chunks, and rich metadata ready for LangChain, LlamaIndex, OpenAI, and vector database embeddings.',
        'Database',
        '#/tool/pdf-rag-cleaner',
        'Free PDF to RAG Cleaner & Markdown Converter (2026) – Clean Chunks for LangChain, LlamaIndex & Vector DBs | Cerilas Tools',
        'Convert messy PDFs into clean Markdown and structured RAG JSON chunks with metadata for LLM vector embeddings. Strips headers/footers, repairs hyphenation, and estimates tokens 100% in-browser with zero uploads.',
        'AI Assisted',
        7,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'AI Content Detector',
        'ai-content-detector',
        'Free AI text & PDF detector. Scores probability from 0 to 100% and analyzes pros & cons (AI vs Human markers, burstiness, and perplexity) with 100% in-browser PDF extraction.',
        'Cpu',
        '#/tool/ai-content-detector',
        'Free AI Content Detector (2026) – Text & PDF Scanner with 0-100% Score & Pros/Cons | Cerilas Tools',
        'Free AI Content Detector and PDF scanner. Accurately detect ChatGPT-4o, Claude 3.5 Sonnet, Gemini, and DeepSeek text with 0-100% scores, burstiness & perplexity metrics, and itemized Pros & Cons. 100% private in-browser analysis.',
        'AI Assisted',
        8,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'PDF Editor',
        'pdf-editor',
        'Edit PDF text, add digital signatures, redact sensitive data, reorder, rotate, and organize pages 100% locally in your browser.',
        'PenTool',
        '#/tool/pdf-editor',
        'Free Online PDF Editor (2026) – Edit Text, Add Signature, Redact & Organize Pages | Cerilas Tools',
        'Edit PDF documents online for free with 100% client-side privacy. Add text, draw digital signatures, redact sensitive info, rotate, reorder, and delete pages. No file uploads, no signup, no watermark.',
        'Document & PDF',
        9,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'Video Compressor',
        'video-compressor',
        'Compress MP4, WebM, and MOV videos 100% locally in your browser. Multi-level quality presets, trimming, audio muting, side-by-side comparison player, and zero file limits.',
        'Video',
        '#/tool/video-compressor',
        'Free Online Video Compressor (100% In-Browser Privacy, No Upload Limit) | Cerilas Tools',
        'Compress MP4, WebM, and MOV video files directly in your web browser with zero server uploads and total privacy. Reduce video size up to 85% for Discord, WhatsApp, email, and web publishing with zero file limits.',
        'Optimizer',
        10,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'Webhook Tester',
        'webhook-tester',
        'Test, inspect, and debug incoming webhooks in real time with unique live URLs. Inspect headers, payloads, query parameters, replay requests, and simulate mock Stripe/GitHub webhooks.',
        'Webhook',
        '#/tool/webhook-tester',
        'Free Online Webhook Tester & Debugger (2026) – Real-Time HTTP Request Inspector | Cerilas Tools',
        'Inspect and debug HTTP webhooks in real time with unique temporary URLs. Test Stripe, GitHub, Shopify, Discord, and Slack webhooks with headers, payloads, custom response rules, and built-in mock dispatcher.',
        'Developer Tool',
        11,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'YouTube Thumbnail Downloader',
        'youtube-thumbnail-downloader',
        'Download full-resolution 4K, HD (1080p), and WebP thumbnails from any YouTube video or Shorts URL. Instant direct download, metadata inspection, and copy embed code.',
        'Video',
        '#/tool/youtube-thumbnail-downloader',
        'Free YouTube Thumbnail Downloader (4K, 1080p HD & Shorts) | Cerilas Tools',
        'Download YouTube video and Shorts thumbnails in maximum 4K (1920x1080), High Definition (1280x720), and WebP resolution for free. No watermark, instant one-click download, and responsive HTML embed generator.',
        'Media & Video',
        14,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        title = EXCLUDED.title,
        short_description = EXCLUDED.short_description,
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'Universal Token Counter',
        'token-counter-universal',
        'Calculate real-time token counts, context window usage, and API pricing for text and files (PDF, Code, Docs) across GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, DeepSeek-V3, and Llama 3.',
        'Binary',
        '#/tool/token-counter-universal',
        'Free Universal Token Counter (2026) – GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, DeepSeek & Llama | Cerilas Tools',
        'Calculate tokens, context window capacity, and API costs for text and documents (PDF, Code, TXT) across GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, Gemini 3.1 Pro, DeepSeek-V3, Grok 3, and Llama 3. Interactive color-coded visualizer.',
        'AI Assisted',
        15,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        title = EXCLUDED.title,
        short_description = EXCLUDED.short_description,
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'TRL Calculator (Technology Readiness Level)',
        'trl-calculator',
        'Interactive TRL Calculator for R&D projects and researchers. Assess Technology Readiness Level (TRL 1-9) across Horizon Europe, NASA, DeepTech SRL, and TUBITAK with gap analysis and grant matching.',
        'Gauge',
        '#/tool/trl-calculator',
        'Free TRL Calculator (1-9) – Technology Readiness Level Assessment for R&D & Grants | Cerilas Tools',
        'Calculate your R&D project Technology Readiness Level (TRL 1 to 9) accurately. Interactive diagnostic questionnaire for Horizon Europe, NASA ISO 16290, Software SRL, and TUBITAK R&D programs with grant eligibility and gap analysis roadmap.',
        'R&D & Engineering',
        16,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        title = EXCLUDED.title,
        short_description = EXCLUDED.short_description,
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description,
        category = EXCLUDED.category;

      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, target_url, seo_title, seo_description, category, sort_order, is_active
      ) VALUES (
        'EU & Cascade Funding Opportunities',
        'eu-funding-opportunities',
        'Explore 660+ active European Commission calls, Horizon Europe research grants, and Cascade Funding (FSTP) equity-free lump-sum sub-grants for startups, SMEs, and researchers.',
        'Compass',
        '#/tool/eu-funding-opportunities',
        'EU Funding & Cascade Funding Opportunities (2026) – Live Horizon Europe & FSTP Grants | Cerilas Tools',
        'Search and filter 660+ open European Commission calls, Horizon Europe grants, EIC sub-grants, and Cascade Funding (FSTP) opportunities. Free directory with deadline trackers and eligibility guides for startups, SMEs, and researchers.',
        'R&D & Engineering',
        17,
        true
      ) ON CONFLICT (slug) DO UPDATE SET 
        title = EXCLUDED.title,
        short_description = EXCLUDED.short_description,
        seo_title = EXCLUDED.seo_title, 
        seo_description = EXCLUDED.seo_description,
        category = EXCLUDED.category;
    `);

    console.log('Database tables & migrations verified successfully.');

    // Initialize Funding & Matcher Scraper tables
    await initScrapersDb();

    // Initialize MCP User Connections tables
    await initMcpDb();

    // Initialize Cerilas Growth SaaS tables
    await initGrowthDb();
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
  console.log(`Tools API server running on http://localhost:${PORT}`);
});
