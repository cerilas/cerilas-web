import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Globe, 
  ExternalLink, 
  Loader2, 
  Layers, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';

export default function GrowthTechnicalAudit() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all'); // all, critical, high, medium

  const fetchAudit = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) setData(json.data);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [activeWorkspace?.id, token]);

  if (loading) {
    return (
      <div className="growth-loading-view">
        <Loader2 size={32} className="growth-spinner" />
        <span>Teknik site denetim raporu yükleniyor...</span>
      </div>
    );
  }

  const issues = data?.issues || [];
  const pages = data?.pages || [];

  const filteredIssues = issues.filter(iss => {
    if (filterSeverity === 'all') return true;
    return iss.severity === filterSeverity;
  });

  return (
    <div className="growth-page-container animate-fade">
      {/* Page Header */}
      <div className="growth-page-header">
        <div>
          <div className="growth-title-row">
            <Wrench size={22} className="text-warning" />
            <h1 className="growth-page-title">Teknik Site Denetimi & Hata Raporu</h1>
          </div>
          <p className="growth-page-subtitle">
            Sayfa başlıkları, meta etiketler, H1/H2 hiyerarşisi, Schema.org yapılandırılmış verisi ve dizine eklenebilirlik kontrolleri.
          </p>
        </div>

        <button type="button" onClick={fetchAudit} className="growth-secondary-btn">
          <RefreshCw size={14} />
          <span>Yeniden Tara</span>
        </button>
      </div>

      {/* Issues Filter Tabs */}
      <div className="growth-audit-filter-bar">
        <button
          type="button"
          className={`growth-audit-tab ${filterSeverity === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilterSeverity('all')}
        >
          Tüm Hatalar ({issues.length})
        </button>
        <button
          type="button"
          className={`growth-audit-tab ${filterSeverity === 'critical' ? 'is-active' : ''}`}
          onClick={() => setFilterSeverity('critical')}
        >
          Kritik ({issues.filter(i => i.severity === 'critical').length})
        </button>
        <button
          type="button"
          className={`growth-audit-tab ${filterSeverity === 'high' ? 'is-active' : ''}`}
          onClick={() => setFilterSeverity('high')}
        >
          Yüksek ({issues.filter(i => i.severity === 'high').length})
        </button>
        <button
          type="button"
          className={`growth-audit-tab ${filterSeverity === 'medium' ? 'is-active' : ''}`}
          onClick={() => setFilterSeverity('medium')}
        >
          Orta & Bilgi ({issues.filter(i => i.severity === 'medium' || i.severity === 'low').length})
        </button>
      </div>

      {/* Issues List */}
      <div className="growth-audit-issues-stack">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <div key={issue.id} className="growth-issue-card">
              <div className="growth-issue-header">
                <span className={`growth-severity-tag severity-${issue.severity}`}>
                  {issue.severity.toUpperCase()}
                </span>
                <h4 className="growth-issue-title">{issue.title}</h4>
              </div>

              <p className="growth-issue-desc">{issue.description}</p>

              {issue.recommended_fix && (
                <div className="growth-issue-fix-box">
                  <span className="fix-box-label">Önerilen Çözüm:</span>
                  <p className="fix-box-text">{issue.recommended_fix}</p>
                </div>
              )}

              {issue.page_url && (
                <div className="growth-issue-url-row">
                  <Globe size={12} />
                  <span>{issue.page_url}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="growth-empty-card">
            <CheckCircle2 size={32} className="text-success" />
            <h4>Seçilen kategoride hata bulunamadı</h4>
            <p>Siteniz bu kriterlerde başarılı.</p>
          </div>
        )}
      </div>

      {/* Crawled Pages Section */}
      <div className="growth-panel-card" style={{ marginTop: '2rem' }}>
        <div className="growth-panel-header">
          <div>
            <h3 className="growth-panel-title">Taranan Sayfalar ({pages.length})</h3>
            <p className="growth-panel-desc">Arama motorları ve yapay zeka tarafından erişilen sayfaların dizin durumu.</p>
          </div>
        </div>

        <div className="growth-pages-table">
          <div className="pages-table-header">
            <span>Sayfa URL</span>
            <span>Durum</span>
            <span>Kelime Sayısı</span>
            <span>Yapılandırılmış Veri</span>
          </div>

          {pages.map((pg) => (
            <div key={pg.id} className="pages-table-row">
              <div className="page-url-cell">
                <span className="page-title-text">{pg.title || 'Başlıksız Sayfa'}</span>
                <span className="page-url-sub">{pg.url}</span>
              </div>
              <div className="page-status-cell">
                <span className="page-status-pill">{pg.status_code || 200} OK</span>
              </div>
              <div className="page-words-cell">
                <span>{pg.word_count || 0} kelime</span>
              </div>
              <div className="page-schema-cell">
                {pg.schema_types && pg.schema_types.length > 0 ? (
                  pg.schema_types.map((sc, scIdx) => (
                    <span key={scIdx} className="schema-pill">{sc}</span>
                  ))
                ) : (
                  <span className="text-muted">Şema Yok</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
