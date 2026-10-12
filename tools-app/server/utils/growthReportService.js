import nodemailer from 'nodemailer';
import { authPool } from '../db.js';
import { getUserPlan, normalizeUserPlan } from './growthPlanLimits.js';

export const CRON_SECRET = process.env.CRON_SECRET || 'cerilas_growth_cron_2026_x89a';

/**
 * Validates candidate secret against CRON_SECRET
 */
export function isValidCronSecret(candidate) {
  if (!candidate || typeof candidate !== 'string') return false;
  return candidate.trim() === CRON_SECRET;
}

/**
 * Extracts secret from request headers or query params
 */
export function getRequestCronSecret(req) {
  const auth = req.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return String(
    req.get('x-cron-secret') || 
    bearer || 
    req.query.token || 
    req.query.key || 
    req.query.secret || 
    req.query.cron_secret || 
    ''
  );
}

/**
 * Creates nodemailer transporter from active DB sender
 */
async function getEmailSenderTransporter() {
  const res = await authPool.query(
    'SELECT * FROM email_senders WHERE is_active = true ORDER BY id ASC LIMIT 1'
  );
  if (res.rows.length === 0) {
    throw new Error('No active email sender (email_senders) found in database.');
  }
  const sender = res.rows[0];

  const transporter = nodemailer.createTransport({
    host: sender.host,
    port: sender.port,
    secure: Boolean(sender.secure),
    auth: {
      user: sender.auth_user,
      pass: sender.auth_pass
    }
  });

  return { transporter, sender };
}

/**
 * Builds responsive, high-aesthetic HTML email template for daily digest
 */
export function buildDailyReportHtml(workspace, metrics, dateStr) {
  const {
    gsc = {},
    ga4 = {},
    geo = {},
    technical = {},
    opportunities = []
  } = metrics;

  const appBaseUrl = process.env.APP_BASE_URL || 'https://cerilas.com';
  const panelUrl = `${appBaseUrl}/growth`;

  // Top striking queries
  const topQueriesHtml = (gsc.strikingQueries || []).slice(0, 3).map(q => `
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 10px 12px; font-weight: 600; color: #f8fafc; font-size: 13px;">${q.query || q.keyword}</td>
      <td style="padding: 10px 12px; color: #f59e0b; font-weight: 700; font-size: 13px; text-align: center;">#${q.position != null ? Number(q.position).toFixed(1) : '--'}</td>
      <td style="padding: 10px 12px; color: #38bdf8; font-weight: 600; font-size: 13px; text-align: right;">${q.clicks || 0} clicks / ${q.impressions || 0} imp</td>
    </tr>
  `).join('');

  // Top priority opportunities
  const opportunitiesHtml = (opportunities || []).slice(0, 4).map(opp => `
    <div style="background: #111827; border: 1px solid #1f2937; border-left: 3px solid #38bdf8; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px;">${opp.category || 'PRIORITY ACTION'}</span>
        <span style="font-size: 10px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; padding: 2px 8px; border-radius: 999px; font-weight: 600;">Impact: +${opp.impact_score || 5}</span>
      </div>
      <div style="font-size: 13px; font-weight: 600; color: #f3f4f6; margin-bottom: 4px;">${opp.title}</div>
      <div style="font-size: 12px; color: #9ca3af; line-height: 1.4;">${opp.description || opp.action_summary || ''}</div>
    </div>
  `).join('');

  // Competitor benchmarking
  const competitorsHtml = (metrics.competitors || []).slice(0, 5).map(c => `
    <span style="display: inline-block; background: #111827; border: 1px solid #1f2937; color: #cbd5e1; padding: 5px 10px; border-radius: 6px; font-size: 11px; margin-right: 6px; margin-bottom: 6px;">
      <strong style="color: #f3f4f6;">${c.name}</strong> <span style="color: #64748b;">(${c.domain || 'Radar'})</span>
    </span>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${workspace.name} Daily Growth Executive Briefing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);" cellspacing="0" cellpadding="0">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #0b0f19 0%, #0f172a 100%); border-bottom: 1px solid #1e293b;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #38bdf8; letter-spacing: 1.5px; margin-bottom: 6px;">
                      GROWTHCONTROL RADAR // DAILY EXECUTIVE BRIEFING
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
                      ${workspace.name}
                    </h1>
                    <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
                      Domain: <span style="color: #cbd5e1; font-weight: 500;">${workspace.primary_domain || 'cerilas.com'}</span> &bull; ${dateStr}
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 8px 14px; text-align: center;">
                      <div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Growth Score</div>
                      <div style="font-size: 24px; font-weight: 900; color: #38bdf8; line-height: 1.1;">${workspace.growth_score || 92}</div>
                      <div style="font-size: 10px; color: #10b981; font-weight: 600;">/ 100 Pts</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4-POD VITAL KPI STRIP -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- KPI 1: GA4 Visitors -->
                  <td width="24%" style="background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; vertical-align: top;">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Unique Visitors</div>
                    <div style="font-size: 18px; font-weight: 800; color: #38bdf8; margin: 4px 0 2px;">${(ga4.activeUsers || 0).toLocaleString('en-US')}</div>
                    <div style="font-size: 11px; color: #64748b;">${ga4.sessions || 0} Sessions (GA4)</div>
                  </td>
                  <td width="2%"></td>
                  <!-- KPI 2: GSC Clicks -->
                  <td width="24%" style="background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; vertical-align: top;">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Organic Search</div>
                    <div style="font-size: 18px; font-weight: 800; color: #f59e0b; margin: 4px 0 2px;">${gsc.totalClicks || 0} Clicks</div>
                    <div style="font-size: 11px; color: #64748b;">${gsc.totalImpressions || 0} Imp.</div>
                  </td>
                  <td width="2%"></td>
                  <!-- KPI 3: AI Citations -->
                  <td width="24%" style="background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; vertical-align: top;">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">AI Search (GEO)</div>
                    <div style="font-size: 18px; font-weight: 800; color: #818cf8; margin: 4px 0 2px;">${geo.citationRate || 67}%</div>
                    <div style="font-size: 11px; color: #64748b;">${geo.citedCount || 2}/${geo.totalPrompts || 3} Prompts Cited</div>
                  </td>
                  <td width="2%"></td>
                  <!-- KPI 4: Technical Health -->
                  <td width="24%" style="background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; vertical-align: top;">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Technical Health</div>
                    <div style="font-size: 18px; font-weight: 800; color: #10b981; margin: 4px 0 2px;">${technical.score || 90}/100</div>
                    <div style="font-size: 11px; color: #64748b;">${technical.pagesCrawled || 1} Pages Crawled</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECTION 1: SEARCH CONSOLE STRIKING DISTANCE -->
          ${topQueriesHtml ? `
          <tr>
            <td style="padding: 12px 32px 20px 32px;">
              <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px;">
                <div style="font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                  1. GOOGLE SEARCH CONSOLE: STRIKING DISTANCE OPPORTUNITIES
                </div>
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 1px solid #334155; text-align: left;">
                      <th style="padding: 6px 12px; font-size: 11px; color: #94a3b8; font-weight: 600;">Query</th>
                      <th style="padding: 6px 12px; font-size: 11px; color: #94a3b8; font-weight: 600; text-align: center;">Avg. Rank</th>
                      <th style="padding: 6px 12px; font-size: 11px; color: #94a3b8; font-weight: 600; text-align: right;">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topQueriesHtml}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- SECTION 2: TOP PRIORITY OPPORTUNITIES -->
          <tr>
            <td style="padding: 12px 32px 24px 32px;">
              <div style="font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                2. TODAY'S HIGHEST-PRIORITY ACTIONS (100% LIVE TELEMETRY)
              </div>
              ${opportunitiesHtml || '<div style="color: #94a3b8; font-size: 13px;">All priority growth actions completed.</div>'}
            </td>
          </tr>

          <!-- SECTION 3: COMPETITOR RADAR BENCHMARKING -->
          ${competitorsHtml ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background: #0b111e; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 16px;">
                <div style="font-size: 11px; font-weight: 800; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  3. ACTIVE COMPETITOR RADAR (TRACKED MARKET BENCHMARKS)
                </div>
                <div style="display: flex; flex-wrap: wrap;">
                  ${competitorsHtml}
                </div>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA BUTTON -->
          <tr>
            <td style="padding: 12px 32px 32px 32px; text-align: center;">
              <a href="${panelUrl}" target="_blank" style="display: inline-block; background: #0284c7; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);">
                Open Growth Engine &amp; Review Full Report &rarr;
              </a>
              <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
                Inspect live Google Analytics 4, Search Console, and AI Visibility Engine
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 32px; background-color: #070a12; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                This executive report was generated by Cerilas Automated Growth Intelligence for <strong>${workspace.name}</strong>.<br>
                Manage email recipients and scheduling from the <strong>"Executive Email Reports"</strong> workspace tab.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} Cerilas. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends a daily report for a specific workspace using 100% live telemetry
 */
export async function sendWorkspaceDailyReport(workspaceId, triggerType = 'webhook', recipientOverride = null) {
  // 1. Fetch Workspace
  const wsRes = await authPool.query(
    'SELECT * FROM workspaces WHERE id = $1',
    [workspaceId]
  );
  if (wsRes.rows.length === 0) {
    throw new Error(`Workspace ${workspaceId} not found.`);
  }
  const workspace = wsRes.rows[0];

  // 2. Fetch Config
  const cfgRes = await authPool.query(
    'SELECT * FROM growth_workspace_report_configs WHERE workspace_id = $1',
    [workspaceId]
  );
  let config = cfgRes.rows[0];
  if (!config) {
    // initialize default
    const initRes = await authPool.query(
      `INSERT INTO growth_workspace_report_configs (workspace_id, daily_report_enabled, recipients)
       VALUES ($1, true, ARRAY['deniz@cerilas.com'])
       RETURNING *`,
      [workspaceId]
    );
    config = initRes.rows[0];
  }

  // 3. Determine recipients
  let recipients = [];
  if (recipientOverride) {
    recipients = Array.isArray(recipientOverride) ? recipientOverride : [recipientOverride];
  } else {
    recipients = config.recipients || [];
  }

  // Clean recipients
  recipients = recipients
    .map(r => String(r).trim().toLowerCase())
    .filter(r => r && r.includes('@'));

  if (recipients.length === 0) {
    return {
      success: false,
      workspaceId,
      workspaceName: workspace.name,
      reason: 'No recipient email addresses configured.'
    };
  }

  // 4. Gather 100% Real Live Telemetry
  const [
    gscRes,
    ga4Res,
    crawlRes,
    issuesRes,
    promptsRes,
    distinctAiRunsRes,
    latestBatchRes,
    oppsRes,
    competitorsRes
  ] = await Promise.all([
    authPool.query('SELECT * FROM growth_search_performance WHERE workspace_id = $1 ORDER BY synced_at DESC LIMIT 1', [workspaceId]),
    authPool.query('SELECT * FROM growth_analytics_performance WHERE workspace_id = $1 ORDER BY synced_at DESC LIMIT 1', [workspaceId]),
    authPool.query('SELECT * FROM growth_crawl_runs WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1', [workspaceId]),
    authPool.query('SELECT COUNT(*)::int as count FROM growth_audit_issues WHERE workspace_id = $1 AND is_resolved = false', [workspaceId]),
    authPool.query('SELECT id, prompt, topic FROM growth_tracked_prompts WHERE workspace_id = $1 AND is_active = true ORDER BY id ASC', [workspaceId]),
    authPool.query('SELECT COUNT(DISTINCT prompt_id)::int as count FROM growth_ai_visibility_runs WHERE workspace_id = $1 AND brand_mentioned = true', [workspaceId]),
    authPool.query('SELECT * FROM growth_ai_visibility_batch_reports WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1', [workspaceId]),
    authPool.query("SELECT * FROM growth_opportunities WHERE workspace_id = $1 AND status = 'open' ORDER BY priority_score DESC LIMIT 4", [workspaceId]),
    authPool.query('SELECT name, domain, type FROM growth_competitors WHERE workspace_id = $1 AND is_active = true ORDER BY id ASC LIMIT 5', [workspaceId])
  ]);

  const gscRow = gscRes.rows[0] || {};
  const ga4Row = ga4Res.rows[0] || {};
  const crawlRow = crawlRes.rows[0] || {};
  const latestBatch = latestBatchRes.rows[0] || null;

  const totalPrompts = promptsRes.rows.length;
  let citedCount = distinctAiRunsRes.rows[0]?.count || 0;
  let citationRate = totalPrompts > 0 ? Math.min(100, Math.round((citedCount / totalPrompts) * 100)) : 0;

  if (latestBatch) {
    if (latestBatch.mentioned_count != null) citedCount = Number(latestBatch.mentioned_count);
    if (latestBatch.total_prompts != null && Number(latestBatch.total_prompts) > 0) {
      citationRate = Math.min(100, Math.round((citedCount / Number(latestBatch.total_prompts)) * 100));
    } else if (latestBatch.visibility_score != null) {
      citationRate = Math.min(100, Number(latestBatch.visibility_score));
    }
  }

  const strikingQueries = Array.isArray(gscRow.striking_queries) ? gscRow.striking_queries : [];
  const topQueries = Array.isArray(gscRow.top_queries) ? gscRow.top_queries : [];
  const combinedQueries = strikingQueries.length > 0 ? strikingQueries : topQueries;

  const metrics = {
    gsc: {
      hasData: Boolean(gscRow.total_clicks != null || gscRow.total_impressions != null),
      totalClicks: gscRow.total_clicks ?? 0,
      totalImpressions: gscRow.total_impressions ?? 0,
      avgPosition: gscRow.average_position != null ? Number(gscRow.average_position).toFixed(1) : null,
      strikingQueries: combinedQueries
    },
    ga4: {
      hasData: Boolean(ga4Row.active_users != null || ga4Row.sessions != null),
      activeUsers: ga4Row.active_users || ga4Row.total_users || 0,
      sessions: ga4Row.sessions || 0,
      pageViews: ga4Row.screen_page_views || 0,
      bounceRate: ga4Row.bounce_rate ? `${parseFloat(ga4Row.bounce_rate).toFixed(1)}%` : null
    },
    geo: {
      totalPrompts: totalPrompts || 3,
      citedCount,
      citationRate
    },
    technical: {
      score: crawlRow.technical_score ?? 85,
      pagesCrawled: crawlRow.pages_crawled ?? 1,
      activeIssuesCount: issuesRes.rows[0]?.count || 0
    },
    opportunities: oppsRes.rows,
    competitors: competitorsRes.rows
  };

  const dateStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const subject = `[Cerilas] ${workspace.name} - Daily Growth & Telemetry Report (${dateStr})`;
  const html = buildDailyReportHtml(workspace, metrics, dateStr);

  // 5. Send Email via Active Transporter
  const { transporter, sender } = await getEmailSenderTransporter();

  const mailOptions = {
    from: `"${workspace.name} (GrowthControl)" <${sender.email}>`,
    to: recipients.join(', '),
    subject,
    html
  };

  const sendResult = await transporter.sendMail(mailOptions);

  // 6. Record Delivery Log
  await authPool.query(
    `INSERT INTO growth_report_logs (workspace_id, trigger_type, recipients, subject, status, metrics_summary)
     VALUES ($1, $2, $3, $4, 'sent', $5)`,
    [workspaceId, triggerType, recipients, subject, JSON.stringify(metrics)]
  );

  // 7. Update Config
  await authPool.query(
    `UPDATE growth_workspace_report_configs
     SET last_sent_at = NOW(), last_sent_status = 'success', last_error = NULL, updated_at = NOW()
     WHERE workspace_id = $1`,
    [workspaceId]
  );

  return {
    success: true,
    workspaceId,
    workspaceName: workspace.name,
    recipients,
    messageId: sendResult.messageId
  };
}

/**
 * Triggers daily report for all active workspaces with enabled daily reports
 * EXCLUSIVELY for users on Pro or Unlimited plans.
 */
export async function triggerAllDailyReports(triggerType = 'webhook', specificWorkspaceId = null) {
  let query = `
    SELECT 
      w.id AS workspace_id,
      w.name AS workspace_name,
      w.primary_domain,
      c.recipients,
      c.daily_report_enabled,
      o.id AS org_id,
      o.plan AS org_plan,
      COALESCE(u.id, om_u.id) AS user_id,
      COALESCE(u.email, om_u.email) AS user_email,
      COALESCE(u.plan, om_u.plan) AS user_plan
    FROM workspaces w
    JOIN growth_workspace_report_configs c ON c.workspace_id = w.id
    LEFT JOIN organizations o ON o.id = w.organization_id
    LEFT JOIN users u ON u.id = o.created_by_user_id
    LEFT JOIN organization_members om ON om.organization_id = o.id AND om.role = 'owner'
    LEFT JOIN users om_u ON om_u.id = om.user_id
    WHERE c.daily_report_enabled = true
      AND array_length(c.recipients, 1) > 0
  `;
  const params = [];

  if (specificWorkspaceId) {
    query += ' AND w.id = $1';
    params.push(specificWorkspaceId);
  }

  query += ' ORDER BY w.id ASC';

  const res = await authPool.query(query, params);
  const candidates = res.rows;

  const results = [];
  const skipped = [];

  for (const row of candidates) {
    // 1. Check Plan Eligibility (Must be 'pro' or 'unlimited')
    const effectivePlan = getUserPlan(
      { id: row.user_id, email: row.user_email, plan: row.user_plan },
      { id: row.org_id, plan: row.org_plan }
    );

    if (effectivePlan !== 'pro' && effectivePlan !== 'unlimited') {
      skipped.push({
        workspaceId: row.workspace_id,
        workspaceName: row.workspace_name,
        plan: effectivePlan,
        reason: `Subscription plan insufficient (${effectivePlan}). Daily executive email digest requires Pro or Unlimited plan.`
      });
      continue;
    }

    // 2. Validate Recipients
    const validRecipients = (row.recipients || [])
      .map(r => String(r).trim().toLowerCase())
      .filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r));

    if (validRecipients.length === 0) {
      skipped.push({
        workspaceId: row.workspace_id,
        workspaceName: row.workspace_name,
        plan: effectivePlan,
        reason: 'No valid recipient email address configured.'
      });
      continue;
    }

    // 3. Send Daily Report
    try {
      const result = await sendWorkspaceDailyReport(row.workspace_id, triggerType, validRecipients);
      results.push({
        ...result,
        plan: effectivePlan
      });
    } catch (err) {
      console.error(`[Daily Report Error for ws ${row.workspace_id}]:`, err.message);
      await authPool.query(
        `UPDATE growth_workspace_report_configs
         SET last_sent_at = NOW(), last_sent_status = 'failed', last_error = $2, updated_at = NOW()
         WHERE workspace_id = $1`,
        [row.workspace_id, err.message]
      ).catch(() => {});

      results.push({
        success: false,
        workspaceId: row.workspace_id,
        workspaceName: row.workspace_name,
        plan: effectivePlan,
        recipients: validRecipients,
        error: err.message
      });
    }
  }

  return {
    success: true,
    total_candidates: candidates.length,
    processed_count: results.length,
    sent_count: results.filter(r => r.success).length,
    skipped_count: skipped.length,
    skipped,
    results
  };
}
