import React, { useState } from 'react';
import {
  FileText,
  Globe,
  Search,
  Sparkles,
  Zap,
  Check,
  Copy,
  Download,
  Code2,
  Clock,
  Eye,
  Sliders,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Bot,
  Link2,
  RotateCcw
} from 'lucide-react';
import { htmlToMarkdownManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Button, Badge, ToolHeader, AdSlot } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import HtmlToMarkdownSeo from './components/HtmlToMarkdownSeo';
import './html-to-markdown.css';

const SAMPLE_SITES = [
  { name: 'Wikipedia (AI)', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' },
  { name: 'Anthropic Research', url: 'https://www.anthropic.com/research' },
  { name: 'FastAPI Docs', url: 'https://fastapi.tiangolo.com' },
  { name: 'Example Domain', url: 'https://example.com' }
];

const SAMPLE_HTML = `<article>
  <header>
    <h1>Deep Learning Architectures for Agentic Reasoning</h1>
    <p class="byline">Published on September 18, 2026 by AI Engineering Lab</p>
  </header>

  <p>Modern Large Language Models rely heavily on <strong>contextual grounding</strong> and structured tool-use frameworks.</p>

  <h2>Key Requirements for RAG Pipelines</h2>
  <ul>
    <li>Minimal token footprint per ingested document</li>
    <li>Zero noisy navigation, header, or footer boilerplate</li>
    <li>Preservation of technical code blocks and tabular metrics</li>
  </ul>

  <h2>Benchmark Comparison</h2>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Context Window</th>
        <th>Token Efficiency</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Claude 3.5 Sonnet</td>
        <td>200,000</td>
        <td>High</td>
      </tr>
      <tr>
        <td>GPT-4o</td>
        <td>128,000</td>
        <td>High</td>
      </tr>
    </tbody>
  </table>

  <h2>Implementation Snippet</h2>
  <pre><code class="language-python">def ingest_markdown(content: str) -> list[str]:
    chunks = split_by_headings(content, max_tokens=500)
    return [generate_embedding(c) for c in chunks]</code></pre>

  <blockquote>Clean markdown reduces prompt costs by up to 90% compared to raw HTML markup.</blockquote>
</article>`;

const PROMPT_TEMPLATES = [
  {
    title: 'Executive Summary',
    desc: 'Condense into 3 bullet points with key takeaways.',
    wrap: (md) => `Please provide a concise executive summary of the following document in 3-5 bullet points:\n\n${md}`
  },
  {
    title: 'Extract Key Facts & Data',
    desc: 'Isolate all quantitative data, tables, and statistics.',
    wrap: (md) => `Extract all quantitative metrics, facts, and tabular data from this document:\n\n${md}`
  },
  {
    title: 'Technical Q&A Context',
    desc: 'Prepare document as grounded RAG reference context.',
    wrap: (md) => `You are an expert AI assistant. Use the following verified reference context to answer user questions:\n\n<context>\n${md}\n</context>`
  },
  {
    title: 'Explain Like I\'m 5 (ELI5)',
    desc: 'Explain complex jargon in simple, accessible language.',
    wrap: (md) => `Explain the core ideas of the following article in simple, everyday language that a 10-year-old can understand:\n\n${md}`
  }
];

export default function HtmlToLlmMarkdown({ onBack, toolMeta }) {
  const {
    trackUse,
    trackCopy,
    trackDownload,
    visitorCount,
    conversionCount,
    getConversionLabel
  } = useToolAnalytics(htmlToMarkdownManifest.slug, toolMeta);

  // Mode: 'url' | 'html'
  const [inputMode, setInputMode] = useState('url');
  const [targetUrl, setTargetUrl] = useState('');
  const [rawHtml, setRawHtml] = useState(SAMPLE_HTML);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Conversion Options
  const [extractArticleOnly, setExtractArticleOnly] = useState(true);
  const [keepLinks, setKeepLinks] = useState(true);
  const [keepImages, setKeepImages] = useState(false);
  const [addFrontmatter, setAddFrontmatter] = useState(true);

  // Result state
  const [resultData, setResultData] = useState(null);
  const [editableMarkdown, setEditableMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState('markdown'); // 'markdown' | 'preview' | 'prompts'
  const [copiedId, setCopiedId] = useState(null);

  // Conversion handler
  const handleConvert = async (overrideUrl) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const isUrl = inputMode === 'url' || overrideUrl;
      const urlToUse = overrideUrl || targetUrl;

      if (isUrl && !urlToUse.trim()) {
        throw new Error('Please enter a website URL to fetch and convert.');
      }
      if (!isUrl && !rawHtml.trim()) {
        throw new Error('Please enter or paste HTML code to convert.');
      }

      const body = {
        options: {
          extractArticleOnly,
          removeLinks: !keepLinks,
          removeImages: !keepImages,
          addFrontmatter
        }
      };

      if (isUrl) {
        body.url = urlToUse.trim();
      } else {
        body.html = rawHtml;
      }

      const resp = await fetch('/api/tools/html-to-markdown/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Conversion failed with status ${resp.status}`);
      }

      const resJson = await resp.json();
      if (!resJson.success) {
        throw new Error(resJson.error || 'Failed to convert HTML to Markdown.');
      }

      setResultData(resJson.data);
      setEditableMarkdown(resJson.data.markdown);
      trackUse({
        mode: isUrl ? 'url' : 'html',
        originalSize: resJson.data.originalSizeBytes,
        markdownSize: resJson.data.markdownSizeBytes,
        savingsPercent: resJson.data.savingsPercent
      });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, id = 'copy-btn') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    trackCopy({ mode: inputMode });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (content, filename = 'document.md') => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackDownload({ mode: inputMode, filename });
  };

  return (
    <div className="htm-container">
      {/* Tool Header */}
      <ToolHeader
        title={toolMeta?.title || htmlToMarkdownManifest.title}
        subtitle="Convert webpages and raw HTML into clean, token-efficient Markdown optimized for ChatGPT, Claude, Gemini, and RAG pipelines."
        slug={htmlToMarkdownManifest.slug}
        category={toolMeta?.category || htmlToMarkdownManifest.category}
        badgeText={toolMeta?.badge || htmlToMarkdownManifest.badge}
        viewsCount={visitorCount}
        usesCount={conversionCount}
        conversionLabel={getConversionLabel()}
        onBack={onBack}
      />

      <AdSlot slot="header-sub" />

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '14px',
          color: '#dc2626',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* Hero & Input Card */}
      <div className="htm-hero-card">
        <span className="htm-hero-eyebrow">
          <Sparkles size={14} /> Free In-Browser &amp; URL Converter
        </span>
        <h2 className="htm-hero-title">HTML to LLM Markdown Converter</h2>
        <p className="htm-hero-subtitle">
          Strip navigation bars, tracking scripts, and cookie banners to reduce prompt token consumption by up to <strong>90%</strong>.
        </p>

        {/* Input Mode Switcher */}
        <div className="htm-mode-switcher">
          <button
            type="button"
            className={`htm-mode-btn ${inputMode === 'url' ? 'active' : ''}`}
            onClick={() => setInputMode('url')}
          >
            <Globe size={14} />
            <span>Webpage URL</span>
          </button>
          <button
            type="button"
            className={`htm-mode-btn ${inputMode === 'html' ? 'active' : ''}`}
            onClick={() => setInputMode('html')}
          >
            <Code2 size={14} />
            <span>Paste HTML Snippet</span>
          </button>
        </div>

        {/* URL Input Form */}
        {inputMode === 'url' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConvert();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
          >
            <div className="htm-input-wrapper">
              <Globe className="htm-input-icon" size={18} />
              <input
                type="text"
                className="htm-input-field"
                placeholder="https://example.com/article"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                disabled={isLoading}
                spellCheck="false"
              />
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading || !targetUrl.trim()}
                icon={isLoading ? <Clock size={16} className="spin" /> : <Zap size={16} />}
              >
                {isLoading ? 'Converting...' : 'Convert URL'}
              </Button>
            </div>

            <div className="htm-samples-row">
              <span>Try sample:</span>
              {SAMPLE_SITES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="htm-sample-btn"
                  onClick={() => {
                    setTargetUrl(s.url);
                    handleConvert(s.url);
                  }}
                  disabled={isLoading}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </form>
        ) : (
          /* Raw HTML Input Form */
          <div className="htm-textarea-wrapper">
            <textarea
              className="htm-textarea"
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              placeholder="Paste raw HTML code here..."
              disabled={isLoading}
              spellCheck="false"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="htm-samples-row">
                <span>Preset:</span>
                <button
                  type="button"
                  className="htm-sample-btn"
                  onClick={() => setRawHtml(SAMPLE_HTML)}
                  disabled={isLoading}
                >
                  Load Tech Article Sample
                </button>
              </div>
              <Button
                variant="primary"
                onClick={() => handleConvert()}
                disabled={isLoading || !rawHtml.trim()}
                icon={isLoading ? <Clock size={16} className="spin" /> : <Zap size={16} />}
              >
                {isLoading ? 'Converting...' : 'Convert HTML to Markdown'}
              </Button>
            </div>
          </div>
        )}

        {/* Options Toggles Bar */}
        <div className="htm-options-bar">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Options:</span>
          
          <button
            type="button"
            className={`htm-option-toggle ${extractArticleOnly ? 'active' : ''}`}
            onClick={() => setExtractArticleOnly(!extractArticleOnly)}
            title="Isolate article or main content while stripping nav, footer and sidebars"
          >
            <Sparkles size={13} />
            <span>Article Extraction: {extractArticleOnly ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            className={`htm-option-toggle ${keepLinks ? 'active' : ''}`}
            onClick={() => setKeepLinks(!keepLinks)}
            title="Keep markdown links [text](url) or convert to plain text to save tokens"
          >
            <Link2 size={13} />
            <span>Retain Links: {keepLinks ? 'YES' : 'TEXT ONLY'}</span>
          </button>

          <button
            type="button"
            className={`htm-option-toggle ${keepImages ? 'active' : ''}`}
            onClick={() => setKeepImages(!keepImages)}
            title="Include or strip image tags"
          >
            <FileText size={13} />
            <span>Images: {keepImages ? 'INCLUDED' : 'STRIPPED'}</span>
          </button>

          <button
            type="button"
            className={`htm-option-toggle ${addFrontmatter ? 'active' : ''}`}
            onClick={() => setAddFrontmatter(!addFrontmatter)}
            title="Add YAML frontmatter with title, URL, date, and token estimates"
          >
            <Code2 size={13} />
            <span>YAML Frontmatter: {addFrontmatter ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Loading Progress State */}
      {isLoading && (
        <div className="htm-loading-card">
          <Clock size={24} className="spin" style={{ color: 'var(--text-main)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Parsing HTML &amp; Synthesizing Token-Efficient Markdown...
            </strong>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Stripping navigation chrome, translating tables, and estimating context tokens.
            </span>
          </div>
          <div className="htm-loading-track">
            <div className="htm-loading-bar" />
          </div>
        </div>
      )}

      {/* Results Workspace */}
      {resultData && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 4 Apple KPI Scorecards */}
          <div className="htm-kpi-grid">
            {/* 1. Original vs Clean Size */}
            <div className="htm-kpi-card">
              <div className="htm-kpi-top">
                <span>Size Reduction</span>
                <Layers size={15} color="#6366f1" />
              </div>
              <div className="htm-kpi-val">
                {(resultData.originalSizeBytes / 1024).toFixed(1)} KB → {(resultData.markdownSizeBytes / 1024).toFixed(1)} KB
              </div>
              <div className="htm-kpi-label">
                Cleaned document size compressed by {resultData.savingsPercent}%
              </div>
            </div>

            {/* 2. Token Savings */}
            <div className="htm-kpi-card">
              <div className="htm-kpi-top">
                <span>Prompt Token Savings</span>
                <Zap size={15} color="#10b981" />
              </div>
              <div className="htm-kpi-val savings">
                {resultData.savingsPercent}% Saved
              </div>
              <div className="htm-kpi-label">
                Eliminates non-semantic HTML boilerplate from prompt
              </div>
            </div>

            {/* 3. Estimated Tokens */}
            <div className="htm-kpi-card">
              <div className="htm-kpi-top">
                <span>Estimated Tokens</span>
                <Bot size={15} color="#3b82f6" />
              </div>
              <div className="htm-kpi-val">
                ~{resultData.estimatedTokens.toLocaleString()} tokens
              </div>
              <div className="htm-kpi-label">
                Standard ~4 chars/token heuristic for Claude / GPT
              </div>
            </div>

            {/* 4. Word Count */}
            <div className="htm-kpi-card">
              <div className="htm-kpi-top">
                <span>Word Count</span>
                <FileText size={15} color="#f59e0b" />
              </div>
              <div className="htm-kpi-val">
                {resultData.wordCount.toLocaleString()} words
              </div>
              <div className="htm-kpi-label">
                Reading time: ~{Math.max(1, Math.round(resultData.wordCount / 200))} min
              </div>
            </div>
          </div>

          {/* Main Workspace Card */}
          <div className="htm-workspace-card">
            {/* Toolbar */}
            <div className="htm-workspace-header">
              {/* View Tabs */}
              <div className="htm-view-tabs">
                <button
                  type="button"
                  className={`htm-view-tab ${activeTab === 'markdown' ? 'active' : ''}`}
                  onClick={() => setActiveTab('markdown')}
                >
                  <Code2 size={13} />
                  <span>Clean Markdown</span>
                </button>
                <button
                  type="button"
                  className={`htm-view-tab ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye size={13} />
                  <span>Reader Preview</span>
                </button>
                <button
                  type="button"
                  className={`htm-view-tab ${activeTab === 'prompts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('prompts')}
                >
                  <Bot size={13} />
                  <span>Prompt Wrappers</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="htm-workspace-actions">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCopy(editableMarkdown, 'main-copy')}
                  icon={copiedId === 'main-copy' ? <Check size={13} /> : <Copy size={13} />}
                >
                  {copiedId === 'main-copy' ? 'Copied' : 'Copy Markdown'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(editableMarkdown, `${(resultData.title || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.md`)}
                  icon={<Download size={13} />}
                >
                  Download .md
                </Button>
                {resultData.sourceUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(resultData.sourceUrl, '_blank')}
                    icon={<ExternalLink size={13} />}
                  >
                    Open Source
                  </Button>
                )}
              </div>
            </div>

            {/* Tab 1: Clean Markdown Editor */}
            {activeTab === 'markdown' && (
              <div className="htm-editor-body">
                <textarea
                  className="htm-markdown-editor"
                  value={editableMarkdown}
                  onChange={(e) => setEditableMarkdown(e.target.value)}
                  spellCheck="false"
                />
              </div>
            )}

            {/* Tab 2: Rendered Reader Preview */}
            {activeTab === 'preview' && (
              <div className="htm-preview-body">
                {/* Simulated minimal markdown render */}
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {editableMarkdown}
                </div>
              </div>
            )}

            {/* Tab 3: Prompt Wrappers */}
            {activeTab === 'prompts' && (
              <div className="htm-prompt-body">
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                    1-Click Prompt Wrapper Templates
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                    Select a template to instantly copy your converted document wrapped in targeted AI instructions:
                  </p>
                </div>

                <div className="htm-prompt-cards">
                  {PROMPT_TEMPLATES.map((tpl, idx) => (
                    <div
                      key={idx}
                      className="htm-prompt-card"
                      onClick={() => handleCopy(tpl.wrap(editableMarkdown), `prompt-${idx}`)}
                    >
                      <h4>
                        <span>{tpl.title}</span>
                        {copiedId === `prompt-${idx}` ? (
                          <Check size={14} color="#10b981" />
                        ) : (
                          <Copy size={13} color="var(--text-muted)" />
                        )}
                      </h4>
                      <p>{tpl.desc}</p>
                      <span style={{ fontSize: '0.74rem', color: '#6366f1', fontWeight: 600, marginTop: '0.35rem' }}>
                        {copiedId === `prompt-${idx}` ? 'Copied to Clipboard!' : 'Click to Copy Wrapped Prompt'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AdSlot slot="footer-top" />

      <ToolSeoDivider />

      {/* SEO & Technical Deep Dive Article */}
      <HtmlToMarkdownSeo />
    </div>
  );
}
