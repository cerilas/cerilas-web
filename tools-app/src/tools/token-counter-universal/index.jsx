import { useState, useMemo, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  FileCode, 
  Scissors, 
  RefreshCw,
  Download,
  Share2,
  Table,
  Eye,
  BarChart3,
  Bot,
  Users,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { tokenCounterUniversalManifest } from './manifest';
import { 
  MODEL_CATALOG, 
  calculateTextStats, 
  computeAllModelTokens, 
  tokenizeO200kWithDetails, 
  extractTextFromFile, 
  optimizeTextTokens, 
  SAMPLE_PRESETS 
} from './tokenEngine';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Badge, ToolHeader, AdSlot } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import TokenCounterSeo from './components/TokenCounterSeo';
import './token-counter.css';

export default function TokenCounterUniversal({ onBack, toolMeta }) {
  const {
    trackUse,
    trackDownload,
    trackCopy,
    visitorCount,
    conversionCount,
    getConversionLabel
  } = useToolAnalytics(tokenCounterUniversalManifest.slug, toolMeta);

  const [inputText, setInputText] = useState(SAMPLE_PRESETS[0].text);
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'visualizer' | 'table'
  const [showWhitespaceSymbols, setShowWhitespaceSymbols] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [activeModelId, setActiveModelId] = useState('gpt-4o');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const hoverInfoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Text statistics (chars, words, lines, bytes, reading time)
  const textStats = useMemo(() => calculateTextStats(inputText), [inputText]);

  // Model-by-model token metrics and cost calculations
  const modelMetrics = useMemo(() => computeAllModelTokens(inputText), [inputText]);

  // Currently active/highlighted model
  const activeModel = useMemo(() => {
    return modelMetrics.find((m) => m.id === activeModelId) || modelMetrics[0];
  }, [modelMetrics, activeModelId]);

  // Filter models by provider tab
  const filteredModels = useMemo(() => {
    if (selectedProvider === 'All') return modelMetrics;
    if (selectedProvider === 'OpenAI') return modelMetrics.filter((m) => m.provider === 'OpenAI');
    if (selectedProvider === 'Anthropic') return modelMetrics.filter((m) => m.provider === 'Anthropic');
    if (selectedProvider === 'Google') return modelMetrics.filter((m) => m.provider === 'Google');
    if (selectedProvider === 'DeepSeek') return modelMetrics.filter((m) => m.provider === 'DeepSeek');
    if (selectedProvider === 'Open Source') return modelMetrics.filter((m) => ['Meta', 'Mistral', 'Alibaba'].includes(m.provider));
    return modelMetrics;
  }, [modelMetrics, selectedProvider]);

  // Token chunks for visualizer
  const tokenDetails = useMemo(() => {
    if (!inputText) return { count: 0, tokens: [], isTruncated: false, totalCount: 0 };
    return tokenizeO200kWithDetails(inputText, 1000);
  }, [inputText]);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setIsFileLoading(true);
    setOptimizationResult(null);

    try {
      const extracted = await extractTextFromFile(file);
      if (extracted && extracted.text) {
        setInputText(extracted.text);
        setUploadedFile(extracted);
        trackUse?.({ mode: 'file', fileName: extracted.fileName });
      }
    } catch (err) {
      console.error('File parsing error:', err);
      alert('Failed to parse file: ' + (err.message || 'Unknown error'));
    } finally {
      setIsFileLoading(false);
      setIsDragging(false);
    }
  }, [trackUse]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Copy helper
  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    trackCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-Click Prompt Reducer
  const handleOptimize = (mode) => {
    const result = optimizeTextTokens(inputText, mode);
    setOptimizationResult(result);
  };

  const applyOptimization = () => {
    if (optimizationResult?.optimized) {
      setInputText(optimizationResult.optimized);
      setOptimizationResult(null);
      trackUse?.({ mode: 'optimize' });
    }
  };

  // Export JSON Report
  const handleExportJson = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      stats: textStats,
      activeModel: {
        id: activeModel.id,
        name: activeModel.name,
        provider: activeModel.provider,
        tokens: activeModel.tokenCount,
        contextUsagePercent: activeModel.contextPercentage,
        estimatedInputCostUsd: activeModel.inputCost
      },
      allModels: modelMetrics.map((m) => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        tokenizer: m.tokenizer,
        tokens: m.tokenCount,
        contextLimit: m.contextWindow,
        contextPercentage: m.contextPercentage,
        inputCostUsd: m.inputCost,
        outputCost1kUsd: m.outputCost1k
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-audit-${activeModel.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    trackDownload?.({ mode: 'json' });
  };

  const isOverflow = activeModel.contextPercentage > 100;

  return (
    <div className="c-tool-page-container tc-root">
      {/* Standardized ToolHeader matching all Cerilas tools */}
      <ToolHeader
        title={tokenCounterUniversalManifest.title}
        subtitle={tokenCounterUniversalManifest.shortDescription}
        onBack={onBack}
        slug={tokenCounterUniversalManifest.slug}
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
              100% Client-Side
            </Badge>
          </>
        }
      />

      {/* Mode Switcher Segmented Control */}
      <div className="tc-mode-switcher-container">
        <div className="tc-mode-switcher">
          <button
            type="button"
            className={`tc-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
          >
            <FileText size={15} />
            <span>Direct Prompt / Text</span>
          </button>
          <button
            type="button"
            className={`tc-mode-btn ${inputMode === 'file' ? 'active' : ''}`}
            onClick={() => setInputMode('file')}
          >
            <UploadCloud size={15} />
            <span>Upload Document (PDF / Code)</span>
          </button>
        </div>
      </div>

      {/* Input Workspace Card */}
      <div className="tc-workspace-card">
        {/* Presets & Actions Bar */}
        <div className="tc-toolbar">
          <div className="tc-samples-row">
            <span className="tc-sample-label">Presets:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="tc-sample-btn"
                onClick={() => {
                  setInputText(preset.text);
                  setUploadedFile(null);
                  setOptimizationResult(null);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="tc-actions-group">
            <button
              type="button"
              className="tc-icon-btn"
              onClick={() => handleCopy(inputText)}
              disabled={!inputText}
              title="Copy text"
            >
              {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              className="tc-icon-btn"
              onClick={() => { setInputText(''); setUploadedFile(null); setOptimizationResult(null); }}
              disabled={!inputText}
              title="Clear input"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* File Upload Mode */}
        {inputMode === 'file' && (
          <div>
            <div 
              className={`tc-file-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
                accept=".pdf,.txt,.md,.markdown,.json,.csv,.tsv,.xml,.yaml,.yml,.js,.jsx,.ts,.tsx,.py,.html,.css,.sql,.go,.rs,.java,.sh"
              />
              <div className="tc-drop-icon-box">
                {isFileLoading ? <RefreshCw size={24} className="animate-spin" /> : <UploadCloud size={24} />}
              </div>
              <h4 className="tc-drop-title">
                {isFileLoading ? 'Extracting document text...' : 'Click to Upload or Drag & Drop File'}
              </h4>
              <p className="tc-drop-subtitle">
                Client-side parsing for PDF documents, source code, Markdown, TXT, CSV, and JSON data.
              </p>
              <div className="tc-format-pills">
                <span className="tc-format-pill">.PDF (All pages)</span>
                <span className="tc-format-pill">.PY / .JS / .TS</span>
                <span className="tc-format-pill">.MD / .TXT</span>
                <span className="tc-format-pill">.JSON / .CSV</span>
              </div>
            </div>

            {uploadedFile && (
              <div className="tc-uploaded-banner">
                <div className="tc-uploaded-info">
                  <FileCode size={20} style={{ color: 'var(--text-main)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="tc-uploaded-name">{uploadedFile.fileName}</div>
                    <div className="tc-uploaded-meta">
                      {uploadedFile.fileType} &bull; {(uploadedFile.fileSize / 1024).toFixed(1)} KB
                      {uploadedFile.pageCount > 1 && ` &bull; ${uploadedFile.pageCount} Pages`}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  ✓ 100% Client-Side Parsed
                </span>
              </div>
            )}
          </div>
        )}

        {/* Textarea Editor */}
        <div className="tc-textarea-container">
          <textarea
            className="tc-textarea"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setOptimizationResult(null);
            }}
            placeholder="Type or paste prompt text, source code, or JSON payload here..."
            spellCheck={false}
          />
        </div>

        {/* Text Stats Ribbon */}
        <div className="tc-stats-grid">
          <div className="tc-stat-card">
            <span className="tc-stat-title">Characters</span>
            <span className="tc-stat-number">{textStats.chars.toLocaleString()}</span>
            <span className="tc-stat-detail">{textStats.charsNoSpaces.toLocaleString()} without spaces</span>
          </div>
          <div className="tc-stat-card">
            <span className="tc-stat-title">Words</span>
            <span className="tc-stat-number">{textStats.words.toLocaleString()}</span>
            <span className="tc-stat-detail">~{textStats.lines.toLocaleString()} lines</span>
          </div>
          <div className="tc-stat-card">
            <span className="tc-stat-title">Payload Size</span>
            <span className="tc-stat-number">
              {textStats.bytes > 1024 
                ? `${(textStats.bytes / 1024).toFixed(1)} KB` 
                : `${textStats.bytes} B`}
            </span>
            <span className="tc-stat-detail">UTF-8 Encoded</span>
          </div>
          <div className="tc-stat-card">
            <span className="tc-stat-title">Read / Speak Time</span>
            <span className="tc-stat-number">{textStats.readingTimeMin}m</span>
            <span className="tc-stat-detail">{textStats.speakingTimeMin}m speech</span>
          </div>
        </div>

        {/* 1-Click Prompt Reducer */}
        <div className="tc-reducer-bar">
          <div className="tc-reducer-label-wrap">
            <Scissors size={15} style={{ color: '#10b981' }} />
            <span>1-Click Prompt Reducer</span>
          </div>
          <div className="tc-reducer-buttons">
            <button
              type="button"
              className="tc-reducer-pill"
              onClick={() => handleOptimize('whitespace')}
              disabled={!inputText}
            >
              Trim Spaces & Lines
            </button>
            <button
              type="button"
              className="tc-reducer-pill"
              onClick={() => handleOptimize('comments')}
              disabled={!inputText}
            >
              Strip Code Comments
            </button>
            <button
              type="button"
              className="tc-reducer-pill"
              onClick={() => handleOptimize('html')}
              disabled={!inputText}
            >
              Strip HTML / Markup
            </button>
          </div>

          {optimizationResult && (
            <div className="tc-reducer-diff">
              <span>
                Saved <strong>{optimizationResult.savedCount} tokens</strong> ({optimizationResult.savedPercentage}% reduction)!
              </span>
              <button
                type="button"
                className="tc-apply-diff-btn"
                onClick={applyOptimization}
              >
                Apply Optimization
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results & Multi-Model Intelligence Card */}
      <div className="tc-results-card">
        {/* Selected Model Showcase */}
        <div className="tc-summary-hero">
          <div className="tc-summary-main">
            <div className="tc-summary-badge-row">
              <span className="tc-provider-pill">{activeModel.provider}</span>
              <span className={`tc-status-pill ${
                isOverflow 
                  ? 'tc-status-overflow' 
                  : activeModel.contextPercentage > 75 
                    ? 'tc-status-warn' 
                    : 'tc-status-safe'
              }`}>
                {isOverflow ? '⚠️ Context Overflow' : `${activeModel.contextPercentage}% Context Window Used`}
              </span>
            </div>

            <div className="tc-summary-number-row">
              <span className="tc-summary-number">{activeModel.tokenCount.toLocaleString()}</span>
              <span className="tc-summary-unit">tokens</span>
            </div>

            <p className="tc-summary-details">
              Estimated prompt cost: <strong style={{ color: '#10b981' }}>${activeModel.inputCost.toFixed(6)}</strong> USD &bull; 
              Tokenizer: <code>{activeModel.tokenizer}</code> &bull; 
              Context capacity: <strong>{activeModel.contextWindow.toLocaleString()}</strong> tokens
            </p>
          </div>

          {/* Model Switcher Dropdown & Progress Bar */}
          <div className="tc-summary-controls">
            <div>
              <div className="tc-select-label">Select Active Model:</div>
              <select
                className="tc-model-select"
                value={activeModelId}
                onChange={(e) => setActiveModelId(e.target.value)}
              >
                {modelMetrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider}) – {m.tokenCount.toLocaleString()} tokens
                  </option>
                ))}
              </select>
            </div>

            <div className="tc-gauge-bar-wrapper">
              <div className="tc-gauge-header">
                <span>Context: {activeModel.tokenCount.toLocaleString()} / {(activeModel.contextWindow / 1000).toFixed(0)}k</span>
                <span style={{ fontWeight: 600, color: isOverflow ? '#ef4444' : undefined }}>
                  {activeModel.contextPercentage}%
                </span>
              </div>
              <div className="tc-gauge-track">
                <div
                  className="tc-gauge-fill"
                  style={{
                    width: `${Math.min(100, activeModel.contextPercentage)}%`,
                    background: isOverflow 
                      ? '#ef4444' 
                      : activeModel.contextPercentage > 75 
                        ? '#f59e0b' 
                        : activeModel.color
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* View Navigation Bar */}
        <div className="tc-view-nav">
          <div className="tc-view-tabs">
            <button
              type="button"
              className={`tc-view-tab ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
            >
              <BarChart3 size={14} />
              <span>Model Matrix</span>
            </button>
            <button
              type="button"
              className={`tc-view-tab ${viewMode === 'visualizer' ? 'active' : ''}`}
              onClick={() => setViewMode('visualizer')}
            >
              <Eye size={14} />
              <span>Color Visualizer</span>
            </button>
            <button
              type="button"
              className={`tc-view-tab ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <Table size={14} />
              <span>Token Table</span>
            </button>
          </div>

          {/* Provider Filter Tabs (Visible in Matrix view) */}
          {viewMode === 'matrix' && (
            <div className="tc-provider-filters">
              {['All', 'OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'Open Source'].map((prov) => (
                <button
                  key={prov}
                  type="button"
                  className={`tc-filter-pill ${selectedProvider === prov ? 'active' : ''}`}
                  onClick={() => setSelectedProvider(prov)}
                >
                  {prov}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: Multi-Model Comparison Table */}
        {viewMode === 'matrix' && (
          <div className="tc-table-responsive">
            <table className="tc-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Provider</th>
                  <th>Tokenizer</th>
                  <th>Tokens</th>
                  <th>Context Window</th>
                  <th>Prompt Cost</th>
                  <th>1K Reply</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((model) => {
                  const isSelected = model.id === activeModelId;
                  return (
                    <tr key={model.id} style={{ background: isSelected ? 'rgba(150, 150, 150, 0.06)' : undefined }}>
                      <td>
                        <div className="tc-table-model-cell">
                          <span className="tc-table-dot" style={{ background: model.color }} />
                          <span className="tc-table-model-name">{model.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ opacity: 0.85 }}>{model.provider}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.76rem' }}>{model.tokenizer}</code>
                      </td>
                      <td>
                        <span className="tc-table-token-cell">{model.tokenCount.toLocaleString()}</span>
                      </td>
                      <td style={{ minWidth: '130px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', opacity: 0.8 }}>
                            <span>{(model.contextWindow / 1000).toFixed(0)}k max</span>
                            <span>{model.contextPercentage}%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(150, 150, 150, 0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, model.contextPercentage)}%`,
                                height: '100%',
                                background: model.contextPercentage > 100 ? '#ef4444' : model.color
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tc-table-cost-cell">${model.inputCost.toFixed(6)}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>${model.outputCost1k.toFixed(4)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={`tc-table-select-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setActiveModelId(model.id)}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Color-Coded Token Visualizer */}
        {viewMode === 'visualizer' && (
          <div className="tc-visualizer-panel">
            <div className="tc-visualizer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span>Showing first {tokenDetails.tokens.length} token chunks (o200k base):</span>
                <span
                  ref={hoverInfoRef}
                  className="tc-token-hover-badge"
                  style={{ color: 'var(--text-main)', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="tc-filter-pill"
                  onClick={() => handleCopy(inputText)}
                  title="Copy all text"
                >
                  <Copy size={13} />
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  className={`tc-filter-pill ${showWhitespaceSymbols ? 'active' : ''}`}
                  onClick={() => setShowWhitespaceSymbols(!showWhitespaceSymbols)}
                  title="Toggle whitespace marker symbols like · and ↵"
                >
                  {showWhitespaceSymbols ? 'Visible Spaces (·)' : 'Natural Text'}
                </button>
              </div>
            </div>

            <div
              className="tc-visualizer-canvas"
              style={{ whiteSpace: 'pre-wrap' }}
              onMouseOver={(e) => {
                const chip = e.target.closest('.tc-chip');
                if (chip && hoverInfoRef.current) {
                  const idx = chip.getAttribute('data-index');
                  const id = chip.getAttribute('data-id');
                  const len = chip.getAttribute('data-len');
                  if (idx !== null) {
                    hoverInfoRef.current.innerHTML = `Token #${Number(idx) + 1} &bull; ID: <code>${id}</code> &bull; Length: ${len} chars`;
                  }
                }
              }}
              onMouseLeave={() => {
                if (hoverInfoRef.current) {
                  hoverInfoRef.current.innerHTML = '';
                }
              }}
            >
              {tokenDetails.tokens.length === 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>No tokens to visualize.</span>
              ) : (
                tokenDetails.tokens.map((tok, idx) => {
                  const colorClass = `tc-chip-${idx % 6}`;
                  return (
                    <span
                      key={idx}
                      className={`tc-chip ${colorClass}`}
                      data-index={idx}
                      data-id={tok.id}
                      data-len={tok.text.length}
                      title={`Token #${idx + 1} | ID: ${tok.id} | Chars: ${tok.text.length}`}
                    >
                      {showWhitespaceSymbols ? tok.symbolic : tok.text}
                    </span>
                  );
                })
              )}
            </div>

            {tokenDetails.isTruncated && (
              <div style={{ fontSize: '0.76rem', color: '#f59e0b', padding: '0 0.25rem' }}>
                * Displaying first {tokenDetails.tokens.length} tokens for browser rendering speed. Total tokens in document: {tokenDetails.totalCount.toLocaleString()}.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Token Breakdown Table */}
        {viewMode === 'table' && (
          <div className="tc-table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="tc-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th style={{ width: '120px' }}>Token ID</th>
                  <th>Token String</th>
                  <th style={{ width: '90px' }}>Length</th>
                </tr>
              </thead>
              <tbody>
                {tokenDetails.tokens.slice(0, 100).map((tok, i) => (
                  <tr key={i}>
                    <td style={{ opacity: 0.6 }}>{tok.index + 1}</td>
                    <td>
                      <code style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tok.id}</code>
                    </td>
                    <td>
                      <code style={{ whiteSpace: 'pre-wrap' }}>{tok.display}</code>
                    </td>
                    <td style={{ opacity: 0.8 }}>{tok.text.length} chars</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tokenDetails.tokens.length > 100 && (
              <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing first 100 of {tokenDetails.totalCount.toLocaleString()} tokens.
              </div>
            )}
          </div>
        )}

        {/* Export & Actions Footer */}
        <div className="tc-footer-actions">
          <button
            type="button"
            className="tc-icon-btn"
            onClick={handleExportJson}
            disabled={!inputText}
          >
            <Download size={13} />
            <span>Export JSON Audit</span>
          </button>
          <button
            type="button"
            className="tc-icon-btn"
            onClick={() => handleCopy(`=== Token Count Summary ===\nText: ${textStats.chars} chars, ${textStats.words} words\nActive Model (${activeModel.name}): ${activeModel.tokenCount.toLocaleString()} tokens\nContext Usage: ${activeModel.contextPercentage}%\nInput Cost: $${activeModel.inputCost.toFixed(6)} USD\n\nAudited with Cerilas Universal Token Counter (https://tools.cerilas.com/#/tool/token-counter-universal)`)}
            disabled={!inputText}
          >
            <Share2 size={13} />
            <span>Copy Token Summary</span>
          </button>
        </div>
      </div>

      <AdSlot slot="footer-top" />

      <ToolSeoDivider />

      {/* Educational & SEO Section */}
      <TokenCounterSeo />
    </div>
  );
}
