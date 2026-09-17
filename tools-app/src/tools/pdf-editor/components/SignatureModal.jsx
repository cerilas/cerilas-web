import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Upload, RotateCcw, Check, Image as ImageIcon } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function SignatureModal({ isOpen, onClose, onSave }) {
  const [tab, setTab] = useState('draw'); // 'draw' | 'upload'
  const [inkColor, setInkColor] = useState('#1d1d1f');
  const [lineWidth, setLineWidth] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || tab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;
  }, [isOpen, tab, inkColor, lineWidth]);

  if (!isOpen) return null;

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleStartDraw = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;
  };

  const handleDrawMove = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    lastPointRef.current = coords;
    setHasDrawn(true);
  };

  const handleEndDraw = () => {
    isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setUploadedImage(loadEvt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUri = canvas.toDataURL('image/png');
      onSave(dataUri);
    } else if (tab === 'upload' && uploadedImage) {
      onSave(uploadedImage);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Digital Signature"
      maxWidth="540px"
    >
      <div className="pdf-modal-content-wrap">
        {/* Tab switcher */}
        <div className="pdf-modal-tabs">
          <button
            type="button"
            className={`pdf-modal-tab ${tab === 'draw' ? 'active' : ''}`}
            onClick={() => setTab('draw')}
          >
            <PenTool size={14} />
            <span>Draw Signature</span>
          </button>
          <button
            type="button"
            className={`pdf-modal-tab ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => setTab('upload')}
          >
            <Upload size={14} />
            <span>Upload Image</span>
          </button>
        </div>

        {tab === 'draw' ? (
          <div className="pdf-draw-container">
            {/* Draw settings toolbar */}
            <div className="pdf-draw-toolbar">
              <div className="pdf-color-pills">
                <button
                  type="button"
                  className={`color-dot ${inkColor === '#1d1d1f' ? 'active' : ''}`}
                  style={{ backgroundColor: '#1d1d1f' }}
                  onClick={() => setInkColor('#1d1d1f')}
                  title="Black ink"
                />
                <button
                  type="button"
                  className={`color-dot ${inkColor === '#2563eb' ? 'active' : ''}`}
                  style={{ backgroundColor: '#2563eb' }}
                  onClick={() => setInkColor('#2563eb')}
                  title="Blue ink"
                />
                <button
                  type="button"
                  className={`color-dot ${inkColor === '#dc2626' ? 'active' : ''}`}
                  style={{ backgroundColor: '#dc2626' }}
                  onClick={() => setInkColor('#dc2626')}
                  title="Red ink"
                />
              </div>

              <div className="pdf-line-pills">
                {[2, 3, 5].map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`line-btn ${lineWidth === w ? 'active' : ''}`}
                    onClick={() => setLineWidth(w)}
                  >
                    {w === 2 ? 'Fine' : w === 3 ? 'Medium' : 'Bold'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="pdf-clear-btn"
                onClick={handleClearCanvas}
                title="Clear signature"
              >
                <RotateCcw size={13} />
                <span>Clear</span>
              </button>
            </div>

            {/* Drawing Canvas */}
            <div className="pdf-canvas-wrap">
              <canvas
                ref={canvasRef}
                width={500}
                height={190}
                className="pdf-signature-canvas"
                onMouseDown={handleStartDraw}
                onMouseMove={handleDrawMove}
                onMouseUp={handleEndDraw}
                onMouseLeave={handleEndDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleEndDraw}
              />
              {!hasDrawn && (
                <div className="pdf-signature-placeholder">
                  <span>Sign your name here with mouse or touchscreen</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pdf-upload-container">
            <label className="pdf-sig-upload-box">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {uploadedImage ? (
                <div className="pdf-sig-preview">
                  <img src={uploadedImage} alt="Signature preview" />
                  <span className="change-img-text">Click to choose another signature image</span>
                </div>
              ) : (
                <div className="pdf-upload-idle">
                  <ImageIcon size={32} className="upload-icon" />
                  <span className="upload-title">Choose signature image file</span>
                  <span className="upload-sub">Supports transparent PNG or JPEG</span>
                </div>
              )}
            </label>
          </div>
        )}

        <div className="pdf-modal-footer">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Check size={16} />}
            onClick={handleConfirm}
            disabled={tab === 'draw' ? !hasDrawn : !uploadedImage}
          >
            Apply to PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
