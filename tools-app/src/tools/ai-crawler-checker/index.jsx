import React, { useState, useMemo } from 'react';
import {
  Bot,
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Download,
  RotateCcw,
  Globe,
  FileCode,
  FileText,
  Layers,
  HelpCircle,
  Terminal,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  ArrowRight,
  Info,
  Sliders,
  Users,
  Activity
} from 'lucide-react';
import { aiCrawlerCheckerManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Button, Badge, Card, ToolHeader, AdSlot } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import AiCrawlerCheckerSeo from './components/AiCrawlerCheckerSeo';
import './ai-crawler-checker.css';

const SAMPLE_DOMAINS = [
  { name: 'Cerilas', url: 'cerilas.com' },
  { name: 'Wikipedia', url: 'wikipedia.org' },
  { name: 'OpenAI', url: 'openai.com' },
  { name: 'GitHub', url: 'github.com' },
  { name: 'Medium', url: 'medium.com' }
];

const SCAN_STEPS = [
  'Validating domain & resolving DNS...',
  'Fetching /robots.txt directives...',
  'Parsing RFC 9309 crawler rules & longest prefix matches...',
  'Evaluating AI search & training accessibility...',
  'Inspecting /llms.txt & XML sitemaps...',
  'Analyzing homepage indexability & HTTP security headers...'
];

export default function AiCrawlerChecker({ onBack, toolMeta }) {
  const {
    trackUse,
    trackDownload,
    trackCopy,
    visitorCount,
    conversionCount,
    getConversionLabel
  } = useToolAnalytics(aiCrawlerCheckerManifest.slug, toolMeta);

  // Search & input state
  const [inputUrl, setInputUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [auditData, setAuditData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // View state
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'robotstxt' | 'indexability' | 'llms' | 'simulator'
  const [showOtherOpenAi, setShowOtherOpenAi] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Generator Modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorRules, setGeneratorRules] = useState({
    oaiSearch: true,
    claudeSearch: true,
    perplexity: true,
    gptBot: false,
    claudeBot: false,
    googleExtended: false
  });
  const [isGeneratedCopied, setIsGeneratedCopied] = useState(false);

  // HTTP Simulator state
  const [simSelectedCrawler, setSimSelectedCrawler] = useState('oai-searchbot');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState(null);

  // Handle URL Form Submission
  const handleCheck = async (targetUrlOverride) => {
    const rawTarget = typeof targetUrlOverride === 'string' ? targetUrlOverride : inputUrl;
    if (!rawTarget || !rawTarget.trim()) {
      setErrorMessage('Please enter a website URL (e.g. example.com)');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);
    setScanStepIndex(0);
    setSimResult(null);
    setSimError(null);

    // Normalize URL
    let cleanUrl = rawTarget.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }
    setInputUrl(cleanUrl);

    // Progress stepper interval
    const stepInterval = setInterval(() => {
      setScanStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const response = await fetch('/api/tools/ai-crawler-checker/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Audit analysis failed.');
      }

      setAuditData(result.data);
      trackUse({
        domain: result.data.domain,
        score: result.data.score?.score,
        searchAllowed: result.data.summary?.searchAccessibility?.allowedCount
      });
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Audit failed:', err);
      setErrorMessage(err.message || 'We could not reach this website. Please check the URL and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Run HTTP User-Agent Simulation
  const handleRunSimulation = async () => {
    if (!auditData?.checkedUrl) return;
    setIsSimulating(true);
    setSimResult(null);
    setSimError(null);

    try {
      const response = await fetch('/api/tools/ai-crawler-checker/simulate-ua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: auditData.checkedUrl,
          crawlerId: simSelectedCrawler
        })
      });

      if (!response.ok) {
        throw new Error(`Simulation failed with status ${response.status}`);
      }

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.error || 'Simulation returned an error');
      }

      setSimResult(resJson.simulation);
    } catch (err) {
      setSimError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Grouped crawlers for rendering
  const crawlerGroups = useMemo(() => {
    if (!auditData?.crawlers) return [];

    const searchBots = auditData.crawlers.filter((c) => c.group === 'search');
    const userRetrievalBots = auditData.crawlers.filter((c) => c.group === 'user_retrieval');
    const trainingBots = auditData.crawlers.filter((c) => c.group === 'training');
    const otherOpenAi = auditData.crawlers.filter((c) => c.group === 'other_openai');
    const traditionalBots = auditData.crawlers.filter((c) => c.group === 'traditional');

    return [
      {
        id: 'search',
        title: 'AI Search & Discovery',
        caption: 'Crawlers powering real-time search, generative answer citations, and web indexing.',
        crawlers: searchBots
      },
      {
        id: 'user_retrieval',
        title: 'User-Initiated AI Retrieval',
        caption: 'On-demand agents triggered when an end-user explicitly enters a URL in an AI chat session.',
        crawlers: userRetrievalBots
      },
      {
        id: 'training',
        title: 'Model Training & Foundation AI Development',
        caption: 'Crawlers ingesting web datasets to build foundation models. Blocking training does NOT hurt search citations.',
        crawlers: trainingBots
      },
      {
        id: 'other_openai',
        title: 'Other OpenAI Crawlers',
        caption: 'Auxiliary crawlers (such as advertising bots) excluded from the primary AI accessibility score.',
        crawlers: otherOpenAi,
        isCollapsible: true
      },
      {
        id: 'traditional',
        title: 'Traditional Search Comparison',
        caption: 'Standard web crawlers powering traditional organic 10-blue-links search engines.',
        crawlers: traditionalBots
      }
    ];
  }, [auditData]);

  // Top 3 summary search engines (ChatGPT, Claude, Perplexity)
  const topEngines = useMemo(() => {
    if (!auditData?.crawlers) return [];
    return [
      auditData.crawlers.find((c) => c.id === 'oai-searchbot'),
      auditData.crawlers.find((c) => c.id === 'claude-searchbot'),
      auditData.crawlers.find((c) => c.id === 'perplexitybot')
    ].filter(Boolean);
  }, [auditData]);

  // Dynamically generate AI-friendly robots.txt
  const generatedRobotsTxt = useMemo(() => {
    const lines = ['# Generated via Cerilas AI Crawler Checker (https://tools.cerilas.com)', ''];

    // Search rules
    if (generatorRules.oaiSearch) {
      lines.push('User-agent: OAI-SearchBot', 'Allow: /', '');
    } else {
      lines.push('User-agent: OAI-SearchBot', 'Disallow: /', '');
    }

    if (generatorRules.claudeSearch) {
      lines.push('User-agent: Claude-SearchBot', 'Allow: /', '');
    } else {
      lines.push('User-agent: Claude-SearchBot', 'Disallow: /', '');
    }

    if (generatorRules.perplexity) {
      lines.push('User-agent: PerplexityBot', 'Allow: /', '');
    } else {
      lines.push('User-agent: PerplexityBot', 'Disallow: /', '');
    }

    // Training rules
    if (generatorRules.gptBot) {
      lines.push('User-agent: GPTBot', 'Allow: /', '');
    } else {
      lines.push('User-agent: GPTBot', 'Disallow: /', '');
    }

    if (generatorRules.claudeBot) {
      lines.push('User-agent: ClaudeBot', 'Allow: /', '');
    } else {
      lines.push('User-agent: ClaudeBot', 'Disallow: /', '');
    }

    if (generatorRules.googleExtended) {
      lines.push('User-agent: Google-Extended', 'Allow: /', '');
    } else {
      lines.push('User-agent: Google-Extended', 'Disallow: /', '');
    }

    if (auditData?.sitemap?.url) {
      lines.push(`Sitemap: ${auditData.sitemap.url}`, '');
    }

    return lines.join('\n');
  }, [generatorRules, auditData]);

  // Copy helper
  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    trackCopy({ type: id });
    setTimeout(() => setCopiedSnippet(null), 1800);
  };

  // Download robots.txt helper
  const handleDownloadRobotsTxt = (content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackDownload({ format: 'robots.txt' });
  };

  return (
    <div className="c-tool-page-container acc-root">
      {/* 1. Header with Breadcrumbs and Visitor Badge */}
      <ToolHeader
        title={aiCrawlerCheckerManifest.title}
        subtitle={aiCrawlerCheckerManifest.shortDescription}
        onBack={onBack}
        slug={aiCrawlerCheckerManifest.slug}
        badges={
          <>
            {visitorCount > 0 && (
              <Badge variant="blue" icon={<Users size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="brand" icon={<Activity size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel()}
              </Badge>
            )}
            <Badge variant="neutral" icon={<Bot size={12} strokeWidth={2} />}>
              RFC 9309 Compliant
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              SSRF Protected
            </Badge>
          </>
        }
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="acc-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="acc-error-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Hero Search Bar Card */}
      <div className="acc-hero-card">
        <div className="acc-hero-header">
          <span className="acc-hero-eyebrow">
            <Bot size={14} /> Free AI SEO & Access Tool
          </span>
          <h2 className="acc-hero-title">Can AI crawlers access your website?</h2>
          <p className="acc-hero-subtitle">
            Check whether ChatGPT, Claude, Perplexity, Gemini, and other AI systems can access your content for search discovery or model training.
          </p>
        </div>

        <form
          className="acc-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCheck();
          }}
        >
          <div className="acc-input-wrapper">
            <Globe className="acc-input-icon" size={18} />
            <input
              type="text"
              className="acc-input-field"
              placeholder="https://example.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={isScanning}
              spellCheck="false"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <Button
              variant="primary"
              type="submit"
              disabled={isScanning || !inputUrl.trim()}
              icon={isScanning ? <Clock size={16} className="spin" /> : <Search size={16} />}
            >
              {isScanning ? 'Checking...' : 'Check AI Crawlers'}
            </Button>
          </div>

          <div className="acc-samples-row">
            <span>Try sample domain:</span>
            {SAMPLE_DOMAINS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="acc-sample-btn"
                onClick={() => {
                  setInputUrl(sample.url);
                  handleCheck(sample.url);
                }}
                disabled={isScanning}
              >
                {sample.name}
              </button>
            ))}
          </div>

          <div className="acc-hero-guarantees">
            <span>
              <CheckCircle2 size={13} color="#10b981" /> 100% Free
            </span>
            <span>•</span>
            <span>
              <CheckCircle2 size={13} color="#10b981" /> No Sign-up Required
            </span>
            <span>•</span>
            <span>
              <CheckCircle2 size={13} color="#10b981" /> Instant Server Verification
            </span>
          </div>
        </form>
      </div>

      {/* 3. Live Animated Multi-Step Scan Progress */}
      {isScanning && (
        <div className="acc-progress-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
            <Clock size={18} className="spin" />
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Checking website accessibility...
            </strong>
          </div>

          <div className="acc-progress-bar-track">
            <div
              className="acc-progress-bar-fill"
              style={{ width: `${((scanStepIndex + 1) / SCAN_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="acc-progress-steps">
            {SCAN_STEPS.map((step, idx) => {
              const isDone = idx < scanStepIndex;
              const isActive = idx === scanStepIndex;
              return (
                <div
                  key={idx}
                  className={`acc-progress-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                >
                  {isDone ? (
                    <CheckCircle2 size={15} color="#10b981" />
                  ) : isActive ? (
                    <Clock size={15} className="spin" />
                  ) : (
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '1.5px solid var(--card-border)'
                      }}
                    />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Results Section */}
      {auditData && !isScanning && (
        <div className="acc-results-container">
          {/* Domain Result Banner */}
          <div className="acc-domain-banner">
            <div className="acc-domain-title-group">
              <div className="acc-domain-favicon">
                <Globe size={20} />
              </div>
              <div>
                <div className="acc-domain-name">{auditData.domain}</div>
                <a
                  href={auditData.checkedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="acc-domain-url-link"
                >
                  <span>{auditData.checkedUrl}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="acc-banner-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsGeneratorOpen(true)}
                icon={<FileCode size={14} />}
              >
                Generate AI robots.txt
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCheck(auditData.checkedUrl)}
                icon={<RotateCcw size={14} />}
              >
                Re-check
              </Button>
            </div>
          </div>

          {/* AI Search Accessibility Score & KPI Overview Grid */}
          <div className="acc-overview-grid">
            {/* Score Card */}
            <div className="acc-score-card">
              <div className={`acc-score-circle ${auditData.score.tierColor}`}>
                <span className="acc-score-number">{auditData.score.score}</span>
                <span className="acc-score-total">/ 100</span>
              </div>
              <div>
                <h3 className="acc-score-label">AI Search Accessibility: {auditData.score.tier}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {auditData.summary.searchAccessibility.label}
                </span>
              </div>
              <p className="acc-score-disclaimer">
                This score measures technical accessibility, not your likelihood of ranking or being cited by AI systems.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="acc-kpi-grid">
              {/* AI Search Crawlers */}
              <div className="acc-kpi-card">
                <div className="acc-kpi-header">
                  <span>AI Search Accessibility</span>
                  <Search size={16} />
                </div>
                <div className="acc-kpi-value">
                  {auditData.summary.searchAccessibility.allowedCount} / {auditData.summary.searchAccessibility.totalCount}
                </div>
                <p className="acc-kpi-subtext">
                  Major AI search crawlers (ChatGPT, Claude, Perplexity) permitted to index content.
                </p>
              </div>

              {/* AI Training Access */}
              <div className="acc-kpi-card">
                <div className="acc-kpi-header">
                  <span>AI Training Access</span>
                  <Database size={16} />
                </div>
                <div className="acc-kpi-value">
                  {auditData.summary.trainingAccess.allowedCount} / {auditData.summary.trainingAccess.totalCount}
                </div>
                <p className="acc-kpi-subtext">
                  Model training bots (GPTBot, ClaudeBot, Google-Extended) permitted. Separate from search.
                </p>
              </div>

              {/* Homepage Indexability */}
              <div className="acc-kpi-card">
                <div className="acc-kpi-header">
                  <span>Homepage Indexability</span>
                  <Globe size={16} />
                </div>
                <div className="acc-kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {auditData.summary.homepageIndexability.isIndexable ? (
                    <>
                      <CheckCircle2 size={20} color="#10b981" />
                      <span style={{ color: '#059669', fontSize: '1.25rem' }}>Indexable</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={20} color="#ef4444" />
                      <span style={{ color: '#dc2626', fontSize: '1.25rem' }}>noindex</span>
                    </>
                  )}
                </div>
                <p className="acc-kpi-subtext">
                  {auditData.homepage.indexability.details}
                </p>
              </div>

              {/* robots.txt Status */}
              <div className="acc-kpi-card">
                <div className="acc-kpi-header">
                  <span>robots.txt Status</span>
                  <FileText size={16} />
                </div>
                <div className="acc-kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {auditData.robotsTxt.status === 'found' ? (
                    <>
                      <CheckCircle2 size={20} color="#10b981" />
                      <span style={{ color: '#059669', fontSize: '1.25rem' }}>Found (200 OK)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={20} color="#f59e0b" />
                      <span style={{ color: '#d97706', fontSize: '1.25rem' }}>
                        {auditData.robotsTxt.status === 'not_found' ? 'Not Found' : 'Unreachable'}
                      </span>
                    </>
                  )}
                </div>
                <p className="acc-kpi-subtext">
                  {auditData.robotsTxt.status === 'found'
                    ? `${auditData.robotsTxt.sitemaps.length} sitemap(s) declared.`
                    : 'No valid robots.txt file detected at root.'}
                </p>
              </div>
            </div>
          </div>

          {/* Top 3 Visual Search Cards (ChatGPT, Claude, Perplexity) */}
          <div className="acc-top-engines-row">
            {topEngines.map((engine, idx) => {
              const isAllowed = engine.status === 'allowed' || engine.status === 'default_allowed';
              const isBlocked = engine.status === 'blocked';
              return (
                <div key={idx} className="acc-engine-card">
                  <div className="acc-engine-meta">
                    <div className="acc-engine-icon-sq">
                      {engine.id === 'oai-searchbot' ? 'GPT' : engine.id === 'claude-searchbot' ? 'CLD' : 'PX'}
                    </div>
                    <div>
                      <h4 className="acc-engine-name">{engine.name}</h4>
                      <span className="acc-engine-ua">{engine.userAgent}</span>
                    </div>
                  </div>

                  <span
                    className={`acc-status-badge ${
                      isAllowed ? 'allowed' : isBlocked ? 'blocked' : 'partial'
                    }`}
                  >
                    {isAllowed ? (
                      <>
                        <CheckCircle2 size={13} /> Allowed
                      </>
                    ) : isBlocked ? (
                      <>
                        <XCircle size={13} /> Blocked
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={13} /> Partial
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* View Toolbar & Diagnostics Tabs */}
          <div className="acc-view-toolbar">
            <div className="acc-pill-group">
              <button
                type="button"
                className={`acc-pill-btn ${activeTab === 'rules' ? 'active' : ''}`}
                onClick={() => setActiveTab('rules')}
              >
                <Bot size={14} /> Crawler Permissions
              </button>
              <button
                type="button"
                className={`acc-pill-btn ${activeTab === 'robotstxt' ? 'active' : ''}`}
                onClick={() => setActiveTab('robotstxt')}
              >
                <FileCode size={14} /> robots.txt ({auditData.robotsTxt.status})
              </button>
              <button
                type="button"
                className={`acc-pill-btn ${activeTab === 'indexability' ? 'active' : ''}`}
                onClick={() => setActiveTab('indexability')}
              >
                <Globe size={14} /> Homepage & Headers
              </button>
              <button
                type="button"
                className={`acc-pill-btn ${activeTab === 'llms' ? 'active' : ''}`}
                onClick={() => setActiveTab('llms')}
              >
                <FileText size={14} /> llms.txt & Sitemap
              </button>
              <button
                type="button"
                className={`acc-pill-btn ${activeTab === 'simulator' ? 'active' : ''}`}
                onClick={() => setActiveTab('simulator')}
              >
                <Terminal size={14} /> HTTP Simulation
              </button>
            </div>

            {activeTab === 'rules' && (
              <div className="acc-pill-group">
                <button
                  type="button"
                  className={`acc-pill-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  Cards
                </button>
                <button
                  type="button"
                  className={`acc-pill-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: CRAWLER RULES (CARDS / TABLE VIEW) */}
          {activeTab === 'rules' && (
            <>
              {viewMode === 'cards' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {crawlerGroups.map((group) => {
                    if (group.id === 'other_openai' && !showOtherOpenAi) {
                      return (
                        <div key={group.id} style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                          <button
                            type="button"
                            className="acc-sample-btn"
                            onClick={() => setShowOtherOpenAi(true)}
                          >
                            + View Other OpenAI Crawlers ({group.crawlers.length})
                          </button>
                        </div>
                      );
                    }

                    return (
                      <section key={group.id} className="acc-crawler-section">
                        <div className="acc-group-header">
                          <div>
                            <h3 className="acc-group-title">{group.title}</h3>
                            <span className="acc-group-caption">{group.caption}</span>
                          </div>
                          {group.isCollapsible && (
                            <button
                              type="button"
                              className="acc-text-btn"
                              onClick={() => setShowOtherOpenAi(false)}
                            >
                              Hide
                            </button>
                          )}
                        </div>

                        <div className="acc-crawler-cards-grid">
                          {group.crawlers.map((crawler) => {
                            const isAllowed = crawler.status === 'allowed' || crawler.status === 'default_allowed';
                            const isBlocked = crawler.status === 'blocked';
                            const isPartial = crawler.status === 'partial';

                            return (
                              <div key={crawler.id} className="acc-crawler-card">
                                <div className="acc-card-top">
                                  <div className="acc-card-title-group">
                                    <h4>{crawler.name}</h4>
                                    <span className="acc-card-ua-tag">{crawler.userAgent}</span>
                                  </div>

                                  <span
                                    className={`acc-status-badge ${
                                      isAllowed ? 'allowed' : isBlocked ? 'blocked' : isPartial ? 'partial' : 'neutral'
                                    }`}
                                  >
                                    {isAllowed ? (
                                      <>
                                        <CheckCircle2 size={12} /> Allowed
                                      </>
                                    ) : isBlocked ? (
                                      <>
                                        <XCircle size={12} /> Blocked
                                      </>
                                    ) : isPartial ? (
                                      <>
                                        <AlertTriangle size={12} /> Partial
                                      </>
                                    ) : (
                                      <>
                                        <Info size={12} /> Default
                                      </>
                                    )}
                                  </span>
                                </div>

                                <p className="acc-card-purpose">{crawler.purpose}</p>

                                {crawler.matchedRule ? (
                                  <div className="acc-matched-rule-box">
                                    <strong>Matched rule:</strong>
                                    <br />
                                    {crawler.matchedRule}
                                  </div>
                                ) : (
                                  <div className="acc-matched-rule-box" style={{ opacity: 0.75 }}>
                                    No specific restriction found in robots.txt
                                  </div>
                                )}

                                <div className="acc-card-actions">
                                  <button
                                    type="button"
                                    className="acc-text-btn"
                                    onClick={() =>
                                      setActiveTooltip(activeTooltip === crawler.id ? null : crawler.id)
                                    }
                                  >
                                    <HelpCircle size={13} />
                                    <span>What's this?</span>
                                  </button>

                                  {crawler.matchedRule && (
                                    <button
                                      type="button"
                                      className="acc-text-btn"
                                      onClick={() => handleCopyText(crawler.matchedRule, crawler.id)}
                                    >
                                      {copiedSnippet === crawler.id ? <Check size={13} /> : <Copy size={13} />}
                                      <span>{copiedSnippet === crawler.id ? 'Copied' : 'Copy rule'}</span>
                                    </button>
                                  )}
                                </div>

                                {activeTooltip === crawler.id && (
                                  <div
                                    style={{
                                      background: 'rgba(150, 150, 150, 0.08)',
                                      borderRadius: '8px',
                                      padding: '0.65rem 0.85rem',
                                      fontSize: '0.8rem',
                                      lineHeight: 1.45,
                                      color: 'var(--text-muted)'
                                    }}
                                  >
                                    <strong>About {crawler.userAgent}:</strong> {crawler.purpose}
                                    {crawler.isProductToken && (
                                      <div style={{ marginTop: '0.35rem', color: 'var(--text-main)' }}>
                                        * Note: Google-Extended is a robots.txt product token; it does not issue standalone HTTP requests.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                /* Table View */
                <div className="acc-table-container">
                  <table className="acc-compare-table">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Crawler</th>
                        <th>Group</th>
                        <th>Status</th>
                        <th>Matched Directive</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditData.crawlers.map((crawler) => {
                        const isAllowed = crawler.status === 'allowed' || crawler.status === 'default_allowed';
                        const isBlocked = crawler.status === 'blocked';
                        const isPartial = crawler.status === 'partial';

                        return (
                          <tr key={crawler.id}>
                            <td>
                              <strong>{crawler.name}</strong>
                            </td>
                            <td>
                              <code>{crawler.userAgent}</code>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              {crawler.groupTitle}
                            </td>
                            <td>
                              <span
                                className={`acc-status-badge ${
                                  isAllowed ? 'allowed' : isBlocked ? 'blocked' : isPartial ? 'partial' : 'neutral'
                                }`}
                              >
                                {isAllowed ? 'Allowed' : isBlocked ? 'Blocked' : isPartial ? 'Partial' : 'Default'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                {crawler.matchedRule || 'No specific block'}
                              </span>
                            </td>
                            <td>
                              {crawler.matchedRule ? (
                                <button
                                  type="button"
                                  className="acc-text-btn"
                                  onClick={() => handleCopyText(crawler.matchedRule, `tbl-${crawler.id}`)}
                                >
                                  {copiedSnippet === `tbl-${crawler.id}` ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedSnippet === `tbl-${crawler.id}` ? 'Copied' : 'Copy'}</span>
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ROBOTS.TXT MONOSPACE VIEWER */}
          {activeTab === 'robotstxt' && (
            <div className="acc-code-viewer-card">
              <div className="acc-code-viewer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCode size={16} />
                  <span>{auditData.robotsTxt.url}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    ({auditData.robotsTxt.httpCode || 'No HTTP response'})
                  </span>
                </div>
                {auditData.robotsTxt.rawContent && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyText(auditData.robotsTxt.rawContent, 'raw-robots')}
                      icon={copiedSnippet === 'raw-robots' ? <Check size={13} /> : <Copy size={13} />}
                    >
                      {copiedSnippet === 'raw-robots' ? 'Copied' : 'Copy File'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadRobotsTxt(auditData.robotsTxt.rawContent)}
                      icon={<Download size={13} />}
                    >
                      Download
                    </Button>
                  </div>
                )}
              </div>

              {auditData.robotsTxt.rawContent ? (
                <pre className="acc-code-viewer-body">{auditData.robotsTxt.rawContent}</pre>
              ) : (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
                  <div>No robots.txt content could be retrieved.</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    {auditData.robotsTxt.error || 'HTTP 404 Not Found'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOMEPAGE & HTTP HEADERS DIAGNOSTICS */}
          {activeTab === 'indexability' && (
            <div className="acc-recommendations-wrapper">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                  Homepage Indexability & HTTP Headers
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  Inspected via server-side HTTP proxy to detect meta tags, redirects, and firewall protections.
                </p>
              </div>

              {auditData.homepage.botProtection?.isProtected && (
                <div className="acc-error-banner" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#b45309', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                      <strong>Bot Protection / WAF Detected:</strong> {auditData.homepage.botProtection.reason}
                      <div style={{ marginTop: '0.25rem', opacity: 0.9 }}>
                        Our test server could not access this resource normally. The actual crawler may receive a different response depending on provider IP whitelists and security rules.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="acc-kpi-grid">
                <div className="acc-kpi-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Final Canonical URL
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, wordBreak: 'break-all' }}>
                    {auditData.homepage.finalUrl}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    HTTP {auditData.homepage.httpCode} in {auditData.homepage.responseTimeMs}ms
                  </span>
                </div>

                <div className="acc-kpi-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    HTML &lt;meta name="robots"&gt;
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {auditData.homepage.indexability.metaRobots ? (
                      <code>{auditData.homepage.indexability.metaRobots}</code>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>None (Standard default index)</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Directives: {auditData.homepage.indexability.directives.join(', ') || 'index, follow'}
                  </span>
                </div>

                <div className="acc-kpi-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    HTTP Header X-Robots-Tag
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {auditData.homepage.indexability.xRobotsTag ? (
                      <code>{auditData.homepage.indexability.xRobotsTag}</code>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>None detected</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Governs non-HTML documents and global HTTP headers
                  </span>
                </div>

                <div className="acc-kpi-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Canonical Link Tag
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, wordBreak: 'break-all' }}>
                    {auditData.homepage.indexability.canonicalUrl ? (
                      <code>{auditData.homepage.indexability.canonicalUrl}</code>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No explicit canonical tag</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Prevents duplicate content splitting in AI search indices
                  </span>
                </div>
              </div>

              {/* Redirect Chain */}
              {auditData.homepage.redirectChain?.length > 1 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Redirect Chain</h5>
                  <div className="acc-matched-rule-box">
                    {auditData.homepage.redirectChain.map((hop, idx) => (
                      <div key={idx} style={{ marginBottom: '0.25rem' }}>
                        {idx + 1}. {hop.url} → <strong>HTTP {hop.status}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LLMS.TXT & SITEMAP */}
          {activeTab === 'llms' && (
            <div className="acc-recommendations-wrapper">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                  Emerging AI Standards: llms.txt & XML Sitemaps
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  Evaluating structured discovery paths for Large Language Models and automated crawlers.
                </p>
              </div>

              <div className="acc-kpi-grid">
                {/* llms.txt Box */}
                <div className="acc-kpi-card">
                  <div className="acc-kpi-header">
                    <span>llms.txt Specification</span>
                    <FileText size={16} />
                  </div>
                  <div className="acc-kpi-value">
                    {auditData.llmsTxt?.status === 'found' ? (
                      <span style={{ color: '#059669' }}>✅ Found</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>ℹ️ Not Found</span>
                    )}
                  </div>
                  <p className="acc-kpi-subtext">
                    {auditData.llmsTxt?.status === 'found'
                      ? `Located at ${auditData.llmsTxt.url} (${(auditData.llmsTxt.sizeBytes / 1024).toFixed(1)} KB)`
                      : 'llms.txt is an emerging convention for providing AI-oriented information. Its presence does not guarantee indexing or citation.'}
                  </p>
                </div>

                {/* Sitemap Box */}
                <div className="acc-kpi-card">
                  <div className="acc-kpi-header">
                    <span>XML Sitemap</span>
                    <Globe size={16} />
                  </div>
                  <div className="acc-kpi-value">
                    {auditData.sitemap?.status === 'found' ? (
                      <span style={{ color: '#059669' }}>✅ Sitemap Found</span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>❌ Missing / Inaccessible</span>
                    )}
                  </div>
                  <p className="acc-kpi-subtext">
                    {auditData.sitemap?.status === 'found'
                      ? `URL: ${auditData.sitemap.url} ${auditData.sitemap.estimatedUrls ? `(~${auditData.sitemap.estimatedUrls} URLs)` : ''}`
                      : 'Neither robots.txt nor /sitemap.xml yielded a reachable sitemap.'}
                  </p>
                </div>
              </div>

              {auditData.llmsTxt?.snippet && (
                <div>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                    llms.txt Preview Snippet
                  </h5>
                  <pre className="acc-code-viewer-body" style={{ maxHeight: 200 }}>
                    {auditData.llmsTxt.snippet}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ADVANCED USER-AGENT HTTP SIMULATION */}
          {activeTab === 'simulator' && (
            <div className="acc-recommendations-wrapper">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                  Simulated User-Agent HTTP Probe
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  Test how the target web server responds when presented with specific crawler User-Agent headers.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.84rem',
                  color: '#b45309'
                }}
              >
                <strong>Important Notice:</strong> This request simulates the User-Agent string only. It does not originate from the crawler provider's official ASN or IP infrastructure.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <select
                  value={simSelectedCrawler}
                  onChange={(e) => setSimSelectedCrawler(e.target.value)}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '0.55rem 1rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="oai-searchbot">ChatGPT Search (OAI-SearchBot)</option>
                  <option value="claude-searchbot">Claude Search (Claude-SearchBot)</option>
                  <option value="perplexitybot">Perplexity Search (PerplexityBot)</option>
                  <option value="gptbot">OpenAI Training (GPTBot)</option>
                  <option value="claudebot">Claude Training (ClaudeBot)</option>
                  <option value="oai-adsbot">OpenAI AdsBot (OAI-AdsBot)</option>
                </select>

                <Button
                  variant="primary"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  icon={isSimulating ? <Clock size={14} className="spin" /> : <Terminal size={14} />}
                >
                  {isSimulating ? 'Simulating...' : 'Run HTTP Simulation'}
                </Button>
              </div>

              {simError && (
                <div className="acc-error-banner">
                  <AlertTriangle size={16} />
                  <span>{simError}</span>
                </div>
              )}

              {simResult && (
                <div className="acc-matched-rule-box" style={{ background: 'var(--card-bg)' }}>
                  <div>
                    <strong>Target Crawler:</strong> {simResult.simulatedCrawler}
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>User-Agent Header:</strong> <code>{simResult.userAgentHeader}</code>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>Response Status:</strong> HTTP {simResult.httpCode} {simResult.statusText} ({simResult.responseTimeMs}ms)
                  </div>
                  {simResult.botProtection?.reason && (
                    <div style={{ marginTop: '0.25rem', color: '#d97706' }}>
                      <strong>Firewall Diagnostic:</strong> {simResult.botProtection.reason}
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {simResult.disclaimer}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations Card */}
          {auditData.recommendations?.length > 0 && (
            <div className="acc-recommendations-wrapper">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.4rem 0' }}>
                  Tailored robots.txt Recommendations
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  Deterministic configurations to optimize AI discovery while preserving policy preferences.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {auditData.recommendations.map((rec) => (
                  <div key={rec.id} className="acc-rec-item">
                    <h4>
                      {rec.type === 'search_allow' ? (
                        <CheckCircle2 size={16} color="#10b981" />
                      ) : (
                        <Sliders size={16} color="#3b82f6" />
                      )}
                      <span>{rec.title}</span>
                    </h4>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                      {rec.description}
                    </p>

                    {rec.suggestedSnippet && (
                      <div className="acc-rec-snippet-box">
                        <pre style={{ margin: 0 }}>{rec.suggestedSnippet}</pre>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopyText(rec.suggestedSnippet, rec.id)}
                          icon={copiedSnippet === rec.id ? <Check size={12} /> : <Copy size={12} />}
                        >
                          {copiedSnippet === rec.id ? 'Copied' : 'Copy Rule'}
                        </Button>
                      </div>
                    )}

                    {rec.snippets && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                        <div className="acc-rec-snippet-box">
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#059669', display: 'block', fontWeight: 600 }}>
                              To Allow:
                            </span>
                            <pre style={{ margin: 0 }}>{rec.snippets.allow}</pre>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopyText(rec.snippets.allow, `${rec.id}-allow`)}
                          >
                            {copiedSnippet === `${rec.id}-allow` ? 'Copied' : 'Copy'}
                          </Button>
                        </div>

                        <div className="acc-rec-snippet-box">
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'block', fontWeight: 600 }}>
                              To Block:
                            </span>
                            <pre style={{ margin: 0 }}>{rec.snippets.disallow}</pre>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopyText(rec.snippets.disallow, `${rec.id}-block`)}
                          >
                            {copiedSnippet === `${rec.id}-block` ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Interactive robots.txt Generator Modal */}
      {isGeneratorOpen && (
        <div className="acc-modal-overlay" onClick={() => setIsGeneratorOpen(false)}>
          <div className="acc-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="acc-modal-header">
              <h3>Generate AI-Friendly robots.txt</h3>
              <button
                type="button"
                className="acc-error-close"
                onClick={() => setIsGeneratorOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
              Select which AI platforms are allowed to index content for search and which are permitted to scrape for foundation model training.
            </p>

            <div className="acc-toggles-grid">
              {/* AI Search Toggles */}
              <div className="acc-toggle-group">
                <h5>AI Search & Discovery (Recommended: ON)</h5>
                <label className="acc-checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorRules.oaiSearch}
                    onChange={(e) =>
                      setGeneratorRules({ ...generatorRules, oaiSearch: e.target.checked })
                    }
                  />
                  <span>ChatGPT Search (OAI-SearchBot)</span>
                </label>
                <label className="acc-checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorRules.claudeSearch}
                    onChange={(e) =>
                      setGeneratorRules({ ...generatorRules, claudeSearch: e.target.checked })
                    }
                  />
                  <span>Claude Search (Claude-SearchBot)</span>
                </label>
                <label className="acc-checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorRules.perplexity}
                    onChange={(e) =>
                      setGeneratorRules({ ...generatorRules, perplexity: e.target.checked })
                    }
                  />
                  <span>Perplexity (PerplexityBot)</span>
                </label>
              </div>

              {/* AI Training Toggles */}
              <div className="acc-toggle-group">
                <h5>Model Training (Publisher Policy)</h5>
                <label className="acc-checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorRules.gptBot}
                    onChange={(e) =>
                      setGeneratorRules({ ...generatorRules, gptBot: e.target.checked })
                    }
                  />
                  <span>OpenAI Training (GPTBot)</span>
                </label>
                <label className="acc-checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorRules.claudeBot}
                    onChange={(e) =>
                      setGeneratorRules({ ...generatorRules, claudeBot: e.target.checked })
                    }
                  />
                  <span>Anthropic Training (ClaudeBot)</span>
                </label>
                <label className="acc-checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorRules.googleExtended}
                    onChange={(e) =>
                      setGeneratorRules({ ...generatorRules, googleExtended: e.target.checked })
                    }
                  />
                  <span>Google / Gemini AI (Google-Extended)</span>
                </label>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Generated Output:
              </span>
              <pre className="acc-modal-preview">{generatedRobotsTxt}</pre>
            </div>

            <div className="acc-modal-footer">
              <Button
                variant="secondary"
                onClick={() => {
                  handleCopyText(generatedRobotsTxt, 'modal-robots');
                  setIsGeneratedCopied(true);
                  setTimeout(() => setIsGeneratedCopied(false), 2000);
                }}
                icon={isGeneratedCopied ? <Check size={14} /> : <Copy size={14} />}
              >
                {isGeneratedCopied ? 'Copied to Clipboard' : 'Copy robots.txt'}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownloadRobotsTxt(generatedRobotsTxt)}
                icon={<Download size={14} />}
              >
                Download robots.txt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Google AdSense Banner Slot */}
      <div style={{ marginTop: '1.5rem' }}>
        <AdSlot format="horizontal" slotId="4093371757" />
      </div>

      {/* 7. Structured SEO Divider and Comprehensive Technical Guide */}
      <ToolSeoDivider label="AI Web Crawlers & robots.txt Verification Architecture" />
      <AiCrawlerCheckerSeo />
    </div>
  );
}
