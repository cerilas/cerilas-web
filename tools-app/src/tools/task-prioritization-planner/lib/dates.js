const DAY_MS = 86400000;

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MAX_PERIOD_DAYS = 1096;

export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = toUtc(value);
  return Number.isFinite(t) && fromUtc(t) === value;
}

export function toUtc(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fromUtc(ms) {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

export function addDays(iso, n) {
  return fromUtc(toUtc(iso) + n * DAY_MS);
}

export function diffDays(fromIso, toIso) {
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / DAY_MS);
}

export function weekdayOf(iso) {
  return new Date(toUtc(iso)).getUTCDay();
}

export function eachDay(startIso, endIso) {
  const out = [];
  if (!isIsoDate(startIso) || !isIsoDate(endIso)) return out;
  const total = diffDays(startIso, endIso);
  if (total < 0) return out;
  const capped = Math.min(total, MAX_PERIOD_DAYS - 1);
  for (let i = 0; i <= capped; i += 1) out.push(addDays(startIso, i));
  return out;
}

export function startOfWeek(iso) {
  const wd = weekdayOf(iso);
  return addDays(iso, wd === 0 ? -6 : 1 - wd);
}

export function startOfMonth(iso) {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return fromUtc(Date.UTC(y, m, 0));
}

export function addMonths(iso, n) {
  const [y, m] = iso.split('-').map(Number);
  return fromUtc(Date.UTC(y, m - 1 + n, 1));
}

export function clampIso(iso, minIso, maxIso) {
  if (iso < minIso) return minIso;
  if (iso > maxIso) return maxIso;
  return iso;
}

export function parseTime(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return h * 60 + m;
}

export function formatTime(minutes) {
  const safe = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  const h = String(Math.floor(safe / 60)).padStart(2, '0');
  const m = String(safe % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatHours(minutesOrHours, { fromMinutes = true, digits = 1 } = {}) {
  const hours = fromMinutes ? minutesOrHours / 60 : minutesOrHours;
  if (!Number.isFinite(hours)) return '0h';
  const rounded = Number(hours.toFixed(digits));
  return `${rounded.toLocaleString('en-US', { maximumFractionDigits: digits })}h`;
}

export function formatDate(iso, { weekday = false, year = false } = {}) {
  if (!isIsoDate(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const parts = [];
  if (weekday) parts.push(`${WEEKDAY_SHORT[weekdayOf(iso)]},`);
  parts.push(`${MONTH_SHORT[m - 1]} ${d}`);
  if (year) parts.push(`, ${y}`);
  return parts.join(' ').replace(' ,', ',');
}

export function formatMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTH_SHORT[m - 1]} ${y}`;
}
