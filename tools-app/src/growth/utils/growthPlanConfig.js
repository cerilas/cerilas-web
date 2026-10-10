/**
 * Growth Tool Plan Limits Configuration strictly matching Pricing Plan.xlsx:
 * 
 * 1. Number of addable workspaces (websites): Free: 1, Pro: 3, Unlimited: Unlimited
 * 2. Addable GEO prompts: Free: 3, Pro: 5, Unlimited: 10
 * 3. Trackable GEO prompts: Free: 0 (Locked), Pro: 5, Unlimited: 10
 * 4. Competitor Tracking Radar: Free: 0 (Locked), Pro: 3, Unlimited: Unlimited
 * 5. Technical Site Audit & Issues: Free: 0 (Locked), Pro: Unlimited, Unlimited: Unlimited
 * 6. Daily Executive Email Digest: Free: 0 (Locked), Pro: Unlimited, Unlimited: Unlimited
 * 7. Priority Action Feed - AI Button Usage: Free: 1 Daily, Pro: 3 Daily, Unlimited: Unlimited
 * 8. Discover Competitors with AI Button Usage: Free: 1 Daily, Pro: 3 Daily, Unlimited: Unlimited
 */

export const GROWTH_PLAN_CONFIG = {
  free: {
    key: 'free',
    name: 'Free',
    badge: 'Free Starter',
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
    badge: 'Pro Tier',
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
    badge: 'Unlimited Power',
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

export function getClientPlanLimits(planKey) {
  const p = String(planKey || 'free').toLowerCase();
  if (p === 'unlimited' || p === 'enterprise') return GROWTH_PLAN_CONFIG.unlimited;
  if (p === 'pro') return GROWTH_PLAN_CONFIG.pro;
  return GROWTH_PLAN_CONFIG.free;
}
