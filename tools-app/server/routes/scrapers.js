import express from 'express';
import pool from '../db.js';
import { scrapeCascadeFunding } from '../scrapers/cascadefunding.js';
import { scrapeEcFunding } from '../scrapers/ec_funding.js';

const router = express.Router();

const DOMAIN_MAPPING = {
  'ai & data': [
    'Digital, Industry & Space',
    'Information and Communication Technologies (ICT)',
    'Robotics and Automation'
  ],
  'cleantech & energy': [
    'Climate, Energy & Mobility',
    'Energy and Environment',
    'Circular Economy & Green Transition',
    'Circular Economy and Sustainability'
  ],
  'health & biotech': [
    'Health & Biotech',
    'Life Sciences and Health'
  ],
  'smart mobility': [
    'Transportation and Mobility',
    'Climate, Energy & Mobility',
    'Smart Cities'
  ],
  'bioeconomy & agrifood': [
    'Food, Bioeconomy & Natural Resources',
    'Agriculture and Food'
  ],
  'security & society': [
    'Security and Defense',
    'Digital Society and E-Inclusion',
    'Social Sciences and Humanities',
    'Public Policy and Governance'
  ],
  'digital & space': [
    'Digital, Industry & Space',
    'Space and Space Exploration',
    'Information and Communication Technologies (ICT)'
  ],
  'manufacturing & industry': [
    'Advanced Materials & Manufacturing',
    'Advanced Manufacturing and Industry',
    'Nanotechnology and Advanced Materials'
  ]
};

const BENEFICIARY_MAPPING = {
  'sme': ['SME', 'SMEs & Startups', 'sme'],
  'startups': ['Startups', 'SMEs & Startups', 'startups'],
  'universities': ['Universities & Academic Institutions', 'university', 'Universities'],
  'research organizations': ['Research Organizations', 'research organisation', 'research organization'],
  'individuals': ['Individuals', 'individuals', 'Individual Researchers'],
  'mid-caps': ['Mid-Caps', 'MidCaps', 'mid-caps', 'midcaps']
};

/**
 * 1. Get List of Configured Scraper Sources & Their Status
 */
router.get('/sources', async (req, res) => {
  try {
    // Query stats for Cascade Funding
    const cascadeStatsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_items,
        MAX(last_scraped_at) as last_scraped_at,
        MAX(last_changed_at) as last_changed_at
      FROM funding_opportunities
      WHERE source_key = 'cascadefunding'
    `);

    const cascadeLastRunRes = await pool.query(`
      SELECT * FROM scraper_runs
      WHERE source_key = 'cascadefunding'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    // Query stats for EU Funding & Tenders
    const ecStatsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_items,
        MAX(last_scraped_at) as last_scraped_at,
        MAX(last_changed_at) as last_changed_at
      FROM funding_opportunities
      WHERE source_key = 'ec_funding'
    `);

    const ecLastRunRes = await pool.query(`
      SELECT * FROM scraper_runs
      WHERE source_key = 'ec_funding'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const sources = [
      {
        key: 'cascadefunding',
        name: 'Cascade Funding Hub',
        url: 'https://cascadefunding.eu/open-calls/',
        description: 'Official European Commission Cascade Funding & Financial Support to Third Parties (FSTP) directory.',
        status: 'active',
        engine: 'Native Deterministic Scraper',
        change_detection: 'SHA-256 Content Hash',
        total_items: parseInt(cascadeStatsRes.rows[0]?.total_items || 0, 10),
        open_items: parseInt(cascadeStatsRes.rows[0]?.open_items || 0, 10),
        last_scraped_at: cascadeStatsRes.rows[0]?.last_scraped_at,
        last_changed_at: cascadeStatsRes.rows[0]?.last_changed_at,
        last_run: cascadeLastRunRes.rows[0] || null,
        webhook_path: '/api/scrapers/cascadefunding/webhook'
      },
      {
        key: 'ec_funding',
        name: 'EU Funding & Tenders Portal (SEDIA)',
        url: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals?isExactMatch=true&status=31094501,31094502&order=DESC&pageNumber=1&pageSize=50&sortBy=startDate',
        description: 'Official European Commission SEDIA Portal Calls for Proposals & Horizon Europe Grants directory.',
        status: 'active',
        engine: 'Native Deterministic REST API Scraper',
        change_detection: 'SHA-256 Content Hash',
        total_items: parseInt(ecStatsRes.rows[0]?.total_items || 0, 10),
        open_items: parseInt(ecStatsRes.rows[0]?.open_items || 0, 10),
        last_scraped_at: ecStatsRes.rows[0]?.last_scraped_at,
        last_changed_at: ecStatsRes.rows[0]?.last_changed_at,
        last_run: ecLastRunRes.rows[0] || null,
        webhook_path: '/api/scrapers/ec_funding/webhook'
      }
    ];

    res.json({ status: 'success', data: sources });
  } catch (err) {
    console.error('[API:Scrapers] Error getting sources:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 2. Get Scraped Funding Opportunities (Search, Filter, Pagination)
 */
router.get('/opportunities', async (req, res) => {
  try {
    const { 
      search = '', 
      status = 'all', 
      source = 'all',
      beneficiary = '', 
      domain = '',
      call_type = '',
      sort = 'deadline_asc',
      page = 1, 
      limit = 50 
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = [];
    const params = [];

    // Search query (title, short_description, domains)
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(title) LIKE $${params.length} OR 
        LOWER(short_description) LIKE $${params.length} OR 
        domains::text ILIKE $${params.length} OR
        technologies::text ILIKE $${params.length}
      )`);
    }

    // Status filter
    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    // Source filter (e.g. 'cascadefunding', 'ec_funding')
    if (source && source !== 'all') {
      params.push(source);
      conditions.push(`source_key = $${params.length}`);
    }

    // Beneficiary filter (e.g. 'SME', 'startups')
    if (beneficiary && beneficiary !== 'all') {
      const mapped = BENEFICIARY_MAPPING[beneficiary.toLowerCase().trim()];
      if (mapped && mapped.length > 0) {
        const benConditions = mapped.map((b) => {
          params.push(`%"${b}"%`);
          return `eligible_applicants::text ILIKE $${params.length}`;
        });
        conditions.push(`(${benConditions.join(' OR ')})`);
      } else {
        params.push(`%${beneficiary}%`);
        conditions.push(`eligible_applicants::text ILIKE $${params.length}`);
      }
    }

    // Domain filter
    if (domain && domain !== 'all') {
      const mapped = DOMAIN_MAPPING[domain.toLowerCase().trim()];
      if (mapped && mapped.length > 0) {
        const domainConditions = mapped.map((d) => {
          params.push(`%"${d}"%`);
          return `domains::text ILIKE $${params.length}`;
        });
        conditions.push(`(${domainConditions.join(' OR ')})`);
      } else {
        params.push(`%${domain}%`);
        conditions.push(`domains::text ILIKE $${params.length}`);
      }
    }

    // Call Type filter
    if (call_type && call_type !== 'all') {
      params.push(call_type);
      conditions.push(`call_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort order
    let orderByClause = 'ORDER BY deadline_date ASC NULLS LAST';
    if (sort === 'deadline_desc') orderByClause = 'ORDER BY deadline_date DESC NULLS LAST';
    if (sort === 'funding_desc') orderByClause = 'ORDER BY funding_raw_amount DESC NULLS LAST';
    if (sort === 'newest') orderByClause = 'ORDER BY first_scraped_at DESC';
    if (sort === 'title_asc') orderByClause = 'ORDER BY title ASC';

    // Count total query
    const countSql = `SELECT COUNT(*) FROM funding_opportunities ${whereClause}`;
    const countRes = await pool.query(countSql, params);
    const totalCount = parseInt(countRes.rows[0]?.count || 0, 10);

    // Data query (omit long_description from list to keep payload fast)
    params.push(parseInt(limit, 10));
    const limitParamIdx = params.length;
    params.push(offset);
    const offsetParamIdx = params.length;

    const dataSql = `
      SELECT 
        id, source_key, external_id, title, short_description, cover_image,
        eligible_applicants, deadline_date, deadline_raw, opening_date,
        funding_amount, funding_raw_amount, domains, technologies, links,
        call_type, permalink, content_hash, status,
        first_scraped_at, last_scraped_at, last_changed_at
      FROM funding_opportunities
      ${whereClause}
      ${orderByClause}
      LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
    `;

    const dataRes = await pool.query(dataSql, params);

    res.json({
      status: 'success',
      data: {
        items: dataRes.rows,
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total_pages: Math.ceil(totalCount / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('[API:Scrapers] Error getting opportunities:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 3. Get Single Opportunity Detail (Includes Long Description & Links)
 */
router.get('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM funding_opportunities WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('[API:Scrapers] Error getting opportunity detail:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 4. Run Scraper Manually (Admin Button)
 */
router.post('/:sourceKey/run', async (req, res) => {
  try {
    const { sourceKey } = req.params;
    let result = null;

    if (sourceKey === 'cascadefunding') {
      console.log(`[API:Scrapers] Manual scrape requested for Cascade Funding...`);
      result = await scrapeCascadeFunding('admin_manual');
    } else if (sourceKey === 'ec_funding') {
      console.log(`[API:Scrapers] Manual scrape requested for EU Funding & Tenders...`);
      result = await scrapeEcFunding('admin_manual', 100, 30);
    } else {
      return res.status(400).json({ status: 'error', message: `Unknown scraper source: ${sourceKey}` });
    }

    res.json({
      status: 'success',
      message: `Scraping executed successfully for ${sourceKey}`,
      data: result
    });
  } catch (err) {
    console.error('[API:Scrapers] Error running scraper:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 5. Webhook Trigger Endpoint
 * Can be called by external cron jobs, n8n, Zapier, or GitHub Actions
 * Optional token verification: ?secret=... or header X-Webhook-Secret
 */
router.post('/:sourceKey/webhook', async (req, res) => {
  try {
    const { sourceKey } = req.params;
    const secret = req.headers['x-webhook-secret'] || req.query.secret;
    const configuredSecret = process.env.SCRAPER_WEBHOOK_SECRET;

    if (configuredSecret && secret !== configuredSecret) {
      return res.status(401).json({ status: 'error', message: 'Invalid or missing webhook secret' });
    }

    let result = null;
    if (sourceKey === 'cascadefunding') {
      console.log(`[API:Scrapers] Webhook triggered for Cascade Funding...`);
      result = await scrapeCascadeFunding('webhook');
    } else if (sourceKey === 'ec_funding') {
      console.log(`[API:Scrapers] Webhook triggered for EU Funding & Tenders...`);
      result = await scrapeEcFunding('webhook', 100, 30);
    } else {
      return res.status(400).json({ status: 'error', message: `Unknown scraper source: ${sourceKey}` });
    }

    res.json({
      status: 'success',
      triggered_by: 'webhook',
      message: 'Webhook processed successfully',
      data: result
    });
  } catch (err) {
    console.error('[API:Scrapers] Webhook error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 6. Scraper Execution Runs Log
 */
router.get('/runs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM scraper_runs
      ORDER BY created_at DESC
      LIMIT 20
    `);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[API:Scrapers] Error getting runs:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 7. Aggregate Scraper Statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
        COUNT(CASE WHEN status = 'upcoming' THEN 1 END) as upcoming_count,
        COALESCE(SUM(funding_raw_amount), 0) as total_funding_amount,
        MAX(last_scraped_at) as last_scraped_at
      FROM funding_opportunities
    `);

    // Extract unique domain categories
    const domainsRes = await pool.query(`
      SELECT DISTINCT jsonb_array_elements_text(domains) as domain_name 
      FROM funding_opportunities
      ORDER BY domain_name ASC
    `);

    // Extract unique beneficiary categories
    const beneficiariesRes = await pool.query(`
      SELECT DISTINCT jsonb_array_elements_text(eligible_applicants) as beneficiary_name 
      FROM funding_opportunities
      ORDER BY beneficiary_name ASC
    `);

    res.json({
      status: 'success',
      data: {
        summary: statsRes.rows[0],
        domains: domainsRes.rows.map(r => r.domain_name),
        beneficiaries: beneficiariesRes.rows.map(r => r.beneficiary_name)
      }
    });
  } catch (err) {
    console.error('[API:Scrapers] Error getting stats:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
