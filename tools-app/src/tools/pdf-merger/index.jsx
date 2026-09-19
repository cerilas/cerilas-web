import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Download,
  Trash2,
  Lock,
  Eye,
  CheckCircle2,
  FileText,
  Zap,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Check,
  ShieldCheck,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripVertical,
  Plus,
  RotateCcw,
  ExternalLink,
  FileCheck
} from 'lucide-react';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { pdfMergerManifest } from './manifest';
import { 
  extractPdfMetadata, 
  mergePdfFiles, 
  formatBytes, 
  parsePageRange 
} from './merger';
import PdfMergerSeo from './components/PdfMergerSeo';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import './pdf-merger.css';

export default function PdfMergerTool({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    pdfMergerManifest.slug,
    toolMeta
  );

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);

  // Files state
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, text: '' });
  const [outputFileName, setOutputFileName] = useState('merged_document.pdf');
  const [mergedResult, setMergedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Drag-and-drop state for reordering
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (mergedResult?.url) {
        URL.revokeObjectURL(mergedResult.url);
      }
    };
  }, [mergedResult]);

  // Handle incoming file objects
  const handleAddFiles = useCallback(async (incomingFiles) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setErrorMessage(null);

    const pdfFiles = Array.from(incomingFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setErrorMessage('Please select valid PDF documents (.pdf).');
      return;
    }

    setIsExtracting(true);
    try {
      const extractedList = [];
      for (const file of pdfFiles) {
        const meta = await extractPdfMetadata(file);
        extractedList.push(meta);
      }

      setFiles((prev) => [...prev, ...extractedList]);
    } catch (err) {
      console.error('Error extracting PDF metadata:', err);
      setErrorMessage('Could not load one or more PDF documents.');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  // Dropzone drag handlers
  const handleDropzoneDrop = (e) => {
    e.preventDefault();
    setIsDragOverDropzone(false);
    if (e.dataTransfer?.files) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleDropzoneDragOver = (e) => {
    e.preventDefault();
    setIsDragOverDropzone(true);
  };

  const handleDropzoneDragLeave = () => {
    setIsDragOverDropzone(false);
  };

  // Reorder: Move Up / Down
  const moveItem = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= files.length) return;
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  // Reorder: Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDropItem = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIdx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Quick Sorting Controls
  const sortAlphabetical = () => {
    setFiles((prev) =>
      [...prev].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    );
  };

  const reverseOrder = () => {
    setFiles((prev) => [...prev].reverse());
  };

  const sortBySize = () => {
    setFiles((prev) => [...prev].sort((a, b) => a.size - b.size));
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setMergedResult(null);
    setErrorMessage(null);
  };

  // Update custom page range
  const handlePageRangeChange = (id, value, totalPages) => {
    setFiles((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let error = null;
        if (value.trim()) {
          try {
            parsePageRange(value, totalPages);
          } catch (err) {
            error = err.message;
          }
        }
        return {
          ...item,
          pageRange: value,
          pageRangeError: error
        };
      })
    );
  };

  // Merge execution
  const handleMergeSubmit = async () => {
    if (files.length === 0) return;
    setErrorMessage(null);

    // Validate any page range errors
    const hasRangeErrors = files.some((f) => f.pageRangeError);
    if (hasRangeErrors) {
      setErrorMessage('Please correct invalid page range entries before merging.');
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: files.length, text: 'Preparing documents...' });

    try {
      const result = await mergePdfFiles(files, (current, total, text) => {
        setProgress({ current, total, text });
      });

      const blobUrl = URL.createObjectURL(result.blob);

      setMergedResult({
        ...result,
        url: blobUrl,
        fileName: outputFileName.endsWith('.pdf') ? outputFileName : `${outputFileName}.pdf`
      });

      trackAction('use', {
        fileCount: files.length,
        totalPages: result.totalPages,
        byteSize: result.byteSize
      });
    } catch (err) {
      console.error('Merge error:', err);
      setErrorMessage(err.message || 'An error occurred while merging your PDF documents.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Merged PDF
  const handleDownload = () => {
    if (!mergedResult?.url) return;
    const a = document.createElement('a');
    a.href = mergedResult.url;
    a.download = mergedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    trackAction('download', {
      fileName: mergedResult.fileName,
      byteSize: mergedResult.byteSize
    });
  };

  // Preview in new tab
  const handlePreview = () => {
    if (!mergedResult?.url) return;
    window.open(mergedResult.url, '_blank');
  };

  // Calculate totals
  const totalCombinedPages = files.reduce((acc, f) => {
    if (!f.pageRange || !f.pageRange.trim()) return acc + (f.numPages || 1);
    try {
      const indices = parsePageRange(f.pageRange, f.numPages || 1);
      return acc + indices.length;
    } catch {
      return acc + (f.numPages || 1);
    }
  }, 0);

  const totalCombinedSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="pdfm-container">
      {/* Tool Header */}
      <ToolHeader
        slug={pdfMergerManifest.slug}
        title={pdfMergerManifest.title}
        subtitle={pdfMergerManifest.shortDescription}
        onBack={onBack || (() => { window.location.hash = '#/'; })}
        backLabel="All Tools"
        badges={
          <>
            <Badge variant="success">100% Private</Badge>
            <Badge variant="blue">Client-Side</Badge>
            {visitorCount > 0 && (
              <span className="card-stat-pill" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {visitorCount.toLocaleString()} visitors
              </span>
            )}
            {conversionCount > 0 && (
              <span className="card-stat-pill" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {conversionCount.toLocaleString()} {getConversionLabel(pdfMergerManifest.slug)}
              </span>
            )}
          </>
        }
      />

      {/* Privacy Guarantee Pill */}
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <div className="pdfm-privacy-banner">
          <ShieldCheck size={16} />
          <span>Zero Server Uploads: Files are processed 100% locally inside your browser</span>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div 
          style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            color: '#b91c1c', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Upload Dropzone (When no files or in addition) */}
      {files.length === 0 && (
        <div
          className={`pdfm-dropzone ${isDragOverDropzone ? 'pdfm-is-dragover' : ''}`}
          onDrop={handleDropzoneDrop}
          onDragOver={handleDropzoneDragOver}
          onDragLeave={handleDropzoneDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) handleAddFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="pdfm-dropzone-icon-wrap">
            <UploadCloud size={32} />
          </div>
          <h2 className="pdfm-dropzone-title">Select or Drop PDF Files Here</h2>
          <p className="pdfm-dropzone-subtitle">
            Upload two or more PDF documents to merge them into a single file with custom sequence order
          </p>
          <button type="button" className="pdfm-browse-btn">
            <Plus size={16} />
            <span>Browse PDF Files</span>
          </button>
        </div>
      )}

      {/* Loading Extraction Indicator */}
      {isExtracting && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#2563eb' }}>
          <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Analyzing PDF documents &amp; generating previews...</p>
        </div>
      )}

      {/* Active Files Workspace */}
      {files.length > 0 && (
        <div className="pdfm-workspace">
          {/* Top Quick Actions Toolbar */}
          <div className="pdfm-toolbar">
            <div className="pdfm-toolbar-count">
              <Layers size={18} color="#2563eb" />
              <span>Documents to Merge</span>
              <span className="pdfm-toolbar-badge">{files.length}</span>
            </div>

            <div className="pdfm-toolbar-actions">
              {/* Add More Files Button */}
              <input
                ref={addMoreInputRef}
                type="file"
                accept="application/pdf"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleAddFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="pdfm-tool-btn"
                onClick={() => addMoreInputRef.current?.click()}
              >
                <Plus size={14} />
                <span>Add More</span>
              </button>

              {/* Sort Controls */}
              <button
                type="button"
                className="pdfm-tool-btn"
                onClick={sortAlphabetical}
                title="Sort A to Z by file name"
              >
                <ArrowUpDown size={14} />
                <span>Sort A-Z</span>
              </button>

              <button
                type="button"
                className="pdfm-tool-btn"
                onClick={reverseOrder}
                title="Reverse current sequence"
              >
                <RotateCcw size={14} />
                <span>Reverse Order</span>
              </button>

              <button
                type="button"
                className="pdfm-tool-btn"
                onClick={sortBySize}
                title="Sort smallest to largest file size"
              >
                <span>By Size</span>
              </button>

              {/* Clear All */}
              <button
                type="button"
                className="pdfm-tool-btn danger"
                onClick={clearAll}
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Draggable & Reorderable List */}
          <div className="pdfm-file-list">
            {files.map((item, index) => {
              const isDragging = draggedIdx === index;
              const isDropTarget = dragOverIdx === index;

              return (
                <div
                  key={item.id}
                  className={`pdfm-file-card ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOverItem(e, index)}
                  onDrop={(e) => handleDropItem(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Drag Handle & Order Number */}
                  <div className="pdfm-file-drag-handle" title="Drag to reorder sequence">
                    <GripVertical size={18} />
                    <div className="pdfm-order-badge">#{index + 1}</div>
                  </div>

                  {/* Visual Page 1 Thumbnail */}
                  <div className="pdfm-file-thumb">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={`Page 1 of ${item.name}`} />
                    ) : (
                      <FileText size={28} color="#94a3b8" />
                    )}
                  </div>

                  {/* File Metadata & Page Range Selection */}
                  <div className="pdfm-file-info">
                    <div className="pdfm-file-name" title={item.name}>
                      {item.name}
                    </div>

                    <div className="pdfm-file-meta">
                      <span className="pdfm-meta-pill">
                        {item.numPages} {item.numPages === 1 ? 'page' : 'pages'}
                      </span>
                      <span>•</span>
                      <span>{formatBytes(item.size)}</span>
                    </div>

                    {/* Page Range Customizer */}
                    <div className="pdfm-page-range-wrap">
                      <label htmlFor={`range-${item.id}`} className="pdfm-range-label">
                        Pages to merge:
                      </label>
                      <input
                        id={`range-${item.id}`}
                        type="text"
                        placeholder={`All (${item.numPages})`}
                        value={item.pageRange}
                        onChange={(e) => handlePageRangeChange(item.id, e.target.value, item.numPages)}
                        className="pdfm-range-input"
                        title="Specify page ranges like '1-3, 5' or leave empty for all pages"
                      />
                      {item.pageRangeError && (
                        <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>
                          {item.pageRangeError}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Up / Down / Delete Buttons */}
                  <div className="pdfm-file-actions">
                    <button
                      type="button"
                      className="pdfm-action-btn"
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                      title="Move up in sequence"
                      aria-label="Move up"
                    >
                      <ArrowUp size={15} />
                    </button>

                    <button
                      type="button"
                      className="pdfm-action-btn"
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === files.length - 1}
                      title="Move down in sequence"
                      aria-label="Move down"
                    >
                      <ArrowDown size={15} />
                    </button>

                    <button
                      type="button"
                      className="pdfm-action-btn delete"
                      onClick={() => removeFile(item.id)}
                      title="Remove file"
                      aria-label="Remove file"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary & Merge Trigger Bar */}
          <div className="pdfm-summary-bar">
            <div className="pdfm-summary-stats">
              <div className="pdfm-stat-box">
                <span className="pdfm-stat-label">Total Files</span>
                <span className="pdfm-stat-val">{files.length}</span>
              </div>
              <div className="pdfm-stat-box">
                <span className="pdfm-stat-label">Combined Pages</span>
                <span className="pdfm-stat-val">{totalCombinedPages}</span>
              </div>
              <div className="pdfm-stat-box">
                <span className="pdfm-stat-label">Combined Size</span>
                <span className="pdfm-stat-val">{formatBytes(totalCombinedSize)}</span>
              </div>
            </div>

            <div className="pdfm-summary-right">
              <div>
                <input
                  type="text"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="Output file name..."
                  className="pdfm-output-name-input"
                  title="Output PDF file name"
                />
              </div>

              <button
                type="button"
                className="pdfm-merge-submit-btn"
                onClick={handleMergeSubmit}
                disabled={isProcessing || files.length < 1}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={18} className="spin-animation" />
                    <span>{progress.text || 'Merging...'}</span>
                  </>
                ) : (
                  <>
                    <Layers size={18} />
                    <span>Merge {files.length} {files.length === 1 ? 'PDF' : 'PDFs'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Result View */}
      {mergedResult && (
        <div className="pdfm-success-panel">
          <div className="pdfm-success-icon-wrap">
            <Check size={36} strokeWidth={2.5} />
          </div>

          <h3 className="pdfm-success-title">PDFs Merged Successfully!</h3>

          <div className="pdfm-success-meta">
            <span><strong>{mergedResult.totalPages}</strong> Total Pages</span>
            <span>•</span>
            <span><strong>{formatBytes(mergedResult.byteSize)}</strong> File Size</span>
            <span>•</span>
            <span>Processed in <strong>{mergedResult.durationSec}s</strong></span>
          </div>

          <div className="pdfm-success-actions">
            <button
              type="button"
              className="pdfm-download-btn"
              onClick={handleDownload}
            >
              <Download size={18} />
              <span>Download Merged PDF</span>
            </button>

            <button
              type="button"
              className="pdfm-preview-btn"
              onClick={handlePreview}
            >
              <Eye size={18} />
              <span>Preview in Browser</span>
            </button>

            <button
              type="button"
              className="pdfm-restart-btn"
              onClick={() => {
                setMergedResult(null);
                setFiles([]);
              }}
            >
              <RotateCcw size={16} />
              <span>Merge New Batch</span>
            </button>
          </div>
        </div>
      )}

      {/* Tool SEO & Educational Section Divider */}
      <ToolSeoDivider />

      {/* Rich SEO Content */}
      <PdfMergerSeo />
    </div>
  );
}
