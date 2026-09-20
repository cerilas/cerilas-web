import React from 'react';
import { 
  Users, 
  Download, 
  TrendingUp, 
  Zap, 
  Award, 
  Activity, 
  Eye, 
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Bot,
  Search
} from 'lucide-react';

export default function OverviewView({ statsOverview = null, tools = [], onSelectToolTab }) {
  const totals = statsOverview?.summary || statsOverview?.totals || {};
  const liveVisitors = totals.live_visitors !== undefined ? totals.live_visitors : (statsOverview?.liveVisitors || 1);
  const botAnalytics = statsOverview?.botAnalytics || {};

  // Sort tools by total human usage
  const topTools = [...tools].sort((a, b) => {
    const aTotal = (a.download_count || 0) + (a.copy_count || 0) + (a.use_count || 0);
    const bTotal = (b.download_count || 0) + (b.copy_count || 0) + (b.use_count || 0);
    return bTotal - aTotal;
  }).slice(0, 6);

  const humanViews = totals.total_views || tools.reduce((acc, t) => acc + (t.view_count || 0), 0);
  const humanTasks = totals.total_tasks_completed || tools.reduce((acc, t) => acc + (t.download_count || 0) + (t.copy_count || 0) + (t.use_count || 0), 0);
  const humanCvr = totals.overall_total_cvr || '0.0';
  const humanRatio = botAnalytics.humanTrafficRatio !== undefined ? botAnalytics.humanTrafficRatio : 100;
  const botRatio = botAnalytics.botTrafficRatio !== undefined ? botAnalytics.botTrafficRatio : 0;
  const totalBotViews = botAnalytics.totalBotViews || totals.total_bot_views || 0;
  const liveBots = botAnalytics.liveBots30m !== undefined ? botAnalytics.liveBots30m : (totals.live_bots || 0);

  return (
    <div className="admin-body">
      {/* Overview Top Metric Cards (Real Human Traffic) */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Active Human Users (30m)</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#10b981' }}>
            {liveVisitors}
          </div>
          <div className="admin-kpi-sub">
            <span>Verified human active sessions</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Human Platform Views</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Eye size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">
            {humanViews.toLocaleString()}
          </div>
          <div className="admin-kpi-sub">
            <span>Real human page impressions</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Human Tasks Completed</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <Download size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">
            {humanTasks.toLocaleString()}
          </div>
          <div className="admin-kpi-sub">
            <span>Exports, generations & conversions</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Human Conversion Rate</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#3b82f6' }}>
            {humanCvr}%
          </div>
          <div className="admin-kpi-sub">
            <span>Real user task completion rate</span>
          </div>
        </div>
      </div>

      {/* Traffic Integrity & Bot Isolation Banner */}
      <div className="admin-integrity-banner">
        <div className="admin-integrity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Traffic Integrity & Bot Isolation</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Search engine spiders and AI crawlers are strictly filtered out of all primary analytics.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#10b981'
            }}>
              <Users size={12} />
              {humanRatio}% Human Traffic
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 999,
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#a855f7'
            }}>
              <Bot size={12} />
              {totalBotViews} Bot Hits Isolated ({liveBots} active)
            </span>
          </div>
        </div>

        {/* Visual traffic split bar */}
        <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: 'rgba(150, 150, 150, 0.1)' }}>
          <div 
            style={{ width: `${humanRatio}%`, background: 'linear-gradient(90deg, #10b981, #3b82f6)', transition: 'width 0.4s ease' }} 
            title={`Human Traffic: ${humanRatio}%`}
          />
          <div 
            style={{ width: `${botRatio}%`, background: 'linear-gradient(90deg, #a855f7, #ec4899)', transition: 'width 0.4s ease' }} 
            title={`Bot & Crawler Traffic: ${botRatio}%`}
          />
        </div>
      </div>

      {/* Grid: Top Performing Tools & Event Breakdown */}
      <div className="admin-two-col-grid">
        {/* Top Tools Card */}
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
          borderRadius: 18,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Top Performing Tools</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ranked by real user tasks and engagement</span>
            </div>
            <button 
              type="button" 
              className="admin-action-btn"
              onClick={onSelectToolTab}
              style={{ fontSize: '0.75rem' }}
            >
              <span>View All 30</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flexGrow: 1 }}>
            {topTools.map((tool, idx) => {
              const taskCount = (tool.download_count || 0) + (tool.copy_count || 0) + (tool.use_count || 0);
              return (
                <div 
                  key={tool.slug}
                  className="admin-top-tool-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 12,
                    background: 'rgba(150, 150, 150, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', width: 16 }}>
                      #{idx + 1}
                    </span>
                    <img 
                      src={`/tool-icons/${tool.slug}.webp`} 
                      alt="" 
                      style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
                      onError={(e) => {
                        if (!e.target.dataset.triedPng) {
                          e.target.dataset.triedPng = 'true';
                          e.target.src = `/tool-icons/${tool.slug}.png`;
                        }
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{tool.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tool.category}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#10b981' }}>
                      {taskCount.toLocaleString()} tasks
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {tool.unique_visitors_count ? `${tool.unique_visitors_count} human visitors` : 'Active'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity & Engine Architecture */}
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
          borderRadius: 18,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Ecosystem Architecture</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Infrastructure and execution distribution
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
            <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.88rem', color: '#10b981' }}>Client WASM / Zero Server Compute</strong>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>24 Tools</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                PDF processing, image compression, video transcode, and mathematical engines run 100% inside client browser Web Workers.
              </p>
            </div>

            <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.88rem', color: '#a855f7' }}>Gemini AI Inference Suite</strong>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>6 Tools</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                ATS analysis, crawler auditing, content hallucination, and PDF RAG cleaner powered by Google Gemini SDK with dynamic token quotas.
              </p>
            </div>

            <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.88rem', color: '#3b82f6' }}>PostgreSQL Telemetry</strong>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Active</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Real-time unique human visitor tracking with bot isolation and privacy-first cookie tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
