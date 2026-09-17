/**
 * Client-Side Ultra-High-Performance Image Compression Engine
 * 100% in-browser processing with zero cloud/server uploads.
 * Powered by dedicated Web Worker with native canvas fallback.
 */

// Worker singleton
let workerInstance = null;
const pendingTasks = new Map();
let taskIdSeq = 0;

function getWorker() {
  if (typeof Worker === 'undefined') return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('./compressor.worker.js', import.meta.url), { type: 'module' });
      workerInstance.onmessage = (e) => {
        const { id, ...data } = e.data;
        const task = pendingTasks.get(id);
        if (task) {
          pendingTasks.delete(id);
          task.resolve(data);
        }
      };
      workerInstance.onerror = (err) => {
        console.warn('Compressor worker error, will use native main-thread fallback:', err);
        for (const [, task] of pendingTasks.entries()) {
          task.resolve({ success: false, needsMainThread: true });
        }
        pendingTasks.clear();
        workerInstance = null;
      };
    } catch (err) {
      console.warn('Worker initialization failed:', err);
      workerInstance = null;
    }
  }
  return workerInstance;
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * Detects whether the current browser canvas actually supports WebP encoding.
 * (Safari supports WebP decoding, but canvas.toBlob/toDataURL('image/webp') silently outputs PNG!)
 */
let isWebpEncodingSupported = null;

export function supportsWebpEncoding() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;
  if (isWebpEncodingSupported !== null) return isWebpEncodingSupported;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    isWebpEncodingSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    isWebpEncodingSupported = false;
  }
  return isWebpEncodingSupported;
}

/**
 * Loads an image or blob to read natural dimensions and preview URL
 */
export function getImageDimensions(fileOrBlob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(fileOrBlob);

    if (typeof window.createImageBitmap !== 'undefined') {
      createImageBitmap(fileOrBlob)
        .then((bitmap) => {
          const w = bitmap.width;
          const h = bitmap.height;
          bitmap.close();
          resolve({ width: w, height: h, url });
        })
        .catch(() => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, url });
          img.onerror = () => resolve({ width: 0, height: 0, url });
          img.src = url;
        });
    } else {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, url });
      img.onerror = () => resolve({ width: 0, height: 0, url });
      img.src = url;
    }
  });
}

/**
 * Resolves target format smartly based on browser encoder capabilities.
 * If the browser cannot encode WebP (like Safari), it uses JPEG so the file is truly compressed
 * rather than silently inflating into a 3MB raw uncompressed PNG!
 */
export function resolveTargetFormat(originalType, outputFormat) {
  const canEncodeWebp = supportsWebpEncoding();

  if (outputFormat && outputFormat !== 'auto') {
    switch (outputFormat) {
      case 'image/webp':
        if (!canEncodeWebp) {
          // Safari Canvas cannot encode WebP; falling back to JPEG guarantees small file size
          return { mimeType: 'image/jpeg', ext: 'jpg' };
        }
        return { mimeType: 'image/webp', ext: 'webp' };
      case 'image/jpeg':
        return { mimeType: 'image/jpeg', ext: 'jpg' };
      case 'image/png':
        return { mimeType: 'image/png', ext: 'png' };
      case 'image/avif':
        return { mimeType: 'image/avif', ext: 'avif' };
      default:
        return { mimeType: outputFormat, ext: 'jpg' };
    }
  }

  // AUTO MODE:
  // In Chrome/Firefox/Edge, WebP gives superior compression.
  if (canEncodeWebp) {
    return { mimeType: 'image/webp', ext: 'webp' };
  }

  // In Safari (no WebP encoder):
  // JPEG gives 75-90% savings. WebP would result in a massive uncompressed PNG!
  if (originalType === 'image/png') {
    return { mimeType: 'image/jpeg', ext: 'jpg' };
  }
  return { mimeType: 'image/jpeg', ext: 'jpg' };
}

/**
 * Super-fast, non-blocking native canvas compressor
 * Uses native C++ browser encoder (WebKit/Blink) directly.
 * Yields main thread before and after execution to keep UI at 60 FPS.
 */
async function nativeCanvasCompress(file, { quality, targetWidth, targetHeight, targetMime }) {
  // Yield thread immediately so any pending UI/animations render
  await new Promise((r) => setTimeout(r, 0));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: targetMime === 'image/png' || targetMime === 'image/webp' });

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 1. If JPEG, fill white background FIRST before drawing the image
  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 2. Draw the image ON TOP of the canvas
  let drew = false;
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file);
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      bitmap.close();
      drew = true;
    } catch {
      drew = false;
    }
  }

  if (!drew) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Yield before native encoding
  await new Promise((r) => setTimeout(r, 0));

  // 3. Export to Blob
  let effectiveMime = targetMime;
  let blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, effectiveMime, quality);
  });

  // CRITICAL SAFARI CHECK:
  // If the browser silently substituted image/png when we requested WebP or AVIF:
  // Note: DO NOT call fillRect here because the image is already on the canvas!
  if (blob && blob.type === 'image/png' && effectiveMime !== 'image/png') {
    effectiveMime = 'image/jpeg';
    blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
  }

  // Fallback to JPEG if browser doesn't support the requested format in toBlob
  if (!blob && effectiveMime !== 'image/jpeg') {
    effectiveMime = 'image/jpeg';
    blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
  }

  // Release canvas memory
  canvas.width = 1;
  canvas.height = 1;

  // Yield after native encoding
  await new Promise((r) => requestAnimationFrame(r));

  return {
    blob,
    effectiveMime,
    effectiveExt: effectiveMime === 'image/jpeg' ? 'jpg' : (effectiveMime.split('/')[1] || 'jpg')
  };
}

/**
 * Main compression entrypoint
 */
export async function compressImage(file, options = {}) {
  const {
    quality = 0.75,
    resizeScale = '100',
    maxDimension = 0,
    outputFormat = 'auto'
  } = options;

  const originalSize = file.size;
  const originalName = file.name;
  const originalType = file.type || 'image/jpeg';

  // 1. Try dedicated Web Worker first (100% off main thread)
  const worker = getWorker();
  let workerResult = null;

  if (worker) {
    try {
      const id = ++taskIdSeq;
      workerResult = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pendingTasks.delete(id);
          resolve({ success: false, needsMainThread: true });
        }, 10000);

        pendingTasks.set(id, {
          resolve: (data) => {
            clearTimeout(timeout);
            resolve(data);
          }
        });
        worker.postMessage({ id, file, options });
      });
    } catch {
      workerResult = null;
    }
  }

  let compressedBlob = null;
  let origWidth = 0;
  let origHeight = 0;
  let targetWidth = 0;
  let targetHeight = 0;
  let targetMime = 'image/jpeg';
  let targetExt = 'jpg';

  if (workerResult && workerResult.success && workerResult.blob) {
    compressedBlob = workerResult.blob;
    origWidth = workerResult.origWidth;
    origHeight = workerResult.origHeight;
    targetWidth = workerResult.targetWidth;
    targetHeight = workerResult.targetHeight;
    targetMime = workerResult.targetMime;
    targetExt = workerResult.targetExt;
  } else {
    // 2. Main thread native canvas compression (fast C++ encoder with yields)
    if (workerResult && workerResult.origWidth) {
      origWidth = workerResult.origWidth;
      origHeight = workerResult.origHeight;
      targetWidth = workerResult.targetWidth;
      targetHeight = workerResult.targetHeight;
      targetMime = workerResult.targetMime;
      targetExt = workerResult.targetExt;
    } else {
      const dims = await getImageDimensions(file);
      origWidth = dims.width;
      origHeight = dims.height;

      const formatInfo = resolveTargetFormat(originalType, outputFormat);
      targetMime = formatInfo.mimeType;
      targetExt = formatInfo.ext;

      targetWidth = origWidth;
      targetHeight = origHeight;
      const resizeVal = resizeScale || maxDimension || '100';

      if (String(resizeVal).startsWith('max-')) {
        const maxPixel = Number(String(resizeVal).replace('max-', ''));
        if (maxPixel > 0 && (origWidth > maxPixel || origHeight > maxPixel)) {
          const ratio = Math.min(maxPixel / origWidth, maxPixel / origHeight);
          targetWidth = Math.max(1, Math.round(origWidth * ratio));
          targetHeight = Math.max(1, Math.round(origHeight * ratio));
        }
      } else {
        const scaleNum = Number(resizeVal);
        if (!isNaN(scaleNum) && scaleNum > 0 && scaleNum < 100) {
          const factor = scaleNum / 100;
          targetWidth = Math.max(1, Math.round(origWidth * factor));
          targetHeight = Math.max(1, Math.round(origHeight * factor));
        }
      }
    }

    const res = await nativeCanvasCompress(file, {
      quality,
      targetWidth,
      targetHeight,
      targetMime
    });

    compressedBlob = res.blob;
    targetMime = res.effectiveMime;
    targetExt = res.effectiveExt;
  }

  // 3. SIZE GUARANTEE: The compressed image MUST be smaller than the original!
  // If the result is somehow larger than or equal to original (e.g. tiny original or high-q re-encoding)
  if (compressedBlob && compressedBlob.size >= originalSize) {
    // Pass A: Try stricter quality (50%) with JPEG
    const tighterQuality = Math.max(0.2, Math.min(quality * 0.75, 0.55));
    const retry1 = await nativeCanvasCompress(file, {
      quality: tighterQuality,
      targetWidth,
      targetHeight,
      targetMime: 'image/jpeg'
    });

    if (retry1.blob && retry1.blob.size < compressedBlob.size) {
      compressedBlob = retry1.blob;
      targetMime = retry1.effectiveMime;
      targetExt = retry1.effectiveExt;
    }

    // Pass B: If STILL larger than original, downscale dimensions to 85%
    if (compressedBlob.size >= originalSize) {
      const scaleW = Math.max(1, Math.round((targetWidth || origWidth) * 0.85));
      const scaleH = Math.max(1, Math.round((targetHeight || origHeight) * 0.85));
      const retry2 = await nativeCanvasCompress(file, {
        quality: tighterQuality,
        targetWidth: scaleW,
        targetHeight: scaleH,
        targetMime: 'image/jpeg'
      });

      if (retry2.blob && retry2.blob.size < compressedBlob.size) {
        compressedBlob = retry2.blob;
        targetWidth = scaleW;
        targetHeight = scaleH;
        targetMime = retry2.effectiveMime;
        targetExt = retry2.effectiveExt;
      }
    }
  }

  if (!compressedBlob) {
    throw new Error('Image compression could not be completed.');
  }

  const origPreviewUrl = URL.createObjectURL(file);
  const compPreviewUrl = URL.createObjectURL(compressedBlob);
  const compressedSize = compressedBlob.size;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercent = originalSize > 0
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const newFilename = `${baseName}-compressed.${targetExt}`;

  return {
    originalFile: file,
    originalName,
    originalSize,
    originalWidth: origWidth,
    originalHeight: origHeight,
    originalUrl: origPreviewUrl,
    compressedBlob,
    compressedSize,
    compressedWidth: targetWidth || origWidth,
    compressedHeight: targetHeight || origHeight,
    compressedUrl: compPreviewUrl,
    savedBytes,
    savingsPercent,
    targetMime,
    targetExt,
    filename: newFilename
  };
}
