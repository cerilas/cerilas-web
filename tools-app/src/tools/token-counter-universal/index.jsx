import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  Binary, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  FileCode, 
  Cpu, 
  DollarSign, 
  Zap, 
  HelpCircle, 
  Layers, 
  Scissors, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Download,
  Share2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  MODEL_CATALOG, 
  calculateTextStats, 
  computeAllModelTokens, 
  tokenizeO200kWithDetails, 
  extractTextFromFile, 
  optimizeTextTokens, 
  SAMPLE_PRESETS 
} from './tokenEngine';
import TokenCounterSeo from './components/TokenCounterSeo';
import './token-counter.css';

export default function TokenCounterUniversal() {
  const [inputText, setInputText] = useState(SAMPLE_PRESETS[0].text);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'file'
  const [viewMode, setViewMode] = useState('models'); // 'models' | 'visualizer' | 'table'
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [hoveredToken, setHoveredToken] = useState(null);

  const fileInputRef = useRef(null);

  // Calculate comprehensive text metrics
  const textStats = useMemo(() => calculateTextStats(inputText), [inputText]);

  // Multi-model token counts & cost calculations
  const modelMetrics = useMemo(() => computeAllModelTokens(inputText), [inputText]);

  // Selected primary model metric
  const primaryModel = useMemo(() => {
    return modelMetrics.find((m) => m.id === selectedModelId) || modelMetrics[0];
  }, [modelMetrics, selectedModelId]);

  // Token breakdown for visualizer (using o200k flagship tokenizer)
  const tokenDetails = useMemo(() => {
    if (!inputText) return { count: 0, tokens: [], isTruncated: false, totalCount: 0 };
    return tokenizeO200kWithDetails(inputText, 1200);
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
      }
    } catch (err) {
      console.error('File parsing error:', err);
      alert('Failed to parse file: ' + (err.message || 'Unknown error'));
    } finally {
      setIsFileLoading(false);
      setIsDragging(false);
    }
  }, []);

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

  // Copy Summary or Text
  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-Click Optimization
  const handleOptimize = (mode) => {
    const result = optimizeTextTokens(inputText, mode);
    setOptimizationResult(result);
  };

  const applyOptimization = () => {
    if (optimizationResult?.optimized) {
      setInputText(optimizationResult.optimized);
      setOptimizationResult(null);
    }
  };

  // Generate Exportable JSON Report
  const handleExportJson = () => {
    const report = {
      timestamp: new Date().toISOString(),
      stats: textStats,
      primaryModel: {
        id: primaryModel.id,
        name: primaryModel.name,
        tokens: primaryModel.tokenCount,
        contextUsagePercent: primaryModel.contextPercentage,
        estimatedInputCostUsd: primaryModel.inputCost
      },
      allModels: modelMetrics.map((m) => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        tokens: m.tokenCount,
        contextLimit: m.contextWindow,
        contextPercent: m.contextPercentage,
        inputCostUsd: m.inputCost
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-audit-${primaryModel.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="token-counter-root">
      {/* Header Banner */}
      <div className="tc-header">
        <div className="tc-badge">
          <Sparkles size={13} />
          <span>Universal AI Tokenizer & Cost Auditor</span>
        </div>
        <h1 className="tc-title">Universal Token Counter</h1>
        <p className="tc-subtitle">
          Calculate exact token counts, context window consumption, and API expenses for text and files 
          (PDF, Code, Markdown) across OpenAI, Claude, Gemini, DeepSeek, and Llama models.
        </p>
      </div>

      {/* Primary Hero Metric */}
      <div className="tc-hero-card">
        <div className="tc-hero-top">
          <div className="tc-hero-label">
            <Cpu size={16} />
            <span>Active Model: {primaryModel.name} ({primaryModel.provider})</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: primaryModel.contextPercentage > 90 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: primaryModel.contextPercentage > 90 ? '#ef4444' : '#10b981',
              border: `1px solid ${primaryModel.contextPercentage > 90 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
            }}>
              {primaryModel.contextPercentage > 100 
                ? '⚠️ Context Overflow' 
                : `${primaryModel.contextPercentage}% Context Used`}
            </span>
          </div>
        </div>

        <div className="tc-hero-count">
          {primaryModel.tokenCount.toLocaleString()} <span style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-muted, #94a3b8)' }}>Tokens</span>
        </div>

        <p className="tc-hero-desc">
          Estimated prompt input cost: <strong style={{ color: '#10b981' }}>${primaryModel.inputCost.toFixed(6)}</strong> USD 
          &bull; Context window capacity: <strong>{primaryModel.contextWindow.toLocaleString()}</strong> tokens 
          &bull; Tokenizer engine: <code>{primaryModel.tokenizer}</code>
        </p>
      </div>

      {/* Main Grid: Input & Analytics */}
      <div className="tc-grid">
        {/* Left Column: Input Channels */}
        <div className="tc-card">
          <div className="tc-card-header">
            <div className="tc-tabs">
              <button
                type="button"
                className={`tc-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                <FileText size={14} />
                <span>Text / Prompt</span>
              </button>
              <button
                type="button"
                className={`tc-tab-btn ${activeTab === 'file' ? 'active' : ''}`}
                onClick={() => setActiveTab('file')}
              >
                <UploadCloud size={14} />
                <span>File Upload (PDF / Code)</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="tc-act-btn"
                title="Copy Text"
                onClick={() => handleCopy(inputText)}
                disabled={!inputText}
              >
                {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                className="tc-act-btn"
                title="Clear All"
                onClick={() => { setInputText(''); setUploadedFile(null); setOptimizationResult(null); }}
                disabled={!inputText}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="tc-presets-bar">
            <span className="tc-presets-label">Presets:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="tc-preset-btn"
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

          {/* File Upload Mode */}
          {activeTab === 'file' && (
            <div>
              <div 
                className={`tc-dropzone ${isDragging ? 'dragging' : ''}`}
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
                <div className="tc-drop-icon">
                  {isFileLoading ? <RefreshCw size={24} className="animate-spin" /> : <UploadCloud size={24} />}
                </div>
                <h4 className="tc-drop-title">
                  {isFileLoading ? 'Extracting document text...' : 'Click to Upload or Drag & Drop File'}
                </h4>
                <p className="tc-drop-desc">
                  Supports PDF documents, source code, Markdown, TXT, CSV, and JSON data.
                </p>
                <div className="tc-drop-formats">
                  <span className="tc-format-badge">.PDF</span>
                  <span className="tc-format-badge">.PY / .JS / .TS</span>
                  <span className="tc-format-badge">.MD</span>
                  <span className="tc-format-badge">.JSON / .CSV</span>
                  <span className="tc-format-badge">.TXT</span>
                </div>
              </div>

              {uploadedFile && (
                <div className="tc-file-banner">
                  <div className="tc-file-meta">
                    <FileCode size={20} style={{ color: '#818cf8', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="tc-file-name">{uploadedFile.fileName}</div>
                      <div className="tc-file-details">
                        {uploadedFile.fileType} &bull; {(uploadedFile.fileSize / 1024).toFixed(1)} KB 
                        {uploadedFile.pageCount > 1 && ` &bull; ${uploadedFile.pageCount} Pages`}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    Parsed 100% Locally
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Text Area */}
          <div className="tc-textarea-wrap">
            <textarea
              className="tc-textarea"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setOptimizationResult(null);
              }}
              placeholder="Type or paste text, prompt, code snippet, or dataset here to inspect tokens..."
              spellCheck={false}
            />
          </div>

          {/* Text Stats Ribbon */}
          <div className="tc-stats-ribbon">
            <div className="tc-stat-box">
              <div className="tc-stat-label">Characters</div>
              <div className="tc-stat-value">{textStats.chars.toLocaleString()}</div>
              <div className="tc-stat-sub">{textStats.charsNoSpaces.toLocaleString()} no spaces</div>
            </div>
            <div className="tc-stat-box">
              <div className="tc-stat-label">Words</div>
              <div className="tc-stat-value">{textStats.words.toLocaleString()}</div>
              <div className="tc-stat-sub">~{textStats.lines.toLocaleString()} lines</div>
            </div>
            <div className="tc-stat-box">
              <div className="tc-stat-label">Data Size</div>
              <div className="tc-stat-value">
                {textStats.bytes > 1024 
                  ? `${(textStats.bytes / 1024).toFixed(1)} KB` 
                  : `${textStats.bytes} B`}
              </div>
              <div className="tc-stat-sub">UTF-8 Encoded</div>
            </div>
            <div className="tc-stat-box">
              <div className="tc-stat-label">Read / Speak</div>
              <div className="tc-stat-value">{textStats.readingTimeMin}m</div>
              <div className="tc-stat-sub">{textStats.speakingTimeMin}m speech</div>
            </div>
          </div>

          {/* 1-Click Token Optimizer Card */}
          <div className="tc-reducer-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Scissors size={16} style={{ color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                  1-Click Token Reducer
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                Shave 15-40% prompt cost
              </span>
            </div>

            <div className="tc-reducer-buttons">
              <button
                type="button"
                className="tc-reducer-btn"
                onClick={() => handleOptimize('whitespace')}
                disabled={!inputText}
              >
                <span>Condense Whitespace</span>
              </button>
              <button
                type="button"
                className="tc-reducer-btn"
                onClick={() => handleOptimize('comments')}
                disabled={!inputText}
              >
                <span>Strip Comments</span>
              </button>
              <button
                type="button"
                className="tc-reducer-btn"
                onClick={() => handleOptimize('html')}
                disabled={!inputText}
              >
                <span>Strip HTML Tags</span>
              </button>
            </div>

            {optimizationResult && (
              <div style={{
                marginTop: '0.85rem',
                padding: '0.75rem',
                borderRadius: '0.65rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-main, #f8fafc)' }}>
                  Saved <strong>{optimizationResult.savedCount} tokens</strong> ({optimizationResult.savedPercentage}% reduction)!
                </div>
                <button
                  type="button"
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.45rem',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={applyOptimization}
                >
                  Apply Optimized Text
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multi-Model Matrix & Visualizer */}
        <div className="tc-card">
          <div className="tc-card-header">
            <h3 className="tc-card-title">
              <Layers size={17} style={{ color: '#818cf8' }} />
              <span>Multi-Model Intelligence</span>
            </h3>

            <div className="tc-tabs">
              <button
                type="button"
                className={`tc-tab-btn ${viewMode === 'models' ? 'active' : ''}`}
                onClick={() => setViewMode('models')}
              >
                <span>Model Matrix</span>
              </button>
              <button
                type="button"
                className={`tc-tab-btn ${viewMode === 'visualizer' ? 'active' : ''}`}
                onClick={() => setViewMode('visualizer')}
              >
                <span>Color Visualizer</span>
              </button>
              <button
                type="button"
                className={`tc-tab-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <span>Token Table</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: Model Comparison Cards */}
          {viewMode === 'models' && (
            <div className="tc-models-list">
              {modelMetrics.map((model) => {
                const isSelected = model.id === selectedModelId;
                const isOverflow = model.contextPercentage > 100;
                return (
                  <div
                    key={model.id}
                    className="tc-model-row"
                    style={{
                      borderColor: isSelected ? 'rgba(99, 102, 241, 0.6)' : undefined,
                      boxShadow: isSelected ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : undefined,
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedModelId(model.id)}
                  >
                    <div className="tc-model-head">
                      <div className="tc-model-info">
                        <span className="tc-model-dot" style={{ background: model.color }} />
                        <span className="tc-model-name">{model.name}</span>
                        <span className="tc-model-badge">{model.badge}</span>
                      </div>
                      <div className="tc-model-tokens">
                        {model.tokenCount.toLocaleString()} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted, #94a3b8)' }}>tok</span>
                      </div>
                    </div>

                    {/* Context Window Bar */}
                    <div className="tc-progress-wrap">
                      <div className="tc-progress-meta">
                        <span>Context: {model.tokenCount.toLocaleString()} / {(model.contextWindow / 1000).toFixed(0)}k</span>
                        <span style={{ color: isOverflow ? '#ef4444' : undefined, fontWeight: isOverflow ? 700 : undefined }}>
                          {isOverflow ? 'Overflow!' : `${model.contextPercentage}%`}
                        </span>
                      </div>
                      <div className="tc-progress-track">
                        <div
                          className="tc-progress-fill"
                          style={{
                            width: `${Math.min(100, model.contextPercentage)}%`,
                            background: isOverflow 
                              ? '#ef4444' 
                              : model.contextPercentage > 75 
                                ? '#f59e0b' 
                                : model.color
                          }}
                        />
                      </div>
                    </div>

                    {/* Cost Metadata */}
                    <div className="tc-model-costs">
                      <span>Input: <strong className="tc-cost-val">${model.inputCost.toFixed(6)}</strong></span>
                      <span>1K Reply: ${model.outputCost1k.toFixed(5)}</span>
                      <span>Rate: ${model.inputPricePerM} / 1M</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: Interactive Color-Coded Token Visualizer */}
          {viewMode === 'visualizer' && (
            <div>
              <div style={{
                marginBottom: '0.75rem',
                fontSize: '0.82rem',
                color: 'var(--text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Showing first {tokenDetails.tokens.length} token chunks:</span>
                {hoveredToken && (
                  <span style={{ color: '#818cf8', fontWeight: 600 }}>
                    Token #{hoveredToken.index + 1} &bull; ID: {hoveredToken.id} &bull; Length: {hoveredToken.text.length}
                  </span>
                )}
              </div>

              <div className="tc-visualizer-box">
                {tokenDetails.tokens.length === 0 ? (
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>No tokens to visualize.</span>
                ) : (
                  tokenDetails.tokens.map((tok, idx) => {
                    const colorClass = `tc-chip-${idx % 6}`;
                    return (
                      <span
                        key={idx}
                        className={`tc-token-chip ${colorClass}`}
                        onMouseEnter={() => setHoveredToken(tok)}
                        onMouseLeave={() => setHoveredToken(null)}
                        title={`Token #${idx + 1} | ID: ${tok.id} | Chars: ${tok.text.length}`}
                      >
                        {tok.display}
                      </span>
                    );
                  })
                )}
              </div>

              {tokenDetails.isTruncated && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f59e0b' }}>
                  * Preview truncated to {tokenDetails.tokens.length} tokens for browser rendering performance. Total tokens: {tokenDetails.totalCount.toLocaleString()}.
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 3: Token Table */}
          {viewMode === 'table' && (
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.1))', color: 'var(--text-muted, #94a3b8)' }}>
                    <th style={{ padding: '0.5rem' }}>#</th>
                    <th style={{ padding: '0.5rem' }}>Token ID</th>
                    <th style={{ padding: '0.5rem' }}>Piece Text</th>
                    <th style={{ padding: '0.5rem' }}>Length</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenDetails.tokens.slice(0, 100).map((tok, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.45rem', opacity: 0.6 }}>{tok.index + 1}</td>
                      <td style={{ padding: '0.45rem', fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>{tok.id}</td>
                      <td style={{ padding: '0.45rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{tok.display}</td>
                      <td style={{ padding: '0.45rem', opacity: 0.8 }}>{tok.text.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tokenDetails.tokens.length > 100 && (
                <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Showing first 100 of {tokenDetails.totalCount.toLocaleString()} tokens.
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="tc-actions-bar">
            <button
              type="button"
              className="tc-act-btn"
              onClick={handleExportJson}
              disabled={!inputText}
            >
              <Download size={13} />
              <span>Export JSON Report</span>
            </button>
            <button
              type="button"
              className="tc-act-btn"
              onClick={() => handleCopy(`=== Token Count Summary ===\nText Length: ${textStats.chars} chars\nWords: ${textStats.words}\nPrimary Model (${primaryModel.name}): ${primaryModel.tokenCount} tokens\nContext Usage: ${primaryModel.contextPercentage}%\nInput Cost: $${primaryModel.inputCost.toFixed(6)}\n\nCalculated with Cerilas Universal Token Counter (https://tools.cerilas.com/#/tool/token-counter-universal)`)}
              disabled={!inputText}
            >
              <Share2 size={13} />
              <span>Copy Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEO & Educational Section */}
      <TokenCounterSeo />
    </div>
  );
}
