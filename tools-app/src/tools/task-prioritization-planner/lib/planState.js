import { addDays, todayIso, isIsoDate, formatTime, parseTime, weekdayOf } from './dates';
import { DEFAULT_CRITERIA } from './scoring';

export const STORAGE_KEY = 'cerilas_task_planner_v1';
export const STATE_VERSION = 1;

export const PERIOD_PRESETS = [
  { id: '1', label: '1 Day', days: 1 },
  { id: '3', label: '3 Days', days: 3 },
  { id: '7', label: '7 Days', days: 7 },
  { id: '14', label: '14 Days', days: 14 },
  { id: '30', label: '30 Days', days: 30 },
  { id: '90', label: '90 Days', days: 90 }
];

export const TASK_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const rule = (enabled, start, end, breakMinutes) => ({ enabled, start, end, breakMinutes });

export const SCHEDULE_TEMPLATES = {
  standard: {
    label: 'Standard 9–5',
    week: [rule(false, '09:00', '17:00', 60), rule(true, '09:00', '17:00', 60), rule(true, '09:00', '17:00', 60), rule(true, '09:00', '17:00', 60), rule(true, '09:00', '17:00', 60), rule(true, '09:00', '17:00', 60), rule(false, '09:00', '17:00', 60)]
  },
  mixed: {
    label: 'Varied hours (example)',
    week: [rule(false, '09:00', '17:00', 0), rule(true, '09:00', '15:30', 30), rule(true, '09:00', '13:00', 0), rule(true, '09:00', '17:30', 30), rule(true, '09:00', '14:30', 30), rule(true, '09:00', '15:30', 30), rule(false, '09:00', '17:00', 0)]
  },
  fourDay: {
    label: '4-day week',
    week: [rule(false, '08:00', '18:00', 60), rule(true, '08:00', '18:00', 60), rule(true, '08:00', '18:00', 60), rule(true, '08:00', '18:00', 60), rule(true, '08:00', '18:00', 60), rule(false, '08:00', '18:00', 60), rule(false, '08:00', '18:00', 60)]
  },
  partTime: {
    label: 'Part-time mornings',
    week: [rule(false, '09:00', '13:00', 0), rule(true, '09:00', '13:00', 0), rule(true, '09:00', '13:00', 0), rule(true, '09:00', '13:00', 0), rule(true, '09:00', '13:00', 0), rule(true, '09:00', '13:00', 0), rule(false, '09:00', '13:00', 0)]
  }
};

let idCounter = 0;
export function newId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createTask(partial = {}, index = 0) {
  return {
    id: newId('task'),
    title: 'New task',
    hours: 2,
    deadline: '',
    deadlineType: 'soft',
    earliestStart: '',
    dependsOn: [],
    allowSplit: true,
    done: false,
    notes: '',
    ratings: { impact: 3, strategic: 3, urgency: 2 },
    color: TASK_COLORS[index % TASK_COLORS.length],
    ...partial
  };
}

function nthWorkday(start, n, week) {
  let date = start;
  let count = week[weekdayOf(date)]?.enabled ? 1 : 0;
  while (count < n) {
    date = addDays(date, 1);
    if (week[weekdayOf(date)]?.enabled) count += 1;
  }
  return date;
}

export function createDefaultState() {
  const start = todayIso();
  const week = SCHEDULE_TEMPLATES.mixed.week.map((r) => ({ ...r }));
  const workday = (n) => nthWorkday(start, n, week);
  const tasks = [
    createTask({ title: 'Finalize Q4 launch plan', hours: 6, deadline: workday(3), ratings: { impact: 5, strategic: 5, urgency: 4 } }, 0),
    createTask({ title: 'Build pricing page', hours: 10, deadline: workday(7), ratings: { impact: 4, strategic: 4, urgency: 3 } }, 1),
    createTask({ title: 'Customer interview synthesis', hours: 4, ratings: { impact: 3, strategic: 4, urgency: 2 } }, 2),
    createTask({ title: 'Fix onboarding drop-off bug', hours: 3, deadline: workday(2), deadlineType: 'hard', ratings: { impact: 4, strategic: 3, urgency: 5 } }, 3),
    createTask({ title: 'Write launch announcement', hours: 3, deadline: workday(9), ratings: { impact: 3, strategic: 3, urgency: 2 } }, 4),
    createTask({ title: 'Refactor billing module', hours: 12, allowSplit: true, ratings: { impact: 2, strategic: 3, urgency: 1 } }, 5),
    createTask({ title: 'Quarterly board report', hours: 4, deadline: workday(10), allowSplit: false, ratings: { impact: 4, strategic: 4, urgency: 3 } }, 6)
  ];
  tasks[1].dependsOn = [tasks[0].id];
  tasks[4].dependsOn = [tasks[1].id];

  return {
    version: STATE_VERSION,
    settings: {
      period: { start, end: addDays(start, 13), preset: '14' },
      week,
      holidays: [],
      overrides: {},
      maxDailyHours: 8,
      bufferPercent: 15,
      minSessionMinutes: 30,
      scoring: { reference: 'today', urgencyWindowDays: 30 }
    },
    criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })),
    tasks,
    lockedBlocks: [
      { id: newId('lock'), taskId: null, title: 'Weekly team sync', date: workday(2), start: '10:00', end: '11:00' }
    ]
  };
}

function sanitizeTime(value, fallback) {
  return parseTime(value) === null ? fallback : formatTime(parseTime(value));
}

/** Validates persisted or imported state, dropping anything malformed. */
export function normalizeState(raw) {
  const base = createDefaultState();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw.settings || {};
  const period = s.period && isIsoDate(s.period.start) && isIsoDate(s.period.end)
    ? { start: s.period.start, end: s.period.end, preset: String(s.period.preset || 'custom') }
    : base.settings.period;
  const week = Array.isArray(s.week) && s.week.length === 7
    ? s.week.map((r, i) => ({
      enabled: Boolean(r?.enabled),
      start: sanitizeTime(r?.start, base.settings.week[i].start),
      end: sanitizeTime(r?.end, base.settings.week[i].end),
      breakMinutes: Math.max(0, Math.min(600, Number(r?.breakMinutes) || 0))
    }))
    : base.settings.week;
  const holidays = Array.isArray(s.holidays)
    ? s.holidays.filter((h) => isIsoDate(h?.start)).map((h) => ({
      id: String(h.id || newId('hol')),
      start: h.start,
      end: isIsoDate(h.end) && h.end >= h.start ? h.end : h.start,
      label: String(h.label || 'Unavailable').slice(0, 80)
    }))
    : [];
  const overrides = {};
  if (s.overrides && typeof s.overrides === 'object') {
    for (const [date, o] of Object.entries(s.overrides)) {
      if (!isIsoDate(date) || !o) continue;
      overrides[date] = o.type === 'off'
        ? { type: 'off', label: String(o.label || '').slice(0, 80) }
        : {
          type: 'custom',
          start: sanitizeTime(o.start, '09:00'),
          end: sanitizeTime(o.end, '17:00'),
          breakMinutes: Math.max(0, Math.min(600, Number(o.breakMinutes) || 0)),
          label: String(o.label || '').slice(0, 80)
        };
    }
  }
  const criteria = Array.isArray(raw.criteria) && raw.criteria.length
    ? raw.criteria.filter((c) => c && c.id && c.name).map((c) => ({
      id: String(c.id),
      name: String(c.name).slice(0, 60),
      type: ['rating', 'urgency', 'deadlineRisk', 'effort'].includes(c.type) ? c.type : 'rating',
      direction: c.direction === 'cost' ? 'cost' : 'benefit',
      weight: Math.max(0, Math.min(100, Number(c.weight) || 0)),
      builtin: Boolean(c.builtin),
      help: String(c.help || '').slice(0, 200)
    }))
    : base.criteria;
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks.filter((t) => t && t.id).map((t, i) => ({
      ...createTask({}, i),
      id: String(t.id),
      title: String(t.title || 'Untitled task').slice(0, 140),
      hours: Math.max(0, Math.min(10000, Number(t.hours) || 0)),
      deadline: isIsoDate(t.deadline) ? t.deadline : '',
      deadlineType: t.deadlineType === 'hard' ? 'hard' : 'soft',
      earliestStart: isIsoDate(t.earliestStart) ? t.earliestStart : '',
      dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn.map(String) : [],
      allowSplit: t.allowSplit !== false,
      done: Boolean(t.done),
      notes: String(t.notes || '').slice(0, 1000),
      ratings: t.ratings && typeof t.ratings === 'object' ? { ...t.ratings } : {},
      color: typeof t.color === 'string' && /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : TASK_COLORS[i % TASK_COLORS.length]
    }))
    : base.tasks;
  const lockedBlocks = Array.isArray(raw.lockedBlocks)
    ? raw.lockedBlocks.filter((b) => b && isIsoDate(b.date)).map((b) => ({
      id: String(b.id || newId('lock')),
      taskId: b.taskId ? String(b.taskId) : null,
      title: String(b.title || '').slice(0, 140),
      date: b.date,
      start: sanitizeTime(b.start, '09:00'),
      end: sanitizeTime(b.end, '10:00')
    }))
    : [];
  const maxDaily = Number(s.maxDailyHours);
  return {
    version: STATE_VERSION,
    settings: {
      period,
      week,
      holidays,
      overrides,
      maxDailyHours: Number.isFinite(maxDaily) && maxDaily > 0 ? Math.min(24, maxDaily) : null,
      bufferPercent: Math.max(0, Math.min(95, Number(s.bufferPercent) || 0)),
      minSessionMinutes: Math.max(5, Math.min(480, Number(s.minSessionMinutes) || 30)),
      scoring: {
        reference: s.scoring?.reference === 'planningStart' ? 'planningStart' : 'today',
        urgencyWindowDays: Math.max(1, Math.min(365, Number(s.scoring?.urgencyWindowDays) || 30))
      }
    },
    criteria,
    tasks,
    lockedBlocks
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or disabled (private mode); the planner keeps working in memory.
  }
}
