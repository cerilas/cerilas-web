import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  UploadCloud, 
  Download, 
  Archive, 
  Trash2, 
  Eye, 
  Lock, 
  X
} from 'lucide-react';
import JSZip from 'jszip';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { imageCompressorManifest } from './manifest';
import { 
  compressImage, 
  formatBytes 
} from './compressor';
import Select from '../../components/ui/Select';
import AdSlot from '../../components/ui/AdSlot';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import ImageCompressorSeo from './components/ImageCompressorSeo';
import { useTranslation } from '../../i18n';
import './image-compressor.css';

const FORMAT_OPTIONS = [
  { value: 'auto', label: 'Auto (Best Compression)', description: 'Smart WebP • Maximum savings' },
  { value: 'image/webp', label: 'WebP (Google Recommended)', description: '70-90% smaller • Ideal for Web' },
  { value: 'image/jpeg', label: 'JPEG / JPG', description: 'Universal compatibility for print & email' },
  { value: 'image/png', label: 'PNG (Lossless / Alpha)', description: 'Preserves transparent backgrounds' },
  { value: 'image/avif', label: 'AVIF (Next-Gen High Density)', description: 'Extreme compression efficiency' },
];

const RESIZE_OPTIONS = [
  { value: '100', label: '100% (Original Resolution)', description: 'Exact dimensions • No downscaling' },
  { value: '75', label: '75% Scale (High Quality)', description: 'Balanced reduction • ~44% fewer pixels' },
  { value: '50', label: '50% Scale (Half Dimensions)', description: '75% fewer pixels • Ideal for blogs & web' },
  { value: '25', label: '25% Scale (Thumbnail)', description: 'Extreme reduction • Small avatars & cards' },
  { value: 'max-1920', label: 'Cap to Full HD (1920px)', description: 'Downscales only if width/height > 1920px' },
  { value: 'max-1080', label: 'Cap to Standard (1080px)', description: 'Downscales only if width/height > 1080px' },
];

export default function ImageCompressorTool({ onBack, toolMeta }) {
  const { t, language } = useTranslation();
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    imageCompressorManifest.slug,
    toolMeta
  );
  const fileInputRef = useRef(null);

  // Compression Global Settings
  const [quality, setQuality] = useState(75);
  const [outputFormat, setOutputFormat] = useState('auto');
  const [resizeScale, setResizeScale] = useState('100');

  // Queue state
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Compare Modal State
  const [comparingItem, setComparingItem] = useState(null);
  const [splitPos, setSplitPos] = useState(50);
  const splitContainerRef = useRef(null);
  const isDraggingSplitRef = useRef(false);

  // Debounce & cancellation references for silky smooth non-blocking updates
  const recompressDebounceRef = useRef(null);
  const recompressVersionRef = useRef(0);

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Recompress all items with debouncing and version cancellation
  const triggerRecompressAll = useCallback((newQuality, newFormat, newScale) => {
    if (items.length === 0) return;

    if (recompressDebounceRef.current) {
      clearTimeout(recompressDebounceRef.current);
    }

    recompressDebounceRef.current = setTimeout(async () => {
      const version = ++recompressVersionRef.current;
      setIsProcessing(true);

      // Mark all existing items as recompressing
      setItems((prev) => prev.map((item) => ({ ...item, isRecompressing: true })));

      const activeQ = newQuality ?? quality;
      const activeF = newFormat ?? outputFormat;
      const activeS = newScale ?? resizeScale;

      for (const currentItem of items) {
        if (recompressVersionRef.current !== version) return;

        if (currentItem.originalFile) {
          // Yield to render frame before each compression
          await new Promise((r) => setTimeout(r, 0));

          try {
            const res = await compressImage(currentItem.originalFile, {
              quality: activeQ / 100,
              resizeScale: activeS,
              outputFormat: activeF
            });

            if (recompressVersionRef.current !== version) return;

            // Revoke old compressed URL
            if (currentItem.compressedUrl && currentItem.compressedUrl !== res.compressedUrl) {
              URL.revokeObjectURL(currentItem.compressedUrl);
            }

            setItems((prev) => prev.map((it) => {
              if (it.id === currentItem.id) {
                return {
                  ...it,
                  ...res,
                  status: 'done',
                  isRecompressing: false
                };
              }
              return it;
            }));
          } catch (err) {
            console.error('Recompression error for file:', currentItem.originalName, err);
          }

          // Yield frame for 60 FPS smooth rendering
          await new Promise((r) => requestAnimationFrame(r));
        }
      }

      if (recompressVersionRef.current === version) {
        setItems((prev) => prev.map((it) => ({ ...it, isRecompressing: false })));
        setIsProcessing(false);
        showToast('Updated images with new settings!');
      }
    }, 280);
  }, [items, quality, outputFormat, resizeScale]);

  // Handle addition of new files
  const handleFilesAdded = useCallback(async (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;
    let validImageFiles = Array.from(newFiles).filter((f) => 
      f.type.startsWith('image/') || f.name.match(/\.(jpe?g|png|webp|avif|gif|svg|bmp)$/i)
    );

    if (validImageFiles.length === 0) {
      showToast('Please upload supported image files (JPG, PNG, WebP, AVIF, SVG).');
      return;
    }

    const remainingSlots = Math.max(0, 10 - items.length);
    if (remainingSlots === 0) {
      showToast('Maximum limit of 10 images reached. Please clear some images first.');
      return;
    }

    let limitWarning = false;
    if (validImageFiles.length > remainingSlots) {
      validImageFiles = validImageFiles.slice(0, remainingSlots);
      limitWarning = true;
    }

    // 1. Instantly create placeholders in 'compressing' state for immediate UI feedback
    const newPlaceholders = validImageFiles.map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      originalFile: file,
      originalName: file.name,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      status: 'compressing'
    }));

    setItems((prev) => [...newPlaceholders, ...prev]);
    setIsProcessing(true);
    trackAction('upload_batch', { count: validImageFiles.length });

    // 2. Process each item asynchronously, updating progressive UI card by card
    for (const placeholder of newPlaceholders) {
      // Yield to keep UI snappy
      await new Promise((r) => setTimeout(r, 0));

      try {
        const res = await compressImage(placeholder.originalFile, {
          quality: quality / 100,
          resizeScale,
          outputFormat
        });

        setItems((prev) => prev.map((item) => {
          if (item.id === placeholder.id) {
            return {
              ...item,
              ...res,
              status: 'done'
            };
          }
          return item;
        }));
      } catch (err) {
        console.error('Compression error for file:', placeholder.originalName, err);
        setItems((prev) => prev.map((item) => {
          if (item.id === placeholder.id) {
            return {
              ...item,
              status: 'error',
              error: err.message
            };
          }
          return item;
        }));
      }

      // Yield frame for 60 FPS smooth rendering
      await new Promise((r) => requestAnimationFrame(r));
    }

    setIsProcessing(false);

    if (limitWarning) {
      showToast(`Only ${validImageFiles.length} image(s) added. Maximum limit is 10 images.`);
    } else {
      showToast(`${validImageFiles.length} image${validImageFiles.length > 1 ? 's' : ''} compressed in-browser!`);
    }
  }, [items.length, quality, resizeScale, outputFormat, trackAction]);

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        handleFilesAdded(e.clipboardData.files);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFilesAdded]);

  // Download Single File
  const handleDownloadSingle = (item) => {
    if (!item.compressedBlob) return;
    setLocalDownloadDelta((prev) => prev + 1);
    const a = document.createElement('a');
    a.href = item.compressedUrl;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    trackAction('download', { 
      format: item.targetExt, 
      originalSize: item.originalSize, 
      compressedSize: item.compressedSize 
    });
  };

  // Download All as ZIP
  const handleDownloadZip = async () => {
    const validItems = items.filter((i) => i.status === 'done' && i.compressedBlob);
    if (validItems.length === 0) return;

    try {
      showToast('Generating ZIP package in-browser...');
      const zip = new JSZip();

      validItems.forEach((item) => {
        zip.file(item.filename, item.compressedBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `cerilas-compressed-images-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setLocalDownloadDelta((prev) => prev + 1);
      trackAction('download_zip', { count: validItems.length, totalSize: zipBlob.size });
      showToast('ZIP archive downloaded successfully!');
    } catch (err) {
      console.error('ZIP generation failed:', err);
      showToast('Failed to create ZIP package.');
    }
  };

  // Remove Item
  const handleRemoveItem = (id) => {
    setItems((prev) => {
      const remaining = prev.filter((i) => i.id !== id);
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
        if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      }
      return remaining;
    });
  };

  // Clear All
  const handleClearAll = () => {
    items.forEach((target) => {
      if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
      if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
    });
    setItems([]);
  };

  // Compute Queue Totals
  const totalOriginalBytes = items.reduce((acc, item) => acc + (item.originalSize || 0), 0);
  const totalCompressedBytes = items.reduce((acc, item) => acc + (item.compressedSize || item.originalSize || 0), 0);
  const overallSavingsPercent = totalOriginalBytes > 0 
    ? Math.round(((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100) 
    : 0;

  // Split Slider drag handlers
  const handleSplitMouseMove = (e) => {
    if (!isDraggingSplitRef.current || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSplitPos(percent);
  };

  const handleSplitTouchMove = (e) => {
    if (!isDraggingSplitRef.current || !splitContainerRef.current || !e.touches[0]) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSplitPos(percent);
  };

  return (
    <div className="c-tool-page-container img-tool-container">
      {/* Standardized Tool Header */}
      <ToolHeader
        title="Free Image Compressor & WebP Converter"
        subtitle="Lossless & high-efficiency in-browser compression for JPG, PNG, WebP, AVIF, and SVG with zero server uploads."
        onBack={onBack}
        backLabel="All Tools"
        badges={
          <>
            <Badge variant="success" icon={<Lock size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} {t('catalog.uniqueVisitors')}
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="neutral" icon={<Download size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel(language || 'en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Global Control Bar */}
      <div className="img-settings-panel">
        {/* Format Selector */}
        <div className="img-setting-group">
          <div className="img-setting-label">
            <span>Output Format</span>
            <span className="img-setting-value">
              {outputFormat === 'auto' ? 'Auto' : outputFormat.replace('image/', '').toUpperCase()}
            </span>
          </div>
          <Select 
            options={FORMAT_OPTIONS}
            value={outputFormat}
            onChange={(val) => {
              setOutputFormat(val);
              triggerRecompressAll(quality, val, resizeScale);
            }}
          />
        </div>

        {/* Quality Slider */}
        <div className="img-setting-group">
          <div className="img-setting-label">
            <span>Compression Quality</span>
            <span className="img-setting-value">{quality}%</span>
          </div>
          <input 
            type="range" 
            min="15" 
            max="100" 
            value={quality} 
            className="img-slider"
            onChange={(e) => {
              const val = Number(e.target.value);
              setQuality(val);
              triggerRecompressAll(val, outputFormat, resizeScale);
            }}
          />
          <div className="img-preset-pills">
            <button 
              type="button" 
              className={`img-preset-btn ${quality === 85 ? 'active' : ''}`}
              onClick={() => {
                setQuality(85);
                triggerRecompressAll(85, outputFormat, resizeScale);
              }}
            >
              High (85%)
            </button>
            <button 
              type="button" 
              className={`img-preset-btn ${quality === 75 ? 'active' : ''}`}
              onClick={() => {
                setQuality(75);
                triggerRecompressAll(75, outputFormat, resizeScale);
              }}
            >
              Balanced (75%)
            </button>
            <button 
              type="button" 
              className={`img-preset-btn ${quality === 50 ? 'active' : ''}`}
              onClick={() => {
                setQuality(50);
                triggerRecompressAll(50, outputFormat, resizeScale);
              }}
            >
              Max Savings (50%)
            </button>
          </div>
        </div>

        {/* Image Scaling (% Resize) Setting */}
        <div className="img-setting-group">
          <div className="img-setting-label">
            <span>Image Scaling (% Resize)</span>
            <span className="img-setting-value">
              {resizeScale === '100' ? '100% (Original)' : resizeScale.startsWith('max-') ? resizeScale.replace('max-', 'Max ') + 'px' : `${resizeScale}%`}
            </span>
          </div>
          <Select 
            options={RESIZE_OPTIONS}
            value={resizeScale}
            onChange={(val) => {
              setResizeScale(val);
              triggerRecompressAll(quality, outputFormat, val);
            }}
          />
        </div>
      </div>

      {/* Progress banner if processing */}
      {isProcessing && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '14px',
          color: '#3b82f6',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          <div className="img-spinner" />
          Processing images in background thread...
        </div>
      )}

      {/* Drag and Drop Upload Area */}
      <div 
        className={`img-dropzone ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
          className="img-hidden-input"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesAdded(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <div className="img-dropzone-icon">
          <UploadCloud size={30} />
        </div>

        <div>
          <h3 className="img-dropzone-title">
            {isDragActive ? 'Drop images here to compress...' : 'Click or Drag & Drop Images Here'}
          </h3>
          <p className="img-dropzone-sub">
            Batch compression supported (up to 10 images). 100% processed on your device with 0 bytes sent to any server. Paste (Cmd+V / Ctrl+V) also works.
          </p>
        </div>

        <div className="img-format-pills">
          <span className="img-format-tag">JPG / JPEG</span>
          <span className="img-format-tag">PNG</span>
          <span className="img-format-tag">WebP</span>
          <span className="img-format-tag">AVIF</span>
          <span className="img-format-tag">SVG</span>
          <span className="img-format-tag">GIF</span>
        </div>
      </div>

      {/* Queue Summary Banner & Actions */}
      {items.length > 0 && (
        <div className="img-queue-summary">
          <div className="img-queue-stats">
            <div className="img-queue-stat-item">
              <span className="img-queue-stat-label">Total Images</span>
              <span className="img-queue-stat-val">{items.length}</span>
            </div>
            <div className="img-queue-stat-item">
              <span className="img-queue-stat-label">Original Size</span>
              <span className="img-queue-stat-val">{formatBytes(totalOriginalBytes)}</span>
            </div>
            <div className="img-queue-stat-item">
              <span className="img-queue-stat-label">Compressed Size</span>
              <span className="img-queue-stat-val">{formatBytes(totalCompressedBytes)}</span>
            </div>
            <div className="img-queue-stat-item">
              <span className="img-queue-stat-label">Total Saved</span>
              <span className="img-queue-stat-val savings">
                {overallSavingsPercent > 0 ? `-${overallSavingsPercent}%` : '0%'}
              </span>
            </div>
          </div>

          <div className="img-queue-actions">
            <button 
              className="img-btn-zip"
              onClick={handleDownloadZip}
              disabled={isProcessing}
            >
              <Archive size={17} /> Download All (ZIP)
            </button>
            <button 
              className="img-btn-clear"
              onClick={handleClearAll}
            >
              Clear Queue
            </button>
          </div>
        </div>
      )}

      {/* Queue Cards Grid */}
      {items.length > 0 && (
        <div className="img-queue-grid">
          {items.map((item) => (
            <div key={item.id} className="img-card">
              <div className="img-card-top">
                <img 
                  src={item.compressedUrl || item.originalUrl} 
                  alt={item.originalName} 
                  className="img-card-thumb"
                />
                <div className="img-card-info">
                  <h4 className="img-card-name" title={item.originalName}>{item.originalName}</h4>
                  <div className="img-card-dims">
                    {item.originalWidth ? `${item.originalWidth}×${item.originalHeight}px` : 'Calculating...'}
                    {item.compressedWidth && item.compressedWidth !== item.originalWidth && (
                      <span> → {item.compressedWidth}×{item.compressedHeight}px</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="img-card-metrics">
                {item.status === 'compressing' || item.isRecompressing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 600 }}>
                    <div className="img-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span style={{ fontSize: '0.82rem' }}>Compressing...</span>
                  </div>
                ) : item.status === 'error' ? (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 500 }}>
                    Failed to compress
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className="img-metric-before" title="Original File Size">{formatBytes(item.originalSize)}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                      <span className="img-metric-after" title="Compressed Size">{formatBytes(item.compressedSize)}</span>
                    </div>
                    <span className="img-metric-badge">
                      {item.savingsPercent > 0 ? `-${item.savingsPercent}%` : 'Optimal'}
                    </span>
                  </>
                )}
              </div>

              <div className="img-card-actions">
                <button 
                  className="img-btn-download"
                  onClick={() => handleDownloadSingle(item)}
                  disabled={item.status === 'compressing' || item.isRecompressing || !item.compressedBlob}
                >
                  <Download size={15} /> Download
                </button>
                <button 
                  className="img-btn-compare"
                  onClick={() => {
                    setComparingItem(item);
                    setSplitPos(50);
                  }}
                  disabled={item.status === 'compressing' || item.isRecompressing || !item.compressedBlob}
                  title="Compare visual quality Before vs After"
                >
                  <Eye size={15} /> Compare
                </button>
                <button 
                  className="img-btn-remove"
                  onClick={() => handleRemoveItem(item.id)}
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mid-Content Google AdSense Slot */}
      <AdSlot format="leaderboard" slotId="ad-img-mid-leaderboard" />

      {/* Interactive Before/After Split Comparison Modal */}
      {comparingItem && (
        <div 
          className="img-modal-backdrop"
          onClick={() => setComparingItem(null)}
        >
          <div 
            className="img-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="img-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Eye size={20} color="#3b82f6" />
                <h3 className="img-modal-title">
                  Visual Fidelity: Before ({formatBytes(comparingItem.originalSize)}) vs After ({formatBytes(comparingItem.compressedSize)})
                </h3>
              </div>
              <button 
                className="img-btn-remove"
                onClick={() => setComparingItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Draggable Split Viewer */}
            <div 
              ref={splitContainerRef}
              className="img-split-viewer"
              onMouseDown={() => (isDraggingSplitRef.current = true)}
              onMouseUp={() => (isDraggingSplitRef.current = false)}
              onMouseMove={handleSplitMouseMove}
              onTouchStart={() => (isDraggingSplitRef.current = true)}
              onTouchEnd={() => (isDraggingSplitRef.current = false)}
              onTouchMove={handleSplitTouchMove}
            >
              {/* Left Background: Original */}
              <img 
                src={comparingItem.originalUrl} 
                alt="Original uncompressed"
                className="img-split-image" 
              />
              <span className="img-split-label left">Original ({formatBytes(comparingItem.originalSize)})</span>

              {/* Right Overlay: Compressed (Clipped via splitPos) */}
              <div 
                className="img-split-after"
                style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
              >
                <img 
                  src={comparingItem.compressedUrl} 
                  alt="Compressed result" 
                  className="img-split-image"
                />
                <span className="img-split-label right">Compressed (-{comparingItem.savingsPercent}%)</span>
              </div>

              {/* Divider Line & Handle */}
              <div 
                className="img-split-slider-line"
                style={{ left: `${splitPos}%` }}
              >
                <div className="img-split-handle">
                  ◀▶
                </div>
              </div>
            </div>

            <div className="img-modal-footer">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                <Eye size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Drag the slider to inspect visual fidelity.
              </span>
              <button 
                className="img-btn-zip"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '10px' }}
                onClick={() => handleDownloadSingle(comparingItem)}
              >
                <Download size={15} /> Download Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="img-toast">
          ✓ {toastMessage}
        </div>
      )}

      {/* 2026 Google #1 Long-Tail SEO Technical Guide & FAQ (Partitioned below the fold) */}
      <ToolSeoDivider label="Image Compression Algorithms, Formats & FAQs" />
      <ImageCompressorSeo 
        onApplyPreset={({ format, quality: q, resizeScale: r, name }) => {
          if (format) setOutputFormat(format);
          if (q !== undefined) setQuality(q);
          if (r !== undefined) setResizeScale(r);
          triggerRecompressAll(q ?? quality, format ?? outputFormat, r ?? resizeScale);
          const workspace = document.querySelector('.img-settings-panel') || document.querySelector('.img-tool-header');
          if (workspace) {
            workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          showToast(name ? `Applied "${name}" preset! Ready to compress.` : 'Preset applied! Ready to compress.');
        }}
      />

      {/* Bottom Billboard AdSlot */}
      <AdSlot format="billboard" slotId="ad-img-bottom-billboard" />
    </div>
  );
}
