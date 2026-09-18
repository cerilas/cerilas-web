import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Download,
  RotateCcw,
  Globe,
  FileCode,
  Layers,
  Wand2,
  Check,
  X,
  Plus,
  Trash2,
  Sliders,
  Terminal,
  Activity,
  Users,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Code2
} from 'lucide-react';
import { llmsTxtManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Button, Badge, ToolHeader, AdSlot } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import LlmsTxtSeo from './components/LlmsTxtSeo';
import './llms-txt-tools.css';

const SAMPLE_DOMAINS = [
  { name: 'Cerilas', url: 'cerilas.com' },
  { name: 'Anthropic Docs', url: 'docs.anthropic.com' },
  { name: 'FastAPI', url: 'fastapi.tiangolo.com' },
  { name: 'OpenAI', url: 'openai.com' }
];

const SECTIONS_LIST = [
  'About',
  'Products',
  'Services',
  'Documentation',
  'API',
  'Guides',
  'Resources',
  'Blog',
  'Policies',
  'Contact',
  'Optional'
];

export default function LlmsTxtTools({ onBack, toolMeta }) {
  const {
    trackUse,
    trackDownload,
    trackCopy,
    visitorCount,
    conversionCount,
    getConversionLabel
  } = useToolAnalytics(llmsTxtManifest.slug, toolMeta);

  // Active integrated mode: 'generator' | 'checker' | 'validator'
  const [activeMode, setActiveMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = (window.location.pathname + window.location.hash).toLowerCase();
      if (path.includes('validator')) return 'validator';
      if (path.includes('checker')) return 'checker';
    }
    return 'generator';
  });

  // Error alert
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // -----------------------------------------------------------------
  // 1. GENERATOR STATE
  // -----------------------------------------------------------------
  const [genUrl, setGenUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genData, setGenData] = useState(null);
  const [resourcesList, setResourcesList] = useState([]);
  const [siteTitle, setSiteTitle] = useState('');
  const [siteSummary, setSiteSummary] = useState('');
  const [editableMarkdown, setEditableMarkdown] = useState('');

  // -----------------------------------------------------------------
  // 2. CHECKER STATE
  // -----------------------------------------------------------------
  const [checkUrl, setCheckUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkData, setCheckData] = useState(null);

  // -----------------------------------------------------------------
  // 3. VALIDATOR STATE
  // -----------------------------------------------------------------
  const [valInputMode, setValInputMode] = useState('paste'); // 'paste' | 'url'
  const [valText, setValText] = useState(
    '# Cerilas Tools\n\n> Free in-browser developer utilities and AI tools.\n\n## Products\n\n- [AI Crawler Checker](https://tools.cerilas.com/tool/ai-crawler-checker): Check ChatGPT & Claude crawlers.\n- [AI Link Hallucination Checker](https://tools.cerilas.com/tool/ai-link-hallucination-checker): Scan for fake URLs.\n\n## Optional\n\n- [Blog](https://cerilas.com/blog): Company announcements.'
  );
  const [valUrl, setValUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [valReport, setValReport] = useState(null);
  const [valPreviewTab, setValPreviewTab] = useState('raw'); // 'raw' | 'rendered' | 'parsed'

  // =================================================================
  // GENERATOR HANDLERS
  // =================================================================
  const handleGenerate = async (overrideUrl) => {
    const target = overrideUrl || genUrl;
    if (!target.trim()) {
      setErrorMessage('Please enter a website URL (e.g. example.com)');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const resp = await fetch('/api/tools/llms-txt/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target.trim() })
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${resp.status}`);
      }

      const resJson = await resp.json();
      if (!resJson.success) throw new Error(resJson.error || 'Failed to generate');

      setGenData(resJson.data);
      setSiteTitle(resJson.data.siteTitle);
      setSiteSummary(resJson.data.siteSummary);
      setResourcesList(resJson.data.resources);
      setEditableMarkdown(resJson.data.initialMarkdown);

      trackUse({ mode: 'generator', domain: resJson.data.domain });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-assemble Markdown from current resourcesList
  const regenerateMarkdownFromList = (updatedResources, updatedTitle, updatedSummary) => {
    const t = updatedTitle ?? siteTitle;
    const s = updatedSummary ?? siteSummary;
    const list = updatedResources ?? resourcesList;

    let md = `# ${t}\n\n> ${s}\n\nThis file provides a curated guide to key resources and developer documentation on ${t}.\n\n`;

    const sectionMap = new Map();
    for (const item of list) {
      if (!item.selected) continue;
      if (!sectionMap.has(item.section)) sectionMap.set(item.section, []);
      sectionMap.get(item.section).push(item);
    }

    for (const sec of SECTIONS_LIST) {
      if (sectionMap.has(sec) && sectionMap.get(sec).length > 0) {
        md += `## ${sec}\n\n`;
        for (const item of sectionMap.get(sec)) {
          md += `- [${item.title}](${item.url}): ${item.description}\n`;
        }
        md += '\n';
      }
    }

    setEditableMarkdown(md.trim());
  };

  // Toggle item in generator
  const handleToggleResource = (id) => {
    const updated = resourcesList.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r));
    setResourcesList(updated);
    regenerateMarkdownFromList(updated);
  };

  // Change section in generator
  const handleChangeSection = (id, newSection) => {
    const updated = resourcesList.map((r) => (r.id === id ? { ...r, section: newSection } : r));
    setResourcesList(updated);
    regenerateMarkdownFromList(updated);
  };

  // Add custom manual resource
  const handleAddCustomResource = () => {
    const newItem = {
      id: `manual-${Date.now()}`,
      title: 'New Resource',
      url: genData?.origin ? `${genData.origin}/resource` : 'https://example.com/docs',
      description: 'Concise description of the resource.',
      section: 'Documentation',
      selected: true
    };
    const updated = [newItem, ...resourcesList];
    setResourcesList(updated);
    regenerateMarkdownFromList(updated);
  };

  // Delete resource
  const handleDeleteResource = (id) => {
    const updated = resourcesList.filter((r) => r.id !== id);
    setResourcesList(updated);
    regenerateMarkdownFromList(updated);
  };

  // =================================================================
  // CHECKER HANDLERS
  // =================================================================
  const handleCheck = async (overrideUrl) => {
    const target = overrideUrl || checkUrl;
    if (!target.trim()) {
      setErrorMessage('Please enter a website URL or path (e.g. example.com or example.com/docs/)');
      return;
    }

    setErrorMessage(null);
    setIsChecking(true);

    try {
      const resp = await fetch('/api/tools/llms-txt/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target.trim() })
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${resp.status}`);
      }

      const resJson = await resp.json();
      if (!resJson.success) throw new Error(resJson.error || 'Check failed');

      setCheckData(resJson.data);
      trackUse({ mode: 'checker', domain: resJson.data.domain });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsChecking(false);
    }
  };

  // =================================================================
  // VALIDATOR HANDLERS
  // =================================================================
  const handleValidate = async () => {
    setErrorMessage(null);
    setIsValidating(true);

    try {
      const body =
        valInputMode === 'paste'
          ? { content: valText }
          : { url: valUrl.trim() };

      const resp = await fetch('/api/tools/llms-txt/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${resp.status}`);
      }

      const resJson = await resp.json();
      if (!resJson.success) throw new Error(resJson.error || 'Validation failed');

      setValReport(resJson.data);
      trackUse({ mode: 'validator', score: resJson.data.score });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Send from Generator to Validator
  const handleSendToValidator = () => {
    setValText(editableMarkdown);
    setValInputMode('paste');
    setActiveMode('validator');
    // Trigger validation
    setTimeout(() => {
      handleValidate();
    }, 100);
  };

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    trackCopy({ type: id });
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Download helper
  const handleDownload = (content, filename = 'llms.txt') => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackDownload({ format: 'llms.txt' });
  };

  return (
    <div className="c-tool-page-container llms-root">
      {/* 1. Header with Breadcrumbs & Visitor Badge */}
      <ToolHeader
        title={llmsTxtManifest.title}
        subtitle={llmsTxtManifest.shortDescription}
        onBack={onBack}
        slug={llmsTxtManifest.slug}
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
            <Badge variant="neutral" icon={<FileText size={12} strokeWidth={2} />}>
              llms.txt v2 Standard
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              SSRF Protected
            </Badge>
          </>
        }
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="llms-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="llms-error-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Mode Switcher Tab Bar */}
      <div className="llms-mode-navbar">
        <button
          type="button"
          className={`llms-mode-btn ${activeMode === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveMode('generator')}
        >
          <Wand2 size={16} />
          <span>Generator</span>
        </button>
        <button
          type="button"
          className={`llms-mode-btn ${activeMode === 'checker' ? 'active' : ''}`}
          onClick={() => setActiveMode('checker')}
        >
          <Search size={16} />
          <span>Checker</span>
        </button>
        <button
          type="button"
          className={`llms-mode-btn ${activeMode === 'validator' ? 'active' : ''}`}
          onClick={() => setActiveMode('validator')}
        >
          <CheckCircle2 size={16} />
          <span>Validator</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* MODE 1: GENERATOR */}
      {/* ================================================================= */}
      {activeMode === 'generator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="llms-hero-card">
            <span className="llms-hero-eyebrow">
              <Sparkles size={14} /> Free AI Website Tool
            </span>
            <h2 className="llms-hero-title">LLMs.txt Generator</h2>
            <p className="llms-hero-subtitle">
              Scan your sitemap and key pages to generate a clean, token-efficient <code>llms.txt v2</code> site guide for AI agents in seconds.
            </p>

            <form
              className="llms-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate();
              }}
            >
              <div className="llms-input-wrapper">
                <Globe className="llms-input-icon" size={18} />
                <input
                  type="text"
                  className="llms-input-field"
                  placeholder="https://example.com"
                  value={genUrl}
                  onChange={(e) => setGenUrl(e.target.value)}
                  disabled={isGenerating}
                  spellCheck="false"
                  autoCapitalize="none"
                />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isGenerating || !genUrl.trim()}
                  icon={isGenerating ? <Clock size={16} className="spin" /> : <Wand2 size={16} />}
                >
                  {isGenerating ? 'Scanning...' : 'Generate llms.txt'}
                </Button>
              </div>

              <div className="llms-samples-row">
                <span>Try sample:</span>
                {SAMPLE_DOMAINS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="llms-sample-btn"
                    onClick={() => {
                      setGenUrl(s.url);
                      handleGenerate(s.url);
                    }}
                    disabled={isGenerating}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Scanning Progress Box */}
          {isGenerating && (
            <div className="llms-progress-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <Clock size={18} className="spin" />
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  Scanning sitemap & classifying high-value resources...
                </strong>
              </div>
              <div className="llms-progress-track">
                <div className="llms-progress-bar" style={{ width: '70%' }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Filtering navigation links, extracting metadata, and categorizing into llms.txt sections.
              </p>
            </div>
          )}

          {/* Curation Workspace */}
          {genData && !isGenerating && (
            <div className="llms-curation-wrapper">
              <div className="llms-stats-banner">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                    {genData.domain} Analyzed
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Discovered {genData.totalDiscovered} URLs • Analyzed {genData.analyzedCount} priority pages
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopy(editableMarkdown, 'gen-copy')}
                    icon={copiedId === 'gen-copy' ? <Check size={13} /> : <Copy size={13} />}
                  >
                    {copiedId === 'gen-copy' ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(editableMarkdown, 'llms.txt')}
                    icon={<Download size={13} />}
                  >
                    Download
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendToValidator}
                    icon={<CheckCircle2 size={13} />}
                  >
                    Validate File
                  </Button>
                </div>
              </div>

              <div className="llms-curation-grid">
                {/* Left: Interactive Resource List */}
                <div className="llms-resource-list">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                      Curate Resources ({resourcesList.filter((r) => r.selected).length} selected)
                    </h4>
                    <button
                      type="button"
                      className="acc-sample-btn"
                      onClick={handleAddCustomResource}
                    >
                      <Plus size={12} /> Add Link
                    </button>
                  </div>

                  {resourcesList.map((item) => (
                    <div
                      key={item.id}
                      className={`llms-resource-card ${item.selected ? '' : 'deselected'}`}
                    >
                      <div className="llms-resource-top">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleResource(item.id)}
                          />
                          <strong style={{ fontSize: '0.92rem' }}>{item.title}</strong>
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <select
                            className="llms-resource-select"
                            value={item.section}
                            onChange={(e) => handleChangeSection(item.id, e.target.value)}
                          >
                            {SECTIONS_LIST.map((sec) => (
                              <option key={sec} value={sec}>
                                {sec}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="acc-error-close"
                            onClick={() => handleDeleteResource(item.id)}
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        className="llms-resource-input"
                        value={item.description}
                        placeholder="Description..."
                        onChange={(e) => {
                          const updated = resourcesList.map((r) =>
                            r.id === item.id ? { ...r, description: e.target.value } : r
                          );
                          setResourcesList(updated);
                          regenerateMarkdownFromList(updated);
                        }}
                      />

                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.url}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right: Live Markdown Output Preview */}
                <div className="llms-output-card">
                  <div className="llms-output-header">
                    <span>Generated llms.txt</span>
                    <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>Markdown format</span>
                  </div>
                  <textarea
                    className="llms-output-editor"
                    value={editableMarkdown}
                    onChange={(e) => setEditableMarkdown(e.target.value)}
                    spellCheck="false"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODE 2: CHECKER */}
      {/* ================================================================= */}
      {activeMode === 'checker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="llms-hero-card">
            <span className="llms-hero-eyebrow">
              <Search size={14} /> Implementation Inspector
            </span>
            <h2 className="llms-hero-title">LLMs.txt Checker</h2>
            <p className="llms-hero-subtitle">
              Check whether a website or subpath has deployed <code>/llms.txt</code>, audit its links for 404s, and test <code>rel="describedby"</code> agent discovery.
            </p>

            <form
              className="llms-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleCheck();
              }}
            >
              <div className="llms-input-wrapper">
                <Globe className="llms-input-icon" size={18} />
                <input
                  type="text"
                  className="llms-input-field"
                  placeholder="https://example.com/docs/"
                  value={checkUrl}
                  onChange={(e) => setCheckUrl(e.target.value)}
                  disabled={isChecking}
                  spellCheck="false"
                />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isChecking || !checkUrl.trim()}
                  icon={isChecking ? <Clock size={16} className="spin" /> : <Search size={16} />}
                >
                  {isChecking ? 'Checking...' : 'Check Website'}
                </Button>
              </div>

              <div className="llms-samples-row">
                <span>Try sample:</span>
                {SAMPLE_DOMAINS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="llms-sample-btn"
                    onClick={() => {
                      setCheckUrl(s.url);
                      handleCheck(s.url);
                    }}
                    disabled={isChecking}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Checker Results */}
          {checkData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Scorecard Grid */}
              <div className="llms-scorecard-grid">
                {/* Root llms.txt */}
                <div className="llms-kpi-card">
                  <span className="llms-kpi-title">Root /llms.txt</span>
                  <div className="llms-kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {checkData.rootReport.status === 'found' ? (
                      <>
                        <CheckCircle2 size={18} color="#10b981" />
                        <span style={{ color: '#059669', fontSize: '1.2rem' }}>Found (200 OK)</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} color="#ef4444" />
                        <span style={{ color: '#dc2626', fontSize: '1.2rem' }}>Not Found (404)</span>
                      </>
                    )}
                  </div>
                  <p className="llms-kpi-subtext">
                    {checkData.rootReport.sizeBytes
                      ? `${(checkData.rootReport.sizeBytes / 1024).toFixed(1)} KB • ${checkData.rootReport.responseTimeMs}ms`
                      : 'No file at domain root.'}
                  </p>
                </div>

                {/* Path-level file if tested */}
                {checkData.pathReport && (
                  <div className="llms-kpi-card">
                    <span className="llms-kpi-title">Path-Level File</span>
                    <div className="llms-kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <span style={{ color: '#059669', fontSize: '1.2rem' }}>Found (200 OK)</span>
                    </div>
                    <p className="llms-kpi-subtext">
                      Located at {checkData.pathReport.url}
                    </p>
                  </div>
                )}

                {/* Discoverability */}
                <div className="llms-kpi-card">
                  <span className="llms-kpi-title">Agent Discovery</span>
                  <div className="llms-kpi-value">
                    {checkData.discoverability.describedByDetected ? (
                      <span style={{ color: '#059669', fontSize: '1.2rem' }}>✅ rel="describedby"</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>ℹ️ No tag detected</span>
                    )}
                  </div>
                  <p className="llms-kpi-subtext">
                    {checkData.discoverability.describedByDetected
                      ? 'Homepage advertises llms.txt in HTML/headers.'
                      : 'Add <link rel="describedby" href="/llms.txt"> to homepage.'}
                  </p>
                </div>

                {/* Link Health */}
                <div className="llms-kpi-card">
                  <span className="llms-kpi-title">Link Health</span>
                  <div className="llms-kpi-value">
                    {checkData.linksSummary.validCount} / {checkData.linksSummary.testedCount} Valid
                  </div>
                  <p className="llms-kpi-subtext">
                    {checkData.linksSummary.brokenCount > 0 ? (
                      <span style={{ color: '#dc2626' }}>{checkData.linksSummary.brokenCount} broken link(s) detected.</span>
                    ) : (
                      <span style={{ color: '#059669' }}>All sampled links resolved successfully.</span>
                    )}
                  </p>
                </div>

                {/* Curation Heuristic */}
                <div className="llms-kpi-card">
                  <span className="llms-kpi-title">Curation Density</span>
                  <div className="llms-kpi-value" style={{ fontSize: '1.2rem' }}>
                    {checkData.linksSummary.totalFound} Resources
                  </div>
                  <p className="llms-kpi-subtext">
                    {checkData.curationComparison.feedback}
                  </p>
                </div>
              </div>

              {/* Audited Links Table */}
              {checkData.linksSummary.auditedLinks?.length > 0 && (
                <div className="acc-table-container">
                  <table className="acc-compare-table">
                    <thead>
                      <tr>
                        <th>Resource Title</th>
                        <th>URL</th>
                        <th>Status</th>
                        <th>Response Time</th>
                        <th>Markdown Alternative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkData.linksSummary.auditedLinks.map((link, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{link.title}</strong>
                          </td>
                          <td>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              <span>{link.url}</span>
                              <ExternalLink size={11} />
                            </a>
                          </td>
                          <td>
                            <span
                              className={`acc-status-badge ${
                                link.status === 'valid'
                                  ? 'allowed'
                                  : link.status === 'redirect'
                                  ? 'partial'
                                  : 'blocked'
                              }`}
                            >
                              {link.httpCode ? `HTTP ${link.httpCode}` : link.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            {link.responseTimeMs}ms
                          </td>
                          <td>
                            {link.hasMarkdownAlt ? (
                              <span style={{ color: '#059669', fontSize: '0.82rem' }}>✅ Discoverable</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODE 3: VALIDATOR */}
      {/* ================================================================= */}
      {activeMode === 'validator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="llms-hero-card">
            <span className="llms-hero-eyebrow">
              <CheckCircle2 size={14} /> Specification Compliance
            </span>
            <h2 className="llms-hero-title">LLMs.txt Validator</h2>
            <p className="llms-hero-subtitle">
              Validate your <code>llms.txt</code> file against the latest <strong>v2 specification</strong> (H1 title, summary blockquote, H2 sections, and link syntax) with 1-click Auto-Fix.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className={`acc-pill-btn ${valInputMode === 'paste' ? 'active' : ''}`}
                onClick={() => setValInputMode('paste')}
              >
                Paste File Content
              </button>
              <button
                type="button"
                className={`acc-pill-btn ${valInputMode === 'url' ? 'active' : ''}`}
                onClick={() => setValInputMode('url')}
              >
                Enter URL
              </button>
            </div>

            {valInputMode === 'paste' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 680, margin: '0 auto', width: '100%' }}>
                <textarea
                  className="llms-output-editor"
                  style={{ minHeight: 220, borderRadius: 14, border: '1px solid var(--card-border)' }}
                  value={valText}
                  onChange={(e) => setValText(e.target.value)}
                  placeholder="Paste your llms.txt markdown here..."
                />
                <Button
                  variant="primary"
                  onClick={handleValidate}
                  disabled={isValidating || !valText.trim()}
                  icon={isValidating ? <Clock size={16} className="spin" /> : <CheckCircle2 size={16} />}
                >
                  {isValidating ? 'Validating...' : 'Validate llms.txt'}
                </Button>
              </div>
            ) : (
              <form
                className="llms-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidate();
                }}
              >
                <div className="llms-input-wrapper">
                  <Globe className="llms-input-icon" size={18} />
                  <input
                    type="text"
                    className="llms-input-field"
                    placeholder="https://example.com/llms.txt"
                    value={valUrl}
                    onChange={(e) => setValUrl(e.target.value)}
                    disabled={isValidating}
                  />
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isValidating || !valUrl.trim()}
                    icon={isValidating ? <Clock size={16} className="spin" /> : <CheckCircle2 size={16} />}
                  >
                    Validate URL
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Validation Report */}
          {valReport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Score Hero */}
              <div className="llms-validator-score-hero">
                <div className={`llms-score-gauge ${valReport.statusColor}`}>
                  <span className="llms-gauge-num">{valReport.score}</span>
                  <span className="llms-gauge-denom">/ 100</span>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
                    LLMs.txt Quality Score: {valReport.statusLabel}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                    {valReport.stats.errorsCount} Error(s) • {valReport.stats.warningsCount} Warning(s) • {valReport.stats.recommendationsCount} Recommendation(s)
                  </p>
                </div>

                {valReport.fixedContent !== valText && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setValText(valReport.fixedContent);
                      handleValidate();
                    }}
                    icon={<Wand2 size={14} />}
                  >
                    Apply Auto-Fix
                  </Button>
                )}
              </div>

              {/* Categorized Issues */}
              <div className="llms-issues-list">
                {valReport.errors.map((err, idx) => (
                  <div key={`err-${idx}`} className="llms-issue-item error">
                    <XCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                      <strong>ERROR [{err.rule}]:</strong> {err.message}
                    </div>
                  </div>
                ))}

                {valReport.warnings.map((warn, idx) => (
                  <div key={`warn-${idx}`} className="llms-issue-item warning">
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                      <strong>WARNING [{warn.rule}]:</strong> {warn.message}
                    </div>
                  </div>
                ))}

                {valReport.recommendations.map((rec, idx) => (
                  <div key={`rec-${idx}`} className="llms-issue-item recommendation">
                    <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                      <strong>RECOMMENDATION:</strong> {rec.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview Tabs: Raw, Rendered, Parsed */}
              <div className="acc-code-viewer-card">
                <div className="acc-code-viewer-header">
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className={`acc-pill-btn ${valPreviewTab === 'raw' ? 'active' : ''}`}
                      onClick={() => setValPreviewTab('raw')}
                    >
                      Raw Markdown
                    </button>
                    <button
                      type="button"
                      className={`acc-pill-btn ${valPreviewTab === 'parsed' ? 'active' : ''}`}
                      onClick={() => setValPreviewTab('parsed')}
                    >
                      Parsed Tree
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(valText, 'val-copy')}
                      icon={copiedId === 'val-copy' ? <Check size={13} /> : <Copy size={13} />}
                    >
                      {copiedId === 'val-copy' ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(valText, 'llms.txt')}
                      icon={<Download size={13} />}
                    >
                      Download
                    </Button>
                  </div>
                </div>

                {valPreviewTab === 'raw' && (
                  <pre className="acc-code-viewer-body">{valText}</pre>
                )}

                {valPreviewTab === 'parsed' && (
                  <div style={{ padding: '1.25rem', background: 'var(--card-bg)' }}>
                    <div>
                      <strong>H1 Title:</strong> {valReport.structure.title || '(Missing)'}
                    </div>
                    <div style={{ marginTop: '0.35rem' }}>
                      <strong>Blockquote Summary:</strong> {valReport.structure.summary || '(None)'}
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
                      <strong>Sections ({valReport.structure.sections.length}):</strong>
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {valReport.structure.sections.map((sec, idx) => (
                          <div key={idx} className="acc-matched-rule-box">
                            <strong>## {sec.name}</strong> ({sec.resources.length} resources)
                            <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                              {sec.resources.map((r, rIdx) => (
                                <li key={rIdx}>
                                  <strong>{r.title}</strong> — <code>{r.url}</code>
                                  {r.description && <span>: {r.description}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Google AdSense Slot */}
      <div style={{ marginTop: '1.5rem' }}>
        <AdSlot format="horizontal" slotId="4093371757" />
      </div>

      {/* 5. Tool SEO Divider & Technical Guide */}
      <ToolSeoDivider label="LLMs.txt v2 Standard & Agent Discovery Architecture" />
      <LlmsTxtSeo />
    </div>
  );
}
