import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react';

export default function CalculationBreakdown({ breakdownText, modeTitle }) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!breakdownText) return;
    navigator.clipboard.writeText(breakdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!breakdownText) return null;

  return (
    <div className="ssc-breakdown-container">
      <div 
        className="ssc-breakdown-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="ssc-breakdown-header-title">
          <Terminal size={16} />
          <span>Show Calculation & Formulas</span>
          <span className="ssc-breakdown-pill">Exact Math</span>
        </div>
        <div className="ssc-breakdown-controls">
          <button
            type="button"
            className="ssc-btn-icon-subtle"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            title="Copy calculation steps"
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <span className="ssc-toggle-icon">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="ssc-breakdown-body">
          <pre className="ssc-code-block">
            <code>{breakdownText}</code>
          </pre>
          <div className="ssc-breakdown-note">
            Sample sizes are systematically rounded upward to the nearest whole integer (⌈n⌉) to guarantee specified confidence and power thresholds are strictly met.
          </div>
        </div>
      )}
    </div>
  );
}
