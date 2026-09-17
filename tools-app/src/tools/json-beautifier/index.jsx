import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Braces,
  Sparkles,
  Wand2,
  Minimize2,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRightLeft,
  Table
} from 'lucide-react';
import ToolHeader from '../../components/ui/ToolHeader';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import Button from '../../components/ui/Button';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import JsonBeautifierSeo from './components/JsonBeautifierSeo';
import { jsonBeautifierManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import {
  formatJson,
  minifyJson,
  repairJson,
  analyzeJsonStats,
  jsonToTypeScript,
  jsonToYaml,
  jsonToCsv,
  JSON_SAMPLE_TEMPLATES
} from './jsonEngine';
import './json-beautifier.css';

// Interactive Tree Node Component
function TreeNode({ keyName, value, jsonPath = '$', searchFilter = '', depth = 0 }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const [isCopiedPath, setIsCopiedPath] = useState(false);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const handleCopyPath = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(jsonPath);
    setIsCopiedPath(true);
    setTimeout(() => setIsCopiedPath(false), 1500);
  };

  // Render Primitive Value
  const renderPrimitive = (val) => {
    if (val === null) return <span className="jb-tree-val-null">null</span>;
    if (typeof val === 'string') return <span className="jb-tree-val-string">"{val}"</span>;
    if (typeof val === 'number') return <span className="jb-tree-val-number">{val}</span>;
    if (typeof val === 'boolean') return <span className="jb-tree-val-boolean">{String(val)}</span>;
    return <span>{String(val)}</span>;
  };

  // Filter check
  const matchesSearch = useMemo(() => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    if (keyName && String(keyName).toLowerCase().includes(q)) return true;
    if (!isObject && String(value).toLowerCase().includes(q)) return true;
    return false;
  }, [keyName, value, isObject, searchFilter]);

  if (!matchesSearch && searchFilter.trim()) {
    // If not matching directly, check if children match
    if (!isObject) return null;
  }

  return (
    <div className={`jb-tree-node ${depth === 0 ? 'root' : ''}`}>
      <div className="jb-tree-row" onClick={() => isObject && setIsOpen(!isOpen)}>
        {isObject ? (
          <button type="button" className="jb-tree-toggle" aria-label="Toggle node">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span style={{ width: 14, display: 'inline-block' }} />
        )}

        {keyName !== undefined && (
          <>
            <span className="jb-tree-key">{keyName}</span>
            <span className="jb-tree-colon">:</span>
          </>
        )}

        {isObject ? (
          <>
            <span className="jb-tree-badge">
              {isArray ? `Array[${value.length}]` : `Object{${Object.keys(value).length}}`}
            </span>
            {!isOpen && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {isArray ? '[ ... ]' : '{ ... }'}
              </span>
            )}
          </>
        ) : (
          renderPrimitive(value)
        )}

        <button
          type="button"
          className="jb-tree-jsonpath-btn"
          title={`Copy JSONPath: ${jsonPath}`}
          onClick={handleCopyPath}
        >
          {isCopiedPath ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
        </button>
      </div>

      {isObject && isOpen && (
        <div className="jb-tree-children">
          {Object.entries(value).map(([k, v]) => {
            const nextPath = isArray ? `${jsonPath}[${k}]` : `${jsonPath}.${k}`;
            return (
              <TreeNode
                key={k}
                keyName={isArray ? undefined : k}
                value={v}
                jsonPath={nextPath}
                searchFilter={searchFilter}
                depth={depth + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function JsonBeautifier({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction, trackUse } = useToolAnalytics(
    jsonBeautifierManifest.slug,
    toolMeta || jsonBeautifierManifest
  );

  // Editor State
  const [jsonInput, setJsonInput] = useState(JSON_SAMPLE_TEMPLATES.ecommerce.json);
  const [indentSize, setIndentSize] = useState('2'); // '2', '4', 'tab'
  const [sortKeys, setSortKeys] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'tree', 'ts', 'yaml', 'csv'
  const [treeSearch, setTreeSearch] = useState('');

  // UI Toast / Feedback
  const [statusMessage, setStatusMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef(null);

  // Safe Parsed JSON
  const parsedData = useMemo(() => {
    if (!jsonInput.trim()) return null;
    try {
      return JSON.parse(jsonInput);
    } catch {
      return null;
    }
  }, [jsonInput]);

  // Statistics calculation
  const stats = useMemo(() => {
    return analyzeJsonStats(jsonInput, parsedData);
  }, [jsonInput, parsedData]);

  // Formatted representations
  const tsOutput = useMemo(() => {
    if (!parsedData) return '// Paste valid JSON to generate TypeScript interfaces.';
    try {
      return jsonToTypeScript(parsedData, 'RootPayload');
    } catch (err) {
      return '// Failed to generate TypeScript: ' + err.message;
    }
  }, [parsedData]);

  const yamlOutput = useMemo(() => {
    if (!parsedData) return '# Paste valid JSON to generate YAML.';
    try {
      return jsonToYaml(parsedData);
    } catch (err) {
      return '# Failed to generate YAML: ' + err.message;
    }
  }, [parsedData]);

  const csvOutput = useMemo(() => {
    if (!parsedData) return 'Paste valid JSON array to generate CSV.';
    try {
      const csv = jsonToCsv(parsedData);
      return csv || 'JSON structure is not an array of objects for CSV export.';
    } catch (err) {
      return 'Failed to generate CSV: ' + err.message;
    }
  }, [parsedData]);

  // Action: Beautify
  const handleBeautify = useCallback(() => {
    if (!jsonInput.trim()) return;
    try {
      const formatted = formatJson(jsonInput, indentSize, sortKeys);
      setJsonInput(formatted);
      setStatusMessage({ type: 'success', text: 'JSON beautified successfully!' });
      trackUse?.({ indent: indentSize, sortKeys });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Cannot beautify: ' + err.message });
    }
  }, [jsonInput, indentSize, sortKeys, trackUse]);

  // Action: Minify
  const handleMinify = useCallback(() => {
    if (!jsonInput.trim()) return;
    try {
      const minified = minifyJson(jsonInput);
      setJsonInput(minified);
      setStatusMessage({ type: 'success', text: `Minified! Saved ${stats.savingsPercent || 0}% payload size.` });
      trackUse?.({ action: 'minify' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Cannot minify: ' + err.message });
    }
  }, [jsonInput, stats.savingsPercent, trackUse]);

  // Action: Auto-Repair
  const handleRepair = useCallback(() => {
    if (!jsonInput.trim()) return;
    try {
      const repaired = repairJson(jsonInput);
      setJsonInput(repaired);
      setStatusMessage({ type: 'success', text: 'Syntax repaired and formatted successfully!' });
      trackUse?.({ action: 'repair' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Could not auto-repair JSON: ' + err.message });
    }
  }, [jsonInput, trackUse]);

  // Clear message timeout
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Action: Copy Active View
  const handleCopy = () => {
    let textToCopy = jsonInput;
    if (activeTab === 'ts') textToCopy = tsOutput;
    else if (activeTab === 'yaml') textToCopy = yamlOutput;
    else if (activeTab === 'csv') textToCopy = csvOutput;

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    trackAction('copy', { tab: activeTab });
  };

  // Action: Download File
  const handleDownload = () => {
    let content = jsonInput;
    let filename = 'formatted.json';
    let mimeType = 'application/json';

    if (activeTab === 'ts') {
      content = tsOutput;
      filename = 'schema.d.ts';
      mimeType = 'text/typescript';
    } else if (activeTab === 'yaml') {
      content = yamlOutput;
      filename = 'config.yaml';
      mimeType = 'text/yaml';
    } else if (activeTab === 'csv') {
      content = csvOutput;
      filename = 'export.csv';
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
    trackAction('download', { format: activeTab });
  };

  // Action: Load Sample Template
  const handleLoadSample = (key) => {
    const sample = JSON_SAMPLE_TEMPLATES[key];
    if (sample) {
      setJsonInput(sample.json);
      setStatusMessage({ type: 'success', text: `Loaded "${sample.name}" sample!` });
    }
  };

  // Action: File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      setJsonInput(content);
      setStatusMessage({ type: 'success', text: `Uploaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB)!` });
      trackAction('upload_file');
    };
    reader.readAsText(file);
  };

  return (
    <div className="c-tool-page-container jb-page-container">
      {/* Universal Standard Tool Header */}
      <ToolHeader
        title={toolMeta?.title || 'JSON Beautifier & Formatter'}
        subtitle={toolMeta?.shortDescription || toolMeta?.short_description || 'Format, beautify, validate, minify, and repair JSON in your browser. Interactive collapsible tree viewer, key sorting, and TypeScript / YAML export.'}
        onBack={onBack}
        backLabel="All Tools"
        badges={
          <>
            <Badge variant="success" icon={<Lock size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
            <Badge variant="purple" icon={<Sparkles size={12} strokeWidth={2} />}>
              Auto-Repair Engine
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="neutral" icon={<CheckCircle2 size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel('en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Top Billboard Ad Slot */}
      <AdSlot format="billboard" slotId="ad-json-beautifier-top" />

      {/* Top Action & Preset Toolbar */}
      <div className="jb-control-card">
        {/* Sample Templates Bar */}
        <div className="jb-presets-bar">
          <span className="jb-presets-label">
            <Sparkles size={14} /> Sample Templates:
          </span>
          {Object.entries(JSON_SAMPLE_TEMPLATES).map(([k, s]) => (
            <button
              key={k}
              type="button"
              className="jb-preset-chip"
              onClick={() => handleLoadSample(k)}
            >
              {s.name}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.txt,.log"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={13} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload .json
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={() => {
                setJsonInput('');
                setStatusMessage({ type: 'success', text: 'Cleared workspace.' });
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Primary Controls Toolbar */}
        <div className="jb-toolbar-main">
          <div className="jb-toolbar-group">
            <Button
              variant="primary"
              size="md"
              icon={<Braces size={15} />}
              onClick={handleBeautify}
            >
              Beautify
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={<Minimize2 size={15} />}
              onClick={handleMinify}
            >
              Minify
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={<Wand2 size={15} />}
              onClick={handleRepair}
              title="Automatically fix single quotes, unquoted keys, trailing commas, and Python literals"
            >
              Auto-Repair
            </Button>

            {/* Indent Selector */}
            <select
              className="jb-select"
              value={indentSize}
              onChange={(e) => {
                setIndentSize(e.target.value);
                if (parsedData) {
                  setJsonInput(formatJson(jsonInput, e.target.value, sortKeys));
                }
              }}
              title="Indentation spacing"
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="tab">Tabs</option>
            </select>

            {/* Sort Keys Checkbox */}
            <label className="jb-checkbox-label">
              <input
                type="checkbox"
                checked={sortKeys}
                onChange={(e) => {
                  setSortKeys(e.target.checked);
                  if (parsedData) {
                    setJsonInput(formatJson(jsonInput, indentSize, e.target.checked));
                  }
                }}
              />
              <span>Sort Keys (A-Z)</span>
            </label>
          </div>

          {/* Export Actions */}
          <div className="jb-toolbar-group">
            <Button
              variant="secondary"
              size="md"
              icon={isCopied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopy}
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={<Download size={14} />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="jb-workspace-card">
        {/* Workspace Navigation Tabs */}
        <div className="jb-tabs-header">
          <div className="jb-tabs-list">
            <button
              type="button"
              className={`jb-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <FileCode size={14} />
              JSON Editor
            </button>
            <button
              type="button"
              className={`jb-tab-btn ${activeTab === 'tree' ? 'active' : ''}`}
              onClick={() => setActiveTab('tree')}
              disabled={!parsedData}
              title={!parsedData ? 'Tree view requires valid JSON' : 'Explore interactive tree'}
            >
              <Braces size={14} />
              Interactive Tree
            </button>
            <button
              type="button"
              className={`jb-tab-btn ${activeTab === 'ts' ? 'active' : ''}`}
              onClick={() => setActiveTab('ts')}
              disabled={!parsedData}
            >
              <ArrowRightLeft size={14} />
              TypeScript
            </button>
            <button
              type="button"
              className={`jb-tab-btn ${activeTab === 'yaml' ? 'active' : ''}`}
              onClick={() => setActiveTab('yaml')}
              disabled={!parsedData}
            >
              YAML
            </button>
            <button
              type="button"
              className={`jb-tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
              onClick={() => setActiveTab('csv')}
              disabled={!parsedData}
            >
              <Table size={14} />
              CSV
            </button>
          </div>

          {/* Status Message Notification Toast */}
          {statusMessage && (
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              color: statusMessage.type === 'error' ? '#f87171' : '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              {statusMessage.type === 'error' ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* View Mode 1: Editor View */}
        {activeTab === 'editor' && (
          <div className="jb-editor-container">
            <textarea
              className="jb-textarea"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste raw, unformatted, or broken JSON here..."
              spellCheck={false}
            />
          </div>
        )}

        {/* View Mode 2: Interactive Collapsible Tree View */}
        {activeTab === 'tree' && (
          <div className="jb-tree-container">
            <div className="jb-tree-search-bar">
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search keys or values..."
                className="jb-tree-search-input"
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
              />
              {treeSearch && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={() => setTreeSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            {parsedData ? (
              <TreeNode
                keyName={undefined}
                value={parsedData}
                jsonPath="$"
                searchFilter={treeSearch}
                depth={0}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Invalid JSON. Please switch to the Editor tab and fix syntax errors first.
              </p>
            )}
          </div>
        )}

        {/* View Mode 3: TypeScript Converter */}
        {activeTab === 'ts' && (
          <div className="jb-code-preview">
            <code>{tsOutput}</code>
          </div>
        )}

        {/* View Mode 4: YAML Converter */}
        {activeTab === 'yaml' && (
          <div className="jb-code-preview">
            <code>{yamlOutput}</code>
          </div>
        )}

        {/* View Mode 5: CSV Converter */}
        {activeTab === 'csv' && (
          <div className="jb-code-preview">
            <code>{csvOutput}</code>
          </div>
        )}

        {/* Error Callout (If syntax is invalid) */}
        {!stats.isValid && stats.error && (
          <div className="jb-error-banner">
            <AlertCircle size={15} />
            <span>Syntax Error: {stats.error} (Click "Auto-Repair" above to fix automatically)</span>
          </div>
        )}

        {/* Bottom Telemetry & Statistics Bar */}
        <div className="jb-stats-bar">
          <div className="jb-stats-chips">
            <span className="jb-stat-chip">
              Size: <span className="jb-stat-highlight">{(stats.rawBytes / 1024).toFixed(2)} KB</span>
            </span>
            {stats.isValid && (
              <>
                <span className="jb-stat-chip">
                  Minified: <span className="jb-stat-highlight">{(stats.minifiedBytes / 1024).toFixed(2)} KB</span>
                </span>
                {stats.savingsPercent > 0 && (
                  <span className="jb-savings-badge">
                    -{stats.savingsPercent}% savings
                  </span>
                )}
                <span className="jb-stat-chip">
                  Nodes: <span className="jb-stat-highlight">{stats.nodeCount}</span>
                </span>
                <span className="jb-stat-chip">
                  Max Depth: <span className="jb-stat-highlight">{stats.maxDepth}</span>
                </span>
              </>
            )}
            <span className="jb-stat-chip">
              Lines: <span className="jb-stat-highlight">{stats.lines}</span>
            </span>
          </div>

          <span style={{ fontSize: '0.74rem' }}>
            {stats.isValid ? 'Valid JSON' : 'Invalid Syntax'} • 100% In-Browser Memory
          </span>
        </div>
      </div>

      {/* SEO Divider */}
      <ToolSeoDivider title="Everything You Need to Know About JSON Beautifying &amp; Validation" />

      {/* Comprehensive Educational & SEO Guide */}
      <JsonBeautifierSeo />
    </div>
  );
}
