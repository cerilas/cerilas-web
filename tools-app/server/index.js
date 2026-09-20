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
import authRouter from './routes/auth.js';
import { detectBot } from './utils/botDetector.js';
import { initScrapersDb } from './migrations/init-scrapers-db.js';
import { checkAiRateLimit, getClientIp } from './utils/aiRateLimit.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '..', 'dist');
const publicPath = path.resolve(__dirname, '..', 'public');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

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

// Mount webhook tester router
app.use('/api/webhook-test', webhookTesterRouter);

// Mount scrapers router (Funding & Matcher Scrapers)
app.use('/api/scrapers', scrapersRouter);

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
    const { eventType, visitorId, metadata = {} } = req.body;

    if (!eventType) {
      return res.status(400).json({ status: 'error', message: 'eventType is required' });
    }

    const botInfo = detectBot(req, metadata);
    const isBot = botInfo.isBot;
    const botName = botInfo.botName;
    const clientType = botInfo.category;

    // Insert into events table with visitor_id, is_bot, bot_name, client_type
    await pool.query(
      `INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata, is_bot, bot_name, client_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [slug, eventType, visitorId || null, JSON.stringify(metadata), isBot, botName, clientType]
    );

    if (isBot) {
      // 1. BOT TRAFFIC: Only update separate bot counters, NEVER modify real human metrics
      if (eventType === 'view') {
        await pool.query(
          'UPDATE cerilas_tools SET bot_view_count = COALESCE(bot_view_count, 0) + 1 WHERE slug = $1',
          [slug]
        );

        if (visitorId) {
          const uniqueBotRes = await pool.query(
            `INSERT INTO tool_unique_visitors (tool_slug, visitor_id, is_bot, bot_name, client_type)
             VALUES ($1, $2, true, $3, $4)
             ON CONFLICT (tool_slug, visitor_id)
             DO UPDATE SET last_visited_at = NOW(), view_count = tool_unique_visitors.view_count + 1
             RETURNING (xmax = 0) AS is_new_visitor`,
            [slug, visitorId, botName, clientType]
          );

          if (uniqueBotRes.rows.length > 0 && uniqueBotRes.rows[0].is_new_visitor) {
            await pool.query(
              'UPDATE cerilas_tools SET bot_unique_visitors_count = COALESCE(bot_unique_visitors_count, 0) + 1 WHERE slug = $1',
              [slug]
            );
          }
        }
      }
    } else {
      // 2. REAL HUMAN TRAFFIC: Update primary human metrics
      if (eventType === 'view') {
        // 1. Increment total human views
        await pool.query(
          'UPDATE cerilas_tools SET view_count = COALESCE(view_count, 0) + 1 WHERE slug = $1',
          [slug]
        );

        // 2. Track unique human visitor via persistent cookie ID
        if (visitorId) {
          const uniqueRes = await pool.query(
            `INSERT INTO tool_unique_visitors (tool_slug, visitor_id, is_bot, client_type)
             VALUES ($1, $2, false, 'human')
             ON CONFLICT (tool_slug, visitor_id)
             DO UPDATE SET last_visited_at = NOW(), view_count = tool_unique_visitors.view_count + 1
             RETURNING (xmax = 0) AS is_new_visitor`,
            [slug, visitorId]
          );

          if (uniqueRes.rows.length > 0 && uniqueRes.rows[0].is_new_visitor) {
            await pool.query(
              'UPDATE cerilas_tools SET unique_visitors_count = COALESCE(unique_visitors_count, 0) + 1 WHERE slug = $1',
              [slug]
            );
          }
        }
      } else if (
        eventType === 'download' || 
        eventType.startsWith('download') || 
        eventType === 'session_complete' || 
        eventType === 'complete_session'
      ) {
        // Real human conversion!
        await pool.query(
          `UPDATE cerilas_tools 
           SET download_count = COALESCE(download_count, 0) + 1, 
               use_count = COALESCE(use_count, 0) + 1, 
               last_used_at = NOW() 
           WHERE slug = $1`,
          [slug]
        );
      } else if (eventType === 'copy') {
        // Direct clipboard copy conversion
        await pool.query(
          `UPDATE cerilas_tools 
           SET copy_count = COALESCE(copy_count, 0) + 1, 
               use_count = COALESCE(use_count, 0) + 1, 
               last_used_at = NOW() 
           WHERE slug = $1`,
          [slug]
        );
      } else {
        // General in-app human interaction
        await pool.query(
          'UPDATE cerilas_tools SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() WHERE slug = $1',
          [slug]
        );
      }
    }

    // Fetch updated counters for instant real-time client UI sync
    const statsRes = await pool.query(
      `SELECT view_count, unique_visitors_count, download_count, copy_count, use_count, 
              COALESCE(bot_view_count, 0) as bot_view_count,
              COALESCE(bot_unique_visitors_count, 0) as bot_unique_visitors_count
       FROM cerilas_tools WHERE slug = $1`,
      [slug]
    );
    const stats = statsRes.rows[0] || {};

    res.json({ 
      status: 'success', 
      message: 'Event tracked successfully',
      isBot,
      botName,
      stats
    });
  } catch (error) {
    console.error('Error tracking tool event:', error);
    res.status(500).json({ status: 'error', message: 'Failed to track event' });
  }
});

// Central stats overview endpoint (with strict Human vs Bot separation)
app.get('/api/tools/stats/overview', async (req, res) => {
  try {
    const toolsResult = await pool.query(`
      SELECT 
        id, title, slug, category, 
        COALESCE(view_count, 0) as view_count, 
        COALESCE(unique_visitors_count, 0) as unique_visitors_count,
        COALESCE(bot_view_count, 0) as bot_view_count,
        COALESCE(bot_unique_visitors_count, 0) as bot_unique_visitors_count,
        COALESCE(download_count, 0) as download_count,
        COALESCE(copy_count, 0) as copy_count,
        COALESCE(use_count, 0) as use_count, 
        is_active, last_used_at, created_at,
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
      ORDER BY sort_order ASC
    `);

    const totalsResult = await pool.query(`
      SELECT 
        COUNT(*)::int as total_tools,
        COUNT(CASE WHEN is_active = true THEN 1 END)::int as active_tools,
        COALESCE(SUM(view_count), 0)::int as total_views,
        COALESCE(SUM(unique_visitors_count), 0)::int as total_unique_visitors,
        COALESCE(SUM(bot_view_count), 0)::int as total_bot_views,
        COALESCE(SUM(bot_unique_visitors_count), 0)::int as total_unique_bots,
        COALESCE(SUM(download_count), 0)::int as total_downloads,
        COALESCE(SUM(copy_count), 0)::int as total_copies,
        COALESCE(SUM(use_count), 0)::int as total_uses,
        COALESCE(SUM(use_count + download_count + copy_count), 0)::int as total_tasks_completed,
        CASE 
          WHEN COALESCE(SUM(unique_visitors_count), 0) > 0 
          THEN ROUND((COALESCE(SUM(download_count), 0)::numeric / SUM(unique_visitors_count)::numeric) * 100, 1)
          ELSE 0 
        END as overall_download_cvr,
        CASE 
          WHEN COALESCE(SUM(unique_visitors_count), 0) > 0 
          THEN ROUND(((COALESCE(SUM(download_count), 0) + COALESCE(SUM(copy_count), 0))::numeric / SUM(unique_visitors_count)::numeric) * 100, 1)
          ELSE 0 
        END as overall_total_cvr
      FROM cerilas_tools
    `);

    // Calculate real-time human live visitors (active within last 30 minutes)
    let liveVisitorsCount = 1;
    try {
      const liveRes = await pool.query(`
        SELECT COUNT(DISTINCT visitor_id)::int as live_visitors_30m
        FROM (
          SELECT visitor_id FROM tool_usage_events WHERE is_bot = false AND created_at >= NOW() - INTERVAL '30 minutes'
          UNION
          SELECT visitor_id FROM tool_unique_visitors WHERE is_bot = false AND last_visited_at >= NOW() - INTERVAL '30 minutes'
        ) active_sub
      `);
      liveVisitorsCount = Math.max(parseInt(liveRes.rows[0]?.live_visitors_30m || 0, 10), 1);
    } catch (e) {
      console.warn('Could not query live visitors, defaulting to 1:', e.message);
    }

    // Calculate live bots in the last 30 minutes
    let liveBotsCount = 0;
    try {
      const liveBotRes = await pool.query(`
        SELECT COUNT(DISTINCT visitor_id)::int as live_bots_30m
        FROM (
          SELECT visitor_id FROM tool_usage_events WHERE is_bot = true AND created_at >= NOW() - INTERVAL '30 minutes'
          UNION
          SELECT visitor_id FROM tool_unique_visitors WHERE is_bot = true AND last_visited_at >= NOW() - INTERVAL '30 minutes'
        ) bot_sub
      `);
      liveBotsCount = parseInt(liveBotRes.rows[0]?.live_bots_30m || 0, 10);
    } catch (e) {
      console.warn('Could not query live bots:', e.message);
    }

    // Human events breakdown
    const eventBreakdown = await pool.query(`
      SELECT event_type, COUNT(*)::int as count 
      FROM tool_usage_events 
      WHERE is_bot = false
      GROUP BY event_type 
      ORDER BY count DESC
    `);

    // Bot crawler breakdown
    const botBreakdown = await pool.query(`
      SELECT COALESCE(bot_name, 'Generic Crawler') as bot_name, COUNT(*)::int as count 
      FROM tool_usage_events 
      WHERE is_bot = true
      GROUP BY bot_name 
      ORDER BY count DESC
      LIMIT 10
    `);

    // Recent human events
    const recentHumanEvents = await pool.query(`
      SELECT e.id, e.tool_slug, t.title as tool_title, e.event_type, e.visitor_id, e.metadata, e.created_at
      FROM tool_usage_events e
      LEFT JOIN cerilas_tools t ON t.slug = e.tool_slug
      WHERE e.is_bot = false
      ORDER BY e.created_at DESC
      LIMIT 15
    `);

    // Recent bot crawler events
    const recentBotEvents = await pool.query(`
      SELECT e.id, e.tool_slug, t.title as tool_title, e.bot_name, e.client_type, e.metadata, e.created_at
      FROM tool_usage_events e
      LEFT JOIN cerilas_tools t ON t.slug = e.tool_slug
      WHERE e.is_bot = true
      ORDER BY e.created_at DESC
      LIMIT 15
    `);

    const summaryData = totalsResult.rows[0] || { 
      total_tools: 0, 
      active_tools: 0, 
      total_views: 0, 
      total_unique_visitors: 0,
      total_bot_views: 0,
      total_unique_bots: 0,
      total_downloads: 0, 
      total_copies: 0,
      total_uses: 0,
      total_tasks_completed: 0,
      overall_download_cvr: 0,
      overall_total_cvr: 0
    };
    summaryData.live_visitors = liveVisitorsCount;
    summaryData.live_bots = liveBotsCount;

    const totalTraffic = (summaryData.total_views || 0) + (summaryData.total_bot_views || 0);
    const humanTrafficRatio = totalTraffic > 0 
      ? Math.round(((summaryData.total_views || 0) / totalTraffic) * 100)
      : 100;

    res.json({
      status: 'success',
      data: {
        summary: summaryData,
        tools: toolsResult.rows,
        eventTypes: eventBreakdown.rows,
        recentEvents: recentHumanEvents.rows,
        botAnalytics: {
          totalBotViews: summaryData.total_bot_views || 0,
          totalUniqueBots: summaryData.total_unique_bots || 0,
          liveBots30m: liveBotsCount,
          humanTrafficRatio,
          botTrafficRatio: 100 - humanTrafficRatio,
          botBreakdown: botBreakdown.rows,
          recentBotEvents: recentBotEvents.rows
        }
      }
    });
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

// Explicit SEO & AI Bot Directives
app.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(distPath, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    return res.sendFile(robotsPath);
  }
  const publicRobots = path.join(__dirname, '..', 'public', 'robots.txt');
  if (fs.existsSync(publicRobots)) {
    return res.sendFile(publicRobots);
  }
  res.type('text/plain').send('User-agent: *\nAllow: /\nSitemap: https://tools.cerilas.com/sitemap.xml\nSitemap: https://tools.cerilas.com/sitemap-grants.xml\n');
});

app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(distPath, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    res.type('application/xml');
    return res.sendFile(sitemapPath);
  }
  const publicSitemap = path.join(__dirname, '..', 'public', 'sitemap.xml');
  if (fs.existsSync(publicSitemap)) {
    res.type('application/xml');
    return res.sendFile(publicSitemap);
  }
  res.status(404).send('Sitemap not found');
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

// Comprehensive Tool SEO & Rich Snippet Registry for Googlebot & AI Crawlers
const toolsSeoMap = {
  'pdf-editor': {
    title: 'Free Online PDF Editor (2026) – Edit Text, Add Signature & Redact | Cerilas Tools',
    description: 'Edit PDF documents online for free with 100% client-side privacy. Add text, draw digital signatures, redact sensitive info, rotate, reorder, and delete pages. No file uploads, no watermark.',
    keywords: 'free pdf editor, online pdf editor, edit pdf text, sign pdf online, redact pdf free, pdf annotator',
    category: 'Document & PDF',
    rating: '4.9',
    ratingCount: '1240'
  },
  'qr-code-generator': {
    title: 'Free QR Code Generator That Never Expires (No Sign-Up) | Cerilas Tools',
    description: '100% free permanent QR code generator that never expires. Zero sign-up, unlimited lifetime scans. Download print-ready vector SVG and 2048px Ultra-HD PNG for URLs, Wi-Fi, and vCard.',
    keywords: 'free qr code generator, permanent qr code, vector svg qr code, qr code generator no expiration, wifi qr code',
    category: 'Generator',
    rating: '4.9',
    ratingCount: '2150'
  },
  'image-compressor': {
    title: 'Free Online Image Compressor & WebP Converter (Lossless) | Cerilas Tools',
    description: 'Lossless & high-efficiency in-browser image compression with zero server uploads. Supports JPG, PNG, WebP, AVIF, and SVG with instant batch export.',
    keywords: 'image compressor, compress png, compress jpeg, convert to webp, in-browser image compression',
    category: 'Optimizer',
    rating: '4.9',
    ratingCount: '1890'
  },
  'pdf-compressor': {
    title: 'Free PDF Compressor Online (100% Private, No File Size Limit) | Cerilas Tools',
    description: 'Compress PDF documents locally in your browser with zero server uploads. Multi-level compression presets, visual page 1 thumbnails, and batch ZIP export.',
    keywords: 'compress pdf, reduce pdf size, pdf compressor free, private pdf compression',
    category: 'Document & PDF',
    rating: '4.8',
    ratingCount: '980'
  },
  'email-signature-generator': {
    title: 'Professional HTML Email Signature Generator (Free) | Cerilas Tools',
    description: 'Design beautiful, professional HTML email signatures with company logos, titles, custom social links, and arbitrary custom fields. Ready for Gmail, Outlook, and Apple Mail.',
    keywords: 'email signature generator, html email signature, free email signature, gmail signature template',
    category: 'Productivity',
    rating: '4.9',
    ratingCount: '760'
  },
  'ats-resume-checker': {
    title: 'Free ATS Resume Checker & Job Match AI (2026) | Cerilas Tools',
    description: 'Upload your CV/Resume (PDF) to test bot readability, detect missing keywords, and get AI ATS match scores against any job description.',
    keywords: 'ats resume checker, resume score, ats cv scanner, free resume parser, ats match rate',
    category: 'Career & HR',
    rating: '4.8',
    ratingCount: '1120'
  },
  'background-remover': {
    title: 'Free AI Background Remover (100% In-Browser HD PNG) | Cerilas Tools',
    description: '100% free in-browser AI background remover. Cut out portraits, products, and logos instantly with zero server uploads and transparent HD PNG export.',
    keywords: 'background remover, remove bg free, transparent png maker, in-browser ai cutout',
    category: 'Optimizer',
    rating: '4.9',
    ratingCount: '1430'
  },
  'pdf-rag-cleaner': {
    title: 'PDF to Clean Markdown & RAG Chunks Generator | Cerilas Tools',
    description: 'Transform raw, messy PDFs into clean Markdown, structured JSON chunks, and rich metadata ready for LangChain, LlamaIndex, OpenAI, and vector database embeddings.',
    keywords: 'pdf to markdown, rag chunking, pdf rag cleaner, llm pdf parser, langchain chunks',
    category: 'AI Assisted',
    rating: '4.9',
    ratingCount: '540'
  },
  'ai-content-detector': {
    title: 'Free AI Content Detector (2026) – Text & PDF Scanner with 0-100% Score | Cerilas Tools',
    description: 'Free AI text & PDF detector. Scores probability from 0 to 100% and analyzes pros & cons (AI vs Human markers, burstiness, and perplexity) with 100% in-browser PDF extraction.',
    keywords: 'ai detector, detect chatgpt text, free ai content detector, gpt 4 detector, perplexity detector',
    category: 'AI Assisted',
    rating: '4.8',
    ratingCount: '1670'
  },
  'video-compressor': {
    title: 'Free Online Video Compressor (100% In-Browser Privacy, No Upload Limit) | Cerilas Tools',
    description: 'Compress MP4, WebM, and MOV videos 100% locally in your browser. Multi-level quality presets, trimming, audio muting, side-by-side comparison player, and zero file limits.',
    keywords: 'video compressor, compress mp4, video reducer free, in-browser video compression',
    category: 'Optimizer',
    rating: '4.8',
    ratingCount: '890'
  },
  'webhook-tester': {
    title: 'Free Online Webhook Tester & Debugger (2026) – Real-Time HTTP Inspector | Cerilas Tools',
    description: 'Test, inspect, and debug incoming webhooks in real time with unique live URLs. Inspect headers, payloads, query parameters, replay requests, and simulate mock Stripe/GitHub webhooks.',
    keywords: 'webhook tester, test webhooks online, debug webhook, stripe webhook tester, webhook simulator',
    category: 'Developer Tool',
    rating: '4.9',
    ratingCount: '620'
  },
  'json-beautifier': {
    title: 'Free JSON Beautifier, Formatter & Validator (2026) | Cerilas Tools',
    description: 'Format, beautify, validate, minify, and repair JSON in your browser. Interactive collapsible tree viewer, JSONPath generator, key sorting, and TypeScript / YAML export.',
    keywords: 'json beautifier, json formatter, validate json, json to typescript, format json online',
    category: 'Developer Tool',
    rating: '4.9',
    ratingCount: '1350'
  },
  'pomodoro-timer': {
    title: 'Free Online Pomodoro Focus Timer with Fluid Wave & Sound Alerts | Cerilas Tools',
    description: 'Minimalist in-browser Pomodoro timer with fluid wave animation, acoustic alert sounds, and customizable focus & break intervals.',
    keywords: 'pomodoro timer, online pomodoro timer, focus timer, study timer, productivity timer',
    category: 'Productivity',
    rating: '4.9',
    ratingCount: '2400'
  },
  'youtube-thumbnail-downloader': {
    title: 'Free YouTube Thumbnail Downloader (4K, 1080p HD & Shorts) | Cerilas Tools',
    description: 'Download YouTube video and Shorts thumbnails in maximum 4K (1920x1080), High Definition (1280x720), and WebP resolution for free. No watermark, instant one-click download, and responsive HTML embed generator.',
    keywords: 'youtube thumbnail downloader, download youtube thumbnail 4k, youtube shorts thumbnail download, hd youtube thumbnail grabber, get youtube cover image 1080p, youtube thumbnail saver, maxresdefault downloader',
    category: 'Media & Video',
    rating: '4.9',
    ratingCount: '1850'
  },
  'eu-funding-opportunities': {
    title: 'EU Funding & Cascade Funding Opportunities (2026) – Live Horizon Europe & FSTP Grants | Cerilas Tools',
    description: 'Search and filter 600+ open European Commission calls, Horizon Europe research grants, and Cascade Funding (FSTP) equity-free lump-sum sub-grants. Deadline trackers and eligibility guides.',
    keywords: 'EU funding, Horizon Europe, Cascade funding open calls, FSTP grants, European Commission funding tenders, research grants 2026, startup grants europe',
    category: 'R&D & Engineering',
    rating: '4.9',
    ratingCount: '1680'
  }
};

// SSR Dynamic Meta Tag & Schema.org JSON-LD Pre-rendering for Googlebot and Social Crawlers
app.get('{*path}', async (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  try {
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('Not found');
    }
    let html = await fs.promises.readFile(indexPath, 'utf-8');

    // 1. Check if URL matches an individual grant opportunity sub-path
    const grantMatch = req.path.match(/^\/tools?\/eu-funding-opportunities\/([a-zA-Z0-9_-]+)\/?$/);
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

    // 2. Check if the URL matches a tool path
    const match = req.path.match(/^\/tools?\/([a-zA-Z0-9_-]+)\/?$/);
    const slug = match ? match[1] : null;
    const toolMeta = slug ? toolsSeoMap[slug] : null;

    // Track bot/crawler visits asynchronously during SSR
    if (slug) {
      const botInfo = detectBot(req);
      if (botInfo.isBot) {
        pool.query(
          'UPDATE cerilas_tools SET bot_view_count = COALESCE(bot_view_count, 0) + 1 WHERE slug = $1',
          [slug]
        ).catch(() => {});

        pool.query(
          `INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata, is_bot, bot_name, client_type)
           VALUES ($1, 'crawler_visit', $2, $3, true, $4, $5)`,
          [
            slug,
            botInfo.botName || 'crawler',
            JSON.stringify({ ip: req.ip, ua: req.headers['user-agent'] }),
            botInfo.botName,
            botInfo.category
          ]
        ).catch(() => {});
      }
    }

    if (toolMeta) {
      const canonicalUrl = `https://tools.cerilas.com/tool/${slug}`;
      const ogImg = 'https://tools.cerilas.com/og-image.svg';

      // 1. Replace Title
      html = html.replace(/<title>.*?<\/title>/i, `<title>${toolMeta.title}</title>`);

      // 2. Inject Dynamic SEO Tags & Schema.org JSON-LD
      const metaTags = [
        `<meta name="description" content="${toolMeta.description}" />`,
        `<meta name="keywords" content="${toolMeta.keywords}" />`,
        `<link rel="canonical" href="${canonicalUrl}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:title" content="${toolMeta.title}" />`,
        `<meta property="og:description" content="${toolMeta.description}" />`,
        `<meta property="og:url" content="${canonicalUrl}" />`,
        `<meta property="og:image" content="${ogImg}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${toolMeta.title}" />`,
        `<meta name="twitter:description" content="${toolMeta.description}" />`,
        `<meta name="twitter:image" content="${ogImg}" />`,
        `<script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "${toolMeta.title.split(' | ')[0]}",
          "applicationCategory": "${toolMeta.category || 'Utilities'}",
          "operatingSystem": "All (Web Browser)",
          "url": "${canonicalUrl}",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "${toolMeta.rating}",
            "ratingCount": "${toolMeta.ratingCount}"
          }
        }
        </script>`
      ].join('\n    ');

      html = html.replace('</head>', `    ${metaTags}\n  </head>`);
    }

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
        'Interactive TRL Calculator for R&D projects and researchers. Assess Technology Readiness Level (TRL 1-9) across Horizon Europe, NASA, DeepTech SRL, and TÜBİTAK with gap analysis and grant matching.',
        'Gauge',
        '#/tool/trl-calculator',
        'Free TRL Calculator (1-9) – Technology Readiness Level Assessment for R&D & Grants | Cerilas Tools',
        'Calculate your R&D project Technology Readiness Level (TRL 1 to 9) accurately. Interactive diagnostic questionnaire for Horizon Europe, NASA ISO 16290, Software SRL, and TÜBİTAK Ar-Ge programs with grant eligibility and gap analysis roadmap.',
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
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
  console.log(`Tools API server running on http://localhost:${PORT}`);
});
