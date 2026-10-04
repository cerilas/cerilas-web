import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Loader2, 
  Check, 
  Copy, 
  Globe, 
  FileText, 
  Sparkles, 
  Link2, 
  TrendingUp, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import GrowthFavicon from './GrowthFavicon';
import './GrowthDeleteWorkspaceModal.css';

export default function GrowthDeleteWorkspaceModal({
  isOpen,
  onClose,
  workspace,
  token,
  onSuccess
}) {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const isTr = typeof window !== 'undefined' && (
    localStorage.getItem('preferred_language') === 'tr' ||
    (navigator.language && navigator.language.startsWith('tr'))
  );

  const workspaceName = workspace?.name || 'Workspace';
  const targetDomain = workspace?.primary_domain || workspace?.canonical_url || '';
  const confirmationTarget = workspaceName;

  // Validation: user can type either the brand name OR the domain
  const normalize = (str) => (str || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
  const inputNorm = normalize(confirmInput);
  const targetNorm = normalize(confirmationTarget);
  const domainNorm = normalize(targetDomain);
  const isMatch = Boolean(inputNorm && (inputNorm === targetNorm || (domainNorm && inputNorm === domainNorm)));

  useEffect(() => {
    if (isOpen) {
      setConfirmInput('');
      setIsDeleting(false);
      setErrorMsg('');
      setCopied(false);
      // Focus input after modal mount animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !workspace || typeof document === 'undefined') {
    return null;
  }

  const handleCopyAndFill = () => {
    setConfirmInput(confirmationTarget);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(confirmationTarget).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    inputRef.current?.focus();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!isMatch || isDeleting) return;

    setIsDeleting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/growth/workspaces/${workspace.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || (isTr ? 'Çalışma alanı silinemedi.' : 'Failed to delete workspace.'));
      }

      if (onSuccess) {
        await onSuccess(workspace);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || (isTr ? 'Bilinmeyen bir hata oluştu.' : 'An unexpected error occurred.'));
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div 
      className="growth-delete-modal-backdrop"
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="growth-delete-modal-title"
    >
      <div 
        className="growth-delete-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Danger Aura */}
        <div className="growth-delete-modal-header">
          <div className="growth-delete-header-top">
            <div className="growth-delete-header-badge-wrap">
              <div className="growth-delete-modal-icon-badge">
                <Trash2 size={20} />
              </div>
              <span className="growth-delete-pill">
                <ShieldAlert size={12} />
                <span>{isTr ? 'Kalıcı İşlem' : 'Permanent Action'}</span>
              </span>
            </div>

            <button
              type="button"
              className="growth-delete-modal-close-btn"
              onClick={onClose}
              disabled={isDeleting}
              aria-label={isTr ? 'Kapat' : 'Close'}
            >
              <X size={16} />
            </button>
          </div>

          <h2 id="growth-delete-modal-title" className="growth-delete-modal-title">
            {isTr ? 'Çalışma Alanını Kalıcı Olarak Sil' : 'Permanently Delete Workspace'}
          </h2>
          <p className="growth-delete-modal-subtitle">
            {isTr 
              ? 'Bu işlem geri alınamaz. Bu markaya ve web sitesine ait tüm analizler, geçmiş veriler ve telemetri bağlantıları anında silinir.'
              : 'This action is irreversible. All crawl data, GEO AI rankings, and telemetry feeds for this website will be permanently purged.'}
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleDelete} className="growth-delete-modal-body">
          {/* Target Workspace Preview */}
          <div className="growth-delete-target-preview">
            <div className="growth-delete-target-info">
              <div className="growth-delete-target-fav-box">
                <GrowthFavicon
                  src={workspace?.favicon_url}
                  domain={targetDomain}
                  name={workspaceName}
                  size={22}
                />
              </div>
              <div className="growth-delete-target-meta">
                <span className="growth-delete-target-name">{workspaceName}</span>
                <span className="growth-delete-target-domain">
                  <Globe size={11} />
                  <span>{targetDomain || (isTr ? 'Alan adı belirtilmedi' : 'No domain specified')}</span>
                </span>
              </div>
            </div>

            <span className="growth-delete-target-tag">
              {workspace?.growth_score ? `Score: ${workspace.growth_score}` : (isTr ? 'Aktif Marka' : 'Active Brand')}
            </span>
          </div>

          {/* Impact Warning Breakdown */}
          <div className="growth-delete-impact-card">
            <h4 className="growth-delete-impact-title">
              <AlertTriangle size={14} className="growth-delete-impact-icon" />
              <span>{isTr ? 'Kalıcı Olarak Yok Edilecek Veriler:' : 'The following records will be permanently erased:'}</span>
            </h4>
            <ul className="growth-delete-impact-list">
              <li className="growth-delete-impact-item">
                <FileText size={14} className="growth-delete-impact-icon" />
                <span>
                  <strong>{isTr ? 'SEO & Teknik Denetim:' : 'SEO & Technical Audits:'}</strong>{' '}
                  {isTr ? 'Taranmış tüm URL kayıtları, sayfa sorunları ve sağlık geçmişi' : 'All crawled URL status logs, issue trackers, and audit scores'}
                </span>
              </li>
              <li className="growth-delete-impact-item">
                <Sparkles size={14} className="growth-delete-impact-icon" />
                <span>
                  <strong>{isTr ? 'AI Arama Görünürlüğü (GEO):' : 'AI Visibility (GEO):'}</strong>{' '}
                  {isTr ? 'Tüm takip edilen sorgular, yapay zeka model yanıtları ve atıf skorları' : 'Tracked search prompts, synthetic engine answers, and citation telemetry'}
                </span>
              </li>
              <li className="growth-delete-impact-item">
                <Link2 size={14} className="growth-delete-impact-icon" />
                <span>
                  <strong>{isTr ? 'Google Entegrasyonları:' : 'Google Telemetry Feeds:'}</strong>{' '}
                  {isTr ? 'Search Console, Google Analytics 4 ve Google İşletme bağlantıları' : 'Connected Search Console, GA4, and Google Business Profile links'}
                </span>
              </li>
              <li className="growth-delete-impact-item">
                <TrendingUp size={14} className="growth-delete-impact-icon" />
                <span>
                  <strong>{isTr ? 'Aksiyon Akışı & Rakipler:' : 'Action Feed & Competitors:'}</strong>{' '}
                  {isTr ? 'Büyüme önerileri, görev geçmişi, rakip takibi ve rehber dizinleri' : 'Optimisation roadmaps, competitor benchmarks, and directory citations'}
                </span>
              </li>
            </ul>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="growth-delete-modal-error animate-fade">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Confirmation Input Field */}
          <div className="growth-delete-confirmation-box">
            <p className="growth-delete-confirm-label">
              {isTr ? 'Silme işlemini onaylamak için lütfen aşağıya ' : 'To confirm deletion, please type '}
              <button
                type="button"
                className="growth-delete-target-chip"
                onClick={handleCopyAndFill}
                title={isTr ? 'Kopyalamak ve doldurmak için tıklayın' : 'Click to copy and fill'}
              >
                <span>{confirmationTarget}</span>
                {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
              </button>
              {isTr ? ' yazın:' : ' below:'}
            </p>

            <div className="growth-delete-input-wrap">
              <input
                ref={inputRef}
                type="text"
                className={`growth-delete-confirm-input ${isMatch ? 'is-confirmed' : ''}`}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={isTr ? `"${confirmationTarget}" yazın` : `Type "${confirmationTarget}"`}
                disabled={isDeleting}
                autoComplete="off"
                spellCheck="false"
              />
              <div className="growth-delete-input-status-icon">
                {isMatch && <Check size={16} className="text-success" />}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="growth-delete-modal-footer">
            <button
              type="button"
              className="growth-delete-cancel-btn"
              onClick={onClose}
              disabled={isDeleting}
            >
              {isTr ? 'Vazgeç' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="growth-delete-submit-btn"
              disabled={!isMatch || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="spin" />
                  <span>{isTr ? 'Siliniyor...' : 'Deleting Workspace...'}</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>{isTr ? 'Çalışma Alanını Kalıcı Olarak Sil' : 'Permanently Delete Workspace'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
