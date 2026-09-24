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
  Languages
} from 'lucide-react';
import { aiVisibilityCheckerManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import { Button, Badge, ToolHeader, QuotaModal } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import AiVisibilityCheckerSeo from './components/AiVisibilityCheckerSeo';
import './ai-visibility-checker.css';

const SAMPLE_SITES = [
  { name: 'Cerilas Tech', url: 'cerilas.com' },
  { name: 'Wikipedia', url: 'wikipedia.org' },
  { name: 'OpenAI', url: 'openai.com' },
  { name: 'Medium', url: 'medium.com' }
];

const SCAN_STEPS = [
  'Connecting to target website and downloading raw HTML...',
  'Extracting title, meta tags, and body content without AI...',
  'Generating top 10 realistic user search queries with Gemini 3.8 Flash...',
  'Querying Google Search Grounding for each prompt against live web data...',
  'Calculating citation rates, brand mentions, and competitor rankings...'
];

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
              Gemini 3.6 Flash
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              Google Search Grounding
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
            <Eye size={14} /> Free AI Search Visibility & Citations Audit
          </span>
          <h2 className="aivc-hero-title">Is your website cited by AI search engines?</h2>
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
            <Globe className="aivc-input-icon" size={18} />
            <input
              type="text"
              className="aivc-input-field"
              placeholder="https://yourwebsite.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={isScanning}
              spellCheck="false"
              autoCapitalize="none"
              autoCorrect="off"
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

          {/* Target Geotargeting & Query Language Selectors */}
          <div className="aivc-targeting-row">
            <div className="aivc-targeting-group">
              <label htmlFor="aivc-select-country" className="aivc-targeting-label">
                <Globe size={13} color="#3b82f6" />
                <span>Target Market:</span>
              </label>
              <select
                id="aivc-select-country"
                className="aivc-targeting-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                disabled={isScanning}
              >
                <option value="auto">Auto-Detect Market (from Domain)</option>
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (UK)</option>
                <option value="TR">Turkey (TR)</option>
                <option value="DE">Germany (DE)</option>
                <option value="FR">France (FR)</option>
                <option value="CA">Canada (CA)</option>
                <option value="AU">Australia (AU)</option>
                <option value="ES">Spain (ES)</option>
                <option value="IT">Italy (IT)</option>
                <option value="NL">Netherlands (NL)</option>
                <option value="GLOBAL">Global / International</option>
              </select>
            </div>

            <div className="aivc-targeting-group">
              <label htmlFor="aivc-select-language" className="aivc-targeting-label">
                <Languages size={13} color="#8b5cf6" />
                <span>Query Language:</span>
              </label>
              <select
                id="aivc-select-language"
                className="aivc-targeting-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={isScanning}
              >
                <option value="auto">Auto-Detect Language (from Content)</option>
                <option value="en">English (en)</option>
                <option value="tr">Turkish (tr)</option>
                <option value="de">German (de)</option>
                <option value="fr">French (fr)</option>
                <option value="es">Spanish (es)</option>
                <option value="it">Italian (it)</option>
                <option value="nl">Dutch (nl)</option>
                <option value="pt">Portuguese (pt)</option>
                <option value="ar">Arabic (ar)</option>
              </select>
            </div>
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

          <div className="aivc-hero-guarantees">
            <span>
              <CheckCircle2 size={13} color="#10b981" /> 100% Free
            </span>
            <span>•</span>
            <span>
              <CheckCircle2 size={13} color="#10b981" /> Powered by Gemini 3.8 Flash
            </span>
            <span>•</span>
            <span>
              <CheckCircle2 size={13} color="#10b981" /> Live Google Search Grounding Probes
            </span>
          </div>
        </form>
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
                  Citation and brand inclusion across 10 high-intent queries tested against Gemini AI.
                </span>
              </div>
              <p className="aivc-score-disclaimer">
                Evaluates live Google Search Grounding citations and source hyperlinks referenced in Gemini responses.
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
                  Gemini provided a direct clickable citation backlink to your website.
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

                        {/* Gemini Answer Excerpt */}
                        <div className="aivc-answer-box">
                          <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                            Gemini AI Answer Summary:
                          </strong>
                          {item.aiAnswer}
                        </div>

                        {/* Direct Citation Hit */}
                        {item.targetDomainCited && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#10b981' }}>
                            <Link2 size={15} />
                            <span>Direct Citation Backlink:</span>
                            <a
                              href={item.targetDomainCited}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#10b981', textDecoration: 'underline', fontWeight: 600 }}
                            >
                              {item.targetDomainCited}
                            </a>
                          </div>
                        )}

                        {/* Cited Sources List */}
                        {item.citedSources && item.citedSources.length > 0 && (
                          <div>
                            <span className="aivc-sources-title" style={{ display: 'block', marginBottom: '0.4rem' }}>
                              Sources Cited by Gemini for this Query:
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
                Third-party domains and competitors most frequently referenced by Gemini when answering queries in your niche:
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
