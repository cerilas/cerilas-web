export async function adminFetch(path, options = {}) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('admin_token');
    window.location.reload();
    throw new Error('Admin session expired.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

export function countryFlag(code) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code].map(c => 0x1f1a5 + c.charCodeAt(0)));
}

export function countryName(code) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return 'Unknown';
  try {
    return regionNames?.of(code) || code;
  } catch {
    return code;
  }
}

export function formatDate(value, { time = false } = {}) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {})
  });
}

export function relativeTime(value) {
  if (!value) return 'Never';
  const diff = Date.now() - new Date(value).getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);
  const units = [
    ['y', 365 * 864e5],
    ['mo', 30 * 864e5],
    ['d', 864e5],
    ['h', 36e5],
    ['m', 6e4]
  ];
  for (const [label, ms] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms);
      return future ? `in ${n}${label}` : `${n}${label} ago`;
    }
  }
  return future ? 'in <1m' : 'just now';
}

export function formatDuration(ms) {
  const total = Math.round((Number(ms) || 0) / 1000);
  if (total <= 0) return '0s';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMoney(price) {
  if (!price || typeof price.amount !== 'number') return null;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency || 'USD' }).format(price.amount);
  } catch {
    return `${price.amount} ${price.currency || ''}`.trim();
  }
}

export const SUBSCRIPTION_STATUS = {
  active: { label: 'Active', tone: 'success' },
  trialing: { label: 'Trial', tone: 'info' },
  canceled: { label: 'Canceled · access until end', tone: 'warning' },
  billing_issue: { label: 'Billing issue', tone: 'danger' },
  grace_period: { label: 'Grace period', tone: 'warning' },
  expired: { label: 'Expired', tone: 'muted' },
  refunded: { label: 'Refunded', tone: 'danger' },
  none: { label: 'No subscription', tone: 'muted' }
};

export function isOnline(lastSeen) {
  return lastSeen && Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export function initials(user) {
  const source = user?.name || user?.email || '?';
  return source.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}
