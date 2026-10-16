import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Eye,
  Globe,
  Info,
  Monitor,
  Search,
  ShieldCheck,
  Smartphone,
  Tablet,
  Users,
  Zap
} from 'lucide-react';
import { countryFlag, countryName, relativeTime } from './users/userAdminUtils';
import './AnalyticsView.css';

const BOT_CATEGORY_LABELS = {
  ai_crawler: 'AI crawlers',
  search_engine: 'Search engines',
  seo_crawler: 'SEO tools',
  social_preview: 'Link previews',
  monitoring: 'Monitoring & scanners',
  automated_browser: 'Automated browsers',
  script_scraper: 'Scripts & scrapers',
  cli_tool: 'CLI tools',
  generic_bot: 'Other bots'
};

const EVENT_LABELS = {
  view: 'Page views',
  use: 'Tool runs',
  ai_scan: 'AI scans',
  download: 'Downloads',
  copy: 'Copies'
};

const DEVICE_ICONS = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

const num = (value) => Number(value || 0).toLocaleString();
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const shortVisitor = (id) => (id ? `${id.replace(/^vid_/, '').slice(0, 10)}…` : 'Anonymous');

function eventColor(type = '') {
  if (type === 'view') return '#3b82f6';
  if (type.startsWith('download') || type === 'pdf_export') return '#10b981';
  if (type.startsWith('copy')) return '#ec4899';
  if (type === 'ai_scan') return '#f59e0b';
  return '#a855f7';
}

function Kpi({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-header">
        <span className="admin-kpi-label">{label}</span>
        <div className="admin-kpi-icon-wrap" style={{ background: `${color}1a`, color }}>
          <Icon size={16} />
        </div>
      </div>
      <div className="admin-kpi-val" style={{ color }}>{value}</div>
      <div className="admin-kpi-sub"><span>{sub}</span></div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = '' }) {
  return (
    <section className={`an-panel ${className}`}>
      <header className="an-panel-head">
        <h3>{title}</h3>
        {subtitle && <span>{subtitle}</span>}
      </header>
      {children}
    </section>
  );
}

function BarList({ rows, empty, color }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <div className="an-empty">{empty}</div>;
  return (
    <div className="an-barlist">
      {rows.map((row) => (
        <div key={row.key} className="an-barlist-row">
          <div className="an-barlist-label">
            <span className="an-barlist-name" title={row.title || row.label}>{row.label}</span>
            <span className="an-barlist-val">{row.display ?? num(row.value)}</span>
          </div>
          <div className="an-track">
            <div className="an-fill" style={{ width: `${Math.max(2, (row.value / max) * 100)}%`, background: row.color || color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyChart({ daily = [], mode }) {
  const series = daily.map((d) => ({ ...d, value: mode === 'bots' ? d.bots : d.humans }));
  const max = Math.max(1, ...series.map((d) => d.value));
  if (series.length === 0) return <div className="an-empty">No traffic recorded in this period.</div>;
  return (
    <div className="an-chart">
      {series.map((d) => (
        <div
          key={d.day}
          className="an-chart-col"
          title={mode === 'bots'
            ? `${d.day}: ${num(d.bots)} bot hits`
            : `${d.day}: ${num(d.humans)} unique humans · ${num(d.views)} views · ${num(d.bots)} bot hits`}
        >
          <div className={`an-chart-bar ${mode === 'bots' ? 'is-bot' : ''}`} style={{ height: `${(d.value / max) * 100}%` }} />
        </div>
      ))}
      <div className="an-chart-axis">
        <span>{series[0].day}</span>
        <span>{series[series.length - 1].day}</span>
      </div>
    </div>
  );
}

function Feed({ rows, empty, renderMain, renderMeta }) {
  if (rows.length === 0) return <div className="an-empty">{empty}</div>;
  return (
    <div className="an-feed">
      {rows.map((row) => (
        <div key={row.id} className="an-feed-row">
          <div className="an-feed-main">{renderMain(row)}</div>
          <div className="an-feed-meta">
            {renderMeta(row)}
            <span title={new Date(row.created_at).toLocaleString()}>{relativeTime(row.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsView({ statsOverview = null, tools = [] }) {
  const [activeTab, setActiveTab] = useState('human');
  const titleBySlug = useMemo(() => Object.fromEntries(tools.map((t) => [t.slug, t.title])), [tools]);
  const toolTitle = (row) => row.tool_title || titleBySlug[row.tool_slug] || row.tool_slug;

  const summary = statsOverview?.summary || {};
  const botAnalytics = statsOverview?.botAnalytics || {};
  const eventTypes = statsOverview?.eventTypes || [];
  const daily = statsOverview?.daily || [];
  const rangeLabel = statsOverview?.timeFilter?.label || 'All Time';
  const isAllTime = (statsOverview?.timeFilter?.range || 'all') === 'all';

  const topTools = useMemo(() => (statsOverview?.tools || [])
    .filter((t) => t.unique_visitors_count > 0 || t.view_count > 0)
    .sort((a, b) => b.unique_visitors_count - a.unique_visitors_count || b.view_count - a.view_count)
    .slice(0, 8)
    .map((t) => ({
      key: t.slug,
      label: t.title || titleBySlug[t.slug] || t.slug,
      value: t.unique_visitors_count,
      display: `${num(t.unique_visitors_count)} humans · ${num(t.view_count)} views · ${num(t.download_count + t.copy_count + t.use_count)} tasks`
    })), [statsOverview, titleBySlug]);

  const eventRows = eventTypes.map((e) => ({
    key: e.event_type,
    label: EVENT_LABELS[e.event_type] || capitalize(e.event_type.replace(/_/g, ' ')),
    value: e.count,
    color: eventColor(e.event_type)
  }));

  const countryRows = (statsOverview?.countries || []).map((c) => ({
    key: c.country,
    label: `${countryFlag(c.country)} ${countryName(c.country)}`,
    value: c.visitors,
    display: `${num(c.visitors)} visitors`
  }));

  const deviceRows = (statsOverview?.devices || []).map((d) => ({
    key: d.device_type,
    label: capitalize(d.device_type),
    value: d.visitors,
    display: `${num(d.visitors)} visitors`
  }));

  const botRows = (botAnalytics.botBreakdown || []).map((b) => ({
    key: b.bot_name,
    label: b.bot_name,
    title: `${BOT_CATEGORY_LABELS[b.category] || 'Bot'} · last seen ${relativeTime(b.last_seen_at)}`,
    value: b.count,
    display: `${num(b.count)} · ${BOT_CATEGORY_LABELS[b.category] || 'Bot'}`
  }));

  const botCategoryRows = (botAnalytics.botCategories || []).map((c) => ({
    key: c.category,
    label: BOT_CATEGORY_LABELS[c.category] || c.category,
    value: c.count
  }));

  const totalBotHits = botAnalytics.totalBotViews || 0;
  const visitors = summary.total_unique_visitors || 0;

  return (
    <div className="admin-body an-root">
      <div className="an-top">
        <div>
          <h2>Telemetry & Traffic Intelligence</h2>
          <span>
            {rangeLabel} · humans and bots are classified per event (user agent, headless signals and behavior) and never mixed.
          </span>
        </div>

        <div className="admin-analytics-tabs">
          <button
            type="button"
            className={`admin-analytics-tab-btn ${activeTab === 'human' ? 'active-human' : ''}`}
            onClick={() => setActiveTab('human')}
          >
            <Users size={14} />
            <span className="admin-tab-text-desktop">Real Humans ({num(visitors)})</span>
            <span className="admin-tab-text-mobile">Humans ({num(visitors)})</span>
          </button>
          <button
            type="button"
            className={`admin-analytics-tab-btn ${activeTab === 'bots' ? 'active-bots' : ''}`}
            onClick={() => setActiveTab('bots')}
          >
            <Bot size={14} />
            <span className="admin-tab-text-desktop">Bots & Crawlers ({num(totalBotHits)})</span>
            <span className="admin-tab-text-mobile">Bots ({num(totalBotHits)})</span>
          </button>
        </div>
      </div>

      {activeTab === 'human' ? (
        <div className="an-stack">
          <div className="admin-kpi-grid">
            <Kpi
              label="Unique Humans"
              value={num(visitors)}
              sub={isAllTime
                ? `${num(summary.avg_tools_per_visitor)} tools per visitor on average`
                : `${num(summary.new_visitors)} new · ${num(summary.returning_visitors)} returning`}
              icon={Users}
              color="#3b82f6"
            />
            <Kpi
              label="Human Page Views"
              value={num(summary.total_views)}
              sub={`${num(summary.avg_views_per_visitor)} views per visitor`}
              icon={Eye}
              color="#6366f1"
            />
            <Kpi
              label="Tasks Completed"
              value={num(summary.total_tasks_completed)}
              sub={`${num(summary.total_uses)} runs · ${num(summary.total_downloads)} downloads · ${num(summary.total_copies)} copies · ${summary.overall_total_cvr || 0}% of visitors converted`}
              icon={CheckCircle2}
              color="#10b981"
            />
            <Kpi
              label="Live Humans (30m)"
              value={num(summary.live_visitors)}
              sub="Distinct visitors active in the last 30 minutes"
              icon={Zap}
              color="#f59e0b"
            />
          </div>

          <Panel
            title="Unique humans per day"
            subtitle={isAllTime ? 'Last 30 days' : rangeLabel}
          >
            <DailyChart daily={daily} mode="humans" />
          </Panel>

          <div className="admin-two-col-grid">
            <Panel title="Top tools by unique humans" subtitle="Distinct visitors, views and completed tasks">
              <BarList rows={topTools} empty="No human visits in this period." color="#3b82f6" />
            </Panel>
            <Panel title="Human action distribution" subtitle="Every event type sent by real visitors">
              <BarList rows={eventRows} empty="No human events in this period." />
            </Panel>
          </div>

          <div className="admin-two-col-grid">
            <Panel title="Countries" subtitle="Distinct human visitors by country">
              <BarList rows={countryRows} empty="Country data is collected for new visits from now on." color="#0ea5e9" />
            </Panel>
            <Panel title="Devices" subtitle="Distinct human visitors by device">
              {deviceRows.length === 0 ? (
                <div className="an-empty">Device data is collected for new visits from now on.</div>
              ) : (
                <div className="an-devices">
                  {deviceRows.map((d) => {
                    const Icon = DEVICE_ICONS[d.key] || Monitor;
                    return (
                      <div key={d.key} className="an-device">
                        <Icon size={18} />
                        <strong>{num(d.value)}</strong>
                        <span>{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          <div className="admin-two-col-grid">
            <Panel title="Most engaged visitors" subtitle="Anonymous visitor ids ranked by activity">
              <Feed
                rows={(statsOverview?.topVisitors || []).map((v) => ({ ...v, id: v.visitor_id, created_at: v.last_seen_at }))}
                empty="No identified visitors in this period."
                renderMain={(v) => (
                  <>
                    <span className="an-mono">{shortVisitor(v.visitor_id)}</span>
                    <span className="an-muted">{num(v.views)} views · {num(v.events)} events · {num(v.tools)} tools</span>
                  </>
                )}
                renderMeta={(v) => (v.country ? <span title={countryName(v.country)}>{countryFlag(v.country)}</span> : null)}
              />
            </Panel>
            <Panel title="Live human feed" subtitle="Latest events from real visitors">
              <Feed
                rows={statsOverview?.recentEvents || []}
                empty="No human events in this period."
                renderMain={(ev) => (
                  <>
                    <span className="an-chip" style={{ color: eventColor(ev.event_type), background: `${eventColor(ev.event_type)}1f` }}>
                      {ev.event_type}
                    </span>
                    <strong>{toolTitle(ev)}</strong>
                  </>
                )}
                renderMeta={(ev) => (
                  <>
                    {ev.country && <span title={countryName(ev.country)}>{countryFlag(ev.country)}</span>}
                    {ev.device_type && <span className="an-muted">{ev.device_type}</span>}
                    <span className="an-mono an-muted">{shortVisitor(ev.visitor_id)}</span>
                  </>
                )}
              />
            </Panel>
          </div>

          <div className="an-note">
            <Info size={14} />
            <span>
              Excluded from human numbers: {num(summary.internal_events)} events from browsers signed in to this admin panel.
              {' '}{num(summary.anonymous_human_events)} server-side events had no visitor id, so they count toward tasks but not unique visitors.
            </span>
          </div>
        </div>
      ) : (
        <div className="an-stack">
          <div className="admin-kpi-grid">
            <Kpi label="Bot & Crawler Hits" value={num(totalBotHits)} sub={`${num(botAnalytics.totalBotEvents)} bot events in total`} icon={Bot} color="#a855f7" />
            <Kpi label="Distinct Crawlers" value={num(botAnalytics.totalUniqueBots)} sub="Identified bot engines and clients" icon={Search} color="#3b82f6" />
            <Kpi label="Active Crawlers (30m)" value={num(botAnalytics.liveBots30m)} sub="Engines seen in the last 30 minutes" icon={Activity} color="#eab308" />
            <Kpi label="Human Traffic Share" value={`${botAnalytics.humanTrafficRatio ?? 100}%`} sub="Human views vs all page hits" icon={ShieldCheck} color="#10b981" />
          </div>

          <Panel title="Bot hits per day" subtitle={isAllTime ? 'Last 30 days' : rangeLabel}>
            <DailyChart daily={daily} mode="bots" />
          </Panel>

          <div className="admin-two-col-grid">
            <Panel title="Crawler engines" subtitle="Hits by identified bot">
              <BarList rows={botRows} empty="No automated requests detected yet." color="linear-gradient(90deg, #a855f7, #ec4899)" />
            </Panel>
            <Panel title="Bot categories" subtitle="What kind of automation is visiting">
              <BarList rows={botCategoryRows} empty="No automated requests detected yet." color="#a855f7" />
            </Panel>
          </div>

          <Panel title="Live crawler feed" subtitle="Latest bot requests with their user agent">
            <Feed
              rows={botAnalytics.recentBotEvents || []}
              empty="No crawler events recorded yet."
              renderMain={(ev) => (
                <>
                  <strong className="an-bot-name">{ev.bot_name || 'Unknown bot'}</strong>
                  <span className="an-muted">{toolTitle(ev)} · {ev.event_type}</span>
                  {ev.user_agent && <span className="an-ua" title={ev.user_agent}>{ev.user_agent}</span>}
                </>
              )}
              renderMeta={(ev) => (
                <>
                  {ev.country && <span title={countryName(ev.country)}>{countryFlag(ev.country)}</span>}
                  <span className="an-muted"><Globe size={12} /> {BOT_CATEGORY_LABELS[ev.client_type] || 'Bot'}</span>
                </>
              )}
            />
          </Panel>

          <div className="an-note">
            <Info size={14} />
            <span>
              Bots are detected from known crawler signatures, non-browser clients, headless browser signals and
              machine-regular request timing. Detected bots never touch human visitor, view or conversion numbers.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
