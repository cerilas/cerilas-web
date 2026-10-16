import { eachDay, weekdayOf, parseTime, isIsoDate, diffDays, MAX_PERIOD_DAYS } from './dates';

/**
 * Turns a start/end/break definition into working windows (minutes from midnight).
 * The break is centred in the working span so a day splits into a morning and an
 * afternoon window.
 */
export function buildWindows(start, end, breakMinutes = 0) {
  const s = parseTime(start);
  const e = parseTime(end);
  if (s === null || e === null || e <= s) return [];
  const span = e - s;
  const brk = Math.max(0, Math.min(Number(breakMinutes) || 0, span));
  if (brk >= span) return [];
  if (brk === 0) return [[s, e]];
  const mid = s + Math.round((span - brk) / 2);
  return [[s, mid], [mid + brk, e]].filter(([a, b]) => b > a);
}

export function windowMinutes(windows) {
  return windows.reduce((sum, [a, b]) => sum + (b - a), 0);
}

export function scheduleHoursFor(rule) {
  if (!rule || !rule.enabled) return 0;
  return windowMinutes(buildWindows(rule.start, rule.end, rule.breakMinutes)) / 60;
}

function holidayFor(iso, holidays) {
  return (holidays || []).find((h) => isIsoDate(h.start) && iso >= h.start && iso <= (isIsoDate(h.end) ? h.end : h.start));
}

/**
 * Resolves the working availability of one calendar date from the weekly rules,
 * holiday ranges and per-date overrides. Overrides win over holidays, holidays
 * win over the weekly rule.
 */
export function resolveDay(iso, settings) {
  const override = settings.overrides?.[iso];
  const holiday = holidayFor(iso, settings.holidays);
  const rule = settings.week?.[weekdayOf(iso)];
  let windows = [];
  let source = 'week';
  let label = '';

  if (override) {
    source = 'override';
    label = override.label || '';
    if (override.type !== 'off') windows = buildWindows(override.start, override.end, override.breakMinutes);
  } else if (holiday) {
    source = 'holiday';
    label = holiday.label || 'Unavailable';
  } else if (rule?.enabled) {
    windows = buildWindows(rule.start, rule.end, rule.breakMinutes);
  } else {
    source = 'off';
  }

  const scheduleMinutes = windowMinutes(windows);
  const maxDaily = Number(settings.maxDailyHours);
  const capMinutes = Number.isFinite(maxDaily) && maxDaily > 0 ? Math.round(maxDaily * 60) : Infinity;
  const availableMinutes = Math.min(scheduleMinutes, capMinutes);
  const buffer = clampBuffer(settings.bufferPercent);
  const usableMinutes = Math.floor(availableMinutes * (1 - buffer / 100));

  return {
    date: iso,
    weekday: weekdayOf(iso),
    windows,
    source,
    label,
    scheduleMinutes,
    availableMinutes,
    usableMinutes,
    isWorking: availableMinutes > 0
  };
}

export function clampBuffer(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(95, Math.max(0, n));
}

export function buildCalendar(settings) {
  const { start, end } = settings.period || {};
  return eachDay(start, end).map((iso) => resolveDay(iso, settings));
}

/**
 * Capacity formulas:
 *   Total Available Hours = SUM(available working hours within the date range)
 *   Usable Capacity       = Total Available Hours × (1 − Buffer % / 100)
 *   Capacity Utilization  = Scheduled Task Hours / Usable Capacity × 100
 */
export function summarizeCapacity(days, settings, scheduledMinutes = 0) {
  const totalAvailableMinutes = days.reduce((sum, d) => sum + d.availableMinutes, 0);
  const scheduleMinutes = days.reduce((sum, d) => sum + d.scheduleMinutes, 0);
  const buffer = clampBuffer(settings.bufferPercent);
  const usableMinutes = totalAvailableMinutes * (1 - buffer / 100);
  const utilization = usableMinutes > 0 ? (scheduledMinutes / usableMinutes) * 100 : 0;
  const workingDays = days.filter((d) => d.isWorking).length;

  return {
    calendarDays: days.length,
    workingDays,
    totalAvailableHours: totalAvailableMinutes / 60,
    rawScheduleHours: scheduleMinutes / 60,
    cappedByDailyLimit: scheduleMinutes > totalAvailableMinutes,
    bufferPercent: buffer,
    usableCapacityHours: usableMinutes / 60,
    scheduledHours: scheduledMinutes / 60,
    utilization,
    freeHours: Math.max(0, usableMinutes - scheduledMinutes) / 60
  };
}

/** Usable working minutes between two dates (inclusive), based only on the working schedule. */
export function usableMinutesBetween(fromIso, toIso, settings) {
  if (!isIsoDate(fromIso) || !isIsoDate(toIso) || toIso < fromIso) return 0;
  return eachDay(fromIso, toIso).reduce((sum, iso) => sum + resolveDay(iso, settings).usableMinutes, 0);
}

export function validatePeriod(period) {
  if (!isIsoDate(period?.start) || !isIsoDate(period?.end)) return 'Choose a valid start and end date.';
  const span = diffDays(period.start, period.end);
  if (span < 0) return 'The end date must be on or after the start date.';
  if (span + 1 > MAX_PERIOD_DAYS) return `Planning periods are limited to ${MAX_PERIOD_DAYS} days; only the first ${MAX_PERIOD_DAYS} days are planned.`;
  return null;
}
