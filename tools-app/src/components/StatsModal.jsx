import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  X as CloseIcon, 
  RefreshCw, 
  Users, 
  Zap, 
  Activity, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { getConversionCount, getConversionLabel } from '../utils/toolMetrics';
import './StatsModal.css';

export default function StatsModal({ isOpen, onClose }) {
  const { t, language } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tools/stats/overview');
      const json = await res.json();
      if (json.status === 'success') {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format large numbers with commas
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('en-US');
  };

  const summary = stats?.summary || {};
  const totalVisitorsX = summary.total_unique_visitors || 0;
  const totalWorkflowsY = summary.total_tasks_completed || (summary.total_uses || 0) + (summary.total_downloads || 0) + (summary.total_copies || 0);
  const liveVisitorsZ = summary.live_visitors || 1;
  const activeToolsCount = summary.active_tools || 30;

  return (
    <div 
      className="stats-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="stats-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header Bar */}
        <div className="stats-header-bar">
          <div className="stats-header-left">
            <div className="stats-header-icon-box">
              <BarChart3 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="stats-header-title">{t('stats.title')}</h3>
              <p className="stats-header-subtitle">
                {t('stats.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="stats-close-btn"
            aria-label="Close statistics modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ 
              width: 38, 
              height: 38, 
              borderRadius: '50%', 
              border: '2px solid rgba(150,150,150,0.2)', 
              borderTopColor: '#2563eb', 
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem auto'
            }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('stats.loading')}</p>
          </div>
        ) : !stats ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>{t('stats.noData')}</p>
            <button onClick={fetchStats} className="stats-refresh-btn" style={{ margin: '1rem auto' }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* ==========================================================
                Hero Impact Motto & Live Visitors Badge
                ========================================================== */}
            <div className="stats-motto-hero">
              {/* Real-time Z live visitors indicator */}
              <div className="stats-live-pill">
                <span className="stats-beacon-indicator" />
                <span>
                  {language === 'tr' ? (
                    <>Şu an canlı <strong>{formatNumber(liveVisitorsZ)}</strong> ziyaretçi araçları kullanıyor</>
                  ) : (
                    <>Currently <strong>{formatNumber(liveVisitorsZ)}</strong> {liveVisitorsZ === 1 ? 'visitor' : 'visitors'} online exploring tools live</>
                  )}
                </span>
              </div>

              {/* The Narrative Motto with X and Y */}
              <h2 className="stats-motto-statement">
                {language === 'tr' ? (
                  <>
                    Bugüne kadar{' '}
                    <span className="stats-stat-highlight">{formatNumber(totalVisitorsX)}</span>{' '}
                    mühendis, araştırmacı, girişimci ve uzmanın{' '}
                    <span className="stats-stat-highlight">{formatNumber(totalWorkflowsY)}</span>{' '}
                    günlük iş akışını basitleştirmesine ve otomatikleştirmesine yardımcı olduk.
                  </>
                ) : (
                  <>
                    We empower over{' '}
                    <span className="stats-stat-highlight">{formatNumber(totalVisitorsX)}</span>{' '}
                    engineers, researchers, founders &amp; creators to simplify{' '}
                    <span className="stats-stat-highlight">{formatNumber(totalWorkflowsY)}</span>{' '}
                    everyday workflows.
                  </>
                )}
              </h2>

              <p className="stats-motto-guarantee">
                <CheckCircle2 size={14} className="stats-guarantee-icon" />
                <span>
                  {language === 'tr' 
                    ? '%100 yerel tarayıcı içi WebAssembly & WebGPU işlemi. Sıfır sunucu dosya kaydı.'
                    : '100% private, client-side WebAssembly & WebGPU computation. Zero server file logging.'}
                </span>
              </p>
            </div>

            {/* ==========================================================
                4 Metric Overview Cards
                ========================================================== */}
            <div className="stats-metrics-grid">
              {/* Card 1: Unique Visitors (X) */}
              <div className="stats-card-tile visitors">
                <div className="stats-tile-top">
                  <span className="stats-tile-label">Global Visitors</span>
                  <div className="stats-tile-icon">
                    <Users size={16} />
                  </div>
                </div>
                <div>
                  <div className="stats-tile-value">{formatNumber(totalVisitorsX)}</div>
                  <p className="stats-tile-subtext">All-time unique founders &amp; researchers</p>
                </div>
              </div>

              {/* Card 2: Workflows Simplified (Y) */}
              <div className="stats-card-tile tasks">
                <div className="stats-tile-top">
                  <span className="stats-tile-label">Simplified Tasks</span>
                  <div className="stats-tile-icon">
                    <Zap size={16} />
                  </div>
                </div>
                <div>
                  <div className="stats-tile-value">{formatNumber(totalWorkflowsY)}</div>
                  <p className="stats-tile-subtext">Calculations, exports &amp; conversions</p>
                </div>
              </div>

              {/* Card 3: Live Active Visitors (Z) */}
              <div className="stats-card-tile live">
                <div className="stats-tile-top">
                  <span className="stats-tile-label">Live Right Now</span>
                  <div className="stats-tile-icon">
                    <Activity size={16} />
                  </div>
                </div>
                <div>
                  <div className="stats-tile-value">
                    <span className="stats-beacon-indicator" style={{ width: 7, height: 7 }} />
                    {formatNumber(liveVisitorsZ)}
                  </div>
                  <p className="stats-tile-subtext">Active visitors in last 30 minutes</p>
                </div>
              </div>

              {/* Card 4: Specialized Tools */}
              <div className="stats-card-tile tools">
                <div className="stats-tile-top">
                  <span className="stats-tile-label">Active Utilities</span>
                  <div className="stats-tile-icon">
                    <Layers size={16} />
                  </div>
                </div>
                <div>
                  <div className="stats-tile-value">{activeToolsCount}</div>
                  <p className="stats-tile-subtext">Finance, PDF, AI, Media &amp; Stats</p>
                </div>
              </div>
            </div>

            {/* ==========================================================
                Tool-by-Tool Detailed Breakdown Table
                ========================================================== */}
            <div className="stats-table-section">
              <div className="stats-table-header">
                <h4 className="stats-table-title">{t('stats.toolBreakdown')}</h4>
                <span className="stats-table-badge">
                  {stats.tools?.length || 0} Tools Tracked
                </span>
              </div>

              <div className="stats-table-card">
                <table className="stats-breakdown-table">
                  <thead>
                    <tr>
                      <th>{t('stats.colTool')}</th>
                      <th>{t('stats.colCategory')}</th>
                      <th className="num-col">{t('stats.colUnique')}</th>
                      <th className="num-col">{t('stats.colConversion') || 'Conversions'}</th>
                      <th className="num-col">{t('stats.colViews')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.tools?.map((tItem) => {
                      const cCount = getConversionCount(tItem);
                      const cLabel = getConversionLabel(tItem.slug, cCount, language);
                      return (
                        <tr key={tItem.id}>
                          <td>
                            <div className="stats-tool-cell">
                              <img 
                                src={`/tool-icons/${tItem.slug}.webp`} 
                                alt="" 
                                className="stats-tool-logo"
                                onError={(e) => {
                                  if (!e.target.dataset.triedPng) {
                                    e.target.dataset.triedPng = 'true';
                                    e.target.src = `/tool-icons/${tItem.slug}.png`;
                                  } else {
                                    e.target.style.display = 'none';
                                  }
                                }}
                              />
                              <span>{tItem.title}</span>
                            </div>
                          </td>
                          <td>
                            <span className="stats-category-badge">{tItem.category}</span>
                          </td>
                          <td className="stats-unique-num">
                            {formatNumber(tItem.unique_visitors_count)}
                          </td>
                          <td className="stats-conversion-num">
                            {cCount > 0 ? `${formatNumber(cCount)} ${cLabel}` : '—'}
                          </td>
                          <td className="stats-views-num">
                            {formatNumber(tItem.view_count)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="stats-footer-bar">
              <span className="stats-privacy-badge-pill">
                🔒 Privacy-First • No PII or IP Storage
              </span>
              <button
                onClick={fetchStats}
                className="stats-refresh-btn"
                title="Refresh live metrics"
              >
                <RefreshCw size={14} /> {t('stats.refresh')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
