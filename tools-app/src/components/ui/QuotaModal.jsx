import React from 'react';
import { Lock, Clock, Sparkles } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import './Modal.css';

/**
 * Unified Quota Reached Modal for Cerilas AI Tools.
 * Replaces browser alerts with a polished, Apple-minimalist design.
 */
export default function QuotaModal({
  isOpen,
  onClose,
  limit = 3,
  resetInMinutes = 60,
  toolName = 'AI Tool'
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={true}>
      <div className="c-quota-content">
        <div className="c-quota-icon-wrap">
          <Lock size={28} strokeWidth={1.75} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <h3 className="c-quota-title">Hourly Limit Reached</h3>
          <p className="c-quota-desc">
            You've completed your free allowance of <strong>{limit} scans</strong> this hour for {toolName}.
          </p>
        </div>

        <div className="c-quota-timer-box">
          <Clock size={16} color="#f59e0b" />
          <span>
            Quota resets in <strong>~{resetInMinutes || 60} minute{resetInMinutes === 1 ? '' : 's'}</strong>
          </span>
        </div>

        <p className="c-quota-info-note">
          To maintain high performance and free access without subscriptions, hourly quotas are dynamically enforced across all Cerilas AI utilities.
        </p>

        <div style={{ width: '100%', marginTop: '0.5rem' }}>
          <Button
            variant="primary"
            size="md"
            style={{ width: '100%' }}
            onClick={onClose}
          >
            Understood
          </Button>
        </div>
      </div>
    </Modal>
  );
}
