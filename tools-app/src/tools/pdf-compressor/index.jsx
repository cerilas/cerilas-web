import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  UploadCloud,
  Download,
  Archive,
  Trash2,
  Lock,
  Eye,
  CheckCircle2,
  FileText,
  Zap,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Sliders,
  Check,
  ShieldCheck,
  Layers
} from 'lucide-react';
import JSZip from 'jszip';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { pdfCompressorManifest } from './manifest';
import { 
  compressPdf, 
  extractPdfInfo, 
  formatBytes, 
  COMPRESSION_PRESETS 
} from './compressor';
import PdfCompressorSeo from './components/PdfCompressorSeo';
import AdSlot from '../../components/ui/AdSlot';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import './pdf-compressor.css';

export default function PdfCompressorTool({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    pdfCompressorManifest.slug,
    toolMeta
  );
  const fileInputRef = useRef(null);

  // Compression preset
  const [activePreset, setActivePreset] = useState('balanced');
  
  // Files queue
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Handle incoming files
  const handleFilesAdded = useCallback(async (newFiles) => {
    const pdfFiles = Array.from(newFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      showToast('Please upload valid PDF documents (.pdf)', 'error');
      return;
    }

    // Initial placeholder items
    const newItems = pdfFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      file,
      name: file.name,
      originalSize: file.size,
      numPages: 1,
      thumbnail: null,
      dimensions: 'Loading...',
      status: 'loading_info', // loading_info | ready | compressing | done | error
      progress: 0,
      progressStatus: 'Extracting metadata...',
      result: null,
      error: null
    }));

    setFiles((prev) => [...prev, ...newItems]);
    trackAction('files_added', { file_count: pdfFiles.length });

    // Asynchronously extract thumbnails & metadata for each added file
    for (const item of newItems) {
      try {
        const info = await extractPdfInfo(item.file);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  numPages: info.numPages,
                  thumbnail: info.thumbnail,
                  dimensions: info.dimensions,
                  status: 'ready',
                  progressStatus: 'Ready to compress'
                }
              : f
          )
        );
      } catch (err) {
        console.error('Failed to parse PDF metadata:', err);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'ready',
                  progressStatus: 'Ready to compress (standard parse)'
                }
              : f
          )
        );
      }
    }
  }, [showToast, trackAction]);

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Compress single file
  const compressSingleFile = async (item) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === item.id
          ? { ...f, status: 'compressing', progress: 5, progressStatus: 'Starting...' }
          : f
      )
    );

    try {
      const result = await compressPdf(
        item.file,
        {
          preset: activePreset
        },
        ({ percent, status }) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, progress: percent, progressStatus: status }
                : f
            )
          );
        }
      );

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'done',
                progress: 100,
                progressStatus: 'Finished',
                result
              }
            : f
        )
      );

      return result;
    } catch (err) {
      console.error('Compression failed for', item.name, err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'error',
                error: err.message || 'Compression failed'
              }
            : f
        )
      );
      return null;
    }
  };

  // Compress all files
  const handleCompressAll = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);

    const pending = files.filter((f) => f.status !== 'compressing');
    let successfulCount = 0;

    for (const item of pending) {
      const res = await compressSingleFile(item);
      if (res) successfulCount++;
    }

    setIsProcessing(false);
    if (successfulCount > 0) {
      showToast(`Successfully compressed ${successfulCount} PDF document${successfulCount > 1 ? 's' : ''}!`);
      trackAction('compress', { count: successfulCount, preset: activePreset });
    }
  };

  // Download individual file
  const handleDownloadFile = (item) => {
    if (!item.result || !item.result.blob) return;

    const url = URL.createObjectURL(item.result.blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = item.name.replace(/\.pdf$/i, '');
    a.download = `${baseName}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLocalDownloadDelta((d) => d + 1);
    trackAction('download', { file_name: item.name, preset: activePreset });
    showToast(`Downloaded ${a.download}`);
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const completed = files.filter((f) => f.status === 'done' && f.result && f.result.bytes);
    if (completed.length === 0) {
      showToast('No compressed PDFs to download yet', 'error');
      return;
    }

    try {
      const zip = new JSZip();
      completed.forEach((item) => {
        const baseName = item.name.replace(/\.pdf$/i, '');
        zip.file(`${baseName}_compressed.pdf`, item.result.bytes);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cerilas_compressed_pdfs_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLocalDownloadDelta((d) => d + completed.length);
      trackAction('download', { is_batch: true, file_count: completed.length });
      showToast(`Exported ${completed.length} PDFs in ZIP archive!`);
    } catch (err) {
      console.error('ZIP creation error:', err);
      showToast('Failed to create ZIP archive', 'error');
    }
  };

  // Remove single file
  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Clear all files
  const handleClearAll = () => {
    setFiles([]);
  };

  // Aggregated stats calculation
  const totalOriginalBytes = files.reduce((acc, f) => acc + (f.originalSize || 0), 0);
  const completedFiles = files.filter((f) => f.status === 'done' && f.result);
  const totalCompressedBytes = completedFiles.reduce((acc, f) => acc + (f.result?.compressedSize || f.originalSize), 0);
  const totalCompletedOriginalBytes = completedFiles.reduce((acc, f) => acc + (f.originalSize || 0), 0);
  const totalSavedBytes = Math.max(0, totalCompletedOriginalBytes - totalCompressedBytes);
  const overallRatio = totalCompletedOriginalBytes > 0 
    ? ((totalSavedBytes / totalCompletedOriginalBytes) * 100).toFixed(1) 
    : 0;

  return (
    <div className="c-tool-page-container pdf-comp-root">
      {/* Dynamic Floating Toast */}
      {notification && (
        <div className={`pdf-comp-toast ${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} color="#10b981" />
          ) : (
            <AlertCircle size={16} color="#ef4444" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Standardized Tool Header */}
      <ToolHeader
        title="Free In-Browser PDF Compressor"
        subtitle="Reduce PDF file sizes up to 90% without uploading sensitive contracts or resumes to the cloud. Processed 100% client-side in browser memory."
        onBack={onBack}
        backLabel="All Tools"
        badges={
          <>
            <Badge variant="success" icon={<Lock size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="neutral" icon={<Download size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel('en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Compression Preset Selector */}
      <div className="pdf-comp-presets-card">
        <div className="pdf-presets-header">
          <Sliders size={16} className="pdf-preset-header-icon" />
          <span className="pdf-presets-title">Compression Level Preset</span>
        </div>
        <div className="pdf-presets-grid">
          {Object.values(COMPRESSION_PRESETS).map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <div
                key={preset.id}
                className={`pdf-preset-box ${isSelected ? 'active' : ''}`}
                onClick={() => setActivePreset(preset.id)}
                role="button"
                tabIndex={0}
              >
                <div className="pdf-preset-top">
                  <span className="pdf-preset-name">{preset.label}</span>
                  <span className={`pdf-preset-badge ${preset.id}`}>{preset.badge}</span>
                </div>
                <p className="pdf-preset-desc">{preset.description}</p>
                <div className="pdf-preset-footer">
                  <span className="pdf-saving-tag">Estimated Saving: {preset.estimatedSaving}</span>
                  {isSelected && <Check size={16} className="pdf-preset-checked" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        className={`pdf-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
          accept="application/pdf,.pdf"
          multiple
          style={{ display: 'none' }}
        />
        <div className="pdf-drop-icon-wrap">
          <UploadCloud size={38} className="pdf-drop-icon" />
        </div>
        <h3 className="pdf-drop-title">Drop your PDF files here, or browse</h3>
        <p className="pdf-drop-sub">
          Select single or batch PDFs. All processing runs privately in local device memory.
        </p>
        <div className="pdf-drop-btn">
          <FileText size={16} />
          <span>Select PDF Documents</span>
        </div>
      </div>

      {/* File Queue & Management */}
      {files.length > 0 && (
        <div className="pdf-queue-section">
          {/* Queue Top Action Bar */}
          <div className="pdf-queue-header">
            <div className="pdf-queue-title-wrap">
              <h3>Uploaded Documents ({files.length})</h3>
              <span className="pdf-queue-total-size">Total: {formatBytes(totalOriginalBytes)}</span>
            </div>

            <div className="pdf-queue-actions">
              <button
                className="pdf-action-btn primary"
                onClick={handleCompressAll}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" />
                    <span>Compressing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    <span>Compress All PDFs</span>
                  </>
                )}
              </button>

              {completedFiles.length > 0 && (
                <button
                  className="pdf-action-btn success"
                  onClick={handleDownloadAllZip}
                >
                  <Archive size={15} />
                  <span>Download All as ZIP ({completedFiles.length})</span>
                </button>
              )}

              <button
                className="pdf-action-btn danger"
                onClick={handleClearAll}
                disabled={isProcessing}
                title="Clear all uploaded documents"
              >
                <Trash2 size={15} />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Aggregate Savings Summary Banner */}
          {completedFiles.length > 0 && (
            <div className="pdf-summary-banner">
              <div className="pdf-summary-item">
                <span className="summary-label">Original Weight</span>
                <span className="summary-value">{formatBytes(totalCompletedOriginalBytes)}</span>
              </div>
              <div className="pdf-summary-arrow">→</div>
              <div className="pdf-summary-item">
                <span className="summary-label">Compressed Size</span>
                <span className="summary-value green">{formatBytes(totalCompressedBytes)}</span>
              </div>
              <div className="pdf-summary-badge">
                <Sparkles size={14} />
                <span>Saved {formatBytes(totalSavedBytes)} ({overallRatio}%)</span>
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="pdf-files-list">
            {files.map((item) => (
              <div key={item.id} className={`pdf-file-card ${item.status}`}>
                {/* Thumbnail Preview */}
                <div className="pdf-thumb-wrap">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="pdf-thumb-img"
                    />
                  ) : (
                    <div className="pdf-thumb-placeholder">
                      <FileText size={28} className="pdf-thumb-icon" />
                    </div>
                  )}
                  <span className="pdf-pages-badge">
                    {item.numPages} {item.numPages === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>

                {/* File Details */}
                <div className="pdf-file-info">
                  <div className="pdf-file-title-row">
                    <h4 className="pdf-file-name" title={item.name}>{item.name}</h4>
                    <span className="pdf-file-dim">{item.dimensions}</span>
                  </div>

                  <div className="pdf-file-sizes-row">
                    <span className="size-orig">Original: {formatBytes(item.originalSize)}</span>

                    {item.status === 'done' && item.result && (
                      <>
                        <span className="size-arrow">→</span>
                        <span className="size-comp">{formatBytes(item.result.compressedSize)}</span>
                        <span className="size-ratio-badge">
                          -{item.result.ratio}% ({formatBytes(item.result.savedBytes)} saved)
                        </span>
                      </>
                    )}
                  </div>

                  {/* Progress bar when compressing */}
                  {item.status === 'compressing' && (
                    <div className="pdf-progress-wrap">
                      <div className="pdf-progress-bar">
                        <div
                          className="pdf-progress-fill"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="pdf-progress-text">{item.progressStatus}</span>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="pdf-error-text">
                      <AlertCircle size={14} />
                      <span>{item.error || 'Failed to compress document'}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pdf-card-actions">
                  {item.status === 'done' ? (
                    <button
                      className="pdf-card-btn download"
                      onClick={() => handleDownloadFile(item)}
                      title="Download compressed PDF"
                    >
                      <Download size={15} />
                      <span>Download</span>
                    </button>
                  ) : (
                    <button
                      className="pdf-card-btn compress"
                      onClick={() => compressSingleFile(item)}
                      disabled={item.status === 'compressing' || isProcessing}
                    >
                      <Zap size={14} />
                      <span>Compress</span>
                    </button>
                  )}

                  <button
                    className="pdf-card-btn remove"
                    onClick={() => handleRemoveFile(item.id)}
                    title="Remove file"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mid Leaderboard AdSlot */}
      <AdSlot format="leaderboard" slotId="ad-pdf-mid-leaderboard" />

      {/* SEO, GEO & Knowledge Base Architecture (Partitioned below the fold) */}
      <ToolSeoDivider label="PDF Compression Formats, Security & FAQs" />
      <PdfCompressorSeo onSelectPreset={(presetId) => {
        setActivePreset(presetId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />

      {/* Bottom Billboard AdSlot */}
      <AdSlot format="billboard" slotId="ad-pdf-bottom-billboard" />
    </div>
  );
}
