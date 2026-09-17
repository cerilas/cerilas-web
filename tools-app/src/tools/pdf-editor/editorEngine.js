import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

// Ensure PDF.js worker is properly configured in Vite
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Standard colors for annotations and redactions
 */
export const ANNOTATION_COLORS = {
  black: { r: 0.1, g: 0.1, b: 0.1, hex: '#1e293b' },
  white: { r: 1.0, g: 1.0, b: 1.0, hex: '#ffffff' },
  blue: { r: 0.13, g: 0.45, b: 0.95, hex: '#2563eb' },
  red: { r: 0.9, g: 0.15, b: 0.2, hex: '#e11d48' },
  green: { r: 0.08, g: 0.65, b: 0.35, hex: '#16a34a' },
  amber: { r: 0.95, g: 0.6, b: 0.05, hex: '#f59e0b' },
  highlighterYellow: { r: 1.0, g: 0.92, b: 0.23, hex: '#fde047' },
  highlighterGreen: { r: 0.4, g: 0.95, b: 0.4, hex: '#86efac' },
  highlighterPink: { r: 0.98, g: 0.5, b: 0.7, hex: '#f472b6' },
};

/**
 * Convert hex color to normalized RGB 0-1
 */
export function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

/**
 * Load PDF bytes into a pdfjs document proxy for high-performance canvas rendering
 */
export async function loadPdfJsDocument(arrayBuffer) {
  // CRITICAL: Always pass a standalone cloned Uint8Array so that PDF.js Web Worker
  // transferable objects (postMessage) do NOT detach or neuter the original ArrayBuffer!
  let bufferToPass;
  if (arrayBuffer instanceof Uint8Array) {
    bufferToPass = new Uint8Array(arrayBuffer.slice(0));
  } else if (arrayBuffer && arrayBuffer.slice) {
    bufferToPass = new Uint8Array(arrayBuffer.slice(0));
  } else {
    bufferToPass = new Uint8Array(arrayBuffer);
  }

  const loadingTask = pdfjsLib.getDocument({
    data: bufferToPass,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Render a specific page to an HTML5 canvas element
 */
export async function renderPdfPageToCanvas(pdfDocProxy, pageNumber, canvas, options = {}) {
  const { scale = 1.4, rotation = 0 } = options;
  if (!pdfDocProxy || !canvas) return null;

  const page = await pdfDocProxy.getPage(pageNumber);
  const totalRotation = (page.rotate + rotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
  };

  await page.render(renderContext).promise;

  return {
    width: viewport.width,
    height: viewport.height,
    scale,
    originalWidth: viewport.width / scale,
    originalHeight: viewport.height / scale,
    rotation: totalRotation,
  };
}

/**
 * Render a low-res thumbnail of a page for the thumbnail strip
 */
export async function renderPdfThumbnail(pdfDocProxy, pageNumber, canvas, maxWidth = 120) {
  if (!pdfDocProxy || !canvas) return;
  try {
    const page = await pdfDocProxy.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;
  } catch (err) {
    console.error(`Failed to render thumbnail for page ${pageNumber}:`, err);
  }
}

/**
 * Convert base64 / data URL string to Uint8Array for image embedding
 */
export function dataUriToUint8Array(dataUri) {
  const parts = dataUri.split(',');
  const byteString = atob(parts[1] || parts[0]);
  const u8 = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    u8[i] = byteString.charCodeAt(i);
  }
  return u8;
}

/**
 * Safely transliterates non-WinAnsi / Unicode characters (e.g. Turkish characters,
 * smart quotes, dashes) to prevent pdf-lib standard font encoding crashes.
 */
export function sanitizeTextForPdfFont(str) {
  if (!str) return '';
  const charMap = {
    'ı': 'i', 'İ': 'I',
    'ğ': 'g', 'Ğ': 'G',
    'ş': 's', 'Ş': 'S',
    'ç': 'c', 'Ç': 'C',
    'ö': 'o', 'Ö': 'O',
    'ü': 'u', 'Ü': 'U',
    '“': '"', '”': '"',
    '‘': "'", '’': "'",
    '—': '-', '–': '-',
    '…': '...',
    '•': '*',
    '€': 'EUR',
    '₺': 'TL',
  };

  let res = '';
  for (const ch of str) {
    if (charMap[ch]) {
      res += charMap[ch];
    } else if (ch.charCodeAt(0) <= 255) {
      res += ch;
    } else {
      res += ' ';
    }
  }
  return res;
}

/**
 * Main PDF Assembly & Export Engine using pdf-lib
 * Modifies page structure (reorder, rotate, delete, blank pages)
 * Bakes annotations (text, signatures, redactions, highlights, stamps, page numbers)
 */
export async function exportModifiedPdf({
  originalBytes,
  pagesList, // Array of { id, originalPageIndex, rotation, isBlank }
  annotations = [], // Array of annotations
  enablePageNumbers = false,
  pageNumberPosition = 'bottom-center',
}) {
  if (!originalBytes || originalBytes.byteLength === 0) {
    throw new Error('PDF document buffer is empty or detached. Please reload your document.');
  }

  // Clone bytes to guarantee isolation and prevent detached buffer issues
  const safeBytes = new Uint8Array(originalBytes.slice ? originalBytes.slice(0) : originalBytes);

  // Load the source PDF with encryption bypass if unpassworded
  const srcPdfDoc = await PDFDocument.load(safeBytes, { ignoreEncryption: true });
  const outputPdfDoc = await PDFDocument.create();

  // Embed standard fonts for text and stamps
  const helveticaFont = await outputPdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await outputPdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesFont = await outputPdfDoc.embedFont(StandardFonts.TimesRoman);
  const courierFont = await outputPdfDoc.embedFont(StandardFonts.Courier);

  const fontMap = {
    Helvetica: helveticaFont,
    'Helvetica-Bold': helveticaBold,
    Times: timesFont,
    Courier: courierFont,
  };

  const totalFinalPages = pagesList.length;

  for (let pageIdx = 0; pageIdx < pagesList.length; pageIdx++) {
    const pageItem = pagesList[pageIdx];
    let newPage;

    if (pageItem.isBlank) {
      // Create a standard A4 page (595.28 x 841.89 points)
      newPage = outputPdfDoc.addPage([595.28, 841.89]);
    } else {
      // Copy existing page from source document
      const [copiedPage] = await outputPdfDoc.copyPages(srcPdfDoc, [pageItem.originalPageIndex]);
      newPage = outputPdfDoc.addPage(copiedPage);

      // Apply cumulative rotation
      if (pageItem.rotation && pageItem.rotation !== 0) {
        const currentRot = newPage.getRotation().angle;
        newPage.setRotation(degrees((currentRot + pageItem.rotation) % 360));
      }
    }

    const { width: pageWidth, height: pageHeight } = newPage.getSize();

    // Filter annotations targeting this page (matched by pageItem.id)
    const pageAnnotations = annotations.filter((ann) => ann.pageId === pageItem.id);

    for (const ann of pageAnnotations) {
      // Convert normalized coordinates (0..1) to PDF point coordinates (bottom-left origin)
      // ann.x and ann.y are ratios relative to canvas display:
      // x: 0..1 (left to right), y: 0..1 (top to bottom)
      const pdfX = (ann.x || 0) * pageWidth;
      const pdfW = Math.max(2, (ann.width || 0.1) * pageWidth);
      const pdfH = Math.max(2, (ann.height || 0.05) * pageHeight);
      // In PDF, Y starts from bottom:
      const pdfY = pageHeight - ((ann.y || 0) * pageHeight) - pdfH;

      const annRgb = ann.color ? hexToRgb(ann.color) : { r: 0.1, g: 0.1, b: 0.1 };

      switch (ann.type) {
        case 'text': {
          const selectedFont = fontMap[ann.fontFamily] || helveticaFont;
          const fontSize = Math.max(8, (ann.fontSize || 14) * (pageWidth / 600));
          const lines = (ann.text || '').split('\n');
          let currentLineY = pageHeight - ((ann.y || 0) * pageHeight) - fontSize;

          for (const rawLine of lines) {
            const cleanLine = sanitizeTextForPdfFont(rawLine);
            if (cleanLine.trim()) {
              try {
                newPage.drawText(cleanLine, {
                  x: Math.max(0, pdfX),
                  y: Math.max(10, currentLineY),
                  size: fontSize,
                  font: selectedFont,
                  color: rgb(annRgb.r, annRgb.g, annRgb.b),
                });
              } catch (fontErr) {
                // Secondary fallback: pure ASCII
                const asciiLine = cleanLine.replace(/[^\x20-\x7E]/g, ' ');
                try {
                  newPage.drawText(asciiLine, {
                    x: Math.max(0, pdfX),
                    y: Math.max(10, currentLineY),
                    size: fontSize,
                    font: selectedFont,
                    color: rgb(annRgb.r, annRgb.g, annRgb.b),
                  });
                } catch {
                  // ignore
                }
              }
            }
            currentLineY -= fontSize * 1.25;
          }
          break;
        }

        case 'redaction':
        case 'redact': {
          // Absolute opaque box for securely masking sensitive data
          const isWhiteout = ann.fillType === 'white' || ann.color === '#ffffff';
          newPage.drawRectangle({
            x: Math.max(0, pdfX),
            y: Math.max(0, pdfY),
            width: pdfW,
            height: pdfH,
            color: isWhiteout ? rgb(1, 1, 1) : rgb(0.02, 0.02, 0.02),
            opacity: 1.0,
          });
          break;
        }

        case 'highlight': {
          // Fluorescent semi-transparent highlighter
          const hlRgb = ann.color ? hexToRgb(ann.color) : hexToRgb('#fde047');
          newPage.drawRectangle({
            x: Math.max(0, pdfX),
            y: Math.max(0, pdfY),
            width: pdfW,
            height: pdfH,
            color: rgb(hlRgb.r, hlRgb.g, hlRgb.b),
            opacity: 0.38,
          });
          break;
        }

        case 'shape-box': {
          // Transparent box with visible border
          newPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            borderColor: rgb(annRgb.r, annRgb.g, annRgb.b),
            borderWidth: ann.borderWidth || 2,
            opacity: 0,
          });
          break;
        }

        case 'signature':
        case 'image': {
          if (ann.imageDataUri) {
            try {
              const imageBytes = dataUriToUint8Array(ann.imageDataUri);
              let embeddedImage;
              if (ann.imageDataUri.startsWith('data:image/jpeg') || ann.imageDataUri.startsWith('data:image/jpg')) {
                embeddedImage = await outputPdfDoc.embedJpg(imageBytes);
              } else {
                embeddedImage = await outputPdfDoc.embedPng(imageBytes);
              }

              newPage.drawImage(embeddedImage, {
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH,
              });
            } catch (err) {
              console.error('Failed to embed signature/image in PDF:', err);
            }
          }
          break;
        }

        case 'stamp': {
          // Professional stamp overlay (e.g. APPROVED, CONFIDENTIAL, DRAFT)
          const stampText = (ann.text || 'APPROVED').toUpperCase();
          const stampColors = {
            APPROVED: { r: 0.08, g: 0.65, b: 0.35 },
            CONFIDENTIAL: { r: 0.9, g: 0.15, b: 0.2 },
            DRAFT: { r: 0.45, g: 0.55, b: 0.65 },
            URGENT: { r: 0.95, g: 0.45, b: 0.05 },
            FINAL: { r: 0.15, g: 0.45, b: 0.95 },
          };
          const stampColor = stampColors[stampText] || { r: 0.08, g: 0.65, b: 0.35 };

          const stampSize = 18;
          const stampW = Math.max(120, stampText.length * 11 + 24);
          const stampH = 34;

          // Draw stamp border
          newPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: stampW,
            height: stampH,
            borderColor: rgb(stampColor.r, stampColor.g, stampColor.b),
            borderWidth: 2.5,
            opacity: 0.9,
          });

          // Draw stamp text centered
          const textW = helveticaBold.widthOfTextAtSize(stampText, stampSize);
          newPage.drawText(stampText, {
            x: pdfX + (stampW - textW) / 2,
            y: pdfY + 8,
            size: stampSize,
            font: helveticaBold,
            color: rgb(stampColor.r, stampColor.g, stampColor.b),
          });
          break;
        }

        default:
          break;
      }
    }

    // Optional Page Numbering
    if (enablePageNumbers) {
      const pageNumText = `Page ${pageIdx + 1} of ${totalFinalPages}`;
      const fontSize = 10;
      const textWidth = helveticaFont.widthOfTextAtSize(pageNumText, fontSize);
      const posX = (pageWidth - textWidth) / 2;
      const posY = 18;

      newPage.drawText(pageNumText, {
        x: posX,
        y: posY,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.45, 0.5, 0.55),
      });
    }
  }

  // Save the newly assembled document
  const pdfBytes = await outputPdfDoc.save();
  return pdfBytes;
}

/**
 * Trigger immediate browser download of generated PDF Uint8Array
 */
export function downloadPdfBytes(pdfBytes, filename = 'edited-document.pdf') {
  if (!pdfBytes || pdfBytes.byteLength === 0) {
    throw new Error('PDF byte buffer is empty.');
  }

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  // 1. Create a non-hidden anchor to satisfy strict browser security policies (Opera, Safari)
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.target = '_blank';
  link.style.position = 'fixed';
  link.style.left = '-9999px';
  link.style.top = '-9999px';
  link.style.opacity = '0';
  link.style.pointerEvents = 'none';
  document.body.appendChild(link);

  let clicked = false;
  try {
    link.click();
    clicked = true;
  } catch (err) {
    console.warn('Programmatic click failed, attempting data-uri fallback:', err);
    try {
      let binary = '';
      const bytes = new Uint8Array(pdfBytes);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const dataUri = `data:application/pdf;base64,${base64}`;
      const fallbackLink = document.createElement('a');
      fallbackLink.href = dataUri;
      fallbackLink.download = filename;
      fallbackLink.style.position = 'fixed';
      fallbackLink.style.left = '-9999px';
      fallbackLink.style.opacity = '0';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      clicked = true;
      setTimeout(() => document.body.removeChild(fallbackLink), 1000);
    } catch (fallbackErr) {
      console.error('All automatic download triggers failed:', fallbackErr);
    }
  } finally {
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    }, 1000);
  }

  return { blob, url, filename, clicked };
}
