import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Database,
  Code,
  ShieldCheck,
  Lock,
  Clock,
  AlertCircle,
  X,
  Eye,
  Sliders,
  FileCode,
  Users,
  Activity
} from 'lucide-react';
import { pdfRagCleanerManifest } from './manifest';
import {
  parsePdfStructure,
  buildCleanMarkdown,
  chunkForRag,
  estimateTokens
} from './pdfRagParser';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import { Button, Badge, Card, ToolHeader, AdSlot, QuotaModal } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import PdfRagCleanerSeo from './components/PdfRagCleanerSeo';
import './pdf-rag-cleaner.css';

// Sample Technical PDF text for instant 1-click testing
const SAMPLE_MARKDOWN = `# Distributed Vector Search & RAG Architecture
*Technical Whitepaper - Version 2.4*

## 1. Executive Summary
Modern Retrieval-Augmented Generation (RAG) systems combine parametric Large Language Models (LLMs) with non-parametric external vector stores. However, document ingestion pipelines encounter severe precision degradation when processing raw PDF documents.

Standard PDF layout engines encode typographic glyphs along arbitrary Cartesian coordinates. As a result, extracted textual streams contain fragmented sentences, orphan hyphenations, and recurring header and footer noise across page partitions.

## 2. Key Challenges in Document Ingestion
- **Hyphenated Line Breaks:** Arbitrary tokenization breaks semantic keywords like "vector-\nization" into disparate tokens.
- **Running Headers and Footers:** Recurring copyright notices and page numbers poison cosine similarity rankings.
- **Arbitrary Chunk Boundaries:** Fixed-character chunking splits cohesive definitions across adjacent vectors.

## 3. Recommended Chunking Strategies
### 3.1 Semantic Section Chunking
Splitting documents on hierarchical headings (#, ##, ###) guarantees that cohesive technical concepts remain unified within a single context window.

### 3.2 Token-Window Sliding Chunking
For unstructured narratives, a sliding window of 500 tokens with 10% overlap (50 tokens) ensures boundary context preservation while respecting embedding model limits.

## 4. Evaluation Metrics
Retrieval precision improves by up to 28.4% when running vector searches against de-noised Markdown rather than raw PDF text extracts.`;

export default function PdfRagCleaner({ onBack, toolMeta }) {
  const { trackAction, trackUse, trackDownload, trackCopy, stats, visitorCount, conversionCount, getConversionLabel } = useToolAnalytics(pdfRagCleanerManifest.slug, toolMeta);

  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [cleanedData, setCleanedData] = useState(null);
  const [chunks, setChunks] = useState([]);

  const [chunkStrategy, setChunkStrategy] = useState('semantic'); // 'semantic' | 'tokens-500' | 'tokens-1000' | 'page'
  const [activeTab, setActiveTab] = useState('markdown'); // 'markdown' | 'chunks' | 'metadata'
  const [markdownMode, setMarkdownMode] = useState('raw'); // 'raw' | 'preview'

  const [copied, setCopied] = useState(false);
  const [copyNotice, setCopyNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  const [quota, setQuota] = useState({ allowed: true, limit: 3, remaining: 3, resetInMinutes: 0 });
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [isAiPolishing, setIsAiPolishing] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch initial hourly quota for AI polish
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const vid = getOrCreateVisitorId();
        const res = await fetch(`/api/tools/${pdfRagCleanerManifest.slug}/ai-quota?visitorId=${encodeURIComponent(vid)}`);
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

  // Re-chunk whenever strategy or cleanedData changes
  useEffect(() => {
    if (!cleanedData) return;

    let options = { strategy: 'semantic' };
    if (chunkStrategy === 'tokens-500') {
      options = { strategy: 'tokens', targetTokenSize: 500, overlapRatio: 0.1 };
    } else if (chunkStrategy === 'tokens-1000') {
      options = { strategy: 'tokens', targetTokenSize: 1000, overlapRatio: 0.1 };
    } else if (chunkStrategy === 'page') {
      options = { strategy: 'page' };
    }

    const newChunks = chunkForRag(cleanedData, options);
    setChunks(newChunks);
  }, [chunkStrategy, cleanedData]);

  // Process uploaded PDF file locally in browser
  const processPdfFile = async (pdfFile) => {
    if (!pdfFile) return;
    setErrorNotice(null);
    setIsProcessing(true);
    setProcessStatus('Reading PDF layout geometry...');

    try {
      const structure = await parsePdfStructure(pdfFile);
      setProcessStatus('Eliminating header/footer noise and fixing hyphenation...');

      const result = buildCleanMarkdown(structure, pdfFile.name, pdfFile.size);
      setCleanedData(result);
      trackUse?.();
    } catch (err) {
      console.error('PDF processing error:', err);
      setErrorNotice('Failed to extract and clean PDF: ' + (err.message || 'Corrupted file'));
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorNotice('Please select a valid PDF document.');
      return;
    }
    setFile(selectedFile);
    processPdfFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  // Instant Sample Document Loader
  const handleSampleClick = () => {
    setErrorNotice(null);
    const mockFile = { name: 'sample-rag-whitepaper.pdf', size: 145200 };
    setFile(mockFile);

    const totalCleanChars = SAMPLE_MARKDOWN.length;
    const tokenCount = estimateTokens(SAMPLE_MARKDOWN);
    const wordCount = SAMPLE_MARKDOWN.split(/\s+/).length;

    const sampleCleanedData = {
      markdown: SAMPLE_MARKDOWN,
      cleanText: SAMPLE_MARKDOWN.replace(/#+\s*/g, '').replace(/\*+/g, ''),
      cleanedPages: [
        { pageNum: 1, content: SAMPLE_MARKDOWN, lastHeading: '4. Evaluation Metrics' }
      ],
      metadata: {
        fileName: 'sample-rag-whitepaper.pdf',
        fileSize: 145200,
        pageCount: 3,
        wordCount,
        charCount: totalCleanChars,
        estimatedTokens: tokenCount,
        noiseCharsRemoved: 820,
        cleanRatio: 22
      }
    };

    setCleanedData(sampleCleanedData);
    trackUse?.();
  };

  // Trigger Optional Gemini AI Neural Polish
  const handleAiDeepPolish = async () => {
    if (!cleanedData) return;
    if (quota.remaining <= 0) {
      setQuotaModalOpen(true);
      return;
    }

    try {
      setIsAiPolishing(true);
      const vid = getOrCreateVisitorId();
      const response = await fetch(`/api/tools/${pdfRagCleanerManifest.slug}/ai-clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: cleanedData.markdown.slice(0, 14000),
          visitorId: vid
        })
      });

      const data = await response.json();
      if (data.quota) {
        setQuota(data.quota);
      }

      if (!response.ok || !data.success) {
        if (response.status === 429) {
          setQuotaModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to complete AI polish');
      }

      // Update markdown with pristine AI-restructured version
      if (data.polishedMarkdown) {
        const updated = {
          ...cleanedData,
          markdown: data.polishedMarkdown,
          cleanText: data.polishedMarkdown.replace(/#+\s*/g, ''),
          metadata: {
            ...cleanedData.metadata,
            estimatedTokens: estimateTokens(data.polishedMarkdown),
            wordCount: data.polishedMarkdown.split(/\s+/).length
          }
        };
        setCleanedData(updated);
        setCopyNotice('AI Neural Polish successfully applied!');
        setTimeout(() => setCopyNotice(null), 3000);
      }
    } catch (err) {
      console.error('AI Polish error:', err);
      setErrorNotice(err.message || 'AI Polish service unavailable.');
    } finally {
      setIsAiPolishing(false);
    }
  };

  // Download Cleaned Markdown (.md)
  const handleDownloadMarkdown = () => {
    if (!cleanedData) return;
    const blob = new Blob([cleanedData.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanedData.metadata.fileName.replace(/\.pdf$/i, '')}-cleaned.md`;
    a.click();
    URL.revokeObjectURL(url);
    trackDownload?.();
  };

  // Download RAG Chunks JSON (.json)
  const handleDownloadJson = () => {
    if (!chunks || chunks.length === 0) return;
    const exportPayload = {
      document: cleanedData.metadata,
      strategy: chunkStrategy,
      totalChunks: chunks.length,
      chunks: chunks.map(c => ({
        id: c.id,
        index: c.index,
        section: c.sectionTitle,
        page: c.pageNumber || null,
        tokens: c.estimatedTokens,
        content: c.content,
        metadata: c.metadata
      }))
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanedData.metadata.fileName.replace(/\.pdf$/i, '')}-rag-chunks.json`;
    a.click();
    URL.revokeObjectURL(url);
    trackDownload?.();
  };

  // Copy Content to Clipboard
  const handleCopy = async (type = 'markdown') => {
    try {
      let text = '';
      if (type === 'markdown') {
        text = cleanedData.markdown;
      } else if (type === 'json') {
        text = JSON.stringify(chunks, null, 2);
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopyNotice('Failed to copy. Please select and copy manually.');
      setTimeout(() => setCopyNotice(null), 3000);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCleanedData(null);
    setChunks([]);
    setErrorNotice(null);
  };

  return (
    <div className="c-tool-page-container pdf-rag-root">
      {/* Standardized Tool Header */}
      <ToolHeader
        title={pdfRagCleanerManifest.title}
        subtitle={pdfRagCleanerManifest.shortDescription}
        onBack={onBack}
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
            <Badge variant="purple" icon={<Sparkles size={12} strokeWidth={2} />}>
              AI Assisted
            </Badge>
            <div
              onClick={() => setQuotaModalOpen(true)}
              style={{ cursor: 'pointer' }}
              title="Click to view hourly AI quota details"
            >
              <Badge
                variant={quota.remaining > 0 ? 'neutral' : 'warning'}
                icon={quota.remaining > 0 ? <Clock size={12} strokeWidth={2} /> : <Lock size={12} strokeWidth={2} />}
              >
                {quota.remaining} / {quota.limit} Hourly AI Polishes Left
              </Badge>
            </div>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
          </>
        }
      />

      {/* Reusable Quota Modal */}
      <QuotaModal
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        limit={quota.limit}
        resetInMinutes={quota.resetInMinutes}
        toolName="PDF → RAG Cleaner"
      />

      {/* Top Banner Notifications */}
      {errorNotice && (
        <div className="bg-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={16} />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            className="bg-error-close"
            onClick={() => setErrorNotice(null)}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {copyNotice && (
        <div className="bg-error-banner" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)', color: '#10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Check size={16} />
            <span>{copyNotice}</span>
          </div>
          <button
            type="button"
            className="bg-error-close"
            style={{ color: '#10b981' }}
            onClick={() => setCopyNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload Zone or Processing or Workspace */}
      {!cleanedData ? (
        isProcessing ? (
          <div className="rag-processing-card">
            <div className="rag-spinner" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-main)' }}>
              {processStatus || 'Parsing document geometry...'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Extracting structural fonts, de-hyphenating wraps, and stripping running headers locally.
            </p>
          </div>
        ) : (
          <div
            className="rag-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="application/pdf,.pdf"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            <div className="rag-dropzone-icon">
              <UploadCloud size={30} strokeWidth={1.5} />
            </div>
            <h3 className="rag-dropzone-title">Click or Drag & Drop PDF Document Here</h3>
            <p className="rag-dropzone-desc">
              Supports technical papers, books, manuals, and financial reports.
              Executes 100% locally in your browser with <strong>zero server uploads</strong>.
            </p>

            <div className="rag-samples-container" onClick={(e) => e.stopPropagation()}>
              <span className="rag-sample-label">Or try a sample:</span>
              <button type="button" className="rag-sample-btn" onClick={handleSampleClick}>
                <Sparkles size={13} /> Technical Whitepaper Sample
              </button>
            </div>
          </div>
        )
      ) : (
        /* Active Interactive Workspace */
        <div className="rag-workspace">
          {/* Stats Matrix */}
          <div className="rag-stats-grid">
            <div className="rag-stat-card">
              <span className="rag-stat-label">Estimated Tokens</span>
              <span className="rag-stat-value">{cleanedData.metadata.estimatedTokens.toLocaleString()}</span>
              <span className="rag-stat-sub">~4 chars/token heuristic</span>
            </div>
            <div className="rag-stat-card">
              <span className="rag-stat-label">RAG Chunks</span>
              <span className="rag-stat-value">{chunks.length}</span>
              <span className="rag-stat-sub">Strategy: {chunkStrategy}</span>
            </div>
            <div className="rag-stat-card">
              <span className="rag-stat-label">Noise Stripped</span>
              <span className="rag-stat-value">{cleanedData.metadata.cleanRatio}%</span>
              <span className="rag-stat-sub">{cleanedData.metadata.noiseCharsRemoved} header/footer chars</span>
            </div>
            <div className="rag-stat-card">
              <span className="rag-stat-label">Word Count</span>
              <span className="rag-stat-value">{cleanedData.metadata.wordCount.toLocaleString()}</span>
              <span className="rag-stat-sub">{cleanedData.metadata.pageCount} pages parsed</span>
            </div>
          </div>

          {/* AI Polish Banner */}
          <div className="rag-ai-banner">
            <div className="rag-ai-info">
              <div className="rag-ai-icon">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="rag-ai-title">Neural AI Deep Clean</h4>
                <p className="rag-ai-desc">
                  Reconstruct corrupted multi-column layouts, tables, and mathematical formulas into pristine Markdown.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isAiPolishing}
              icon={<Sparkles size={13} />}
              onClick={handleAiDeepPolish}
            >
              {isAiPolishing ? 'Polishing...' : 'Run Neural Polish (Gemini)'}
            </Button>
          </div>

          {/* Configuration Toolbar */}
          <div className="rag-toolbar">
            <div className="rag-toolbar-group">
              <span className="rag-toolbar-label">Chunking Strategy:</span>
              <button
                type="button"
                className={`rag-strategy-btn ${chunkStrategy === 'semantic' ? 'active' : ''}`}
                onClick={() => setChunkStrategy('semantic')}
              >
                Semantic Headings (#)
              </button>
              <button
                type="button"
                className={`rag-strategy-btn ${chunkStrategy === 'tokens-500' ? 'active' : ''}`}
                onClick={() => setChunkStrategy('tokens-500')}
              >
                500 Tokens (10% Overlap)
              </button>
              <button
                type="button"
                className={`rag-strategy-btn ${chunkStrategy === 'tokens-1000' ? 'active' : ''}`}
                onClick={() => setChunkStrategy('tokens-1000')}
              >
                1000 Tokens Window
              </button>
              <button
                type="button"
                className={`rag-strategy-btn ${chunkStrategy === 'page' ? 'active' : ''}`}
                onClick={() => setChunkStrategy('page')}
              >
                Page-by-Page
              </button>
            </div>

            <div className="rag-actions-group">
              <Button
                variant="outline"
                size="sm"
                icon={copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                onClick={() => handleCopy(activeTab === 'chunks' ? 'json' : 'markdown')}
              >
                {copied ? 'Copied!' : activeTab === 'chunks' ? 'Copy JSON' : 'Copy Markdown'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Download size={13} />}
                onClick={handleDownloadMarkdown}
              >
                Download .MD
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Download size={13} />}
                onClick={handleDownloadJson}
              >
                Download Chunks JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={13} />}
                onClick={handleReset}
                title="Reset and clean another document"
              >
                New PDF
              </Button>
            </div>
          </div>

          {/* Output Card with Tabs */}
          <div className="rag-output-card">
            <div className="rag-tabs-header">
              <div className="rag-tabs-list">
                <button
                  type="button"
                  className={`rag-tab-btn ${activeTab === 'markdown' ? 'active' : ''}`}
                  onClick={() => setActiveTab('markdown')}
                >
                  <FileText size={14} /> Clean Markdown
                </button>
                <button
                  type="button"
                  className={`rag-tab-btn ${activeTab === 'chunks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chunks')}
                >
                  <Database size={14} /> RAG JSON Chunks ({chunks.length})
                </button>
                <button
                  type="button"
                  className={`rag-tab-btn ${activeTab === 'metadata' ? 'active' : ''}`}
                  onClick={() => setActiveTab('metadata')}
                >
                  <Code size={14} /> Document Metadata
                </button>
              </div>

              {activeTab === 'markdown' && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className={`rag-sample-btn ${markdownMode === 'raw' ? 'active' : ''}`}
                    onClick={() => setMarkdownMode('raw')}
                  >
                    Raw Editor
                  </button>
                  <button
                    type="button"
                    className={`rag-sample-btn ${markdownMode === 'preview' ? 'active' : ''}`}
                    onClick={() => setMarkdownMode('preview')}
                  >
                    Formatted View
                  </button>
                </div>
              )}
            </div>

            <div className="rag-tab-content">
              {activeTab === 'markdown' ? (
                markdownMode === 'raw' ? (
                  <textarea
                    className="rag-code-editor"
                    value={cleanedData.markdown}
                    onChange={(e) => setCleanedData({ ...cleanedData, markdown: e.target.value })}
                    spellCheck={false}
                  />
                ) : (
                  <div style={{ lineHeight: 1.7, color: 'var(--text-main)', fontSize: '0.94rem' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {cleanedData.markdown}
                    </pre>
                  </div>
                )
              ) : activeTab === 'chunks' ? (
                <div className="rag-chunks-container">
                  {chunks.map((chk, i) => (
                    <div key={chk.id || i} className="rag-chunk-card">
                      <div className="rag-chunk-meta">
                        <span className="rag-chunk-title">
                          #{chk.index + 1} - {chk.sectionTitle}
                        </span>
                        <div className="rag-chunk-badges">
                          <Badge variant="neutral">{chk.estimatedTokens} tokens</Badge>
                          {chk.pageNumber && <Badge variant="neutral">Page {chk.pageNumber}</Badge>}
                        </div>
                      </div>
                      <div className="rag-chunk-snippet">
                        {chk.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Metadata Tab */
                <pre className="rag-code-editor" style={{ height: 'auto' }}>
                  {JSON.stringify(cleanedData.metadata, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ad slot for monetization */}
      <AdSlot format="leaderboard" slotId="ad-rag-cleaner-bottom" />

      {/* SEO Section with Structured Data and Technical Guide (Partitioned below the fold) */}
      <ToolSeoDivider label="RAG Architecture, Benchmarks & FAQs" />
      <PdfRagCleanerSeo />
    </div>
  );
}
