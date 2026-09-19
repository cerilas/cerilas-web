import crypto from 'crypto';
import pool from '../db.js';

/**
 * Deterministic Web Scraper for Cascade Funding Hub (https://cascadefunding.eu/open-calls/)
 * Extracts structured open call data directly from the official portal without AI.
 * Uses SHA-256 hashing to compare content and skip updates when no changes have occurred.
 */
export async function scrapeCascadeFunding(triggeredBy = 'manual') {
  const startTime = Date.now();
  const sourceKey = 'cascadefunding';
  const targetUrl = 'https://cascadefunding.eu/open-calls/';

  // 1. Create a log entry for this scraper run
  let runId = null;
  try {
    const runRes = await pool.query(
      `INSERT INTO scraper_runs (source_key, triggered_by, status, created_at)
       VALUES ($1, $2, 'running', NOW())
       RETURNING id`,
      [sourceKey, triggeredBy]
    );
    runId = runRes.rows[0]?.id;
  } catch (err) {
    console.warn('[Scraper:Cascade] Could not record run start:', err.message);
  }

  try {
    console.log(`[Scraper:Cascade] Fetching live data from ${targetUrl}...`);
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${targetUrl}: HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();

    // 2. Extract embedded structured datasets from page scripts
    const extractArrayFromScript = (varName) => {
      const regex = new RegExp(`const\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]);\\s*(?:const|<\\/script>)`);
      const match = html.match(regex);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.warn(`[Scraper:Cascade] Parse warning for ${varName}:`, e.message);
        }
      }
      return [];
    };

    const proposals = extractArrayFromScript('dataProposals');
    const evaluators = extractArrayFromScript('dataEvaluators');
    const mentors = extractArrayFromScript('dataMentors');

    const rawItems = [...proposals, ...evaluators, ...mentors];

    if (rawItems.length === 0) {
      throw new Error('No open calls data could be extracted from page.');
    }

    console.log(`[Scraper:Cascade] Extracted ${rawItems.length} items to process.`);

    let itemsInserted = 0;
    let itemsUpdated = 0;
    let itemsUnchanged = 0;

    for (const item of rawItems) {
      const externalId = String(item.id || (item.permalink ? item.permalink.split('/').filter(Boolean).pop() : null) || '');
      if (!externalId) continue;

      const title = (item.title || '').trim() || 'Untitled Open Call';
      const shortDesc = (item.description || '').trim();
      const longDesc = (item.long_description || '').trim();
      const coverImage = item.icon || null;

      // Extract applicants / beneficiaries
      const eligibleApplicants = Array.isArray(item.type_of_beneficiary)
        ? item.type_of_beneficiary.map(b => (typeof b === 'object' && b.value ? b.value : String(b)))
        : [];

      // Dates parsing
      let deadlineDate = null;
      if (item.closes_object) {
        const d = new Date(item.closes_object.replace(' ', 'T') + 'Z');
        if (!isNaN(d.getTime())) deadlineDate = d;
      }
      if (!deadlineDate && item.closes) {
        const parts = item.closes.split('/');
        if (parts.length === 3) {
          const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59Z`);
          if (!isNaN(d.getTime())) deadlineDate = d;
        }
      }

      let openingDate = null;
      if (item.created_time) {
        const d = new Date(item.created_time);
        if (!isNaN(d.getTime())) openingDate = d;
      }

      // Funding amount
      let fundingAmount = null;
      let fundingRawAmount = 0;
      if (item.funding_per_project && typeof item.funding_per_project === 'object') {
        if (item.funding_per_project.format) {
          fundingAmount = `€${item.funding_per_project.format}`;
        } else if (item.funding_per_project.raw) {
          fundingAmount = `€${Number(item.funding_per_project.raw).toLocaleString()}`;
        }
        if (item.funding_per_project.raw) {
          fundingRawAmount = parseFloat(item.funding_per_project.raw) || 0;
        }
      } else if (item.remuneration) {
        fundingAmount = String(item.remuneration);
      }

      const domains = Array.isArray(item.domains)
        ? item.domains.map(d => (typeof d === 'object' && d.value ? d.value : String(d)))
        : [];

      const technologies = Array.isArray(item.technologies)
        ? item.technologies.map(t => (typeof t === 'object' && t.value ? t.value : String(t)))
        : [];

      const links = item.links && typeof item.links === 'object' ? item.links : {};
      const callType = item.call_type || 'Proposals';
      const permalink = item.permalink || null;

      // Status
      const now = new Date();
      let status = 'open';
      if (deadlineDate && deadlineDate < now) {
        status = 'closed';
      } else if (openingDate && openingDate > now) {
        status = 'upcoming';
      }

      // Checksum for change detection
      const hashPayload = {
        title,
        shortDesc,
        longDesc,
        eligibleApplicants,
        deadline_raw: item.closes || null,
        fundingAmount,
        links,
        domains,
        technologies,
        callType
      };
      const contentHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(hashPayload))
        .digest('hex');

      // Check existing
      const existingRes = await pool.query(
        `SELECT id, content_hash FROM funding_opportunities
         WHERE source_key = $1 AND external_id = $2`,
        [sourceKey, externalId]
      );

      if (existingRes.rows.length > 0) {
        const existing = existingRes.rows[0];
        if (existing.content_hash === contentHash) {
          // Unchanged: update timestamp and status only
          await pool.query(
            `UPDATE funding_opportunities 
             SET last_scraped_at = NOW(), status = $1 
             WHERE id = $2`,
            [status, existing.id]
          );
          itemsUnchanged++;
        } else {
          // Changed: update content
          await pool.query(
            `UPDATE funding_opportunities SET
              title = $1,
              short_description = $2,
              long_description = $3,
              cover_image = $4,
              eligible_applicants = $5,
              deadline_date = $6,
              deadline_raw = $7,
              opening_date = $8,
              funding_amount = $9,
              funding_raw_amount = $10,
              domains = $11,
              technologies = $12,
              links = $13,
              call_type = $14,
              permalink = $15,
              content_hash = $16,
              status = $17,
              raw_data = $18,
              last_scraped_at = NOW(),
              last_changed_at = NOW()
             WHERE id = $19`,
            [
              title,
              shortDesc,
              longDesc,
              coverImage,
              JSON.stringify(eligibleApplicants),
              deadlineDate,
              item.closes || null,
              openingDate,
              fundingAmount,
              fundingRawAmount,
              JSON.stringify(domains),
              JSON.stringify(technologies),
              JSON.stringify(links),
              callType,
              permalink,
              contentHash,
              status,
              JSON.stringify(item),
              existing.id
            ]
          );
          itemsUpdated++;
        }
      } else {
        // New
        await pool.query(
          `INSERT INTO funding_opportunities (
            source_key, external_id, title, short_description, long_description,
            cover_image, eligible_applicants, deadline_date, deadline_raw, opening_date,
            funding_amount, funding_raw_amount, domains, technologies, links,
            call_type, permalink, content_hash, status, raw_data,
            first_scraped_at, last_scraped_at, last_changed_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20,
            NOW(), NOW(), NOW()
          )`,
          [
            sourceKey,
            externalId,
            title,
            shortDesc,
            longDesc,
            coverImage,
            JSON.stringify(eligibleApplicants),
            deadlineDate,
            item.closes || null,
            openingDate,
            fundingAmount,
            fundingRawAmount,
            JSON.stringify(domains),
            JSON.stringify(technologies),
            JSON.stringify(links),
            callType,
            permalink,
            contentHash,
            status,
            JSON.stringify(item)
          ]
        );
        itemsInserted++;
      }
    }

    const durationMs = Date.now() - startTime;

    if (runId) {
      await pool.query(
        `UPDATE scraper_runs SET
          status = 'success',
          items_found = $1,
          items_inserted = $2,
          items_updated = $3,
          items_unchanged = $4,
          duration_ms = $5
         WHERE id = $6`,
        [rawItems.length, itemsInserted, itemsUpdated, itemsUnchanged, durationMs, runId]
      );
    }

    return {
      success: true,
      source: sourceKey,
      source_name: 'Cascade Funding Hub',
      target_url: targetUrl,
      items_found: rawItems.length,
      items_inserted: itemsInserted,
      items_updated: itemsUpdated,
      items_unchanged: itemsUnchanged,
      duration_ms: durationMs,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    if (runId) {
      await pool.query(
        `UPDATE scraper_runs SET
          status = 'failed',
          error_message = $1,
          duration_ms = $2
         WHERE id = $3`,
        [error.message, durationMs, runId]
      );
    }
    throw error;
  }
}
