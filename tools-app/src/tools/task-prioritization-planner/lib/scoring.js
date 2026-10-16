import { diffDays, isIsoDate, todayIso } from './dates';
import { usableMinutesBetween } from './capacity';

export const CRITERION_TYPES = {
  rating: { label: 'Rating (1–5)', timeDependent: false },
  urgency: { label: 'Urgency (from deadline)', timeDependent: true },
  deadlineRisk: { label: 'Deadline risk (work vs. time left)', timeDependent: true },
  effort: { label: 'Effort (from estimated hours)', timeDependent: false }
};

export const DEFAULT_CRITERIA = [
  { id: 'impact', name: 'Business Impact', type: 'rating', direction: 'benefit', weight: 30, builtin: true, help: 'Revenue, customers or outcomes this task moves.' },
  { id: 'strategic', name: 'Strategic Alignment', type: 'rating', direction: 'benefit', weight: 20, builtin: true, help: 'How closely the task supports current goals or OKRs.' },
  { id: 'urgency', name: 'Urgency', type: 'urgency', direction: 'benefit', weight: 20, builtin: true, help: 'Derived from the deadline; tasks without one use the manual rating.' },
  { id: 'risk', name: 'Deadline Risk', type: 'deadlineRisk', direction: 'benefit', weight: 15, builtin: true, help: 'Remaining work compared with usable working time before the deadline.' },
  { id: 'effort', name: 'Effort', type: 'effort', direction: 'cost', weight: 15, builtin: true, help: 'Estimated hours relative to the largest task. Lower effort scores higher.' }
];

export const WEIGHT_PRESETS = {
  balanced: { label: 'Balanced', weights: { impact: 30, strategic: 20, urgency: 20, risk: 15, effort: 15 } },
  impact: { label: 'Impact first', weights: { impact: 40, strategic: 30, urgency: 10, risk: 10, effort: 10 } },
  deadline: { label: 'Deadline-driven', weights: { impact: 20, strategic: 10, urgency: 35, risk: 25, effort: 10 } },
  quickWins: { label: 'Quick wins', weights: { impact: 30, strategic: 10, urgency: 10, risk: 10, effort: 40 } }
};

export const PRIORITY_TIERS = [
  { id: 'critical', label: 'Critical', min: 75 },
  { id: 'high', label: 'High', min: 55 },
  { id: 'medium', label: 'Medium', min: 35 },
  { id: 'low', label: 'Low', min: 0 }
];

export function tierFor(score) {
  return PRIORITY_TIERS.find((t) => score >= t.min) || PRIORITY_TIERS[PRIORITY_TIERS.length - 1];
}

const clamp01 = (n) => Math.min(1, Math.max(0, n));

function ratingToUnit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return clamp01((Math.min(5, Math.max(1, n)) - 1) / 4);
}

/**
 * The reference date anchors the time-dependent criteria. By default it is
 * today, so changing the planning period never changes strategic priority.
 * Only when the user opts in does it follow the planning start date.
 */
export function scoringReferenceDate(settings) {
  if (settings.scoring?.reference === 'planningStart' && isIsoDate(settings.period?.start)) {
    return settings.period.start;
  }
  return todayIso();
}

export function scoreTasks(tasks, criteria, settings) {
  const active = criteria.filter((c) => Number(c.weight) > 0);
  const totalWeight = active.reduce((sum, c) => sum + Number(c.weight), 0);
  const refDate = scoringReferenceDate(settings);
  const urgencyWindow = Math.max(1, Number(settings.scoring?.urgencyWindowDays) || 30);
  const maxHours = Math.max(1, ...tasks.map((t) => Number(t.hours) || 0));
  const capacityCache = new Map();

  const capacityUntil = (deadline) => {
    if (!capacityCache.has(deadline)) {
      capacityCache.set(deadline, usableMinutesBetween(refDate, deadline, settings));
    }
    return capacityCache.get(deadline);
  };

  const results = {};
  for (const task of tasks) {
    const hasDeadline = isIsoDate(task.deadline);
    const breakdown = active.map((c) => {
      let unit = 0.5;
      let note = '';
      if (c.type === 'rating') {
        unit = ratingToUnit(task.ratings?.[c.id] ?? 3);
      } else if (c.type === 'urgency') {
        if (hasDeadline) {
          const daysLeft = diffDays(refDate, task.deadline);
          unit = daysLeft <= 0 ? 1 : clamp01(1 - daysLeft / urgencyWindow);
          note = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`;
        } else {
          unit = ratingToUnit(task.ratings?.[c.id] ?? 2);
          note = 'manual rating';
        }
      } else if (c.type === 'deadlineRisk') {
        if (hasDeadline) {
          const needed = Math.max(0, (Number(task.hours) || 0) * 60);
          const available = capacityUntil(task.deadline);
          unit = available <= 0 ? (needed > 0 ? 1 : 0) : clamp01(needed / available);
          note = `${Math.round(unit * 100)}% of usable time before deadline`;
        } else {
          unit = 0;
          note = 'no deadline';
        }
      } else if (c.type === 'effort') {
        unit = clamp01((Number(task.hours) || 0) / maxHours);
      }
      const value = c.direction === 'cost' ? 1 - unit : unit;
      const share = totalWeight > 0 ? Number(c.weight) / totalWeight : 0;
      return { criterionId: c.id, unit, value, contribution: value * share * 100, note };
    });
    const score = breakdown.reduce((sum, b) => sum + b.contribution, 0);
    results[task.id] = {
      score: Math.round(score * 10) / 10,
      tier: tierFor(score),
      breakdown
    };
  }
  return { scores: results, referenceDate: refDate, totalWeight };
}

export function applyPreset(criteria, presetId) {
  const preset = WEIGHT_PRESETS[presetId];
  if (!preset) return criteria;
  return criteria.map((c) => (preset.weights[c.id] !== undefined ? { ...c, weight: preset.weights[c.id] } : c));
}
