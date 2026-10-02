import React, { useState, useEffect } from 'react';
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
  X
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
    fetchGeoReadiness(false);
  }, [activeWorkspace?.id, activeWorkspace?.primary_domain, token]);

  const handleAddPrompt = async (e) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

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
      if (res.ok) {
        setNewPromptText('');
        setNewPromptTopic('');
        fetchPrompts();
      }
    } catch (err) {
      console.error('Add prompt error:', err);
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

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Cover Banner */}
      <GrowthPageCover
        badge="Generative Engine Optimization (GEO)"
        badgeIcon={Bot}
        title="Yapay Zeka (GEO) Görünürlüğü & Alıntı Takibi"
        subtitle="Google Gemini, ChatGPT Search ve Perplexity gibi yapay zeka arama motorlarında markanızın anılma ve kaynak gösterilme oranı."
        coverImage="/growth-covers/geo-cover.jpg"
        stats={[
          { 
            label: 'GEO Hazırbulunuşluk', 
            value: geoReadiness ? `${geoReadiness.geoScore}/100` : loadingGeoReadiness ? 'Taranıyor...' : 'Belirlenmedi', 
            positive: (geoReadiness?.geoScore || 0) >= 70, 
            sub: geoReadiness ? 'Canlı Standartlar' : 'Analiz Ediliyor' 
          },
          { label: 'AI Motorları', value: '4 Büyük Model', sub: 'Gemini, GPT, Perplexity, Claude' }
        ]}
        actions={<AiEngineGroup size={22} />}
      />

      {/* AI Engines Active Matrix */}
      <div className="growth-panel-card" style={{ padding: '0.9rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Desteklenen ve Taranan Yapay Zeka Motorları:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <AiEngineBadge engine="gemini" size={17} pill />
            <AiEngineBadge engine="chatgpt" size={17} pill />
            <AiEngineBadge engine="perplexity" size={17} pill />
            <AiEngineBadge engine="claude" size={17} pill />
            <AiEngineBadge engine="grok" size={15} pill />
          </div>
        </div>
      </div>

      {/* GEO Readiness Indicators Card */}
      <div className="growth-panel-card geo-readiness-panel">
        <div className="growth-panel-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 className="growth-panel-title">Yapay Zeka Arama Hazırbulunuşluk Standartları</h3>
              {geoReadiness?.auditedAt && (
                <span className="geo-audit-time-pill" title={new Date(geoReadiness.auditedAt).toLocaleString('tr-TR')}>
                  <Clock size={12} />
                  <span>Son Test: {formatRelativeTime(geoReadiness.auditedAt)}</span>
                </span>
              )}
            </div>
            <p className="growth-panel-desc">
              AI crawler botlarının sitenizi anlamlandırması ve güvenilir bir kaynak olarak alıntılaması için gereken temel yapılar.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="growth-secondary-btn geo-rescan-btn"
              onClick={() => fetchGeoReadiness(true)}
              disabled={scanningGeoReadiness || loadingGeoReadiness || !activeWorkspace?.primary_domain}
              title="Canlı robots.txt, /llms.txt ve Schema.org testini tekrar çalıştır"
            >
              <RefreshCw size={13} className={scanningGeoReadiness ? 'spin' : ''} />
              <span>{scanningGeoReadiness ? 'Canlı Taranıyor...' : 'Canlı Test Et'}</span>
            </button>

            {loadingGeoReadiness && !geoReadiness ? (
              <span className="growth-score-badge loading">Hesaplanıyor...</span>
            ) : geoReadiness ? (
              <span className={`growth-score-badge ${geoReadiness.geoScore >= 80 ? 'good' : geoReadiness.geoScore >= 50 ? 'warning' : 'danger'}`}>
                GEO Skoru: {geoReadiness.geoScore}/100
              </span>
            ) : (
              <span className="growth-score-badge warning">Test Bekleniyor</span>
            )}
          </div>
        </div>

        {!activeWorkspace?.primary_domain ? (
          <div className="geo-no-domain-alert">
            <AlertCircle size={18} className="text-warning" />
            <div>
              <strong>Birincil Alan Adı Tanımlanmamış</strong>
              <p>Yapay zeka hazırbulunuşluk analizi için lütfen Ayarlar'dan web sitenizin alan adını ekleyin.</p>
            </div>
          </div>
        ) : loadingGeoReadiness && !geoReadiness ? (
          <div className="growth-geo-standards-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="geo-standard-item loading" style={{ opacity: 0.7 }}>
                <SkeletonBlock width="20px" height="20px" borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <SkeletonBlock width="55%" height="16px" borderRadius="4px" />
                  <SkeletonBlock width="85%" height="13px" borderRadius="4px" style={{ marginTop: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : geoReadiness ? (
          <div className="growth-geo-standards-grid">
            {/* 1. Robots.txt AI Bot Permissions */}
            <div className={`geo-standard-item ${geoReadiness.robots?.allAllowed ? 'is-verified' : geoReadiness.robots?.anyBlocked ? 'is-blocked' : 'is-warning'}`}>
              {geoReadiness.robots?.allAllowed ? (
                <CheckCircle2 size={20} className="text-success" />
              ) : (
                <AlertCircle size={20} className="text-warning" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <span className="standard-name">Robots.txt AI Bot İzinleri</span>
                  <span className={`geo-status-tag ${geoReadiness.robots?.allAllowed ? 'success' : geoReadiness.robots?.anyBlocked ? 'danger' : 'warning'}`}>
                    {geoReadiness.robots?.allAllowed ? 'Tüm AI Botlarına Açık' : geoReadiness.robots?.anyBlocked ? 'Bazı Botlar Engelli' : 'Kısmi İzin'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="standard-sub">Taranan Botlar:</span>
                  {(geoReadiness.robots?.crawlers || []).map((bot) => (
                    <span
                      key={bot.id}
                      className={`geo-bot-chip ${bot.allowed ? 'allowed' : 'blocked'}`}
                      title={`${bot.name} (${bot.company}): ${bot.allowed ? 'İzinli (' + (bot.ruleText || 'Erişilebilir') + ')' : 'Engelli'}`}
                    >
                      {bot.logo && (
                        <img src={bot.logo} alt={bot.name} style={{ width: 12, height: 12, objectFit: 'contain' }} />
                      )}
                      <span>{bot.name}</span>
                      {bot.allowed ? (
                        <Check size={11} className="text-success" />
                      ) : (
                        <X size={11} className="text-danger" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. /llms.txt Standard */}
            <div className={`geo-standard-item ${geoReadiness.llmsTxt?.found ? 'is-verified' : 'is-missing'}`}>
              {geoReadiness.llmsTxt?.found ? (
                <CheckCircle2 size={20} className="text-success" />
              ) : (
                <AlertCircle size={20} className="text-warning" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <span className="standard-name">/llms.txt Standardı</span>
                  {geoReadiness.llmsTxt?.found ? (
                    <span className="geo-status-tag success">Doğrulandı ({geoReadiness.llmsTxt.sizeBytes ? `${Math.round(geoReadiness.llmsTxt.sizeBytes / 1024 * 10) / 10} KB` : 'Aktif'})</span>
                  ) : (
                    <span className="geo-status-tag warning">Bulunamadı (404)</span>
                  )}
                </div>
                <span className="standard-sub" style={{ marginTop: 4, display: 'block' }}>
                  {geoReadiness.llmsTxt?.found ? (
                    <>
                      Yapay zeka modelleri için yapılandırılmış özet dosyası aktif.{' '}
                      <a href={geoReadiness.llmsTxt.url} target="_blank" rel="noopener noreferrer" className="geo-inline-link">
                        Dosyayı Görüntüle <ExternalLink size={10} />
                      </a>
                    </>
                  ) : (
                    <>
                      Yapay zeka modellerinin markanızı doğru anlaması için kök dizinde <code>/llms.txt</code> dosyası bulunamadı.{' '}
                      <a href="#/tool/llms-txt-tools" className="geo-inline-link">
                        llms.txt Oluşturucu ile Hazırla <ArrowUpRight size={10} />
                      </a>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* 3. Organization & Entity Schema */}
            <div className={`geo-standard-item ${geoReadiness.schema?.hasOrganization ? 'is-verified' : 'is-missing'}`}>
              {geoReadiness.schema?.hasOrganization ? (
                <CheckCircle2 size={20} className="text-success" />
              ) : (
                <AlertCircle size={20} className="text-warning" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <span className="standard-name">Organization Şeması</span>
                  <span className={`geo-status-tag ${geoReadiness.schema?.hasOrganization ? 'success' : 'warning'}`}>
                    {geoReadiness.schema?.hasOrganization ? 'Varlık Tanımlı' : 'Şema Eksik'}
                  </span>
                </div>
                <span className="standard-sub" style={{ marginTop: 4, display: 'block' }}>
                  {geoReadiness.schema?.hasOrganization ? (
                    <>
                      Varlık (Entity) tanımlaması ve Knowledge Graph desteği doğrulandı.{' '}
                      {geoReadiness.schema.types?.length > 0 && (
                        <span style={{ opacity: 0.8 }}>(Türler: {geoReadiness.schema.types.join(', ')})</span>
                      )}
                    </>
                  ) : (
                    'Sitede Organization JSON-LD şeması bulunamadı. Yapay zeka motorlarının markanızı bir varlık olarak tanıması için JSON-LD şeması ekleyin.'
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Add New Tracked Prompt */}
      <div className="growth-panel-card">
        <h3 className="growth-panel-title">Yeni Arama Sorusu (Prompt) Takip Et</h3>
        <p className="growth-panel-desc">
          Müşterilerinizin sektörünüz ve markanız hakkında yapay zekaya sorabileceği kritik soruları hedef pazar ve dilde takip edin.
        </p>

        <form onSubmit={handleAddPrompt} className="growth-prompt-add-form">
          <div className="prompt-input-row">
            <input
              type="text"
              required
              className="growth-field-input flex-2"
              placeholder="Örnek: En iyi B2B pazarlama araçları hangileri?"
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
            />
            <input
              type="text"
              className="growth-field-input flex-1"
              placeholder="Kategori (örn. Rakip Karşılaştırma)"
              value={newPromptTopic}
              onChange={(e) => setNewPromptTopic(e.target.value)}
            />
          </div>

          <div className="growth-prompt-targeting-row">
            <div className="prompt-targeting-item">
              <AiVisibilityDropdown
                id="growth-prompt-country"
                label="Hedef Pazar / Ülke"
                icon={<Globe size={13} color="#3b82f6" />}
                options={MARKET_OPTIONS}
                value={selectedCountry}
                onChange={setSelectedCountry}
                disabled={addingPrompt}
              />
            </div>
            <div className="prompt-targeting-item">
              <AiVisibilityDropdown
                id="growth-prompt-language"
                label="Sorgu Dili"
                icon={<Languages size={13} color="#8b5cf6" />}
                options={LANGUAGE_OPTIONS}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                disabled={addingPrompt}
              />
            </div>
            <div className="prompt-submit-action">
              <button type="submit" disabled={addingPrompt || !newPromptText.trim()} className="growth-primary-btn prompt-add-submit-btn">
                {addingPrompt ? <Loader2 size={15} className="auth-spinner" /> : <Plus size={15} />}
                <span>Prompt Takip Et</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Live AI Visibility Simulation Modal / Result Drawer */}
      {lastRunResult && (
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
              <span className="ai-stat-label">Test Edilen Motor</span>
              <span className="ai-stat-val text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 16, height: 16 }} />
                <span>{lastRunResult.model || 'gemini-2.5-flash'}</span>
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

      {/* Tracked Prompts List */}
      <div className="growth-panel-card">
        <div className="growth-panel-header">
          <div>
            <h3 className="growth-panel-title">Takip Edilen Promptlar ({prompts.length})</h3>
            <p className="growth-panel-desc">
              Düzenli aralıklarla test edilen arama sorguları ve en son anılma durumu.
            </p>
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
                      disabled={isRunning}
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
    </div>
  );
}
