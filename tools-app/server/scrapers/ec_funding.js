import crypto from 'crypto';
import pool from '../db.js';

const EC_SEARCH_API = 'https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***';
const EC_PORTAL_URL = 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals?isExactMatch=true&status=31094501,31094502,31094503&order=DESC&pageNumber=1&pageSize=50&sortBy=startDate';

/**
 * Generate SHA-256 hash for deduplication
 */
function generateContentHash(data) {
  const normalized = JSON.stringify({
    title: data.title?.trim() || '',
    short_description: data.short_description?.trim() || '',
    deadline_date: data.deadline_date || '',
    opening_date: data.opening_date || '',
    funding_raw_amount: data.funding_raw_amount || 0,
    status: data.status || '',
    permalink: data.permalink || ''
  });
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Extract numerical & formatted budget from EC budgetOverview
 */
function extractBudget(budgetOverviewStr) {
  if (!budgetOverviewStr) return { formatted: 'EU Grant / Hibe', raw: null };
  try {
    const bObj = typeof budgetOverviewStr === 'string' ? JSON.parse(budgetOverviewStr) : budgetOverviewStr;
    if (bObj?.budgetTopicActionMap) {
      for (const actionKey in bObj.budgetTopicActionMap) {
        const actionArr = bObj.budgetTopicActionMap[actionKey];
        if (Array.isArray(actionArr) && actionArr[0]?.budgetYearMap) {
          const amounts = Object.values(actionArr[0].budgetYearMap).map(Number).filter(n => !isNaN(n) && n > 0);
          if (amounts.length > 0) {
            const sum = amounts.reduce((a, b) => a + b, 0);
            return {
              formatted: '€' + sum.toLocaleString('de-DE'),
              raw: sum.toFixed(2)
            };
          }
        }
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return { formatted: 'EU Grant / Hibe', raw: null };
}

/**
 * Derive intelligent domain tags from call metadata
 */
function deriveDomains(metadata) {
  const domains = new Set();
  domains.add('Horizon Europe / EU Programmes');

  const title = (metadata.title?.[0] || '').toLowerCase();
  const id = (metadata.identifier?.[0] || '').toLowerCase();
  const destDesc = (metadata.destinationDescription?.[0] || '').toLowerCase();

  if (title.includes('ai ') || title.includes('digital') || title.includes('data') || id.includes('cl4')) {
    domains.add('Digital, Industry & Space');
  }
  if (title.includes('energy') || title.includes('climate') || title.includes('mobility') || title.includes('ev') || id.includes('cl5')) {
    domains.add('Climate, Energy & Mobility');
  }
  if (title.includes('health') || title.includes('cancer') || id.includes('hlth')) {
    domains.add('Health & Biotech');
  }
  if (title.includes('msca') || title.includes('doctoral') || title.includes('researcher')) {
    domains.add('Marie Skłodowska-Curie Actions (MSCA)');
  }
  if (title.includes('materials') || title.includes('manufacturing')) {
    domains.add('Advanced Materials & Manufacturing');
  }
  if (title.includes('circular') || title.includes('sustainab') || title.includes('green')) {
    domains.add('Circular Economy & Green Transition');
  }

  if (metadata.typesOfAction?.[0]) {
    domains.add(metadata.typesOfAction[0]);
  }

  return Array.from(domains);
}

/**
 * Scrape European Commission Funding & Tenders Portal
 * @param {string} triggeredBy - 'admin_manual', 'webhook', or 'cron'
 * @param {number} pageSize - default 50 items
 * @param {number} maxPages - default 2 pages (100 items)
 */
export async function scrapeEcFunding(triggeredBy = 'manual', pageSize = 50, maxPages = 2) {
  const startTime = Date.now();
  const sourceKey = 'ec_funding';
  let totalFound = 0;
  let itemsInserted = 0;
  let itemsUpdated = 0;
  let itemsUnchanged = 0;

  console.log(`[Scraper:EC_Funding] Starting scrape (triggered by: ${triggeredBy})...`);

  try {
    const allResults = [];

    // Fetch pages
    for (let page = 1; page <= maxPages; page++) {
      const query = {
        bool: {
          must: [
            { terms: { type: ['1', '2', '8'] } },
            { terms: { status: ['31094501', '31094502', '31094503'] } }
          ]
        }
      };

      const formData = new FormData();
      formData.append('query', new Blob([JSON.stringify(query)], { type: 'application/json' }));
      formData.append('languages', new Blob([JSON.stringify(['en'])], { type: 'application/json' }));

      const pageUrl = `${EC_SEARCH_API}&pageNumber=${page}&pageSize=${pageSize}&sort=startDate&order=DESC`;
      const response = await fetch(pageUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`EC Search API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const results = json.results || [];
      allResults.push(...results);

      if (results.length < pageSize) {
        break; // No more pages
      }
    }

    totalFound = allResults.length;
    console.log(`[Scraper:EC_Funding] Fetched ${totalFound} calls from EC Search API.`);

    for (const r of allResults) {
      const m = r.metadata || {};
      const title = m.title?.[0] || r.summary || '';
      const externalId = r.reference || m.identifier?.[0] || m.ccm2Id?.[0];

      // Skip entries without valid title or identifier
      if (!title || !externalId) {
        continue;
      }
      const shortDesc = m.destinationDescription?.[0] || m.callTitle?.[0] || r.summary || '';
      const longDesc = m.topicConditions?.[0] || shortDesc;
      
      const budget = extractBudget(m.budgetOverview?.[0]);

      // Status mapping: 31094502 = Open, 31094501 = Forthcoming, 31094503 = Closed
      const statusCode = m.status?.[0];
      let status = 'open';
      if (statusCode === '31094501') status = 'forthcoming';
      else if (statusCode === '31094503') status = 'closed';

      let deadlineDate = null;
      if (m.deadlineDate?.[0]) {
        try {
          deadlineDate = new Date(m.deadlineDate[0]).toISOString();
        } catch (e) {}
      }

      let openingDate = null;
      if (m.startDate?.[0]) {
        try {
          openingDate = new Date(m.startDate[0]).toISOString();
        } catch (e) {}
      }

      const eligibleApplicants = [
        'Universities & Academic Institutions',
        'Research Organizations',
        'SMEs & Startups',
        'Large Industrial Companies',
        'Public Authorities & Municipalities',
        'NGOs & Civil Society'
      ];

      const domains = deriveDomains(m);
      const technologies = m.keywords || [];

      const permalink = r.url || m.url?.[0] || (m.identifier?.[0] ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${m.identifier[0]}` : EC_PORTAL_URL);

      const links = {
        website: permalink,
        apply: permalink,
        portal: EC_PORTAL_URL
      };

      const programData = {
        title,
        short_description: shortDesc,
        deadline_date: deadlineDate,
        opening_date: openingDate,
        funding_raw_amount: budget.raw,
        status,
        permalink
      };

      const contentHash = generateContentHash(programData);

      // Check existing record in DB
      const existingRes = await pool.query(
        'SELECT id, content_hash FROM funding_opportunities WHERE source_key = $1 AND external_id = $2',
        [sourceKey, externalId]
      );

      if (existingRes.rows.length === 0) {
        // 1. Insert new opportunity
        await pool.query(`
          INSERT INTO funding_opportunities (
            source_key, external_id, title, short_description, long_description,
            cover_image, eligible_applicants, deadline_date, deadline_raw,
            opening_date, funding_amount, funding_raw_amount, domains,
            technologies, links, call_type, permalink, content_hash,
            status, first_scraped_at, last_scraped_at, last_changed_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW(), NOW()
          )
        `, [
          sourceKey,
          externalId,
          title,
          shortDesc,
          longDesc,
          'https://ec.europa.eu/info/funding-tenders/opportunities/portal/assets/images/logo-ec.svg',
          JSON.stringify(eligibleApplicants),
          deadlineDate,
          m.deadlineDate?.[0] || null,
          openingDate,
          budget.formatted,
          budget.raw,
          JSON.stringify(domains),
          JSON.stringify(technologies),
          JSON.stringify(links),
          m.typesOfAction?.[0] || 'Calls for proposals (EU Grants)',
          permalink,
          contentHash,
          status
        ]);
        itemsInserted++;
      } else {
        const existing = existingRes.rows[0];
        if (existing.content_hash === contentHash) {
          // 2. Unchanged (Zero redundant writes!)
          await pool.query(
            'UPDATE funding_opportunities SET last_scraped_at = NOW() WHERE id = $1',
            [existing.id]
          );
          itemsUnchanged++;
        } else {
          // 3. Updated
          await pool.query(`
            UPDATE funding_opportunities SET
              title = $1,
              short_description = $2,
              long_description = $3,
              eligible_applicants = $4,
              deadline_date = $5,
              deadline_raw = $6,
              opening_date = $7,
              funding_amount = $8,
              funding_raw_amount = $9,
              domains = $10,
              technologies = $11,
              links = $12,
              call_type = $13,
              permalink = $14,
              content_hash = $15,
              status = $16,
              last_scraped_at = NOW(),
              last_changed_at = NOW()
            WHERE id = $17
          `, [
            title,
            shortDesc,
            longDesc,
            JSON.stringify(eligibleApplicants),
            deadlineDate,
            m.deadlineDate?.[0] || null,
            openingDate,
            budget.formatted,
            budget.raw,
            JSON.stringify(domains),
            JSON.stringify(technologies),
            JSON.stringify(links),
            m.typesOfAction?.[0] || 'Calls for proposals (EU Grants)',
            permalink,
            contentHash,
            status,
            existing.id
          ]);
          itemsUpdated++;
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Log run
    await pool.query(`
      INSERT INTO scraper_runs (
        source_key, triggered_by, status, items_found, items_inserted,
        items_updated, items_unchanged, duration_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      sourceKey,
      triggeredBy,
      'success',
      totalFound,
      itemsInserted,
      itemsUpdated,
      itemsUnchanged,
      durationMs
    ]);

    console.log(`[Scraper:EC_Funding] Complete! Found: ${totalFound}, Inserted: ${itemsInserted}, Updated: ${itemsUpdated}, Unchanged: ${itemsUnchanged} (${durationMs}ms)`);

    return {
      success: true,
      items_found: totalFound,
      items_inserted: itemsInserted,
      items_updated: itemsUpdated,
      items_unchanged: itemsUnchanged,
      duration_ms: durationMs
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Scraper:EC_Funding] Error during scraping:', error.message);

    await pool.query(`
      INSERT INTO scraper_runs (
        source_key, triggered_by, status, items_found, items_inserted,
        items_updated, items_unchanged, duration_ms, error_message
      ) VALUES ($1, $2, $3, 0, 0, 0, 0, $4, $5)
    `, [sourceKey, triggeredBy, 'error', durationMs, error.message]);

    throw error;
  }
}
