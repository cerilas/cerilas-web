import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Play,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Eye,
  Film,
  Code,
  X,
  ClipboardList
} from 'lucide-react';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { useTranslation } from '../../i18n';
import { youtubeThumbnailDownloaderManifest } from './manifest';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ThumbnailCard from './components/ThumbnailCard';
import YoutubeSeoSection from './components/YoutubeSeoSection';
import {
  extractYouTubeVideoId,
  getThumbnailOptions,
  fetchYouTubeVideoInfo
} from './helpers';
import './youtube-thumbnail-downloader.css';

const EXAMPLE_VIDEOS = [
  { label: 'Tech Studio (4K)', id: 'dQw4w9WgXcQ', icon: Film },
  { label: 'Apple Keynote (HD)', id: 'f_n3gE5Y66Q', icon: Sparkles },
  { label: 'Aerospace Stream', id: 'bvim4rsNHkQ', icon: Play }
];

export default function YoutubeThumbnailDownloaderTool({ onBack, toolMeta }) {
  const { t } = useTranslation();
  const { visitorCount, trackAction } = useToolAnalytics(
    youtubeThumbnailDownloaderManifest.slug,
    toolMeta
  );

  const [inputUrl, setInputUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [activeVideoId, setActiveVideoId] = useState('dQw4w9WgXcQ');
  const [videoInfo, setVideoInfo] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedCleanUrl, setCopiedCleanUrl] = useState(false);

  // Parse and fetch on video ID change
  useEffect(() => {
    if (!activeVideoId) return;

    let isMounted = true;
    fetchYouTubeVideoInfo(activeVideoId).then((info) => {
      if (isMounted) setVideoInfo(info);
    });

    return () => {
      isMounted = false;
    };
  }, [activeVideoId]);

  const handleFetch = useCallback((urlToProcess) => {
    const raw = urlToProcess || inputUrl;
    const extractedId = extractYouTubeVideoId(raw);
    if (extractedId) {
      setActiveVideoId(extractedId);
      setShowPlayer(false);
      trackAction('search', { videoId: extractedId });
    }
  }, [inputUrl, trackAction]);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputUrl(text);
          handleFetch(text);
        }
      }
    } catch (err) {
      console.warn('Clipboard read denied:', err);
    }
  };

  const handleClear = () => {
    setInputUrl('');
  };

  const handleDownloadSuccess = (formatId) => {
    trackAction('download', { format: formatId, videoId: activeVideoId });
  };

  const handleCopyEmbed = () => {
    if (!activeVideoId) return;
    const embedCode = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;"><iframe src="https://www.youtube-nocookie.com/embed/${activeVideoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopiedEmbed(true);
      trackAction('copy_embed', { videoId: activeVideoId });
      setTimeout(() => setCopiedEmbed(false), 2000);
    });
  };

  const handleCopyCleanUrl = () => {
    if (!activeVideoId) return;
    const cleanUrl = `https://youtu.be/${activeVideoId}`;
    navigator.clipboard.writeText(cleanUrl).then(() => {
      setCopiedCleanUrl(true);
      setTimeout(() => setCopiedCleanUrl(false), 2000);
    });
  };

  const thumbnailOptions = getThumbnailOptions(activeVideoId);

  return (
    <div className="c-tool-page-container ytd-page-container">
      {/* Standard Tool Header */}
      <ToolHeader
        slug={youtubeThumbnailDownloaderManifest.slug}
        title={youtubeThumbnailDownloaderManifest.title}
        subtitle={youtubeThumbnailDownloaderManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        badges={
          <>
            <Badge variant="brand" icon={<Sparkles size={11} strokeWidth={2.2} />}>
              4K Ultra HD &amp; WebP
            </Badge>
            <Badge variant="success" icon={<Check size={11} strokeWidth={2.2} />}>
              Shorts Compatible
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
          </>
        }
      />

      {/* URL Input Box */}
      <div className="ytd-input-card">
        <label className="ytd-input-label" htmlFor="youtube-url-input">
          <Film size={15} />
          <span>YouTube Video or Shorts URL</span>
        </label>

        <div className="ytd-input-wrapper">
          <Search size={18} className="ytd-input-icon" />
          <input
            id="youtube-url-input"
            type="text"
            className="ytd-url-input"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFetch();
            }}
            placeholder="Paste YouTube link (e.g. youtube.com/watch?v=... or youtu.be/... or Shorts URL)"
            autoComplete="off"
            spellCheck="false"
          />

          <div className="ytd-input-actions">
            {inputUrl && (
              <button
                type="button"
                className="ytd-btn-clear"
                onClick={handleClear}
                title="Clear input"
              >
                <X size={14} />
              </button>
            )}

            <button
              type="button"
              className="ytd-btn-paste"
              onClick={handlePaste}
              title="Paste from clipboard"
            >
              <ClipboardList size={14} />
              <span>Paste</span>
            </button>

            <Button
              variant="primary"
              onClick={() => handleFetch()}
              className="ytd-btn-fetch"
            >
              Grab Thumbnails
            </Button>
          </div>
        </div>

        {/* Quick Example Suggestions */}
        <div className="ytd-examples">
          <span className="ytd-examples-label">Examples:</span>
          {EXAMPLE_VIDEOS.map((ex) => {
            const ExIcon = ex.icon;
            return (
              <button
                key={ex.id}
                type="button"
                className="ytd-example-pill"
                onClick={() => {
                  const sampleUrl = `https://www.youtube.com/watch?v=${ex.id}`;
                  setInputUrl(sampleUrl);
                  handleFetch(sampleUrl);
                }}
              >
                <ExIcon size={12} strokeWidth={2} />
                <span>{ex.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Video Info Banner */}
      {activeVideoId && (
        <div className="ytd-video-info-card">
          <div className="ytd-video-info-left">
            <div className="ytd-video-icon-badge">
              <Film size={22} />
            </div>
            <div>
              <h2 className="ytd-video-title">
                {videoInfo?.title || `YouTube Video ID: ${activeVideoId}`}
              </h2>
              <p className="ytd-video-author">
                {videoInfo?.authorName ? (
                  <>
                    Channel: <strong>{videoInfo.authorName}</strong>
                  </>
                ) : (
                  <span>Ready for full-resolution download</span>
                )}
              </p>
            </div>
          </div>

          <div className="ytd-video-info-actions">
            <Button
              variant="secondary"
              icon={<Play size={14} />}
              onClick={() => setShowPlayer(!showPlayer)}
            >
              {showPlayer ? 'Close Player' : 'Play Preview'}
            </Button>

            <Button
              variant="secondary"
              icon={copiedEmbed ? <Check size={14} className="icon-emerald" /> : <Code size={14} />}
              onClick={handleCopyEmbed}
            >
              {copiedEmbed ? 'Embed Copied' : 'Embed Code'}
            </Button>

            <Button
              variant="secondary"
              icon={copiedCleanUrl ? <Check size={14} className="icon-emerald" /> : <Copy size={14} />}
              onClick={handleCopyCleanUrl}
            >
              {copiedCleanUrl ? 'Link Copied' : 'Copy Link'}
            </Button>
          </div>

          {showPlayer && (
            <div className="ytd-player-collapse">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1`}
                title="YouTube Video Player Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {/* Thumbnails Grid (4K, HD, HQ, MQ) */}
      <div className="ytd-grid">
        {thumbnailOptions.map((opt) => (
          <ThumbnailCard
            key={opt.id}
            option={opt}
            videoId={activeVideoId}
            onDownloadSuccess={handleDownloadSuccess}
          />
        ))}
      </div>

      {/* SEO Divider & Educational Content */}
      <ToolSeoDivider />
      <YoutubeSeoSection />
    </div>
  );
}
