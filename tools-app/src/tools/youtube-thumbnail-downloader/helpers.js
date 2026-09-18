/**
 * YouTube Thumbnail Downloader - Core Utility & Helper Functions
 */

/**
 * Extracts clean 11-character YouTube video ID from various link formats.
 * Supports standard watch URLs, youtu.be shortlinks, Shorts, embeds, and raw IDs.
 */
export function extractYouTubeVideoId(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // If already a clean 11-character alphanumeric YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regular expressions covering standard web, mobile, shorts, and embeds
  const patterns = [
    /(?:youtube\.com\/(?:watch\?.*v=|v\/|embed\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
    /\/shorts\/([a-zA-Z0-9_-]{11})/i
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns structured thumbnail definitions for all available YouTube resolutions.
 */
export function getThumbnailOptions(videoId) {
  if (!videoId) return [];

  return [
    {
      id: 'maxres',
      label: 'Ultra HD / 4K',
      badge: 'Recommended',
      badgeVariant: 'brand',
      resolution: '1920 × 1080',
      aspectRatio: '16:9',
      filename: `youtube-thumbnail-${videoId}-4k-maxres.jpg`,
      url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      backupUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      description: 'Maximum resolution uploaded by creator. Ideal for professional design, wallpaper, and presentations.'
    },
    {
      id: 'sd',
      label: 'High Definition (HD)',
      badge: '720p',
      badgeVariant: 'neutral',
      resolution: '1280 × 720',
      aspectRatio: '16:9',
      filename: `youtube-thumbnail-${videoId}-hd-720p.jpg`,
      url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      backupUrl: `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
      description: 'Standard YouTube 720p HD frame. Guaranteed available on almost all high-res uploads.'
    },
    {
      id: 'hq',
      label: 'High Quality (HQ)',
      badge: '480p',
      badgeVariant: 'neutral',
      resolution: '640 × 480',
      aspectRatio: '4:3',
      filename: `youtube-thumbnail-${videoId}-hq-480p.jpg`,
      url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      backupUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description: 'Standard 480p preview image automatically generated for all YouTube videos.'
    },
    {
      id: 'mq',
      label: 'Medium Quality (MQ)',
      badge: '360p',
      badgeVariant: 'neutral',
      resolution: '320 × 180',
      aspectRatio: '16:9',
      filename: `youtube-thumbnail-${videoId}-mq-360p.jpg`,
      url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      backupUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      description: 'Compact 360p thumbnail for lightweight blog widgets, email newsletters, and previews.'
    }
  ];
}

/**
 * Loads image onto an HTML5 Canvas and triggers direct browser file download.
 * Overcomes cross-origin restriction by drawing through an Image element with anonymous crossOrigin.
 */
export async function downloadThumbnailImage(imageUrl, filename = 'youtube-thumbnail.jpg') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) {
            // Fallback to direct anchor download if blob conversion fails
            directAnchorDownload(imageUrl, filename);
            return resolve();
          }
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
          resolve();
        }, 'image/jpeg', 0.95);
      } catch (err) {
        console.warn('Canvas export failed, falling back to anchor download:', err);
        directAnchorDownload(imageUrl, filename);
        resolve();
      }
    };

    img.onerror = () => {
      directAnchorDownload(imageUrl, filename);
      resolve();
    };

    img.src = imageUrl;
  });
}

/**
 * Fallback direct anchor download.
 */
function directAnchorDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Copies the thumbnail directly to system clipboard as image/png.
 */
export async function copyThumbnailToClipboard(imageUrl) {
  return new Promise((resolve, reject) => {
    if (!navigator.clipboard || !window.ClipboardItem) {
      return reject(new Error('Clipboard API not supported in this browser.'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error('Failed to create image blob.'));
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            resolve();
          } catch (err) {
            reject(err);
          }
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for copying.'));
    img.src = imageUrl;
  });
}

/**
 * Fetches public video metadata (Title, Author, Provider) via noembed / oEmbed endpoint.
 */
export async function fetchYouTubeVideoInfo(videoId) {
  try {
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.title) return null;
    return {
      title: data.title,
      authorName: data.author_name,
      authorUrl: data.author_url,
      providerName: data.provider_name
    };
  } catch (e) {
    return null;
  }
}
