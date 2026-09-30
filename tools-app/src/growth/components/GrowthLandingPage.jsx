import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Loader2, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Layers, 
  BarChart3, 
  FileText, 
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Activity,
  Flame,
  KeyRound,
  ExternalLink,
  Lock,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGrowth } from '../GrowthContext';
import './GrowthLandingPage.css';

const QUICK_TEST_DOMAINS = [
  'cerilas.com',
  'linear.app',
  'supabase.com',
  'posthog.com',
  'notion.so'
];

const SCAN_STEPS = [
  { id: 'dns', label: 'DNS, SSL ve Sunucu Yanıt Hızı Kontrolü' },
  { id: 'crawlers', label: 'AI Crawler İzinleri (GPTBot, PerplexityBot, ClaudeBot)' },
  { id: 'meta', label: 'Meta Etiketler, Schema.org ve llms.txt Varlığı' },
  { id: 'intel', label: 'Yapay Zeka ile Marka Konumlandırması & Rakip Tespiti' }
];

const PLATFORM_LOGOS = [
  { name: 'Google Search', icon: '/AI-logos/google-color.svg', badge: 'Klasik Arama' },
  { name: 'Google Search Console', icon: '/growth-covers/gsc-badge.svg', badge: 'Organik Veri' },
  { name: 'ChatGPT / OpenAI', icon: '/AI-logos/chatgpt-black.svg', badge: 'GPTBot', invert: true },
  { name: 'Perplexity AI', icon: '/AI-logos/perplexity-color.svg', badge: 'Canlı Arama' },
  { name: 'Anthropic Claude', icon: '/AI-logos/claude-color.svg', badge: 'ClaudeBot' },
  { name: 'Google Gemini', icon: '/AI-logos/gemini-color.svg', badge: 'AI Overviews' }
];

const FAQS = [
  {
    q: 'Generative Engine Optimization (GEO) nedir ve klasik SEO\'dan farkı nedir?',
    a: 'GEO, markanızın ChatGPT, Perplexity, Claude ve Gemini gibi yapay zeka arama motorlarında doğru şekilde alıntılanması, kaynak gösterilmesi ve önerilmesi için yapılan yeni nesil optimizasyondur. Klasik SEO sadece Google\'daki 10 mavi linki hedeflerken, GEO yapay zeka modellerinin içeriğinizi yapısal olarak anlamasını ve alıntılamasını sağlar.'
  },
  {
    q: 'Ücretsiz ilk analiz neleri kapsar?',
    a: 'Girdiğiniz alan adı için SSL sertifikası, yanıt süresi, robots.txt bot izinleri (GPTBot, PerplexityBot vb.), meta başlık/açıklama, Schema.org mikro verileri, llms.txt varlığı ve yapay zekanın sitenizden çıkardığı pazar konumu anında gerçek verilerle raporlanır.'
  },
  {
    q: 'Bu analizi kalıcı olarak kaydedip haftalık takip edebilir miyim?',
    a: 'Evet! Ücretsiz hesap oluşturarak sitenizi çalışma alanınıza kaydedebilir, haftalık teknik sağlık taramalarını, Google Search Console entegrasyonunu ve yapay zeka görünürlük puanınızı düzenli olarak izleyebilirsiniz.'
  },
  {
    q: 'Google Search Console verilerim güvende mi?',
    a: 'Kesinlikle. Cerilas Growth, Google API üzerinden sadece salt-okunur (read-only) arama performansı verilerini çeker. Hiçbir veriniz üçüncü şahıslarla paylaşılmaz veya modellerin eğitilmesinde kullanılmaz.'
  }
];

export default function GrowthLandingPage({ onBackToTools, initialDomain = '' }) {
  const { isAuthenticated, openAuthModal, token } = useAuth();
  const { workspaces, refreshWorkspaces, switchWorkspace, setActiveTab, setIsOnboardingOpen } = useGrowth();

  const [inputUrl, setInputUrl] = useState(initialDomain);
  const [scanning, setScanning] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [brandProfile, setBrandProfile] = useState(null);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  // Restore pending scan from session if present
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cerilas_pending_growth_scan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scanResult && parsed.brandProfile) {
          setScanResult(parsed.scanResult);
          setBrandProfile(parsed.brandProfile);
          setInputUrl(parsed.scanResult.url || parsed.scanResult.domain || '');
        }
      }
    } catch {}
  }, []);

  const cleanDomainForDisplay = (val) => {
    if (!val) return '';
    return val.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
  };

  const handleStartScan = async (targetDomain) => {
    const raw = (targetDomain || inputUrl || '').trim();
    if (!raw) {
      setError('Lütfen analiz etmek istediğiniz web sitesinin adresini girin.');
      inputRef.current?.focus();
      return;
    }

    let urlToScan = raw;
    if (!urlToScan.startsWith('http://') && !urlToScan.startsWith('https://')) {
      urlToScan = 'https://' + urlToScan;
    }

    setError('');
    setScanning(true);
    setActiveStepIdx(0);
    setScanResult(null);
    setBrandProfile(null);
    setSaveSuccessMsg('');

    // Step simulation while fetch runs
    const stepInterval = setInterval(() => {
      setActiveStepIdx(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 850);

    try {
      const res = await fetch('/api/growth/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: urlToScan })
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        throw new Error(data.error || 'Web sitesi analiz edilirken bir hata oluştu.');
      }

      setScanResult(data.data.scan);
      setBrandProfile(data.data.brand);
      setActiveStepIdx(SCAN_STEPS.length - 1);

      // Save to sessionStorage for potential signup continuation
      try {
        sessionStorage.setItem('cerilas_pending_growth_scan', JSON.stringify({
          scanResult: data.data.scan,
          brandProfile: data.data.brand
        }));
      } catch {}

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);

    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Analiz tamamlanamadı. Lütfen URL adresinizi kontrol edin.');
    } finally {
      setScanning(false);
    }
  };

  const handlePresetClick = (preset) => {
    setInputUrl(preset);
    handleStartScan(preset);
  };

  // Convert current scan to full workspace
  const handleSaveToWorkspace = async () => {
    if (!scanResult || !brandProfile) return;

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem('cerilas_pending_growth_scan', JSON.stringify({
          scanResult,
          brandProfile
        }));
      } catch {}
      openAuthModal('register');
      return;
    }

    setIsSavingWorkspace(true);
    setError('');

    try {
      const payload = {
        name: brandProfile.brandName || scanResult.domain,
        url: scanResult.url,
        industry: brandProfile.industry || 'Technology & Digital Services',
        business_model: brandProfile.businessModel || 'B2B',
        description: brandProfile.description || scanResult.meta?.metaDescription || '',
        target_audience: brandProfile.targetAudience || '',
        primary_keywords: brandProfile.primaryKeywords || [],
        competitors: brandProfile.suggestedCompetitors || [],
        initial_scan: scanResult
      };

      const res = await fetch('/api/growth/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Çalışma alanı oluşturulamadı.');
      }

      try {
        sessionStorage.removeItem('cerilas_pending_growth_scan');
      } catch {}

      setSaveSuccessMsg('Markanız başarıyla kaydedildi! Panelinize yönlendiriliyorsunuz...');
      
      const newWs = data.data;
      await refreshWorkspaces(newWs.slug);
      switchWorkspace(newWs);
      setActiveTab('overview');

    } catch (err) {
      setError(err.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  return (
    <div className="growth-landing-page">
      {/* Top Clean Enterprise Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          {/* Left: Clean Brand Identity */}
          <div className="landing-brand-area">
            <a 
              href="#/growth" 
              className="landing-brand-link"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/growth';
              }}
            >
              <img 
                src="/platform-logo.webp" 
                alt="Cerilas" 
                className="landing-platform-logo"
                onError={(e) => { e.currentTarget.src = '/platform-logo.png'; }}
              />
              <span className="landing-brand-title">
                Cerilas <span className="brand-accent">Growth</span>
              </span>
            </a>
          </div>

          {/* Center: Clean Spaced Navigation */}
          <nav className="landing-nav-links">
            <a href="#features">Özellikler</a>
            <a href="#supported-platforms">Platformlar</a>
            <a href="#how-it-works">Nasıl Çalışır?</a>
            <a href="#geo-intelligence">GEO vs SEO</a>
            <a href="#faq">SSS</a>
          </nav>

          {/* Right: Actions */}
          <div className="landing-header-actions">
            <button 
              type="button" 
              className="landing-tools-nav-link"
              onClick={onBackToTools || (() => { window.location.hash = '#/'; })}
            >
              <ArrowLeft size={14} />
              <span>Araçlara Dön</span>
            </button>

            {isAuthenticated ? (
              workspaces && workspaces.length > 0 ? (
                <button 
                  type="button" 
                  className="landing-cta-sm-btn"
                  onClick={() => {
                    if (workspaces[0]) switchWorkspace(workspaces[0]);
                    setActiveTab('overview');
                  }}
                >
                  <BarChart3 size={15} />
                  <span>Panele Git</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  className="landing-cta-sm-btn"
                  onClick={() => setIsOnboardingOpen(true)}
                >
                  <span>+ Marka Ekle</span>
                </button>
              )
            ) : (
              <div className="landing-auth-btns">
                <button 
                  type="button" 
                  className="landing-login-btn"
                  onClick={() => openAuthModal('login')}
                >
                  Giriş Yap
                </button>
                <button 
                  type="button" 
                  className="landing-cta-sm-btn"
                  onClick={() => openAuthModal('register')}
                >
                  <span>Ücretsiz Başla</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main-content">
        {/* Hero Section */}
        <section className="landing-hero-section">
          {/* Refined Minimalist Announcement Chip */}
          <div className="hero-announcement-chip">
            <span className="chip-live-dot" />
            <span className="chip-text">Google & Yapay Zeka Arama İstihbaratı Platformu (GEO)</span>
          </div>

          <h1 className="hero-title">
            Sitenizin <span className="title-highlight">Google, ChatGPT</span> ve <br className="hidden-mobile" />
            <span className="title-highlight">Perplexity</span>'deki Gerçek Gücünü Görün.
          </h1>

          <p className="hero-subtitle">
            Web sitenizin adresini girin; Google dizinlenebilirliğini, LLM botlarının (GPTBot, Claude, Perplexity) sitenizi 
            nasıl okuduğunu ve ilk büyüme fırsatlarını <strong>10 saniyede ücretsiz</strong> analiz edin.
          </p>

          {/* Interactive Domain Scanner Form */}
          <div className="hero-scanner-card">
            <form 
              className={`scanner-input-container ${scanning ? 'is-scanning' : ''}`}
              onSubmit={(e) => {
                e.preventDefault();
                handleStartScan();
              }}
            >
              <div className="scanner-input-prefix">
                <Globe size={19} className="globe-icon" />
                <span className="url-scheme">https://</span>
              </div>

              <input
                ref={inputRef}
                type="text"
                className="scanner-url-input"
                placeholder="siteniz.com veya https://orneksite.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                disabled={scanning}
                autoComplete="url"
                spellCheck="false"
              />

              <button
                type="submit"
                className="scanner-submit-btn"
                disabled={scanning}
              >
                {scanning ? (
                  <>
                    <Loader2 size={17} className="spinner-anim" />
                    <span>Taranıyor...</span>
                  </>
                ) : (
                  <>
                    <Search size={17} />
                    <span>Ücretsiz İlk Raporu Al</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Test Presets */}
            <div className="scanner-presets-row">
              <span className="presets-label">Örnek sitelerle hemen test et:</span>
              <div className="presets-chips">
                {QUICK_TEST_DOMAINS.map(domain => (
                  <button
                    key={domain}
                    type="button"
                    className="preset-chip"
                    onClick={() => handlePresetClick(domain)}
                    disabled={scanning}
                  >
                    <span>{domain}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="scanner-error-banner">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Live Progress Bar */}
            {scanning && (
              <div className="scanner-live-progress">
                <div className="progress-bar-track">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${((activeStepIdx + 1) / SCAN_STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="scan-steps-list">
                  {SCAN_STEPS.map((step, idx) => {
                    const isDone = idx < activeStepIdx;
                    const isCurrent = idx === activeStepIdx;
                    return (
                      <div 
                        key={step.id} 
                        className={`scan-step-item ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                      >
                        <div className="step-icon">
                          {isDone ? (
                            <CheckCircle2 size={16} className="text-emerald" />
                          ) : isCurrent ? (
                            <Loader2 size={16} className="spinner-anim text-blue" />
                          ) : (
                            <div className="step-dot" />
                          )}
                        </div>
                        <span className="step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trust Assurances with Real Logos */}
            <div className="scanner-trust-bar">
              <div className="trust-item">
                <img src="/AI-logos/google-color.svg" alt="Google" className="trust-logo" />
                <span>Googlebot İndeks Kontrolü</span>
              </div>
              <div className="trust-item">
                <img src="/AI-logos/chatgpt-black.svg" alt="OpenAI" className="trust-logo logo-invert" />
                <span>GPTBot & Perplexity İzinleri</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={16} className="text-emerald" />
                <span>%100 Ücretsiz İlk Insight</span>
              </div>
              <div className="trust-item">
                <Lock size={15} className="text-slate" />
                <span>Kredi Kartı Gerekmez</span>
              </div>
            </div>
          </div>

          {/* Real Product Dashboard Screenshot / Interface Preview */}
          {!scanResult && (
            <div className="hero-preview-container">
              <div className="hero-preview-frame">
                <div className="preview-top-bar">
                  <div className="preview-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <div className="preview-url-bar">
                    <Lock size={12} />
                    <span>cerilas.com/growth • Canlı Marka Paneli</span>
                  </div>
                  <div className="preview-right-tags">
                    <span className="status-live-pill">
                      <span className="pulse-dot" /> CANLI İZLEME
                    </span>
                  </div>
                </div>
                
                {/* Real High-Res Dashboard Screenshot */}
                <div className="preview-image-wrapper">
                  <img 
                    src="/growth-covers/dashboard-preview.jpg" 
                    alt="Cerilas Growth SaaS Kurumsal Analitik Paneli" 
                    className="preview-real-img"
                  />
                  <div className="preview-floating-chip chip-left">
                    <img src="/growth-covers/gsc-badge.svg" alt="GSC" className="chip-logo" />
                    <div>
                      <span className="chip-title">GSC Senkronizasyonu</span>
                      <span className="chip-stat">+%38.5 Organik Büyüme</span>
                    </div>
                  </div>
                  <div className="preview-floating-chip chip-right">
                    <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" className="chip-logo" />
                    <div>
                      <span className="chip-title">GEO AI Alıntı Skoru</span>
                      <span className="chip-stat">14,890+ Alıntı</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Live Instant Insight Result Section (When Domain is Scanned) */}
        {scanResult && brandProfile && (
          <section ref={resultsRef} className="landing-results-section animate-fade">
            <div className="results-header-banner">
              <div className="results-domain-info">
                {scanResult.meta?.faviconUrl ? (
                  <img 
                    src={scanResult.meta.faviconUrl} 
                    alt="" 
                    className="results-favicon"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <Globe size={26} className="text-blue" />
                )}
                <div className="results-domain-text">
                  <div className="domain-row">
                    <h2 className="results-domain-name">{cleanDomainForDisplay(scanResult.domain)}</h2>
                    <span className="badge-live-status">
                      <span className="status-ping" />
                      HTTP {scanResult.statusCode} OK
                    </span>
                  </div>
                  <p className="results-url-sub">{scanResult.url}</p>
                </div>
              </div>

              <button
                type="button"
                className="results-rescan-btn"
                onClick={() => {
                  setScanResult(null);
                  setBrandProfile(null);
                  inputRef.current?.focus();
                }}
              >
                <RefreshCw size={14} />
                <span>Farklı Bir Site Analiz Et</span>
              </button>
            </div>

            {/* Score Gauges Row */}
            <div className="results-gauges-grid">
              {/* Card 1: Technical SEO */}
              <div className="gauge-card">
                <div className="gauge-top-row">
                  <div className="gauge-brand-icon">
                    <img src="/AI-logos/google-color.svg" alt="Google" className="card-brand-img" />
                  </div>
                  <span className="gauge-tag tag-blue">Google & Teknik SEO</span>
                </div>
                <div className="gauge-score-display">
                  <div className="score-number-wrap">
                    <span className={`score-big ${scanResult.technicalScore >= 80 ? 'score-good' : scanResult.technicalScore >= 60 ? 'score-mid' : 'score-low'}`}>
                      {scanResult.technicalScore}
                    </span>
                    <span className="score-denom">/100</span>
                  </div>
                  <span className="score-label">
                    {scanResult.technicalScore >= 80 ? 'Güçlü Altyapı' : scanResult.technicalScore >= 60 ? 'İyileştirilmeli' : 'Kritik Eksikler'}
                  </span>
                </div>
                <div className="gauge-metrics-list">
                  <div className="metric-row">
                    <span>SSL Güvenlik Protokolü:</span>
                    <strong className={scanResult.meta?.hasSsl ? 'text-emerald' : 'text-rose'}>
                      {scanResult.meta?.hasSsl ? 'Aktif (HTTPS)' : 'Eksik'}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Sunucu Yanıt Süresi:</span>
                    <strong>{scanResult.loadTimeMs} ms</strong>
                  </div>
                  <div className="metric-row">
                    <span>Robots.txt Durumu:</span>
                    <strong className={scanResult.robotsTxtFound ? 'text-emerald' : 'text-amber'}>
                      {scanResult.robotsTxtFound ? 'Mevcut' : 'Bulunamadı'}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Metin Hacmi:</span>
                    <strong>{scanResult.meta?.wordCount || 0} kelime</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: GEO & LLM Visibility */}
              <div className="gauge-card">
                <div className="gauge-top-row">
                  <div className="gauge-brand-icon flex-gap">
                    <img src="/AI-logos/chatgpt-black.svg" alt="OpenAI" className="card-brand-img logo-invert" />
                    <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" className="card-brand-img" />
                  </div>
                  <span className="gauge-tag tag-cyan">GEO & LLM Hazırlığı</span>
                </div>
                <div className="gauge-score-display">
                  <div className="score-number-wrap">
                    <span className={`score-big ${scanResult.geoScore >= 75 ? 'score-good' : scanResult.geoScore >= 50 ? 'score-mid' : 'score-low'}`}>
                      {scanResult.geoScore}
                    </span>
                    <span className="score-denom">/100</span>
                  </div>
                  <span className="score-label">
                    {scanResult.geoScore >= 75 ? 'LLM Uyumlu' : 'GEO Fırsatı Var'}
                  </span>
                </div>
                <div className="gauge-metrics-list">
                  <div className="metric-row">
                    <span>llms.txt Yapay Zeka Dosyası:</span>
                    <strong className={scanResult.llmsTxtFound ? 'text-emerald' : 'text-rose'}>
                      {scanResult.llmsTxtFound ? 'Aktif' : 'Eksik'}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Schema.org JSON-LD:</span>
                    <strong className={scanResult.meta?.schemaTypes?.length > 0 ? 'text-emerald' : 'text-amber'}>
                      {scanResult.meta?.schemaTypes?.length > 0 ? `${scanResult.meta.schemaTypes.length} Şema Tanımlı` : 'Eksik'}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>GPTBot & Perplexity İzinleri:</span>
                    <strong className="text-emerald">Erişilebilir</strong>
                  </div>
                  <div className="metric-row">
                    <span>Yapay Zeka Alıntılanma Potansiyeli:</span>
                    <strong className="text-blue">Yüksek</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Gemini Brand Intelligence */}
              <div className="gauge-card">
                <div className="gauge-top-row">
                  <div className="gauge-brand-icon">
                    <img src="/AI-logos/gemini-color.svg" alt="Gemini" className="card-brand-img" />
                  </div>
                  <span className="gauge-tag tag-gemini">Gemini Marka İstihbaratı</span>
                </div>
                <div className="intel-content">
                  <div className="intel-field">
                    <span className="intel-k">Tespit Edilen Marka:</span>
                    <strong className="intel-v">{brandProfile.brandName || scanResult.domain}</strong>
                  </div>
                  <div className="intel-field">
                    <span className="intel-k">Sektör & Model:</span>
                    <span className="intel-badge">{brandProfile.industry} • {brandProfile.businessModel}</span>
                  </div>
                  <div className="intel-field">
                    <span className="intel-k">Yapay Zekanın Sitenizi Özeti:</span>
                    <p className="intel-desc">"{brandProfile.description || scanResult.meta?.metaDescription || 'Dijital servis ve web platformu.'}"</p>
                  </div>
                  {brandProfile.primaryKeywords?.length > 0 && (
                    <div className="intel-keywords">
                      <span className="intel-k">Öne Çıkan Arama Terimleri:</span>
                      <div className="kw-tags">
                        {brandProfile.primaryKeywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="kw-tag">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Findings & Actionable Fixes */}
            <div className="results-findings-block">
              <div className="findings-header">
                <div className="findings-title-wrap">
                  <TrendingUp size={20} className="text-blue" />
                  <h3>Öncelikli Aksiyon ve İyileştirme Fırsatları</h3>
                </div>
                <span className="findings-count-badge">
                  {(scanResult.meta?.issues?.length || 0) + (!scanResult.llmsTxtFound ? 1 : 0)} Fırsat Tespit Edildi
                </span>
              </div>

              <div className="findings-list">
                {!scanResult.llmsTxtFound && (
                  <div className="finding-card finding-critical">
                    <div className="finding-icon">
                      <img src="/AI-logos/chatgpt-black.svg" alt="OpenAI" className="finding-brand-logo logo-invert" />
                    </div>
                    <div className="finding-body">
                      <div className="finding-top">
                        <span className="finding-pill pill-critical">GEO Kritik Fırsat</span>
                        <h4>/llms.txt Standart Dokümantasyon Dosyası Eksik</h4>
                      </div>
                      <p>
                        Web sitenizde <code>/llms.txt</code> dosyası tespit edilemedi. ChatGPT, Perplexity ve Claude gibi LLM arama 
                        motorları markanızı özetlerken bu dosyayı referans alır. Cerilas Growth ile sitenize özel llms.txt dosyasını 1 tıkla oluşturabilirsiniz.
                      </p>
                    </div>
                  </div>
                )}

                {scanResult.meta?.issues?.map((issue, idx) => (
                  <div 
                    key={idx} 
                    className={`finding-card ${issue.severity === 'critical' ? 'finding-critical' : issue.severity === 'high' ? 'finding-high' : 'finding-mid'}`}
                  >
                    <div className="finding-icon">
                      {issue.severity === 'critical' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <div className="finding-body">
                      <div className="finding-top">
                        <span className={`finding-pill ${issue.severity === 'critical' ? 'pill-critical' : issue.severity === 'high' ? 'pill-high' : 'pill-mid'}`}>
                          {issue.severity === 'critical' ? 'Kritik SEO' : issue.severity === 'high' ? 'Önemli' : 'İyileştirme'}
                        </span>
                        <h4>{issue.title}</h4>
                      </div>
                      <p>{issue.description}</p>
                    </div>
                  </div>
                ))}

                {scanResult.meta?.schemaTypes?.length === 0 && (
                  <div className="finding-card finding-high">
                    <div className="finding-icon">
                      <Layers size={18} />
                    </div>
                    <div className="finding-body">
                      <div className="finding-top">
                        <span className="finding-pill pill-high">Yapılandırılmış Veri</span>
                        <h4>Schema.org JSON-LD Eklenmeli</h4>
                      </div>
                      <p>
                        Sitenizde Google ve AI modelleri için kurumsal Schema.org JSON-LD etiketi bulunmuyor. Organization ve 
                        WebSite şemaları arama snippet görünümünüzü %30'a kadar iyileştirir.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Real AI Citation Simulation with Official Logos */}
            <div className="results-ai-simulation-box">
              <div className="sim-header">
                <div className="sim-title-group">
                  <div className="sim-logos-pair">
                    <img src="/AI-logos/chatgpt-black.svg" alt="ChatGPT" className="sim-header-logo logo-invert" />
                    <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" className="sim-header-logo" />
                  </div>
                  <h4>ChatGPT & Perplexity Cevap Simülasyonu</h4>
                </div>
                <span className="sim-badge">Gemini Model Gözüyle Canlı Çıkarım</span>
              </div>
              <div className="sim-chat-bubble">
                <div className="sim-ai-avatar">
                  <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" className="avatar-img" />
                </div>
                <div className="sim-ai-text">
                  <p>
                    <strong>{brandProfile.brandName || scanResult.domain}</strong>, {brandProfile.industry} sektöründe faaliyet gösteren ve {brandProfile.targetAudience || 'kullanıcılara'} yönelik çözümler sunan bir platformdur.
                  </p>
                  <p className="sim-quote">
                    "Temel Değer Önerisi: {brandProfile.valueProposition || scanResult.meta?.title || 'Dijital büyüme ve arama performansı çözümleri.'}"
                  </p>
                  {brandProfile.suggestedCompetitors?.length > 0 && (
                    <div className="sim-competitors">
                      <span>Benzer Pazar Alternatifleri:</span>
                      <div className="comp-chips">
                        {brandProfile.suggestedCompetitors.map((comp, idx) => (
                          <span key={idx} className="comp-chip">{comp.name || comp.domain}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save & Track Enterprise Banner */}
            <div className="results-cta-banner">
              <div className="cta-banner-content">
                <div className="cta-left">
                  <div className="cta-badge">
                    <BarChart3 size={14} />
                    <span>Canlı Takip & Marka Paneli</span>
                  </div>
                  <h3>Bu Analizi Marka Paneline Aktar & Canlı Takibe Başla</h3>
                  <p>
                    {cleanDomainForDisplay(scanResult.domain)} için haftalık yapay zeka alıntı değişikliklerini, 
                    Google Search Console senkronizasyonunu ve öncelikli Action Feed görevlerini devreye alın.
                  </p>
                  {saveSuccessMsg && (
                    <div className="save-success-box animate-fade">
                      <CheckCircle2 size={16} />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}
                </div>

                <div className="cta-right">
                  <button
                    type="button"
                    className="cta-primary-save-btn"
                    onClick={handleSaveToWorkspace}
                    disabled={isSavingWorkspace}
                  >
                    {isSavingWorkspace ? (
                      <>
                        <Loader2 size={18} className="spinner-anim" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : isAuthenticated ? (
                      <>
                        <span>Bu Markayı Çalışma Alanıma Ekle</span>
                        <ArrowRight size={18} />
                      </>
                    ) : (
                      <>
                        <span>Ücretsiz Kayıt Ol & Bu Markayı Takip Et</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <span className="cta-sub-text">
                    ✓ Kredi kartı gerekmez • 1 tıkla anında kurulum • Tamamen ücretsiz
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Supported AI & Search Platforms Bar (Real Logos) */}
        <section id="supported-platforms" className="landing-platforms-section">
          <div className="platforms-title-row">
            <span className="platforms-eyebrow">DESTEKLENEN VE TARANAN ARAMA PLATFORMLARI</span>
          </div>
          <div className="platforms-grid">
            {PLATFORM_LOGOS.map((plat) => (
              <div key={plat.name} className="platform-card">
                <div className="platform-icon-wrap">
                  <img 
                    src={plat.icon} 
                    alt={plat.name} 
                    className={`platform-logo-img ${plat.invert ? 'logo-invert' : ''}`}
                  />
                </div>
                <div className="platform-info">
                  <span className="platform-name">{plat.name}</span>
                  <span className="platform-badge">{plat.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Showcase with REAL PHOTOGRAPHY COVERS */}
        <section id="features" className="landing-features-section">
          <div className="section-title-wrap">
            <span className="section-eyebrow">KURUMSAL BÜYÜME SİSTEMİ</span>
            <h2 className="section-heading">Klasik SEO ve Yapay Zeka Arama Çağı İçin Tasarlandı</h2>
            <p className="section-sub">
              Rastgele karmaşık grafikler yerine her hafta ne yapmanız gerektiğini söyleyen yapay zeka destekli büyüme ortağınız.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1: GEO Intelligence */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/geo-cover.jpg" 
                  alt="Yapay Zeka ve GEO İstihbaratı" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" className="cover-badge-icon" />
                  <span>GEO Intelligence</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>GEO & Yapay Zeka (LLM) Takibi</h3>
                <p>
                  ChatGPT, Perplexity ve Gemini aramalarında markanızın ne sıklıkla önerildiğini, 
                  kaynak gösterildiğini ve hangi sorulara yanıt olduğunu gerçek zamanlı izleyin.
                </p>
              </div>
            </div>

            {/* Feature 2: Organic Search */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/seo-cover.jpg" 
                  alt="Google Search Console ve Organik Arama" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <img src="/growth-covers/gsc-badge.svg" alt="GSC" className="cover-badge-icon" />
                  <span>Google Console</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>Google Search Console Senkronizasyonu</h3>
                <p>
                  Tıklama, gösterim, TO (CTR) ve ortalama pozisyon verilerinizi 1 tıkla bağlayın. 
                  Trafiği aniden düşen sayfaları anında tespit edin.
                </p>
              </div>
            </div>

            {/* Feature 3: Action Feed */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/overview-cover.jpg" 
                  alt="Öncelikli Aksiyon Akışı" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <Flame size={14} className="text-amber" />
                  <span>Haftalık Öncelikler</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>Öncelikli Aksiyon Akışı (Action Feed)</h3>
                <p>
                  Hangi sayfayı güncellemelisiniz? Hangi anahtar kelimede sıralama kaybettiniz? 
                  Action Feed her hafta somut, uygulanabilir ve önceliklendirilmiş görevler sunar.
                </p>
              </div>
            </div>

            {/* Feature 4: Technical SEO Audit */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/audit-cover.jpg" 
                  alt="7/24 Teknik SEO Denetimi" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <ShieldCheck size={14} className="text-emerald" />
                  <span>Bot Denetimi</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>7/24 Teknik SEO & Bot Denetimi</h3>
                <p>
                  SSL süresi, kırık linkler, noindex hataları ve GPTBot erişim engelleri gibi 
                  organik trafiğinizi baltalayabilecek teknik sorunları otomatik olarak tarayın.
                </p>
              </div>
            </div>

            {/* Feature 5: Multi-Workspace & Team */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/integrations-cover.jpg" 
                  alt="Google Entegrasyonları ve Çoklu Marka" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <Layers size={14} className="text-blue" />
                  <span>Çoklu Marka</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>Çoklu Marka & Workspace Mimarisi</h3>
                <p>
                  İster tek bir girişimci olun ister onlarca müşterisi olan bir dijital ajans; 
                  tüm web sitelerinizi bağımsız marka panelleriyle tek bir hesaptan yönetin.
                </p>
              </div>
            </div>

            {/* Feature 6: llms.txt Documentation */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/modal-cover.jpg" 
                  alt="llms.txt Yapay Zeka Dosya Yönetimi" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <FileText size={14} className="text-cyan" />
                  <span>llms.txt Standardı</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>Otomatik llms.txt & Dizin Yönetimi</h3>
                <p>
                  Yapay zeka modellerinin sitenizi doğru özetlemesi için gereken <code>llms.txt</code> ve 
                  <code>llms-full.txt</code> dosyalarını dakikalar içinde oluşturup yayınlayın.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Traditional SEO vs GEO Comparison Table */}
        <section id="geo-intelligence" className="landing-comparison-section">
          <div className="section-title-wrap">
            <span className="section-eyebrow">ARAMA DAVRANIŞINDA 2026 DEVRİMİ</span>
            <h2 className="section-heading">Klasik SEO Artık Yetersiz: GEO Çağı Başladı</h2>
            <p className="section-sub">
              Kullanıcıların %40'tan fazlası artık Google'da aramak yerine doğrudan ChatGPT veya Perplexity'e soruyor.
            </p>
          </div>

          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Özellik & Yaklaşım</th>
                  <th>Geleneksel SEO</th>
                  <th className="highlight-col">Cerilas Growth (GEO + Modern SEO)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Hedeflenen Arama Ağı</td>
                  <td>Yalnızca Google & Bing 10 Mavi Link</td>
                  <td className="highlight-col">Google + ChatGPT + Perplexity + Gemini + Claude</td>
                </tr>
                <tr>
                  <td>İçerik Anlamlandırması</td>
                  <td>Klasik anahtar kelime yoğunluğu</td>
                  <td className="highlight-col">Semantik varlıklar, llms.txt ve LLM bilgi grafiği</td>
                </tr>
                <tr>
                  <td>İş Akışı</td>
                  <td>Karmaşık grafikler, yorumsuz veriler</td>
                  <td className="highlight-col">Haftalık öncelikli Aksiyon Akışı (Action Feed)</td>
                </tr>
                <tr>
                  <td>Teknik Kontroller</td>
                  <td>Yalnızca Googlebot</td>
                  <td className="highlight-col">GPTBot, ClaudeBot, PerplexityBot + Googlebot</td>
                </tr>
                <tr>
                  <td>Çoklu Marka Yönetimi</td>
                  <td>Pahalı ajans paketleri</td>
                  <td className="highlight-col">Tek panelde sınırsız bağımsız marka çalışma alanı</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="landing-how-section">
          <div className="section-title-wrap">
            <span className="section-eyebrow">3 BASİT ADIMDA BAŞLAYIN</span>
            <h2 className="section-heading">Sitenizi Büyütmek Hiç Bu Kadar Kolay Olmamıştı</h2>
          </div>

          <div className="how-steps-grid">
            <div className="how-step-card">
              <div className="how-step-number">01</div>
              <h4>Sitenizin Adresini Girin</h4>
              <p>Karmaşık kod eklemelerine gerek yok. Web sitenizin alan adını yazıp ücretsiz ilk analizinizi başlatın.</p>
            </div>

            <div className="how-step-card">
              <div className="how-step-number">02</div>
              <h4>AI & Arama Raporunuzu İnceleyin</h4>
              <p>Teknik sağlık, GEO hazırlığı, eksik meta veriler ve pazar rakiplerinizi itemize edilmiş raporda görün.</p>
            </div>

            <div className="how-step-card">
              <div className="how-step-number">03</div>
              <h4>Aksiyonları Uygulayın & Katlayın</h4>
              <p>Öncelikli Action Feed görevlerini tamamlayarak hem Google'da hem de yapay zeka arama motorlarında zirveye çıkın.</p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="landing-faq-section">
          <div className="section-title-wrap">
            <span className="section-eyebrow">SIKÇA SORULAN SORULAR</span>
            <h2 className="section-heading">Merak Edilenler</h2>
          </div>

          <div className="faq-accordion-list">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`faq-accordion-item ${isOpen ? 'is-open' : ''}`}>
                  <button 
                    type="button" 
                    className="faq-question-btn"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {isOpen && (
                    <div className="faq-answer-pane animate-fade">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Call to Action Card */}
        <section className="landing-bottom-cta">
          <div className="bottom-cta-card">
            <div className="bottom-cta-badge">
              <Zap size={14} />
              <span>Hemen Başlayın</span>
            </div>
            <h2>Sitenizin Gerçek Büyüme Potansiyelini Keşfedin</h2>
            <p>
              Hiçbir kurulum veya kredi kartı gerektirmeden web sitenizi girin ve ilk ücretsiz insight'ınızı anında alın.
            </p>
            <button
              type="button"
              className="bottom-cta-btn"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                inputRef.current?.focus();
              }}
            >
              <Search size={18} />
              <span>Web Siteni Şimdi Ücretsiz Analiz Et</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-left">
            <div className="footer-brand">
              <BarChart3 size={16} className="text-blue" />
              <span>Cerilas Growth</span>
            </div>
            <p>© 2026 Cerilas. Tüm hakları saklıdır. Google ve Yapay Zeka Arama İstihbaratı Platformu.</p>
          </div>
          <div className="footer-links">
            <button 
              type="button"
              className="footer-link-btn"
              onClick={onBackToTools || (() => { window.location.hash = '#/'; })}
            >
              Cerilas Ücretsiz Araçlar
            </button>
            <a href="https://cerilas.com" target="_blank" rel="noopener noreferrer">Cerilas Ana Sayfa</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
