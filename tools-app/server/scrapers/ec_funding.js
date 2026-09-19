import crypto from 'crypto';
import pool from '../db.js';

const EC_SEARCH_API = 'https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***';
const EC_PORTAL_URL = 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals?isExactMatch=true&status=31094501,31094502&order=DESC&pageNumber=1&pageSize=50&sortBy=startDate';

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
 * Scrape European Commission Funding & Tenders Portal (Active & Forthcoming Calls Only)
 * @param {string} triggeredBy - 'admin_manual', 'webhook', or 'cron'
 * @param {number} pageSize - default 100 items per request
 * @param {number} maxPages - default 30 pages (up to 3,000 items, covers all active calls)
 */
export async function scrapeEcFunding(triggeredBy = 'manual', pageSize = 100, maxPages = 30) {
  const startTime = Date.now();
  const sourceKey = 'ec_funding';
  let totalFound = 0;
  let itemsInserted = 0;
  let itemsUpdated = 0;
  let itemsUnchanged = 0;

  console.log(`[Scraper:EC_Funding] Starting scrape for ALL active open calls (triggered by: ${triggeredBy})...`);

  try {
    const allResults = [];

    // Fetch pages (Only 31094502 = Open for submission, 31094501 = Forthcoming)
    for (let page = 1; page <= maxPages; page++) {
      const query = {
        bool: {
          must: [
            { terms: { type: ['1', '2', '8'] } },
            { terms: { status: ['31094501', '31094502'] } }
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

      console.log(`[Scraper:EC_Funding] Page ${page}: fetched ${results.length} calls (running total: ${allResults.length})`);

      if (results.length < pageSize) {
        break; // Reached last page of active calls
      }
    }

    // Preload existing records for this source to eliminate hundreds of individual DB roundtrips
    const existingMap = new Map();
    const existingRes = await pool.query(
      'SELECT id, external_id, content_hash FROM funding_opportunities WHERE source_key = $1',
      [sourceKey]
    );
    for (const row of existingRes.rows) {
      existingMap.set(row.external_id, row);
    }

    const unchangedIds = [];
    const activeExternalIds = new Set();

    for (const r of allResults) {
      const m = r.metadata || {};
      const title = m.title?.[0] || r.summary || '';
      const externalId = r.reference || m.identifier?.[0] || m.ccm2Id?.[0];

      // Skip entries without valid title or identifier
      if (!title || !externalId) {
        continue;
      }

      let deadlineDate = null;
      if (m.deadlineDate?.[0]) {
        try {
          deadlineDate = new Date(m.deadlineDate[0]).toISOString();
        } catch (e) {}
      }

      // STRICT CHECK: Skip any calls whose deadline has already passed
      if (deadlineDate && new Date(deadlineDate) < new Date()) {
        continue;
      }

      activeExternalIds.add(externalId);

      const shortDesc = m.destinationDescription?.[0] || m.callTitle?.[0] || r.summary || '';
      const longDesc = m.topicConditions?.[0] || shortDesc;
      
      const budget = extractBudget(m.budgetOverview?.[0]);

      // All calls in our database are active open calls
      const status = 'open';

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
        'Public Authorities & Municipalities',
        'Large Enterprises & Industry Partners'
      ];

      const domains = deriveDomains(m);
      const technologies = [
        ...(m.frameworkProgramme || []),
        ...(m.destinationDetails || [])
      ].slice(0, 5);

      const permalink = m.esUrl?.[0] || `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${externalId.toLowerCase()}`;

      const links = {
        official: permalink,
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

      // Check existing record from in-memory cache
      const existing = existingMap.get(externalId);

      if (!existing) {
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
        if (existing.content_hash === contentHash) {
          // 2. Unchanged (Zero redundant writes!)
          unchangedIds.push(existing.id);
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

    totalFound = activeExternalIds.size;

    // Batch update last_scraped_at for unchanged items in a single query
    if (unchangedIds.length > 0) {
      await pool.query(
        'UPDATE funding_opportunities SET last_scraped_at = NOW() WHERE id = ANY($1::int[])',
        [unchangedIds]
      );
    }

    // Prune closed calls from database (calls no longer in EC's active list)
    if (activeExternalIds.size > 0) {
      const pruneRes = await pool.query(
        `DELETE FROM funding_opportunities 
         WHERE source_key = $1 AND NOT (external_id = ANY($2::text[]))`,
        [sourceKey, Array.from(activeExternalIds)]
      );
      if (pruneRes.rowCount > 0) {
        console.log(`[Scraper:EC_Funding] Pruned ${pruneRes.rowCount} closed/expired calls from DB.`);
      }
    }

    // Global cleanup: ensure no expired calls exist anywhere in DB
    await pool.query(`
      DELETE FROM funding_opportunities 
      WHERE (deadline_date IS NOT NULL AND deadline_date < NOW()) OR status = 'closed'
    `);

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
