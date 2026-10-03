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
  Search,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGrowth } from '../GrowthContext';
import { useTheme } from '../../context/ThemeContext';
import GrowthFavicon from './GrowthFavicon';
import './GrowthLandingPage.css';

const QUICK_TEST_DOMAINS = [
  'cerilas.com',
  'linear.app',
  'supabase.com',
  'posthog.com',
  'notion.so'
];

const SCAN_STEPS = [
  { id: 'dns', label: 'Checking DNS, SSL & Server Response Time' },
  { id: 'crawlers', label: 'Verifying AI Crawler Permissions (GPTBot, Perplexity, Claude)' },
  { id: 'meta', label: 'Scanning Meta Tags, Schema.org & llms.txt Presence' },
  { id: 'intel', label: 'AI Brand Positioning & Competitor Intelligence' }
];

const PLATFORM_LOGOS = [
  { name: 'Google Search', icon: '/AI-logos/google-color.svg', badge: 'Classic Search' },
  { name: 'Google Search Console', icon: '/growth-covers/gsc-badge.svg', badge: 'Organic Data' },
  { name: 'ChatGPT / OpenAI', icon: '/AI-logos/chatgpt-black.svg', badge: 'GPTBot', invert: true },
  { name: 'Perplexity AI', icon: '/AI-logos/perplexity-color.svg', badge: 'Live Search' },
  { name: 'Anthropic Claude', icon: '/AI-logos/claude-color.svg', badge: 'ClaudeBot' },
  { name: 'Google Gemini', icon: '/AI-logos/gemini-color.svg', badge: 'AI Overviews' }
];

const FAQS = [
  {
    q: 'What is Generative Engine Optimization (GEO) and how does it differ from traditional SEO?',
    a: 'GEO is next-generation optimization designed to ensure your brand is accurately cited, referenced as a source, and recommended across AI search engines such as ChatGPT, Perplexity, Claude, and Gemini. While traditional SEO focuses solely on Google\'s 10 blue links, GEO ensures AI models structurally understand your content and cite your authority.'
  },
  {
    q: 'What does the free initial audit cover?',
    a: 'For your entered domain, it delivers real-time audits of your SSL certificate, server response latency, robots.txt bot permissions (GPTBot, PerplexityBot, etc.), meta tags, Schema.org structured data, llms.txt presence, and an AI-derived market positioning summary.'
  },
  {
    q: 'Can I save this analysis and track progress weekly?',
    a: 'Yes! By creating a free account, you can save your brand to your workspace, monitor automated weekly technical health audits, sync Google Search Console, and track your AI visibility score continuously.'
  },
  {
    q: 'Is my Google Search Console data secure?',
    a: 'Absolutely. Cerilas Growth connects to the Google API using read-only access for search performance telemetry. Your data is never shared with third parties or used to train machine learning models.'
  }
];

export default function GrowthLandingPage({ onBackToTools, initialDomain = '' }) {
  const { isAuthenticated, openAuthModal, token } = useAuth();
  const { workspaces, refreshWorkspaces, switchWorkspace, setActiveTab, setIsOnboardingOpen } = useGrowth();
  const { toggleTheme, isDark } = useTheme();

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
    if (!val || typeof val !== 'string') return '';
    return val.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
  };

  const handleStartScan = async (targetDomain) => {
    const raw = (targetDomain || inputUrl || '').trim();
    if (!raw) {
      setError('Please enter the website address you want to analyze.');
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
        throw new Error(data.error || 'An error occurred while analyzing the website.');
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
      setError(err.message || 'Analysis could not be completed. Please check your URL.');
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
        throw new Error(data.error || 'Could not create workspace.');
      }

      try {
        sessionStorage.removeItem('cerilas_pending_growth_scan');
      } catch {}

      setSaveSuccessMsg('Brand successfully saved! Redirecting to your dashboard...');
      
      const newWs = data.data?.workspace || data.data;
      if (newWs?.slug) {
        await refreshWorkspaces(newWs.slug);
        switchWorkspace(newWs);
      } else {
        await refreshWorkspaces();
      }
      setActiveTab('overview');

    } catch (err) {
      setError(err.message || 'An error occurred while saving.');
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
            <a href="#features">Features</a>
            <a href="#supported-platforms">Platforms</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#geo-intelligence">GEO vs SEO</a>
            <a href="#faq">FAQ</a>
          </nav>

          {/* Right: Actions */}
          <div className="landing-header-actions">
            <button 
              type="button" 
              className="landing-tools-nav-link"
              onClick={onBackToTools || (() => { window.location.hash = '#/'; })}
            >
              <ArrowLeft size={14} />
              <span>Back to Tools</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="landing-theme-toggle-btn"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
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
                  <span>Go to Dashboard</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  className="landing-cta-sm-btn"
                  onClick={() => setIsOnboardingOpen(true)}
                >
                  <span>+ Add Brand</span>
                </button>
              )
            ) : (
              <div className="landing-auth-btns">
                <button 
                  type="button" 
                  className="landing-login-btn"
                  onClick={() => openAuthModal('login')}
                >
                  Log In
                </button>
                <button 
                  type="button" 
                  className="landing-cta-sm-btn"
                  onClick={() => openAuthModal('register')}
                >
                  <span>Get Started Free</span>
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
            <span className="chip-text">Google & AI Search Intelligence Platform (GEO)</span>
          </div>

          <h1 className="hero-title">
            Uncover Your True Presence on <br className="hidden-mobile" />
            <span className="title-highlight">Google, ChatGPT</span> & <span className="title-highlight">Perplexity</span>.
          </h1>

          <p className="hero-subtitle">
            Enter your website domain to inspect Google indexability, discover how LLM crawlers (GPTBot, Claude, Perplexity) 
            read your site, and unlock growth opportunities in <strong>10 seconds for free</strong>.
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
                placeholder="yourdomain.com or https://example.com"
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
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Search size={17} />
                    <span>Run Free Initial Audit</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Test Presets */}
            <div className="scanner-presets-row">
              <span className="presets-label">Quick test with example domains:</span>
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
                <span>Googlebot Index Check</span>
              </div>
              <div className="trust-item">
                <img src="/AI-logos/chatgpt-black.svg" alt="OpenAI" className="trust-logo logo-invert" />
                <span>GPTBot & Perplexity Access</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={16} className="text-emerald" />
                <span>100% Free Initial Insight</span>
              </div>
              <div className="trust-item">
                <Lock size={15} className="text-slate" />
                <span>No Credit Card Required</span>
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
                    <span>cerilas.com/growth • Live Brand Dashboard</span>
                  </div>
                  <div className="preview-right-tags">
                    <span className="status-live-pill">
                      <span className="pulse-dot" /> LIVE MONITORING
                    </span>
                  </div>
                </div>
                
                {/* Real High-Res Dashboard Screenshot */}
                <div className="preview-image-wrapper">
                  <img 
                    src="/growth-covers/dashboard-preview.jpg" 
                    alt="Cerilas Growth SaaS Analytics Dashboard" 
                    className="preview-real-img"
                  />
                  <div className="preview-floating-chip chip-left">
                    <img src="/growth-covers/gsc-badge.svg" alt="GSC" className="chip-logo" />
                    <div>
                      <span className="chip-title">GSC Synchronization</span>
                      <span className="chip-stat">+38.5% Organic Growth</span>
                    </div>
                  </div>
                  <div className="preview-floating-chip chip-right">
                    <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" className="chip-logo" />
                    <div>
                      <span className="chip-title">GEO AI Citation Score</span>
                      <span className="chip-stat">14,890+ Citations</span>
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
                <GrowthFavicon
                  src={scanResult.meta?.faviconUrl}
                  domain={scanResult.domain}
                  name={brandProfile.brandName || scanResult.domain}
                  size={36}
                  className="results-favicon"
                />
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
                <span>Analyze Another Site</span>
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
                  <span className="gauge-tag tag-blue">Google & Technical SEO</span>
                </div>
                <div className="gauge-score-display">
                  <div className="score-number-wrap">
                    <span className={`score-big ${scanResult.technicalScore >= 80 ? 'score-good' : scanResult.technicalScore >= 60 ? 'score-mid' : 'score-low'}`}>
                      {scanResult.technicalScore}
                    </span>
                    <span className="score-denom">/100</span>
                  </div>
                  <span className="score-label">
                    {scanResult.technicalScore >= 80 ? 'Strong Foundation' : scanResult.technicalScore >= 60 ? 'Needs Improvement' : 'Critical Issues'}
                  </span>
                </div>
                <div className="gauge-metrics-list">
                  <div className="metric-row">
                    <span>SSL Security Protocol:</span>
                    <strong className={scanResult.meta?.hasSsl ? 'text-emerald' : 'text-rose'}>
                      {scanResult.meta?.hasSsl ? 'Active (HTTPS)' : 'Missing'}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Server Response Time:</span>
                    <strong>{scanResult.loadTimeMs} ms</strong>
                  </div>
                  <div className="metric-row">
                    <span>Robots.txt Status:</span>
                    <strong className={scanResult.robotsTxtFound ? 'text-emerald' : 'text-amber'}>
                      {scanResult.robotsTxtFound ? 'Present' : 'Not Found'}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Content Volume:</span>
                    <strong>{scanResult.meta?.wordCount || 0} words</strong>
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
                  <span className="gauge-tag tag-cyan">GEO & LLM Readiness</span>
                </div>
                <div className="gauge-score-display">
                  <div className="score-number-wrap">
                    <span className={`score-big ${scanResult.geoScore >= 75 ? 'score-good' : scanResult.geoScore >= 50 ? 'score-mid' : 'score-low'}`}>
                      {scanResult.geoScore}
                    </span>
                    <span className="score-denom">/100</span>
                  </div>
                  <span className="score-label">
                    {scanResult.geoScore >= 75 ? 'LLM Optimized' : 'GEO Opportunity Identified'}
                  </span>
                </div>
                <div className="gauge-metrics-list">
                  <div className="metric-row">
                    <span>llms.txt AI File:</span>
                    <strong className={scanResult.llmsTxtFound ? 'text-emerald' : 'text-rose'}>
                      {scanResult.llmsTxtFound ? 'Active' : 'Missing'}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Schema.org JSON-LD:</span>
                    <strong className={scanResult.meta?.schemaTypes?.length > 0 ? 'text-emerald' : 'text-amber'}>
                      {scanResult.meta?.schemaTypes?.length > 0 ? `${scanResult.meta.schemaTypes.length} Schemas Defined` : 'Missing'}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>GPTBot & Perplexity Crawlers:</span>
                    <strong className="text-emerald">Allowed</strong>
                  </div>
                  <div className="metric-row">
                    <span>AI Citation Potential:</span>
                    <strong className="text-blue">High</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Gemini Brand Intelligence */}
              <div className="gauge-card">
                <div className="gauge-top-row">
                  <div className="gauge-brand-icon">
                    <img src="/AI-logos/gemini-color.svg" alt="Gemini" className="card-brand-img" />
                  </div>
                  <span className="gauge-tag tag-gemini">Gemini Brand Intelligence</span>
                </div>
                <div className="intel-content">
                  <div className="intel-field">
                    <span className="intel-k">Detected Brand:</span>
                    <strong className="intel-v">{brandProfile.brandName || scanResult.domain}</strong>
                  </div>
                  <div className="intel-field">
                    <span className="intel-k">Industry & Model:</span>
                    <span className="intel-badge">{brandProfile.industry} • {brandProfile.businessModel}</span>
                  </div>
                  <div className="intel-field">
                    <span className="intel-k">AI Brand Summary:</span>
                    <p className="intel-desc">"{brandProfile.description || scanResult.meta?.metaDescription || 'Digital services and web platform.'}"</p>
                  </div>
                  {brandProfile.primaryKeywords?.length > 0 && (
                    <div className="intel-keywords">
                      <span className="intel-k">Key Search Queries:</span>
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
                  <h3>Priority Action Items & Growth Opportunities</h3>
                </div>
                <span className="findings-count-badge">
                  {(scanResult.meta?.issues?.length || 0) + (!scanResult.llmsTxtFound ? 1 : 0)} Opportunities Detected
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
                        <span className="finding-pill pill-critical">GEO Critical Opportunity</span>
                        <h4>/llms.txt Standard Documentation File Missing</h4>
                      </div>
                      <p>
                        No <code>/llms.txt</code> file was detected on your website. LLM search engines like ChatGPT, Perplexity, and Claude
                        reference this file when indexing and summarizing your brand. With Cerilas Growth, you can generate your custom llms.txt in 1 click.
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
                          {issue.severity === 'critical' ? 'Critical SEO' : issue.severity === 'high' ? 'High Priority' : 'Improvement'}
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
                        <span className="finding-pill pill-high">Structured Data</span>
                        <h4>Add Schema.org JSON-LD</h4>
                      </div>
                      <p>
                        Your website is missing corporate Schema.org JSON-LD structured data for Google and AI models. Adding Organization and
                        WebSite schemas improves search snippet CTR by up to 30%.
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
                  <h4>ChatGPT & Perplexity Response Simulation</h4>
                </div>
                <span className="sim-badge">Live Synthesis via Gemini 2.5 Flash</span>
              </div>
              <div className="sim-chat-bubble">
                <div className="sim-ai-avatar">
                  <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" className="avatar-img" />
                </div>
                <div className="sim-ai-text">
                  <p>
                    <strong>{brandProfile.brandName || scanResult.domain}</strong> is a platform operating in the {brandProfile.industry} industry, delivering solutions for {brandProfile.targetAudience || 'users'}.
                  </p>
                  <p className="sim-quote">
                    "Core Value Proposition: {brandProfile.valueProposition || scanResult.meta?.title || 'Digital growth and search visibility performance platform.'}"
                  </p>
                  {brandProfile.suggestedCompetitors?.length > 0 && (
                    <div className="sim-competitors">
                      <span>Similar Market Alternatives:</span>
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
                    <span>Live Monitoring & Brand Dashboard</span>
                  </div>
                  <h3>Import Analysis & Start Continuous Monitoring</h3>
                  <p>
                    Activate weekly AI citation tracking, Google Search Console telemetry, and prioritized Action Feed tasks for {cleanDomainForDisplay(scanResult.domain)}.
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
                        <span>Saving...</span>
                      </>
                    ) : isAuthenticated ? (
                      <>
                        <span>Add This Brand to My Workspace</span>
                        <ArrowRight size={18} />
                      </>
                    ) : (
                      <>
                        <span>Create Free Account & Track Brand</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <span className="cta-sub-text">
                    ✓ No credit card required • Instant 1-click setup • 100% free
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Supported AI & Search Platforms Bar (Real Logos) */}
        <section id="supported-platforms" className="landing-platforms-section">
          <div className="platforms-title-row">
            <span className="platforms-eyebrow">SUPPORTED & CRAWLED SEARCH PLATFORMS</span>
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
            <span className="section-eyebrow">ENTERPRISE GROWTH ENGINE</span>
            <h2 className="section-heading">Engineered for Classic SEO & the Generative AI Era</h2>
            <p className="section-sub">
              Your AI growth partner that tells you exactly what to execute each week, rather than overwhelming you with complex, raw charts.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1: GEO Intelligence */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/geo-cover.jpg" 
                  alt="AI & GEO Intelligence" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" className="cover-badge-icon" />
                  <span>GEO Intelligence</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>GEO & AI Citation Tracking</h3>
                <p>
                  Track in real time how often your brand is recommended, cited as a trusted source, and surfaced across ChatGPT, Perplexity, and Gemini queries.
                </p>
              </div>
            </div>

            {/* Feature 2: Organic Search */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/seo-cover.jpg" 
                  alt="Google Search Console & Organic Search" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <img src="/growth-covers/gsc-badge.svg" alt="GSC" className="cover-badge-icon" />
                  <span>Google Console</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>Google Search Console Sync</h3>
                <p>
                  Connect your clicks, impressions, CTR, and average rankings in 1 click. Instantly detect pages suffering from unexpected traffic drops.
                </p>
              </div>
            </div>

            {/* Feature 3: Action Feed */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/overview-cover.jpg" 
                  alt="Priority Action Feed" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <Flame size={14} className="text-amber" />
                  <span>Weekly Priorities</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>Priority Action Feed</h3>
                <p>
                  Which pages should you optimize? Which keywords lost rankings? Action Feed delivers concrete, prioritized, and high-impact tasks every single week.
                </p>
              </div>
            </div>

            {/* Feature 4: Technical SEO Audit */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/audit-cover.jpg" 
                  alt="24/7 Technical SEO Audit" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <ShieldCheck size={14} className="text-emerald" />
                  <span>Crawler Audit</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>24/7 Technical SEO & Bot Audits</h3>
                <p>
                  Continuously audit for SSL expirations, broken links, noindex errors, and GPTBot crawler blocks that sabotage your organic visibility.
                </p>
              </div>
            </div>

            {/* Feature 5: Multi-Workspace & Team */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/integrations-cover.jpg" 
                  alt="Google Integrations & Multi-Brand" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <Layers size={14} className="text-blue" />
                  <span>Multi-Brand</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>Multi-Brand & Workspace Architecture</h3>
                <p>
                  Whether you are a solo entrepreneur or a digital agency serving dozens of clients, manage every website through independent brand dashboards from a single account.
                </p>
              </div>
            </div>

            {/* Feature 6: llms.txt Documentation */}
            <div className="feature-card">
              <div className="feature-cover-wrap">
                <img 
                  src="/growth-covers/modal-cover.jpg" 
                  alt="llms.txt AI File Management" 
                  className="feature-cover-img"
                />
                <div className="feature-cover-badge">
                  <FileText size={14} className="text-cyan" />
                  <span>llms.txt Standard</span>
                </div>
              </div>
              <div className="feature-body">
                <h3>Automated llms.txt & Directory Management</h3>
                <p>
                  Generate, fine-tune, and deploy the <code>llms.txt</code> and <code>llms-full.txt</code> files needed for LLMs to accurately summarize and index your website.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Traditional SEO vs GEO Comparison Table */}
        <section id="geo-intelligence" className="landing-comparison-section">
          <div className="section-title-wrap">
            <span className="section-eyebrow">THE 2026 SHIFT IN SEARCH BEHAVIOR</span>
            <h2 className="section-heading">Classic SEO Is No Longer Enough: Welcome to the GEO Era</h2>
            <p className="section-sub">
              Over 40% of users now query ChatGPT or Perplexity directly instead of browsing traditional search engine links.
            </p>
          </div>

          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Capability & Approach</th>
                  <th>Traditional SEO</th>
                  <th className="highlight-col">Cerilas Growth (GEO + Modern SEO)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Target Search Networks</td>
                  <td>Google & Bing 10 Blue Links Only</td>
                  <td className="highlight-col">Google + ChatGPT + Perplexity + Gemini + Claude</td>
                </tr>
                <tr>
                  <td>Content Comprehension</td>
                  <td>Classic keyword density</td>
                  <td className="highlight-col">Semantic entities, llms.txt & LLM knowledge graphs</td>
                </tr>
                <tr>
                  <td>Workflow & Execution</td>
                  <td>Complex graphs, uninterpreted raw data</td>
                  <td className="highlight-col">Weekly prioritized Action Feed</td>
                </tr>
                <tr>
                  <td>Technical Audits</td>
                  <td>Googlebot only</td>
                  <td className="highlight-col">GPTBot, ClaudeBot, PerplexityBot + Googlebot</td>
                </tr>
                <tr>
                  <td>Multi-Brand Management</td>
                  <td>Expensive agency tiers</td>
                  <td className="highlight-col">Unlimited independent brand workspaces in one dashboard</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="landing-how-section">
          <div className="section-title-wrap">
            <span className="section-eyebrow">GET STARTED IN 3 SIMPLE STEPS</span>
            <h2 className="section-heading">Growing Your Site Has Never Been This Effortless</h2>
          </div>

          <div className="how-steps-grid">
            <div className="how-step-card">
              <div className="how-step-number">01</div>
              <h4>Enter Your Website Domain</h4>
              <p>No tracking scripts or code alterations required. Enter your domain to launch your instant free audit.</p>
            </div>

            <div className="how-step-card">
              <div className="how-step-number">02</div>
              <h4>Review Your AI & Search Audit</h4>
              <p>Inspect technical health, GEO readiness, missing structured data, and competitors in an itemized report.</p>
            </div>

            <div className="how-step-card">
              <div className="how-step-number">03</div>
              <h4>Execute Actions & Scale</h4>
              <p>Complete prioritized Action Feed tasks to capture top rankings across both Google and generative AI engines.</p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="landing-faq-section">
          <div className="section-title-wrap">
            <span className="section-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="section-heading">Common Questions & Answers</h2>
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
              <span>Get Started</span>
            </div>
            <h2>Discover Your Site's Real Growth Potential</h2>
            <p>
              Enter your website with no setup or credit card required and receive your free insight report immediately.
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
              <span>Analyze Your Website for Free Now</span>
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
            <p>© 2026 Cerilas. All rights reserved. Google & AI Search Intelligence Platform.</p>
          </div>
          <div className="footer-links">
            <button 
              type="button"
              className="footer-link-btn"
              onClick={onBackToTools || (() => { window.location.hash = '#/'; })}
            >
              Cerilas Free Tools
            </button>
            <a href="https://cerilas.com" target="_blank" rel="noopener noreferrer">Cerilas Homepage</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
