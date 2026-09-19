import React, { useState } from 'react';
import { X, Printer, Copy, Check, FileText, Download, ShieldCheck } from 'lucide-react';

export default function SampleSizeReportModal({
  isOpen,
  onClose,
  calculation,
  onDownloadTrack,
  onCopyTrack
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !calculation || !calculation.result) return null;

  const { modeTitle, result, assumptions = [], inputs = {} } = calculation;
  const { requiredSample, recruitmentTarget, summary, breakdown } = result;
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePrint = () => {
    onDownloadTrack?.({ type: 'pdf_report' });
    window.print();
  };

  const handleCopyMarkdown = () => {
    const md = [
      `# Statistical Sample Size Determination Report`,
      `**Platform:** Cerilas Research Workspace (https://tools.cerilas.com)`,
      `**Date Generated:** ${currentDate}`,
      `**Methodology:** ${modeTitle}`,
      ``,
      `## 1. Executive Summary`,
      `- **Minimum Required Completed Sample Size (n):** ${requiredSample.toLocaleString()} participants`,
      ...(recruitmentTarget && recruitmentTarget > requiredSample ? [`- **Recommended Recruitment Target (with Dropout):** ${recruitmentTarget.toLocaleString()} participants`] : []),
      `- **Protocol Interpretation:** ${summary}`,
      ``,
      `## 2. Model Parameters & Statistical Assumptions`,
      ...assumptions.map(a => `- **${a.label}:** ${a.value}`),
      ``,
      `## 3. Mathematical Formula & Step-by-Step Derivation`,
      '```text',
      breakdown || '',
      '```',
      ``,
      `## 4. Scientific Compliance & Methodological Notes`,
      `- Standard sample size determination followed established statistical references (Cochran 1977, Fleiss & Levin 2003, Cohen 1988).`,
      `- Conservative parameter bounds were employed.`,
      `- Final integer sizes were rounded strictly upward (ceiling function) to preserve statistical power.`
    ].join('\n');

    navigator.clipboard.writeText(md);
    setCopied(true);
    onCopyTrack?.({ type: 'markdown_report' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ssc-modal-backdrop" onClick={onClose}>
      <div className="ssc-modal-card ssc-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ssc-modal-header ssc-no-print">
          <div className="ssc-modal-header-title">
            <FileText size={18} />
            <span>Executive Sample Size Audit Report</span>
          </div>
          <div className="ssc-report-actions-top">
            <button type="button" className="ssc-btn-icon-subtle" onClick={handleCopyMarkdown}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Markdown Copied' : 'Copy Markdown'}</span>
            </button>
            <button type="button" className="ssc-btn-primary" onClick={handlePrint}>
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button type="button" className="ssc-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="ssc-report-printable-content">
          {/* Printable Document Header */}
          <div className="ssc-print-header">
            <div className="ssc-print-brand">
              <div className="ssc-print-logo-circle">
                <span>C</span>
              </div>
              <div>
                <h1 className="ssc-print-title">Cerilas Research Workspace</h1>
                <span className="ssc-print-sub">Scientific Sample Size & Statistical Power Protocol</span>
              </div>
            </div>
            <div className="ssc-print-meta">
              <div><strong>Date:</strong> {currentDate}</div>
              <div><strong>Protocol ID:</strong> SSR-{Date.now().toString().slice(-6)}</div>
              <div><strong>Status:</strong> Validated</div>
            </div>
          </div>

          <div className="ssc-print-divider" />

          {/* Section 1: Result Hero */}
          <div className="ssc-print-section">
            <h2 className="ssc-print-heading">1. Determination Summary</h2>
            <div className="ssc-print-kpi-grid">
              <div className="ssc-print-kpi-box primary">
                <span className="ssc-print-kpi-label">Minimum Required Sample</span>
                <span className="ssc-print-kpi-val">{requiredSample.toLocaleString()}</span>
                <span className="ssc-print-kpi-sub">Completed, evaluable subjects</span>
              </div>
              {recruitmentTarget && recruitmentTarget > requiredSample && (
                <div className="ssc-print-kpi-box">
                  <span className="ssc-print-kpi-label">Recruitment Target</span>
                  <span className="ssc-print-kpi-val">{recruitmentTarget.toLocaleString()}</span>
                  <span className="ssc-print-kpi-sub">Accounts for non-response / dropout</span>
                </div>
              )}
              <div className="ssc-print-kpi-box">
                <span className="ssc-print-kpi-label">Methodology Type</span>
                <span className="ssc-print-kpi-val sm">{modeTitle}</span>
                <span className="ssc-print-kpi-sub">Deterministic power analysis</span>
              </div>
            </div>

            <div className="ssc-print-summary-box">
              <p><strong>Methodological Synthesis:</strong> {summary}</p>
            </div>
          </div>

          {/* Section 2: Parameters */}
          <div className="ssc-print-section">
            <h2 className="ssc-print-heading">2. Experimental Parameters & Assumptions</h2>
            <table className="ssc-print-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Assigned Value</th>
                  <th>Statistical Role / Description</th>
                </tr>
              </thead>
              <tbody>
                {assumptions.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.label}</strong></td>
                    <td>{item.value}</td>
                    <td>{item.desc || 'Input parameter for sample sizing model'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Derivation & Formulas */}
          <div className="ssc-print-section">
            <h2 className="ssc-print-heading">3. Step-by-Step Mathematical Derivation</h2>
            <div className="ssc-print-code-box">
              <pre><code>{breakdown}</code></pre>
            </div>
          </div>

          {/* Section 4: Regulatory & Academic References */}
          <div className="ssc-print-section">
            <h2 className="ssc-print-heading">4. Recommended Thesis / IRB Justification Statement</h2>
            <blockquote className="ssc-print-quote">
              "A statistical power and sample size determination was performed for a {modeTitle.toLowerCase()} design using standard formulas implemented by Cerilas Tools. Based on an assumed significance criterion of α = {inputs.alpha || 0.05} and desired statistical power of {((inputs.power || 0.8) * 100).toFixed(0)}%, a minimum sample size of n = {requiredSample.toLocaleString()} evaluable subjects is mathematically required to avoid Type II errors. Accounting for an anticipated attrition rate of {((inputs.dropoutRate || 0) * 100).toFixed(0)}%, a recruitment target of N = {recruitmentTarget.toLocaleString()} participants is prescribed."
            </blockquote>
          </div>

          {/* Document Footer */}
          <div className="ssc-print-footer">
            <span>Cerilas Tools • Statistical Analysis Framework • https://tools.cerilas.com</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
