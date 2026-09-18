import React, { useState, useMemo } from 'react';
import {
  Link2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Copy,
  Download,
  RotateCcw,
  Search,
  Filter,
  FileText,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Globe,
  Trash2,
  Check,
  X,
  Users,
  Activity
} from 'lucide-react';
import { aiLinkHallucinationCheckerManifest } from './manifest';
import {
  extractLinksFromText,
  sanitizeText,
  exportMarkdownReport,
  exportCsvReport,
  DEMO_SAMPLES
} from './linkExtractorService';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Button, Badge, Card, ToolHeader, AdSlot } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import AiLinkHallucinationSeo from './components/AiLinkHallucinationSeo';
import './ai-link-hallucination-checker.css';

export default function AiLinkHallucinationChecker({ onBack, toolMeta }) {
  const {
    trackUse,
    trackDownload,
    trackCopy,
    visitorCount,
    conversionCount,
    getConversionLabel
  } = useToolAnalytics(aiLinkHallucinationCheckerManifest.slug, toolMeta);

  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [auditData, setAuditData] = useState(null); // { results, stats }
  const [errorNotice, setErrorNotice] = useState(null);

  // Active view when results exist: 'links' | 'sanitized'
  const [resultsView, setResultsView] = useState('links');

  // Filters & Search
  const [filterType, setFilterType] = useState('all'); // 'all' | 'hallucinated' | 'alive'
  const [searchQuery, setSearchQuery] = useState('');

  // Copy feedback states
  const [copiedLink, setCopiedLink] = useState(null);
  const [copiedCleaned, setCopiedCleaned] = useState(false);

  // Sanitizer mode
  const [sanitizeMode, setSanitizeMode] = useState('unlink'); // 'unlink' | 'strip'

  // Pre-extracted links count in real time
  const preExtractedLinks = useMemo(() => {
    return extractLinksFromText(inputText);
  }, [inputText]);

  // Load sample content
  const loadSample = (sampleKey) => {
    const text = DEMO_SAMPLES[sampleKey] || '';
    setInputText(text);
    setErrorNotice(null);
    setAuditData(null);
  };

  // Clear workspace
  const clearInput = () => {
    setInputText('');
    setAuditData(null);
    setErrorNotice(null);
  };

  // Run Link Verification Scan
  const handleStartScan = async () => {
    setErrorNotice(null);

    if (!inputText.trim()) {
      setErrorNotice('Please paste some AI-generated text or documentation to verify.');
      return;
    }

    const links = extractLinksFromText(inputText);
    if (links.length === 0) {
      setErrorNotice('No URLs, Markdown links, HTML tags, or DOI citations were detected in the text.');
      return;
    }

    setIsScanning(true);

    try {
      const urlList = links.map((l) => l.url);

      const response = await fetch('/api/tools/ai-link-hallucination-checker/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      const resultMap = new Map(data.results.map((r) => [r.url, r]));
      const enrichedResults = links.map((link) => {
        const checkResult = resultMap.get(link.url) || {
          url: link.url,
          status: 'other',
          httpCode: null,
          isHallucination: false,
          riskLevel: 'low',
          diagnostic: 'Status unknown'
        };

        return {
          ...link,
          ...checkResult
        };
      });

      setAuditData({
        results: enrichedResults,
        stats: data.stats
      });

      trackUse({
        totalLinks: data.stats.total,
        hallucinatedCount: data.stats.hallucinated,
        rate: data.stats.hallucinationRate
      });

      setResultsView('links');
    } catch (err) {
      console.error('Scan error:', err);
      setErrorNotice(`Failed to verify links: ${err.message}. Please verify your connection.`);
    } finally {
      setIsScanning(false);
    }
  };

  // Filtered links list
  const filteredResults = useMemo(() => {
    if (!auditData || !auditData.results) return [];

    return auditData.results.filter((item) => {
      if (filterType === 'hallucinated' && !item.isHallucination) return false;
      if (filterType === 'alive' && item.status !== 'alive') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUrl = (item.url || '').toLowerCase().includes(query);
        const matchesAnchor = (item.anchor || '').toLowerCase().includes(query);
        const matchesDiag = (item.diagnostic || '').toLowerCase().includes(query);
        return matchesUrl || matchesAnchor || matchesDiag;
      }

      return true;
    });
  }, [auditData, filterType, searchQuery]);

  // Sanitized content computation
  const sanitizedContent = useMemo(() => {
    if (!auditData || !inputText) return inputText;
    const brokenUrls = auditData.results
      .filter((r) => r.isHallucination || r.status === 'not_found' || r.status === 'nxdomain')
      .map((r) => r.url);

    return sanitizeText(inputText, brokenUrls, sanitizeMode);
  }, [auditData, inputText, sanitizeMode]);

  // Copy single link
  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 1800);
  };

  // Copy cleaned text
  const handleCopyCleanedText = () => {
    navigator.clipboard.writeText(sanitizedContent);
    setCopiedCleaned(true);
    trackCopy({ type: 'cleaned_text' });
    setTimeout(() => setCopiedCleaned(false), 2000);
  };

  // Download Report
  const handleDownloadReport = (format = 'md') => {
    if (!auditData) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'md') {
      content = exportMarkdownReport(auditData.results, auditData.stats);
      filename = `ai-link-audit-${Date.now()}.md`;
      mimeType = 'text/markdown';
    } else {
      content = exportCsvReport(auditData.results);
      filename = `ai-link-audit-${Date.now()}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    trackDownload({ format });
  };

  // Helpers for Risk Score
  const getRiskScoreClass = (rate) => {
    if (rate === 0) return 'clean';
    if (rate <= 25) return 'low';
    if (rate <= 60) return 'moderate';
    return 'critical';
  };

  const getRiskScoreVerdict = (rate) => {
    if (rate === 0) return 'Pristine Grounding (0% Hallucinations)';
    if (rate <= 25) return 'Low Risk (Minor 404 or Redirects)';
    if (rate <= 60) return 'Moderate Risk (Dead URLs Detected)';
    return 'Critical Hallucination Risk (Fake Domains / 404s)';
  };

  return (
    <div className="c-tool-page-container alhc-root">
      {/* Standardized ToolHeader matching all other tools */}
      <ToolHeader
        title={aiLinkHallucinationCheckerManifest.title}
        subtitle={aiLinkHallucinationCheckerManifest.shortDescription}
        onBack={onBack}
        slug={aiLinkHallucinationCheckerManifest.slug}
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
            <Badge variant="neutral" icon={<Sparkles size={12} strokeWidth={2} />}>
              AI Assisted
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              DNS &amp; HTTP Verified
            </Badge>
          </>
        }
      />

      {/* Inline Notification Banner */}
      {errorNotice && (
        <div className="alhc-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={16} />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            className="alhc-error-close"
            onClick={() => setErrorNotice(null)}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Input Card (Minimalist Apple Aesthetic) */}
      <div className="alhc-card">
        <div className="alhc-card-header">
          <div className="alhc-card-title">
            <Link2 size={16} />
            <span>AI Draft or Markdown Document</span>
          </div>

          <div className="alhc-samples-group">
            <span className="alhc-sample-label">Try instant sample:</span>
            <button
              type="button"
              className="alhc-sample-chip"
              onClick={() => loadSample('blog')}
            >
              <Sparkles size={12} /> AI Blog Post
            </button>
            <button
              type="button"
              className="alhc-sample-chip"
              onClick={() => loadSample('tech')}
            >
              <Sparkles size={12} /> Tech Docs
            </button>
            {inputText && (
              <button
                type="button"
                className="alhc-sample-chip danger"
                onClick={clearInput}
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        <textarea
          className="alhc-textarea"
          placeholder="Paste AI-generated text, Markdown, HTML, or code here. We will instantly extract all Markdown [links](url), HTML tags, bare URLs, and DOI citations to verify their HTTP status and domain existence..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isScanning}
          rows={8}
        />

        {/* Live scanning progress bar */}
        {isScanning && (
          <div className="alhc-scan-progress-box">
            <div className="alhc-scan-progress-text">
              <span>Probing DNS and HTTP endpoints...</span>
              <span>{preExtractedLinks.length} URLs</span>
            </div>
            <div className="alhc-progress-track">
              <div className="alhc-progress-bar" />
            </div>
          </div>
        )}

        <div className="alhc-card-footer">
          <div className="alhc-meta-info">
            <span>{inputText.length.toLocaleString()} characters</span>
            <span>•</span>
            <span>{inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words</span>
            <span>•</span>
            <span className="alhc-meta-links-badge">
              {preExtractedLinks.length} {preExtractedLinks.length === 1 ? 'link' : 'links'} found
            </span>
          </div>

          <Button
            variant="primary"
            onClick={handleStartScan}
            disabled={isScanning || !inputText.trim()}
            icon={isScanning ? <Clock size={15} className="spin" /> : <ShieldCheck size={15} />}
          >
            {isScanning ? 'Checking Links...' : 'Scan for Hallucinations'}
          </Button>
        </div>
      </div>

      {/* RESULTS WORKSPACE */}
      {auditData && (
        <div className="alhc-results-wrapper">
          {/* Apple Hero Score Banner */}
          <div className="alhc-score-hero">
            <div className="alhc-gauge-container">
              {/* Circle Gauge - Contains ONLY percentage to avoid overflow */}
              <div className={`alhc-score-circle ${getRiskScoreClass(auditData.stats.hallucinationRate)}`}>
                <span className="alhc-score-number">{auditData.stats.hallucinationRate}%</span>
              </div>

              <div className="alhc-verdict-info">
                <h3 className="alhc-verdict-title">{getRiskScoreVerdict(auditData.stats.hallucinationRate)}</h3>
                <p className="alhc-verdict-desc">
                  {auditData.stats.hallucinated === 0
                    ? 'All cited references resolve to verified, live HTTP endpoints.'
                    : `${auditData.stats.hallucinated} of ${auditData.stats.total} links failed verification (404, fake domains, or soft redirects).`}
                </p>
              </div>
            </div>

            <div className="alhc-hero-actions">
              <Button
                variant="secondary"
                onClick={() => handleDownloadReport('md')}
                icon={<Download size={13} />}
                size="sm"
              >
                Export Report
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDownloadReport('csv')}
                icon={<Download size={13} />}
                size="sm"
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* 4-Metric Breakdown Grid */}
          <div className="alhc-metrics-grid">
            <div className="alhc-metric-card">
              <div className="alhc-metric-header">
                <span>Total Checked</span>
                <Globe size={15} />
              </div>
              <div className="alhc-metric-value">{auditData.stats.total}</div>
              <div className="alhc-metric-subtext">URLs &amp; Citations</div>
            </div>

            <div className="alhc-metric-card">
              <div className="alhc-metric-header">
                <span>Verified 200 OK</span>
                <CheckCircle2 size={15} color="#10b981" />
              </div>
              <div className="alhc-metric-value" style={{ color: '#059669' }}>
                {auditData.stats.alive}
              </div>
              <div className="alhc-metric-subtext">Alive &amp; functional</div>
            </div>

            <div className="alhc-metric-card">
              <div className="alhc-metric-header">
                <span>404 Dead Paths</span>
                <AlertTriangle size={15} color="#ea580c" />
              </div>
              <div className="alhc-metric-value" style={{ color: '#c2410c' }}>
                {auditData.stats.notFound}
              </div>
              <div className="alhc-metric-subtext">Fabricated pages</div>
            </div>

            <div className="alhc-metric-card">
              <div className="alhc-metric-header">
                <span>NXDOMAIN</span>
                <XCircle size={15} color="#dc2626" />
              </div>
              <div className="alhc-metric-value" style={{ color: '#dc2626' }}>
                {auditData.stats.nxdomain}
              </div>
              <div className="alhc-metric-subtext">Fake domain names</div>
            </div>
          </div>

          {/* View Selector (Pill navigation) & Filter chips */}
          <div className="alhc-view-tabs">
            <div className="alhc-pill-nav">
              <button
                type="button"
                className={`alhc-pill-btn ${resultsView === 'links' ? 'active' : ''}`}
                onClick={() => setResultsView('links')}
              >
                <FileText size={14} /> Itemized Links ({auditData.results.length})
              </button>
              <button
                type="button"
                className={`alhc-pill-btn ${resultsView === 'sanitized' ? 'active' : ''}`}
                onClick={() => setResultsView('sanitized')}
              >
                <FileCheck size={14} /> Sanitized Content
              </button>
            </div>

            {resultsView === 'links' && (
              <div className="alhc-filter-pills">
                <button
                  type="button"
                  className={`alhc-filter-tag ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All ({auditData.results.length})
                </button>
                <button
                  type="button"
                  className={`alhc-filter-tag ${filterType === 'hallucinated' ? 'active' : ''}`}
                  onClick={() => setFilterType('hallucinated')}
                >
                  Hallucinated ({auditData.stats.hallucinated})
                </button>
                <button
                  type="button"
                  className={`alhc-filter-tag ${filterType === 'alive' ? 'active' : ''}`}
                  onClick={() => setFilterType('alive')}
                >
                  Alive ({auditData.stats.alive})
                </button>
              </div>
            )}
          </div>

          {/* SUB-VIEW 1: ITEMIZED LINKS */}
          {resultsView === 'links' && (
            <div className="alhc-links-list">
              {filteredResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--card-bg)', borderRadius: '18px', color: 'var(--text-muted)' }}>
                  No links match the selected filter.
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const isAlive = item.status === 'alive';
                  const isNx = item.status === 'nxdomain';
                  const is404 = item.status === 'not_found';
                  const isSoft404 = item.status === 'soft_404_redirect';
                  const isRestricted = item.status === 'restricted';

                  let cardClass = 'alhc-link-item-card';
                  if (isAlive) cardClass += ' alive';
                  else if (item.isHallucination) cardClass += ' hallucinated';
                  else if (item.status === 'soft_404_redirect') cardClass += ' redirect';

                  return (
                    <div key={idx} className={cardClass}>
                      <div className="alhc-link-top-bar">
                        <div className="alhc-link-title-group">
                          <span className="alhc-link-anchor-text">{item.anchor}</span>

                          {isAlive && (
                            <span className="alhc-status-badge alive">
                              <CheckCircle2 size={12} /> 200 OK Alive
                            </span>
                          )}

                          {isNx && (
                            <span className="alhc-status-badge nxdomain">
                              <XCircle size={12} /> NXDOMAIN (Fake Domain)
                            </span>
                          )}

                          {is404 && (
                            <span className="alhc-status-badge not_found">
                              <AlertTriangle size={12} /> 404 Not Found
                            </span>
                          )}

                          {isSoft404 && (
                            <span className="alhc-status-badge redirect">
                              <AlertTriangle size={12} /> Soft 404 Redirect
                            </span>
                          )}

                          {isRestricted && (
                            <span className="alhc-status-badge restricted">
                              <ShieldAlert size={12} /> HTTP {item.httpCode || 403} Restricted
                            </span>
                          )}
                        </div>

                        <div className="alhc-link-actions">
                          <button
                            type="button"
                            className="alhc-link-action-btn"
                            onClick={() => handleCopyLink(item.url)}
                          >
                            {copiedLink === item.url ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedLink === item.url ? 'Copied' : 'Copy'}</span>
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="alhc-link-action-btn"
                          >
                            <ExternalLink size={12} />
                            <span>Visit</span>
                          </a>
                        </div>
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="alhc-link-url-text"
                      >
                        {item.url}
                      </a>

                      <div className="alhc-link-diagnostic-box">
                        <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                        <span><strong>Diagnostic:</strong> {item.diagnostic} ({item.responseTimeMs}ms)</span>
                      </div>

                      {item.context && (
                        <div className="alhc-link-context-quote">
                          "{item.context}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* SUB-VIEW 2: SANITIZED TEXT */}
          {resultsView === 'sanitized' && (
            <div className="alhc-sanitized-wrapper">
              <div className="alhc-card-header">
                <div className="alhc-card-title">
                  <FileCheck size={16} />
                  <span>Cleaned Text (Hallucinations Neutralized)</span>
                </div>

                <div className="alhc-samples-group">
                  <span className="alhc-sample-label">Sanitizer Mode:</span>
                  <button
                    type="button"
                    className={`alhc-sample-chip ${sanitizeMode === 'unlink' ? 'active' : ''}`}
                    style={sanitizeMode === 'unlink' ? { background: 'var(--text-main)', color: 'var(--card-bg)', borderColor: 'var(--text-main)' } : {}}
                    onClick={() => setSanitizeMode('unlink')}
                  >
                    Unlink (Keep Plain Text)
                  </button>
                  <button
                    type="button"
                    className={`alhc-sample-chip ${sanitizeMode === 'strip' ? 'active' : ''}`}
                    style={sanitizeMode === 'strip' ? { background: 'var(--text-main)', color: 'var(--card-bg)', borderColor: 'var(--text-main)' } : {}}
                    onClick={() => setSanitizeMode('strip')}
                  >
                    Strip Entirely
                  </button>
                </div>
              </div>

              <textarea
                className="alhc-sanitized-textarea"
                value={sanitizedContent}
                readOnly
                rows={9}
              />

              <div className="alhc-card-footer">
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {auditData.stats.hallucinated} broken {auditData.stats.hallucinated === 1 ? 'link was' : 'links were'} neutralized.
                </span>

                <Button
                  variant="primary"
                  onClick={handleCopyCleanedText}
                  icon={copiedCleaned ? <Check size={15} /> : <Copy size={15} />}
                >
                  {copiedCleaned ? 'Copied Cleaned Text!' : 'Copy Cleaned Content'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ad slot */}
      <div style={{ marginTop: '1.5rem' }}>
        <AdSlot format="horizontal" slotId="4093371757" />
      </div>

      {/* Standardized ToolSeoDivider */}
      <ToolSeoDivider label="AI Hallucination Diagnostics & Slopsquatting Defense" />

      {/* In-Depth SEO Guide & Structured Data */}
      <AiLinkHallucinationSeo />
    </div>
  );
}
