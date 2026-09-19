import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

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
 * Parse page range string (e.g. "1-3, 5, 8-10") into 0-indexed page numbers.
 * Validates against totalPages.
 */
export function parsePageRange(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    throw new Error('Please enter page numbers or a range (e.g. 1-3, 5).');
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

      if (start > totalPages) {
        throw new Error(`Page ${start} exceeds total pages (${totalPages}).`);
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
    throw new Error('No valid pages found in range.');
  }

  return sorted;
}

/**
 * Load PDF file, extract page count and render miniature canvas thumbnails for each page
 */
export async function loadPdfAndThumbnails(file, onProgress = () => {}) {
  const freshBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(freshBuffer.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const thumbnails = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress(pageNum, numPages, `Rendering page ${pageNum} of ${numPages}...`);
    try {
      const page = await pdf.getPage(pageNum);
      const unscaled = page.getViewport({ scale: 1 });
      const maxDim = 200;
      const scale = Math.min(maxDim / unscaled.width, maxDim / unscaled.height, 1.0);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
        intent: 'display'
      }).promise;

      let thumbUrl;
      try {
        thumbUrl = canvas.toDataURL('image/webp', 0.8);
      } catch {
        thumbUrl = canvas.toDataURL('image/jpeg', 0.8);
      }

      thumbnails.push({
        pageNumber: pageNum,
        thumbUrl,
        aspectRatio: unscaled.width / unscaled.height
      });
    } catch (err) {
      console.warn(`Failed to render thumbnail for page ${pageNum}:`, err);
      thumbnails.push({
        pageNumber: pageNum,
        thumbUrl: null,
        aspectRatio: 0.707
      });
    }
  }

  return {
    numPages,
    name: file.name,
    size: file.size,
    thumbnails
  };
}

/**
 * Split PDF document by custom parts configuration
 * @param {File} file - Original PDF file
 * @param {Array<{ id: string, name: string, rangeStr: string }>} partsConfig
 * @param {Function} onProgress
 * @returns {Promise<Array<{ id: string, name: string, blob: Blob, pageCount: number, byteSize: number, pagesSummary: string }>>}
 */
export async function splitPdfByCustomParts(file, partsConfig, onProgress = () => {}) {
  const freshBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(freshBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const results = [];
  const totalParts = partsConfig.length;

  for (let i = 0; i < totalParts; i++) {
    const part = partsConfig[i];
    onProgress(i + 1, totalParts, `Generating ${part.name}...`);

    const pageIndices = parsePageRange(part.rangeStr, totalPages);
    const newDoc = await PDFDocument.create();

    const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((p) => newDoc.addPage(p));

    const pdfBytes = await newDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    let fileName = part.name.trim();
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }

    results.push({
      id: part.id || `part_${i + 1}`,
      name: fileName,
      blob,
      pageCount: pageIndices.length,
      byteSize: pdfBytes.byteLength,
      pagesSummary: `Pages ${pageIndices.map((idx) => idx + 1).join(', ')}`
    });
  }

  return results;
}

/**
 * Extract all pages into individual 1-page PDF files
 */
export async function splitPdfAllPages(file, baseName, onProgress = () => {}) {
  const freshBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(freshBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const cleanBase = baseName.replace(/\.pdf$/i, '');
  const results = [];

  for (let i = 0; i < totalPages; i++) {
    onProgress(i + 1, totalPages, `Extracting page ${i + 1} of ${totalPages}...`);
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
    newDoc.addPage(copiedPage);

    const pdfBytes = await newDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const fileName = `${cleanBase}_page_${i + 1}.pdf`;

    results.push({
      id: `page_${i + 1}`,
      name: fileName,
      blob,
      pageCount: 1,
      byteSize: pdfBytes.byteLength,
      pagesSummary: `Page ${i + 1}`
    });
  }

  return results;
}

/**
 * Split PDF every N pages
 */
export async function splitPdfEveryNPages(file, n, baseName, onProgress = () => {}) {
  const freshBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(freshBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const cleanBase = baseName.replace(/\.pdf$/i, '');
  const results = [];
  let partIndex = 1;

  for (let start = 0; start < totalPages; start += n) {
    const end = Math.min(start + n, totalPages);
    const indices = [];
    for (let p = start; p < end; p++) indices.push(p);

    onProgress(partIndex, Math.ceil(totalPages / n), `Generating part ${partIndex}...`);
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((p) => newDoc.addPage(p));

    const pdfBytes = await newDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const fileName = `${cleanBase}_part_${partIndex}_pages_${start + 1}-${end}.pdf`;

    results.push({
      id: `part_${partIndex}`,
      name: fileName,
      blob,
      pageCount: indices.length,
      byteSize: pdfBytes.byteLength,
      pagesSummary: `Pages ${start + 1} to ${end}`
    });

    partIndex++;
  }

  return results;
}

/**
 * Bundle all split PDF parts into a single downloadable ZIP file
 */
export async function createZipBundle(splitResults, zipFilename = 'split_documents.zip') {
  const zip = new JSZip();

  splitResults.forEach((item) => {
    zip.file(item.name, item.blob);
  });

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return {
    blob: zipBlob,
    fileName: zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`,
    byteSize: zipBlob.size
  };
}
