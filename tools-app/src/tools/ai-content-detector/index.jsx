import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  FileText,
  UploadCloud,
  Check,
  AlertTriangle,
  RotateCcw,
  Copy,
  Download,
  Sparkles,
  ShieldCheck,
  Clock,
  Lock,
  Layers,
  FileCode,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Users,
  Activity
} from 'lucide-react';
import { aiContentDetectorManifest } from './manifest';
import { extractTextFromPdf, computeLocalStats } from './aiDetectorService';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import { Button, Badge, Card, ToolHeader, AdSlot, QuotaModal } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import AiDetectorSeo from './components/AiDetectorSeo';
import './ai-content-detector.css';

const SAMPLE_AI_TEXT = `In today's rapidly evolving digital landscape, artificial intelligence has emerged as a pivotal force reshaping modern society. It is crucial to recognize that the interplay between algorithmic automation and human ingenuity serves as a testament to our technological progress. Furthermore, navigating this multifaceted domain requires a comprehensive understanding of both opportunities and challenges. In conclusion, fostering collaboration between stakeholders remains paramount to unlocking the transformative potential of these innovative systems.`;

const SAMPLE_HUMAN_TEXT = `I spent all of last Tuesday wrestling with a strange PostgreSQL connection leak. We were seeing random 500 errors spike around 3 AM, and none of our Grafana alerts gave a clear hint. At first, I blamed our Redis cache layer. But after digging through our node pg connection pool logs with a cup of stale coffee, I spotted the culprit: an unhandled transaction rollback in a webhook handler. Fixed it in two lines of code, and the server hasn't hiccuped since.`;

export default function AiContentDetector({ onBack, toolMeta }) {
  const { trackAction, trackUse, trackDownload, trackCopy, stats, visitorCount, conversionCount, getConversionLabel } = useToolAnalytics(aiContentDetectorManifest.slug, toolMeta);

  const [inputMode, setInputMode] = useState('text'); // 'text' | 'pdf'
  const [inputText, setInputText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [result, setResult] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);
  const [copied, setCopied] = useState(false);

  const [quota, setQuota] = useState({ allowed: true, limit: 3, remaining: 3, resetInMinutes: 0 });
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch initial hourly quota
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const vid = getOrCreateVisitorId();
        const res = await fetch(`/api/tools/${aiContentDetectorManifest.slug}/ai-quota?visitorId=${encodeURIComponent(vid)}`);
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

  // Handle PDF Upload & Extraction
  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorNotice('Please select a valid PDF file.');
      return;
    }

    setPdfFile(file);
    setIsScanning(true);
    setScanStatus('Extracting text locally from PDF in browser memory...');

    try {
      const extracted = await extractTextFromPdf(file);
      if (!extracted.success || !extracted.text) {
        throw new Error(extracted.error || 'No selectable text found in PDF (it might be a scanned image).');
      }

      setInputText(extracted.text);
      setInputMode('text');
      setScanStatus('');
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setErrorNotice(err.message || 'Failed to extract text from PDF.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyze = async () => {
    const textToScan = inputText.trim();
    if (!textToScan || textToScan.length < 50) {
      setErrorNotice('Please provide at least 50 characters of text for reliable AI detection.');
      return;
    }

    if (quota.remaining <= 0) {
      setQuotaModalOpen(true);
      return;
    }

    setErrorNotice(null);
    setIsScanning(true);
    setScanStatus('Calculating perplexity, burstiness, and semantic fingerprinting...');

    try {
      const vid = getOrCreateVisitorId();
      const localStats = computeLocalStats(textToScan);

      const response = await fetch(`/api/tools/${aiContentDetectorManifest.slug}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToScan.slice(0, 15000),
          localStats,
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
        throw new Error(data.error || 'AI Detection engine encountered an error.');
      }

      setResult(data.analysis);
      trackUse?.();
    } catch (err) {
      console.error('AI detection error:', err);
      setErrorNotice(err.message || 'Failed to analyze text.');
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  };

  const handleCopyReport = async () => {
    if (!result) return;
    try {
      const report = `=== Cerilas AI Content Detection Report ===
Overall AI Probability Score: ${result.aiScore}%
Verdict: ${result.verdict} (Confidence: ${result.confidence})
Burstiness Score: ${result.burstinessScore}/100
Perplexity Rating: ${result.perplexityRating}

PROS (Human Signals):
${result.humanMarkers?.map(m => `- ${m.title}: ${m.description}`).join('\n') || 'None detected'}

CONS (AI Signals):
${result.aiMarkers?.map(m => `- ${m.title}: ${m.description}`).join('\n') || 'None detected'}

Summary:
${result.actionableSummary}
Generated by Cerilas Tools (https://tools.cerilas.com)`;

      await navigator.clipboard.writeText(report);
      setCopied(true);
      trackCopy?.();
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.warn('Copy error:', e);
    }
  };

  const handleReset = () => {
    setInputText('');
    setPdfFile(null);
    setResult(null);
    setErrorNotice(null);
  };

  const localStats = computeLocalStats(inputText);
  const scoreColor = !result
    ? '#8b5cf6'
    : result.aiScore <= 25
    ? '#10b981'
    : result.aiScore <= 65
    ? '#f59e0b'
    : '#8b5cf6';

  return (
    <div className="c-tool-page-container ai-detector-root">
      {/* Standardized Header */}
      <ToolHeader
        title={aiContentDetectorManifest.title}
        subtitle={aiContentDetectorManifest.shortDescription}
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
                {quota.remaining} / {quota.limit} Hourly Scans Left
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
        toolName="AI Content Detector"
      />

      {/* Inline Notification Banner */}
      {errorNotice && (
        <div className="bg-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={16} />
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

      {/* Main Workspace */}
      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Input Tabs: Text vs PDF */}
          <div className="ai-input-tabs">
            <button
              type="button"
              className={`ai-input-tab-btn ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
            >
              <FileText size={15} /> Paste Text
            </button>
            <button
              type="button"
              className={`ai-input-tab-btn ${inputMode === 'pdf' ? 'active' : ''}`}
              onClick={() => setInputMode('pdf')}
            >
              <UploadCloud size={15} /> Upload PDF Document
            </button>
          </div>

          {inputMode === 'text' ? (
            /* Text Input Card */
            <div className="ai-textarea-card">
              <textarea
                className="ai-textarea"
                placeholder="Paste your essay, article, blog post, or homework here (minimum 50 characters)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isScanning}
                rows={9}
              />

              <div className="ai-textarea-footer">
                <div className="ai-samples-group">
                  <span className="ai-sample-label">Try an instant sample:</span>
                  <button
                    type="button"
                    className="ai-sample-chip"
                    onClick={() => setInputText(SAMPLE_AI_TEXT)}
                  >
                    <Cpu size={12} /> AI Essay (ChatGPT)
                  </button>
                  <button
                    type="button"
                    className="ai-sample-chip"
                    onClick={() => setInputText(SAMPLE_HUMAN_TEXT)}
                  >
                    <Sparkles size={12} /> Human Written
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="ai-char-counter">
                    {localStats.wordCount} words / {localStats.charCount} chars
                  </span>
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isScanning}
                    icon={<Cpu size={15} />}
                    onClick={handleAnalyze}
                    disabled={inputText.trim().length < 50 || isScanning}
                  >
                    {isScanning ? (scanStatus || 'Analyzing...') : 'Scan for AI (0-100%)'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* PDF Upload Dropzone */
            <div
              className="ai-pdf-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files[0];
                if (dropped) handlePdfUpload(dropped);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="application/pdf,.pdf"
                onChange={(e) => handlePdfUpload(e.target.files[0])}
              />
              <div className="ai-pdf-icon">
                <UploadCloud size={28} strokeWidth={1.5} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-main)' }}>
                Click or Drop PDF Document Here
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: 440 }}>
                Extracts text locally in your browser with <strong>zero server uploads</strong>.
                Supports essays, homework, research papers, and corporate contracts.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="ai-results-wrapper">
          {/* Score Hero Banner */}
          <div className="ai-score-hero">
            <div className="ai-gauge-container">
              <div
                className="ai-score-circle"
                style={{
                  borderColor: scoreColor,
                  color: scoreColor,
                  background: `${scoreColor}14`
                }}
              >
                <span className="ai-score-number">{result.aiScore}</span>
                <span className="ai-score-percent">/ 100%</span>
              </div>

              <div className="ai-verdict-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 className="ai-verdict-title" style={{ color: scoreColor }}>
                    {result.verdict}
                  </h3>
                  <Badge variant={result.aiScore <= 25 ? 'success' : result.aiScore <= 65 ? 'warning' : 'purple'}>
                    {result.confidence} Confidence
                  </Badge>
                </div>
                <p className="ai-verdict-desc">
                  {result.actionableSummary}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                size="sm"
                icon={copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                onClick={handleCopyReport}
              >
                {copied ? 'Report Copied!' : 'Copy Audit Report'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={13} />}
                onClick={handleReset}
              >
                Scan Another
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="ai-metrics-grid">
            <div className="ai-metric-card">
              <span className="ai-metric-label">Perplexity Rating</span>
              <span className="ai-metric-val">{result.perplexityRating || 'Moderate'}</span>
              <span className="ai-metric-sub">Vocabulary surprisal index</span>
            </div>
            <div className="ai-metric-card">
              <span className="ai-metric-label">Burstiness Score</span>
              <span className="ai-metric-val">{result.burstinessScore || localStats.burstinessScore}/100</span>
              <span className="ai-metric-sub">Sentence length variance</span>
            </div>
            <div className="ai-metric-card">
              <span className="ai-metric-label">AI Formulaic Clichés</span>
              <span className="ai-metric-val">{result.clicheCount ?? localStats.clicheCount}</span>
              <span className="ai-metric-sub">Repetitive transition markers</span>
            </div>
            <div className="ai-metric-card">
              <span className="ai-metric-label">Total Word Count</span>
              <span className="ai-metric-val">{localStats.wordCount}</span>
              <span className="ai-metric-sub">{localStats.sentenceCount} sentences analyzed</span>
            </div>
          </div>

          {/* Pros & Cons Indicators (Side-by-Side) */}
          <div className="ai-pros-cons-grid">
            {/* Human Markers (Pros) */}
            <div className="ai-pros-card">
              <h4 className="ai-section-title">
                <CheckCircle2 size={18} color="#10b981" />
                <span>Human Writing Markers (Pros)</span>
              </h4>

              <div className="ai-indicators-list">
                {result.humanMarkers && result.humanMarkers.length > 0 ? (
                  result.humanMarkers.map((marker, idx) => (
                    <div key={idx} className="ai-indicator-item">
                      <div className="ai-indicator-header">
                        <span className="ai-indicator-label">{marker.title}</span>
                        <Badge variant="success">Organic</Badge>
                      </div>
                      <p className="ai-indicator-desc">{marker.description}</p>
                      {marker.excerpt && (
                        <div className="ai-indicator-quote" style={{ borderLeftColor: '#10b981' }}>
                          "{marker.excerpt}"
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                    No distinctive organic human writing markers were detected in this passage.
                  </p>
                )}
              </div>
            </div>

            {/* AI Markers (Cons) */}
            <div className="ai-cons-card">
              <h4 className="ai-section-title">
                <AlertTriangle size={18} color="#8b5cf6" />
                <span>Synthetic AI Markers (Cons)</span>
              </h4>

              <div className="ai-indicators-list">
                {result.aiMarkers && result.aiMarkers.length > 0 ? (
                  result.aiMarkers.map((marker, idx) => (
                    <div key={idx} className="ai-indicator-item">
                      <div className="ai-indicator-header">
                        <span className="ai-indicator-label">{marker.title}</span>
                        <Badge variant="purple">Synthetic</Badge>
                      </div>
                      <p className="ai-indicator-desc">{marker.description}</p>
                      {marker.excerpt && (
                        <div className="ai-indicator-quote" style={{ borderLeftColor: '#8b5cf6' }}>
                          "{marker.excerpt}"
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                    No synthetic AI markers or formulaic clichés were identified.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sentence Heatmap Inspector */}
          {result.highlightedSentences && result.highlightedSentences.length > 0 && (
            <div className="ai-heatmap-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 className="ai-section-title">
                  <Eye size={17} />
                  <span>Sentence-Level Forensic Heatmap</span>
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#8b5cf6' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(139, 92, 246, 0.4)' }} />
                    Suspect AI
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(16, 185, 129, 0.4)' }} />
                    Organic Human
                  </span>
                </div>
              </div>

              <div className="ai-sentence-stream">
                {result.highlightedSentences.map((sent, i) => (
                  <span
                    key={i}
                    className={`ai-sentence-span ${sent.isAi ? 'suspect-ai' : 'likely-human'}`}
                    title={sent.explanation || (sent.isAi ? 'Flagged as synthetic' : 'Flagged as organic')}
                  >
                    {sent.sentence}{' '}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ad slot for monetization */}
      <AdSlot format="leaderboard" slotId="ad-ai-detector-bottom" />

      {/* SEO Section & Technical Guide (Partitioned below the fold) */}
      <ToolSeoDivider label="Forensic Science, Blacklist & FAQs" />
      <AiDetectorSeo />
    </div>
  );
}
