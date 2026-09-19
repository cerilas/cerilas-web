import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  FileDown, 
  Share2, 
  BookmarkPlus, 
  FileText, 
  Sparkles,
  Users,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function LiveResultCard({
  result,
  mode,
  modeTitle,
  assumptions = [],
  onOpenReport,
  onSaveCalculation,
  onCopyTrack,
  onDownloadTrack
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  if (!result || !result.isValid) {
    return (
      <div className="ssc-result-card ssc-result-card-empty">
        <div className="ssc-result-empty-icon">
          <AlertCircle size={32} />
        </div>
        <h3>Check Input Values</h3>
        <p>Please enter valid statistical parameters in the input panel to calculate the required sample size.</p>
        {result?.errors?.length > 0 && (
          <ul className="ssc-validation-list">
            {result.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const { requiredSample, recruitmentTarget, summary } = result;
  const hasDropout = recruitmentTarget && recruitmentTarget > requiredSample;

  const handleCopyResult = () => {
    const text = [
      `Cerilas Sample Size Calculation — ${modeTitle}`,
      `----------------------------------------`,
      `Minimum Required Sample: ${requiredSample.toLocaleString()} participants`,
      ...(hasDropout ? [`Recommended Recruitment Target: ${recruitmentTarget.toLocaleString()} participants`] : []),
      '',
      'Assumptions:',
      ...assumptions.map(a => `• ${a.label}: ${a.value}`),
      '',
      `Interpretation: ${summary}`,
      '',
      `Generated at: https://tools.cerilas.com/#/tool/sample-size-calculator`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopyTrack?.({ mode });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sample Size: ${requiredSample.toLocaleString()} (${modeTitle})`,
          text: summary,
          url
        });
        onCopyTrack?.({ mode, type: 'share' });
      } catch {
        // user cancelled or fallback
      }
    } else {
      navigator.clipboard.writeText(url);
      setShared(true);
      onCopyTrack?.({ mode, type: 'share_link' });
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleDownload = () => {
    const payload = {
      calculator: 'Cerilas Sample Size Calculator',
      mode,
      modeTitle,
      date: new Date().toISOString(),
      requiredSample,
      recruitmentTarget,
      assumptions,
      summary,
      breakdown: result.breakdown
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-size-${mode}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onDownloadTrack?.({ mode, format: 'json' });
  };

  return (
    <div className="ssc-result-card">
      <div className="ssc-result-header">
        <div className="ssc-result-eyebrow">
          <ShieldCheck size={14} />
          <span>Statistically Validated Result</span>
        </div>
        <div className="ssc-result-badge-mode">{modeTitle}</div>
      </div>

      <div className="ssc-result-main-display">
        <span className="ssc-result-label">Minimum Required Sample Size</span>
        <div className="ssc-result-number-wrap">
          <span className="ssc-result-number">{requiredSample.toLocaleString()}</span>
          <span className="ssc-result-unit">
            {mode === 'ab-test' ? 'total visitors' : 'completed responses'}
          </span>
        </div>

        {hasDropout && (
          <div className="ssc-recruitment-target-box">
            <div className="ssc-recruitment-target-info">
              <span className="ssc-rec-label">Recommended Recruitment Target:</span>
              <span className="ssc-rec-sub">Adjusted for anticipated dropout / non-response</span>
            </div>
            <div className="ssc-rec-val-wrap">
              <span className="ssc-rec-val">{recruitmentTarget.toLocaleString()}</span>
              <span className="ssc-rec-val-unit">to invite</span>
            </div>
          </div>
        )}

        {result.samplePerGroup && (
          <div className="ssc-group-split-pills">
            <span className="ssc-split-pill">
              Group 1: <strong>{result.samplePerGroup.toLocaleString()}</strong>
            </span>
            <span className="ssc-split-pill">
              Group 2: <strong>{(result.sampleGroup2 || result.samplePerGroup).toLocaleString()}</strong>
            </span>
          </div>
        )}

        {result.samplePerVariant && (
          <div className="ssc-group-split-pills">
            <span className="ssc-split-pill">
              Per Variant: <strong>{result.samplePerVariant.toLocaleString()}</strong>
            </span>
            {result.durationDays && (
              <span className="ssc-split-pill highlight">
                Est. Duration: <strong>{result.durationDays} days</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Assumptions List */}
      <div className="ssc-assumptions-section">
        <h4 className="ssc-assumptions-title">Based on your parameters:</h4>
        <div className="ssc-assumptions-grid">
          {assumptions.map((item, idx) => (
            <div key={idx} className="ssc-assumption-chip">
              <span className="ssc-assumption-key">{item.label}:</span>
              <span className="ssc-assumption-val">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plain-English Explanation */}
      <div className="ssc-explanation-box">
        <p className="ssc-explanation-text">
          {summary}
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="ssc-result-actions">
        <button 
          type="button" 
          className="ssc-action-btn" 
          onClick={handleCopyResult}
        >
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy Result'}</span>
        </button>

        <button 
          type="button" 
          className="ssc-action-btn" 
          onClick={handleShare}
        >
          {shared ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
          <span>{shared ? 'Link Copied' : 'Share'}</span>
        </button>

        <button 
          type="button" 
          className="ssc-action-btn" 
          onClick={handleDownload}
        >
          <FileDown size={14} />
          <span>Download JSON</span>
        </button>

        <button 
          type="button" 
          className="ssc-action-btn ssc-action-btn-save" 
          onClick={onSaveCalculation}
        >
          <BookmarkPlus size={14} />
          <span>Save to Workspace</span>
        </button>
      </div>

      {/* Pro Export Banner */}
      <div className="ssc-report-banner">
        <div className="ssc-report-banner-left">
          <FileText size={16} />
          <div>
            <strong>Export Research Report</strong>
            <span>Generate an audit-ready PDF/print report with formulas and citations.</span>
          </div>
        </div>
        <button 
          type="button" 
          className="ssc-btn-report" 
          onClick={onOpenReport}
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
