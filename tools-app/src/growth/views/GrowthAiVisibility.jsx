import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Plus, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Languages, 
  ExternalLink, 
  Loader2, 
  FileText,
  Search,
  MessageSquare,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  Check,
  ArrowUpRight,
  X,
  History,
  Calendar,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Trash2,
  StopCircle,
  Layers,
  Lock
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import AiEngineBadge, { AiEngineGroup } from '../components/AiEngineBadge';
import { SkeletonBlock } from '../components/GrowthSkeleton';
import AiVisibilityDropdown from '../../tools/ai-visibility-checker/components/AiVisibilityDropdown';
import FlagIcon from '../../tools/ai-visibility-checker/components/FlagIcon';
import { MARKET_OPTIONS, LANGUAGE_OPTIONS, getMarketOption, getLanguageOption } from '../../tools/ai-visibility-checker/options';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} sa önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
  } catch {
    return '';
  }
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export default function GrowthAiVisibility() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptTopic, setNewPromptTopic] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('TR');
  const [selectedLanguage, setSelectedLanguage] = useState('tr');
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [runningPromptId, setRunningPromptId] = useState(null);
  const [lastRunResult, setLastRunResult] = useState(null);

  // Live Real-Time GEO Readiness Audit
  const [geoReadiness, setGeoReadiness] = useState(null);
  const [loadingGeoReadiness, setLoadingGeoReadiness] = useState(true);
  const [scanningGeoReadiness, setScanningGeoReadiness] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Batch Scan State
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, activePromptId: null });
  const [batchResultsMap, setBatchResultsMap] = useState({});
  const abortScanRef = useRef(false);
  const progressCardRef = useRef(null);
  const reportPanelRef = useRef(null);

  // Historical Batch Reports State
  const [reportsList, setReportsList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'cited' | 'mentioned' | 'not_cited'
  const [expandedQueries, setExpandedQueries] = useState({});

  const toggleQuery = (id) => {
    setExpandedQueries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const fetchPrompts = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Promptlar alınamadı.');
      setPrompts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsList = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoadingReports(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/ai-reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReportsList(data.data || []);
        // Auto-load latest report if none selected yet
        if (!activeReport && data.data && data.data.length > 0) {
          handleLoadReport(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch AI reports list error:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleLoadReport = async (reportId) => {
    if (!reportId) {
      setActiveReport(null);
      return;
    }
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/ai-reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setActiveReport(data.data);
      }
    } catch (err) {
      console.error('Load report error:', err);
    }
  };

  const handleDeleteReport = async (reportId, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Bu tarama raporunu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/ai-reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReportsList(prev => prev.filter(r => r.id !== reportId));
        if (activeReport?.id === reportId) {
          setActiveReport(null);
        }
      }
    } catch (err) {
      console.error('Delete report error:', err);
    }
  };

  const fetchGeoReadiness = async (forceRescan = false) => {
    if (!activeWorkspace?.id || !token || !activeWorkspace?.primary_domain) {
      setLoadingGeoReadiness(false);
      return;
    }
    if (forceRescan) setScanningGeoReadiness(true);
    else setLoadingGeoReadiness(true);
    setGeoError(null);

    try {
      const endpoint = forceRescan
        ? `/api/growth/workspaces/${activeWorkspace.id}/geo-readiness/scan`
        : `/api/growth/workspaces/${activeWorkspace.id}/geo-readiness`;
      const res = await fetch(endpoint, {
        method: forceRescan ? 'POST' : 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'GEO analizi alınamadı.');
      setGeoReadiness(data.data);
    } catch (err) {
      console.error('Fetch GEO readiness error:', err);
      setGeoError(err.message);
    } finally {
      setLoadingGeoReadiness(false);
      setScanningGeoReadiness(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchReportsList();
    fetchGeoReadiness(false);
  }, [activeWorkspace?.id, activeWorkspace?.primary_domain, token]);

  // Auto-scroll to batch progress card
  useEffect(() => {
    if (isBatchScanning && progressCardRef.current) {
      progressCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isBatchScanning]);

  const handleAddPrompt = async (e) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

    if (prompts.length >= 10) {
      alert('Maksimum 10 prompt takip limitine ulaştınız. Yeni bir prompt eklemek için lütfen listenizdeki mevcut promptlardan birini silin.');
      return;
    }

    setAddingPrompt(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: newPromptText.trim(),
          topic: newPromptTopic.trim() || 'Genel',
          country: selectedCountry || 'TR',
          language: selectedLanguage || 'tr'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Prompt eklenemedi.');
      }
      setNewPromptText('');
      setNewPromptTopic('');
      fetchPrompts();
    } catch (err) {
      console.error('Add prompt error:', err);
      alert(err.message || 'Prompt eklenirken bir hata oluştu.');
    } finally {
      setAddingPrompt(false);
    }
  };

  const handleRunPrompt = async (promptId) => {
    setRunningPromptId(promptId);
    setLastRunResult(null);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/${promptId}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simülasyon çalıştırılamadı.');
      setLastRunResult(data.data);
      fetchPrompts();
    } catch (err) {
      console.error('Run prompt error:', err);
      alert(err.message);
    } finally {
      setRunningPromptId(null);
    }
  };

  // Start Batch Scan for all prompts
  const handleStartBatchScan = async () => {
    if (!prompts || prompts.length === 0 || isBatchScanning) return;

    setIsBatchScanning(true);
    abortScanRef.current = false;
    setBatchProgress({ current: 0, total: prompts.length, activePromptId: prompts[0].id });
    setBatchResultsMap({});

    const collectedResults = [];
    const primaryDomain = (activeWorkspace.primary_domain || '')
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      .trim();

    for (let i = 0; i < prompts.length; i++) {
      if (abortScanRef.current) break;
      const p = prompts[i];
      setBatchProgress({ current: i, total: prompts.length, activePromptId: p.id });

      try {
        const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/${p.id}/run`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.data) {
          const itemResult = {
            promptId: p.id,
            prompt: p.prompt,
            topic: p.topic,
            country: p.country,
            language: p.language,
            brandMentioned: Boolean(data.data.brand_mentioned),
            domainCited: Boolean(data.data.domain_cited),
            citationsCount: (data.data.citations || []).length,
            citations: data.data.citations || [],
            responseText: data.data.response_text || '',
            model: data.data.model || 'gemini-3.8-flash',
            checkedAt: data.data.checked_at || new Date().toISOString()
          };
          collectedResults.push(itemResult);
          setBatchResultsMap(prev => ({ ...prev, [p.id]: itemResult }));
        } else {
          const errResult = {
            promptId: p.id,
            prompt: p.prompt,
            topic: p.topic,
            country: p.country,
            language: p.language,
            brandMentioned: false,
            domainCited: false,
            citationsCount: 0,
            citations: [],
            responseText: 'Tarama başarısız: ' + (data.error || 'Bilinmeyen hata'),
            isError: true
          };
          collectedResults.push(errResult);
          setBatchResultsMap(prev => ({ ...prev, [p.id]: errResult }));
        }
      } catch (err) {
        const errResult = {
          promptId: p.id,
          prompt: p.prompt,
          topic: p.topic,
          country: p.country,
          language: p.language,
          brandMentioned: false,
          domainCited: false,
          citationsCount: 0,
          citations: [],
          responseText: 'Bağlantı hatası: ' + err.message,
          isError: true
        };
        collectedResults.push(errResult);
        setBatchResultsMap(prev => ({ ...prev, [p.id]: errResult }));
      }

      setBatchProgress({ current: i + 1, total: prompts.length, activePromptId: null });
      // Brief pause between requests for UI clarity & polite pacing
      await new Promise(r => setTimeout(r, 600));
    }

    if (!abortScanRef.current && collectedResults.length > 0) {
      const total = collectedResults.length;
      const mentionedCount = collectedResults.filter(r => r.brandMentioned).length;
      const citedCount = collectedResults.filter(r => r.domainCited).length;
      const score = Math.round(((mentionedCount * 0.5 + citedCount * 0.5) / total) * 100);

      // Aggregate all citations & top domains
      const domainCounts = {};
      collectedResults.forEach(r => {
        (r.citations || []).forEach(c => {
          if (c.domain) {
            domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1;
          }
        });
      });
      const topSources = Object.entries(domainCounts)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const reportPayload = {
        total_prompts: total,
        mentioned_count: mentionedCount,
        cited_count: citedCount,
        visibility_score: score,
        model: 'gemini-3.8-flash',
        summary: {
          totalCitationsFound: Object.values(domainCounts).reduce((a, b) => a + b, 0),
          uniqueDomainsCited: Object.keys(domainCounts).length,
          topSources,
          primaryDomain
        },
        results: collectedResults
      };

      try {
        const saveRes = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/ai-reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(reportPayload)
        });
        const saveData = await saveRes.json();
        if (saveRes.ok && saveData.data) {
          setActiveReport(saveData.data);
          fetchReportsList();
          setTimeout(() => {
            reportPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 350);
        } else {
          setActiveReport({ ...reportPayload, created_at: new Date().toISOString() });
        }
      } catch {
        setActiveReport({ ...reportPayload, created_at: new Date().toISOString() });
      }
    }

    setIsBatchScanning(false);
    fetchPrompts();
  };

  const handleCancelBatchScan = () => {
    abortScanRef.current = true;
    setIsBatchScanning(false);
  };

  // Filter report results
  const reportResults = activeReport?.results || [];
  const filteredReportResults = reportResults.filter(r => {
    if (activeFilter === 'cited') return r.domainCited;
    if (activeFilter === 'mentioned') return r.brandMentioned;
    if (activeFilter === 'not_cited') return !r.domainCited;
    return true;
  });

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Cover Banner with Merged Live GEO Readiness Score Widget */}
      <GrowthPageCover
        badge="Generative Engine Optimization (GEO)"
        badgeIcon={Bot}
        title="Yapay Zeka (GEO) Görünürlüğü & Alıntı Takibi"
        subtitle="Google Gemini, ChatGPT Search ve Perplexity gibi yapay zeka arama motorlarında markanızın anılma ve kaynak gösterilme oranı."
        coverImage="/growth-covers/geo-cover.jpg"
        actions={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Taranan AI Motorları:</span>
              <AiEngineGroup size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="growth-badge blue" style={{ fontSize: '0.74rem' }}>
                <MessageSquare size={11} /> {prompts.length} / 10 Takip Edilen Prompt
              </span>
              <span className="growth-badge purple" style={{ fontSize: '0.74rem' }}>
                <History size={11} /> {reportsList.length} Kayıtlı Rapor
              </span>
            </div>
          </div>
        }
        rightSlot={
          <div className="hero-merged-score-widget">
            {/* Top Bar: Domain Pill + Status Tag + Rescan Button */}
            <div className="hero-score-widget-topbar">
              <div className="hero-score-widget-domain-group">
                {activeWorkspace?.primary_domain && (
                  <span className="geo-domain-tag">
                    <Globe size={11} color="#3b82f6" />
                    <span>{activeWorkspace.primary_domain}</span>
                  </span>
                )}
                {geoReadiness && (
                  <span className={`geo-badge-status ${geoReadiness.geoScore >= 70 ? 'good' : 'warning'}`}>
                    {geoReadiness.geoScore >= 80 ? '✓ Mükemmel AI Erişimi' : geoReadiness.geoScore >= 50 ? '⚡ Geliştirilebilir' : '✕ Eksikler Var'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchGeoReadiness(true)}
                disabled={scanningGeoReadiness || !activeWorkspace?.primary_domain}
                className="hero-score-rescan-btn"
                title="Canlı robots.txt, llms.txt ve Schema standartlarını yeniden tara"
              >
                <RefreshCw size={11} className={scanningGeoReadiness ? 'spin' : ''} />
                <span>{scanningGeoReadiness ? 'Taranıyor...' : 'Şimdi Yeniden Tara'}</span>
              </button>
            </div>

            {/* Score Body */}
            {loadingGeoReadiness ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
                <Loader2 size={20} className="spin" style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Canlı AI hazırbulunuşluk standartları inceleniyor...</span>
              </div>
            ) : geoReadiness ? (
              <>
                <div className="hero-score-widget-body">
                  <div className={`geo-score-radial-box ${geoReadiness.geoScore >= 70 ? '' : geoReadiness.geoScore >= 50 ? 'warning' : 'danger'}`}>
                    <span className="geo-score-radial-num">{geoReadiness.geoScore}</span>
                    <span className="geo-score-radial-max">/100</span>
                  </div>

                  <div className="hero-score-widget-texts">
                    <h4 className="hero-score-widget-title">
                      {geoReadiness.geoScore >= 80 ? 'Yüksek AI Hazırbulunuşluğu & Taranabilirlik' : 'Yapay Zeka Taranabilirlik Optimizasyonu Gerekli'}
                    </h4>
                    <p className="hero-score-widget-desc">
                      {geoReadiness.summaryText || 'Alan adınızın taranabilirlik ve alıntılanabilirlik durumu yapay zeka arama motorları için analiz edildi.'}
                    </p>
                    {geoReadiness.checked_at && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                        Son Tarama: {formatRelativeTime(geoReadiness.checked_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Standards Mini Bar */}
                <div className="hero-score-widget-standards-bar">
                  {(geoReadiness.standards || []).map((std, sIdx) => {
                    const isPassed = std.passed;
                    return (
                      <a
                        key={sIdx}
                        href={std.link || '#'}
                        target={std.link ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="hero-std-pill"
                        title={std.desc}
                      >
                        <span className={`hero-std-dot ${isPassed ? 'passed' : 'failed'}`} />
                        <span>{std.title}: {isPassed ? 'Aktif' : 'Eksik'}</span>
                        {std.link && <ExternalLink size={10} style={{ opacity: 0.6 }} />}
                      </a>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ padding: '0.75rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                <Globe size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Alan adı analiz edilmedi. Ayarlardan alan adınızı doğrulayın.
              </div>
            )}
          </div>
        }
      />

      {/* =========================================================================
          BATCH SCAN PROGRESS & HISTORICAL REPORT SECTION
          ========================================================================= */}

      {/* 1. Live Animated Batch Scan Progress Card */}
      {isBatchScanning && (
        <div ref={progressCardRef} className="ai-batch-scan-card">
          <div className="ai-batch-scan-header">
            <div className="ai-batch-scan-title">
              <Loader2 size={20} className="spin" color="#3b82f6" />
              <span>Canlı Yapay Zeka Taraması Devam Ediyor...</span>
            </div>
            <div className="ai-batch-scan-actions">
              <button type="button" onClick={handleCancelBatchScan} className="ai-batch-cancel-btn">
                <StopCircle size={14} />
                <span>Taramayı Durdur</span>
              </button>
            </div>
          </div>

          <div className="ai-batch-progress-bar-wrap">
            <div className="ai-batch-progress-meta">
              <span>İncelenen Prompt: {batchProgress.current} / {batchProgress.total}</span>
              <span>%{Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)} Tamamlandı</span>
            </div>
            <div className="ai-batch-progress-track">
              <div 
                className="ai-batch-progress-fill" 
                style={{ width: `${Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%` }} 
              />
            </div>
          </div>

          <div className="ai-batch-prompts-list">
            {prompts.map((p, idx) => {
              const res = batchResultsMap[p.id];
              const isProbing = batchProgress.activePromptId === p.id;
              const isDone = !!res;

              return (
                <div key={p.id} className={`ai-batch-prompt-row ${isProbing ? 'probing' : isDone ? 'done' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', width: 22 }}>#{idx + 1}</span>
                    <span className="ai-batch-prompt-text">"{p.prompt}"</span>
                  </div>

                  <div className="ai-batch-status-pills">
                    {isProbing ? (
                      <span className="ai-pill probing">
                        <Loader2 size={12} className="spin" />
                        <span>Gemini 3.8 Sorgulanıyor...</span>
                      </span>
                    ) : isDone ? (
                      <>
                        {res.brandMentioned ? (
                          <span className="ai-pill success">
                            <Check size={11} strokeWidth={3} />
                            <span>Marka Anıldı</span>
                          </span>
                        ) : (
                          <span className="ai-pill danger">
                            <X size={11} strokeWidth={3} />
                            <span>Anılmadı</span>
                          </span>
                        )}

                        {res.domainCited ? (
                          <span className="ai-pill success">
                            <Globe size={11} />
                            <span>Siteniz Alıntılandı</span>
                          </span>
                        ) : res.citationsCount > 0 ? (
                          <span className="ai-pill neutral">
                            <Globe size={11} />
                            <span>{res.citationsCount} Dış Kaynak</span>
                          </span>
                        ) : (
                          <span className="ai-pill neutral">
                            <span>Alıntı Yok</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="ai-pill queued">
                        <Clock size={11} />
                        <span>Sırada Bekliyor</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. AI Visibility Summary Report (Minik Rapor) */}
      {activeReport && !isBatchScanning && (
        <div ref={reportPanelRef} className="ai-report-panel animate-fade">
          <div className="ai-report-topbar">
            <div className="ai-report-top-left">
              <div className="ai-report-badge-row">
                <span className="growth-badge blue">
                  <BarChart3 size={12} /> AI Görünürlük &amp; Alıntı Raporu
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={13} />
                  <span>{formatFullDate(activeReport.created_at)}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>({formatRelativeTime(activeReport.created_at)})</span>
                </span>
                <span className="growth-badge neutral">
                  <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 12, height: 12 }} />
                  <span>{activeReport.model || 'gemini-3.8-flash'}</span>
                </span>
              </div>
              <h3 className="ai-report-heading">
                {formatFullDate(activeReport.created_at)} Tarihli Toplu Tarama Raporu
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Toplam {activeReport.total_prompts} adet takip edilen arama sorusunun taranmasıyla oluşturulan zaman damgalı performans özeti.
              </p>
            </div>

            <div className="ai-report-top-right">
              {reportsList.length > 1 && (
                <div className="ai-report-history-select-wrap">
                  <History size={13} color="#94a3b8" />
                  <select
                    className="ai-report-history-select"
                    value={activeReport.id || ''}
                    onChange={(e) => handleLoadReport(e.target.value)}
                  >
                    {reportsList.map(r => (
                      <option key={r.id} value={r.id}>
                        {formatFullDate(r.created_at)} (Skor: %{r.visibility_score})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeReport.id && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteReport(activeReport.id, e)}
                  className="growth-secondary-btn"
                  title="Bu raporu arşivden sil"
                  style={{ padding: '0.35rem 0.65rem', color: '#f87171' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 4 Mini Report Metric Cards */}
          <div className="ai-report-metrics-grid">
            <div className="ai-report-metric-card score-card">
              <span className="ai-report-metric-label">GEO Görünürlük Skoru</span>
              <div className={`ai-report-metric-val ${activeReport.visibility_score >= 70 ? 'score-high' : activeReport.visibility_score >= 40 ? 'score-mid' : 'score-low'}`}>
                %{activeReport.visibility_score}
              </div>
              <span className="ai-report-metric-sub">
                {activeReport.visibility_score >= 70 ? 'Yüksek Görünürlük' : activeReport.visibility_score >= 40 ? 'Orta Düzey Varlık' : 'Geliştirilmeli'}
              </span>
            </div>

            <div className="ai-report-metric-card">
              <span className="ai-report-metric-label">Marka Anılma Oranı</span>
              <div className="ai-report-metric-val">
                {activeReport.mentioned_count} / {activeReport.total_prompts}
              </div>
              <span className="ai-report-metric-sub">
                %{Math.round(((activeReport.mentioned_count || 0) / (activeReport.total_prompts || 1)) * 100)} Promptta markanız anıldı
              </span>
            </div>

            <div className="ai-report-metric-card">
              <span className="ai-report-metric-label">Siteniz Kaynak Gösterildi</span>
              <div className="ai-report-metric-val text-success">
                {activeReport.cited_count} / {activeReport.total_prompts}
              </div>
              <span className="ai-report-metric-sub">
                %{Math.round(((activeReport.cited_count || 0) / (activeReport.total_prompts || 1)) * 100)} Doğrudan URL / Domain alıntısı
              </span>
            </div>

            <div className="ai-report-metric-card">
              <span className="ai-report-metric-label">Toplam Alıntılanan Kaynak</span>
              <div className="ai-report-metric-val">
                {activeReport.summary?.totalCitationsFound || 0}
              </div>
              <span className="ai-report-metric-sub">
                {activeReport.summary?.uniqueDomainsCited || 0} Farklı alan adı cite edildi
              </span>
            </div>
          </div>

          {/* Top Sources Pill Breakdown */}
          {activeReport.summary?.topSources && activeReport.summary.topSources.length > 0 && (
            <div className="ai-report-sources-box">
              <div className="ai-report-sources-title">
                <Globe size={13} color="#3b82f6" />
                <span>Yapay Zeka Tarafından En Çok Kaynak Gösterilen Alan Adları:</span>
              </div>
              <div className="ai-report-sources-pills">
                {activeReport.summary.topSources.map((s, sIdx) => {
                  const isUser = activeReport.summary.primaryDomain && s.domain.includes(activeReport.summary.primaryDomain);
                  return (
                    <span key={sIdx} className={`ai-source-tag ${isUser ? 'is-user' : ''}`}>
                      <Globe size={11} />
                      <span>{s.domain}</span>
                      <span className="ai-source-count">{s.count} alıntı</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="ai-report-filters-bar">
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
              İncelenen Promptlar ({filteredReportResults.length} / {reportResults.length})
            </span>

            <div className="ai-filter-tabs">
              <button 
                type="button" 
                className={`ai-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Tümü ({reportResults.length})
              </button>
              <button 
                type="button" 
                className={`ai-filter-tab ${activeFilter === 'cited' ? 'active' : ''}`}
                onClick={() => setActiveFilter('cited')}
              >
                Siteniz Kaynak Gösterilenler ({reportResults.filter(r => r.domainCited).length})
              </button>
              <button 
                type="button" 
                className={`ai-filter-tab ${activeFilter === 'mentioned' ? 'active' : ''}`}
                onClick={() => setActiveFilter('mentioned')}
              >
                Marka Anılanlar ({reportResults.filter(r => r.brandMentioned).length})
              </button>
              <button 
                type="button" 
                className={`ai-filter-tab ${activeFilter === 'not_cited' ? 'active' : ''}`}
                onClick={() => setActiveFilter('not_cited')}
              >
                Alıntı Olmayanlar ({reportResults.filter(r => !r.domainCited).length})
              </button>
            </div>
          </div>

          {/* Prompt Breakdown List */}
          <div className="ai-report-results-list">
            {filteredReportResults.map((item, idx) => {
              const isExpanded = !!expandedQueries[item.promptId || idx];
              const marketOpt = getMarketOption(item.country || 'TR');
              const langOpt = getLanguageOption(item.language || 'tr');

              return (
                <div key={item.promptId || idx} className="ai-report-item-card">
                  <div className="ai-report-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span className="ai-report-item-query">"{item.prompt}"</span>
                      <span className="prompt-topic-tag">{item.topic || 'Genel'}</span>
                      <span className="prompt-meta-badge" title={`Pazar: ${marketOpt.label}`}>
                        {marketOpt.icon}
                        <span>{marketOpt.code || item.country || 'TR'}</span>
                      </span>
                      <span className="prompt-meta-badge lang" title={`Dil: ${langOpt.label}`}>
                        <Languages size={11} color="#8b5cf6" />
                        <span>{langOpt.code || (item.language || 'TR').toUpperCase()}</span>
                      </span>
                    </div>

                    <div className="ai-report-item-badges">
                      {item.brandMentioned ? (
                        <span className="ai-pill success">
                          <Check size={11} strokeWidth={3} />
                          <span>Marka Anıldı</span>
                        </span>
                      ) : (
                        <span className="ai-pill danger">
                          <X size={11} strokeWidth={3} />
                          <span>Anılmadı</span>
                        </span>
                      )}

                      {item.domainCited ? (
                        <span className="ai-pill success">
                          <Globe size={11} />
                          <span>Siteniz Alıntılandı</span>
                        </span>
                      ) : item.citationsCount > 0 ? (
                        <span className="ai-pill neutral">
                          <Globe size={11} />
                          <span>{item.citationsCount} Dış Alıntı</span>
                        </span>
                      ) : (
                        <span className="ai-pill neutral">
                          <span>Alıntı Yok</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleQuery(item.promptId || idx)}
                        className="ai-report-preview-toggle"
                      >
                        <span>{isExpanded ? 'Gizle' : 'Yanıtı Gör'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <div className="ai-result-text-box">
                        <span className="ai-box-sub">Gemini 3.8 Tarafından Üretilen Yanıt:</span>
                        <p className="ai-response-content">{item.responseText}</p>
                      </div>

                      {item.citations && item.citations.length > 0 && (
                        <div className="ai-citations-box">
                          <span className="ai-box-sub">Alıntılanan Kaynaklar:</span>
                          <div className="citations-list">
                            {item.citations.map((c, cIdx) => (
                              <a key={cIdx} href={c.url} target="_blank" rel="noopener noreferrer" className="citation-pill">
                                <Globe size={12} />
                                <span>{c.domain}</span>
                                <ExternalLink size={10} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Individual Prompt Test Drawer (Single Run Result) */}
      {lastRunResult && !isBatchScanning && (
        <div className="growth-ai-run-result-banner animate-fade">
          <div className="ai-result-header">
            <div className="ai-result-title-row">
              <img src="/AI-logos/gemini-color.svg" alt="Google Gemini" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <h4>Canlı Yapay Zeka Test Sonucu (Google Gemini)</h4>
            </div>
            <button type="button" onClick={() => setLastRunResult(null)} className="ai-result-close" aria-label="Kapat">
              <X size={16} />
            </button>
          </div>

          <div className="ai-result-stats-row">
            <div className="ai-stat-box">
              <span className="ai-stat-label">Marka Anıldı mı?</span>
              <span className={`ai-stat-val ${lastRunResult.brand_mentioned ? 'text-success' : 'text-danger'}`}>
                {lastRunResult.brand_mentioned ? 'EVET, ANILDI' : 'HAYIR'}
              </span>
            </div>
            <div className="ai-stat-box">
              <span className="ai-stat-label">Siteniz Kaynak Gösterildi mi?</span>
              <span className={`ai-stat-val ${lastRunResult.domain_cited ? 'text-success' : 'text-danger'}`}>
                {lastRunResult.domain_cited ? 'EVET, ALINTILANDI' : 'HAYIR'}
              </span>
            </div>
            <div className="ai-stat-box">
              <span className="ai-stat-label">Test Edilen Motor</span>
              <span className="ai-stat-val text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 16, height: 16 }} />
                <span>{lastRunResult.model || 'gemini-3.8-flash'}</span>
              </span>
            </div>
          </div>

          <div className="ai-result-text-box">
            <span className="ai-box-sub">Yapay Zeka Tarafından Üretilen Yanıt:</span>
            <p className="ai-response-content">{lastRunResult.response_text}</p>
          </div>

          {lastRunResult.citations && lastRunResult.citations.length > 0 && (
            <div className="ai-citations-box">
              <span className="ai-box-sub">Alıntılanan Kaynaklar & Siteler:</span>
              <div className="citations-list">
                {lastRunResult.citations.map((c, cIdx) => (
                  <a key={cIdx} href={c.url} target="_blank" rel="noopener noreferrer" className="citation-pill">
                    <Globe size={12} />
                    <span>{c.domain}</span>
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Tracked Prompt Card */}
      <div className="growth-panel-card growth-add-prompt-card">
        <div className="growth-panel-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 6 }}>
              <span className="growth-badge blue">
                <Plus size={12} /> Prompt Takip Motoru
              </span>
              <span className={`growth-badge ${prompts.length >= 10 ? 'red' : prompts.length >= 8 ? 'yellow' : 'cyan'}`}>
                {prompts.length >= 10 ? <Lock size={12} /> : null} Takip Limiti: {prompts.length} / 10
              </span>
            </div>
            <h3 className="growth-panel-title">Yeni Arama Sorusu (Prompt) Takip Et</h3>
            <p className="growth-panel-desc">
              Müşterilerinizin Gemini, ChatGPT ve Perplexity'ye sorduğu kritik sektörel soruları ekleyin, markanızın görünürlüğünü takip edin. (Maksimum 10 soru)
            </p>
          </div>
        </div>

        {prompts.length >= 10 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#f87171',
            fontSize: '0.85rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>
              <strong>Limit Doldu:</strong> Çalışma alanınızda en fazla 10 adet prompt takip edebilirsiniz ({prompts.length}/10). Yeni bir prompt eklemek için lütfen aşağıdaki listeden gereksiz olanları silin.
            </span>
          </div>
        )}

        <form onSubmit={handleAddPrompt} className="growth-prompt-form-grid" style={prompts.length >= 10 ? { opacity: 0.7 } : {}}>
          <div className="growth-prompt-inputs-split">
            <div className="growth-field-item flex-3">
              <label className="growth-field-label">
                <MessageSquare size={13} color="#3b82f6" />
                <span>Hedef Arama Sorusu / Prompt</span>
              </label>
              <input
                type="text"
                placeholder={prompts.length >= 10 ? "Limit doldu (10/10) - Yeni prompt eklemek için mevcutları silin" : "Örn: En iyi B2B SEO ve büyüme platformu hangisi?"}
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                className="growth-custom-text-input"
                disabled={addingPrompt || prompts.length >= 10}
                required
              />
            </div>

            <div className="growth-field-item flex-1">
              <label className="growth-field-label">
                <Sparkles size={13} color="#8b5cf6" />
                <span>Kategori / Konu</span>
              </label>
              <input
                type="text"
                placeholder="Örn: SEO & Büyüme"
                value={newPromptTopic}
                onChange={(e) => setNewPromptTopic(e.target.value)}
                className="growth-custom-text-input"
                disabled={addingPrompt || prompts.length >= 10}
              />
            </div>
          </div>

          <div className="growth-prompt-targeting-split">
            <div className="growth-dropdown-col">
              <AiVisibilityDropdown
                id="growth-prompt-country"
                label="Hedef Pazar / Ülke"
                icon={<Globe size={13} color="#3b82f6" />}
                options={MARKET_OPTIONS}
                value={selectedCountry}
                onChange={setSelectedCountry}
                disabled={addingPrompt || prompts.length >= 10}
              />
            </div>

            <div className="growth-dropdown-col">
              <AiVisibilityDropdown
                id="growth-prompt-language"
                label="Sorgu Dili"
                icon={<Languages size={13} color="#8b5cf6" />}
                options={LANGUAGE_OPTIONS}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                disabled={addingPrompt || prompts.length >= 10}
              />
            </div>

            <div className="growth-submit-col">
              <button
                type="submit"
                disabled={addingPrompt || !newPromptText.trim() || prompts.length >= 10}
                className="growth-primary-btn growth-prompt-submit-btn"
                style={prompts.length >= 10 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                {addingPrompt ? (
                  <Loader2 size={15} className="spin" />
                ) : prompts.length >= 10 ? (
                  <Lock size={15} />
                ) : (
                  <Plus size={15} />
                )}
                <span>{prompts.length >= 10 ? 'Limit Doldu (10/10)' : 'Prompt Takip Et'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tracked Prompts List */}
      <div className="growth-panel-card">
        <div className="growth-panel-header">
          <div>
            <h3 className="growth-panel-title">Takip Edilen Promptlar ({prompts.length} / 10)</h3>
            <p className="growth-panel-desc">
              Düzenli aralıklarla test edilen arama sorguları. Tümünü sırayla tarayarak zaman damgalı tek bir snapshot raporu oluşturabilirsiniz.
            </p>
          </div>

          <div className="growth-panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {reportsList.length > 0 && (
              <div className="ai-report-history-select-wrap">
                <History size={13} color="#a1a1aa" />
                <select
                  className="ai-report-history-select"
                  value={activeReport?.id || ''}
                  onChange={(e) => handleLoadReport(e.target.value)}
                  disabled={isBatchScanning}
                  title="Geçmiş Kayıtlı AI Raporlarını İncele"
                >
                  {reportsList.map(r => (
                    <option key={r.id} value={r.id}>
                      {formatFullDate(r.created_at)} — %{r.visibility_score} GEO ({r.total_prompts} Prompt)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              disabled={isBatchScanning || prompts.length === 0}
              onClick={handleStartBatchScan}
              className="growth-primary-btn"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
              title="Tüm promptları sırayla test eder ve zaman damgalı tek bir rapor oluşturup kaydeder"
            >
              {isBatchScanning ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Taranıyor ({batchProgress.current}/{batchProgress.total})...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Tümünü Sırayla Tara (1 Rapor Oluştur)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="growth-skeleton-opp-card">
                <div className="skeleton-opp-info">
                  <SkeletonBlock width="70%" height="16px" borderRadius="4px" />
                  <SkeletonBlock width="35%" height="13px" borderRadius="4px" style={{ marginTop: 6 }} />
                </div>
                <SkeletonBlock width="110px" height="34px" borderRadius="8px" />
              </div>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="growth-empty-card">
            <MessageSquare size={32} className="text-muted" />
            <h4>Henüz Takip Edilen Prompt Yok</h4>
            <p>Yukarıdaki formu kullanarak ilk arama sorunuzu ekleyin.</p>
          </div>
        ) : (
          <div className="growth-prompts-table">
            {prompts.map((p) => {
              const isRunning = runningPromptId === p.id;
              const marketOpt = getMarketOption(p.country || 'TR');
              const langOpt = getLanguageOption(p.language || 'tr');

              return (
                <div key={p.id} className="prompt-table-row">
                  <div className="prompt-info-col">
                    <span className="prompt-text">"{p.prompt}"</span>
                    <div className="prompt-meta-row">
                      <span className="prompt-topic-tag">{p.topic || 'Genel'}</span>
                      <span className="prompt-meta-badge" title={`Hedef Ülke: ${marketOpt.label}`}>
                        {marketOpt.icon}
                        <span>{marketOpt.code || p.country || 'TR'}</span>
                      </span>
                      <span className="prompt-meta-badge lang" title={`Sorgu Dili: ${langOpt.label}`}>
                        <Languages size={12} color="#8b5cf6" />
                        <span>{langOpt.code || (p.language || 'TR').toUpperCase()}</span>
                      </span>
                      <span className="prompt-runs-tag">{p.run_count || 0} Test Yapıldı</span>
                      {p.last_brand_mentioned !== null && p.last_brand_mentioned !== undefined && (
                        <span className={`prompt-mention-status-tag ${p.last_brand_mentioned ? 'mentioned' : 'not-mentioned'}`}>
                          {p.last_brand_mentioned ? '✓ Marka Önerildi' : '✕ Listede Yok'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="prompt-actions-col">
                    <button
                      type="button"
                      disabled={isRunning || isBatchScanning}
                      onClick={() => handleRunPrompt(p.id)}
                      className="growth-run-test-btn"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 size={14} className="auth-spinner" />
                          <span>Gemini Sorguluyor...</span>
                        </>
                      ) : (
                        <>
                          <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 14, height: 14 }} />
                          <span>Gemini ile Test Et</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Historical AI Reports Timeline & Archive (Zamana Göre Kayıtlı Raporlar - En Altta) */}
      {reportsList.length > 0 && !isBatchScanning && (
        <div id="ai-reports-history-section" className="growth-panel-card ai-reports-history-panel animate-fade">
          <div className="growth-panel-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                <span className="growth-badge purple">
                  <History size={12} /> Zaman Çizelgesi &amp; Rapor Arşivi
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Toplam {reportsList.length} Zaman Damgalı Tarama Kaydı
                </span>
              </div>
              <h3 className="growth-panel-title">Zamana Göre Kayıtlı AI Görünürlük Raporları</h3>
              <p className="growth-panel-desc">
                Tüm promptlarınızın her taranması zaman damgalı tek bir rapor (snapshot) olarak kaydedilir. Herhangi bir rapora tıklayarak o tarihteki AI görünürlük durumunu inceleyebilirsiniz.
              </p>
            </div>
          </div>

          <div className="ai-reports-history-grid">
            {reportsList.map((rep) => {
              const isSelected = activeReport?.id === rep.id;
              const repScore = Number(rep.visibility_score) || 0;
              const scoreClass = repScore >= 70 ? '' : repScore >= 40 ? 'warning' : 'danger';

              return (
                <div
                  key={rep.id}
                  onClick={() => {
                    handleLoadReport(rep.id);
                    reportPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`ai-history-report-card ${isSelected ? 'active' : ''}`}
                  title="Bu tarihteki rapor detaylarını incele"
                >
                  <div className="ai-history-card-top">
                    <div className="ai-history-date-box">
                      <span className="ai-history-date-full">
                        <Calendar size={13} color="#3b82f6" />
                        <span>{formatFullDate(rep.created_at)}</span>
                      </span>
                      <span className="ai-history-date-rel">
                        <Clock size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'text-bottom' }} />
                        {formatRelativeTime(rep.created_at)}
                      </span>
                    </div>

                    <div className={`ai-history-score-badge ${scoreClass}`}>
                      <span>%{repScore} GEO</span>
                    </div>
                  </div>

                  <div className="ai-history-stats-row">
                    <div className="ai-history-stat-item">
                      <span className="ai-history-stat-label">Taranan</span>
                      <span className="ai-history-stat-val">{rep.total_prompts} Prompt</span>
                    </div>
                    <div className="ai-history-stat-item">
                      <span className="ai-history-stat-label">Marka</span>
                      <span className="ai-history-stat-val" style={{ color: rep.mentioned_count > 0 ? '#34d399' : '#f87171' }}>
                        {rep.mentioned_count} Anıldı
                      </span>
                    </div>
                    <div className="ai-history-stat-item">
                      <span className="ai-history-stat-label">Alıntı</span>
                      <span className="ai-history-stat-val" style={{ color: rep.cited_count > 0 ? '#34d399' : '#94a3b8' }}>
                        {rep.cited_count} Site
                      </span>
                    </div>
                  </div>

                  <div className="ai-history-card-footer">
                    <button
                      type="button"
                      className="ai-history-view-btn"
                    >
                      <span>{isSelected ? '✓ Şu An İnceleniyor' : 'Raporu İncele'}</span>
                      <ArrowUpRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteReport(rep.id, e)}
                      className="ai-history-delete-btn"
                      title="Bu raporu arşivden sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
