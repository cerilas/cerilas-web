import { authPool } from '../db.js';

/**
 * Plan definitions and limits strictly aligned with Pricing Plan.xlsx:
 * 1. Number of addable workspaces (websites): Free: 1, Pro: 3, Unlimited: Unlimited
 * 2. Addable GEO prompts: Free: 3, Pro: 5, Unlimited: 10
 * 3. Trackable GEO prompts: Free: 0, Pro: 5, Unlimited: 10
 * 4. Competitor Tracking Radar: Free: 0, Pro: 3, Unlimited: Unlimited
 * 5. Technical Site Audit & Issues: Free: 0 (Locked), Pro: Unlimited, Unlimited: Unlimited
 * 6. Daily Executive Email Digest: Free: 0 (Locked), Pro: Unlimited, Unlimited: Unlimited
 * 7. Priority Action Feed - AI Button Usage: Free: 1 Daily, Pro: 3 Daily, Unlimited: Unlimited
 * 8. Discover Competitors with AI Button Usage: Free: 1 Daily, Pro: 3 Daily, Unlimited: Unlimited
 */
export const GROWTH_PLAN_LIMITS = {
  free: {
    key: 'free',
    name: 'Free',
    workspaces: 1,
    addablePrompts: 3,
    trackablePrompts: 0,
    competitors: 0,
    technicalAudit: false,
    dailyEmailDigest: false,
    actionFeedAiDaily: 1,
    discoverCompetitorsAiDaily: 1
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    workspaces: 3,
    addablePrompts: 5,
    trackablePrompts: 5,
    competitors: 3,
    technicalAudit: true,
    dailyEmailDigest: true,
    actionFeedAiDaily: 3,
    discoverCompetitorsAiDaily: 3
  },
  unlimited: {
    key: 'unlimited',
    name: 'Unlimited',
    workspaces: Infinity,
    addablePrompts: 10,
    trackablePrompts: 10,
    competitors: Infinity,
    technicalAudit: true,
    dailyEmailDigest: true,
    actionFeedAiDaily: Infinity,
    discoverCompetitorsAiDaily: Infinity
  }
};

/**
 * Resolve effective plan string: 'free' | 'pro' | 'unlimited'
 */
export function normalizeUserPlan(rawPlan) {
  const p = String(rawPlan || 'free').trim().toLowerCase();
  if (p === 'unlimited' || p === 'enterprise') return 'unlimited';
  if (p === 'pro') return 'pro';
  return 'free';
}

export function getUserPlan(user, org = null) {
  const raw = user?.plan || org?.plan || 'free';
  return normalizeUserPlan(raw);
}

export function getPlanLimits(planKey) {
  const normalized = normalizeUserPlan(planKey);
  return GROWTH_PLAN_LIMITS[normalized] || GROWTH_PLAN_LIMITS.free;
}

/**
 * Ensure daily feature usage tracking table exists
 */
let isTableInitialized = false;
export async function ensureDailyUsageTable() {
  if (isTableInitialized) return;
  try {
    await authPool.query(`
      CREATE TABLE IF NOT EXISTS growth_feature_daily_usage (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        feature VARCHAR(64) NOT NULL,
        usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
        usage_count INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, feature, usage_date)
      );
      CREATE INDEX IF NOT EXISTS idx_growth_feature_daily_usage 
        ON growth_feature_daily_usage(user_id, feature, usage_date);
    `);
    isTableInitialized = true;
  } catch (err) {
    console.warn('[Growth Limits] ensureDailyUsageTable notice:', err.message);
  }
}

// Auto-run migration
ensureDailyUsageTable();

/**
 * 1. Check workspace limit
 */
export async function checkWorkspaceLimit(orgId, userPlan) {
  const planLimits = getPlanLimits(userPlan);
  if (planLimits.workspaces === Infinity) return { allowed: true };

  const countRes = await authPool.query(
    'SELECT COUNT(*)::int as count FROM workspaces WHERE organization_id = $1',
    [orgId]
  );
  const currentCount = parseInt(countRes.rows[0]?.count || 0, 10);

  if (currentCount >= planLimits.workspaces) {
    const isFree = userPlan === 'free';
    return {
      allowed: false,
      current: currentCount,
      limit: planLimits.workspaces,
      plan: userPlan,
      error: isFree
        ? `On the Free plan, you can add up to ${planLimits.workspaces} workspace (website). Please upgrade to Pro (3 workspaces) or Unlimited (unlimited workspaces) to add more.`
        : `On the Pro plan, you can add up to ${planLimits.workspaces} workspaces. Please upgrade to Unlimited for unlimited workspaces.`
    };
  }

  return { allowed: true, current: currentCount, limit: planLimits.workspaces };
}

/**
 * 2. Check addable prompts limit
 */
export async function checkAddablePromptsLimit(workspaceId, userPlan, additionalCount = 1) {
  const planLimits = getPlanLimits(userPlan);
  const maxAllowed = planLimits.addablePrompts;

  const countRes = await authPool.query(
    'SELECT COUNT(*)::int as count FROM growth_tracked_prompts WHERE workspace_id = $1',
    [workspaceId]
  );
  const currentCount = parseInt(countRes.rows[0]?.count || 0, 10);

  if (currentCount + additionalCount > maxAllowed) {
    const isFree = userPlan === 'free';
    const isPro = userPlan === 'pro';
    return {
      allowed: false,
      current: currentCount,
      limit: maxAllowed,
      plan: userPlan,
      error: isFree
        ? `On the Free plan, you can add up to ${maxAllowed} GEO prompts. Upgrade to Pro (5 prompts) or Unlimited (10 prompts) to add more queries.`
        : isPro
          ? `On the Pro plan, you can add up to ${maxAllowed} GEO prompts. Upgrade to Unlimited for 10 prompts.`
          : `You have reached the maximum limit of ${maxAllowed} prompts.`
    };
  }

  return { allowed: true, current: currentCount, limit: maxAllowed, availableSlots: Math.max(0, maxAllowed - currentCount) };
}

/**
 * 3. Check trackable prompts limit (running telemetry simulations)
 */
export async function checkTrackablePromptsLimit(workspaceId, userPlan) {
  const planLimits = getPlanLimits(userPlan);
  const maxAllowed = planLimits.trackablePrompts;

  if (maxAllowed <= 0) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      plan: userPlan,
      error: 'Live AI visibility prompt simulations and telemetry tracking are exclusive to Pro (5 prompts) and Unlimited (10 prompts) plans. Please upgrade your plan.'
    };
  }

  return { allowed: true, limit: maxAllowed, plan: userPlan };
}

/**
 * 4. Check competitor tracking radar limit
 */
export async function checkCompetitorLimit(workspaceId, userPlan) {
  const planLimits = getPlanLimits(userPlan);
  const maxAllowed = planLimits.competitors;

  if (maxAllowed <= 0) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      plan: userPlan,
      error: 'Competitor Tracking Radar is exclusive to Pro (3 competitors) and Unlimited (unlimited) plans. Competitors cannot be tracked on the Free plan. Please upgrade your plan.'
    };
  }

  if (maxAllowed === Infinity) {
    return { allowed: true, limit: Infinity, plan: userPlan };
  }

  const countRes = await authPool.query(
    'SELECT COUNT(*)::int as count FROM growth_competitors WHERE workspace_id = $1',
    [workspaceId]
  );
  const currentCount = parseInt(countRes.rows[0]?.count || 0, 10);

  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      current: currentCount,
      limit: maxAllowed,
      plan: userPlan,
      error: `On the Pro plan, you can monitor up to ${maxAllowed} competitors. Upgrade to Unlimited for unlimited competitor monitoring.`
    };
  }

  return { allowed: true, current: currentCount, limit: maxAllowed, plan: userPlan };
}

/**
 * 5. Check technical site audit access
 */
export function checkTechnicalAuditAccess(userPlan) {
  const planLimits = getPlanLimits(userPlan);
  if (!planLimits.technicalAudit) {
    return {
      allowed: false,
      plan: userPlan,
      error: 'Technical Site Audit & Issue Crawler is exclusive to Pro and Unlimited plans. Please upgrade your plan to audit your website.'
    };
  }
  return { allowed: true, plan: userPlan };
}

/**
 * 6. Check daily executive email report access
 */
export function checkDailyEmailReportAccess(userPlan) {
  const planLimits = getPlanLimits(userPlan);
  if (!planLimits.dailyEmailDigest) {
    return {
      allowed: false,
      plan: userPlan,
      error: 'Daily Executive Email Digest is exclusive to Pro and Unlimited plans. Please upgrade your plan to receive automated morning reports.'
    };
  }
  return { allowed: true, plan: userPlan };
}

/**
 * 7 & 8. Check and increment daily AI feature usage
 * Feature: 'action_feed_ai' | 'discover_competitors_ai'
 */
export async function checkAndIncrementDailyUsage(userId, feature, userPlan) {
  await ensureDailyUsageTable();
  const planLimits = getPlanLimits(userPlan);

  let maxAllowed = 1;
  let featureTitle = 'AI Feature';

  if (feature === 'action_feed_ai') {
    maxAllowed = planLimits.actionFeedAiDaily;
    featureTitle = 'Priority Action Feed AI Analysis';
  } else if (feature === 'discover_competitors_ai') {
    maxAllowed = planLimits.discoverCompetitorsAiDaily;
    featureTitle = 'AI Competitor Discovery';
  }

  if (maxAllowed === Infinity) {
    // Unlimited usage, still record usage stat for telemetry
    try {
      await authPool.query(
        `INSERT INTO growth_feature_daily_usage (user_id, feature, usage_date, usage_count)
         VALUES ($1, $2, CURRENT_DATE, 1)
         ON CONFLICT (user_id, feature, usage_date)
         DO UPDATE SET usage_count = growth_feature_daily_usage.usage_count + 1, updated_at = NOW()`,
        [userId, feature]
      );
    } catch (_) {}
    return { allowed: true, limit: Infinity, used: 0, plan: userPlan };
  }

  // Fetch current usage for today
  const usageRes = await authPool.query(
    `SELECT usage_count FROM growth_feature_daily_usage 
     WHERE user_id = $1 AND feature = $2 AND usage_date = CURRENT_DATE`,
    [userId, feature]
  );
  const currentUsed = parseInt(usageRes.rows[0]?.usage_count || 0, 10);

  if (currentUsed >= maxAllowed) {
    const isFree = userPlan === 'free';
    return {
      allowed: false,
      limitReached: true,
      limit: maxAllowed,
      used: currentUsed,
      plan: userPlan,
      error: isFree
        ? `You have reached your daily limit for ${featureTitle} (${maxAllowed}/day) on the Free plan. Upgrade to Pro for 3 daily uses or Unlimited for uncapped access.`
        : `You have reached your daily limit for ${featureTitle} (${maxAllowed}/day) on the Pro plan. Upgrade to Unlimited for uncapped access.`
    };
  }

  // Increment usage count
  const updatedRes = await authPool.query(
    `INSERT INTO growth_feature_daily_usage (user_id, feature, usage_date, usage_count)
     VALUES ($1, $2, CURRENT_DATE, 1)
     ON CONFLICT (user_id, feature, usage_date)
     DO UPDATE SET usage_count = growth_feature_daily_usage.usage_count + 1, updated_at = NOW()
     RETURNING usage_count`,
    [userId, feature]
  );
  const newUsed = parseInt(updatedRes.rows[0]?.usage_count || currentUsed + 1, 10);

  return {
    allowed: true,
    limit: maxAllowed,
    used: newUsed,
    remaining: Math.max(0, maxAllowed - newUsed),
    plan: userPlan
  };
}

/**
 * Get daily usage count for a feature today
 */
export async function getDailyFeatureUsage(userId, feature) {
  try {
    await ensureDailyUsageTable();
    const usageRes = await authPool.query(
      `SELECT usage_count FROM growth_feature_daily_usage 
       WHERE user_id = $1 AND feature = $2 AND usage_date = CURRENT_DATE`,
      [userId, feature]
    );
    return parseInt(usageRes.rows[0]?.usage_count || 0, 10);
  } catch (e) {
    return 0;
  }
}

/**
 * Get comprehensive summary of limits and usage for the current user and workspace
 */
export async function getGrowthLimitsSummary(userId, workspaceId, orgId, userPlan) {
  const planLimits = getPlanLimits(userPlan);

  let workspacesCount = 0;
  let promptsCount = 0;
  let competitorsCount = 0;

  try {
    if (orgId) {
      const wsCountRes = await authPool.query(
        'SELECT COUNT(*)::int as count FROM workspaces WHERE organization_id = $1',
        [orgId]
      );
      workspacesCount = parseInt(wsCountRes.rows[0]?.count || 0, 10);
    }

    if (workspaceId) {
      const [pRes, cRes] = await Promise.all([
        authPool.query('SELECT COUNT(*)::int as count FROM growth_tracked_prompts WHERE workspace_id = $1', [workspaceId]),
        authPool.query('SELECT COUNT(*)::int as count FROM growth_competitors WHERE workspace_id = $1', [workspaceId])
      ]);
      promptsCount = parseInt(pRes.rows[0]?.count || 0, 10);
      competitorsCount = parseInt(cRes.rows[0]?.count || 0, 10);
    }
  } catch (err) {
    console.warn('[Growth Limits Summary Error]:', err.message);
  }

  const [actionFeedAiUsed, discoverCompetitorsAiUsed] = await Promise.all([
    getDailyFeatureUsage(userId, 'action_feed_ai'),
    getDailyFeatureUsage(userId, 'discover_competitors_ai')
  ]);

  return {
    plan: userPlan,
    planName: planLimits.name,
    limits: {
      workspaces: planLimits.workspaces === Infinity ? 'Unlimited' : planLimits.workspaces,
      addablePrompts: planLimits.addablePrompts,
      trackablePrompts: planLimits.trackablePrompts,
      competitors: planLimits.competitors === Infinity ? 'Unlimited' : planLimits.competitors,
      technicalAudit: planLimits.technicalAudit,
      dailyEmailDigest: planLimits.dailyEmailDigest,
      actionFeedAiDaily: planLimits.actionFeedAiDaily === Infinity ? 'Unlimited' : planLimits.actionFeedAiDaily,
      discoverCompetitorsAiDaily: planLimits.discoverCompetitorsAiDaily === Infinity ? 'Unlimited' : planLimits.discoverCompetitorsAiDaily
    },
    usage: {
      workspacesCount,
      promptsCount,
      competitorsCount,
      actionFeedAiToday: actionFeedAiUsed,
      discoverCompetitorsAiToday: discoverCompetitorsAiUsed
    }
  };
}
