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

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const isNum = (value) => value != null && value !== '' && Number.isFinite(Number(value));

const formatNumber = (value) => (Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-US') : '0');

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const INK = '#18181b';
const BODY = '#3f3f46';
const MUTED = '#71717a';
const FAINT = '#a1a1aa';
const LINE = '#e4e4e7';
const PAGE = '#f4f4f5';

/**
 * Builds the minimal, email-client-safe HTML template for the daily digest.
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
  const name = escapeHtml(workspace.name || 'Your workspace');
  const domain = escapeHtml(workspace.primary_domain || '');
  const growthScore = isNum(workspace.growth_score) ? Number(workspace.growth_score) : null;

  const sectionTitle = (title) => `
    <tr><td style="padding: 28px 32px 10px 32px; font-family: ${FONT}; font-size: 13px; font-weight: 600; color: ${INK};">${title}</td></tr>`;

  const kpiCell = (label, value, note, borderRight, borderBottom) => `
    <td width="50%" valign="top" style="padding: 18px 20px; border-right: ${borderRight ? `1px solid ${LINE}` : '0'}; border-bottom: ${borderBottom ? `1px solid ${LINE}` : '0'}; font-family: ${FONT};">
      <div style="font-size: 12px; color: ${MUTED}; margin: 0 0 6px 0;">${label}</div>
      <div style="font-size: 24px; line-height: 1.15; font-weight: 600; color: ${INK}; letter-spacing: -0.4px;">${value}</div>
      <div style="font-size: 12px; color: ${FAINT}; margin-top: 4px;">${note}</div>
    </td>`;

  const queries = (gsc.strikingQueries || []).slice(0, 5);
  const queriesHtml = queries.map((q, i) => `
    <tr>
      <td style="padding: 11px 0; border-top: ${i === 0 ? '0' : `1px solid ${LINE}`}; font-family: ${FONT}; font-size: 14px; color: ${INK};">${escapeHtml(q.query || q.keyword)}</td>
      <td align="right" style="padding: 11px 0 11px 12px; border-top: ${i === 0 ? '0' : `1px solid ${LINE}`}; font-family: ${FONT}; font-size: 13px; color: ${MUTED}; white-space: nowrap;">#${q.position != null ? Number(q.position).toFixed(1) : '–'}</td>
      <td align="right" style="padding: 11px 0 11px 16px; border-top: ${i === 0 ? '0' : `1px solid ${LINE}`}; font-family: ${FONT}; font-size: 13px; color: ${MUTED}; white-space: nowrap;">${formatNumber(q.clicks)} clicks · ${formatNumber(q.impressions)} impr.</td>
    </tr>`).join('');

  const actionsHtml = (opportunities || []).slice(0, 4).map((opp, i) => `
    <tr>
      <td valign="top" width="28" style="padding: 14px 0; border-top: ${i === 0 ? '0' : `1px solid ${LINE}`}; font-family: ${FONT}; font-size: 13px; color: ${FAINT};">${i + 1}.</td>
      <td valign="top" style="padding: 14px 0; border-top: ${i === 0 ? '0' : `1px solid ${LINE}`}; font-family: ${FONT};">
        <div style="font-size: 14px; font-weight: 600; color: ${INK}; line-height: 1.4;">${escapeHtml(opp.title)}</div>
        ${opp.description || opp.action_summary ? `<div style="font-size: 13px; color: ${BODY}; line-height: 1.5; margin-top: 3px;">${escapeHtml(opp.description || opp.action_summary)}</div>` : ''}
        <div style="font-size: 12px; color: ${FAINT}; margin-top: 6px;">${escapeHtml(opp.category || 'Action')}${opp.impact_score != null ? ` · Impact +${escapeHtml(opp.impact_score)}` : ''}</div>
      </td>
    </tr>`).join('');

  const competitors = (metrics.competitors || []).slice(0, 5)
    .map((c) => `${escapeHtml(c.name)}${c.domain ? ` <span style="color: ${FAINT};">(${escapeHtml(c.domain)})</span>` : ''}`)
    .join(`<span style="color: ${FAINT};"> &nbsp;·&nbsp; </span>`);

  const visitors = ga4.hasData === false ? '–' : formatNumber(ga4.activeUsers);
  const clicks = gsc.hasData === false ? '–' : formatNumber(gsc.totalClicks);
  const citation = isNum(geo.citationRate) ? `${Number(geo.citationRate)}%` : '–';
  const techScore = isNum(technical.score) ? `${Number(technical.score)}` : '–';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${name} daily growth report</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${PAGE}; -webkit-text-size-adjust: 100%;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${visitors} visitors, ${clicks} search clicks and ${citation} AI citation rate for ${name} today.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${PAGE};">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid ${LINE}; border-radius: 12px;">

          <tr>
            <td style="padding: 28px 32px 24px 32px; border-bottom: 1px solid ${LINE};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="top" style="font-family: ${FONT};">
                    <div style="font-size: 12px; color: ${MUTED}; margin-bottom: 10px;">Daily growth report</div>
                    <div style="font-size: 22px; line-height: 1.25; font-weight: 600; color: ${INK}; letter-spacing: -0.4px;">${name}</div>
                    <div style="font-size: 13px; color: ${MUTED}; margin-top: 4px;">${domain ? `${domain} · ` : ''}${escapeHtml(dateStr)}</div>
                  </td>
                  ${growthScore != null ? `
                  <td valign="top" align="right" style="font-family: ${FONT}; white-space: nowrap;">
                    <div style="font-size: 12px; color: ${MUTED}; margin-bottom: 4px;">Growth score</div>
                    <div style="font-size: 30px; line-height: 1; font-weight: 600; color: ${INK}; letter-spacing: -0.6px;">${growthScore}<span style="font-size: 14px; font-weight: 400; color: ${FAINT};">/100</span></div>
                  </td>` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid ${LINE}; border-radius: 10px; border-collapse: separate;">
                <tr>
                  ${kpiCell('Visitors', visitors, `${formatNumber(ga4.sessions)} sessions`, true, true)}
                  ${kpiCell('Search clicks', clicks, `${formatNumber(gsc.totalImpressions)} impressions${gsc.avgPosition ? ` · avg. #${escapeHtml(gsc.avgPosition)}` : ''}`, false, true)}
                </tr>
                <tr>
                  ${kpiCell('AI citation rate', citation, `${formatNumber(geo.citedCount)} of ${formatNumber(geo.totalPrompts)} prompts`, true, false)}
                  ${kpiCell('Technical health', techScore, `${formatNumber(technical.pagesCrawled)} pages · ${formatNumber(technical.activeIssuesCount)} open issues`, false, false)}
                </tr>
              </table>
            </td>
          </tr>

          ${queriesHtml ? `
          ${sectionTitle('Queries close to page one')}
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${queriesHtml}
              </table>
            </td>
          </tr>` : ''}

          ${sectionTitle('Top actions for today')}
          <tr>
            <td style="padding: 0 32px;">
              ${actionsHtml
                ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${actionsHtml}
              </table>`
                : `<div style="font-family: ${FONT}; font-size: 14px; color: ${MUTED}; padding: 4px 0;">No open actions. Nice work.</div>`}
            </td>
          </tr>

          ${competitors ? `
          ${sectionTitle('Tracked competitors')}
          <tr>
            <td style="padding: 0 32px; font-family: ${FONT}; font-size: 14px; line-height: 1.7; color: ${BODY};">${competitors}</td>
          </tr>` : ''}

          <tr>
            <td style="padding: 32px 32px 32px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 8px; background-color: ${INK};">
                    <a href="${escapeHtml(panelUrl)}" target="_blank" style="display: inline-block; padding: 12px 22px; font-family: ${FONT}; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Open full report</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 20px 32px; font-family: ${FONT}; font-size: 12px; line-height: 1.6; color: ${FAINT};">
              Sent by Cerilas Growth for ${name}. Manage recipients and schedule under Email Reports in your workspace.<br>
              &copy; ${new Date().getFullYear()} Cerilas
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
      totalPrompts,
      citedCount,
      citationRate
    },
    technical: {
      score: crawlRow.technical_score ?? null,
      pagesCrawled: crawlRow.pages_crawled ?? 0,
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

  const subject = `[Cerilas] ${workspace.name} - Daily growth report, ${dateStr}`;
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
