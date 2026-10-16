import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, RefreshCw, Mail, LogOut, Ban, CheckCircle2, ExternalLink, CreditCard, Activity,
  UserCog, Loader2, KeyRound, ShieldCheck, X, AlertTriangle
} from 'lucide-react';
import {
  adminFetch, countryFlag, countryName, formatDate, relativeTime, formatDuration, formatMoney
} from './userAdminUtils';
import { UserAvatar, PlanPill, StatusPill, DeviceIcon, ActivityBars } from './UsersView';
import './AdminUsers.css';

const METHOD_LABELS = { password: 'Email & password', google: 'Google', register: 'Sign up' };

const ACTIONS = {
  reset: {
    title: 'Send password reset email?',
    body: email => `A secure reset link will be emailed to ${email}. It expires in 60 minutes.`,
    confirm: 'Send email',
    tone: 'primary'
  },
  revoke: {
    title: 'Sign out of all devices?',
    body: () => 'Every active session for this member ends immediately. They can sign in again with their usual method.',
    confirm: 'Sign out everywhere',
    tone: 'danger'
  },
  suspend: {
    title: 'Suspend this account?',
    body: () => 'The member is signed out everywhere and cannot sign in until you reactivate the account. Their data and subscription are not touched.',
    confirm: 'Suspend account',
    tone: 'danger'
  },
  unsuspend: {
    title: 'Reactivate this account?',
    body: () => 'The member will be able to sign in again right away.',
    confirm: 'Reactivate',
    tone: 'primary'
  }
};

export default function UserDetailView({ userId, onBack }) {
  const [data, setData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('pages');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await adminFetch(`/api/admin/users/${userId}`));
    } catch (err) {
      setError(err.message);
    }
  }, [userId]);

  const loadSubscription = useCallback(async (refresh = false) => {
    setSubLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/subscription${refresh ? '?refresh=1' : ''}`);
      setSubscription(res.subscription);
    } catch {
      setSubscription(null);
    } finally {
      setSubLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setData(null);
    setSubscription(null);
    load();
    loadSubscription();
  }, [load, loadSubscription]);

  useEffect(() => {
    if (!pendingAction) return undefined;
    const onKey = e => { if (e.key === 'Escape' && !actionBusy) setPendingAction(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pendingAction, actionBusy]);

  const runAction = async () => {
    setActionBusy(true);
    setActionError('');
    try {
      if (pendingAction === 'reset') {
        await adminFetch(`/api/admin/users/${userId}/password-reset`, { method: 'POST', body: JSON.stringify({}) });
        setNotice('Password reset email sent.');
      } else if (pendingAction === 'revoke') {
        await adminFetch(`/api/admin/users/${userId}/revoke-sessions`, { method: 'POST', body: JSON.stringify({}) });
        setNotice('All sessions were signed out.');
      } else {
        const suspended = pendingAction === 'suspend';
        await adminFetch(`/api/admin/users/${userId}/suspend`, { method: 'POST', body: JSON.stringify({ suspended }) });
        setNotice(suspended ? 'Account suspended.' : 'Account reactivated.');
      }
      setPendingAction(null);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  if (error) {
    return (
      <div className="admin-body au-root">
        <button type="button" className="admin-action-btn" onClick={onBack}><ArrowLeft size={14} /> All members</button>
        <div className="au-panel au-error" style={{ marginTop: '1rem' }}>{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-body au-root">
        <div className="au-skeleton" style={{ height: 90, marginBottom: 16 }} />
        <div className="au-detail-grid">
          {[0, 1, 2].map(i => <div key={i} className="au-skeleton" style={{ height: 220 }} />)}
        </div>
      </div>
    );
  }

  const { user, totals, logins, page_stats: pageStats, recent_views: recentViews, devices, countries, daily } = data;
  const current = subscription?.current;

  return (
    <div className="admin-body au-root">
      <button type="button" className="au-back" onClick={onBack}><ArrowLeft size={15} /> All members</button>

      <header className="au-profile">
        <UserAvatar user={user} size={64} />
        <div className="au-profile-text">
          <h3>
            {user.name || user.email.split('@')[0]}
            <PlanPill plan={user.plan} />
            {user.is_admin && <span className="au-pill au-tone-info"><ShieldCheck size={12} /> Admin</span>}
            {user.suspended && <span className="au-pill au-tone-danger"><Ban size={12} /> Suspended</span>}
          </h3>
          <span className="au-profile-email">{user.email} · member #{user.id}</span>
          <span className="au-profile-meta">
            Joined {formatDate(user.created_at)} · last seen {relativeTime(user.last_seen_at)}
            {user.country && <> · {countryFlag(user.country)} {countryName(user.country)}</>}
          </span>
        </div>
        <div className="au-profile-actions">
          <button type="button" className="admin-action-btn" onClick={() => { setActionError(''); setPendingAction('reset'); }}>
            <Mail size={14} /> Reset email
          </button>
          <button type="button" className="admin-action-btn" onClick={() => { setActionError(''); setPendingAction('revoke'); }}>
            <LogOut size={14} /> Sign out everywhere
          </button>
          {user.suspended ? (
            <button type="button" className="admin-action-btn au-btn-success" onClick={() => { setActionError(''); setPendingAction('unsuspend'); }}>
              <CheckCircle2 size={14} /> Reactivate
            </button>
          ) : !user.is_admin && (
            <button type="button" className="admin-action-btn au-btn-danger" onClick={() => { setActionError(''); setPendingAction('suspend'); }}>
              <Ban size={14} /> Suspend
            </button>
          )}
        </div>
      </header>

      {notice && (
        <div className="au-notice" role="status">
          <CheckCircle2 size={15} /> {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <div className="au-detail-grid">
        <section className="au-panel">
          <header className="au-panel-head">
            <span className="au-inline"><CreditCard size={15} /> Subscription · RevenueCat</span>
            <button type="button" className="au-icon-btn" onClick={() => loadSubscription(true)} title="Refresh from RevenueCat" aria-label="Refresh from RevenueCat">
              <RefreshCw size={13} className={subLoading ? 'spin-anim' : ''} />
            </button>
          </header>
          {subLoading && !subscription ? (
            <div className="au-skeleton" style={{ height: 150 }} />
          ) : subscription && subscription.source === 'unavailable' ? (
            <p className="au-empty-line">RevenueCat could not be reached. Database plan: <strong>{user.plan}</strong>.</p>
          ) : (
            <dl className="au-facts">
              <div><dt>Status</dt><dd><StatusPill status={subscription?.status || 'none'} /></dd></div>
              <div><dt>Product</dt><dd>{current?.display_name || '—'}{current?.is_sandbox && <span className="au-mini"> · sandbox</span>}</dd></div>
              <div><dt>Price</dt><dd>{formatMoney(current?.price) || '—'}{current?.period_type && current.period_type !== 'normal' && <span className="au-mini"> · {current.period_type}</span>}</dd></div>
              <div><dt>Last payment</dt><dd>{formatDate(subscription?.last_payment_at, { time: true })}</dd></div>
              <div>
                <dt>{subscription?.next_payment_at ? 'Next payment' : 'Access ends'}</dt>
                <dd className={subscription?.access_ends_at ? 'au-warn-text' : ''}>
                  {formatDate(subscription?.next_payment_at || subscription?.access_ends_at, { time: true })}
                  {(subscription?.next_payment_at || subscription?.access_ends_at) && <span className="au-mini"> · {relativeTime(subscription.next_payment_at || subscription.access_ends_at)}</span>}
                </dd>
              </div>
              <div><dt>Store</dt><dd>{current?.store || '—'}</dd></div>
              {current?.unsubscribe_detected_at && <div><dt>Canceled on</dt><dd className="au-warn-text">{formatDate(current.unsubscribe_detected_at, { time: true })}</dd></div>}
              {current?.billing_issues_detected_at && <div><dt>Billing issue</dt><dd className="au-danger-text">{formatDate(current.billing_issues_detected_at, { time: true })}</dd></div>}
              <div><dt>Customer since</dt><dd>{formatDate(subscription?.customer_since)}</dd></div>
              <div><dt>Entitlements</dt><dd>{subscription?.active_entitlements?.length ? subscription.active_entitlements.join(', ') : '—'}</dd></div>
              {subscription?.management_url && (
                <div><dt>Portal</dt><dd><a href={subscription.management_url} target="_blank" rel="noopener noreferrer" className="au-link">Paddle customer portal <ExternalLink size={12} /></a></dd></div>
              )}
            </dl>
          )}
          {subscription?.fetched_at && <span className="au-footnote">Fetched {relativeTime(subscription.fetched_at)}</span>}
        </section>

        <section className="au-panel">
          <header className="au-panel-head"><span className="au-inline"><Activity size={15} /> Activity</span></header>
          <dl className="au-facts">
            <div><dt>Last seen</dt><dd>{formatDate(user.last_seen_at, { time: true })} <span className="au-mini">· {relativeTime(user.last_seen_at)}</span></dd></div>
            <div><dt>Last login</dt><dd>{formatDate(user.last_login_at, { time: true })}</dd></div>
            <div><dt>Page views</dt><dd><strong>{totals.views}</strong> across {totals.unique_pages} pages</dd></div>
            <div><dt>Active time</dt><dd>{formatDuration(totals.duration_ms)}</dd></div>
            <div><dt>Sessions</dt><dd>{totals.sessions}</dd></div>
            <div><dt>Logins tracked</dt><dd>{totals.logins}{totals.logins >= 50 ? '+' : ''}</dd></div>
          </dl>
          <span className="au-panel-subhead">Page views · last 30 days</span>
          <ActivityBars data={daily} valueKey="views" height={70} labelFormatter={d => `${d.day}: ${d.views} views, ${formatDuration(d.duration_ms)}`} />
        </section>

        <section className="au-panel">
          <header className="au-panel-head"><span className="au-inline"><UserCog size={15} /> Account</span></header>
          <dl className="au-facts">
            <div><dt>Sign-in methods</dt><dd>{user.auth_methods.length ? user.auth_methods.map(m => (m === 'google' ? 'Google' : 'Password')).join(' + ') : '—'}</dd></div>
            <div><dt>Password changed</dt><dd>{formatDate(user.password_changed_at, { time: true })}</dd></div>
            <div><dt>Phone</dt><dd>{user.phone || '—'}{user.phone && <span className="au-mini"> · {user.phone_verified ? 'verified' : 'unverified'}</span>}</dd></div>
            <div><dt>Billing</dt><dd>{[user.billing_name, user.billing_city, user.billing_country].filter(Boolean).join(', ') || '—'}</dd></div>
            <div><dt>Devices used</dt><dd>{devices.length}</dd></div>
            <div><dt>Countries</dt><dd>{countries.length ? countries.map(c => `${countryFlag(c.country)} ${c.country}`).join('  ') : '—'}</dd></div>
          </dl>
        </section>
      </div>

      <div className="au-tabs" role="tablist">
        {[
          ['pages', `Pages (${pageStats.length})`],
          ['timeline', 'Recent visits'],
          ['logins', `Logins (${logins.length})`],
          ['devices', 'Devices & locations'],
          ['billing', `Payments (${subscription?.subscriptions?.length || 0})`]
        ].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`au-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="admin-table-container">
        <div className="admin-table-wrap">
          {tab === 'pages' && (
            <table className="admin-table au-table">
              <thead><tr><th>Page</th><th>Views</th><th>Active time</th><th>Avg. per view</th><th>First visit</th><th>Last visit</th></tr></thead>
              <tbody>
                {pageStats.map(p => (
                  <tr key={p.path}>
                    <td><span className="au-path" title={p.path}>{p.path}</span></td>
                    <td><strong>{p.views}</strong></td>
                    <td>{formatDuration(p.duration_ms)}</td>
                    <td>{formatDuration(p.views ? p.duration_ms / p.views : 0)}</td>
                    <td className="au-muted">{formatDate(p.first_viewed_at, { time: true })}</td>
                    <td>{relativeTime(p.last_viewed_at)}</td>
                  </tr>
                ))}
                {pageStats.length === 0 && <EmptyRow cols={6} text="No page views recorded yet. Tracking starts on the member's next visit." />}
              </tbody>
            </table>
          )}

          {tab === 'timeline' && (
            <table className="admin-table au-table">
              <thead><tr><th>When</th><th>Page</th><th>Time on page</th><th>Device</th><th>Country</th><th>Came from</th></tr></thead>
              <tbody>
                {recentViews.map(v => (
                  <tr key={v.id}>
                    <td>{formatDate(v.created_at, { time: true })}</td>
                    <td><span className="au-path" title={v.title || v.path}>{v.path}</span></td>
                    <td>{formatDuration(v.duration_ms)}</td>
                    <td><span className="au-inline"><DeviceIcon type={v.device_type} size={13} /> {[v.os, v.browser].filter(Boolean).join(' · ')}</span></td>
                    <td>{countryFlag(v.country)} {v.country || '—'}</td>
                    <td><span className="au-path au-muted" title={v.referrer || ''}>{v.referrer ? safeHost(v.referrer) : 'Direct'}</span></td>
                  </tr>
                ))}
                {recentViews.length === 0 && <EmptyRow cols={6} text="No visits recorded yet." />}
              </tbody>
            </table>
          )}

          {tab === 'logins' && (
            <table className="admin-table au-table">
              <thead><tr><th>When</th><th>Method</th><th>Location</th><th>Device</th><th>IP address</th></tr></thead>
              <tbody>
                {logins.map(l => (
                  <tr key={l.id}>
                    <td>{formatDate(l.created_at, { time: true })} <span className="au-mini">· {relativeTime(l.created_at)}</span></td>
                    <td><span className="au-inline">{l.method === 'google' ? <GoogleMark /> : <KeyRound size={13} />} {METHOD_LABELS[l.method] || l.method}</span></td>
                    <td>{countryFlag(l.country)} {countryName(l.country)}{l.city ? `, ${l.city}` : ''}</td>
                    <td><span className="au-inline"><DeviceIcon type={l.device_type} size={13} /> {[l.device_type, l.os, l.browser].filter(Boolean).join(' · ')}</span></td>
                    <td className="au-mono">{l.ip || '—'}</td>
                  </tr>
                ))}
                {logins.length === 0 && <EmptyRow cols={5} text="No logins recorded since tracking was enabled." />}
              </tbody>
            </table>
          )}

          {tab === 'devices' && (
            <div className="au-split">
              <table className="admin-table au-table">
                <thead><tr><th>Device</th><th>Logins</th><th>Last used</th></tr></thead>
                <tbody>
                  {devices.map((d, i) => (
                    <tr key={i}>
                      <td><span className="au-inline"><DeviceIcon type={d.device_type} /> {[d.device_type, d.os, d.browser].filter(Boolean).join(' · ')}</span></td>
                      <td>{d.logins}</td>
                      <td>{relativeTime(d.last_used_at)}</td>
                    </tr>
                  ))}
                  {devices.length === 0 && <EmptyRow cols={3} text="No devices recorded yet." />}
                </tbody>
              </table>
              <table className="admin-table au-table">
                <thead><tr><th>Country</th><th>Events</th><th>Last seen</th></tr></thead>
                <tbody>
                  {countries.map(c => (
                    <tr key={c.country}>
                      <td>{countryFlag(c.country)} {countryName(c.country)}</td>
                      <td>{c.events}</td>
                      <td>{relativeTime(c.last_seen_at)}</td>
                    </tr>
                  ))}
                  {countries.length === 0 && <EmptyRow cols={3} text="No locations recorded yet." />}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'billing' && (
            <table className="admin-table au-table">
              <thead><tr><th>Product</th><th>Status</th><th>Price</th><th>Purchased</th><th>Expires</th><th>Store</th></tr></thead>
              <tbody>
                {(subscription?.subscriptions || []).map(s => (
                  <tr key={s.product_id}>
                    <td>{s.display_name}{s.is_sandbox && <span className="au-mini"> · sandbox</span>}</td>
                    <td><StatusPill status={s.status} /></td>
                    <td>{formatMoney(s.price) || '—'}</td>
                    <td>{formatDate(s.purchased_at, { time: true })}</td>
                    <td>{formatDate(s.expires_at, { time: true })}</td>
                    <td className="au-muted">{s.store || '—'}</td>
                  </tr>
                ))}
                {!subscription?.subscriptions?.length && <EmptyRow cols={6} text={subLoading ? 'Loading from RevenueCat…' : 'No purchases found in RevenueCat.'} />}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {pendingAction && createPortal(
        <div className="au-modal-backdrop" onClick={() => !actionBusy && setPendingAction(null)}>
          <div className="au-modal" role="alertdialog" aria-modal="true" aria-labelledby="au-modal-title" onClick={e => e.stopPropagation()}>
            <span className={`au-modal-icon au-modal-${ACTIONS[pendingAction].tone}`}>
              {pendingAction === 'reset' ? <Mail size={20} /> : pendingAction === 'unsuspend' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </span>
            <h4 id="au-modal-title">{ACTIONS[pendingAction].title}</h4>
            <p>{ACTIONS[pendingAction].body(user.email)}</p>
            {actionError && <div className="au-modal-error">{actionError}</div>}
            <div className="au-modal-actions">
              <button type="button" className="au-modal-btn" onClick={() => setPendingAction(null)} disabled={actionBusy} autoFocus>Cancel</button>
              <button type="button" className={`au-modal-btn au-modal-btn-${ACTIONS[pendingAction].tone}`} onClick={runAction} disabled={actionBusy}>
                {actionBusy && <Loader2 size={14} className="spin-anim" />} {ACTIONS[pendingAction].confirm}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function EmptyRow({ cols, text }) {
  return <tr><td colSpan={cols} className="au-table-message">{text}</td></tr>;
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function GoogleMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
