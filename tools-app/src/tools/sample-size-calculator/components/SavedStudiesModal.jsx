import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bookmark, 
  Trash2, 
  ArrowRight, 
  Calendar, 
  Layers, 
  PlusCircle, 
  Check,
  FolderOpen,
  Sparkles,
  Users,
  Activity,
  ArrowUpRight
} from 'lucide-react';

const STORAGE_KEY = 'cerilas_saved_sample_size_calculations_v1';

export function getSavedCalculations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCalculation(calc) {
  try {
    const existing = getSavedCalculations();
    const updated = [
      {
        id: 'calc_' + Date.now(),
        savedAt: new Date().toISOString(),
        ...calc
      },
      ...existing
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save study calculation', e);
    return [];
  }
}

export function deleteSavedCalculation(id) {
  try {
    const existing = getSavedCalculations();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export default function SavedStudiesModal({
  isOpen,
  onClose,
  currentCalculation,
  onLoadCalculation
}) {
  const [studies, setStudies] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStudies(getSavedCalculations());
      setIsSaved(false);
      setProjectName(`Study - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = (e) => {
    e.preventDefault();
    if (!currentCalculation) return;

    const payload = {
      projectName: projectName.trim() || 'Untitled Study',
      mode: currentCalculation.mode,
      modeTitle: currentCalculation.modeTitle,
      requiredSample: currentCalculation.result.requiredSample,
      recruitmentTarget: currentCalculation.result.recruitmentTarget,
      inputs: currentCalculation.inputs,
      assumptions: currentCalculation.assumptions,
      summary: currentCalculation.result.summary
    };

    const updated = saveCalculation(payload);
    setStudies(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDelete = (id) => {
    const updated = deleteSavedCalculation(id);
    setStudies(updated);
  };

  return (
    <div className="ssc-modal-backdrop" onClick={onClose}>
      <div className="ssc-modal-card ssc-workspace-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Premium Header */}
        <div className="ssc-modal-header">
          <div className="ssc-modal-header-brand">
            <div className="ssc-modal-header-icon-box">
              <Bookmark size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="ssc-modal-header-title-text">Saved Studies & Workspace</h3>
              <p className="ssc-modal-header-sub-text">
                Manage, export, and reload your saved sample size calculations
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="ssc-modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ssc-modal-body ssc-workspace-modal-body">
          {/* Save Active Calculation Action Panel */}
          {currentCalculation && currentCalculation.result?.isValid && (
            <div className="ssc-save-current-panel">
              <div className="ssc-save-panel-header">
                <div className="ssc-save-panel-badge-row">
                  <span className="ssc-save-panel-eyebrow">Active Model</span>
                  <span className="ssc-save-panel-mode-tag">{currentCalculation.modeTitle}</span>
                </div>
                <div className="ssc-save-panel-metric">
                  <span className="ssc-save-metric-label">Required Sample:</span>
                  <span className="ssc-save-metric-val">
                    {currentCalculation.result.requiredSample?.toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveCurrent} className="ssc-save-form">
                <div className="ssc-save-input-row">
                  <input
                    type="text"
                    className="ssc-save-input"
                    placeholder="Enter project or protocol name (e.g. Hypertension Phase II Trial)"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    maxLength={60}
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="ssc-save-submit-btn" 
                    disabled={isSaved}
                  >
                    {isSaved ? (
                      <>
                        <Check size={16} strokeWidth={2.5} />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle size={16} strokeWidth={2} />
                        <span>Save to Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Saved Calculations */}
          <div className="ssc-saved-section">
            <div className="ssc-saved-section-header">
              <div className="ssc-saved-section-title-wrap">
                <FolderOpen size={17} />
                <h4 className="ssc-saved-section-title">Saved Calculations</h4>
              </div>
              <span className="ssc-saved-count-badge">
                {studies.length} {studies.length === 1 ? 'Study' : 'Studies'}
              </span>
            </div>

            {studies.length === 0 ? (
              <div className="ssc-saved-empty-card">
                <div className="ssc-empty-icon-wrap">
                  <Layers size={28} strokeWidth={1.8} />
                </div>
                <h5 className="ssc-empty-title">No studies saved yet</h5>
                <p className="ssc-empty-desc">
                  Save your active calculation above to store model parameters, recruitment targets, and statistical assumptions for your research protocol.
                </p>
              </div>
            ) : (
              <div className="ssc-saved-grid">
                {studies.map((item) => (
                  <div key={item.id} className="ssc-study-card">
                    <div className="ssc-study-card-top">
                      <div className="ssc-study-card-header">
                        <span className="ssc-study-mode-pill">{item.modeTitle}</span>
                        <button
                          type="button"
                          className="ssc-study-delete-btn"
                          onClick={() => handleDelete(item.id)}
                          title="Delete saved study"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <h5 className="ssc-study-title">{item.projectName}</h5>
                    </div>

                    <div className="ssc-study-card-middle">
                      <div className="ssc-study-stat-box">
                        <span className="ssc-study-stat-label">Required Sample</span>
                        <div className="ssc-study-stat-num-row">
                          <span className="ssc-study-stat-num">
                            {item.requiredSample ? Number(item.requiredSample).toLocaleString() : 'N/A'}
                          </span>
                          <span className="ssc-study-stat-unit">subjects</span>
                        </div>
                      </div>

                      {item.recruitmentTarget && item.recruitmentTarget > item.requiredSample && (
                        <div className="ssc-study-target-box">
                          <span className="ssc-study-target-label">Recruitment Target</span>
                          <span className="ssc-study-target-val">
                            {Number(item.recruitmentTarget).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="ssc-study-card-bottom">
                      <div className="ssc-study-date-pill">
                        <Calendar size={12} />
                        <span>
                          {new Date(item.savedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>

                      {onLoadCalculation && (
                        <button
                          type="button"
                          className="ssc-study-load-btn"
                          onClick={() => {
                            onLoadCalculation(item);
                            onClose();
                          }}
                        >
                          <span>Load Model</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
