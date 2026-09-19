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
  Scissors,
  Layers,
  Plus,
  RotateCcw,
  Archive,
  Grid,
  FileDigit,
  Split,
  FileCheck,
  HardDrive,
  BookOpen
} from 'lucide-react';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { pdfSplitterManifest } from './manifest';
import { 
  loadPdfAndThumbnails, 
  splitPdfByCustomParts, 
  splitPdfAllPages, 
  splitPdfEveryNPages, 
  createZipBundle, 
  formatBytes, 
  parsePageRange 
} from './splitter';
import PdfSplitterSeo from './components/PdfSplitterSeo';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import './pdf-splitter.css';

export default function PdfSplitterTool({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    pdfSplitterManifest.slug,
    toolMeta
  );

  const fileInputRef = useRef(null);

  // Loaded PDF State
  const [docFile, setDocFile] = useState(null);
  const [docMeta, setDocMeta] = useState(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [loadProgressText, setLoadProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Active Split Mode: 'custom' | 'grid' | 'all' | 'interval'
  const [splitMode, setSplitMode] = useState('custom');

  // Mode 1: Custom Parts State
  const [customParts, setCustomParts] = useState([]);

  // Mode 2: Visual Grid State (Set of 1-based page numbers)
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [gridExtractCombined, setGridExtractCombined] = useState(true);

  // Mode 4: Interval State
  const [intervalPages, setIntervalPages] = useState(2);

  // Processing & Results State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0, text: '' });
  const [splitResults, setSplitResults] = useState(null);
  const [zipData, setZipData] = useState(null);
  const [isZipping, setIsZipping] = useState(false);

  // Handle incoming file
  const handleSelectFile = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file (.pdf).');
      return;
    }

    setErrorMessage(null);
    setSplitResults(null);
    setZipData(null);
    setIsLoadingPdf(true);
    setLoadProgressText('Reading document...');

    try {
      const meta = await loadPdfAndThumbnails(file, (curr, tot, text) => {
        setLoadProgressText(text);
      });

      setDocFile(file);
      setDocMeta(meta);

      // Initialize default custom parts (half and half if >1 page)
      const baseName = file.name.replace(/\.pdf$/i, '');
      const numPages = meta.numPages;

      if (numPages > 1) {
        const mid = Math.ceil(numPages / 2);
        setCustomParts([
          {
            id: 'part_1',
            name: `${baseName}_part_1.pdf`,
            rangeStr: `1-${mid}`,
            error: null
          },
          {
            id: 'part_2',
            name: `${baseName}_part_2.pdf`,
            rangeStr: `${mid + 1}-${numPages}`,
            error: null
          }
        ]);
      } else {
        setCustomParts([
          {
            id: 'part_1',
            name: `${baseName}_part_1.pdf`,
            rangeStr: '1',
            error: null
          }
        ]);
      }

      // Initialize visual selection (select all by default)
      const allSet = new Set();
      for (let p = 1; p <= numPages; p++) allSet.add(p);
      setSelectedPages(allSet);
    } catch (err) {
      console.error('Failed to load PDF:', err);
      setErrorMessage('Could not load or parse the selected PDF file.');
    } finally {
      setIsLoadingPdf(false);
    }
  }, []);

  // Dropzone drag handlers
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  // Add Part in Custom Mode
  const addCustomPart = () => {
    if (!docMeta) return;
    const baseName = docMeta.name.replace(/\.pdf$/i, '');
    const partNum = customParts.length + 1;
    setCustomParts((prev) => [
      ...prev,
      {
        id: `part_${Date.now()}_${partNum}`,
        name: `${baseName}_part_${partNum}.pdf`,
        rangeStr: `1-${docMeta.numPages}`,
        error: null
      }
    ]);
  };

  // Update Part Range or Name
  const updateCustomPart = (id, key, val) => {
    setCustomParts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [key]: val };
        if (key === 'rangeStr' && docMeta) {
          try {
            parsePageRange(val, docMeta.numPages);
            updated.error = null;
          } catch (e) {
            updated.error = e.message;
          }
        }
        return updated;
      })
    );
  };

  // Remove Part
  const removeCustomPart = (id) => {
    setCustomParts((prev) => prev.filter((p) => p.id !== id));
  };

  // Grid Selection Toggles
  const togglePageSelection = (pageNum) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  const selectAllPages = () => {
    if (!docMeta) return;
    const next = new Set();
    for (let p = 1; p <= docMeta.numPages; p++) next.add(p);
    setSelectedPages(next);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const invertSelection = () => {
    if (!docMeta) return;
    setSelectedPages((prev) => {
      const next = new Set();
      for (let p = 1; p <= docMeta.numPages; p++) {
        if (!prev.has(p)) next.add(p);
      }
      return next;
    });
  };

  // Execute Split
  const handleSplitSubmit = async () => {
    if (!docFile || !docMeta) return;
    setErrorMessage(null);
    setIsProcessing(true);
    setProcessProgress({ current: 0, total: 1, text: 'Preparing split...' });

    try {
      let results = [];
      const baseName = docMeta.name.replace(/\.pdf$/i, '');

      if (splitMode === 'custom') {
        if (customParts.length === 0) {
          throw new Error('Please add at least one part to extract.');
        }
        for (const p of customParts) {
          if (p.error) throw new Error(`Invalid range in "${p.name}": ${p.error}`);
        }
        results = await splitPdfByCustomParts(docFile, customParts, (curr, tot, text) => {
          setProcessProgress({ current: curr, total: tot, text });
        });
      } else if (splitMode === 'grid') {
        if (selectedPages.size === 0) {
          throw new Error('Please select at least one page from the grid.');
        }
        const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
        if (gridExtractCombined) {
          // Extract into a single PDF
          const config = [
            {
              id: 'grid_selected',
              name: `${baseName}_selected_pages.pdf`,
              rangeStr: sortedPages.join(', ')
            }
          ];
          results = await splitPdfByCustomParts(docFile, config, (curr, tot, text) => {
            setProcessProgress({ current: curr, total: tot, text });
          });
        } else {
          // Extract each selected page as an individual file
          const config = sortedPages.map((p) => ({
            id: `page_${p}`,
            name: `${baseName}_page_${p}.pdf`,
            rangeStr: `${p}`
          }));
          results = await splitPdfByCustomParts(docFile, config, (curr, tot, text) => {
            setProcessProgress({ current: curr, total: tot, text });
          });
        }
      } else if (splitMode === 'all') {
        results = await splitPdfAllPages(docFile, baseName, (curr, tot, text) => {
          setProcessProgress({ current: curr, total: tot, text });
        });
      } else if (splitMode === 'interval') {
        const n = Math.max(1, parseInt(intervalPages, 10) || 1);
        results = await splitPdfEveryNPages(docFile, n, baseName, (curr, tot, text) => {
          setProcessProgress({ current: curr, total: tot, text });
        });
      }

      // Attach Object URLs and real rendered cover thumbnails
      const resultsWithUrls = results.map((item) => {
        const thumb = (typeof item.firstPageIndex === 'number' && docMeta?.thumbnails?.[item.firstPageIndex]?.thumbUrl) || null;
        return {
          ...item,
          url: URL.createObjectURL(item.blob),
          thumbnail: thumb
        };
      });

      setSplitResults(resultsWithUrls);

      // Auto-generate ZIP bundle if more than 1 file
      if (resultsWithUrls.length > 1) {
        setIsZipping(true);
        try {
          const zipRes = await createZipBundle(resultsWithUrls, `${baseName}_split.zip`);
          const zipUrl = URL.createObjectURL(zipRes.blob);
          setZipData({
            ...zipRes,
            url: zipUrl
          });
        } catch (zipErr) {
          console.warn('Failed to build zip bundle:', zipErr);
        } finally {
          setIsZipping(false);
        }
      }

      trackAction('use', {
        mode: splitMode,
        originalPages: docMeta.numPages,
        generatedParts: resultsWithUrls.length
      });
    } catch (err) {
      console.error('Split error:', err);
      setErrorMessage(err.message || 'An error occurred while splitting the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download single part
  const handleDownloadPart = (part) => {
    if (!part?.url) return;
    const a = document.createElement('a');
    a.href = part.url;
    a.download = part.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    trackAction('download', {
      fileName: part.name,
      byteSize: part.byteSize
    });
  };

  // Download ZIP
  const handleDownloadZip = () => {
    if (!zipData?.url) return;
    const a = document.createElement('a');
    a.href = zipData.url;
    a.download = zipData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    trackAction('download', {
      fileName: zipData.fileName,
      byteSize: zipData.byteSize,
      isZip: true
    });
  };

  // Preview part in new tab
  const handlePreviewPart = (part) => {
    if (!part?.url) return;
    window.open(part.url, '_blank');
  };

  // Reset
  const handleReset = () => {
    if (splitResults) {
      splitResults.forEach((r) => URL.revokeObjectURL(r.url));
    }
    if (zipData?.url) {
      URL.revokeObjectURL(zipData.url);
    }
    setDocFile(null);
    setDocMeta(null);
    setSplitResults(null);
    setZipData(null);
    setErrorMessage(null);
  };

  return (
    <div className="pdfs-container">
      {/* Tool Header */}
      <ToolHeader
        slug={pdfSplitterManifest.slug}
        title={pdfSplitterManifest.title}
        subtitle={pdfSplitterManifest.shortDescription}
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
                {conversionCount.toLocaleString()} {getConversionLabel(pdfSplitterManifest.slug)}
              </span>
            )}
          </>
        }
      />

      {/* Privacy Guarantee Pill */}
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <div className="pdfs-privacy-banner">
          <ShieldCheck size={16} />
          <span>Zero Server Uploads: PDF splitting is executed 100% in your browser</span>
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

      {/* Upload Dropzone (When no document is loaded) */}
      {!docMeta && (
        <div
          className="pdfs-dropzone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="pdfs-dropzone-icon-wrap">
            <Scissors size={32} />
          </div>
          <h2 className="pdfs-dropzone-title">Select or Drop Your PDF File Here</h2>
          <p className="pdfs-dropzone-subtitle">
            Upload any PDF to split by custom page ranges, extract specific pages, or separate every page
          </p>
          <button type="button" className="pdfs-browse-btn">
            <Plus size={16} />
            <span>Browse PDF Document</span>
          </button>
        </div>
      )}

      {/* Loading Document Indicator */}
      {isLoadingPdf && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#ef4444' }}>
          <RefreshCw size={26} className="spin-animation" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{loadProgressText || 'Loading PDF...'}</p>
        </div>
      )}

      {/* Active Document Workspace */}
      {docMeta && !splitResults && (
        <div className="pdfs-workspace">
          {/* Document Summary Header Card */}
          <div className="pdfs-doc-card">
            <div className="pdfs-doc-left">
              <div className="pdfs-doc-icon-sq">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="pdfs-doc-name" title={docMeta.name}>
                  {docMeta.name}
                </h3>
                <div className="pdfs-doc-meta">
                  <span><strong>{docMeta.numPages}</strong> Total Pages</span>
                  <span>•</span>
                  <span>{formatBytes(docMeta.size)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="pdfm-tool-btn"
              onClick={handleReset}
            >
              <RotateCcw size={14} />
              <span>Change Document</span>
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="pdfs-tabs-nav">
            <button
              type="button"
              className={`pdfs-tab-btn ${splitMode === 'custom' ? 'active' : ''}`}
              onClick={() => setSplitMode('custom')}
            >
              <Split size={16} />
              <span>Custom Ranges / Multi-Part</span>
            </button>

            <button
              type="button"
              className={`pdfs-tab-btn ${splitMode === 'grid' ? 'active' : ''}`}
              onClick={() => setSplitMode('grid')}
            >
              <Grid size={16} />
              <span>Visual Page Grid ({selectedPages.size})</span>
            </button>

            <button
              type="button"
              className={`pdfs-tab-btn ${splitMode === 'all' ? 'active' : ''}`}
              onClick={() => setSplitMode('all')}
            >
              <FileDigit size={16} />
              <span>Extract All Pages ({docMeta.numPages})</span>
            </button>

            <button
              type="button"
              className={`pdfs-tab-btn ${splitMode === 'interval' ? 'active' : ''}`}
              onClick={() => setSplitMode('interval')}
            >
              <Layers size={16} />
              <span>Every N Pages</span>
            </button>
          </div>

          {/* Mode 1: Custom Parts */}
          {splitMode === 'custom' && (
            <div className="pdfs-parts-list">
              {customParts.map((part, idx) => (
                <div key={part.id} className="pdfs-part-card">
                  <div className="pdfs-part-badge">
                    Part #{idx + 1}
                  </div>

                  <div className="pdfs-part-inputs">
                    <div className="pdfs-input-group">
                      <label className="pdfs-input-label" htmlFor={`part-range-${part.id}`}>
                        Page Range (e.g. 1-3, 5)
                      </label>
                      <input
                        id={`part-range-${part.id}`}
                        type="text"
                        value={part.rangeStr}
                        onChange={(e) => updateCustomPart(part.id, 'rangeStr', e.target.value)}
                        placeholder={`e.g. 1-${docMeta.numPages}`}
                        className="pdfs-text-input"
                      />
                      {part.error && (
                        <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>
                          {part.error}
                        </span>
                      )}
                    </div>

                    <div className="pdfs-input-group">
                      <label className="pdfs-input-label" htmlFor={`part-name-${part.id}`}>
                        Output File Name
                      </label>
                      <input
                        id={`part-name-${part.id}`}
                        type="text"
                        value={part.name}
                        onChange={(e) => updateCustomPart(part.id, 'name', e.target.value)}
                        className="pdfs-text-input"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pdfm-action-btn delete"
                    onClick={() => removeCustomPart(part.id)}
                    disabled={customParts.length === 1}
                    title="Delete Part"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="pdfs-add-part-btn"
                onClick={addCustomPart}
              >
                <Plus size={16} />
                <span>Add Another Split Part</span>
              </button>
            </div>
          )}

          {/* Mode 2: Visual Page Grid */}
          {splitMode === 'grid' && (
            <div>
              <div className="pdfs-grid-toolbar">
                <div className="pdfs-grid-stats">
                  <span>Selected: <strong>{selectedPages.size}</strong> of {docMeta.numPages} pages</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" className="pdfm-tool-btn" onClick={selectAllPages}>
                    Select All
                  </button>
                  <button type="button" className="pdfm-tool-btn" onClick={clearSelection}>
                    Clear
                  </button>
                  <button type="button" className="pdfm-tool-btn" onClick={invertSelection}>
                    Invert
                  </button>
                </div>
              </div>

              {/* Extraction target toggle */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gridTarget"
                    checked={gridExtractCombined}
                    onChange={() => setGridExtractCombined(true)}
                  />
                  <span>Extract selected pages into 1 single combined PDF</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gridTarget"
                    checked={!gridExtractCombined}
                    onChange={() => setGridExtractCombined(false)}
                  />
                  <span>Extract each selected page into its own 1-page PDF</span>
                </label>
              </div>

              {/* Thumbnails Grid */}
              <div className="pdfs-thumbnails-grid">
                {docMeta.thumbnails.map((thumb) => {
                  const isSelected = selectedPages.has(thumb.pageNumber);
                  return (
                    <div
                      key={thumb.pageNumber}
                      className={`pdfs-page-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => togglePageSelection(thumb.pageNumber)}
                    >
                      <div className="pdfs-page-thumb">
                        {thumb.thumbUrl ? (
                          <img src={thumb.thumbUrl} alt={`Page ${thumb.pageNumber}`} loading="lazy" />
                        ) : (
                          <FileText size={24} color="#94a3b8" />
                        )}
                      </div>
                      <div className="pdfs-page-footer">
                        <span>Page {thumb.pageNumber}</span>
                        <div className="pdfs-check-indicator">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 3: Extract All Pages */}
          {splitMode === 'all' && (
            <div className="pdfs-interval-box">
              <FileDigit size={36} color="#ef4444" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                Extract All {docMeta.numPages} Pages as Separate Files
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
                Every single page of your document will be extracted into an independent 1-page PDF. You will be able to download individual pages or save all {docMeta.numPages} pages packaged in a single ZIP file.
              </p>
            </div>
          )}

          {/* Mode 4: Split Every N Pages */}
          {splitMode === 'interval' && (
            <div className="pdfs-interval-box">
              <Layers size={36} color="#ef4444" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                Split by Page Interval
              </h4>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Split every</span>
                <input
                  type="number"
                  min="1"
                  max={docMeta.numPages}
                  value={intervalPages}
                  onChange={(e) => setIntervalPages(e.target.value)}
                  className="pdfs-text-input"
                  style={{ width: '80px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>pages</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                This will split your {docMeta.numPages}-page PDF into{' '}
                <strong>{Math.ceil(docMeta.numPages / Math.max(1, parseInt(intervalPages, 10) || 1))}</strong> separate documents.
              </p>
            </div>
          )}

          {/* Bottom Execution Bar */}
          <div className="pdfs-summary-bar">
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Ready to execute {splitMode} split on <strong>{docMeta.name}</strong>
              </span>
            </div>

            <button
              type="button"
              className="pdfs-split-btn"
              onClick={handleSplitSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={18} className="spin-animation" />
                  <span>{processProgress.text || 'Splitting...'}</span>
                </>
              ) : (
                <>
                  <Scissors size={18} />
                  <span>Split PDF Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Result View - Apple-Grade Download Studio */}
      {splitResults && (
        <div className="pdfs-success-panel">
          {/* Celebration Header */}
          <div className="pdfs-hero-celebration">
            <div className="pdfs-hero-icon-wrap">
              <CheckCircle2 size={32} strokeWidth={2.2} />
            </div>
            <div className="pdfs-hero-titles">
              <div className="pdfs-hero-badge-row">
                <span className="pdfs-ready-pill">Ready for Download</span>
                <span className="pdfs-ready-pill" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
                  100% In-Browser Secure
                </span>
              </div>
              <h3 className="pdfs-hero-main-title">PDF Split Successfully!</h3>
              <p className="pdfs-hero-sub-title">
                Generated {splitResults.length} separate {splitResults.length === 1 ? 'document' : 'documents'} from {docMeta?.name} with zero server uploads.
              </p>
            </div>
          </div>

          {/* Bento Stats Row */}
          <div className="pdfs-bento-metrics">
            <div className="pdfs-bento-card">
              <div className="pdfs-bento-icon-sq">
                <Layers size={20} />
              </div>
              <div>
                <div className="pdfs-bento-label">Generated Files</div>
                <div className="pdfs-bento-value">{splitResults.length} Parts</div>
              </div>
            </div>

            <div className="pdfs-bento-card">
              <div className="pdfs-bento-icon-sq" style={{ color: '#10b981' }}>
                <FileCheck size={20} />
              </div>
              <div>
                <div className="pdfs-bento-label">Extracted Pages</div>
                <div className="pdfs-bento-value">
                  {splitResults.reduce((acc, curr) => acc + (curr.pageCount || 1), 0)} Pages
                </div>
              </div>
            </div>

            <div className="pdfs-bento-card">
              <div className="pdfs-bento-icon-sq" style={{ color: '#8b5cf6' }}>
                <HardDrive size={20} />
              </div>
              <div>
                <div className="pdfs-bento-label">Combined Size</div>
                <div className="pdfs-bento-value">
                  {formatBytes(splitResults.reduce((acc, curr) => acc + (curr.byteSize || 0), 0))}
                </div>
              </div>
            </div>

            <div className="pdfs-bento-card">
              <div className="pdfs-bento-icon-sq" style={{ color: '#f59e0b' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="pdfs-bento-label">Security Guarantee</div>
                <div className="pdfs-bento-value" style={{ fontSize: '0.95rem' }}>Client-Side Only</div>
              </div>
            </div>
          </div>

          {/* Hero ZIP Download Banner (if more than 1 file) */}
          {zipData && (
            <div className="pdfs-zip-hero-card">
              <div className="pdfs-zip-hero-left">
                <div className="pdfs-zip-hero-icon">
                  <Archive size={28} />
                </div>
                <div>
                  <h4 className="pdfs-zip-hero-title">Download All as ZIP Archive</h4>
                  <p className="pdfs-zip-hero-sub">
                    All {splitResults.length} split PDF documents bundled in a high-speed compressed archive ({zipData.fileName})
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="pdfs-zip-cta-btn"
                onClick={handleDownloadZip}
              >
                <Download size={18} />
                <span>Download ZIP Package ({formatBytes(zipData.byteSize)})</span>
              </button>
            </div>
          )}

          {/* Individual Output Documents Grid */}
          <div className="pdfs-output-section-header">
            <h4 className="pdfs-output-section-title">
              Generated Documents ({splitResults.length})
            </h4>
            {splitResults.length > 1 && (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Click Save on any card or use the ZIP package above
              </span>
            )}
          </div>

          <div className="pdfs-output-grid">
            {splitResults.map((part, idx) => (
              <div key={part.id || idx} className="pdfs-output-card">
                {/* Real Rendered Cover Thumbnail */}
                <div className="pdfs-output-thumb">
                  {part.thumbnail ? (
                    <img src={part.thumbnail} alt={`Preview of ${part.name}`} />
                  ) : (
                    <FileText size={28} color="#94a3b8" />
                  )}
                </div>

                {/* Document Info */}
                <div className="pdfs-output-info">
                  <div className="pdfs-output-title" title={part.name}>
                    {part.name}
                  </div>
                  <div className="pdfs-output-pills">
                    <span className="pdfs-output-pill accent">
                      {part.pageCount} {part.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                    <span className="pdfs-output-pill">
                      {part.pagesSummary}
                    </span>
                    <span className="pdfs-output-pill">
                      {formatBytes(part.byteSize)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pdfs-output-actions">
                  <button
                    type="button"
                    className="pdfs-output-dl-btn"
                    onClick={() => handleDownloadPart(part)}
                    title="Download PDF document"
                  >
                    <Download size={13} />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    className="pdfs-output-prev-btn"
                    onClick={() => handlePreviewPart(part)}
                    title="Preview in browser"
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions Row */}
          <div className="pdfs-bottom-actions-row">
            <button
              type="button"
              className="pdfs-restart-btn"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              <span>Split Another Document</span>
            </button>

            <button
              type="button"
              className="pdfm-tool-btn"
              onClick={onBack || (() => { window.location.hash = '#/'; })}
            >
              <span>Return to All Tools</span>
            </button>
          </div>
        </div>
      )}

      {/* Tool SEO & Educational Section Divider */}
      <ToolSeoDivider />

      {/* Rich SEO Content */}
      <PdfSplitterSeo />
    </div>
  );
}
