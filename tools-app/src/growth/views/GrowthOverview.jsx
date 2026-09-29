import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowUpRight, 
  ShieldCheck, 
  Bot, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  Wrench, 
  Globe, 
  ExternalLink,
  Loader2,
  Check,
  ChevronDown
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';

export default function GrowthOverview() {
  const { activeWorkspace, setActiveTab, setIsOnboardingOpen } = useGrowth();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOppId, setExpandedOppId] = useState(null);
  const [updatingOppId, setUpdatingOppId] = useState(null);

  const fetchOverview = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Genel bakış verileri alınamadı.');
      setData(json.data);
    } catch (err) {
      console.error('Overview error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [activeWorkspace?.id, token]);

  const handleUpdateOppStatus = async (oppId, newStatus) => {
    setUpdatingOppId(oppId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities/${oppId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOverview();
      }
    } catch (err) {
      console.error('Update opp error:', err);
    } finally {
      setUpdatingOppId(null);
    }
  };

  if (loading) {
    return (
      <div className="growth-loading-view">
        <Loader2 size={32} className="growth-spinner" />
        <span>Büyüme metrikleri ve aksiyon haritası yükleniyor...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="growth-error-view">
        <AlertTriangle size={32} className="text-danger" />
        <p>{error || 'Veriler yüklenemedi.'}</p>
        <button type="button" onClick={fetchOverview} className="growth-secondary-btn">
          Yeniden Dene
        </button>
      </div>
    );
  }

  const { growthScore, subscores, opportunities, technicalAudit, aiVisibility } = data;

  return (
    <div className="growth-overview-container animate-fade">
      {/* Top Banner: Brand Spotlight & Composite Growth Score */}
      <div className="growth-overview-hero-card">
        <div className="growth-hero-brand-meta">
          <div className="growth-hero-brand-top">
            <span className="growth-pill-tag">
              <Sparkles size={13} />
              <span>{activeWorkspace?.industry || 'Teknoloji & SaaS'}</span>
            </span>
            <span className="growth-pill-tag tag-muted">
              <span>{activeWorkspace?.business_model || 'B2B'}</span>
            </span>
          </div>

          <h1 className="growth-hero-brand-name">{activeWorkspace?.name}</h1>
          <p className="growth-hero-brand-desc">
            {activeWorkspace?.brand_description || 'Arama motoru ve yapay zeka (GEO) büyüme analizleri.'}
          </p>

          <div className="growth-hero-links">
            <a href={activeWorkspace?.canonical_url} target="_blank" rel="noopener noreferrer" className="growth-site-anchor">
              <Globe size={14} />
              <span>{activeWorkspace?.primary_domain}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Growth Score Spotlight Widget */}
        <div className="growth-score-gauge-card">
          <div className="growth-gauge-header">
            <span className="growth-gauge-title">Büyüme Skoru (Growth Score)</span>
            <span className="growth-gauge-badge">Genel Sağlık</span>
          </div>

          <div className="growth-gauge-center">
            <span className="growth-gauge-val">{growthScore}</span>
            <span className="growth-gauge-max">/100</span>
          </div>

          <div className="growth-subscores-grid">
            <div className="growth-subscore-item">
              <span className="subscore-label">Teknik</span>
              <span className="subscore-num">{subscores?.technical || 80}</span>
            </div>
            <div className="growth-subscore-item">
              <span className="subscore-label">SEO</span>
              <span className="subscore-num">{subscores?.search || 50}</span>
            </div>
            <div className="growth-subscore-item">
              <span className="subscore-label">GEO (AI)</span>
              <span className="subscore-num text-primary">{subscores?.ai || 60}</span>
            </div>
            <div className="growth-subscore-item">
              <span className="subscore-label">İçerik</span>
              <span className="subscore-num">{subscores?.content || 65}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: High Priority Action Feed & Diagnostic Signals */}
      <div className="growth-overview-split">
        {/* Left Column: Action Feed (Opportunities) */}
        <div className="growth-action-feed-section">
          <div className="growth-section-header">
            <div>
              <div className="growth-section-title-row">
                <Zap size={18} className="text-warning" />
                <h2 className="growth-section-title">Öncelikli Aksiyon Akışı (Action Feed)</h2>
              </div>
              <p className="growth-section-desc">
                Tahmini etki ve güvenilirlik algoritmasıyla sıralanmış doğrudan büyüme fırsatları.
              </p>
            </div>
            <span className="growth-count-pill">{opportunities?.length || 0} Fırsat</span>
          </div>

          <div className="growth-opps-stack">
            {opportunities && opportunities.length > 0 ? (
              opportunities.map((opp) => {
                const isExpanded = expandedOppId === opp.id;
                const isDone = opp.status === 'completed';
                const isProgress = opp.status === 'in_progress';

                return (
                  <div key={opp.id} className={`growth-opp-card ${isDone ? 'is-completed' : ''}`}>
                    <div className="growth-opp-main-row" onClick={() => setExpandedOppId(isExpanded ? null : opp.id)}>
                      <div className="growth-opp-priority-col">
                        <span className={`growth-priority-badge ${opp.priority_score > 90 ? 'is-urgent' : 'is-high'}`}>
                          {opp.priority_score > 90 ? 'YÜKSEK ETKİ' : 'ÖNERİLEN'}
                        </span>
                        <span className="growth-priority-score">{opp.priority_score}/100</span>
                      </div>

                      <div className="growth-opp-content-col">
                        <h4 className="growth-opp-title">{opp.title}</h4>
                        <p className="growth-opp-desc">{opp.description}</p>
                        
                        <div className="growth-opp-meta-row">
                          <span className="growth-opp-category-tag">{opp.category}</span>
                          {opp.estimated_traffic_upside && (
                            <span className="growth-opp-upside-tag">
                              <TrendingUp size={12} />
                              <span>{opp.estimated_traffic_upside}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="growth-opp-actions-col">
                        <button
                          type="button"
                          className="growth-opp-toggle-btn"
                          aria-label="Detaylar"
                        >
                          <ChevronDown size={18} className={`chevron-icon ${isExpanded ? 'is-expanded' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Drawer: Action Steps & Evidence */}
                    {isExpanded && (
                      <div className="growth-opp-drawer animate-fade">
                        {opp.action_steps && Array.isArray(opp.action_steps) && (
                          <div className="growth-action-steps-box">
                            <span className="drawer-subhead">Önerilen Aksiyon Adımları:</span>
                            <ul className="drawer-steps-list">
                              {opp.action_steps.map((st, sIdx) => (
                                <li key={sIdx}>
                                  <span className="step-num">{sIdx + 1}</span>
                                  <span>{st}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="drawer-footer-actions">
                          <button
                            type="button"
                            disabled={updatingOppId === opp.id}
                            className={`drawer-action-btn ${isProgress ? 'btn-active' : ''}`}
                            onClick={() => handleUpdateOppStatus(opp.id, isProgress ? 'open' : 'in_progress')}
                          >
                            <Clock size={14} />
                            <span>{isProgress ? 'İşlemde Olarak İşaretli' : 'İşleme Al'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={updatingOppId === opp.id}
                            className={`drawer-action-btn btn-success ${isDone ? 'btn-active' : ''}`}
                            onClick={() => handleUpdateOppStatus(opp.id, isDone ? 'open' : 'completed')}
                          >
                            <Check size={14} />
                            <span>{isDone ? 'Tamamlandı' : 'Tamamlandı Olarak İşaretle'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="growth-empty-card">
                <CheckCircle2 size={32} className="text-success" />
                <h4>Açık Fırsat Bulunmuyor</h4>
                <p>Mevcut tüm optimizasyon adımları tamamlandı.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic & Readiness Cards */}
        <div className="growth-overview-side-col">
          {/* Technical Health Card */}
          <div className="growth-side-card">
            <div className="side-card-top">
              <div className="side-card-icon-wrap">
                <Wrench size={18} />
              </div>
              <div>
                <h3 className="side-card-title">Teknik Site Sağlığı</h3>
                <span className="side-card-sub">Otomatik Tarama Sonucu</span>
              </div>
            </div>

            <div className="side-card-stats-row">
              <div className="stat-metric-pill">
                <span className="stat-metric-label">Teknik Skor</span>
                <span className="stat-metric-val">{subscores?.technical || 85}%</span>
              </div>
              <div className="stat-metric-pill">
                <span className="stat-metric-label">Aktif Hata</span>
                <span className="stat-metric-val text-warning">{technicalAudit?.totalIssues || 0}</span>
              </div>
            </div>

            <div className="side-issues-summary">
              <div className="issue-row">
                <span className="issue-label text-danger">Kritik</span>
                <span className="issue-val">{technicalAudit?.issuesBreakdown?.critical || 0}</span>
              </div>
              <div className="issue-row">
                <span className="issue-label text-warning">Yüksek</span>
                <span className="issue-val">{technicalAudit?.issuesBreakdown?.high || 0}</span>
              </div>
              <div className="issue-row">
                <span className="issue-label text-muted">Orta / Bilgi</span>
                <span className="issue-val">{(technicalAudit?.issuesBreakdown?.medium || 0) + (technicalAudit?.issuesBreakdown?.low || 0)}</span>
              </div>
            </div>

            <button
              type="button"
              className="side-card-link-btn"
              onClick={() => setActiveTab('technical')}
            >
              <span>Tüm Hataları ve Sayfaları Gör</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* GEO / AI Visibility Card */}
          <div className="growth-side-card geo-highlight-card">
            <div className="side-card-top">
              <div className="side-card-icon-wrap icon-ai">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="side-card-title">Yapay Zeka (GEO) Görünürlüğü</h3>
                <span className="side-card-sub">ChatGPT, Perplexity & Gemini</span>
              </div>
            </div>

            <p className="side-card-desc">
              Yapay zeka arama motorlarının sitenizden ne sıklıkla alıntı yaptığını ve sektörünüzdeki sorulara verilen yanıtları takip edin.
            </p>

            <div className="side-card-stats-row">
              <div className="stat-metric-pill">
                <span className="stat-metric-label">Takip Edilen Prompt</span>
                <span className="stat-metric-val">{aiVisibility?.totalPrompts || 3}</span>
              </div>
              <div className="stat-metric-pill">
                <span className="stat-metric-label">Alıntı Sayısı</span>
                <span className="stat-metric-val">{aiVisibility?.totalCitations || 0}</span>
              </div>
            </div>

            <button
              type="button"
              className="side-card-link-btn"
              onClick={() => setActiveTab('ai-visibility')}
            >
              <span>AI Görünürlük Simülatörünü Aç</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Google Search Console Connection Card */}
          <div className="growth-side-card gsc-connect-card">
            <div className="side-card-top">
              <div className="side-card-icon-wrap icon-gsc">
                <Search size={18} />
              </div>
              <div>
                <h3 className="side-card-title">Google Search Console</h3>
                <span className="side-card-sub">1. Parti Organik Arama Verisi</span>
              </div>
            </div>

            <p className="side-card-desc">
              Organik tıklamaları, gösterimleri ve 5-10. sıradaki hızlı fırsatları ortaya çıkarmak için Search Console mülkünüzü bağlayın.
            </p>

            <button
              type="button"
              className="growth-primary-btn btn-sm"
              onClick={() => setActiveTab('settings')}
            >
              <span>Entegrasyonu Bağla</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
