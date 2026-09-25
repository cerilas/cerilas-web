import React, { useState, useEffect } from 'react';
import {
  Eye,
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Download,
  RotateCcw,
  Globe,
  ChevronDown,
  ChevronUp,
  Link2,
  TrendingUp,
  Building,
  Check,
  Users,
  Activity,
  Clock,
  Lock,
  Bot,
  Languages,
  Cpu,
  Compass,
  MapPin
} from 'lucide-react';
import { aiVisibilityCheckerManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import { Button, Badge, ToolHeader, QuotaModal } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import AiVisibilityCheckerSeo from './components/AiVisibilityCheckerSeo';
import AiVisibilityDropdown from './components/AiVisibilityDropdown';
import FlagIcon from './components/FlagIcon';
import './ai-visibility-checker.css';

const MARKET_OPTIONS = [
  {
    value: 'auto',
    icon: (
      <div className="aivc-icon-badge">
        <Compass size={13} color="#3b82f6" />
      </div>
    ),
    label: 'Auto-Detect Market',
    code: 'AUTO',
    desc: 'Inferred automatically from domain TLD & server'
  },
  {
    value: 'US',
    icon: <FlagIcon code="US" />,
    label: 'United States',
    code: 'US',
    desc: 'Google US live search grounding'
  },
  {
    value: 'GB',
    icon: <FlagIcon code="GB" />,
    label: 'United Kingdom',
    code: 'UK',
    desc: 'Google UK live search index'
  },
  {
    value: 'TR',
    icon: <FlagIcon code="TR" />,
    label: 'Turkey (Türkiye)',
    code: 'TR',
    desc: 'Google Türkiye localized queries'
  },
  {
    value: 'DE',
    icon: <FlagIcon code="DE" />,
    label: 'Germany (Deutschland)',
    code: 'DE',
    desc: 'Google Deutschland search index'
  },
  {
    value: 'FR',
    icon: <FlagIcon code="FR" />,
    label: 'France',
    code: 'FR',
    desc: 'Google France localized results'
  },
  {
    value: 'CA',
    icon: <FlagIcon code="CA" />,
    label: 'Canada',
    code: 'CA',
    desc: 'Google Canada search index'
  },
  {
    value: 'AU',
    icon: <FlagIcon code="AU" />,
    label: 'Australia',
    code: 'AU',
    desc: 'Google Australia search index'
  },
  {
    value: 'ES',
    icon: <FlagIcon code="ES" />,
    label: 'Spain (España)',
    code: 'ES',
    desc: 'Google España search grounding'
  },
  {
    value: 'IT',
    icon: <FlagIcon code="IT" />,
    label: 'Italy (Italia)',
    code: 'IT',
    desc: 'Google Italia localized search'
  },
  {
    value: 'NL',
    icon: <FlagIcon code="NL" />,
    label: 'Netherlands (Nederland)',
    code: 'NL',
    desc: 'Google Nederland search index'
  },
  {
    value: 'GLOBAL',
    icon: (
      <div className="aivc-icon-badge emerald">
        <Globe size={13} color="#10b981" />
      </div>
    ),
    label: 'Global / Worldwide',
    code: 'GLOBAL',
    desc: 'Worldwide unlocalized search index'
  }
];

const LANGUAGE_OPTIONS = [
  {
    value: 'auto',
    icon: (
      <div className="aivc-icon-badge purple">
        <Sparkles size={13} color="#8b5cf6" />
      </div>
    ),
    label: 'Auto-Detect Language',
    code: 'AUTO',
    desc: 'Extracted from website HTML lang & content'
  },
  {
    value: 'en',
    icon: <FlagIcon code="US" />,
    label: 'English',
    code: 'EN',
    desc: 'Global commercial & informational queries'
  },
  {
    value: 'tr',
    icon: <FlagIcon code="TR" />,
    label: 'Turkish (Türkçe)',
    code: 'TR',
    desc: 'Native Turkish search queries'
  },
  {
    value: 'de',
    icon: <FlagIcon code="DE" />,
    label: 'German (Deutsch)',
    code: 'DE',
    desc: 'Native German search queries'
  },
  {
    value: 'fr',
    icon: <FlagIcon code="FR" />,
    label: 'French (Français)',
    code: 'FR',
    desc: 'Native French search queries'
  },
  {
    value: 'es',
    icon: <FlagIcon code="ES" />,
    label: 'Spain (Español)',
    code: 'ES',
    desc: 'Native Spanish search queries'
  },
  {
    value: 'it',
    icon: <FlagIcon code="IT" />,
    label: 'Italian (Italiano)',
    code: 'IT',
    desc: 'Native Italian search queries'
  },
  {
    value: 'nl',
    icon: <FlagIcon code="NL" />,
    label: 'Dutch (Nederlands)',
    code: 'NL',
    desc: 'Native Dutch search queries'
  },
  {
    value: 'pt',
    icon: <FlagIcon code="PT" />,
    label: 'Portuguese (Português)',
    code: 'PT',
    desc: 'Native Portuguese search queries'
  },
  {
    value: 'ar',
    icon: <FlagIcon code="AR" />,
    label: 'Arabic (العربية)',
    code: 'AR',
    desc: 'Native Arabic search queries'
  }
];

const SAMPLE_SITES = [
  { name: 'Cerilas Tech', url: 'cerilas.com' },
  { name: 'Wikipedia', url: 'wikipedia.org' },
  { name: 'OpenAI', url: 'openai.com' },
  { name: 'Medium', url: 'medium.com' }
];

const SCAN_STEPS = [
  'Connecting to target website and downloading raw HTML...',
  'Extracting title, meta tags, and body content without AI...',
  'Generating top 10 realistic user search queries with advanced AI models...',
  'Querying Google Search Grounding for each prompt against live web data...',
  'Calculating citation rates, brand mentions, and competitor rankings...'
];

const formatShortCitationUrl = (rawUrl) => {
  if (!rawUrl) return 'View Cited Page';
  try {
    const parsed = new URL(rawUrl);
    const domain = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname !== '/' && parsed.pathname ? parsed.pathname : '';
    if (!path) return domain;
    const cleanPath = path.length > 20 ? `${path.slice(0, 16)}…` : path;
    return `${domain}${cleanPath}`;
  } catch {
    return 'View Cited Source';
  }
};

export default function AiVisibilityChecker({ onBack, toolMeta }) {
  const {
    trackUse,
    trackCopy,
    trackDownload,
    visitorCount,
    conversionCount,
    getConversionLabel
  } = useToolAnalytics(aiVisibilityCheckerManifest.slug, toolMeta);

  // Form State
  const [inputUrl, setInputUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('auto');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // AI Usage Limit & Quota State
  const [quota, setQuota] = useState({ allowed: true, limit: 3, used: 0, remaining: 3, resetInMinutes: 60 });
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);

  // Live Real-Time Sub-Steps Probing State
  const [liveQueries, setLiveQueries] = useState([]);
  const [probeResultsMap, setProbeResultsMap] = useState({});
  const [probingQueryId, setProbingQueryId] = useState(null);
  const [probeProgress, setProbeProgress] = useState({ completed: 0, total: 10 });

  // Result State
  const [auditData, setAuditData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'cited' | 'mentioned' | 'not_cited'
  const [expandedQueries, setExpandedQueries] = useState({});
  const [copiedJson, setCopiedJson] = useState(false);

  // Fetch initial AI quota on mount
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const vid = getOrCreateVisitorId();
        const res = await fetch(`/api/tools/${aiVisibilityCheckerManifest.slug}/ai-quota?visitorId=${encodeURIComponent(vid)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quota) {
            setQuota(data.quota);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch AI quota:', e);
      }
    };
    fetchQuota();
  }, []);

  const toggleQuery = (id) => {
    setExpandedQueries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleScanFallback = async (cleanUrl) => {
    const vid = getOrCreateVisitorId();
    const res = await fetch('/api/tools/ai-visibility-checker/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: cleanUrl,
        country: selectedCountry,
        language: selectedLanguage,
        visitorId: vid
      })
    });
    const data = await res.json();
    if (data.quota) {
      setQuota(data.quota);
    }
    if (!res.ok || !data.success) {
      if (res.status === 429 || data.quota?.allowed === false) {
        setQuotaModalOpen(true);
        return;
      }
      throw new Error(data.error || 'The AI Visibility audit could not be completed.');
    }
    setAuditData(data);
    if (data.report?.results?.length > 0) {
      setExpandedQueries({
        [data.report.results[0].id]: true,
        [data.report.results[1]?.id]: true
      });
    }
    trackUse({ domain: cleanUrl, score: data.report?.visibilityScore });
  };

  const handleScan = async (overrideUrl = null) => {
    const cleanUrl = (overrideUrl || inputUrl).trim();
    if (!cleanUrl) {
      setErrorMessage('Please enter a website URL to audit.');
      return;
    }

    if (quota.remaining <= 0) {
      setQuotaModalOpen(true);
      return;
    }

    const vid = getOrCreateVisitorId();
    setErrorMessage(null);
    setIsScanning(true);
    setScanStepIndex(0);
    setLiveQueries([]);
    setProbeResultsMap({});
    setProbingQueryId(null);
    setProbeProgress({ completed: 0, total: 10 });

    try {
      const response = await fetch('/api/tools/ai-visibility-checker/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanUrl,
          country: selectedCountry,
          language: selectedLanguage,
          visitorId: vid
        })
      });

      if (!response.ok || !response.body) {
        return await handleScanFallback(cleanUrl);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evtBlock of events) {
          if (!evtBlock.trim()) continue;

          const eventMatch = evtBlock.match(/^event:\s*([^\r\n]+)/m);
          const dataMatch = evtBlock.match(/^data:\s*([\s\S]+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1].trim();
          let data;
          try {
            data = JSON.parse(dataMatch[1].trim());
          } catch {
            continue;
          }

          if (eventType === 'step') {
            if (typeof data.stepIndex === 'number') {
              setScanStepIndex(data.stepIndex);
            }
          } else if (eventType === 'queries_ready') {
            if (Array.isArray(data.queries)) {
              setLiveQueries(data.queries);
              setProbeProgress(prev => ({ ...prev, total: data.queries.length }));
            }
          } else if (eventType === 'probe_start') {
            setProbingQueryId(data.id);
            setScanStepIndex(3);
          } else if (eventType === 'probe_result') {
            setProbeResultsMap(prev => ({
              ...prev,
              [data.id]: data
            }));
            setProbeProgress(prev => ({
              completed: data.completedCount ?? (prev.completed + 1),
              total: data.total ?? prev.total
            }));
          } else if (eventType === 'complete') {
            receivedComplete = true;
            setAuditData(data);
            if (data.quota) {
              setQuota(data.quota);
            }
            if (data.report?.results?.length > 0) {
              setExpandedQueries({
                [data.report.results[0].id]: true,
                [data.report.results[1]?.id]: true
              });
            }
            trackUse({ domain: cleanUrl, score: data.report?.visibilityScore });
          } else if (eventType === 'error') {
            if (data.quota) {
              setQuota(data.quota);
              if (data.quota.allowed === false) {
                setQuotaModalOpen(true);
                return;
              }
            }
            throw new Error(data.error || 'An error occurred during AI visibility scanning.');
          }
        }
      }

      if (!receivedComplete) {
        await handleScanFallback(cleanUrl);
      }
    } catch (err) {
      console.warn('Streaming error, attempting fallback:', err.message);
      try {
        await handleScanFallback(cleanUrl);
      } catch (fallbackErr) {
        setErrorMessage(fallbackErr.message || err.message || 'Network error occurred while analyzing the domain.');
      }
    } finally {
      setIsScanning(false);
      setProbingQueryId(null);
    }
  };

  const handleCopyReport = () => {
    if (!auditData) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(auditData, null, 2));
      setCopiedJson(true);
      trackCopy({ type: 'json' });
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleDownloadReport = () => {
    if (!auditData) return;
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-visibility-report-${auditData.report?.domain || 'audit'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackDownload({ format: 'json' });
  };

  const filteredQueries = auditData?.report?.results?.filter(item => {
    if (activeFilter === 'all') return true;
    return item.status === activeFilter;
  }) || [];

  const getScoreCircleClass = (score) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'brand';
    if (score >= 20) return 'warning';
    return 'danger';
  };

  return (
    <div className="c-tool-page-container aivc-root">
      {/* 1. Header with Breadcrumbs and Visitor Badges */}
      <ToolHeader
        title={aiVisibilityCheckerManifest.title}
        subtitle={aiVisibilityCheckerManifest.shortDescription}
        onBack={onBack}
        slug={aiVisibilityCheckerManifest.slug}
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
            <div
              onClick={() => setQuotaModalOpen(true)}
              style={{ cursor: 'pointer' }}
              title="Click to view hourly AI quota details"
            >
              <Badge
                variant={quota.remaining > 0 ? 'neutral' : 'warning'}
                icon={quota.remaining > 0 ? <Clock size={12} strokeWidth={2} /> : <Lock size={12} strokeWidth={2} />}
              >
                {quota.remaining} / {quota.limit} Hourly Audits Left
              </Badge>
            </div>
            <Badge variant="neutral" icon={<Sparkles size={12} strokeWidth={2} />}>
              Advanced AI Infrastructure
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              Live Search Grounding
            </Badge>
          </>
        }
      />

      {/* Reusable Quota Reached Modal */}
      <QuotaModal
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        limit={quota.limit}
        resetInMinutes={quota.resetInMinutes}
        toolName="AI Visibility Checker"
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="aivc-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="aivc-error-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* 2. Hero Search Bar Card (Permanently rendered to avoid layout shifts) */}
      <div className="aivc-hero-card">
        <div className="aivc-hero-header">
          <span className="aivc-hero-eyebrow">
            <Eye size={14} /> Free AI Search Visibility &amp; Citations Audit
          </span>

          <h2 className="aivc-hero-title">
            Is your website cited by{' '}
            <span className="aivc-inline-logos-stack" aria-label="AI search">
              <span className="sr-only">AI search </span>
              <span className="aivc-inline-logo-bubble" title="Google Gemini">
                <img src="/AI-logos/gemini-color.svg" alt="Google Gemini" width={22} height={22} loading="eager" />
              </span>
              <span className="aivc-inline-logo-bubble" title="ChatGPT Search">
                <img src="/AI-logos/chatgpt-black.svg" alt="ChatGPT Search" width={20} height={20} loading="eager" />
              </span>
              <span className="aivc-inline-logo-bubble" title="Perplexity AI">
                <img src="/AI-logos/perplexity-color.svg" alt="Perplexity AI" width={20} height={20} loading="eager" />
              </span>
              <span className="aivc-inline-logo-bubble" title="Claude (Anthropic)">
                <img src="/AI-logos/claude-color.svg" alt="Claude" width={20} height={20} loading="eager" />
              </span>
              <span className="aivc-inline-logo-bubble" title="Grok (xAI)">
                <img src="/AI-logos/grok-black.svg" alt="Grok" width={18} height={18} loading="eager" />
              </span>
              <span className="aivc-inline-logo-bubble" title="Google Search Grounding">
                <img src="/AI-logos/google-color.svg" alt="Google Grounding" width={20} height={20} loading="eager" />
              </span>
            </span>{' '}
            engines?
          </h2>

          <p className="aivc-hero-subtitle">
            Audit how Gemini, ChatGPT Search, and Perplexity quote your brand. Automatically extracts the top 10 search queries from your content and evaluates live web citation grounding.
          </p>
        </div>

        <form
          className="aivc-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
        >
          <div className="aivc-input-wrapper">
            <Globe className="aivc-input-icon" size={20} />
            <input
              type="text"
              className="aivc-input-field"
              placeholder="https://yourwebsite.com (e.g., cerilas.com)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={isScanning}
              spellCheck="false"
              autoCapitalize="none"
              autoCorrect="off"
              aria-label="Website URL to audit for AI citations"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isScanning || !inputUrl.trim()}
              icon={isScanning ? <Clock size={16} className="spin" /> : <Search size={16} />}
            >
              {isScanning ? 'Auditing Visibility...' : 'Audit AI Visibility'}
            </Button>
          </div>

          {/* Target Geotargeting & Query Language Custom Dropdowns */}
          <div className="aivc-targeting-row">
            <AiVisibilityDropdown
              id="aivc-select-country"
              label="Target Market"
              icon={<Globe size={13} color="#3b82f6" />}
              options={MARKET_OPTIONS}
              value={selectedCountry}
              onChange={setSelectedCountry}
              disabled={isScanning}
            />

            <AiVisibilityDropdown
              id="aivc-select-language"
              label="Query Language"
              icon={<Languages size={13} color="#8b5cf6" />}
              options={LANGUAGE_OPTIONS}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              disabled={isScanning}
            />
          </div>

          <div className="aivc-samples-row">
            <span>Try sample domain:</span>
            {SAMPLE_SITES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="aivc-sample-btn"
                onClick={() => {
                  setInputUrl(sample.url);
                  handleScan(sample.url);
                }}
                disabled={isScanning}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </form>

        <div className="aivc-hero-guarantees">
          <div className="aivc-guarantee-item">
            <div className="aivc-guarantee-icon-wrap aivc-icon-emerald">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <div className="aivc-guarantee-text">
              <span className="aivc-guarantee-title">100% Free Forever</span>
              <span className="aivc-guarantee-desc">No Sign-up Required</span>
            </div>
          </div>

          <div className="aivc-guarantee-divider" />

          <div className="aivc-guarantee-item">
            <div className="aivc-guarantee-icon-wrap aivc-icon-blue">
              <Cpu size={18} strokeWidth={2.2} />
            </div>
            <div className="aivc-guarantee-text">
              <span className="aivc-guarantee-title">Advanced AI Infrastructure</span>
              <span className="aivc-guarantee-desc">State-of-the-Art Architecture</span>
            </div>
          </div>

          <div className="aivc-guarantee-divider" />

          <div className="aivc-guarantee-item">
            <div className="aivc-guarantee-icon-wrap aivc-icon-purple">
              <Globe size={18} strokeWidth={2.2} />
            </div>
            <div className="aivc-guarantee-text">
              <span className="aivc-guarantee-title">Live Search Grounding</span>
              <span className="aivc-guarantee-desc">Real-Time Citation Probing</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Animated Multi-Step Scan Progress */}
      {isScanning && (
        <div className="aivc-progress-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
            <Clock size={18} className="spin" />
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Analyzing Website & AI Grounding Citations...
            </strong>
          </div>

          <div className="aivc-progress-steps">
            {SCAN_STEPS.map((step, idx) => {
              const isDone = idx < scanStepIndex;
              const isCurrent = idx === scanStepIndex;
              return (
                <div
                  key={idx}
                  className={`aivc-progress-step ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} color="#10b981" />
                  ) : isCurrent ? (
                    <Clock size={16} className="spin" />
                  ) : (
                    <div className="aivc-step-bullet" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>

          <div className="aivc-progress-bar-track">
            <div
              className="aivc-progress-bar-fill"
              style={{ width: `${((scanStepIndex + 1) / SCAN_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Sub-steps: Live Probing of the 10 Search Grounding Queries */}
          {liveQueries.length > 0 && (
            <div className="aivc-live-probing-container">
              <div className="aivc-live-probing-header">
                <div className="aivc-live-probing-title">
                  <Sparkles size={16} color="#3b82f6" />
                  <span>
                    Sub-step: Testing Citations on 10 High-Intent Queries ({probeProgress.completed} / {liveQueries.length} Done)
                  </span>
                </div>
                <div className="aivc-live-probing-stat">
                  {Math.round((probeProgress.completed / liveQueries.length) * 100)}%
                </div>
              </div>

              <div className="aivc-live-subbar-track">
                <div
                  className="aivc-live-subbar-fill"
                  style={{ width: `${(probeProgress.completed / liveQueries.length) * 100}%` }}
                />
              </div>

              <div className="aivc-live-queries-list">
                {liveQueries.map((q, idx) => {
                  const result = probeResultsMap[q.id];
                  const isProbing = probingQueryId === q.id;
                  const isProbed = !!result;

                  let itemStatusClass = 'queued';
                  if (isProbed) {
                    if (result.isCited) itemStatusClass = 'cited';
                    else if (result.isMentioned) itemStatusClass = 'mentioned';
                    else itemStatusClass = 'not-cited';
                  } else if (isProbing) {
                    itemStatusClass = 'probing';
                  }

                  return (
                    <div key={q.id || idx} className={`aivc-live-query-item ${itemStatusClass}`}>
                      <div className="aivc-live-query-left">
                        <span className="aivc-live-query-num">#{idx + 1}</span>
                        <div className="aivc-live-query-text-wrap">
                          <span className="aivc-live-query-text">"{q.query}"</span>
                          {q.intent && (
                            <span className="aivc-intent-badge">{q.intent}</span>
                          )}
                        </div>
                      </div>

                      <div className="aivc-live-query-status">
                        {isProbed ? (
                          result.isCited ? (
                            <span className="aivc-sub-badge cited">
                              <CheckCircle2 size={13} />
                              Cited
                            </span>
                          ) : result.isMentioned ? (
                            <span className="aivc-sub-badge mentioned">
                              <Sparkles size={13} />
                              Mentioned
                            </span>
                          ) : (
                            <span className="aivc-sub-badge not-cited">
                              <XCircle size={13} />
                              Not Cited
                            </span>
                          )
                        ) : isProbing ? (
                          <span className="aivc-sub-badge probing">
                            <Clock size={13} className="spin" />
                            Probing Grounding...
                          </span>
                        ) : (
                          <span className="aivc-sub-badge queued">
                            Queued
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Complete Audit Results View */}
      {auditData && !isScanning && (
        <div className="aivc-results-container">
          {/* Domain Result Banner */}
          <div className="aivc-domain-banner">
            <div className="aivc-domain-title-group">
              <div className="aivc-domain-favicon">
                <Globe size={20} />
              </div>
              <div>
                <div className="aivc-domain-name">{auditData.report?.domain}</div>
                <div className="aivc-domain-meta">
                  <span className="aivc-tag">{auditData.scraped?.title || 'No Title'}</span>
                  <span className="aivc-tag">{auditData.scraped?.wordCount || 0} Words</span>
                  <span className="aivc-tag">Market: {auditData.market?.countryName || 'Global'}</span>
                  <span className="aivc-tag">Language: {auditData.market?.languageName || 'English'}</span>
                </div>
              </div>
            </div>

            <div className="aivc-banner-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleScan(auditData.report?.domain)}
                icon={<RotateCcw size={14} />}
              >
                Re-check
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyReport}
                icon={copiedJson ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              >
                {copiedJson ? 'Copied' : 'Copy JSON'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadReport}
                icon={<Download size={14} />}
              >
                Download Report
              </Button>
            </div>
          </div>

          {/* AI Visibility Score & Overview Grid */}
          <div className="aivc-overview-grid">
            {/* Score Card */}
            <div className="aivc-score-card">
              <div className={`aivc-score-circle ${getScoreCircleClass(auditData.report?.visibilityScore || 0)}`}>
                <span className="aivc-score-number">{auditData.report?.visibilityScore || 0}%</span>
                <span className="aivc-score-total">Score</span>
              </div>
              <div>
                <h3 className="aivc-score-label">
                  AI Visibility: Grade {auditData.report?.visibilityGrade || 'N/A'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Citation and brand inclusion across 10 high-intent queries tested against frontier AI search engines.
                </span>
              </div>
              <p className="aivc-score-disclaimer">
                Evaluates live Google Search Grounding citations and source hyperlinks referenced in frontier AI responses.
              </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="aivc-kpi-grid">
              {/* Directly Cited */}
              <div className="aivc-kpi-card" style={{ borderLeft: '3px solid #10b981' }}>
                <div className="aivc-kpi-header">
                  <span>Directly Cited</span>
                  <CheckCircle2 size={16} color="#10b981" />
                </div>
                <div className="aivc-kpi-value" style={{ color: '#10b981' }}>
                  {auditData.report?.citedCount || 0} <span className="aivc-kpi-sub">/ 10</span>
                </div>
                <div className="aivc-kpi-desc">
                  Frontier AI search provided a direct clickable citation backlink to your website.
                </div>
              </div>

              {/* Brand Mentioned */}
              <div className="aivc-kpi-card" style={{ borderLeft: '3px solid #3b82f6' }}>
                <div className="aivc-kpi-header">
                  <span>Brand Mentioned</span>
                  <Sparkles size={16} color="#3b82f6" />
                </div>
                <div className="aivc-kpi-value" style={{ color: '#3b82f6' }}>
                  {auditData.report?.mentionedCount || 0} <span className="aivc-kpi-sub">/ 10</span>
                </div>
                <div className="aivc-kpi-desc">
                  Your brand was named in the response without a direct citation link.
                </div>
              </div>

              {/* Not Cited */}
              <div className="aivc-kpi-card" style={{ borderLeft: '3px solid #9ca3af' }}>
                <div className="aivc-kpi-header">
                  <span>Not Cited</span>
                  <XCircle size={16} color="#9ca3af" />
                </div>
                <div className="aivc-kpi-value" style={{ color: '#9ca3af' }}>
                  {auditData.report?.uncitedCount || 0} <span className="aivc-kpi-sub">/ 10</span>
                </div>
                <div className="aivc-kpi-desc">
                  Third-party articles or competitor domains were referenced instead.
                </div>
              </div>

              {/* Monitored Queries */}
              <div className="aivc-kpi-card" style={{ borderLeft: '3px solid #8b5cf6' }}>
                <div className="aivc-kpi-header">
                  <span>Total Probes</span>
                  <Bot size={16} color="#8b5cf6" />
                </div>
                <div className="aivc-kpi-value" style={{ color: 'var(--text-main)' }}>
                  {auditData.report?.results?.length || 10} <span className="aivc-kpi-sub">Queries</span>
                </div>
                <div className="aivc-kpi-desc">
                  Live search grounding queries evaluated across commercial and info intents.
                </div>
              </div>
            </div>
          </div>

          {/* Queries Section */}
          <div className="aivc-queries-section">
            <div className="aivc-queries-header">
              <span className="aivc-queries-title">
                <Search size={18} color="#3b82f6" />
                Top 10 AI &amp; Google Search Query Audit
              </span>
              <div className="aivc-filter-group">
                <button
                  type="button"
                  className={`aivc-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All ({auditData.report?.results?.length || 0})
                </button>
                <button
                  type="button"
                  className={`aivc-filter-btn ${activeFilter === 'cited' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('cited')}
                >
                  Cited ({auditData.report?.citedCount || 0})
                </button>
                <button
                  type="button"
                  className={`aivc-filter-btn ${activeFilter === 'mentioned' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('mentioned')}
                >
                  Mentioned ({auditData.report?.mentionedCount || 0})
                </button>
                <button
                  type="button"
                  className={`aivc-filter-btn ${activeFilter === 'not_cited' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('not_cited')}
                >
                  Uncited ({auditData.report?.uncitedCount || 0})
                </button>
              </div>
            </div>

            {/* Queries List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredQueries.map((item) => {
                const isOpen = !!expandedQueries[item.id];
                return (
                  <div key={item.id} className="aivc-query-item">
                    <div className="aivc-query-head" onClick={() => toggleQuery(item.id)}>
                      <div className="aivc-query-left">
                        <span className="aivc-query-idx">#{item.id}</span>
                        <span className="aivc-query-text">"{item.query}"</span>
                      </div>
                      <div className="aivc-query-badges">
                        <span className="aivc-intent-badge">{item.intent}</span>
                        {item.status === 'cited' && (
                          <span className="aivc-status-badge cited">
                            <CheckCircle2 size={13} />
                            Cited
                          </span>
                        )}
                        {item.status === 'mentioned' && (
                          <span className="aivc-status-badge mentioned">
                            <Sparkles size={13} />
                            Mentioned
                          </span>
                        )}
                        {item.status === 'not_cited' && (
                          <span className="aivc-status-badge not_cited">
                            <XCircle size={13} />
                            Not Cited
                          </span>
                        )}
                        {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="aivc-query-body">
                        {/* Intent Rationale */}
                        {item.rationale && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <strong>Search Intent:</strong> {item.rationale}
                          </div>
                        )}

                        {/* Frontier AI Answer Excerpt */}
                        <div className="aivc-answer-box">
                          <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                            Frontier AI Answer Summary:
                          </strong>
                          {item.aiAnswer}
                        </div>

                        {/* Direct Citation Hit */}
                        {item.targetDomainCited && (
                          <div className="aivc-direct-citation-hit">
                            <div className="aivc-citation-label">
                              <Link2 size={14} />
                              <span>Direct Citation Link:</span>
                            </div>
                            <a
                              href={item.targetDomainCited}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aivc-citation-pill-link"
                              title={`Open cited link: ${item.targetDomainCited}`}
                            >
                              <Globe size={12} />
                              <span className="aivc-citation-pill-url">
                                {formatShortCitationUrl(item.targetDomainCited)}
                              </span>
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        )}

                        {/* Cited Sources List */}
                        {item.citedSources && item.citedSources.length > 0 && (
                          <div>
                            <span className="aivc-sources-title" style={{ display: 'block', marginBottom: '0.4rem' }}>
                              Sources Cited by AI Search for this Query:
                            </span>
                            <div className="aivc-sources-list">
                              {item.citedSources.map((src, sIdx) => {
                                const isTarget = src.domain?.includes(auditData.report?.domain);
                                return (
                                  <a
                                    key={sIdx}
                                    href={src.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`aivc-source-pill ${isTarget ? 'target-hit' : ''}`}
                                  >
                                    <Globe size={12} />
                                    <span>{src.domain || src.title}</span>
                                    <ExternalLink size={10} />
                                  </a>
                                );
                              })}
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

          {/* Strategic Insights: Competitors & Recommendations */}
          <div className="aivc-insights-row">
            {/* Top Competitors */}
            <div className="aivc-insight-box">
              <span className="aivc-insight-title">
                <Building size={18} color="#f59e0b" />
                Top Cited Competitors &amp; Directories
              </span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Third-party domains and competitors most frequently referenced by AI search engines when answering queries in your niche:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {auditData.report?.topCompetitors?.length > 0 ? (
                  auditData.report.topCompetitors.map((comp, cIdx) => (
                    <div key={cIdx} className="aivc-competitor-item">
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{comp.domain}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Cited in {comp.count} {comp.count === 1 ? 'query' : 'queries'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No external competitors detected.
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="aivc-insight-box">
              <span className="aivc-insight-title">
                <TrendingUp size={18} color="#10b981" />
                Generative Engine Optimization (GEO) Actions
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {auditData.report?.aeoRecommendations?.map((rec, rIdx) => (
                  <div key={rIdx} className="aivc-rec-item">
                    <span className="aivc-rec-title">{rec.title}</span>
                    <span className="aivc-rec-desc">{rec.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Section & Divider */}
      <ToolSeoDivider />
      <AiVisibilityCheckerSeo />
    </div>
  );
}
