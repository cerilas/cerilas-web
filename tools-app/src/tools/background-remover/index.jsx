import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  UploadCloud,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Image as ImageIcon,
  Layers,
  ShieldCheck,
  Trash2,
  Lock,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import { backgroundRemoverManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import { Button, Badge, Card, ToolHeader, AdSlot, QuotaModal } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import BackgroundRemoverSeo from './components/BackgroundRemoverSeo';
import './background-remover.css';

// Curated Background Swatches
const COLOR_PRESETS = [
  { label: 'Transparent', value: 'transparent', icon: true },
  { label: 'Amazon White', value: '#ffffff' },
  { label: 'Studio Dark', value: '#111111' },
  { label: 'Soft Gray', value: '#f3f4f6' },
  { label: 'Warm Sand', value: '#fef3c7' },
  { label: 'Sky Blue', value: '#e0f2fe' },
  { label: 'Rose Pink', value: '#ffe4e6' },
  { label: 'Mint Green', value: '#dcfce7' }
];

const GRADIENT_PRESETS = [
  { label: 'Apple Sunset', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { label: 'Cyber Violet', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Studio Noir', value: 'radial-gradient(circle, #333333 0%, #0a0a0a 100%)' },
  { label: 'Clean Quartz', value: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' }
];

// Sample demo image generator for instant testing
function createSampleImage(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // Background scene (to be removed)
  const grad = ctx.createLinearGradient(0, 0, 600, 600);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(1, '#ec4899');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 600);

  // Add decorative background elements
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(100, 100, 60, 0, Math.PI * 2);
  ctx.arc(500, 480, 90, 0, Math.PI * 2);
  ctx.fill();

  // Foreground Subject (to be kept)
  if (type === 'sneaker') {
    ctx.save();
    ctx.translate(140, 220);
    // Draw sneaker body
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(30, 120);
    ctx.lineTo(260, 120);
    ctx.quadraticCurveTo(310, 120, 310, 80);
    ctx.quadraticCurveTo(270, 40, 220, 50);
    ctx.lineTo(160, 10);
    ctx.quadraticCurveTo(120, 0, 90, 30);
    ctx.lineTo(30, 90);
    ctx.closePath();
    ctx.fill();

    // White sole
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 120, 300, 35);
    ctx.restore();
  } else {
    // Portrait Silhouette / Icon Avatar
    ctx.save();
    ctx.translate(300, 300);
    // Head
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -50, 75, 0, Math.PI * 2);
    ctx.fill();
    // Shoulders
    ctx.beginPath();
    ctx.arc(0, 140, 140, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

export default function BackgroundRemover({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction, trackUse, trackDownload, trackCopy } = useToolAnalytics(
    backgroundRemoverManifest.slug,
    toolMeta
  );

  const [imageFile, setImageFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [cutoutBlob, setCutoutBlob] = useState(null);
  const [cutoutUrl, setCutoutUrl] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const [bgMode, setBgMode] = useState('transparent'); // 'transparent', 'color', 'gradient', 'custom'
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].value);
  const [customBgUrl, setCustomBgUrl] = useState(null);

  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(null);
  const [processError, setProcessError] = useState(null);
  const [quota, setQuota] = useState({ allowed: true, limit: 3, remaining: 3, resetInMinutes: 0 });
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const customBgInputRef = useRef(null);
  const stageRef = useRef(null);

  // Fetch initial hourly quota
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const vid = getOrCreateVisitorId();
        const res = await fetch(`/api/tools/${backgroundRemoverManifest.slug}/ai-quota?visitorId=${encodeURIComponent(vid)}`);
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

  // Process image with @imgly/background-removal
  const processImage = async (source) => {
    if (quota.remaining <= 0) {
      setQuotaModalOpen(true);
      return;
    }

    try {
      setProcessError(null);
      setIsProcessing(true);
      setProgressPercent(5);
      setProgressStatus('Checking rate limit...');

      // Consume quota on backend
      const vid = getOrCreateVisitorId();
      const consumeRes = await fetch(`/api/tools/${backgroundRemoverManifest.slug}/consume-ai-quota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: vid })
      });

      const consumeData = await consumeRes.json();
      if (!consumeRes.ok || !consumeData.quota?.allowed) {
        if (consumeData.quota) setQuota(consumeData.quota);
        setQuotaModalOpen(true);
        setIsProcessing(false);
        return;
      }

      if (consumeData.quota) {
        setQuota(consumeData.quota);
      }

      setProgressPercent(15);
      setProgressStatus('Initializing neural AI model...');

      const blob = await removeBackground(source, {
        progress: (key, current, total) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            setProgressPercent(pct);
            if (key.includes('fetch')) {
              setProgressStatus(`Downloading model weights (${pct}%)...`);
            } else {
              setProgressStatus(`Segmenting foreground subjects (${pct}%)...`);
            }
          }
        }
      });

      const url = URL.createObjectURL(blob);
      setCutoutBlob(blob);
      setCutoutUrl(url);
      trackAction('process_complete');
    } catch (err) {
      console.error('Background removal error:', err);
      setProcessError(err.message || 'Failed to remove background from this image.');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
      setProgressPercent(0);
    }
  };

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (quota.remaining <= 0) {
      setQuotaModalOpen(true);
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setCutoutBlob(null);
    setCutoutUrl(null);
    processImage(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (quota.remaining <= 0) {
      setQuotaModalOpen(true);
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSampleClick = async (type) => {
    if (quota.remaining <= 0) {
      setQuotaModalOpen(true);
      return;
    }
    const dataUrl = createSampleImage(type);
    setOriginalUrl(dataUrl);
    setImageFile({ name: `${type}-sample.png` });
    setCutoutBlob(null);
    setCutoutUrl(null);
    processImage(dataUrl);
  };

  const handleCustomBgSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setCustomBgUrl(url);
      setBgMode('custom');
    }
  };

  // Render composite image on a hidden canvas for export
  const renderCompositeCanvas = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!cutoutUrl) return reject('No cutout available');

      const cutoutImg = new Image();
      cutoutImg.crossOrigin = 'anonymous';
      cutoutImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cutoutImg.naturalWidth || cutoutImg.width;
        canvas.height = cutoutImg.naturalHeight || cutoutImg.height;
        const ctx = canvas.getContext('2d');

        // Apply background
        if (bgMode === 'color') {
          ctx.fillStyle = selectedColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (bgMode === 'gradient') {
          // Parse simple linear gradient or fill dark
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (bgMode === 'custom' && customBgUrl) {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(cutoutImg, 0, 0);
            resolve(canvas);
          };
          bgImg.src = customBgUrl;
          return;
        }

        // Draw foreground cutout
        ctx.drawImage(cutoutImg, 0, 0);
        resolve(canvas);
      };
      cutoutImg.onerror = reject;
      cutoutImg.src = cutoutUrl;
    });
  }, [cutoutUrl, bgMode, selectedColor, customBgUrl]);

  const handleDownload = async (format = 'image/png') => {
    try {
      if (bgMode === 'transparent' && format === 'image/png' && cutoutBlob) {
        const a = document.createElement('a');
        a.href = cutoutUrl;
        a.download = `cutout-${imageFile?.name?.replace(/\.[^/.]+$/, '') || 'image'}.png`;
        a.click();
        trackDownload?.();
        return;
      }

      const canvas = await renderCompositeCanvas();
      canvas.toBlob((blob) => {
        if (!blob) return;
        const ext = format === 'image/webp' ? 'webp' : 'png';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `cutout-${imageFile?.name?.replace(/\.[^/.]+$/, '') || 'image'}.${ext}`;
        a.click();
        trackDownload?.();
      }, format, 0.95);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const canvas = await renderCompositeCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        trackCopy?.();
        setTimeout(() => setCopied(false), 2200);
      }, 'image/png');
    } catch (err) {
      console.error('Clipboard copy error:', err);
      setCopyError('Direct clipboard copy is restricted in this browser. Please use Download PNG.');
      setTimeout(() => setCopyError(null), 3500);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setOriginalUrl(null);
    setCutoutBlob(null);
    setCutoutUrl(null);
    setCustomBgUrl(null);
    setBgMode('transparent');
  };

  // Dragging split slider logic
  const handleStageMouseMove = (e) => {
    if (!isDraggingSplit || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPos((x / rect.width) * 100);
  };

  const handleStageTouchMove = (e) => {
    if (!isDraggingSplit || !stageRef.current) return;
    const touch = e.touches[0];
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setSplitPos((x / rect.width) * 100);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSplit(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div className="c-tool-page-container bg-remover-root">
      {/* Tool Header */}
      <ToolHeader
        title={backgroundRemoverManifest.title}
        subtitle={backgroundRemoverManifest.shortDescription}
        onBack={onBack}
        badges={
          <>
            <Badge variant="neutral" icon={<Sparkles size={12} strokeWidth={2} />}>
              AI Powered
            </Badge>
            <div
              onClick={() => setQuotaModalOpen(true)}
              style={{ cursor: 'pointer' }}
              title="Click to view hourly quota details"
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

      {/* Quota Modal Component */}
      <QuotaModal
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        limit={quota.limit}
        resetInMinutes={quota.resetInMinutes}
        toolName="Background Remover"
      />

      {/* Inline Process / Copy Error Banners */}
      {processError && (
        <div className="bg-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={16} />
            <span>{processError}</span>
          </div>
          <button
            type="button"
            className="bg-error-close"
            onClick={() => setProcessError(null)}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {copyError && (
        <div className="bg-error-banner" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)', color: '#d97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={16} />
            <span>{copyError}</span>
          </div>
          <button
            type="button"
            className="bg-error-close"
            style={{ color: '#d97706' }}
            onClick={() => setCopyError(null)}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload Zone / Workspace */}
      {!originalUrl ? (
        <div
          className={`bg-dropzone ${quota.remaining === 0 ? 'bg-dropzone-disabled' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={quota.remaining === 0 ? (e) => { e.preventDefault(); setQuotaModalOpen(true); } : handleDrop}
          onClick={quota.remaining === 0 ? () => setQuotaModalOpen(true) : () => fileInputRef.current?.click()}
        >
          {quota.remaining > 0 && (
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/png, image/jpeg, image/webp, image/avif"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
          )}

          {quota.remaining === 0 ? (
            <div className="bg-dropzone-limit-wrap">
              <div className="bg-dropzone-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <Lock size={28} strokeWidth={1.75} />
              </div>
              <h3 className="bg-dropzone-title">Hourly Free Limit Reached</h3>
              <p className="bg-dropzone-desc" style={{ maxWidth: 460 }}>
                You have used all <strong>{quota.limit} AI background removal scans</strong> for this hour.
                To ensure fair system resources, your free quota automatically resets in{' '}
                <strong>{quota.resetInMinutes} minute{quota.resetInMinutes === 1 ? '' : 's'}</strong>.
              </p>
              <div style={{ marginTop: 8 }}>
                <Badge variant="warning" icon={<Clock size={12} strokeWidth={2} />}>
                  Resets in ~{quota.resetInMinutes}m
                </Badge>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-dropzone-icon">
                <UploadCloud size={30} strokeWidth={1.5} />
              </div>
              <h3 className="bg-dropzone-title">Click or Drag & Drop Photo Here</h3>
              <p className="bg-dropzone-desc">
                Supports JPG, PNG, WebP, and AVIF portraits, product shots, pets, and objects. 
                Runs locally on your device with <strong>zero server uploads</strong>.
              </p>

              <div className="bg-samples-container" onClick={(e) => e.stopPropagation()}>
                <span className="bg-sample-label">Or try a sample:</span>
                <button
                  type="button"
                  className="bg-sample-btn"
                  onClick={() => handleSampleClick('portrait')}
                >
                  <Sparkles size={13} /> Portrait Avatar
                </button>
                <button
                  type="button"
                  className="bg-sample-btn"
                  onClick={() => handleSampleClick('sneaker')}
                >
                  <ImageIcon size={13} /> Product Sneaker
                </button>
              </div>
            </>
          )}
        </div>
      ) : isProcessing ? (
        /* Progress Indicator */
        <div className="bg-processing-card">
          <div className="bg-spinner" />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-main)' }}>
            {progressStatus || 'Analyzing image contours...'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            WebAssembly neural network is segmenting the subject locally in your browser.
          </p>
          <div className="bg-progress-bar-container">
            <div className="bg-progress-bar-fill" style={{ width: `${progressPercent || 30}%` }} />
          </div>
        </div>
      ) : (
        /* Main Interactive Workspace */
        <div className="bg-workspace-grid">
          {/* Stage / Split Viewer */}
          <div className="bg-canvas-card">
            <div
              ref={stageRef}
              className={`bg-preview-stage ${bgMode === 'transparent' ? 'bg-checkerboard' : ''}`}
              style={{
                backgroundColor: bgMode === 'color' ? selectedColor : undefined,
                backgroundImage:
                  bgMode === 'gradient'
                    ? selectedGradient
                    : bgMode === 'custom' && customBgUrl
                    ? `url(${customBgUrl})`
                    : undefined,
                backgroundSize: bgMode === 'custom' ? 'cover' : undefined,
                backgroundPosition: 'center'
              }}
              onMouseDown={() => setIsDraggingSplit(true)}
              onTouchStart={() => setIsDraggingSplit(true)}
              onMouseMove={handleStageMouseMove}
              onTouchMove={handleStageTouchMove}
            >
              {/* Split Mode Viewer */}
              <div className="bg-split-slider-container">
                {/* Base Layer: Cutout (Transparent or with selected background) */}
                <img
                  src={cutoutUrl}
                  alt="Cutout Preview"
                  className="bg-split-img"
                />

                {/* Left Clipped Layer: Original Image (1:1 alignment) */}
                <div
                  className="bg-split-overlay"
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                >
                  <img
                    src={originalUrl}
                    alt="Original Reference"
                    className="bg-split-img"
                  />
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="bg-split-divider"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="bg-split-handle">
                    <Sliders size={15} />
                  </div>
                </div>
              </div>
            </div>

            {/* Split Comparison Labels */}
            <div className="bg-split-labels">
              <span>Original Image</span>
              <span>Drag slider to compare</span>
              <span>AI Cutout Result</span>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-controls-panel">
            {/* Background Selector */}
            <Card size="sm" title="Backdrop Customizer">
              <div className="bg-option-section">
                <span className="bg-option-label">Solid Color Presets</span>
                <div className="bg-preset-grid">
                  {COLOR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`bg-color-swatch ${bgMode === (p.value === 'transparent' ? 'transparent' : 'color') && (p.value === 'transparent' || selectedColor === p.value) ? 'active' : ''} ${p.icon ? 'bg-checkerboard' : ''}`}
                      style={{ backgroundColor: p.value !== 'transparent' ? p.value : undefined }}
                      onClick={() => {
                        if (p.value === 'transparent') {
                          setBgMode('transparent');
                        } else {
                          setBgMode('color');
                          setSelectedColor(p.value);
                        }
                      }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-option-section" style={{ marginTop: '0.85rem' }}>
                <span className="bg-option-label">Studio Gradients</span>
                <div className="bg-preset-grid">
                  {GRADIENT_PRESETS.map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`bg-color-swatch ${bgMode === 'gradient' && selectedGradient === g.value ? 'active' : ''}`}
                      style={{ backgroundImage: g.value }}
                      onClick={() => {
                        setBgMode('gradient');
                        setSelectedGradient(g.value);
                      }}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-option-section" style={{ marginTop: '0.85rem' }}>
                <span className="bg-option-label">Custom Background Image</span>
                <input
                  type="file"
                  ref={customBgInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleCustomBgSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => customBgInputRef.current?.click()}
                  icon={<ImageIcon size={14} />}
                >
                  {customBgUrl ? 'Replace Custom Image' : 'Upload Scene Image'}
                </Button>
              </div>
            </Card>

            {/* Export Actions */}
            <Card size="sm" title="Export & Share">
              <div className="bg-actions-group">
                <Button
                  variant="primary"
                  onClick={() => handleDownload('image/png')}
                  icon={<Download size={16} />}
                >
                  Download HD PNG (Lossless)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDownload('image/webp')}
                  icon={<Download size={16} />}
                >
                  Download WebP (Optimized)
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyClipboard}
                  icon={copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                >
                  {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  icon={<RotateCcw size={14} />}
                >
                  Upload Another Image
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SEO & FAQ Educational Section (Partitioned below the fold) */}
      <ToolSeoDivider label="AI Model Architecture, Performance & FAQs" />
      <BackgroundRemoverSeo />

      {/* Billboard Ad */}
      <AdSlot format="billboard" slotId="ad-bg-remover-billboard" />
    </div>
  );
}
