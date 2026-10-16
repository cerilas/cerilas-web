import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users, Activity, CreditCard, Search, RefreshCw, ChevronLeft, ChevronRight,
  Monitor, Smartphone, Tablet, Globe, AlertTriangle, ShieldCheck, Ban, Loader2
} from 'lucide-react';
import {
  adminFetch, countryFlag, countryName, formatDate, relativeTime, formatDuration, formatMoney,
  SUBSCRIPTION_STATUS, isOnline, initials
} from './userAdminUtils';
import './AdminUsers.css';

const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

export function DeviceIcon({ type, size = 14 }) {
  const Icon = DEVICE_ICONS[type] || Globe;
  return <Icon size={size} aria-hidden="true" />;
}

export function UserAvatar({ user, size = 36 }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="au-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {user?.avatar_url && !failed
        ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : initials(user)}
      {isOnline(user?.last_seen_at) && <span className="au-online-dot" title="Online now" />}
    </span>
  );
}

export function PlanPill({ plan }) {
  const p = plan || 'free';
  return <span className={`au-pill au-plan-${p}`}>{p === 'unlimited' ? 'Unlimited' : p === 'pro' ? 'Pro' : 'Free'}</span>;
}

export function StatusPill({ status }) {
  const meta = SUBSCRIPTION_STATUS[status] || SUBSCRIPTION_STATUS.none;
  return <span className={`au-pill au-tone-${meta.tone}`}>{meta.label}</span>;
}

export function ActivityBars({ data, valueKey, secondaryKey, height = 120, labelFormatter }) {
  const max = Math.max(1, ...data.map(d => Math.max(Number(d[valueKey]) || 0, secondaryKey ? Number(d[secondaryKey]) || 0 : 0)));
  return (
    <div className="au-bars" style={{ height }}>
      {data.map(d => {
        const primary = Number(d[valueKey]) || 0;
        const secondary = secondaryKey ? Number(d[secondaryKey]) || 0 : null;
        return (
          <div key={d.day} className="au-bar-col" title={labelFormatter ? labelFormatter(d) : `${d.day}: ${primary}`}>
            {secondary !== null && <span className="au-bar au-bar-secondary" style={{ height: `${(secondary / max) * 100}%` }} />}
            <span className="au-bar" style={{ height: `${(primary / max) * 100}%` }} />
          </div>
        );
      })}
    </div>
  );
}

const PLAN_FILTERS = [
  ['all', 'All plans'], ['paid', 'Paid (Pro + Unlimited)'], ['pro', 'Pro'], ['unlimited', 'Unlimited'], ['free', 'Free']
];
const STATUS_FILTERS = [
  ['all', 'All users'], ['active_24h', 'Active last 24h'], ['active_7d', 'Active last 7 days'],
  ['inactive_30d', 'Inactive 30+ days'], ['new_7d', 'Joined last 7 days'], ['canceling', 'Canceling'],
  ['suspended', 'Suspended'], ['admins', 'Admins']
];
const SORTS = [
  ['created', 'Newest first'], ['last_seen', 'Last seen'], ['last_login', 'Last login'], ['page_views', 'Most active (30d)'], ['email', 'Email A–Z']
];

export default function UsersView({ onSelectUser }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [billing, setBilling] = useState({});
  const [billingLoading, setBillingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [plan, setPlan] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('created');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(() => {
    adminFetch('/api/admin/users/stats').then(setStats).catch(() => {});
  }, []);

  const loadBilling = useCallback(async (list, refresh = false) => {
    const ids = list.filter(u => u.billing_lookup).map(u => u.id);
    if (ids.length === 0) return;
    setBillingLoading(true);
    try {
      const data = await adminFetch(`/api/admin/users/billing?ids=${ids.join(',')}${refresh ? '&refresh=1' : ''}`);
      setBilling(prev => ({ ...prev, ...data.billing }));
    } catch {
      // Billing columns fall back to database values
    } finally {
      setBillingLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (plan !== 'all') params.set('plan', plan);
      if (status !== 'all') params.set('status', status);
      const data = await adminFetch(`/api/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
      loadBilling(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, plan, status, loadBilling]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const t = stats?.totals;
  const deviceTotal = useMemo(() => (stats?.devices || []).reduce((sum, d) => sum + d.users, 0), [stats]);

  const handleRefresh = () => {
    loadStats();
    loadUsers();
    loadBilling(users, true);
  };

  return (
    <div className="admin-body au-root">
      <div className="au-topbar">
        <div>
          <h3 className="au-title">Members & Subscriptions</h3>
          <span className="au-subtitle">Every account on tools.cerilas.com with live RevenueCat (Paddle) billing, devices, locations and page activity.</span>
        </div>
        <button type="button" className="admin-action-btn" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading || billingLoading ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="admin-kpi-grid">
        <KpiCard icon={Users} color="#3b82f6" label="Total members" value={t?.total} sub={t ? `+${t.new_7d} this week · +${t.new_30d} in 30 days` : ''} />
        <KpiCard icon={Activity} color="#10b981" label="Active (7 days)" value={t?.active_7d} sub={t ? `${t.active_24h} in last 24h · ${t.active_30d} in 30 days` : ''} />
        <KpiCard icon={CreditCard} color="#a855f7" label="Paying members" value={t ? t.pro + t.unlimited : undefined} sub={t ? `${t.pro} Pro · ${t.unlimited} Unlimited` : ''} />
        <KpiCard icon={AlertTriangle} color="#f59e0b" label="At risk" value={t ? t.canceling : undefined} sub={t ? `${t.canceling} canceling · ${t.suspended} suspended` : ''} />
      </div>

      <div className="au-insights">
        <section className="au-panel au-panel-wide">
          <header className="au-panel-head">
            <span>Signups & active members · last 30 days</span>
            <span className="au-legend"><i className="au-legend-dot" /> Active <i className="au-legend-dot au-legend-secondary" /> Signups</span>
          </header>
          {stats ? (
            <ActivityBars
              data={stats.daily}
              valueKey="active_users"
              secondaryKey="signups"
              labelFormatter={d => `${d.day}: ${d.active_users} active, ${d.signups} signups`}
            />
          ) : <div className="au-skeleton" style={{ height: 120 }} />}
        </section>

        <section className="au-panel">
          <header className="au-panel-head"><span>Top countries</span></header>
          <ul className="au-rank-list">
            {(stats?.countries || []).map(c => (
              <li key={c.country}>
                <span>{countryFlag(c.country)} {countryName(c.country)}</span>
                <strong>{c.users}</strong>
              </li>
            ))}
            {stats && stats.countries.length === 0 && <li className="au-empty-line">No login data yet</li>}
          </ul>
        </section>

        <section className="au-panel">
          <header className="au-panel-head"><span>Devices</span></header>
          <ul className="au-rank-list">
            {(stats?.devices || []).map(d => (
              <li key={d.device_type}>
                <span className="au-inline"><DeviceIcon type={d.device_type} /> {d.device_type}</span>
                <span className="au-share">
                  <span className="au-share-bar"><span style={{ width: `${deviceTotal ? (d.users / deviceTotal) * 100 : 0}%` }} /></span>
                  <strong>{d.users}</strong>
                </span>
              </li>
            ))}
            {stats && stats.devices.length === 0 && <li className="au-empty-line">No login data yet</li>}
          </ul>
        </section>

        <section className="au-panel">
          <header className="au-panel-head"><span>Most visited pages · 30 days</span></header>
          <ul className="au-rank-list">
            {(stats?.top_pages || []).slice(0, 6).map(p => (
              <li key={p.path}>
                <span className="au-path" title={p.path}>{p.path}</span>
                <span className="au-muted-num">{p.users} users · <strong>{p.views}</strong></span>
              </li>
            ))}
            {stats && stats.top_pages.length === 0 && <li className="au-empty-line">No page views yet</li>}
          </ul>
        </section>
      </div>

      <div className="au-filters">
        <label className="au-search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search by email or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <select className="admin-select" value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }}>
          {PLAN_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="admin-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {STATUS_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="admin-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-wrap">
          <table className="admin-table au-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Subscription</th>
                <th>Last payment</th>
                <th>Next payment / ends</th>
                <th>Last seen</th>
                <th>Location & device</th>
                <th>Activity (30d)</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                <tr key={`s${i}`}><td colSpan={9}><div className="au-skeleton" style={{ height: 28 }} /></td></tr>
              ))}
              {!loading && error && (
                <tr><td colSpan={9} className="au-table-message au-error">{error}</td></tr>
              )}
              {!loading && !error && users.length === 0 && (
                <tr><td colSpan={9} className="au-table-message">No members match these filters.</td></tr>
              )}
              {users.map(u => {
                const b = billing[u.id];
                return (
                  <tr key={u.id} className="au-row" onClick={() => onSelectUser(u.id)} tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') onSelectUser(u.id); }}>
                    <td>
                      <div className="au-member">
                        <UserAvatar user={u} />
                        <div className="au-member-text">
                          <span className="au-member-name">
                            {u.name || u.email.split('@')[0]}
                            {u.is_admin && <span className="au-icon-admin" title="Admin"><ShieldCheck size={13} /></span>}
                            {u.suspended && <span className="au-icon-suspended" title="Suspended"><Ban size={13} /></span>}
                          </span>
                          <span className="au-member-email">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><PlanPill plan={u.plan} /></td>
                    <td>
                      {b ? (
                        <span className="au-stack">
                          <StatusPill status={b.status} />
                          {b.is_sandbox && <span className="au-mini">sandbox</span>}
                        </span>
                      ) : u.billing_lookup && billingLoading ? (
                        <Loader2 size={14} className="spin-anim au-muted" />
                      ) : (
                        <span className="au-muted">{u.cancel_at_period_end ? 'Canceling' : u.plan === 'free' ? '—' : (u.subscription_status || 'Active')}</span>
                      )}
                    </td>
                    <td>
                      {b?.last_payment_at ? (
                        <span className="au-stack">
                          <span>{formatDate(b.last_payment_at)}</span>
                          {formatMoney(b.last_payment_amount) && <span className="au-mini">{formatMoney(b.last_payment_amount)}</span>}
                        </span>
                      ) : <span className="au-muted">—</span>}
                    </td>
                    <td>
                      {b?.next_payment_at ? (
                        <span className="au-stack"><span>{formatDate(b.next_payment_at)}</span><span className="au-mini">renews {relativeTime(b.next_payment_at)}</span></span>
                      ) : b?.access_ends_at || u.plan_expires_at ? (
                        <span className="au-stack"><span className="au-warn-text">{formatDate(b?.access_ends_at || u.plan_expires_at)}</span><span className="au-mini">access ends</span></span>
                      ) : <span className="au-muted">—</span>}
                    </td>
                    <td>
                      <span className="au-stack">
                        <span>{relativeTime(u.last_seen_at)}</span>
                        <span className="au-mini">login {relativeTime(u.last_login_at)}</span>
                      </span>
                    </td>
                    <td>
                      {u.country || u.device_type ? (
                        <span className="au-stack">
                          <span>{countryFlag(u.country)} {countryName(u.country)}</span>
                          <span className="au-mini au-inline"><DeviceIcon type={u.device_type} size={12} /> {[u.os, u.browser].filter(Boolean).join(' · ')}</span>
                        </span>
                      ) : <span className="au-muted">No login since tracking</span>}
                    </td>
                    <td>
                      <span className="au-stack">
                        <span><strong>{u.page_views_30d}</strong> pages</span>
                        <span className="au-mini">{formatDuration(u.time_spent_30d_ms)} active</span>
                      </span>
                    </td>
                    <td><span className="au-muted">{formatDate(u.created_at)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="au-pager">
          <span>{total} member{total === 1 ? '' : 's'} · page {page} of {totalPages}</span>
          <div className="au-pager-btns">
            <button type="button" className="admin-action-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} /> Prev
            </button>
            <button type="button" className="admin-action-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, color, label, value, sub }) {
  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-header">
        <span className="admin-kpi-label">{label}</span>
        <span className="admin-kpi-icon-wrap" style={{ background: `${color}1a`, color }}><Icon size={16} /></span>
      </div>
      <div className="admin-kpi-val">{value ?? '—'}</div>
      <div className="admin-kpi-sub">{sub}</div>
    </div>
  );
}

