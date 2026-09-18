import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video,
  Upload,
  Download,
  Lock,
  Eye,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  RotateCcw,
  Film,
  Scissors,
  X,
  Play,
  ArrowRight
} from 'lucide-react';
import ToolHeader from '../../components/ui/ToolHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import VideoCompressorSeo from './components/VideoCompressorSeo';
import { videoCompressorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import {
  formatBytes,
  formatDuration,
  compressVideo,
  generateSampleVideoBlob
} from './videoEngine';
import './video-compressor.css';

export default function VideoCompressor({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    videoCompressorManifest.slug,
    toolMeta || videoCompressorManifest
  );

  // Video State
  const [videoFile, setVideoFile] = useState(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState(null);
  const [fileMeta, setFileMeta] = useState(null); // { name, size, duration, width, height }
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Settings & Presets
  const [preset, setPreset] = useState('balanced'); // 'chat' | 'balanced' | 'high' | 'custom'
  const [muteAudio, setMuteAudio] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // Custom Settings
  const [customResolution, setCustomResolution] = useState('720p');
  const [customBitrateMbps, setCustomBitrateMbps] = useState(2.5);

  // Compression & Progress State
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, currentTime: 0, targetDuration: 0 });
  const [compressedResult, setCompressedResult] = useState(null);
  const [toast, setToast] = useState(null);

  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const origVideoRef = useRef(null);
  const compressedVideoRef = useRef(null);

  // Show Toast
  const showToast = useCallback((message, icon = 'check') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Process selected file
  const handleSelectFile = (file) => {
    if (!file) return;

    if (originalVideoUrl) {
      URL.revokeObjectURL(originalVideoUrl);
    }
    if (compressedResult?.url) {
      URL.revokeObjectURL(compressedResult.url);
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setOriginalVideoUrl(url);
    setCompressedResult(null);

    // Read metadata via offscreen video
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const dur = tempVideo.duration || 10;
      setFileMeta({
        name: file.name || 'video.mp4',
        size: file.size,
        duration: dur,
        width: tempVideo.videoWidth || 1280,
        height: tempVideo.videoHeight || 720,
      });
      setTrimStart(0);
      setTrimEnd(dur);
    };

    showToast(`Loaded "${file.name}" for compression.`, 'check');
    trackAction('video_loaded', { name: file.name, size: file.size });
  };

  // Generate and load instant 1-click sample video
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const sampleBlob = await generateSampleVideoBlob();
      sampleBlob.name = 'sample-clip.mp4';
      handleSelectFile(sampleBlob);
      showToast('Loaded 1-click animated demonstration clip!', 'sparkles');
    } catch (err) {
      console.error('Failed to generate sample video:', err);
      showToast('Could not create sample video in browser.', 'x');
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Run Compression
  const handleStartCompression = async () => {
    if (!videoFile) return;

    setIsCompressing(true);
    setProgress({ percent: 0, currentTime: 0, targetDuration: 0 });
    setCompressedResult(null);

    abortControllerRef.current = new AbortController();

    // Map preset to options
    let targetResolution = '720p';
    let bitrate = 2500000; // 2.5 Mbps
    let fps = 30;

    switch (preset) {
      case 'chat':
        targetResolution = '480p';
        bitrate = 1200000; // 1.2 Mbps (~8MB per minute)
        break;
      case 'balanced':
        targetResolution = '720p';
        bitrate = 2500000; // 2.5 Mbps (~18MB per minute)
        break;
      case 'high':
        targetResolution = '1080p';
        bitrate = 4500000; // 4.5 Mbps
        break;
      case 'custom':
        targetResolution = customResolution;
        bitrate = Math.round(customBitrateMbps * 1000000);
        break;
    }

    try {
      const result = await compressVideo({
        fileOrBlob: videoFile,
        options: {
          targetResolution,
          bitrate,
          fps,
          muteAudio,
          trimStart,
          trimEnd,
        },
        onProgress: (p) => setProgress(p),
        signal: abortControllerRef.current.signal,
      });

      setCompressedResult(result);
      setLocalCompletedDelta((prev) => prev + 1);
      trackAction('video_compressed', {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savingsPercent: result.savingsPercent,
      });
      showToast(`Compression finished! Reduced size by ${result.savingsPercent}%.`, 'check');
    } catch (err) {
      if (err.message !== 'Compression cancelled by user.') {
        console.error('Compression failed:', err);
        showToast(`Compression error: ${err.message}`, 'x');
      } else {
        showToast('Compression cancelled.', 'x');
      }
    } finally {
      setIsCompressing(false);
    }
  };

  // Cancel ongoing compression
  const handleCancelCompression = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Download Compressed Video
  const handleDownload = () => {
    if (!compressedResult?.url) return;

    const baseName = (fileMeta?.name || 'video').replace(/\.[^/.]+$/, '');
    const outFilename = `${baseName}-compressed.${compressedResult.extension || 'mp4'}`;

    const a = document.createElement('a');
    a.href = compressedResult.url;
    a.download = outFilename;
    a.rel = 'noopener';
    a.style.position = 'fixed';
    a.style.left = '-9999px';
    a.style.top = '-9999px';
    a.style.opacity = '0';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
    }, 1000);

    trackAction('download', {
      filename: outFilename,
      size: compressedResult.compressedSize,
    });
    showToast(`Downloading "${outFilename}"!`, 'check');
  };

  // Reset document
  const handleReset = () => {
    if (originalVideoUrl) URL.revokeObjectURL(originalVideoUrl);
    if (compressedResult?.url) URL.revokeObjectURL(compressedResult.url);
    setVideoFile(null);
    setOriginalVideoUrl(null);
    setFileMeta(null);
    setCompressedResult(null);
  };

  return (
    <div className="c-tool-page-container vc-container">
      {/* Universal Standard Tool Header */}
      <ToolHeader
        title="Video Compressor"
        subtitle="Compress MP4, WebM, and MOV videos locally in your browser memory with zero server uploads and total confidentiality."
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
              <Badge variant="neutral" icon={<CheckCircle2 size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel('en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div role="status" aria-live="polite" className="pom-toast-banner" style={{ marginBottom: '1.25rem' }}>
          {toast.icon === 'check' && <CheckCircle2 size={16} className="pom-toast-icon icon-emerald" />}
          {toast.icon === 'x' && <X size={16} className="pom-toast-icon icon-rose" />}
          {toast.icon === 'sparkles' && <Sparkles size={16} className="pom-toast-icon icon-blue" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Workspace or Dropzone */}
      {!videoFile ? (
        <div
          className="vc-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('is-dragover');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('is-dragover');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('is-dragover');
            const file = e.dataTransfer.files?.[0];
            if (file) handleSelectFile(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
            onChange={(e) => handleSelectFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />

          <div className="vc-dropzone-icon">
            <Upload size={32} strokeWidth={1.75} />
          </div>

          <h3 className="vc-dropzone-title">Drop your video here, or browse</h3>
          <p className="vc-dropzone-sub">
            Supports MP4, MOV, WebM, and MKV. Processing executes entirely inside your browser memory using hardware-accelerated MediaRecorder. Zero video bytes are sent to any remote server.
          </p>

          <Button
            variant="primary"
            size="lg"
            icon={<Video size={18} />}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Select Video File
          </Button>

          <button
            type="button"
            className="vc-sample-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleLoadSample();
            }}
            disabled={isLoadingSample}
          >
            {isLoadingSample ? 'Generating animation test clip...' : 'Or load a 1-click animated demonstration clip to test immediately'}
          </button>
        </div>
      ) : (
        <div className="vc-workspace">
          {/* Top File Meta & Reset */}
          <div className="vc-top-meta">
            <div className="vc-file-info">
              <div className="vc-file-icon">
                <Film size={22} />
              </div>
              <div>
                <div className="vc-file-name">{fileMeta?.name || 'Selected Video'}</div>
                <div className="vc-file-specs">
                  {fileMeta ? (
                    <>
                      {formatBytes(fileMeta.size)} • {fileMeta.width}x{fileMeta.height} • {formatDuration(fileMeta.duration)}
                    </>
                  ) : 'Reading video metadata...'}
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleReset}
              disabled={isCompressing}
            >
              Change Video
            </Button>
          </div>

          {/* Dual Player Preview */}
          <div className="vc-players-grid">
            {/* Original Player */}
            <div className="vc-player-card">
              <div className="vc-player-header">
                <span className="vc-player-tag">
                  <Play size={13} /> Original Video
                </span>
                <span className="vc-player-size">
                  {fileMeta ? formatBytes(fileMeta.size) : '--'}
                </span>
              </div>
              <video
                ref={origVideoRef}
                src={originalVideoUrl}
                controls
                playsInline
                className="vc-video-element"
              />
            </div>

            {/* Compressed Player or Placeholder */}
            <div className="vc-player-card">
              <div className="vc-player-header">
                <span className="vc-player-tag">
                  <Sparkles size={13} className="icon-emerald" /> Compressed Output
                </span>
                <span className="vc-player-size compressed">
                  {compressedResult ? formatBytes(compressedResult.compressedSize) : 'Pending'}
                </span>
              </div>
              {compressedResult ? (
                <video
                  ref={compressedVideoRef}
                  src={compressedResult.url}
                  controls
                  playsInline
                  className="vc-video-element"
                />
              ) : (
                <div className="vc-compressed-empty">
                  <Video size={36} strokeWidth={1.5} />
                  <p>
                    {isCompressing
                      ? 'Transcoding video frames in browser memory...'
                      : 'Choose your compression preset below and click "Compress Video"'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Savings Banner when completed */}
          {compressedResult && (
            <div className="vc-savings-banner">
              <div className="vc-savings-text">
                Reduced from <strong>{formatBytes(compressedResult.originalSize)}</strong> to{' '}
                <strong style={{ color: '#10b981' }}>{formatBytes(compressedResult.compressedSize)}</strong>
              </div>
              <div className="vc-savings-badge">
                -{compressedResult.savingsPercent}% Size Reduction
              </div>
            </div>
          )}

          {/* Presets Grid */}
          <div>
            <div className="vc-section-title">Compression Profile</div>
            <div className="vc-presets-grid">
              <button
                type="button"
                className={`vc-preset-btn ${preset === 'chat' ? 'active' : ''}`}
                onClick={() => setPreset('chat')}
                disabled={isCompressing}
              >
                <div className="vc-preset-header">
                  <span className="vc-preset-name">Chat & Email</span>
                  <span className="vc-preset-tag">&lt; 25MB</span>
                </div>
                <div className="vc-preset-desc">
                  480p • 1.2 Mbps (Discord, WhatsApp)
                </div>
              </button>

              <button
                type="button"
                className={`vc-preset-btn ${preset === 'balanced' ? 'active' : ''}`}
                onClick={() => setPreset('balanced')}
                disabled={isCompressing}
              >
                <div className="vc-preset-header">
                  <span className="vc-preset-name">Balanced</span>
                  <span className="vc-preset-tag">720p HD</span>
                </div>
                <div className="vc-preset-desc">
                  720p HD • 2.5 Mbps (~70% reduction)
                </div>
              </button>

              <button
                type="button"
                className={`vc-preset-btn ${preset === 'high' ? 'active' : ''}`}
                onClick={() => setPreset('high')}
                disabled={isCompressing}
              >
                <div className="vc-preset-header">
                  <span className="vc-preset-name">High Quality</span>
                  <span className="vc-preset-tag">1080p FHD</span>
                </div>
                <div className="vc-preset-desc">
                  1080p FHD • 4.5 Mbps (Crisp text)
                </div>
              </button>

              <button
                type="button"
                className={`vc-preset-btn ${preset === 'custom' ? 'active' : ''}`}
                onClick={() => setPreset('custom')}
                disabled={isCompressing}
              >
                <div className="vc-preset-header">
                  <span className="vc-preset-name">Custom</span>
                  <span className="vc-preset-tag">Manual</span>
                </div>
                <div className="vc-preset-desc">
                  Adjust resolution & bitrate manually
                </div>
              </button>
            </div>
          </div>

          {/* Secondary Options: Audio Mute & Trimmer */}
          <div className="vc-controls-panel">
            {/* Audio Mute Toggle */}
            <div className="vc-toggle-row">
              <div className="vc-toggle-info">
                <span className="vc-toggle-title">
                  {muteAudio ? <VolumeX size={15} style={{ verticalAlign: -2 }} /> : <Volume2 size={15} style={{ verticalAlign: -2 }} />}{' '}
                  Mute Audio Track
                </span>
                <span className="vc-toggle-sub">
                  Removes sound stream completely to shave off an extra 15%–20% of the final file size.
                </span>
              </div>
              <label className="vc-switch">
                <input
                  type="checkbox"
                  checked={muteAudio}
                  onChange={(e) => setMuteAudio(e.target.checked)}
                  disabled={isCompressing}
                />
                <span className="vc-slider" />
              </label>
            </div>

            {/* Trimmer Controls */}
            {fileMeta && fileMeta.duration > 1 && (
              <div className="vc-trim-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  <Scissors size={15} />
                  <span>Trim Video Duration (Optional)</span>
                </div>
                <div className="vc-trim-ranges">
                  <div className="vc-trim-col">
                    <div className="vc-trim-label">
                      <span>Start Time:</span>
                      <strong>{formatDuration(trimStart)}</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, (trimEnd || fileMeta.duration) - 0.5)}
                      step={0.1}
                      value={trimStart}
                      onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                      disabled={isCompressing}
                      className="vc-range-input"
                    />
                  </div>
                  <div className="vc-trim-col">
                    <div className="vc-trim-label">
                      <span>End Time:</span>
                      <strong>{formatDuration(trimEnd || fileMeta.duration)}</strong>
                    </div>
                    <input
                      type="range"
                      min={trimStart + 0.5}
                      max={fileMeta.duration}
                      step={0.1}
                      value={trimEnd || fileMeta.duration}
                      onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                      disabled={isCompressing}
                      className="vc-range-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Sliders if 'custom' preset is active */}
            {preset === 'custom' && (
              <div className="vc-custom-grid">
                <div className="vc-trim-col">
                  <div className="vc-trim-label">
                    <span>Target Resolution:</span>
                    <strong>{customResolution.toUpperCase()}</strong>
                  </div>
                  <select
                    value={customResolution}
                    onChange={(e) => setCustomResolution(e.target.value)}
                    disabled={isCompressing}
                    className="c-select-field"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--card-border)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="original">Original Aspect Dimensions</option>
                    <option value="1080p">1080p Full HD (1920x1080)</option>
                    <option value="720p">720p HD (1280x720)</option>
                    <option value="480p">480p SD (854x480)</option>
                    <option value="360p">360p Compact (640x360)</option>
                  </select>
                </div>

                <div className="vc-trim-col">
                  <div className="vc-trim-label">
                    <span>Video Bitrate Target:</span>
                    <strong>{customBitrateMbps} Mbps</strong>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={10.0}
                    step={0.2}
                    value={customBitrateMbps}
                    onChange={(e) => setCustomBitrateMbps(parseFloat(e.target.value))}
                    disabled={isCompressing}
                    className="vc-range-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time Progress Bar */}
          {isCompressing && (
            <div className="vc-progress-card">
              <div className="vc-progress-header">
                <div className="vc-progress-title">
                  <Sparkles size={16} className="icon-blue" />
                  <span>Compressing Video in Browser Memory...</span>
                </div>
                <div className="vc-progress-pct">{progress.percent}%</div>
              </div>
              <div className="vc-progress-track">
                <div className="vc-progress-bar" style={{ width: `${progress.percent}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Processed: {formatDuration(progress.currentTime)} of {formatDuration(progress.targetDuration)}</span>
                <button
                  type="button"
                  onClick={handleCancelCompression}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    textDecoration: 'underline'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="vc-actions-bar">
            {compressedResult ? (
              <Button
                variant="success"
                size="md"
                icon={<Download size={16} />}
                onClick={handleDownload}
              >
                Download Compressed Video ({formatBytes(compressedResult.compressedSize)})
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={<Sparkles size={16} />}
                onClick={handleStartCompression}
                isLoading={isCompressing}
              >
                {isCompressing ? 'Compressing...' : 'Compress Video'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tool SEO Divider (Standard 5rem margin) */}
      <ToolSeoDivider title="Everything You Need to Know About In-Browser Video Compression" />

      {/* SEO Structured Content */}
      <VideoCompressorSeo />
    </div>
  );
}
