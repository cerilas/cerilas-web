import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bookmark, 
  Trash2, 
  ArrowRight, 
  Calendar, 
  Layers, 
  PlusCircle, 
  Check 
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
      setProjectName(`Research Study - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`);
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
      <div className="ssc-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ssc-modal-header">
          <div className="ssc-modal-header-title">
            <Bookmark size={18} />
            <span>Cerilas Research Workspace • Saved Calculations</span>
          </div>
          <button type="button" className="ssc-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="ssc-modal-body">
          {/* Save Current Calculation Form */}
          {currentCalculation && currentCalculation.result?.isValid && (
            <form onSubmit={handleSaveCurrent} className="ssc-save-current-box">
              <h4 className="ssc-save-title">Save Active Calculation</h4>
              <div className="ssc-save-input-group">
                <input
                  type="text"
                  className="ssc-input"
                  placeholder="e.g. Hypertension Pilot Study or Q4 Checkout A/B"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  maxLength={60}
                />
                <button type="submit" className="ssc-btn-primary" disabled={isSaved}>
                  {isSaved ? (
                    <>
                      <Check size={14} color="#10b981" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} />
                      <span>Save Study</span>
                    </>
                  )}
                </button>
              </div>
              <div className="ssc-current-preview-meta">
                <span>Model: {currentCalculation.modeTitle}</span>
                <span>•</span>
                <span>Sample Size: <strong>{currentCalculation.result.requiredSample.toLocaleString()}</strong></span>
              </div>
            </form>
          )}

          {/* List of Saved Calculations */}
          <div className="ssc-saved-list-wrapper">
            <h4 className="ssc-saved-list-title">Saved Studies ({studies.length})</h4>
            {studies.length === 0 ? (
              <div className="ssc-saved-empty">
                <Layers size={32} opacity={0.4} />
                <p>No saved studies in your workspace yet. Save calculations above to track multiple thesis or trial protocols.</p>
              </div>
            ) : (
              <div className="ssc-saved-items-grid">
                {studies.map((item) => (
                  <div key={item.id} className="ssc-saved-item-card">
                    <div className="ssc-saved-item-header">
                      <h5 className="ssc-saved-item-name">{item.projectName}</h5>
                      <button
                        type="button"
                        className="ssc-btn-del"
                        onClick={() => handleDelete(item.id)}
                        title="Delete calculation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="ssc-saved-item-metrics">
                      <div className="ssc-saved-metric-badge">
                        <span>Required Sample:</span>
                        <strong>{item.requiredSample?.toLocaleString() || 'N/A'}</strong>
                      </div>
                      {item.recruitmentTarget && item.recruitmentTarget > item.requiredSample && (
                        <div className="ssc-saved-metric-sub">
                          Target: {item.recruitmentTarget.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="ssc-saved-item-footer">
                      <span className="ssc-saved-date">
                        <Calendar size={12} />
                        <span>{new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                      {onLoadCalculation && (
                        <button
                          type="button"
                          className="ssc-btn-load"
                          onClick={() => {
                            onLoadCalculation(item);
                            onClose();
                          }}
                        >
                          <span>Load Model</span>
                          <ArrowRight size={12} />
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
