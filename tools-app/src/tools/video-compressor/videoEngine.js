/**
 * Cerilas Video Compression Engine
 * 100% Client-Side In-Browser Video Processing
 * Uses HTML5 Video, HTMLCanvasElement, Web Audio API, and MediaRecorder.
 * Zero files touch any external server.
 */

/**
 * Format bytes to readable string (e.g. 14.2 MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format duration in seconds to mm:ss format
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Get the best supported MediaRecorder MIME type in current browser
 */
export function getBestSupportedMimeType() {
  const types = [
    'video/mp4;codecs=avc1.4d401f,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  if (typeof MediaRecorder === 'undefined') {
    return 'video/webm';
  }

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

/**
 * Determine target width and height keeping aspect ratio
 */
export function calculateTargetDimensions(origWidth, origHeight, presetResolution) {
  if (!origWidth || !origHeight) return { width: 1280, height: 720 };

  let maxDim = null;
  switch (presetResolution) {
    case '1080p':
      maxDim = 1920;
      break;
    case '720p':
      maxDim = 1280;
      break;
    case '480p':
      maxDim = 854;
      break;
    case '360p':
      maxDim = 640;
      break;
    case 'original':
    default:
      return {
        width: Math.floor(origWidth / 2) * 2, // Must be even numbers
        height: Math.floor(origHeight / 2) * 2,
      };
  }

  const isLandscape = origWidth >= origHeight;
  let targetW, targetH;

  if (isLandscape) {
    if (origWidth <= maxDim) {
      targetW = origWidth;
      targetH = origHeight;
    } else {
      targetW = maxDim;
      targetH = Math.round((origHeight / origWidth) * maxDim);
    }
  } else {
    if (origHeight <= maxDim) {
      targetW = origWidth;
      targetH = origHeight;
    } else {
      targetH = maxDim;
      targetW = Math.round((origWidth / origHeight) * maxDim);
    }
  }

  // Enforce even dimensions required by video codecs
  targetW = Math.floor(targetW / 2) * 2;
  targetH = Math.floor(targetH / 2) * 2;

  return { width: targetW, height: targetH };
}

/**
 * Generate a 5-second 720p animated sample video with bouncing particles and countdown
 * Enables 1-click testing without user needing to have a video file on hand.
 */
export async function generateSampleVideoBlob() {
  const width = 1280;
  const height = 720;
  const fps = 30;
  const durationSec = 5;
  const totalFrames = fps * durationSec;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Set up Web Audio oscillator for a gentle harmonic beep sound
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioDest = null;
  if (AudioContextClass) {
    try {
      const audioCtx = new AudioContextClass();
      audioDest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioDest);
      osc.start();
    } catch {
      audioDest = null;
    }
  }

  const videoStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream();
  videoStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
  if (audioDest && audioDest.stream) {
    audioDest.stream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
  }

  const mimeType = getBestSupportedMimeType();
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 4000000,
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
      resolve(blob);
    };
  });

  recorder.start();

  // Animation particles
  const particles = Array.from({ length: 24 }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6,
    radius: Math.random() * 12 + 6,
    color: ['#3b82f6', '#10b981', '#a855f7', '#f59e0b'][Math.floor(Math.random() * 4)],
  }));

  for (let f = 0; f < totalFrames; f++) {
    // Draw rich gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Update & draw particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < p.radius || p.x > width - p.radius) p.vx *= -1;
      if (p.y < p.radius || p.y > height - p.radius) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 15;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Center badge
    const elapsedSec = (f / fps).toFixed(1);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cerilas Video Compressor', width / 2, height / 2 - 40);

    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`100% In-Browser Compression Test Clip • ${elapsedSec}s / 5.0s`, width / 2, height / 2 + 20);

    // Animated countdown bar
    const barWidth = 400;
    const barHeight = 8;
    const progress = f / totalFrames;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect((width - barWidth) / 2, height / 2 + 60, barWidth, barHeight);
    ctx.fillStyle = '#10b981';
    ctx.fillRect((width - barWidth) / 2, height / 2 + 60, barWidth * progress, barHeight);

    // Small delay between frames for realistic encoding
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  recorder.stop();
  const sampleBlob = await recordingPromise;
  return sampleBlob;
}

/**
 * Main Video Compression Engine
 * Transcodes video stream frame-by-frame via Canvas and encodes with MediaRecorder
 */
export async function compressVideo({
  fileOrBlob,
  options = {},
  onProgress = () => {},
  signal = null,
}) {
  const {
    targetResolution = '720p',
    bitrate = 2500000, // 2.5 Mbps default
    fps = 30,
    muteAudio = false,
    trimStart = 0,
    trimEnd = null,
  } = options;

  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(fileOrBlob);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = true; // Must be muted locally to allow automatic playback
    video.src = videoUrl;

    let isCleanedUp = false;
    let animFrameId = null;
    let recorder = null;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(videoUrl);
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
        cleanup();
        reject(new Error('Compression cancelled by user.'));
      });
    }

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video file. Please ensure it is a valid MP4, WebM, or MOV file.'));
    };

    video.onloadedmetadata = async () => {
      try {
        const origWidth = video.videoWidth || 1280;
        const origHeight = video.videoHeight || 720;
        const totalVideoDuration = video.duration || 10;

        const startSec = Math.max(0, trimStart || 0);
        const endSec = trimEnd ? Math.min(totalVideoDuration, trimEnd) : totalVideoDuration;
        const effectiveDuration = Math.max(0.5, endSec - startSec);

        const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
          origWidth,
          origHeight,
          targetResolution
        );

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { alpha: false });

        // Capture video track from canvas
        const videoStream = canvas.captureStream(fps);
        const outputStream = new MediaStream();
        videoStream.getVideoTracks().forEach((track) => outputStream.addTrack(track));

        // Handle Audio (unless muted)
        let audioContext = null;
        if (!muteAudio) {
          try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
              audioContext = new AudioContextClass();
              // Enable audio element output for Web Audio
              const audioSource = audioContext.createMediaElementSource(video);
              const audioDestination = audioContext.createMediaStreamDestination();
              audioSource.connect(audioDestination);
              audioDestination.stream.getAudioTracks().forEach((track) => outputStream.addTrack(track));
            }
          } catch (audioErr) {
            console.warn('Could not capture audio stream from video:', audioErr);
          }
        }

        const mimeType = getBestSupportedMimeType();
        recorder = new MediaRecorder(outputStream, {
          mimeType,
          videoBitsPerSecond: bitrate,
        });

        const recordedChunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          cleanup();
          if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(() => {});
          }

          const baseMime = mimeType.split(';')[0];
          const compressedBlob = new Blob(recordedChunks, { type: baseMime });
          const compressedUrl = URL.createObjectURL(compressedBlob);

          const origSize = fileOrBlob.size || 1;
          const compressedSize = compressedBlob.size;
          const savingsRatio = Math.max(0, ((origSize - compressedSize) / origSize) * 100);

          const isMp4 = baseMime.includes('mp4');
          const ext = isMp4 ? 'mp4' : 'webm';

          resolve({
            blob: compressedBlob,
            url: compressedUrl,
            originalSize: origSize,
            compressedSize,
            savingsPercent: Math.round(savingsRatio),
            duration: effectiveDuration,
            width: targetWidth,
            height: targetHeight,
            mimeType: baseMime,
            extension: ext,
          });
        };

        // Seek to trim start before recording
        video.currentTime = startSec;

        video.onseeked = async () => {
          recorder.start(100); // chunk every 100ms
          await video.play();

          const renderFrame = () => {
            if (isCleanedUp) return;

            const current = video.currentTime;
            const progress = Math.min(100, Math.max(0, ((current - startSec) / effectiveDuration) * 100));
            onProgress({
              percent: Math.round(progress),
              currentTime: current,
              targetDuration: effectiveDuration,
            });

            // Draw video frame scaled to canvas
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

            if (current >= endSec || video.ended) {
              video.pause();
              recorder.stop();
              return;
            }

            animFrameId = requestAnimationFrame(renderFrame);
          };

          animFrameId = requestAnimationFrame(renderFrame);
        };
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
  });
}
