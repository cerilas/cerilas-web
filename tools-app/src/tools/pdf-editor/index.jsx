import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Upload,
  RotateCw,
  RotateCcw,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  PenTool,
  EyeOff,
  Highlighter,
  Stamp,
  Type,
  MousePointer,
  Download,
  Lock,
  Eye,
  CheckCircle2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { pdfEditorManifest } from './manifest';
import {
  loadPdfJsDocument,
  renderPdfPageToCanvas,
  renderPdfThumbnail,
  exportModifiedPdf,
  downloadPdfBytes,
} from './editorEngine';
import SignatureModal from './components/SignatureModal';
import PdfEditorSeo from './components/PdfEditorSeo';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import AdSlot from '../../components/ui/AdSlot';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import './pdf-editor.css';

// Standard available fonts & colors
const FONT_OPTIONS = ['Helvetica', 'Times', 'Courier'];
const FONT_SIZES = [12, 14, 16, 18, 24, 32, 48];
const TEXT_COLORS = ['#1d1d1f', '#2563eb', '#dc2626', '#16a34a', '#7c3aed'];
const STAMP_OPTIONS = ['APPROVED', 'CONFIDENTIAL', 'DRAFT', 'URGENT', 'FINAL'];

export default function PdfEditorTool({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    pdfEditorManifest.slug,
    toolMeta
  );

  // Document State
  const [originalBytes, setOriginalBytes] = useState(null);
  const [fileName, setFileName] = useState('document.pdf');
  const [pdfjsDoc, setPdfjsDoc] = useState(null);
  const [pages, setPages] = useState([]); // [{ id, originalPageIndex, pageNumber, rotation, isBlank }]
  const [activePageId, setActivePageId] = useState(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Full Screen Focus Mode State
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Active Tool & Options
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'text' | 'signature' | 'redact' | 'highlight' | 'stamp'
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [textColor, setTextColor] = useState('#1d1d1f');
  const [redactFill, setRedactFill] = useState('black'); // 'black' | 'white'
  const [selectedStamp, setSelectedStamp] = useState('APPROVED');

  // Annotations & UI State
  const [annotations, setAnnotations] = useState([]); // array of annotation objects
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isChangeDocModalOpen, setIsChangeDocModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.3);
  const [enablePageNumbers, setEnablePageNumbers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null); // { url, filename, size, timestamp }
  const [toast, setToast] = useState(null);

  // References
  const mainCanvasRef = useRef(null);
  const overlayRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragItemRef = useRef(null);
  const thumbCanvasRefs = useRef({});
  const inlineInputRef = useRef(null);

  // Fullscreen Handlers
  const enterFullScreen = useCallback(async () => {
    setIsFullScreen(true);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    setIsFullScreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (isFullScreen) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  }, [isFullScreen, enterFullScreen, exitFullScreen]);

  // Sync with native browser fullscreen changes & keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      // Do not trigger full screen shortcuts while any modal is open
      if (isSignatureModalOpen || isChangeDocModalOpen) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullScreen();
      } else if (e.key === 'Escape' && isFullScreen) {
        e.preventDefault();
        exitFullScreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen, isSignatureModalOpen, isChangeDocModalOpen, toggleFullScreen, exitFullScreen]);

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  // Auto-focus inline text input when editing starts
  useEffect(() => {
    if (editingAnnotationId && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [editingAnnotationId]);

  // Show auto-dismissing toast
  const showToast = useCallback((message, icon = 'check') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Load PDF from ArrayBuffer
  const processPdfBuffer = async (buffer, name = 'document.pdf') => {
    setIsLoadingPdf(true);
    try {
      // CRITICAL: Always create an independent cloned Uint8Array so that PDF.js web worker transfers
      // cannot detach or neuter the buffer used for pdf-lib export!
      let cleanBytes;
      if (buffer instanceof Uint8Array) {
        cleanBytes = new Uint8Array(buffer.slice(0));
      } else if (buffer && buffer.slice) {
        cleanBytes = new Uint8Array(buffer.slice(0));
      } else {
        cleanBytes = new Uint8Array(buffer);
      }
      setOriginalBytes(cleanBytes);
      setFileName(name);

      // Separate clone for PDF.js to load
      const workerData = cleanBytes.slice(0);
      const docProxy = await loadPdfJsDocument(workerData);
      setPdfjsDoc(docProxy);

      const newPages = [];
      for (let i = 1; i <= docProxy.numPages; i++) {
        newPages.push({
          id: `page-${i}-${Date.now()}`,
          originalPageIndex: i - 1,
          pageNumber: i,
          rotation: 0,
          isBlank: false,
        });
      }

      setPages(newPages);
      setActivePageId(newPages[0]?.id || null);
      setAnnotations([]);
      showToast(`Loaded ${newPages.length} pages ready for editing.`, 'check');
      trackAction('pdf_loaded', { pageCount: newPages.length });
    } catch (err) {
      console.error('Failed to load PDF:', err);
      showToast('Could not open PDF file. Please ensure it is a valid, unencrypted PDF.', 'x');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Handle File Input Change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      processPdfBuffer(loadEvt.target.result, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  // Generate Sample PDF for 1-Click Instant Testing
  const handleLoadSamplePdf = async () => {
    setIsLoadingPdf(true);
    try {
      const samplePdfDoc = await PDFDocument.create();
      const page1 = samplePdfDoc.addPage([595.28, 841.89]);
      const helvetica = await samplePdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await samplePdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Draw header
      page1.drawText('CONFIDENTIAL CONSULTING AGREEMENT', {
        x: 50,
        y: 780,
        size: 18,
        font: helveticaBold,
        color: rgb(0.1, 0.15, 0.25),
      });

      page1.drawText('Sample Document for Cerilas Online PDF Editor Demonstration', {
        x: 50,
        y: 755,
        size: 11,
        font: helvetica,
        color: rgb(0.4, 0.45, 0.5),
      });

      // Horizontal line
      page1.drawLine({
        start: { x: 50, y: 740 },
        end: { x: 545, y: 740 },
        thickness: 1,
        color: rgb(0.85, 0.88, 0.92),
      });

      // Sample paragraphs
      const bodyLines = [
        '1. PURPOSE AND SCOPE',
        'This Agreement is entered into by and between Cerilas Global Technologies Inc. and the',
        'independent client. The parties agree that all data manipulated using this browser-based',
        'system remains strictly confidential and shall never be transferred to remote third parties.',
        '',
        '2. OBLIGATIONS & PRIVACY STATEMENT',
        'All client-side document processing executes locally inside the browser sandbox utilizing',
        'WebAssembly and HTML5 canvas engines. Under GDPR Article 28 and HIPAA compliance standards,',
        'zero transmission of PII (Personally Identifiable Information) occurs during this session.',
        '',
        '3. SENSITIVE PAYMENT INFORMATION (TEST BLACKOUT / WHITEOUT HERE)',
        'Billing Account Number: 4092-8812-3391-7721',
        'Authorization Code: SEC-9941-X',
        'Contact Direct Line: +1 (555) 019-2834',
        '',
        '4. SIGNATURE AND EXECUTION',
        'Please test adding your digital signature or approval stamp in the designated area below:',
      ];

      let yPos = 700;
      for (const line of bodyLines) {
        const isHeading = line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.');
        page1.drawText(line, {
          x: 50,
          y: yPos,
          size: isHeading ? 12 : 10,
          font: isHeading ? helveticaBold : helvetica,
          color: isHeading ? rgb(0.12, 0.18, 0.28) : rgb(0.25, 0.3, 0.35),
        });
        yPos -= 22;
      }

      // Second page
      const page2 = samplePdfDoc.addPage([595.28, 841.89]);
      page2.drawText('EXHIBIT A: SCOPE OF SERVICES & MILESTONES', {
        x: 50,
        y: 780,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.15, 0.25),
      });

      page2.drawText('Page 2: Try rotating, deleting, or reordering this sheet in the left thumbnail strip.', {
        x: 50,
        y: 750,
        size: 11,
        font: helvetica,
        color: rgb(0.4, 0.45, 0.5),
      });

      const sampleBytes = await samplePdfDoc.save();
      // Ensure we pass a clean copy of the buffer
      const cleanBuffer = sampleBytes.buffer.slice(
        sampleBytes.byteOffset,
        sampleBytes.byteOffset + sampleBytes.byteLength
      );
      await processPdfBuffer(cleanBuffer, 'sample-contract.pdf');
    } catch (err) {
      console.error('Failed to create sample PDF:', err);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Active page object
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // Render active page to canvas whenever page, doc, zoom, or rotation changes
  useEffect(() => {
    if (!pdfjsDoc || !activePage || !mainCanvasRef.current) return;

    if (activePage.isBlank) {
      const canvas = mainCanvasRef.current;
      const width = 595 * zoomScale;
      const height = 842 * zoomScale;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    renderPdfPageToCanvas(
      pdfjsDoc,
      activePage.originalPageIndex + 1,
      mainCanvasRef.current,
      { scale: zoomScale, rotation: activePage.rotation }
    );
  }, [pdfjsDoc, activePage, zoomScale]);

  // Render thumbnails in sidebar
  useEffect(() => {
    if (!pdfjsDoc || pages.length === 0) return;

    pages.forEach((page) => {
      const canvas = thumbCanvasRefs.current[page.id];
      if (canvas) {
        if (page.isBlank) {
          canvas.width = 100;
          canvas.height = 140;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, 100, 140);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px sans-serif';
          ctx.fillText('Blank Page', 22, 70);
        } else {
          renderPdfThumbnail(pdfjsDoc, page.originalPageIndex + 1, canvas, 100);
        }
      }
    });
  }, [pdfjsDoc, pages]);

  // Page Operations
  const handleRotateActivePage = (delta = 90) => {
    if (!activePage) return;
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id ? { ...p, rotation: (p.rotation + delta) % 360 } : p
      )
    );
    showToast(`Rotated page ${pages.findIndex((p) => p.id === activePage.id) + 1} by ${delta}°.`, 'check');
  };

  const handleDeletePage = (pageId) => {
    if (pages.length <= 1) {
      showToast('A document must have at least one page.', 'x');
      return;
    }
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    const newPages = pages.filter((p) => p.id !== pageId);
    setPages(newPages);
    setAnnotations((prev) => prev.filter((a) => a.pageId !== pageId));

    if (activePageId === pageId) {
      const nextActive = newPages[Math.min(pageIndex, newPages.length - 1)];
      setActivePageId(nextActive.id);
    }
    showToast('Page deleted.', 'check');
  };

  const handleMovePage = (pageId, direction) => {
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= pages.length) return;

    const copy = [...pages];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    setPages(copy);
  };

  const handleAddBlankPage = () => {
    const newPage = {
      id: `blank-${Date.now()}`,
      originalPageIndex: -1,
      pageNumber: pages.length + 1,
      rotation: 0,
      isBlank: true,
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    showToast('Added a new blank page to the end of document.', 'check');
  };

  // Canvas Overlay Click (Add Text, Stamp, Redaction) - ZERO BROWSER POPUPS!
  const handleOverlayClick = (e) => {
    if (!activePage || !overlayRef.current) return;
    if (e.target !== overlayRef.current) return; // ignore clicks on existing annotations

    const rect = overlayRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    if (activeTool === 'text') {
      const newAnn = {
        id: `ann-${Date.now()}`,
        pageId: activePage.id,
        type: 'text',
        x: Math.max(0.02, Math.min(0.85, clickX)),
        y: Math.max(0.02, Math.min(0.92, clickY)),
        text: 'Type text here',
        fontSize,
        fontFamily,
        color: textColor,
      };
      setAnnotations((prev) => [...prev, newAnn]);
      setSelectedAnnotationId(newAnn.id);
      setEditingAnnotationId(newAnn.id);
      setActiveTool('select');
    } else if (activeTool === 'stamp') {
      const newStamp = {
        id: `ann-${Date.now()}`,
        pageId: activePage.id,
        type: 'stamp',
        x: Math.max(0.02, Math.min(0.75, clickX)),
        y: Math.max(0.02, Math.min(0.92, clickY)),
        text: selectedStamp,
        width: 0.22,
        height: 0.045,
      };
      setAnnotations((prev) => [...prev, newStamp]);
      setSelectedAnnotationId(newStamp.id);
      setActiveTool('select');
    } else if (activeTool === 'redact') {
      const isWhite = redactFill === 'white';
      const newRedact = {
        id: `ann-${Date.now()}`,
        pageId: activePage.id,
        type: 'redaction',
        x: Math.max(0.02, Math.min(0.75, clickX)),
        y: Math.max(0.02, Math.min(0.94, clickY)),
        width: 0.26,
        height: 0.04,
        fillType: isWhite ? 'white' : 'black',
        color: isWhite ? '#ffffff' : '#000000',
      };
      setAnnotations((prev) => [...prev, newRedact]);
      setSelectedAnnotationId(newRedact.id);
      setActiveTool('select');
      showToast(`Added solid ${isWhite ? 'whiteout' : 'blackout'} box. Drag corner to resize.`, 'check');
    } else if (activeTool === 'highlight') {
      const newHighlight = {
        id: `ann-${Date.now()}`,
        pageId: activePage.id,
        type: 'highlight',
        x: Math.max(0.02, Math.min(0.75, clickX)),
        y: Math.max(0.02, Math.min(0.95, clickY)),
        width: 0.26,
        height: 0.035,
        color: '#fde047',
      };
      setAnnotations((prev) => [...prev, newHighlight]);
      setSelectedAnnotationId(newHighlight.id);
      setActiveTool('select');
      showToast('Added fluorescent highlighter. Drag corner to resize.', 'check');
    }
  };

  // Add Electronic Signature from SignatureModal
  const handleSaveSignature = (dataUri) => {
    if (!activePage) return;
    const newSig = {
      id: `ann-${Date.now()}`,
      pageId: activePage.id,
      type: 'signature',
      x: 0.35,
      y: 0.72,
      width: 0.28,
      height: 0.12,
      imageDataUri: dataUri,
    };
    setAnnotations((prev) => [...prev, newSig]);
    setSelectedAnnotationId(newSig.id);
    setIsSignatureModalOpen(false);
    setActiveTool('select');
    showToast('Signature placed on page. You can drag or resize it.', 'check');
  };

  // Update text content of an annotation
  const handleUpdateAnnotationText = (id, newText) => {
    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, text: newText } : ann))
    );
  };

  // Delete an annotation
  const handleDeleteAnnotation = (id) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
    if (editingAnnotationId === id) setEditingAnnotationId(null);
  };

  // Dragging annotations on canvas
  const handleAnnotationMouseDown = (e, ann) => {
    e.stopPropagation();
    setSelectedAnnotationId(ann.id);

    // Don't drag while actively typing in the inline input
    if (editingAnnotationId === ann.id) return;

    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();

    dragItemRef.current = {
      annId: ann.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: ann.x,
      origY: ann.y,
      overlayWidth: rect.width,
      overlayHeight: rect.height,
    };

    const handleMouseMove = (moveEvt) => {
      if (!dragItemRef.current) return;
      const { annId, startX, startY, origX, origY, overlayWidth, overlayHeight } = dragItemRef.current;
      const deltaX = (moveEvt.clientX - startX) / overlayWidth;
      const deltaY = (moveEvt.clientY - startY) / overlayHeight;

      setAnnotations((prev) =>
        prev.map((item) => {
          if (item.id !== annId) return item;
          return {
            ...item,
            x: Math.max(0.01, Math.min(0.95, origX + deltaX)),
            y: Math.max(0.01, Math.min(0.95, origY + deltaY)),
          };
        })
      );
    };

    const handleMouseUp = () => {
      dragItemRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resizing box annotations (redaction, highlight, signature)
  const handleResizeMouseDown = (e, ann) => {
    e.stopPropagation();
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();

    const startX = e.clientX;
    const startY = e.clientY;
    const origW = ann.width || 0.24;
    const origH = ann.height || 0.04;

    const handleMouseMove = (moveEvt) => {
      const deltaW = (moveEvt.clientX - startX) / rect.width;
      const deltaH = (moveEvt.clientY - startY) / rect.height;

      setAnnotations((prev) =>
        prev.map((item) => {
          if (item.id !== ann.id) return item;
          return {
            ...item,
            width: Math.max(0.04, Math.min(0.96 - item.x, origW + deltaW)),
            height: Math.max(0.02, Math.min(0.96 - item.y, origH + deltaH)),
          };
        })
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Export and download edited PDF
  const handleExportPdf = async () => {
    if (!originalBytes || originalBytes.byteLength === 0) {
      showToast('No PDF document loaded. Please upload or reload your PDF.', 'x');
      return;
    }
    if (pages.length === 0) {
      showToast('No pages in document to export.', 'x');
      return;
    }
    setIsExporting(true);
    setExportSuccess(null);
    try {
      const finalPdfBytes = await exportModifiedPdf({
        originalBytes,
        pagesList: pages,
        annotations,
        enablePageNumbers,
      });

      if (!finalPdfBytes || finalPdfBytes.byteLength === 0) {
        throw new Error('Generated PDF byte buffer is empty.');
      }

      const cleanBaseName = fileName.replace(/\.pdf$/i, '');
      const outFilename = `${cleanBaseName}-edited.pdf`;
      const downloadResult = downloadPdfBytes(finalPdfBytes, outFilename);

      setExportSuccess({
        url: downloadResult.url,
        filename: outFilename,
        size: finalPdfBytes.byteLength,
        timestamp: Date.now(),
      });

      setLocalCompletedDelta((prev) => prev + 1);
      trackAction('pdf_export', {
        pageCount: pages.length,
        annotationsCount: annotations.length,
      });

      showToast(`Exported "${outFilename}" successfully. Download initiated!`, 'check');
    } catch (err) {
      console.error('Failed to export modified PDF:', err);
      showToast(`Export failed: ${err.message || 'Please check console'}.`, 'x');
    } finally {
      setIsExporting(false);
    }
  };

  const activeAnnotations = annotations.filter((ann) => ann.pageId === activePage?.id);

  return (
    <div className="c-tool-page-container pdf-editor-container">
      {/* Standard Universal Tool Header */}
      <ToolHeader
        title="PDF Editor"
        subtitle="Edit PDF text, draw digital signatures, redact sensitive info, rotate, and organize pages 100% locally in your browser."
        onBack={onBack}
        backLabel="All Tools"
        actions={
          originalBytes ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                type="button"
                className="pdf-fullscreen-btn"
                onClick={toggleFullScreen}
                title="Toggle Full Screen Mode (F)"
                aria-label="Full Screen Mode"
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
              </button>
              <Button
                variant="primary"
                size="sm"
                icon={<Download size={14} />}
                onClick={handleExportPdf}
                isLoading={isExporting}
              >
                {isExporting ? 'Compiling...' : 'Export PDF'}
              </Button>
            </div>
          ) : null
        }
        badges={
          <>
            <Badge variant="success" icon={<Lock size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="neutral" icon={<CheckCircle2 size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel('en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div role="status" aria-live="polite" className="pom-toast-banner" style={{ marginBottom: '1.25rem' }}>
          {toast.icon === 'check' && <CheckCircle2 size={16} className="pom-toast-icon icon-emerald" />}
          {toast.icon === 'x' && <X size={16} className="pom-toast-icon icon-rose" />}
          {toast.icon === 'sparkles' && <Sparkles size={16} className="pom-toast-icon icon-blue" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Workspace or Upload Dropzone */}
      {!originalBytes ? (
        <div className="pdf-dropzone-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div className="pdf-dropzone-icon-box">
            <Upload size={30} strokeWidth={1.75} />
          </div>

          <h3 className="pdf-dropzone-title">Drop your PDF here, or browse</h3>
          <p className="pdf-dropzone-sub">
            All editing and rendering executes locally in your browser memory. Zero files are uploaded to any server, keeping confidential documents strictly private.
          </p>

          <Button
            variant="primary"
            size="lg"
            icon={<FileText size={18} />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={isLoadingPdf}
          >
            {isLoadingPdf ? 'Opening PDF...' : 'Select PDF File'}
          </Button>

          <button
            type="button"
            className="pdf-sample-trigger"
            onClick={handleLoadSamplePdf}
            disabled={isLoadingPdf}
          >
            Or load a 1-click sample contract to test features immediately
          </button>
        </div>
      ) : (
        <div className={`pdf-workspace-card ${isFullScreen ? 'is-fullscreen' : ''}`}>
          {/* Top Primary Toolbar */}
          <div className="pdf-toolbar">
            <div className="pdf-toolbar-group">
              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
                onClick={() => setActiveTool('select')}
                title="Select & Move Annotations"
              >
                <MousePointer size={14} />
                <span>Select</span>
              </button>

              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTool('text')}
                title="Click anywhere on the PDF to add text"
              >
                <Type size={14} />
                <span>Text</span>
              </button>

              <button
                type="button"
                className="pdf-tool-btn"
                onClick={() => setIsSignatureModalOpen(true)}
                title="Draw or Upload Signature"
              >
                <PenTool size={14} />
                <span>Sign</span>
              </button>

              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'redact' ? 'active' : ''}`}
                onClick={() => setActiveTool('redact')}
                title="Mask confidential data (Blackout/Whiteout)"
              >
                <EyeOff size={14} />
                <span>Redact</span>
              </button>

              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'highlight' ? 'active' : ''}`}
                onClick={() => setActiveTool('highlight')}
                title="Fluorescent Text Highlighter"
              >
                <Highlighter size={14} />
                <span>Highlight</span>
              </button>

              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'stamp' ? 'active' : ''}`}
                onClick={() => setActiveTool('stamp')}
                title="Stamp document (APPROVED, CONFIDENTIAL, etc.)"
              >
                <Stamp size={14} />
                <span>Stamp</span>
              </button>
            </div>

            {/* Page & Zoom Controls */}
            <div className="pdf-toolbar-group">
              <button
                type="button"
                className="pdf-tool-btn"
                onClick={() => handleRotateActivePage(90)}
                title="Rotate Page 90° Clockwise"
              >
                <RotateCw size={14} />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                className="pdf-tool-btn"
                onClick={() => setZoomScale((z) => Math.max(0.8, z - 0.2))}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'center' }}>
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                className="pdf-tool-btn"
                onClick={() => setZoomScale((z) => Math.min(2.2, z + 0.2))}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Document Info, Fullscreen & Reset */}
            <div className="pdf-toolbar-group">
              <button
                type="button"
                className="pdf-tool-btn"
                onClick={toggleFullScreen}
                title="Toggle Full Screen Mode (F)"
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
              </button>

              <button
                type="button"
                className="pdf-tool-btn danger"
                onClick={() => setIsChangeDocModalOpen(true)}
                title="Open another file"
              >
                <FileText size={14} />
                <span>Change PDF</span>
              </button>
            </div>
          </div>

          {/* Secondary Contextual Options Bar */}
          {activeTool === 'text' && (
            <div className="pdf-options-bar">
              <div className="pdf-option-item">
                <span className="pdf-option-label">Font:</span>
                <select
                  className="pdf-select-sm"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pdf-option-item">
                <span className="pdf-option-label">Size:</span>
                <select
                  className="pdf-select-sm"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                >
                  {FONT_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}pt
                    </option>
                  ))}
                </select>
              </div>

              <div className="pdf-option-item">
                <span className="pdf-option-label">Color:</span>
                <div className="pdf-color-row">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`pdf-color-pill ${textColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setTextColor(c)}
                    />
                  ))}
                </div>
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Click anywhere on the PDF page to place text inline
              </span>
            </div>
          )}

          {activeTool === 'redact' && (
            <div className="pdf-options-bar">
              <div className="pdf-option-item">
                <span className="pdf-option-label">Mask Style:</span>
                <button
                  type="button"
                  className={`line-btn ${redactFill === 'black' ? 'active' : ''}`}
                  onClick={() => setRedactFill('black')}
                >
                  Blackout
                </button>
                <button
                  type="button"
                  className={`line-btn ${redactFill === 'white' ? 'active' : ''}`}
                  onClick={() => setRedactFill('white')}
                >
                  Whiteout
                </button>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Click on the PDF to place a blackout/whiteout box, then drag corners to resize
              </span>
            </div>
          )}

          {activeTool === 'stamp' && (
            <div className="pdf-options-bar">
              <div className="pdf-option-item">
                <span className="pdf-option-label">Stamp Label:</span>
                <select
                  className="pdf-select-sm"
                  value={selectedStamp}
                  onChange={(e) => setSelectedStamp(e.target.value)}
                >
                  {STAMP_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Click on the PDF page to place the stamp
              </span>
            </div>
          )}

          {/* Dual Pane: Left Sidebar + Center Stage */}
          <div className="pdf-dual-pane">
            {/* Sidebar: Thumbnails & Page Reorder */}
            <div className="pdf-sidebar">
              <div className="pdf-sidebar-header">
                <span className="pdf-sidebar-title">Pages ({pages.length})</span>
                <button
                  type="button"
                  className="pdf-sidebar-action-btn"
                  onClick={handleAddBlankPage}
                  title="Add Blank Page"
                >
                  <Plus size={12} />
                  <span>Blank</span>
                </button>
              </div>

              <div className="pdf-thumbnails-list">
                {pages.map((p, idx) => {
                  const isActive = p.id === activePage?.id;
                  return (
                    <div
                      key={p.id}
                      className={`pdf-thumb-card ${isActive ? 'active' : ''}`}
                      onClick={() => setActivePageId(p.id)}
                    >
                      <div className="pdf-thumb-canvas-box">
                        <canvas
                          ref={(el) => (thumbCanvasRefs.current[p.id] = el)}
                          className="pdf-thumb-canvas"
                        />
                      </div>

                      <div className="pdf-thumb-footer">
                        <span className="pdf-thumb-number">Page {idx + 1}</span>
                        <div className="pdf-thumb-actions">
                          {idx > 0 && (
                            <button
                              type="button"
                              className="pdf-thumb-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePage(p.id, -1);
                              }}
                              title="Move page up"
                            >
                              <ArrowUp size={12} />
                            </button>
                          )}
                          {idx < pages.length - 1 && (
                            <button
                              type="button"
                              className="pdf-thumb-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePage(p.id, 1);
                              }}
                              title="Move page down"
                            >
                              <ArrowDown size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="pdf-thumb-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(p.id);
                            }}
                            title="Delete page"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage: Interactive Canvas & Annotation Layer */}
            <div className="pdf-stage">
              <div className="pdf-canvas-wrapper">
                <canvas ref={mainCanvasRef} className="pdf-main-canvas" />

                <div
                  ref={overlayRef}
                  className={`pdf-annotation-overlay tool-${activeTool}`}
                  onClick={handleOverlayClick}
                >
                  {activeAnnotations.map((ann) => {
                    const isSelected = ann.id === selectedAnnotationId;
                    const isEditingThis = ann.id === editingAnnotationId;
                    const isRedact = ann.type === 'redaction' || ann.type === 'redact';
                    const isHighlight = ann.type === 'highlight';
                    const isWhite = ann.fillType === 'white';

                    const leftPct = `${ann.x * 100}%`;
                    const topPct = `${ann.y * 100}%`;
                    const widthPct = ann.width ? `${ann.width * 100}%` : 'auto';
                    const heightPct = ann.height ? `${ann.height * 100}%` : 'auto';

                    return (
                      <div
                        key={ann.id}
                        className={`pdf-annotation-item type-${ann.type} ${isSelected ? 'selected' : ''} ${isWhite ? 'fill-white' : ''
                          }`}
                        style={{
                          left: leftPct,
                          top: topPct,
                          width: widthPct,
                          height: heightPct,
                          backgroundColor: isRedact
                            ? (isWhite ? '#ffffff' : '#000000')
                            : isHighlight
                              ? 'rgba(253, 224, 71, 0.45)'
                              : undefined,
                          border: isRedact && isWhite
                            ? '1.5px dashed #94a3b8'
                            : isRedact && !isWhite
                              ? '1px solid #000000'
                              : undefined,
                          color: ann.color || undefined,
                          borderColor: ann.type === 'stamp' ? (ann.text === 'CONFIDENTIAL' ? '#ef4444' : '#10b981') : undefined,
                          fontSize: ann.fontSize ? `${ann.fontSize * (zoomScale / 1.4)}px` : undefined,
                          fontFamily: ann.fontFamily,
                        }}
                        onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (ann.type === 'text') setEditingAnnotationId(ann.id);
                        }}
                      >
                        {ann.type === 'text' && (
                          isEditingThis ? (
                            <input
                              ref={inlineInputRef}
                              type="text"
                              className="pdf-inline-text-editor"
                              value={ann.text}
                              onChange={(e) => handleUpdateAnnotationText(ann.id, e.target.value)}
                              onBlur={() => setEditingAnnotationId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setEditingAnnotationId(null);
                                }
                              }}
                              style={{
                                fontSize: ann.fontSize ? `${ann.fontSize * (zoomScale / 1.4)}px` : undefined,
                                fontFamily: ann.fontFamily,
                                color: ann.color,
                              }}
                            />
                          ) : (
                            <span>{ann.text}</span>
                          )
                        )}

                        {ann.type === 'stamp' && ann.text}

                        {ann.type === 'signature' && ann.imageDataUri && (
                          <img src={ann.imageDataUri} alt="Signature" />
                        )}

                        {/* Drag-to-Resize handle for redactions, highlights and signatures */}
                        {isSelected && (isRedact || isHighlight || ann.type === 'signature') && (
                          <div
                            className="pdf-resize-handle"
                            onMouseDown={(e) => handleResizeMouseDown(e, ann)}
                            title="Drag to resize box"
                          />
                        )}

                        <button
                          type="button"
                          className="pdf-annotation-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnnotation(ann.id);
                          }}
                          title="Delete annotation"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Export Success Guaranteed Download Card */}
          {exportSuccess && (
            <div className="pdf-export-success-card" role="region" aria-label="Download Ready">
              <div className="pdf-export-success-info">
                <CheckCircle2 size={18} className="icon-emerald" />
                <div>
                  <div className="pdf-export-success-title">{exportSuccess.filename} hazır!</div>
                  <div className="pdf-export-success-sub">Otomatik indirme başlamadıysa lütfen aşağıdaki butona tıklayın.</div>
                </div>
              </div>
              <div className="pdf-export-success-actions">
                <a
                  href={exportSuccess.url}
                  download={exportSuccess.filename}
                  className="pdf-download-btn-direct"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={14} />
                  <span>Hemen İndir</span>
                </a>
                <button
                  type="button"
                  className="pdf-view-btn-direct"
                  onClick={() => window.open(exportSuccess.url, '_blank')}
                  title="Yeni sekmede aç"
                >
                  <Eye size={14} />
                  <span>Görüntüle</span>
                </button>
                <button
                  type="button"
                  className="pdf-dismiss-btn-direct"
                  onClick={() => setExportSuccess(null)}
                  title="Kapat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Export Bar */}
          <div className="pdf-bottom-bar">
            <div className="pdf-bottom-left">
              <label className="pdf-checkbox-label">
                <input
                  type="checkbox"
                  checked={enablePageNumbers}
                  onChange={(e) => setEnablePageNumbers(e.target.checked)}
                />
                <span>Add "Page X of Y" page numbering</span>
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {pages.findIndex((p) => p.id === activePage?.id) + 1} of {pages.length} • {annotations.length} annotation{annotations.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="pdf-bottom-right">
              <Button
                variant="primary"
                size="md"
                icon={<Download size={16} />}
                onClick={handleExportPdf}
                isLoading={isExporting}
              >
                {isExporting ? 'Compiling PDF...' : 'Export & Download PDF'}
              </Button>
            </div>
          </div>

          {/* Custom Cerilas Modal for Changing Document (Inside Workspace for Fullscreen Support) */}
          <Modal
            isOpen={isChangeDocModalOpen}
            onClose={() => setIsChangeDocModalOpen(false)}
            title="Change PDF Document"
            maxWidth="440px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Are you sure you want to close the current document and load a new one? Any unsaved annotations will be cleared.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="secondary" size="md" onClick={() => setIsChangeDocModalOpen(false)}>
                  Keep Editing
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsChangeDocModalOpen(false);
                    setOriginalBytes(null);
                    setPdfjsDoc(null);
                    setPages([]);
                    setAnnotations([]);
                  }}
                >
                  Close Document
                </Button>
              </div>
            </div>
          </Modal>

          {/* Signature Modal (Inside Workspace for Fullscreen Support) */}
          <SignatureModal
            isOpen={isSignatureModalOpen}
            onClose={() => setIsSignatureModalOpen(false)}
            onSave={handleSaveSignature}
          />
        </div>
      )}

      {/* Tool SEO Divider (Standard 5rem margin) */}
      <ToolSeoDivider title="Everything You Need to Know About In-Browser PDF Editing" />

      {/* SEO & Educational Content Component */}
      <PdfEditorSeo />
    </div>
  );
}
