import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import Modal from '../../../components/ui/Modal';

const TONES = {
  warning: { icon: AlertTriangle, className: 'is-warning' },
  danger: { icon: AlertTriangle, className: 'is-danger' },
  error: { icon: XCircle, className: 'is-danger' },
  info: { icon: Info, className: 'is-info' }
};

export default function PlannerDialog({ dialog, onClose }) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!dialog) return undefined;
    returnFocusRef.current = document.activeElement;
    const target = dialog.alertOnly || dialog.tone === 'info' ? confirmRef.current : cancelRef.current;
    const id = requestAnimationFrame(() => target?.focus());
    return () => {
      cancelAnimationFrame(id);
      returnFocusRef.current?.focus?.();
    };
  }, [dialog]);

  const trapFocus = (e) => {
    if (e.key !== 'Tab') return;
    const buttons = [cancelRef.current, confirmRef.current].filter(Boolean);
    if (buttons.length < 2) {
      e.preventDefault();
      return;
    }
    const idx = buttons.indexOf(document.activeElement);
    e.preventDefault();
    buttons[(idx + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
  };

  if (!dialog) return null;
  const tone = TONES[dialog.tone] || TONES.warning;
  const Icon = tone.icon;

  return (
    <Modal isOpen onClose={() => onClose(false)} showClose={false} maxWidth="440px">
      <div className={`tpp-dialog ${tone.className}`} onKeyDown={trapFocus} role="alertdialog" aria-labelledby="tpp-dialog-title" aria-describedby="tpp-dialog-message">
        <span className="tpp-dialog-icon" aria-hidden="true"><Icon size={22} /></span>
        <h3 id="tpp-dialog-title">{dialog.title}</h3>
        <p id="tpp-dialog-message">{dialog.message}</p>
        {dialog.details?.length > 0 && (
          <ul className="tpp-dialog-details">
            {dialog.details.map((d) => <li key={d}>{d}</li>)}
          </ul>
        )}
        <div className="tpp-dialog-actions">
          {!dialog.alertOnly && (
            <button ref={cancelRef} type="button" className="tpp-btn" onClick={() => onClose(false)}>{dialog.cancelLabel}</button>
          )}
          <button
            ref={confirmRef}
            type="button"
            className={`tpp-btn ${dialog.tone === 'danger' ? 'danger-solid' : 'primary'}`}
            onClick={() => onClose(true)}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
