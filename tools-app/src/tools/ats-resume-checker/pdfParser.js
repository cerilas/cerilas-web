import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdfjs worker URL for Vite bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Extract plain text and ATS parseability metrics from a PDF file.
 * 100% in-browser, client-side, zero server uploads of private documents.
 */
export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pageTexts.push(pageString);
      fullText += pageString + '\n\n';
    }

    const trimmed = fullText.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    
    // Check if the PDF has pages but almost no selectable text (scanned / image-only CV)
    const isScanned = numPages > 0 && words < 30;

    return {
      success: true,
      text: trimmed,
      numPages,
      wordCount: words,
      isScanned,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (err) {
    console.error('PDF text extraction error:', err);
    return {
      success: false,
      error: 'Failed to parse PDF: ' + (err.message || 'Unknown error'),
      text: '',
      numPages: 0,
      wordCount: 0,
      isScanned: false,
      fileName: file.name,
      fileSize: file.size
    };
  }
}
