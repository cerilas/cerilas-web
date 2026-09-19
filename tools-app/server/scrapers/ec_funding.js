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
 * Extract numerical & formatted budget from EC metadata
 */
function extractBudget(m, isCompetitiveCall) {
  // 1. Check competitive call direct budget field
  if (isCompetitiveCall && m.budget?.[0]) {
    const num = parseFloat(m.budget[0]);
    if (!isNaN(num) && num > 0) {
      return {
        formatted: '€' + num.toLocaleString('de-DE'),
        raw: num.toFixed(2)
      };
    }
  }

  // 2. Check serialized budgetOverview JSON
  const budgetOverviewStr = m.budgetOverview?.[0];
  if (budgetOverviewStr) {
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
  const callTitle = (metadata.callTitle?.[0] || '').toLowerCase();

  const combined = `${title} ${id} ${destDesc} ${callTitle}`;

  if (combined.includes('ai ') || combined.includes('digital') || combined.includes('data') || combined.includes('cyber') || id.includes('cl4') || id.includes('digital')) {
    domains.add('Digital, Industry & Space');
  }
  if (combined.includes('energy') || combined.includes('climate') || combined.includes('mobility') || combined.includes('ev') || combined.includes('battery') || id.includes('cl5')) {
    domains.add('Climate, Energy & Mobility');
  }
  if (combined.includes('health') || combined.includes('cancer') || combined.includes('biotech') || combined.includes('medical') || id.includes('hlth')) {
    domains.add('Health & Biotech');
  }
  if (combined.includes('msca') || combined.includes('doctoral') || combined.includes('fellowship') || combined.includes('researcher')) {
    domains.add('Marie Skłodowska-Curie Actions (MSCA)');
  }
  if (combined.includes('materials') || combined.includes('manufacturing') || combined.includes('industrial') || combined.includes('sme')) {
    domains.add('Advanced Materials & Manufacturing');
  }
  if (combined.includes('circular') || combined.includes('sustainab') || combined.includes('green') || combined.includes('nature') || combined.includes('life')) {
    domains.add('Circular Economy & Green Transition');
  }
  if (combined.includes('food') || combined.includes('agriculture') || combined.includes('bioeconomy') || combined.includes('marine')) {
    domains.add('Food, Bioeconomy & Natural Resources');
  }

  if (metadata.typesOfAction?.[0]) {
    domains.add(metadata.typesOfAction[0]);
  }

  return Array.from(domains);
}

/**
 * Derive eligible applicants list from metadata
 */
function deriveEligibleApplicants(m, isCompetitiveCall) {
  const text = (
    (m.description?.[0] || '') + ' ' + 
    (m.topicConditions?.[0] || '') + ' ' + 
    (m.typesOfAction?.[0] || '') + ' ' +
    (m.beneficiaryAdministration?.[0] || '')
  ).toLowerCase();

  const set = new Set();

  if (text.includes('sme') || text.includes('small and medium') || text.includes('startup') || isCompetitiveCall) {
    set.add('SMEs & Startups');
  }
  if (text.includes('universit') || text.includes('academic') || text.includes('higher education') || text.includes('doctoral')) {
    set.add('Universities & Academic Institutions');
  }
  if (text.includes('research') || text.includes('scientific') || text.includes('r&d')) {
    set.add('Research Organizations');
  }
  if (text.includes('public authorit') || text.includes('municipalit') || text.includes('public bod') || text.includes('ministry')) {
    set.add('Public Authorities & Municipalities');
  }
  if (text.includes('large enterprise') || text.includes('large compan') || text.includes('industry')) {
    set.add('Large Enterprises & Industry Partners');
  }
  if (text.includes('individual') || text.includes('researcher') || text.includes('postdoctoral') || text.includes('doctoral candidate')) {
    set.add('Individual Researchers');
  }
  if (text.includes('ngo') || text.includes('civil society') || text.includes('non-profit')) {
    set.add('NGOs & Non-Profits');
  }

  if (set.size === 0) {
    set.add('SMEs & Startups');
    set.add('Research Organizations');
    set.add('Universities & Academic Institutions');
  }

  return Array.from(set);
}

/**
 * Assemble comprehensive multi-section HTML details for modal display
 */
function assembleRichDescription(m, isCompetitiveCall) {
  const sections = [];

  if (isCompetitiveCall) {
    // 1. Who can apply / Eligibility (Competitive sub-grants)
    if (m.description?.[0]) {
      sections.push(`
        <div class="ec-section" style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #1e293b); margin: 0 0 0.5rem;">
            🎯 Kimler Başvurabilir? (Eligibility & Target Applicants)
          </h4>
          <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted, #475569);">
            ${m.description[0]}
          </div>
        </div>
      `);
    }

    // 2. Call purpose and scope
    if (m.furtherInformation?.[0]) {
      sections.push(`
        <div class="ec-section" style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #1e293b); margin: 0 0 0.5rem;">
            📋 Çağrı Amacı ve Kapsamı (Call Purpose & Scope)
          </h4>
          <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted, #475569);">
            ${m.furtherInformation[0]}
          </div>
        </div>
      `);
    }

    // 3. How to apply & submission instructions
    if (m.beneficiaryAdministration?.[0] || m.destinationDetails?.[0]) {
      sections.push(`
        <div class="ec-section" style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #1e293b); margin: 0 0 0.5rem;">
            🚀 Başvuru Yöntemi ve Süreci (How to Apply)
          </h4>
          <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted, #475569);">
            ${m.beneficiaryAdministration?.[0] || m.destinationDetails[0]}
          </div>
        </div>
      `);
    }

    // 4. Timeline & availability
    if (m.duration?.[0]) {
      sections.push(`
        <div class="ec-section" style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #1e293b); margin: 0 0 0.5rem;">
            ⏱️ Zaman Çizelgesi ve Çağrı Süresi (Timeline & Schedule)
          </h4>
          <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted, #475569); margin: 0;">
            ${m.duration[0].replace(/\n/g, '<br/>')}
          </p>
        </div>
      `);
    }
  } else {
    // Horizon Europe & Direct EU Calls
    // 1. Objectives and Expected Outcomes (the core technical details)
    if (m.descriptionByte?.[0]) {
      sections.push(`
        <div class="ec-section" style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #1e293b); margin: 0 0 0.5rem;">
            🎯 Beklenen Sonuçlar ve Çağrı Kapsamı (Expected Outcome & Scope)
          </h4>
          <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted, #475569);">
            ${m.descriptionByte[0]}
          </div>
        </div>
      `);
    }

    // 2. Destination Details and Policy Context
    if (m.destinationDetails?.[0]) {
      sections.push(`
        <div class="ec-section" style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #1e293b); margin: 0 0 0.5rem;">
            🌍 Program Arka Planı ve Hedefler (Destination & Strategic Context)
          </h4>
          <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted, #475569);">
            ${m.destinationDetails[0]}
          </div>
        </div>
      `);
    }

    // 3. Topic Conditions & Eligibility Rules
    if (m.topicConditions?.[0]) {
      sections.push(`
        <div class="ec-section" style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #1e293b); margin: 0 0 0.5rem;">
            ⚖️ Katılım Şartları ve Başvuru Kriterleri (General Conditions & Eligibility)
          </h4>
          <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted, #475569);">
            ${m.topicConditions[0]}
          </div>
        </div>
      `);
    }

    // 4. Online Manual & Applicant Support
    if (m.supportInfo?.[0]) {
      sections.push(`
        <div class="ec-section" style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #1e293b); margin: 0 0 0.5rem;">
            📚 Rehberler ve Başvuru Desteği (Support & Guidance)
          </h4>
          <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted, #475569);">
            ${m.supportInfo[0]}
          </div>
        </div>
      `);
    }
  }

  if (sections.length > 0) {
    return sections.join('<hr style="margin: 1.25rem 0; border: 0; border-top: 1px solid rgba(150, 150, 150, 0.15);" />');
  }

  return m.topicConditions?.[0] || m.destinationDescription?.[0] || '';
}

/**
 * Derive clean short preview text without raw HTML tags
 */
function deriveShortDescription(m, isCompetitiveCall, summary) {
  let raw = '';
  if (isCompetitiveCall) {
    raw = m.furtherInformation?.[0] || m.description?.[0] || m.callTitle?.[0] || summary || '';
  } else {
    raw = m.destinationDescription?.[0] || m.descriptionByte?.[0] || m.callTitle?.[0] || summary || '';
  }
  const clean = raw.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > 280 ? clean.slice(0, 277) + '...' : clean;
}

/**
 * Scrape European Commission Funding & Tenders Portal (Active & Forthcoming Calls Only)
 * @param {string} triggeredBy - 'admin_manual', 'webhook', or 'cron'
 * @param {number} pageSize - default 100 items per request
 * @param {number} maxPages - default 30 pages
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
            { terms: { type: ['1', '8'] } },
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

    // Preload existing records into memory for instant hash comparison
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
      const isCompetitiveCall = m.type?.[0] === '8' || r.reference?.includes('COMPETITIVE');

      // Title: Use specific sub-grant call title for type 8, topic title for type 1
      const title = isCompetitiveCall
        ? (m.callTitle?.[0] || m.caName?.[0] || r.summary || m.title?.[0] || '')
        : (m.title?.[0] || r.summary || '');

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

      // Extract rich multi-section HTML description and clean summary
      const shortDesc = deriveShortDescription(m, isCompetitiveCall, r.summary);
      const longDesc = assembleRichDescription(m, isCompetitiveCall);
      
      const budget = extractBudget(m, isCompetitiveCall);

      // All active calls in our database are open
      const status = 'open';

      let openingDate = null;
      if (m.startDate?.[0]) {
        try {
          openingDate = new Date(m.startDate[0]).toISOString();
        } catch (e) {}
      }

      const eligibleApplicants = deriveEligibleApplicants(m, isCompetitiveCall);
      const domains = deriveDomains(m);
      const technologies = [
        ...(m.frameworkProgramme || []),
        ...(m.destinationDetails || [])
      ].slice(0, 5);

      // Exact, working official EU Portal permalink directly from API
      const permalink = r.url || m.esST_URL?.[0] || (
        m.identifier?.[0] 
          ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${m.identifier[0]}`
          : EC_PORTAL_URL
      );

      const links = {
        official: permalink,
        apply: permalink,
        portal: EC_PORTAL_URL
      };

      const callType = isCompetitiveCall 
        ? 'Cascade Funding / Competitive Call'
        : (m.typesOfAction?.[0] || 'Calls for Proposals (EU Grants)');

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
          '/eu-logo.svg',
          JSON.stringify(eligibleApplicants),
          deadlineDate,
          m.deadlineDate?.[0] || null,
          openingDate,
          budget.formatted,
          budget.raw,
          JSON.stringify(domains),
          JSON.stringify(technologies),
          JSON.stringify(links),
          callType,
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
          // 3. Updated (Content changed)
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
            callType,
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
