import React, { useState, useEffect } from 'react';
import { BarChart3, X, RefreshCw } from 'lucide-react';
import { useTranslation } from '../i18n';
import { getConversionCount, getConversionLabel } from '../utils/toolMetrics';

export default function StatsModal({ isOpen, onClose }) {
  const { t } = useTranslation();
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--hover-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '24px',
        padding: '2rem',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '500', color: 'var(--text-main)' }}>
                {t('stats.title')}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {t('stats.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('stats.loading')}
          </div>
        ) : !stats ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('stats.noData')}
          </div>
        ) : (
          <>
            {/* Overview Metric Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '0.8rem'
            }}>
              <div style={{
                background: 'rgba(150, 150, 150, 0.08)',
                padding: '1rem',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {t('stats.activeTools')}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {stats.summary.active_tools}
                </div>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                padding: '1rem',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: '500' }}>
                  {t('stats.uniqueVisitors')}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '600', color: '#3b82f6', marginTop: '0.2rem' }}>
                  {stats.summary.total_unique_visitors || 0}
                </div>
              </div>

              <div style={{
                background: 'rgba(150, 150, 150, 0.08)',
                padding: '1rem',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {t('stats.totalViews')}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {stats.summary.total_views}
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '1rem',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '500' }}>
                  {t('stats.totalDownloads')}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '600', color: '#10b981', marginTop: '0.2rem' }}>
                  {stats.summary.total_downloads || 0}
                </div>
              </div>
            </div>

            {/* Tools Breakdown Table with Tool-Specific Conversion */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.6rem', color: 'var(--text-main)' }}>
                {t('stats.toolBreakdown')}
              </h4>
              <div style={{
                background: 'rgba(150, 150, 150, 0.05)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>{t('stats.colTool')}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{t('stats.colCategory')}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('stats.colUnique')}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('stats.colConversion') || 'Conversions'}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('stats.colViews')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.tools.map((tItem) => {
                      const cCount = getConversionCount(tItem);
                      const cLabel = getConversionLabel(tItem.slug, cCount, 'en');
                      return (
                        <tr key={tItem.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <img 
                                src={`/tool-icons/${tItem.slug}.webp`} 
                                alt="" 
                                style={{ 
                                  width: '22px', 
                                  height: '22px', 
                                  borderRadius: '5px', 
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))' 
                                }}
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
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{tItem.category}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#3b82f6', fontWeight: '600' }}>
                            {tItem.unique_visitors_count}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                            {cCount > 0 ? `${cCount} ${cLabel}` : '-'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {tItem.view_count}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            onClick={fetchStats}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              background: 'rgba(150, 150, 150, 0.1)',
              border: 'none',
              borderRadius: '10px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> {t('stats.refresh')}
          </button>
        </div>
      </div>
    </div>
  );
}
