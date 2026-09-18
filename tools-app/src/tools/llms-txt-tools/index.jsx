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
  Sparkles,
  Code2,
  GitCompare,
  Eye,
  FileCheck2,
  CheckSquare,
  RefreshCw,
  Link2,
  Zap,
  ArrowRight,
  CornerDownRight
} from 'lucide-react';
import { llmsTxtManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Button, Badge, ToolHeader, AdSlot } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import LlmsTxtSeo from './components/LlmsTxtSeo';
import './llms-txt-tools.css';

const SAMPLE_DOMAINS = [
  { name: 'llmstxt.org', url: 'https://llmstxt.org' },
  { name: 'Anthropic Docs', url: 'https://docs.anthropic.com' },
  { name: 'FastAPI', url: 'https://fastapi.tiangolo.com' },
  { name: 'Missing File Demo', url: 'https://example.com' }
];

const VALID_SAMPLE = `# Cerilas

> Cerilas develops technology products, AI tools and software solutions.

This file provides key resources for understanding Cerilas and its products.

## Products

- [Cerilas Tools](https://tools.cerilas.com): Free browser-based developer utilities and AI tools.
- [GISMO](https://cerilas.com/gismo): AI-powered desktop companion platform.

## Documentation

- [Developer Documentation](https://cerilas.com/docs): Technical implementation guides.

## Company

- [About Cerilas](https://cerilas.com/about): Information about Cerilas projects.

## Optional

- [Blog](https://cerilas.com/blog): Articles and company updates.`;

const BROKEN_SAMPLE = `Cerilas Platform

This file has no H1 title and contains unformatted bare URLs.

## Documentation
https://example.com/docs
/relative/api/docs

## Products
- [Click here](https://tools.cerilas.com): Read more
- [Tools](https://tools.cerilas.com): Duplicate link
- [Broken](ftp://example.com/file): Bad protocol`;

const PATH_SAMPLE = `# Cerilas Documentation

> Official technical documentation for Cerilas APIs and developer tools.

## Core APIs

- [Interactions API](https://tools.cerilas.com/docs/interactions): Complete REST & WebSocket specification.
- [Crawler Checker API](https://tools.cerilas.com/docs/crawlers): Programmatic crawler accessibility audits.

## Optional

- [API Changelog](https://tools.cerilas.com/docs/changelog): Weekly release notes.`;

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
  const [chkFilter, setChkFilter] = useState('all'); // 'all' | 'valid' | 'redirect' | 'broken' | 'markdown'
  const [chkSearch, setChkSearch] = useState('');

  // Filtered links list for the Checker Table
  const filteredAuditedLinks = useMemo(() => {
    if (!checkData?.linksSummary?.auditedLinks) return [];
    let list = checkData.linksSummary.auditedLinks;

    if (chkFilter === 'valid') {
      list = list.filter((l) => l.status === 'valid');
    } else if (chkFilter === 'redirect') {
      list = list.filter((l) => l.status === 'redirect');
    } else if (chkFilter === 'broken') {
      list = list.filter((l) => ['not_found', 'forbidden', 'warning'].includes(l.status));
    } else if (chkFilter === 'markdown') {
      list = list.filter((l) => l.hasMarkdownAlt);
    }

    if (chkSearch.trim()) {
      const q = chkSearch.toLowerCase().trim();
      list = list.filter(
        (l) => (l.title || '').toLowerCase().includes(q) || (l.url || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [checkData, chkFilter, chkSearch]);

  // -----------------------------------------------------------------
  // 3. VALIDATOR STATE
  // -----------------------------------------------------------------
  const [valInputMode, setValInputMode] = useState('paste'); // 'paste' | 'url'
  const [valText, setValText] = useState(VALID_SAMPLE);
  const [valUrl, setValUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [valReport, setValReport] = useState(null);
  const [valPreviewTab, setValPreviewTab] = useState('rendered'); // 'rendered' | 'raw' | 'parsed'
  const [showDiff, setShowDiff] = useState(false);

  // Line-by-line diff computation between original and fixed version
  const diffLines = useMemo(() => {
    if (!valReport || !valReport.fixedContent || valReport.fixedContent === valText) {
      return [];
    }
    const orig = (valText || '').split(/\r?\n/);
    const fixed = (valReport.fixedContent || '').split(/\r?\n/);
    const max = Math.max(orig.length, fixed.length);
    const diff = [];
    for (let i = 0; i < max; i++) {
      const o = orig[i];
      const f = fixed[i];
      if (o === f) {
        diff.push({ type: 'same', text: o, num: i + 1 });
      } else {
        if (o !== undefined) diff.push({ type: 'del', text: o, num: i + 1 });
        if (f !== undefined) diff.push({ type: 'add', text: f, num: i + 1 });
      }
    }
    return diff;
  }, [valText, valReport]);

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
  const handleValidate = async (overrideText, overrideUrl) => {
    setErrorMessage(null);
    setIsValidating(true);

    try {
      const textToTest = overrideText !== undefined ? overrideText : valText;
      const urlToTest = overrideUrl !== undefined ? overrideUrl : valUrl;
      const isUrlMode = valInputMode === 'url' && overrideText === undefined;

      const body = isUrlMode
        ? { url: (urlToTest || '').trim() }
        : { content: textToTest || '' };

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

  // Auto-run initial validation when opening validator
  React.useEffect(() => {
    if (!valReport && valText && activeMode === 'validator') {
      handleValidate(valText);
    }
  }, [activeMode]);

  // Send from Generator or Checker to Validator
  const handleSendToValidator = (contentOverride) => {
    const textToSend = typeof contentOverride === 'string' ? contentOverride : editableMarkdown;
    setValText(textToSend);
    setValInputMode('paste');
    setActiveMode('validator');
    // Trigger validation
    setTimeout(() => {
      handleValidate(textToSend);
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
                  <div className="llms-resource-list-header">
                    <div className="llms-resource-list-title">
                      <span>Curate Resources</span>
                      <Badge variant="neutral">
                        {resourcesList.filter((r) => r.selected).length} of {resourcesList.length} included
                      </Badge>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddCustomResource}
                      icon={<Plus size={13} />}
                    >
                      Add Link
                    </Button>
                  </div>

                  {resourcesList.length > 0 ? (
                    resourcesList.map((item) => (
                      <div
                        key={item.id}
                        className={`llms-resource-card ${item.selected ? '' : 'deselected'}`}
                      >
                        <div className="llms-resource-top">
                          <div className="llms-resource-title-row">
                            <input
                              type="checkbox"
                              className="llms-resource-checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleResource(item.id)}
                              id={`chk-${item.id}`}
                              title={item.selected ? 'Include in llms.txt' : 'Exclude from llms.txt'}
                            />
                            <input
                              type="text"
                              className="llms-resource-title-input"
                              value={item.title}
                              placeholder="Resource Title..."
                              onChange={(e) => {
                                const updated = resourcesList.map((r) =>
                                  r.id === item.id ? { ...r, title: e.target.value } : r
                                );
                                setResourcesList(updated);
                                regenerateMarkdownFromList(updated);
                              }}
                            />
                          </div>

                          <div className="llms-resource-actions-row">
                            <select
                              className="llms-resource-select"
                              value={item.section}
                              onChange={(e) => handleChangeSection(item.id, e.target.value)}
                              title="Assign section in llms.txt"
                            >
                              {SECTIONS_LIST.map((sec) => (
                                <option key={sec} value={sec}>
                                  {sec}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="llms-resource-delete-btn"
                              onClick={() => handleDeleteResource(item.id)}
                              title="Delete link"
                              aria-label="Delete resource link"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          className="llms-resource-input"
                          value={item.description}
                          placeholder="Description for AI agents (optional)..."
                          onChange={(e) => {
                            const updated = resourcesList.map((r) =>
                              r.id === item.id ? { ...r, description: e.target.value } : r
                            );
                            setResourcesList(updated);
                            regenerateMarkdownFromList(updated);
                          }}
                        />

                        <div className="llms-resource-url-row">
                          <Globe size={12} className="llms-resource-url-icon" />
                          <input
                            type="text"
                            className="llms-resource-url-input"
                            value={item.url}
                            placeholder="https://example.com/page"
                            onChange={(e) => {
                              const updated = resourcesList.map((r) =>
                                r.id === item.id ? { ...r, url: e.target.value } : r
                              );
                              setResourcesList(updated);
                              regenerateMarkdownFromList(updated);
                            }}
                          />
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="llms-resource-url-external"
                            title="Open link in new tab"
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                        No resources in your list yet.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddCustomResource}
                        icon={<Plus size={13} />}
                      >
                        Add your first link
                      </Button>
                    </div>
                  )}
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
          </div>          {/* Checker Results */}
          {checkData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* File Inspection Status Banner */}
              <div className="chk-status-banner">
                <div className="chk-status-left">
                  <div
                    className={`chk-status-icon-circle ${
                      checkData.rootReport.status === 'found' ? 'success' : 'danger'
                    }`}
                  >
                    {checkData.rootReport.status === 'found' ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <XCircle size={24} />
                    )}
                  </div>

                  <div className="chk-status-info">
                    <div className="chk-status-headline">
                      <span className="chk-status-url">{checkData.rootReport.url}</span>
                      <span
                        className={`chk-status-pill ${
                          checkData.rootReport.status === 'found' ? 'success' : 'danger'
                        }`}
                      >
                        {checkData.rootReport.status === 'found' ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>HTTP 200 OK • Deployed</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>{checkData.rootReport.httpCode ? `HTTP ${checkData.rootReport.httpCode}` : 'Not Found'}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="chk-meta-list">
                      {checkData.rootReport.sizeBytes > 0 && (
                        <span>{(checkData.rootReport.sizeBytes / 1024).toFixed(1)} KB</span>
                      )}
                      {checkData.rootReport.responseTimeMs > 0 && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} />
                            {checkData.rootReport.responseTimeMs}ms response
                          </span>
                        </>
                      )}
                      {checkData.rootReport.contentType && (
                        <>
                          <span>•</span>
                          <span>{checkData.rootReport.contentType}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{checkData.rootReport.hasBom ? 'UTF-8 with BOM' : 'UTF-8 Clean'}</span>
                    </div>
                  </div>
                </div>

                <div className="chk-status-actions">
                  {checkData.rootReport.content && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendToValidator(checkData.rootReport.content)}
                        icon={<Wand2 size={13} />}
                      >
                        Send to Validator
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(checkData.rootReport.content, 'chk-copy')}
                        icon={copiedId === 'chk-copy' ? <Check size={13} /> : <Copy size={13} />}
                      >
                        {copiedId === 'chk-copy' ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownload(checkData.rootReport.content, 'llms.txt')}
                        icon={<Download size={13} />}
                      >
                        Download
                      </Button>
                    </>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(checkData.rootReport.url, '_blank')}
                    icon={<ExternalLink size={13} />}
                  >
                    Open File
                  </Button>
                </div>
              </div>

              {/* Path-level file banner if detected */}
              {checkData.pathReport && (
                <div className="chk-path-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Layers size={16} color="#059669" />
                    <div>
                      <strong>Path-Level llms.txt Detected:</strong>{' '}
                      <code>{checkData.pathReport.url}</code> (HTTP 200 OK • {(checkData.pathReport.sizeBytes / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                  <Badge variant="success">Scoped Precedence</Badge>
                </div>
              )}

              {/* 4 Apple KPI Scorecard Grid */}
              <div className="val-kpi-grid">
                {/* 1. Agent Discovery */}
                <div className="val-kpi-card">
                  <div className="val-kpi-top">
                    <span>Agent Discovery</span>
                    <Sparkles size={15} color="#6366f1" />
                  </div>
                  <div className="val-kpi-val" style={{ fontSize: '1.25rem' }}>
                    {checkData.discoverability.describedByDetected ? (
                      <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={16} /> rel="describedby"
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={16} color="#f59e0b" /> Not Advertised
                      </span>
                    )}
                  </div>
                  <div className="val-kpi-label">
                    {checkData.discoverability.describedByDetected
                      ? 'Advertised in homepage HTML or HTTP Link headers'
                      : 'Missing <link rel="describedby" href="/llms.txt"> tag'}
                  </div>
                </div>

                {/* 2. Link Health */}
                <div className="val-kpi-card">
                  <div className="val-kpi-top">
                    <span>Link Health Sample</span>
                    <Activity size={15} color="#10b981" />
                  </div>
                  <div className="val-kpi-val" style={{ fontSize: '1.25rem' }}>
                    <span style={{ color: checkData.linksSummary.brokenCount === 0 ? '#059669' : '#dc2626' }}>
                      {checkData.linksSummary.validCount} / {checkData.linksSummary.testedCount} Live
                    </span>
                  </div>
                  <div className="val-kpi-label">
                    {checkData.linksSummary.brokenCount > 0
                      ? `${checkData.linksSummary.brokenCount} broken link(s) detected`
                      : 'All tested links resolved with HTTP 200 OK'}
                  </div>
                </div>

                {/* 3. Markdown Alternatives */}
                <div className="val-kpi-card">
                  <div className="val-kpi-top">
                    <span>Markdown Alternatives</span>
                    <FileCode size={15} color="#3b82f6" />
                  </div>
                  <div className="val-kpi-val" style={{ fontSize: '1.25rem' }}>
                    <span style={{ color: (checkData.linksSummary.markdownAltCount || 0) > 0 ? '#059669' : 'var(--text-main)' }}>
                      {checkData.linksSummary.markdownAltCount || 0} Alternate .md
                    </span>
                  </div>
                  <div className="val-kpi-label">
                    Discovered via <code>&lt;link rel="alternate" type="text/markdown"&gt;</code>
                  </div>
                </div>

                {/* 4. Curation Density */}
                <div className="val-kpi-card">
                  <div className="val-kpi-top">
                    <span>Curation Density</span>
                    <Layers size={15} color="#8b5cf6" />
                  </div>
                  <div className="val-kpi-val" style={{ fontSize: '1.25rem' }}>
                    {checkData.linksSummary.totalFound} Resources
                  </div>
                  <div className="val-kpi-label">
                    {checkData.curationComparison.feedback}
                  </div>
                </div>
              </div>

              {/* Link Health Audit Table OR Diagnostic Endpoint Probes Table */}
              {checkData.linksSummary.auditedLinks?.length > 0 ? (
                <div className="chk-table-card">
                  <div className="chk-table-header">
                    <div className="chk-table-title">
                      <Link2 size={16} />
                      <span>Audited Resource Links</span>
                      <Badge variant="neutral">
                        {filteredAuditedLinks.length} of {checkData.linksSummary.testedCount} links
                      </Badge>
                    </div>

                    <div className="chk-table-controls">
                      {/* Search Input */}
                      <div className="chk-search-wrapper">
                        <Search size={13} className="chk-search-icon" />
                        <input
                          type="text"
                          className="chk-search-input"
                          placeholder="Search links or URLs..."
                          value={chkSearch}
                          onChange={(e) => setChkSearch(e.target.value)}
                        />
                      </div>

                      {/* Filter Tabs */}
                      <div className="chk-filter-tabs">
                        <button
                          type="button"
                          className={`chk-filter-btn ${chkFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setChkFilter('all')}
                        >
                          All ({checkData.linksSummary.testedCount})
                        </button>
                        <button
                          type="button"
                          className={`chk-filter-btn ${chkFilter === 'valid' ? 'active' : ''}`}
                          onClick={() => setChkFilter('valid')}
                        >
                          Valid ({checkData.linksSummary.validCount})
                        </button>
                        {checkData.linksSummary.redirectCount > 0 && (
                          <button
                            type="button"
                            className={`chk-filter-btn ${chkFilter === 'redirect' ? 'active' : ''}`}
                            onClick={() => setChkFilter('redirect')}
                          >
                            Redirects ({checkData.linksSummary.redirectCount})
                          </button>
                        )}
                        {checkData.linksSummary.brokenCount > 0 && (
                          <button
                            type="button"
                            className={`chk-filter-btn ${chkFilter === 'broken' ? 'active' : ''}`}
                            onClick={() => setChkFilter('broken')}
                          >
                            Broken ({checkData.linksSummary.brokenCount})
                          </button>
                        )}
                        {(checkData.linksSummary.markdownAltCount || 0) > 0 && (
                          <button
                            type="button"
                            className={`chk-filter-btn ${chkFilter === 'markdown' ? 'active' : ''}`}
                            onClick={() => setChkFilter('markdown')}
                          >
                            Markdown Alt ({checkData.linksSummary.markdownAltCount})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="chk-table-wrapper">
                    <table className="chk-table">
                      <thead>
                        <tr>
                          <th>Resource &amp; Canonical URL</th>
                          <th>HTTP Status</th>
                          <th>Response Latency</th>
                          <th>Markdown Alternative</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuditedLinks.length > 0 ? (
                          filteredAuditedLinks.map((link, idx) => (
                            <tr key={idx}>
                              <td>
                                <span className="chk-title-text">{link.title || 'Untitled Resource'}</span>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="chk-url-link"
                                >
                                  <span>{link.url}</span>
                                  <ExternalLink size={11} />
                                </a>
                              </td>

                              <td>
                                <span
                                  className={`chk-status-pill ${
                                    link.status === 'valid'
                                      ? 'success'
                                      : link.status === 'redirect'
                                      ? 'warning'
                                      : 'danger'
                                  }`}
                                >
                                  {link.status === 'valid' && <CheckCircle2 size={12} />}
                                  {link.status === 'redirect' && <AlertTriangle size={12} />}
                                  {['not_found', 'forbidden', 'warning'].includes(link.status) && (
                                    <XCircle size={12} />
                                  )}
                                  <span>
                                    {link.httpCode ? `HTTP ${link.httpCode}` : link.status}
                                  </span>
                                </span>
                              </td>

                              <td>
                                <span className="chk-latency-badge">
                                  <span
                                    className={`chk-latency-dot ${
                                      link.responseTimeMs < 400
                                        ? 'fast'
                                        : link.responseTimeMs < 1200
                                        ? 'medium'
                                        : 'slow'
                                    }`}
                                  />
                                  {link.responseTimeMs}ms
                                </span>
                              </td>

                              <td>
                                {link.hasMarkdownAlt ? (
                                  <span className="chk-alt-tag yes">
                                    <FileCode size={12} />
                                    <span>Discoverable (.md)</span>
                                  </span>
                                ) : (
                                  <span className="chk-alt-tag no">Standard HTML</span>
                                )}
                              </td>

                              <td style={{ textAlign: 'right' }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleCopy(link.url, `chk-link-${idx}`)}
                                  icon={copiedId === `chk-link-${idx}` ? <Check size={11} /> : <Copy size={11} />}
                                >
                                  {copiedId === `chk-link-${idx}` ? 'Copied' : 'Copy'}
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No links matched the selected filter or search query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="chk-table-card">
                  <div className="chk-table-header">
                    <div className="chk-table-title">
                      <ShieldCheck size={16} />
                      <span>Discovery Endpoints &amp; Diagnostic Probes</span>
                    </div>
                    <Badge variant="neutral">Probed Endpoints</Badge>
                  </div>

                  <div className="chk-table-wrapper">
                    <table className="chk-table">
                      <thead>
                        <tr>
                          <th>Probed Standard Endpoint</th>
                          <th>Target URL</th>
                          <th>HTTP Status</th>
                          <th>Response Latency</th>
                          <th>Technical Diagnostic</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <span className="chk-title-text">Root Specification</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RFC Standard Endpoint</span>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.8rem' }}>{checkData.rootReport.url}</code>
                          </td>
                          <td>
                            <span
                              className={`chk-status-pill ${
                                checkData.rootReport.status === 'found' ? 'success' : 'danger'
                              }`}
                            >
                              {checkData.rootReport.status === 'found' ? (
                                <>
                                  <CheckCircle2 size={12} />
                                  <span>HTTP 200 OK</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} />
                                  <span>{checkData.rootReport.httpCode ? `HTTP ${checkData.rootReport.httpCode}` : 'Not Found'}</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td>
                            <span className="chk-latency-badge">
                              <span
                                className={`chk-latency-dot ${
                                  checkData.rootReport.responseTimeMs < 400
                                    ? 'fast'
                                    : checkData.rootReport.responseTimeMs < 1200
                                    ? 'medium'
                                    : 'slow'
                                }`}
                              />
                              {checkData.rootReport.responseTimeMs || 0}ms
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {checkData.rootReport.status === 'found'
                              ? 'Valid llms.txt found, but no resource links were declared inside the markdown.'
                              : 'Domain does not serve a public /llms.txt file at its root.'}
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <span className="chk-title-text">Full Bundle Endpoint</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High-Context Target</span>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.8rem' }}>{checkData.origin}/llms-full.txt</code>
                          </td>
                          <td>
                            <span className="chk-status-pill neutral">
                              <Clock size={12} />
                              <span>Optional Spec</span>
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Comprehensive documentation bundle for large LLM context windows.
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <span className="chk-title-text">Discovery Header &amp; Link</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agent Autodiscovery</span>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.8rem' }}>&lt;link rel="describedby"&gt;</code>
                          </td>
                          <td>
                            <span
                              className={`chk-status-pill ${
                                checkData.discoverability.describedByDetected ? 'success' : 'neutral'
                              }`}
                            >
                              {checkData.discoverability.describedByDetected ? (
                                <>
                                  <CheckCircle2 size={12} />
                                  <span>Advertised</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={12} />
                                  <span>Not Detected</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {checkData.discoverability.describedByDetected
                              ? 'Homepage exposes rel="describedby" header pointing agents to llms.txt.'
                              : 'Add <link rel="describedby" href="/llms.txt"> to your homepage HTML head.'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Apple Callout to Generate llms.txt in 1 click */}
                  <div className="chk-cta-banner">
                    <div className="chk-cta-content">
                      <div className="chk-cta-icon-box">
                        <Wand2 size={20} />
                      </div>
                      <div>
                        <h4 className="chk-cta-title">
                          Generate an llms.txt site guide for {checkData.domain}
                        </h4>
                        <p className="chk-cta-desc">
                          Help AI agents like ChatGPT, Claude, and Perplexity understand your website with a clean, curated Markdown guide.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        const targetDomain = checkData.checkedUrl || `https://${checkData.domain}`;
                        setGenUrl(targetDomain);
                        setActiveMode('generator');
                        handleGenerate(targetDomain);
                      }}
                      icon={<Sparkles size={14} />}
                    >
                      Generate with 1-Click
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* ================================================================= */}
      {/* MODE 3: VALIDATOR & AUTO-FIX WORKSPACE */}
      {/* ================================================================= */}
      {activeMode === 'validator' && (
        <div className="val-workspace">
          {/* Main Input / Editor Card */}
          <div className="val-editor-card">
            <div className="val-editor-header">
              <div className="val-editor-title">
                <Code2 size={16} />
                <span>LLMs.txt Specification Editor</span>
              </div>

              {/* Mode Toggle Pills */}
              <div className="val-segmented-pills">
                <button
                  type="button"
                  className={`val-segmented-pill ${valInputMode === 'paste' ? 'active' : ''}`}
                  onClick={() => setValInputMode('paste')}
                >
                  <FileText size={13} />
                  <span>Paste / Edit Markdown</span>
                </button>
                <button
                  type="button"
                  className={`val-segmented-pill ${valInputMode === 'url' ? 'active' : ''}`}
                  onClick={() => setValInputMode('url')}
                >
                  <Globe size={13} />
                  <span>Fetch from URL</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="val-presets-bar">
              <div className="val-presets-group">
                <span>Sample presets:</span>
                <button
                  type="button"
                  className="val-preset-chip"
                  onClick={() => {
                    setValInputMode('paste');
                    setValText(VALID_SAMPLE);
                    handleValidate(VALID_SAMPLE);
                  }}
                >
                  <Sparkles size={11} /> Valid v2 Spec
                </button>
                <button
                  type="button"
                  className="val-preset-chip"
                  onClick={() => {
                    setValInputMode('paste');
                    setValText(BROKEN_SAMPLE);
                    handleValidate(BROKEN_SAMPLE);
                  }}
                >
                  <AlertTriangle size={11} /> Common Issues &amp; Fixes
                </button>
                <button
                  type="button"
                  className="val-preset-chip"
                  onClick={() => {
                    setValInputMode('paste');
                    setValText(PATH_SAMPLE);
                    handleValidate(PATH_SAMPLE);
                  }}
                >
                  <FileCode size={11} /> Path-Level (/docs)
                </button>
              </div>

              {valInputMode === 'paste' && valText && (
                <button
                  type="button"
                  className="val-preset-chip danger"
                  onClick={() => {
                    setValText('');
                    setValReport(null);
                  }}
                >
                  <Trash2 size={11} /> Clear Editor
                </button>
              )}
            </div>

            {/* Input Body */}
            {valInputMode === 'paste' ? (
              <div className="val-textarea-container">
                <textarea
                  className="val-textarea-input"
                  value={valText}
                  onChange={(e) => setValText(e.target.value)}
                  placeholder="# Site Name&#10;&#10;> Project summary blockquote...&#10;&#10;## Documentation&#10;&#10;- [Quickstart](https://example.com/docs): Introduction guide."
                  spellCheck="false"
                />

                <div className="val-editor-footer">
                  <div className="val-meta-stats">
                    <span>{valText.split(/\r?\n/).length} lines</span>
                    <span>•</span>
                    <span>{valText.trim() ? valText.trim().split(/\s+/).length : 0} words</span>
                    <span>•</span>
                    <span>{valText.length.toLocaleString()} chars</span>
                    <span>•</span>
                    <Badge variant="neutral" icon={<CheckCircle2 size={11} />}>
                      llmstxt.org v2 standard
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <Button
                      variant="primary"
                      onClick={() => handleValidate()}
                      disabled={isValidating || !valText.trim()}
                      icon={isValidating ? <Clock size={15} className="spin" /> : <ShieldCheck size={15} />}
                    >
                      {isValidating ? 'Validating...' : 'Validate Specification'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="val-url-input-box">
                <div className="llms-input-wrapper" style={{ width: '100%' }}>
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
                    onClick={() => handleValidate(undefined, valUrl)}
                    disabled={isValidating || !valUrl.trim()}
                    icon={isValidating ? <Clock size={15} className="spin" /> : <Search size={15} />}
                  >
                    {isValidating ? 'Fetching...' : 'Validate URL'}
                  </Button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                  Probes remote endpoint with safe SSRF filter and audits RFC v2 compliance.
                </p>
              </div>
            )}
          </div>

          {/* Validation Report & Audit Dashboard */}
          {valReport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Apple Radial Score Banner */}
              <div className="val-score-banner">
                <div className="val-score-left">
                  {/* Circular Radial Meter */}
                  <div className="val-radial-meter">
                    <svg className="val-meter-svg" viewBox="0 0 100 100">
                      <circle className="val-meter-bg" cx="50" cy="50" r="40" />
                      <circle
                        className={`val-meter-fg ${valReport.statusColor}`}
                        cx="50"
                        cy="50"
                        r="40"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * valReport.score) / 100}
                      />
                    </svg>
                    <div className="val-meter-number-box">
                      <span className="val-meter-score">{valReport.score}</span>
                      <span className="val-meter-max">/ 100</span>
                    </div>
                  </div>

                  <div className="val-score-details">
                    <div className="val-score-headline">
                      <h3 className="val-score-title">LLMs.txt Quality Score</h3>
                      <span className={`val-status-pill ${valReport.statusColor}`}>
                        {valReport.statusLabel}
                      </span>
                    </div>
                    <p className="val-score-desc">
                      Audited against proposed <code>llms.txt v2</code> specification • {valReport.stats.errorsCount} Error(s), {valReport.stats.warningsCount} Warning(s), {valReport.stats.recommendationsCount} Recommendation(s).
                    </p>
                    <span className="val-score-disclaimer">
                      * Quality Score is an informational rating based on document structure, not a search ranking guarantee.
                    </span>
                  </div>
                </div>

                <div className="val-score-actions">
                  {diffLines.length > 0 && (
                    <Button
                      variant={showDiff ? 'secondary' : 'primary'}
                      onClick={() => setShowDiff(!showDiff)}
                      icon={<Zap size={14} />}
                      size="sm"
                    >
                      {showDiff ? 'Hide Diff' : 'View Auto-Fix Diff'}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => handleCopy(valReport.fixedContent || valText, 'val-copy-btn')}
                    icon={copiedId === 'val-copy-btn' ? <Check size={13} /> : <Copy size={13} />}
                    size="sm"
                  >
                    {copiedId === 'val-copy-btn' ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownload(valReport.fixedContent || valText, 'llms.txt')}
                    icon={<Download size={13} />}
                    size="sm"
                  >
                    Download .txt
                  </Button>
                </div>
              </div>

              {/* 4-KPI Grid */}
              <div className="val-kpi-grid">
                <div className="val-kpi-card">
                  <div className="val-kpi-top">
                    <span>Specification Structure</span>
                    <CheckCircle2 size={15} color={valReport.stats.errorsCount === 0 ? '#10b981' : '#ef4444'} />
                  </div>
                  <div className="val-kpi-val" style={{ color: valReport.stats.errorsCount === 0 ? '#059669' : '#dc2626' }}>
                    {valReport.stats.errorsCount === 0 ? 'Spec Compliant' : 'Invalid Syntax'}
                  </div>
                  <div className="val-kpi-label">
                    {valReport.structure.title ? `# ${valReport.structure.title}` : 'Missing H1 Title'}
                  </div>
                </div>

                <div className="val-kpi-card">
                  <div className="val-kpi-top">
                    <span>Critical Errors</span>
                    <XCircle size={15} color={valReport.stats.errorsCount > 0 ? '#ef4444' : '#10b981'} />
                  </div>
                  <div className="val-kpi-val" style={{ color: valReport.stats.errorsCount > 0 ? '#dc2626' : '#059669' }}>
                    {valReport.stats.errorsCount}
                  </div>
                  <div className="val-kpi-label">
                    {valReport.stats.errorsCount === 0 ? 'Zero blocking violations' : 'Requires immediate repair'}
                  </div>
                </div>

                <div className="val-kpi-card">
                  <div className="val-kpi-top">
                    <span>Warnings &amp; Curation</span>
                    <AlertTriangle size={15} color={valReport.stats.warningsCount > 0 ? '#f59e0b' : '#10b981'} />
                  </div>
                  <div className="val-kpi-val" style={{ color: valReport.stats.warningsCount > 0 ? '#d97706' : '#059669' }}>
                    {valReport.stats.warningsCount}
                  </div>
                  <div className="val-kpi-label">
                    {valReport.stats.warningsCount === 0 ? 'Well curated density' : 'Formatting or duplicate notices'}
                  </div>
                </div>

                <div className="val-kpi-card">
                  <div className="val-kpi-top">
                    <span>Curated Resources</span>
                    <Layers size={15} />
                  </div>
                  <div className="val-kpi-val">
                    {valReport.stats.linksCount}
                  </div>
                  <div className="val-kpi-label">
                    Organized into {valReport.stats.sectionsCount} H2 section(s)
                  </div>
                </div>
              </div>

              {/* Auto-Fix Line Diff Card (When toggled or diff exists) */}
              {showDiff && diffLines.length > 0 && (
                <div className="val-section-card">
                  <div className="val-section-card-header">
                    <div className="val-section-card-title">
                      <GitCompare size={16} />
                      <span>Auto-Fix Comparison Diff</span>
                      <Badge variant="success">Repaired Format</Badge>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setValText(valReport.fixedContent);
                          setShowDiff(false);
                          handleValidate(valReport.fixedContent);
                        }}
                        icon={<Wand2 size={13} />}
                      >
                        Apply Fix to Editor
                      </Button>
                    </div>
                  </div>

                  <p style={{ margin: '1rem 1.5rem 0.25rem 1.5rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Red lines (<code style={{ color: '#ff7b72' }}>-</code>) will be removed; green lines (<code style={{ color: '#7ee787' }}>+</code>) represent standardized Markdown syntax.
                  </p>

                  <div className="val-diff-box">
                    {diffLines.map((d, idx) => (
                      <div key={idx} className={`val-diff-line ${d.type}`}>
                        <span className="val-diff-num">{d.num}</span>
                        <span>{d.type === 'add' ? '+ ' : d.type === 'del' ? '- ' : '  '}{d.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specification Checklist Card */}
              <div className="val-section-card">
                <div className="val-section-card-header">
                  <div className="val-section-card-title">
                    <CheckSquare size={16} />
                    <span>Specification Compliance Checklist</span>
                  </div>
                  <Badge variant="neutral">RFC v2 Standard</Badge>
                </div>

                <div className="val-checklist-items">
                  <div className="val-check-row">
                    <div className="val-check-badge">
                      {valReport.structure.title ? (
                        <CheckCircle2 size={17} color="#10b981" />
                      ) : (
                        <XCircle size={17} color="#ef4444" />
                      )}
                    </div>
                    <div>
                      <span className="val-check-title">H1 Project Title:</span>
                      <span className="val-check-detail">
                        {valReport.structure.title ? (
                          <code># {valReport.structure.title}</code>
                        ) : (
                          'Missing required H1 heading. llms.txt requires exactly one primary H1 title.'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="val-check-row">
                    <div className="val-check-badge">
                      {valReport.structure.summary ? (
                        <CheckCircle2 size={17} color="#10b981" />
                      ) : (
                        <AlertTriangle size={17} color="#f59e0b" />
                      )}
                    </div>
                    <div>
                      <span className="val-check-title">Blockquote Summary:</span>
                      <span className="val-check-detail">
                        {valReport.structure.summary ? (
                          <code>&gt; {valReport.structure.summary}</code>
                        ) : (
                          'No blockquote summary detected directly following H1. Recommended to provide high-level AI context.'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="val-check-row">
                    <div className="val-check-badge">
                      {valReport.structure.sections.length > 0 ? (
                        <CheckCircle2 size={17} color="#10b981" />
                      ) : (
                        <AlertTriangle size={17} color="#f59e0b" />
                      )}
                    </div>
                    <div>
                      <span className="val-check-title">H2 Resource Sections:</span>
                      <span className="val-check-detail">
                        {valReport.structure.sections.length > 0 ? (
                          `${valReport.structure.sections.length} section(s) defined (${valReport.structure.sections.map(s => s.name).join(', ')}).`
                        ) : (
                          'No H2 sections found. Resources should be grouped under H2 headings (e.g. ## Products, ## Documentation).'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="val-check-row">
                    <div className="val-check-badge">
                      {valReport.stats.linksCount > 0 ? (
                        <CheckCircle2 size={17} color="#10b981" />
                      ) : (
                        <AlertTriangle size={17} color="#f59e0b" />
                      )}
                    </div>
                    <div>
                      <span className="val-check-title">Markdown Link Syntax:</span>
                      <span className="val-check-detail">
                        {valReport.stats.linksCount > 0 ? (
                          `All ${valReport.stats.linksCount} links adhere to the standard Markdown list format: - [Title](URL): Description`
                        ) : (
                          'No formatted resource links discovered.'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="val-check-row">
                    <div className="val-check-badge">
                      {!valReport.errors.some(e => e.rule === 'RELATIVE_URL') ? (
                        <CheckCircle2 size={17} color="#10b981" />
                      ) : (
                        <XCircle size={17} color="#ef4444" />
                      )}
                    </div>
                    <div>
                      <span className="val-check-title">Absolute Canonical URLs:</span>
                      <span className="val-check-detail">
                        {!valReport.errors.some(e => e.rule === 'RELATIVE_URL') ? (
                          'All resource targets use absolute protocols (https://).'
                        ) : (
                          'Relative paths detected. AI agents require fully-qualified absolute URLs.'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categorized Issues List (If errors, warnings or recommendations exist) */}
              {(valReport.errors.length > 0 || valReport.warnings.length > 0 || valReport.recommendations.length > 0) && (
                <div className="val-section-card">
                  <div className="val-section-card-header">
                    <div className="val-section-card-title">
                      <AlertTriangle size={16} />
                      <span>Audit Findings &amp; Action Items</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {valReport.errors.length + valReport.warnings.length + valReport.recommendations.length} total items
                    </span>
                  </div>

                  <div>
                    {valReport.errors.map((err, idx) => (
                      <div key={`err-${idx}`} className="val-issue-row error">
                        <XCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <span className="val-issue-rule-tag error">{err.rule}</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{err.message}</span>
                        </div>
                      </div>
                    ))}

                    {valReport.warnings.map((warn, idx) => (
                      <div key={`warn-${idx}`} className="val-issue-row warning">
                        <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <span className="val-issue-rule-tag warning">{warn.rule}</span>
                          <span style={{ color: 'var(--text-main)' }}>{warn.message}</span>
                        </div>
                      </div>
                    ))}

                    {valReport.recommendations.map((rec, idx) => (
                      <div key={`rec-${idx}`} className="val-issue-row rec">
                        <CheckCircle2 size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <span className="val-issue-rule-tag rec">{rec.rule || 'RECOMMENDATION'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{rec.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-View Inspector (Rendered Guide, Raw Source, Parsed Tree) */}
              <div className="val-section-card">
                <div className="val-section-card-header">
                  <div className="val-segmented-pills">
                    <button
                      type="button"
                      className={`val-segmented-pill ${valPreviewTab === 'rendered' ? 'active' : ''}`}
                      onClick={() => setValPreviewTab('rendered')}
                    >
                      <Eye size={13} />
                      <span>Rendered Guide</span>
                    </button>
                    <button
                      type="button"
                      className={`val-segmented-pill ${valPreviewTab === 'raw' ? 'active' : ''}`}
                      onClick={() => setValPreviewTab('raw')}
                    >
                      <Code2 size={13} />
                      <span>Raw Markdown</span>
                    </button>
                    <button
                      type="button"
                      className={`val-segmented-pill ${valPreviewTab === 'parsed' ? 'active' : ''}`}
                      onClick={() => setValPreviewTab('parsed')}
                    >
                      <Layers size={13} />
                      <span>Parsed Schema</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(valText, 'val-copy-tab')}
                      icon={copiedId === 'val-copy-tab' ? <Check size={12} /> : <Copy size={12} />}
                    >
                      {copiedId === 'val-copy-tab' ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(valText, 'llms.txt')}
                      icon={<Download size={12} />}
                    >
                      Download
                    </Button>
                  </div>
                </div>

                {/* 1. Rendered Guide */}
                {valPreviewTab === 'rendered' && (
                  <div className="val-rendered-view">
                    <h1 className="val-rendered-h1">
                      {valReport.structure.title || 'Untitled Site Guide'}
                    </h1>

                    {valReport.structure.summary && (
                      <div className="val-rendered-quote">
                        {valReport.structure.summary}
                      </div>
                    )}

                    {valReport.structure.info && (
                      <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-muted)' }}>
                        {valReport.structure.info}
                      </p>
                    )}

                    {valReport.structure.sections.map((sec, sIdx) => (
                      <div key={sIdx} style={{ marginBottom: '1.5rem' }}>
                        <h2 className="val-rendered-h2">## {sec.name}</h2>
                        {sec.resources.length > 0 ? (
                          <ul className="val-rendered-list">
                            {sec.resources.map((r, rIdx) => (
                              <li key={rIdx}>
                                <a href={r.url} target="_blank" rel="noopener noreferrer">
                                  {r.title}
                                </a>
                                {r.description && (
                                  <span className="val-rendered-desc">: {r.description}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            (No resources listed in this section)
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Raw Markdown */}
                {valPreviewTab === 'raw' && (
                  <pre className="val-textarea-input" style={{ background: 'transparent', margin: 0 }}>
                    {valText}
                  </pre>
                )}

                {/* 3. Parsed JSON Tree */}
                {valPreviewTab === 'parsed' && (
                  <div style={{ padding: '1.5rem', background: 'rgba(150, 150, 150, 0.02)' }}>
                    <pre style={{ margin: 0, fontSize: '0.84rem', fontFamily: 'ui-monospace, monospace', lineHeight: 1.6, color: 'var(--text-main)' }}>
                      {JSON.stringify(valReport.structure, null, 2)}
                    </pre>
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
