/**
 * Centralized Workspace & Site Scoring Engine for Cerilas Growth Radar
 * Computes deterministic subscores (technical, AI/GEO, search, authority, content)
 * and composite overall growth authority score (growth_score).
 */
import { NOT_HIDDEN_DIRECTORY_SQL } from './growthDirectoryVisibility.js';

/**
 * Calculates dynamic live subscores and composite growth score for a workspace,
 * and synchronizes them directly into PostgreSQL workspaces table.
 *
 * @param {object} pool - PostgreSQL pool client (authPool)
 * @param {number} workspaceId - Workspace ID
 * @param {object} [existingWorkspace] - Optional preloaded workspace row
 * @returns {Promise<{ growthScore: number, subscores: { technical: number, ai: number, search: number, authority: number, content: number }, workspace: object }>}
 */
export async function calculateWorkspaceScores(pool, workspaceId, existingWorkspace = null) {
  let ws = existingWorkspace;
  if (!ws) {
    const wsRes = await pool.query('SELECT * FROM workspaces WHERE id = $1', [workspaceId]);
    ws = wsRes.rows[0];
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
  }

  // 1. Technical Health Subscore (0 - 100)
  // Evaluates latest crawl run technical score and deducts penalties for active issues
  const crawlRes = await pool.query(
    'SELECT technical_score, pages_crawled, summary FROM growth_crawl_runs WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1',
    [workspaceId]
  );
  const latestCrawl = crawlRes.rows[0];

  const issuesRes = await pool.query(
    'SELECT severity, COUNT(*)::int as count FROM growth_audit_issues WHERE workspace_id = $1 AND is_resolved = false GROUP BY severity',
    [workspaceId]
  );
  let critCount = 0;
  let highCount = 0;
  let medCount = 0;
  for (const r of issuesRes.rows) {
    if (r.severity === 'critical') critCount = r.count;
    else if (r.severity === 'high') highCount = r.count;
    else if (r.severity === 'medium') medCount = r.count;
  }

  let baseTech = latestCrawl ? Number(latestCrawl.technical_score) : (ws.subscores?.technical || 75);
  let techPenalty = (critCount * 5) + (highCount * 2) + (medCount * 0.5);
  const subTechnical = Math.max(20, Math.min(100, Math.round(baseTech - techPenalty)));

  // 2. AI Visibility & GEO Readiness Subscore (0 - 100)
  // Evaluates LLM batch simulation reports, GEO standards audit, and prompt citation rates
  const batchRes = await pool.query(
    'SELECT visibility_score, total_prompts, mentioned_count, cited_count FROM growth_ai_visibility_batch_reports WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1',
    [workspaceId]
  );
  const latestBatch = batchRes.rows[0];

  const geoRes = await pool.query(
    'SELECT geo_score FROM growth_geo_readiness_audits WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1',
    [workspaceId]
  );
  const latestGeo = geoRes.rows[0];

  const promptsRes = await pool.query(
    `SELECT COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE r.brand_mentioned = true)::int as cited
     FROM growth_tracked_prompts p
     LEFT JOIN LATERAL (
       SELECT brand_mentioned FROM growth_ai_visibility_runs WHERE prompt_id = p.id ORDER BY checked_at DESC LIMIT 1
     ) r ON true
     WHERE p.workspace_id = $1 AND p.is_active = true`,
    [workspaceId]
  );
  const totalPrompts = promptsRes.rows[0]?.total || 0;
  const citedPrompts = promptsRes.rows[0]?.cited || 0;
  const promptCitationRate = totalPrompts > 0 ? Math.round((citedPrompts / totalPrompts) * 100) : 0;

  let subAi;
  if (latestBatch && latestBatch.visibility_score != null) {
    const geo = latestGeo ? Number(latestGeo.geo_score) : 70;
    subAi = Math.round((Number(latestBatch.visibility_score) * 0.6) + (geo * 0.4));
  } else if (latestGeo && latestGeo.geo_score != null) {
    if (totalPrompts > 0) {
      subAi = Math.round((Number(latestGeo.geo_score) * 0.65) + (promptCitationRate * 0.35));
    } else {
      subAi = Number(latestGeo.geo_score);
    }
  } else {
    subAi = ws.subscores?.ai || 60;
  }
  subAi = Math.max(15, Math.min(100, subAi));

  // 3. Search Performance Subscore (0 - 100)
  // Evaluates live Google Search Console rankings and clicks, or keyword strategy baseline
  const gscConnRes = await pool.query(
    `SELECT 1 FROM integration_connections 
     WHERE workspace_id = $1 AND provider = 'google' 
       AND (integration_type = 'search_console' OR integration_type IS NULL) 
       AND status IN ('active', 'connected', 'authorized') LIMIT 1`,
    [workspaceId]
  );
  const isGscConnected = gscConnRes.rows.length > 0;

  const gscPerfRes = await pool.query(
    'SELECT total_clicks, total_impressions, average_position, average_ctr FROM growth_search_performance WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1',
    [workspaceId]
  );
  const gscPerf = gscPerfRes.rows[0];

  let subSearch;
  if (isGscConnected && gscPerf) {
    const avgPos = Number(gscPerf.average_position || 50);
    let posScore = 35;
    if (avgPos <= 3) posScore = 100;
    else if (avgPos <= 10) posScore = 88;
    else if (avgPos <= 20) posScore = 75;
    else if (avgPos <= 50) posScore = 55;
    else posScore = 40;

    const clicks = Number(gscPerf.total_clicks || 0);
    const activityBonus = Math.min(15, Math.round(Math.log10(Math.max(1, clicks + 1)) * 5));
    subSearch = Math.max(25, Math.min(100, posScore + activityBonus));
  } else if (isGscConnected) {
    subSearch = 60;
  } else {
    const rawKw = ws.target_keywords || ws.primary_keywords;
    let kwCount = 3;
    if (Array.isArray(rawKw)) kwCount = rawKw.length;
    else if (typeof rawKw === 'string') {
      try { kwCount = JSON.parse(rawKw).length; } catch (e) {}
    }
    subSearch = Math.max(35, Math.min(65, 45 + Math.min(15, kwCount * 2)));
  }

  // 4. Directory & Authority Network Subscore (0 - 100)
  // Evaluates claimed business listings and ecosystem authority average
  const dirsRes = await pool.query(
    `SELECT COUNT(*)::int as total, AVG(authority_score)::numeric as avg_auth FROM growth_directories
     WHERE (workspace_id IS NULL OR workspace_id = $1) AND ${NOT_HIDDEN_DIRECTORY_SQL('growth_directories')}`,
    [workspaceId]
  );
  const subsRes = await pool.query(
    "SELECT COUNT(*)::int as claimed FROM growth_directory_submissions WHERE workspace_id = $1 AND status IN ('claimed', 'verified')",
    [workspaceId]
  );
  const totalDirs = Number(dirsRes.rows[0]?.total || 0);
  const claimedDirs = Number(subsRes.rows[0]?.claimed || 0);
  const avgDirAuth = Math.round(Number(dirsRes.rows[0]?.avg_auth || 70));
  const coverageRate = totalDirs > 0 ? (claimedDirs / totalDirs) * 100 : 0;

  let subAuthority = totalDirs > 0 
    ? Math.round((coverageRate * 0.65) + (avgDirAuth * 0.35)) 
    : (ws.subscores?.authority || 50);
  subAuthority = Math.max(20, Math.min(100, subAuthority));

  // 5. Content Quality & Indexability Subscore (0 - 100)
  // Evaluates indexable pages, meta tags completeness, and content word depth
  const pagesRes = await pool.query(
    `SELECT COUNT(*)::int as total_pages,
            COUNT(*) FILTER (WHERE is_indexable = true)::int as indexable_pages,
            AVG(word_count)::numeric as avg_words,
            COUNT(*) FILTER (WHERE title IS NOT NULL AND title != '' AND meta_description IS NOT NULL AND meta_description != '')::int as meta_complete_pages
     FROM growth_crawled_pages WHERE workspace_id = $1`,
    [workspaceId]
  );
  const totalP = Number(pagesRes.rows[0]?.total_pages || 0);
  let subContent;
  if (totalP > 0) {
    const idxRate = (Number(pagesRes.rows[0]?.indexable_pages || 0) / totalP) * 100;
    const metaRate = (Number(pagesRes.rows[0]?.meta_complete_pages || 0) / totalP) * 100;
    const avgWords = Number(pagesRes.rows[0]?.avg_words || 0);
    const wordScore = Math.min(100, Math.round((avgWords / 400) * 100));
    subContent = Math.round((idxRate * 0.35) + (metaRate * 0.35) + (wordScore * 0.30));
  } else {
    subContent = ws.subscores?.content || 60;
  }
  subContent = Math.max(25, Math.min(100, subContent));

  // 6. Overall Composite Workspace Growth Score (0 - 100)
  // Balanced weighted combination: Technical (25%), AI/GEO (25%), Search (20%), Authority (15%), Content (15%)
  const overallGrowthScore = Math.round(
    (subTechnical * 0.25) +
    (subAi * 0.25) +
    (subSearch * 0.20) +
    (subAuthority * 0.15) +
    (subContent * 0.15)
  );

  const finalSubscores = {
    technical: subTechnical,
    ai: subAi,
    search: subSearch,
    authority: subAuthority,
    content: subContent
  };

  // 7. Persist back to database
  const updatedWsRes = await pool.query(
    `UPDATE workspaces 
     SET growth_score = $1, 
         subscores = $2, 
         updated_at = NOW() 
     WHERE id = $3 
     RETURNING *`,
    [overallGrowthScore, JSON.stringify(finalSubscores), workspaceId]
  );

  return {
    growthScore: overallGrowthScore,
    subscores: finalSubscores,
    workspace: updatedWsRes.rows[0] || ws
  };
}

/**
 * Computes composite scores for quick initial domain scans (e.g., landing page & onboarding)
 *
 * @param {object} scan - Result from scanDomain
 * @returns {{ overall: number, technical: number, geo: number }}
 */
export function calculateQuickScanScores(scan = {}) {
  const technical = Number(scan.technicalScore || 75);
  const geo = Number(scan.geoScore || 65);
  const overall = Math.round((technical * 0.5) + (geo * 0.5));
  return {
    overall,
    technical,
    geo
  };
}
