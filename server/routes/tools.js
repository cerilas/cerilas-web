import { Router } from 'express';
import pool from '../db.js';
import { checkAiRateLimit, getClientIp } from '../utils/aiRateLimit.js';

const router = Router();

// 1. Central stats overview endpoint (must precede /:slug)
router.get('/stats/overview', async (req, res) => {
  try {
    const toolsResult = await pool.query(`
      SELECT 
        id, title, slug, category, 
        COALESCE(view_count, 0) as view_count, 
        COALESCE(unique_visitors_count, 0) as unique_visitors_count,
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
        COALESCE(SUM(download_count), 0)::int as total_downloads,
        COALESCE(SUM(copy_count), 0)::int as total_copies,
        COALESCE(SUM(use_count), 0)::int as total_uses,
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

    const eventBreakdown = await pool.query(`
      SELECT event_type, COUNT(*)::int as count 
      FROM tool_usage_events 
      GROUP BY event_type 
      ORDER BY count DESC
    `);

    const recentEvents = await pool.query(`
      SELECT e.id, e.tool_slug, t.title as tool_title, e.event_type, e.visitor_id, e.metadata, e.created_at
      FROM tool_usage_events e
      LEFT JOIN cerilas_tools t ON t.slug = e.tool_slug
      ORDER BY e.created_at DESC
      LIMIT 15
    `);

    res.json({
      status: 'success',
      data: {
        summary: totalsResult.rows[0] || { 
          total_tools: 0, 
          active_tools: 0, 
          total_views: 0, 
          total_unique_visitors: 0,
          total_downloads: 0, 
          total_copies: 0,
          total_uses: 0,
          overall_download_cvr: 0,
          overall_total_cvr: 0
        },
        tools: toolsResult.rows,
        eventTypes: eventBreakdown.rows,
        recentEvents: recentEvents.rows
      }
    });
  } catch (error) {
    console.error('Error fetching stats overview:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
  }
});

// 2. All active tools endpoint
router.get('/', async (req, res) => {
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

// 3. AI Quota check endpoint
router.get('/:slug/ai-quota', async (req, res) => {
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

// 4. Consume AI quota endpoint
router.post('/:slug/consume-ai-quota', async (req, res) => {
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

    await pool.query(
      'INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata) VALUES ($1, $2, $3, $4)',
      [slug, 'ai_scan', visitorId || null, JSON.stringify({ ...metadata, ip: clientIp })]
    );

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

// 5. Track event and update statistics
router.post('/:slug/event', async (req, res) => {
  try {
    const { slug } = req.params;
    const { eventType, visitorId, metadata = {} } = req.body;

    if (!eventType) {
      return res.status(400).json({ status: 'error', message: 'eventType is required' });
    }

    await pool.query(
      'INSERT INTO tool_usage_events (tool_slug, event_type, visitor_id, metadata) VALUES ($1, $2, $3, $4)',
      [slug, eventType, visitorId || null, JSON.stringify(metadata)]
    );

    if (eventType === 'view') {
      await pool.query(
        'UPDATE cerilas_tools SET view_count = COALESCE(view_count, 0) + 1 WHERE slug = $1',
        [slug]
      );

      if (visitorId) {
        const uniqueRes = await pool.query(
          `INSERT INTO tool_unique_visitors (tool_slug, visitor_id)
           VALUES ($1, $2)
           ON CONFLICT (tool_slug, visitor_id)
           DO UPDATE SET last_seen_at = NOW(), visit_count = tool_unique_visitors.visit_count + 1
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
      await pool.query(
        `UPDATE cerilas_tools 
         SET download_count = COALESCE(download_count, 0) + 1, 
             use_count = COALESCE(use_count, 0) + 1, 
             last_used_at = NOW() 
         WHERE slug = $1`,
        [slug]
      );
    } else if (eventType === 'copy') {
      await pool.query(
        `UPDATE cerilas_tools 
         SET copy_count = COALESCE(copy_count, 0) + 1, 
             use_count = COALESCE(use_count, 0) + 1, 
             last_used_at = NOW() 
         WHERE slug = $1`,
        [slug]
      );
    } else {
      await pool.query(
        'UPDATE cerilas_tools SET use_count = COALESCE(use_count, 0) + 1, last_used_at = NOW() WHERE slug = $1',
        [slug]
      );
    }

    const statsRes = await pool.query(
      'SELECT view_count, unique_visitors_count, download_count, copy_count, use_count FROM cerilas_tools WHERE slug = $1',
      [slug]
    );
    const stats = statsRes.rows[0] || {};

    res.json({ 
      status: 'success', 
      message: 'Event tracked successfully',
      stats
    });
  } catch (error) {
    console.error('Error tracking tool event:', error);
    res.status(500).json({ status: 'error', message: 'Failed to track event' });
  }
});

// 6. Single tool by slug endpoint
router.get('/:slug', async (req, res) => {
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

export default router;
