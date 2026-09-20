import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  PieChart, 
  Activity, 
  Download, 
  Copy, 
  Eye, 
  Play, 
  Users, 
  Bot, 
  ShieldCheck, 
  Globe, 
  Search, 
  Clock 
} from 'lucide-react';

export default function AnalyticsView({ statsOverview = null, tools = [] }) {
  const [activeTab, setActiveTab] = useState('human'); // 'human' | 'bots'

  const totals = statsOverview?.summary || statsOverview?.totals || {};
  const eventBreakdown = statsOverview?.eventTypes || statsOverview?.eventBreakdown || [
    { event_type: 'view', count: totals.total_views || 0 },
    { event_type: 'download', count: totals.total_downloads || 0 },
    { event_type: 'copy', count: totals.total_copies || 0 },
    { event_type: 'use', count: totals.total_uses || 0 }
  ];

  const recentEvents = statsOverview?.recentEvents || [];
  const botAnalytics = statsOverview?.botAnalytics || {};
  const botBreakdown = botAnalytics.botBreakdown || [];
  const recentBotEvents = botAnalytics.recentBotEvents || [];

  const totalHumanEvents = eventBreakdown.reduce((acc, curr) => acc + (parseInt(curr.count, 10) || 0), 0) || 1;
  const totalBotHits = botAnalytics.totalBotViews || 0;
  const totalBotBreakdownCount = botBreakdown.reduce((acc, curr) => acc + (parseInt(curr.count, 10) || 0), 0) || 1;

  // Category counts
  const categoryMap = {};
  tools.forEach(t => {
    const cat = t.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  return (
    <div className="admin-body">
      {/* Top Segmented Controls: Real Humans vs Bots */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Telemetry & Traffic Intelligence</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real human interactions and automated crawler telemetry are strictly segregated.
          </span>
        </div>

        <div style={{
          display: 'inline-flex',
          padding: '0.25rem',
          borderRadius: '14px',
          background: 'rgba(150, 150, 150, 0.08)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.08))'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('human')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              background: activeTab === 'human' ? '#3b82f6' : 'transparent',
              color: activeTab === 'human' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Users size={14} />
            <span>Human Analytics (Real Users)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bots')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              background: activeTab === 'bots' ? '#a855f7' : 'transparent',
              color: activeTab === 'bots' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Bot size={14} />
            <span>Bot & Crawler Intelligence ({totalBotHits})</span>
          </button>
        </div>
      </div>

      {activeTab === 'human' ? (
        /* ================= HUMAN ANALYTICS TAB ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="admin-two-col-grid">
            {/* Event Volume Distribution */}
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
              borderRadius: 18,
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Users size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Human Action Distribution</h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'block' }}>
                Real user action volume across all 30 tools (crawlers excluded)
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {eventBreakdown.map(ev => {
                  const count = parseInt(ev.count, 10) || 0;
                  const percent = Math.round((count / totalHumanEvents) * 100);
                  const isView = ev.event_type === 'view';
                  const isDownload = ev.event_type.startsWith('download') || ev.event_type === 'session_complete';
                  const isCopy = ev.event_type === 'copy';

                  const color = isView ? '#3b82f6' : (isDownload ? '#10b981' : (isCopy ? '#ec4899' : '#a855f7'));

                  return (
                    <div key={ev.event_type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {ev.event_type} Actions
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {count.toLocaleString()} ({percent}%)
                        </span>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: 'rgba(150, 150, 150, 0.1)', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${percent}%`, 
                            borderRadius: 999, 
                            background: color
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Representation */}
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
              borderRadius: 18,
              padding: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Category Inventory</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'block' }}>
                Distribution of production tools across domains
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(categoryMap).map(([category, count]) => {
                  const percent = Math.round((count / tools.length) * 100);
                  return (
                    <div key={category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(150, 150, 150, 0.04)', borderRadius: 12 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{category}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{percent}%</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 999, background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                          {count} tools
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Real User Events Stream */}
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
            borderRadius: 18,
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Live Human Interaction Feed</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'block' }}>
              Real-time user sessions and conversions (last 15 events)
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentEvents.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No recent human interaction events logged yet.
                </div>
              ) : (
                recentEvents.map(ev => (
                  <div 
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      background: 'rgba(150, 150, 150, 0.04)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: 999,
                        fontWeight: 600,
                        fontSize: '0.74rem',
                        textTransform: 'uppercase',
                        background: ev.event_type === 'view' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: ev.event_type === 'view' ? '#3b82f6' : '#10b981'
                      }}>
                        {ev.event_type}
                      </span>
                      <strong style={{ color: 'var(--text-main)' }}>{ev.tool_title || ev.tool_slug}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <span>Visitor: {ev.visitor_id ? `${ev.visitor_id.slice(0, 14)}...` : 'Anonymous'}</span>
                      <span>{new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= BOT & CRAWLER INTELLIGENCE TAB ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Bot KPI summary cards */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="admin-kpi-header">
                <span className="admin-kpi-label">Total Bot & Crawler Hits</span>
                <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                  <Bot size={16} />
                </div>
              </div>
              <div className="admin-kpi-val" style={{ color: '#a855f7' }}>
                {totalBotHits.toLocaleString()}
              </div>
              <div className="admin-kpi-sub">
                <span>Isolated from human analytics</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-header">
                <span className="admin-kpi-label">Unique Crawler Engines</span>
                <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <Search size={16} />
                </div>
              </div>
              <div className="admin-kpi-val">
                {botBreakdown.length}
              </div>
              <div className="admin-kpi-sub">
                <span>Distinct search & AI spiders</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-header">
                <span className="admin-kpi-label">Active Crawlers (30m)</span>
                <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                  <Activity size={16} />
                </div>
              </div>
              <div className="admin-kpi-val" style={{ color: '#eab308' }}>
                {botAnalytics.liveBots30m || 0}
              </div>
              <div className="admin-kpi-sub">
                <span>Spiders crawling right now</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-header">
                <span className="admin-kpi-label">Human Traffic Ratio</span>
                <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="admin-kpi-val" style={{ color: '#10b981' }}>
                {botAnalytics.humanTrafficRatio || 100}%
              </div>
              <div className="admin-kpi-sub">
                <span>Verified human visitors</span>
              </div>
            </div>
          </div>

          <div className="admin-two-col-grid">
            {/* Crawler Engine Breakdown */}
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
              borderRadius: 18,
              padding: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Crawler Engine Breakdown</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'block' }}>
                Activity volume by AI crawler and search spider
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {botBreakdown.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No automated bot requests detected yet.
                  </div>
                ) : (
                  botBreakdown.map(b => {
                    const count = parseInt(b.count, 10) || 0;
                    const percent = Math.round((count / totalBotBreakdownCount) * 100);
                    return (
                      <div key={b.bot_name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 600 }}>{b.bot_name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {count} hits ({percent}%)
                          </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: 'rgba(150, 150, 150, 0.1)', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${percent}%`, 
                              borderRadius: 999, 
                              background: 'linear-gradient(90deg, #a855f7, #ec4899)'
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Live Crawler Feed */}
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
              borderRadius: 18,
              padding: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Live Crawler Feed</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'block' }}>
                Recent search and AI crawler scans
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentBotEvents.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No crawler events recorded yet.
                  </div>
                ) : (
                  recentBotEvents.map(ev => (
                    <div 
                      key={ev.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 12,
                        background: 'rgba(168, 85, 247, 0.04)',
                        border: '1px solid rgba(168, 85, 247, 0.1)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#a855f7' }}>{ev.bot_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target: {ev.tool_title || ev.tool_slug}</div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
