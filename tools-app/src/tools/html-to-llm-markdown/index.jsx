import React, { useState, useMemo } from 'react';
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
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Bot,
  Link2,
  RotateCcw,
  Users,
  Activity,
  AlertTriangle,
  X,
  Trash2
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
    <p class="byline">Published by AI Engineering Lab</p>
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
    desc: 'Condense into 3 bullet points with key takeaways and conclusions.',
    wrap: (md) => `Please provide a concise executive summary of the following document in 3-5 high-impact bullet points:\n\n${md}`
  },
  {
    title: 'Extract Key Facts & Data',
    desc: 'Isolate all quantitative data, tables, figures, and technical statistics.',
    wrap: (md) => `Extract all quantitative metrics, facts, and tabular data from this document:\n\n${md}`
  },
  {
    title: 'Technical Q&A Context',
    desc: 'Prepare document as grounded RAG reference context for zero hallucination.',
    wrap: (md) => `You are an expert AI assistant. Use the following verified reference context to answer user questions with citations:\n\n<context>\n${md}\n</context>`
  },
  {
    title: 'Explain Like I\'m 5 (ELI5)',
    desc: 'Translate complex technical jargon into simple, everyday language.',
    wrap: (md) => `Explain the core concepts and findings of this article in clear, everyday language suitable for a beginner:\n\n${md}`
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

  // Input modes: 'url' | 'html'
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

  // Results State
  const [resultData, setResultData] = useState(null);
  const [editableMarkdown, setEditableMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState('markdown'); // 'markdown' | 'preview' | 'prompts'
  const [copiedId, setCopiedId] = useState(null);

  // Handle URL or HTML conversion
  const handleConvert = async (overrideUrl = null) => {
    setErrorMessage(null);
    const urlToUse = overrideUrl || targetUrl;

    if (inputMode === 'url' && !urlToUse.trim()) {
      setErrorMessage('Please enter a valid website URL to convert.');
      return;
    }

    if (inputMode === 'html' && !rawHtml.trim()) {
      setErrorMessage('Please paste some HTML content to convert.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        options: {
          isolateArticle: extractArticleOnly,
          preserveLinks: keepLinks,
          preserveImages: keepImages,
          includeFrontmatter: addFrontmatter
        }
      };

      if (inputMode === 'url') {
        payload.url = urlToUse.trim();
      } else {
        payload.html = rawHtml;
      }

      const response = await fetch('/api/tools/html-to-markdown/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to convert HTML to Markdown.');
      }

      setResultData(data.data);
      setEditableMarkdown(data.data.markdown || '');
      setActiveTab('markdown');
      trackUse({ mode: inputMode, tokens: data.data.estimatedTokens });
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred while converting content.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content, id = 'main') => {
    if (!content) return;
    navigator.clipboard.writeText(content);
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

  const handleReset = () => {
    setResultData(null);
    setEditableMarkdown('');
    setErrorMessage(null);
  };

  // Simple Markdown to HTML preview renderer
  const renderedPreviewHtml = useMemo(() => {
    if (!editableMarkdown) return '';

    // Strip frontmatter from preview if present
    let content = editableMarkdown.replace(/^---[\s\S]*?---\n*/, '');

    // Escape HTML entities to prevent injection
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced Code blocks
    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold & Italics
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Markdown Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Lists
    html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');

    // Paragraphs
    html = html.split(/\n{2,}/).map(para => {
      para = para.trim();
      if (!para) return '';
      if (para.startsWith('<h') || para.startsWith('<pre') || para.startsWith('<ul') || para.startsWith('<blockquote') || para.startsWith('<table')) {
        return para;
      }
      return `<p>${para.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');

    return html;
  }, [editableMarkdown]);

  return (
    <div className="c-tool-page-container htm-root">
      {/* Standardized ToolHeader */}
      <ToolHeader
        title={htmlToMarkdownManifest.title}
        subtitle={htmlToMarkdownManifest.shortDescription}
        onBack={onBack}
        slug={htmlToMarkdownManifest.slug}
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
              AI Assisted
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              SSRF Protected
            </Badge>
          </>
        }
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="htm-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="htm-error-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Hero & Input Card */}
      <div className="htm-hero-card">
        <div className="htm-hero-header">
          <span className="htm-hero-eyebrow">
            <Sparkles size={14} /> Free Web &amp; HTML Converter
          </span>
          <h2 className="htm-hero-title">Convert Webpages to Clean Markdown for LLMs</h2>
          <p className="htm-hero-subtitle">
            Strip boilerplate, cookie banners, navigation, and ads to reduce prompt tokens by up to <strong>90%</strong> for Claude, ChatGPT, and RAG pipelines.
          </p>
        </div>

        {/* Input Mode Segmented Control */}
        <div className="htm-mode-switcher-container">
          <div className="htm-mode-switcher">
            <button
              type="button"
              className={`htm-mode-btn ${inputMode === 'url' ? 'active' : ''}`}
              onClick={() => setInputMode('url')}
            >
              <Globe size={15} />
              <span>Webpage URL</span>
            </button>
            <button
              type="button"
              className={`htm-mode-btn ${inputMode === 'html' ? 'active' : ''}`}
              onClick={() => setInputMode('html')}
            >
              <Code2 size={15} />
              <span>Paste Raw HTML</span>
            </button>
          </div>
        </div>

        {/* Input Form: URL Mode */}
        {inputMode === 'url' ? (
          <form
            className="htm-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleConvert();
            }}
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
                autoCapitalize="none"
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
              <span className="htm-sample-label">Try sample:</span>
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
          /* Input Form: Raw HTML Mode */
          <div className="htm-input-form">
            <div className="htm-textarea-wrapper">
              <textarea
                className="htm-textarea"
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                placeholder="Paste raw HTML code here..."
                disabled={isLoading}
                spellCheck="false"
              />
              <div className="htm-textarea-actions">
                <div className="htm-samples-row">
                  <span className="htm-sample-label">Preset:</span>
                  <button
                    type="button"
                    className="htm-sample-btn"
                    onClick={() => setRawHtml(SAMPLE_HTML)}
                    disabled={isLoading}
                  >
                    Load Tech Article Sample
                  </button>
                  {rawHtml && (
                    <button
                      type="button"
                      className="htm-sample-btn clear-btn"
                      onClick={() => setRawHtml('')}
                      disabled={isLoading}
                    >
                      <Trash2 size={12} /> Clear
                    </button>
                  )}
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
          </div>
        )}

        {/* Conversion Options Bar */}
        <div className="htm-options-bar">
          <span className="htm-options-label">Options:</span>

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
          <Clock size={28} className="spin" style={{ color: 'var(--text-main)' }} />
          <h3 className="htm-loading-title">
            Parsing HTML &amp; Synthesizing Token-Efficient Markdown...
          </h3>
          <p className="htm-loading-desc">
            Stripping navigation boilerplate, translating tables, and estimating context tokens.
          </p>
          <div className="htm-loading-track">
            <div className="htm-loading-bar" />
          </div>
        </div>
      )}

      {/* Results Workspace */}
      {resultData && !isLoading && (
        <div className="htm-results-container">
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
                Cleaned document compressed by {resultData.savingsPercent}%
              </div>
            </div>

            {/* 2. Token Savings */}
            <div className="htm-kpi-card">
              <div className="htm-kpi-top">
                <span>Token Savings</span>
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
                  <Code2 size={14} />
                  <span>Clean Markdown</span>
                </button>
                <button
                  type="button"
                  className={`htm-view-tab ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye size={14} />
                  <span>Reader Preview</span>
                </button>
                <button
                  type="button"
                  className={`htm-view-tab ${activeTab === 'prompts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('prompts')}
                >
                  <Bot size={14} />
                  <span>Prompt Templates</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="htm-workspace-actions">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCopy(editableMarkdown, 'main-copy')}
                  icon={copiedId === 'main-copy' ? <Check size={14} /> : <Copy size={14} />}
                >
                  {copiedId === 'main-copy' ? 'Copied!' : 'Copy Markdown'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(editableMarkdown, `${(resultData.title || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.md`)}
                  icon={<Download size={14} />}
                >
                  Download .md
                </Button>
                {resultData.sourceUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(resultData.sourceUrl, '_blank')}
                    icon={<ExternalLink size={14} />}
                  >
                    Open Source
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  icon={<RotateCcw size={14} />}
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Tab 1: Clean Markdown Editor */}
            {activeTab === 'markdown' && (
              <div className="htm-editor-wrapper">
                <textarea
                  className="htm-markdown-editor"
                  value={editableMarkdown}
                  onChange={(e) => setEditableMarkdown(e.target.value)}
                  spellCheck="false"
                />
                <div className="htm-editor-footer">
                  <div className="htm-editor-stats">
                    <span>{editableMarkdown.length.toLocaleString()} characters</span>
                    <span>•</span>
                    <span>{editableMarkdown.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
                    <span>•</span>
                    <span>~{Math.round(editableMarkdown.length / 4).toLocaleString()} tokens</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(editableMarkdown, 'footer-copy')}
                    icon={copiedId === 'footer-copy' ? <Check size={13} /> : <Copy size={13} />}
                  >
                    {copiedId === 'footer-copy' ? 'Copied' : 'Quick Copy'}
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 2: Rendered Reader Preview */}
            {activeTab === 'preview' && (
              <div
                className="htm-preview-wrapper"
                dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
              />
            )}

            {/* Tab 3: Prompt Wrappers */}
            {activeTab === 'prompts' && (
              <div className="htm-prompt-body">
                <div className="htm-prompt-header">
                  <h3>1-Click Prompt Wrapper Templates</h3>
                  <p>
                    Select a template to instantly copy your converted document wrapped in targeted AI instructions for ChatGPT, Claude, or DeepSeek:
                  </p>
                </div>

                <div className="htm-prompt-cards">
                  {PROMPT_TEMPLATES.map((tpl, idx) => {
                    const isCopied = copiedId === `prompt-${idx}`;
                    return (
                      <div
                        key={idx}
                        className="htm-prompt-card"
                        onClick={() => handleCopy(tpl.wrap(editableMarkdown), `prompt-${idx}`)}
                      >
                        <h4>
                          <span>{tpl.title}</span>
                          {isCopied ? (
                            <Check size={15} color="#10b981" />
                          ) : (
                            <Copy size={14} color="var(--text-muted)" />
                          )}
                        </h4>
                        <p>{tpl.desc}</p>
                        <span className={`htm-prompt-cta ${isCopied ? 'copied' : ''}`}>
                          {isCopied ? (
                            <>
                              <Check size={13} /> Copied to Clipboard!
                            </>
                          ) : (
                            <>
                              <Copy size={13} /> Click to Copy Wrapped Prompt
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
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
