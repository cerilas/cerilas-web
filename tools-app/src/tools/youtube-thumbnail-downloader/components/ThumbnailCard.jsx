import React, { useState } from 'react';
import { Download, Copy, ExternalLink, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { downloadThumbnailImage, copyThumbnailToClipboard } from '../helpers';

export default function ThumbnailCard({ option, videoId, onDownloadSuccess }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleImageLoad = (e) => {
    // YouTube returns a 120x90 grey placeholder when maxres is not available
    if (option.id === 'maxres' && e.target.naturalWidth && e.target.naturalWidth <= 120) {
      setIsUnavailable(true);
    } else {
      setLoaded(true);
      setIsUnavailable(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadThumbnailImage(option.url, option.filename);
      if (onDownloadSuccess) onDownloadSuccess(option.id);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyThumbnailToClipboard(option.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  return (
    <div className={`ytd-thumb-card ${isUnavailable ? 'unavailable' : ''}`}>
      <div className="ytd-thumb-header">
        <div className="ytd-thumb-title-wrap">
          <span className="ytd-thumb-label">{option.label}</span>
          <span className="ytd-thumb-res-pill">{option.resolution}</span>
        </div>
        <div className="ytd-thumb-badges">
          {option.badge && (
            <Badge variant={option.badgeVariant || 'neutral'}>
              {option.badge}
            </Badge>
          )}
        </div>
      </div>

      <div className="ytd-thumb-preview-wrap">
        {!isUnavailable ? (
          <img
            src={option.url}
            alt={`${option.label} YouTube Thumbnail`}
            className={`ytd-thumb-img ${loaded ? 'loaded' : ''}`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={() => setIsUnavailable(true)}
          />
        ) : (
          <div className="ytd-thumb-fallback">
            <AlertCircle size={28} className="icon-amber" />
            <span className="ytd-fallback-title">Not Available in 4K</span>
            <p className="ytd-fallback-desc">
              The video creator did not upload a 1080p/4K thumbnail. Please use the HD (720p) resolution below.
            </p>
          </div>
        )}
      </div>

      <div className="ytd-thumb-meta">
        <p className="ytd-thumb-desc">{option.description}</p>
      </div>

      <div className="ytd-thumb-actions">
        <Button
          variant="primary"
          icon={<Download size={15} />}
          onClick={handleDownload}
          disabled={isUnavailable || isDownloading}
          className="ytd-btn-main"
        >
          {isDownloading ? 'Downloading...' : 'Download (JPG)'}
        </Button>

        <Button
          variant="secondary"
          icon={copied ? <Check size={14} className="icon-emerald" /> : <Copy size={14} />}
          onClick={handleCopy}
          disabled={isUnavailable}
          className="ytd-btn-copy"
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>

        <a
          href={option.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`ytd-btn-open ${isUnavailable ? 'disabled' : ''}`}
          title="Open in new tab"
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}
