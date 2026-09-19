import React, { useState, useEffect } from 'react';
import { X as CloseIcon } from 'lucide-react';
import { useTranslation } from '../i18n';
import './StatsModal.css';

export default function StatsModal({ isOpen, onClose }) {
  const { language } = useTranslation();
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

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('en-US');
  };

  const summary = stats?.summary || {};
  const totalVisitorsX = summary.total_unique_visitors || 0;
  const totalWorkflowsY = summary.total_tasks_completed || (summary.total_uses || 0) + (summary.total_downloads || 0) + (summary.total_copies || 0);
  const liveVisitorsZ = summary.live_visitors || 1;

  return (
    <div 
      className="stats-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="stats-modal-container stats-modal-single"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="stats-close-btn stats-single-close"
          aria-label="Close"
        >
          <CloseIcon size={18} />
        </button>

        {loading ? (
          <div className="stats-single-loading">
            <div className="stats-single-spinner" />
          </div>
        ) : (
          <div className="stats-single-wrapper">
            <p className="stats-single-sentence">
              {language === 'tr' ? (
                <>
                  Bugüne kadar{' '}
                  <span className="stats-stat-highlight">{formatNumber(totalVisitorsX)}</span>{' '}
                  girişimci, araştırmacı, serbest çalışan ve öğrencinin{' '}
                  <span className="stats-stat-highlight">{formatNumber(totalWorkflowsY)}</span>{' '}
                  günlük iş akışını basitleştirmesine yardımcı olduk — şu anda canlı{' '}
                  <span className="stats-live-inline-badge">
                    <span className="stats-beacon-indicator" />
                    <strong>{formatNumber(liveVisitorsZ)}</strong> ziyaretçi
                  </span>{' '}
                  araçları kullanıyor.
                </>
              ) : (
                <>
                  We help{' '}
                  <span className="stats-stat-highlight">{formatNumber(totalVisitorsX)}</span>{' '}
                  engineers, researchers, founders, and students simplify{' '}
                  <span className="stats-stat-highlight">{formatNumber(totalWorkflowsY)}</span>{' '}
                  everyday tasks — currently with{' '}
                  <span className="stats-live-inline-badge">
                    <span className="stats-beacon-indicator" />
                    <strong>{formatNumber(liveVisitorsZ)}</strong> live visitors
                  </span>{' '}
                  online right now.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
