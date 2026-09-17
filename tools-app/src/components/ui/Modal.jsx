import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  showClose = true,
  maxWidth = '460px'
}) {
  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div
        className="c-modal-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || showClose) && (
          <div className="c-modal-header">
            {title ? <h3 className="c-modal-title">{title}</h3> : <div />}
            {showClose && (
              <button
                type="button"
                className="c-modal-close-btn"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="c-modal-body">{children}</div>
        {footer && <div className="c-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
