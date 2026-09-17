/**
 * Dedicated Web Worker for Off-Thread Image Compression
 * Executes 100% in background thread with zero main-thread UI blocking.
 */

self.onmessage = async (e) => {
  const { id, file, options = {} } = e.data;
  const {
    quality = 0.75,
    resizeScale = '100',
    maxDimension = 0,
    outputFormat = 'auto'
  } = options;

  let bitmap = null;
  try {
    // 1. Decode image off-main-thread
    bitmap = await createImageBitmap(file);
    const origWidth = bitmap.width;
    const origHeight = bitmap.height;

    // 2. Calculate target dimensions
    let targetWidth = origWidth;
    let targetHeight = origHeight;
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

    // 3. Resolve target mime & extension
    const originalType = file.type || 'image/jpeg';
    let targetMime = 'image/jpeg';
    let targetExt = 'jpg';

    if (outputFormat && outputFormat !== 'auto') {
      targetMime = outputFormat;
      targetExt = outputFormat.replace('image/', '').replace('jpeg', 'jpg');
    } else {
      if (originalType === 'image/webp') {
        targetMime = 'image/webp';
        targetExt = 'webp';
      } else {
        targetMime = 'image/jpeg';
        targetExt = 'jpg';
      }
    }

    // 4. Try OffscreenCanvas compression in worker
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill white background for JPEG first, so transparent alpha doesn't turn black
          if (targetMime === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

          let blob = await canvas.convertToBlob({ type: targetMime, quality });

          // If browser substituted PNG for unsupported WebP in OffscreenCanvas:
          if (blob && blob.type === 'image/png' && targetMime !== 'image/png') {
            blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
            targetMime = 'image/jpeg';
            targetExt = 'jpg';
          }

          if (blob && blob.size > 0) {
            bitmap.close();
            self.postMessage({
              id,
              success: true,
              blob,
              origWidth,
              origHeight,
              targetWidth,
              targetHeight,
              targetMime: blob.type || targetMime,
              targetExt
            });
            return;
          }
        }
      } catch {
        // OffscreenCanvas unsupported or failed
      }
    }

    if (bitmap) {
      try { bitmap.close(); } catch {}
    }

    self.postMessage({
      id,
      success: false,
      needsMainThread: true,
      origWidth,
      origHeight,
      targetWidth,
      targetHeight,
      targetMime,
      targetExt
    });
  } catch (err) {
    if (bitmap) {
      try { bitmap.close(); } catch {}
    }
    self.postMessage({
      id,
      success: false,
      needsMainThread: true,
      error: err.message
    });
  }
};
