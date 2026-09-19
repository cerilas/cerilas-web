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
 * Generate unique id
 */
export function generateId() {
  return 'pdf_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
}

/**
 * Extract first page thumbnail and page count from a PDF file
 */
export async function extractPdfMetadata(file) {
  const freshBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(freshBuffer.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });

  let pdf = null;
  let thumbnail = null;
  let numPages = 1;
  let width = 595;
  let height = 842;

  try {
    pdf = await loadingTask.promise;
    numPages = pdf.numPages;

    const page = await pdf.getPage(1);
    const unscaled = page.getViewport({ scale: 1 });
    width = Math.round(unscaled.width);
    height = Math.round(unscaled.height);

    // Target max dimensions for thumbnail card
    const maxDim = 240;
    const scale = Math.min(maxDim / unscaled.width, maxDim / unscaled.height, 1.2);
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

    try {
      thumbnail = canvas.toDataURL('image/webp', 0.85);
    } catch {
      thumbnail = canvas.toDataURL('image/jpeg', 0.85);
    }
  } catch (err) {
    console.warn('Failed to extract PDF thumbnail or page count, falling back to basic metadata:', err);
    // Fallback: try loading with pdf-lib directly to at least get page count
    try {
      const pdfLibDoc = await PDFDocument.load(freshBuffer, { ignoreEncryption: true });
      numPages = pdfLibDoc.getPageCount();
    } catch (e2) {
      numPages = 1;
    }
  }

  return {
    id: generateId(),
    file,
    name: file.name,
    size: file.size,
    numPages,
    thumbnail,
    width,
    height,
    pageRange: '', // empty means all pages
    pageRangeError: null
  };
}

/**
 * Parse page range string (e.g. "1-3, 5, 8-10") into 0-indexed page numbers.
 * If empty, returns all pages [0, 1, ..., totalPages - 1].
 */
export function parsePageRange(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const clean = rangeStr.trim();
  if (clean.toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const parts = clean.split(',');
  const selectedPages = new Set();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        throw new Error(`Invalid range "${trimmed}". Expected format like "1-5"`);
      }

      const clampedEnd = Math.min(end, totalPages);
      for (let p = start; p <= clampedEnd; p++) {
        selectedPages.add(p - 1);
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Invalid page number "${trimmed}". Must be between 1 and ${totalPages}`);
      }
      selectedPages.add(pageNum - 1);
    }
  }

  const sorted = Array.from(selectedPages).sort((a, b) => a - b);
  if (sorted.length === 0) {
    throw new Error('Page range produced zero pages.');
  }

  return sorted;
}

/**
 * Merge multiple PDF files into a single document in custom user sequence
 * @param {Array} items - List of items with { file, numPages, pageRange }
 * @param {Function} onProgress - Callback (current, total, statusText)
 * @returns {Promise<{ blob: Blob, totalPages: number, byteSize: number, durationSec: string }>}
 */
export async function mergePdfFiles(items, onProgress = () => {}) {
  const startTime = performance.now();
  const mergedPdf = await PDFDocument.create();

  const totalFiles = items.length;
  let totalCopiedPages = 0;

  for (let i = 0; i < totalFiles; i++) {
    const item = items[i];
    const fileName = item.name || `Document #${i + 1}`;
    
    onProgress(i + 1, totalFiles, `Reading ${fileName}...`);

    const fileBuffer = await item.file.arrayBuffer();
    const srcDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const srcTotalPages = srcDoc.getPageCount();

    let pageIndices;
    try {
      pageIndices = parsePageRange(item.pageRange, srcTotalPages);
    } catch (e) {
      console.warn(`Page range error on "${fileName}", using all pages instead:`, e);
      pageIndices = Array.from({ length: srcTotalPages }, (_, idx) => idx);
    }

    onProgress(i + 1, totalFiles, `Merging ${pageIndices.length} page(s) from ${fileName}...`);

    const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
      totalCopiedPages++;
    });
  }

  onProgress(totalFiles, totalFiles, 'Assembling finalized PDF...');
  const mergedBytes = await mergedPdf.save();
  const endTime = performance.now();
  const durationSec = ((endTime - startTime) / 1000).toFixed(2);

  const blob = new Blob([mergedBytes], { type: 'application/pdf' });

  return {
    blob,
    totalPages: totalCopiedPages,
    byteSize: mergedBytes.byteLength,
    durationSec
  };
}
