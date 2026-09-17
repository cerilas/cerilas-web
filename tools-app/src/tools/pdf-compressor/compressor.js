import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';

// Configure pdfjs worker URL for Vite bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Format bytes into human readable string (KB, MB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Extract first page thumbnail and metadata from a PDF file.
 * Safely creates a cloned copy of the ArrayBuffer so the underlying file is never neutered.
 */
export async function extractPdfInfo(file) {
  // Always obtain a fresh buffer and pass a cloned slice to avoid detached buffer issues
  const freshBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(freshBuffer.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });

  let pdf = null;
  let thumbnail = null;
  let firstPageWidth = 595;
  let firstPageHeight = 842;
  let numPages = 1;

  try {
    pdf = await loadingTask.promise;
    numPages = pdf.numPages;

    const page = await pdf.getPage(1);
    const unscaledViewport = page.getViewport({ scale: 1 });
    firstPageWidth = Math.round(unscaledViewport.width);
    firstPageHeight = Math.round(unscaledViewport.height);

    // Render thumbnail with max dimension 300px
    const maxDim = 300;
    const scale = Math.min(maxDim / unscaledViewport.width, maxDim / unscaledViewport.height, 1.5);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      intent: 'display'
    }).promise;

    thumbnail = canvas.toDataURL('image/jpeg', 0.82);
  } catch (err) {
    console.warn('Could not generate PDF thumbnail:', err);
  } finally {
    if (pdf) {
      try {
        await pdf.cleanup();
        await pdf.destroy();
      } catch (e) {
        // Ignore worker cleanup errors
      }
    }
  }

  return {
    numPages,
    thumbnail,
    dimensions: `${firstPageWidth} × ${firstPageHeight} pt`
  };
}

/**
 * Compression presets definition with single-line labels and descriptions
 */
export const COMPRESSION_PRESETS = {
  extreme: {
    id: 'extreme',
    label: 'Extreme',
    badge: 'Max Shrink',
    description: 'Maximum size reduction',
    scale: 1.2,
    quality: 0.52,
    estimatedSaving: 'Save ~70-90%'
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    badge: 'Recommended',
    description: 'Best for daily sharing & email',
    scale: 1.6,
    quality: 0.74,
    estimatedSaving: 'Save ~50-75%'
  },
  high: {
    id: 'high',
    label: 'High Quality',
    badge: 'Print',
    description: 'Crisp vector & photo fidelity',
    scale: 2.2,
    quality: 0.86,
    estimatedSaving: 'Save ~25-45%'
  },
  lossless: {
    id: 'lossless',
    label: 'Lossless',
    badge: 'Vector',
    description: 'Strips metadata & cleans streams',
    scale: 0,
    quality: 1,
    estimatedSaving: 'Save ~10-30%'
  }
};

/**
 * Compress a PDF document locally in browser memory.
 * Completely immune to "Cannot perform Construct on a detached ArrayBuffer" errors.
 */
export async function compressPdf(file, options = {}, onProgress = () => {}) {
  const { preset = 'balanced' } = options;
  const originalSize = file.size;

  onProgress({ percent: 5, status: 'Initializing PDF engine...' });

  // 1. Lossless / Structural Compression Mode
  if (preset === 'lossless') {
    try {
      onProgress({ percent: 25, status: 'Optimizing PDF object streams & metadata...' });
      const rawBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(new Uint8Array(rawBuffer), { ignoreEncryption: true });
      
      // Strip metadata
      pdfDoc.setTitle(file.name.replace(/\.pdf$/i, ''));
      pdfDoc.setProducer('Cerilas Tools In-Browser PDF Compressor');
      pdfDoc.setCreator('Cerilas Tools');
      
      onProgress({ percent: 70, status: 'Rebuilding compressed binary tables...' });
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false
      });

      const compressedSize = compressedBytes.byteLength;
      const isSmaller = compressedSize < originalSize;
      const finalBytes = isSmaller ? compressedBytes : new Uint8Array(await file.arrayBuffer());
      const finalSize = isSmaller ? compressedSize : originalSize;
      const savedBytes = Math.max(0, originalSize - finalSize);
      const ratio = originalSize > 0 ? ((savedBytes / originalSize) * 100).toFixed(1) : 0;

      onProgress({ percent: 100, status: 'Compression complete!' });

      return {
        blob: new Blob([finalBytes], { type: 'application/pdf' }),
        bytes: finalBytes,
        originalSize,
        compressedSize: finalSize,
        savedBytes,
        ratio,
        numPages: pdfDoc.getPageCount(),
        isSmaller
      };
    } catch (err) {
      console.error('Lossless compression failed, falling back:', err);
      throw err;
    }
  }

  // 2. High-Performance Resampling Pipeline (Extreme, Balanced, High Quality)
  const config = COMPRESSION_PRESETS[preset] || COMPRESSION_PRESETS.balanced;
  
  // Obtain fresh buffer and pass a cloned slice to avoid worker neutering the buffer
  const freshBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(freshBuffer.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });

  let pdf = null;
  try {
    pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    // Create new target document
    const targetDoc = await PDFDocument.create();
    targetDoc.setTitle(file.name.replace(/\.pdf$/i, ''));
    targetDoc.setProducer('Cerilas In-Browser PDF Compressor');
    targetDoc.setCreator('Cerilas Tools');

    // Shared reusable canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const stepPercent = Math.round(10 + ((pageNum - 1) / totalPages) * 75);
      onProgress({
        percent: stepPercent,
        currentPage: pageNum,
        totalPages,
        status: `Compressing page ${pageNum} of ${totalPages}...`
      });

      const page = await pdf.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const origWidth = unscaledViewport.width;
      const origHeight = unscaledViewport.height;

      // Scale viewport according to preset
      const viewport = page.getViewport({ scale: config.scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      // Fill clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render page
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
        intent: 'print'
      }).promise;

      // Convert to JPEG data
      const jpegDataUrl = canvas.toDataURL('image/jpeg', config.quality);
      const jpegBase64 = jpegDataUrl.split(',')[1];
      const binaryString = atob(jpegBase64);
      const jpegBytes = new Uint8Array(binaryString.length);
      for (let k = 0; k < binaryString.length; k++) {
        jpegBytes[k] = binaryString.charCodeAt(k);
      }

      // Embed into target PDF document
      const embeddedImage = await targetDoc.embedJpg(jpegBytes);
      const newPage = targetDoc.addPage([origWidth, origHeight]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: origWidth,
        height: origHeight
      });
    }

    onProgress({ percent: 90, status: 'Finalizing compressed stream structures...' });

    const compressedBytes = await targetDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    const compressedSize = compressedBytes.byteLength;
    // If compressed size is unexpectedly larger than original (rare, e.g. already micro-compressed plain text), keep original
    const isSmaller = compressedSize < originalSize;
    const finalBytes = isSmaller ? compressedBytes : new Uint8Array(await file.arrayBuffer());
    const finalSize = isSmaller ? compressedSize : originalSize;
    const savedBytes = Math.max(0, originalSize - finalSize);
    const ratio = originalSize > 0 ? ((savedBytes / originalSize) * 100).toFixed(1) : 0;

    onProgress({ percent: 100, status: 'Compression complete!' });

    return {
      blob: new Blob([finalBytes], { type: 'application/pdf' }),
      bytes: finalBytes,
      originalSize,
      compressedSize: finalSize,
      savedBytes,
      ratio,
      numPages: totalPages,
      isSmaller
    };
  } finally {
    if (pdf) {
      try {
        await pdf.cleanup();
        await pdf.destroy();
      } catch (e) {
        // Ignore worker cleanup errors
      }
    }
  }
}
