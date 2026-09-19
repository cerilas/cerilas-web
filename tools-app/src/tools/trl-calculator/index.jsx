import { useState, useMemo, useCallback } from 'react';
import { 
  GitCommit, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Layers, 
  Compass, 
  Award, 
  Users, 
  Activity, 
  ShieldCheck, 
  FlaskConical,
  ExternalLink,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { trlCalculatorManifest } from './manifest';
import { 
  TRL_FRAMEWORKS, 
  TRL_LEVELS, 
  ASSESSMENT_QUESTIONS, 
  GRANT_FUNDING_PROGRAMS, 
  PRESET_PROJECTS, 
  calculateTrlAssessment 
} from './trlEngine';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Badge, ToolHeader } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import TrlCalculatorSeo from './components/TrlCalculatorSeo';
import './trl-calculator.css';

export default function TrlCalculator({ onBack, toolMeta }) {
  const {
    trackUse,
    trackDownload,
    trackCopy,
    visitorCount,
    conversionCount,
    getConversionLabel
  } = useToolAnalytics(trlCalculatorManifest.slug, toolMeta);

  const [projectName, setProjectName] = useState('My R&D Project');
  const [selectedFramework, setSelectedFramework] = useState('horizon-europe');
  const [viewMode, setViewMode] = useState('questionnaire'); // 'questionnaire' | 'matrix' | 'roadmap' | 'grants'
  const [copied, setCopied] = useState(false);

  // Answers map: { [questionId]: 0 | 1 | 2 }
  const [answers, setAnswers] = useState(() => {
    // Default to TRL 3 baseline for quick initial view
    const initial = {};
    ASSESSMENT_QUESTIONS.forEach((q) => {
      initial[q.id] = q.targetTrl <= 2 ? 2 : q.targetTrl === 3 ? 1 : 0;
    });
    return initial;
  });

  // Calculate assessment
  const assessment = useMemo(() => {
    return calculateTrlAssessment(answers, selectedFramework);
  }, [answers, selectedFramework]);

  // Current level data
  const currentLevelData = useMemo(() => {
    const lvl = Math.max(1, assessment.strictTrl);
    return TRL_LEVELS.find((l) => l.level === lvl) || TRL_LEVELS[0];
  }, [assessment.strictTrl]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
    trackUse?.({ action: 'answer_question', questionId, value });
  };

  const loadPreset = (preset) => {
    setSelectedFramework(preset.framework);
    setAnswers(preset.answers);
    setProjectName(preset.name);
    trackUse?.({ action: 'load_preset', presetId: preset.id });
  };

  const handleReset = () => {
    const fresh = {};
    ASSESSMENT_QUESTIONS.forEach((q) => {
      fresh[q.id] = 0;
    });
    setAnswers(fresh);
    setProjectName('My R&D Project');
    trackUse?.({ action: 'reset' });
  };

  // Copy Executive Markdown Summary
  const handleCopyReport = () => {
    const report = `# Technology Readiness Level (TRL) Assessment Report
**Project Name:** ${projectName}
**Standard Framework:** ${assessment.activeFramework.name} (${assessment.activeFramework.badge})
**Assessment Date:** ${new Date().toLocaleDateString()}

## Executive Summary
- **Validated Strict TRL:** TRL ${assessment.strictTrl} (${currentLevelData.title})
- **Overall Technological Maturity:** ${assessment.overallReadiness}%
- **Next Milestone Progress:** ${assessment.nextLevelProgress}% towards TRL ${assessment.nextLevel}
- **Phase:** ${currentLevelData.phase}

## Key Deliverables Completed
${currentLevelData.deliverables.map((d) => `- [x] ${d}`).join('\n')}

## Critical Gaps to Reach TRL ${assessment.nextLevel}
${assessment.gaps.length === 0 ? '- None identified! Ready for next stage.' : assessment.gaps.map((g) => `- [ ] ${g.actionRequired}`).join('\n')}

## Matched Grant & Funding Programs (${assessment.eligibleGrants.length} calls)
${assessment.eligibleGrants.map((gr) => `- **${gr.name}** (${gr.provider}) - ${gr.grantType} [Budget: ${gr.budget}]`).join('\n')}

---
*Evaluated using Cerilas TRL Calculator (https://tools.cerilas.com/#/tool/trl-calculator)*
`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    trackCopy?.({ format: 'markdown' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Export JSON Report
  const handleExportJson = () => {
    const jsonReport = {
      evaluatedAt: new Date().toISOString(),
      projectName,
      framework: assessment.activeFramework,
      strictTrl: assessment.strictTrl,
      nextLevel: assessment.nextLevel,
      nextLevelProgress: assessment.nextLevelProgress,
      overallReadiness: assessment.overallReadiness,
      levelDetails: currentLevelData,
      gaps: assessment.gaps,
      eligibleGrants: assessment.eligibleGrants,
      answers
    };

    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trl-assessment-${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackDownload?.({ format: 'json' });
  };

  return (
    <div className="trl-container">
      {/* Cerilas Standardized ToolHeader */}
      <ToolHeader
        title={trlCalculatorManifest.title}
        subtitle={trlCalculatorManifest.shortDescription}
        onBack={onBack}
        slug={trlCalculatorManifest.slug}
        badges={
          <>
            {visitorCount > 0 && (
              <Badge variant="blue" icon={<Users size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="brand" icon={<Activity size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel()}
              </Badge>
            )}
            <Badge variant="neutral" icon={<FlaskConical size={12} strokeWidth={2} />}>
              R&D & Grants
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              100% Client-Side
            </Badge>
          </>
        }
      />

      {/* Framework & Preset Selector Top Controls */}
      <div className="trl-top-controls">
        <div className="trl-control-group">
          <div className="trl-group-label">
            <Layers size={14} />
            <span>Target Standard Framework:</span>
          </div>
          <div className="trl-pill-group">
            {TRL_FRAMEWORKS.map((fw) => (
              <button
                key={fw.id}
                type="button"
                className={`trl-framework-btn ${selectedFramework === fw.id ? 'active' : ''}`}
                onClick={() => setSelectedFramework(fw.id)}
              >
                <span>{fw.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="trl-control-group">
          <div className="trl-group-label">
            <Bookmark size={14} />
            <span>Load Reference Project Presets:</span>
          </div>
          <div className="trl-pill-group">
            {PRESET_PROJECTS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="trl-preset-pill"
                onClick={() => loadPreset(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Summary Dashboard */}
      <div className="trl-dashboard">
        <div className="trl-badge-block">
          <span className="trl-level-number">TRL {assessment.strictTrl}</span>
          <div className="trl-level-name">{currentLevelData.title}</div>
          <span className="trl-phase-pill">{currentLevelData.phase} Phase</span>
        </div>

        <div className="trl-dashboard-details">
          <div className="trl-progress-section">
            <div className="trl-progress-header">
              <span>
                Roadmap to <strong>TRL {assessment.nextLevel}</strong>
              </span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                {assessment.nextLevelProgress}%
              </span>
            </div>
            <div className="trl-progress-track">
              <div
                className="trl-progress-fill"
                style={{ width: `${Math.min(100, assessment.nextLevelProgress)}%` }}
              />
            </div>
          </div>

          <div className="trl-metrics-row">
            <div className="trl-metric-box">
              <span className="trl-metric-value">{assessment.strictTrl} / 9</span>
              <span className="trl-metric-label">Strict Validated TRL</span>
            </div>
            <div className="trl-metric-box">
              <span className="trl-metric-value">{assessment.overallReadiness}%</span>
              <span className="trl-metric-label">Overall Maturity Score</span>
            </div>
            <div className="trl-metric-box">
              <span className="trl-metric-value" style={{ color: assessment.gaps.length > 0 ? '#f59e0b' : '#10b981' }}>
                {assessment.gaps.length}
              </span>
              <span className="trl-metric-label">Milestone Gaps to Advance</span>
            </div>
          </div>

          <div className="trl-dash-actions">
            <button
              type="button"
              className="trl-btn trl-btn-primary"
              onClick={handleCopyReport}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied Summary!' : 'Copy Executive Report'}</span>
            </button>

            <button
              type="button"
              className="trl-btn trl-btn-secondary"
              onClick={handleExportJson}
            >
              <Download size={14} />
              <span>Export Audit (JSON)</span>
            </button>

            <button
              type="button"
              className="trl-btn trl-btn-secondary"
              onClick={handleReset}
              title="Reset all questions to zero"
            >
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="trl-tabs-bar">
        <button
          type="button"
          className={`trl-tab-item ${viewMode === 'questionnaire' ? 'active' : ''}`}
          onClick={() => setViewMode('questionnaire')}
        >
          <GitCommit size={15} />
          <span>Diagnostic Questionnaire</span>
          <span className="trl-tab-badge">{ASSESSMENT_QUESTIONS.length}</span>
        </button>

        <button
          type="button"
          className={`trl-tab-item ${viewMode === 'matrix' ? 'active' : ''}`}
          onClick={() => setViewMode('matrix')}
        >
          <Layers size={15} />
          <span>9-Level Criteria Matrix</span>
        </button>

        <button
          type="button"
          className={`trl-tab-item ${viewMode === 'roadmap' ? 'active' : ''}`}
          onClick={() => setViewMode('roadmap')}
        >
          <Compass size={15} />
          <span>Gap Analysis & Roadmap</span>
          {assessment.gaps.length > 0 && (
            <span className="trl-tab-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
              {assessment.gaps.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`trl-tab-item ${viewMode === 'grants' ? 'active' : ''}`}
          onClick={() => setViewMode('grants')}
        >
          <Award size={15} />
          <span>Matched Grant Calls</span>
          <span className="trl-tab-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
            {assessment.eligibleGrants.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Diagnostic Questionnaire */}
      {viewMode === 'questionnaire' && (
        <div className="trl-questions-panel">
          {ASSESSMENT_QUESTIONS.map((q, idx) => {
            const currentVal = answers[q.id] !== undefined ? answers[q.id] : 0;
            return (
              <div key={q.id} className="trl-question-card">
                <div className="trl-q-header">
                  <div className="trl-q-title-wrap">
                    <div className="trl-q-meta">
                      <span className="trl-q-trl-badge">Gate TRL {q.targetTrl}</span>
                      <span className="trl-q-phase-name">{q.phase}</span>
                    </div>
                    <p className="trl-q-text">{q.question}</p>
                    <p className="trl-q-help">{q.helpText}</p>
                  </div>
                </div>

                <div className="trl-choices-group">
                  <button
                    type="button"
                    className={`trl-choice-btn ${currentVal === 0 ? 'active-no' : ''}`}
                    onClick={() => handleAnswerChange(q.id, 0)}
                  >
                    <AlertCircle size={14} />
                    <span>No / Not Started</span>
                  </button>

                  <button
                    type="button"
                    className={`trl-choice-btn ${currentVal === 1 ? 'active-partial' : ''}`}
                    onClick={() => handleAnswerChange(q.id, 1)}
                  >
                    <HelpCircle size={14} />
                    <span>Partially Verified</span>
                  </button>

                  <button
                    type="button"
                    className={`trl-choice-btn ${currentVal === 2 ? 'active-yes' : ''}`}
                    onClick={() => handleAnswerChange(q.id, 2)}
                  >
                    <CheckCircle2 size={14} />
                    <span>Yes / Validated</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: 9-Level Criteria Matrix */}
      {viewMode === 'matrix' && (
        <div className="trl-matrix-grid">
          {TRL_LEVELS.map((lvl) => {
            const scoreData = assessment.levelScores[lvl.level];
            const statusClass = `status-${scoreData?.status || 'missing'}`;
            return (
              <div key={lvl.level} className={`trl-matrix-card ${statusClass}`}>
                <div>
                  <div className="trl-m-header">
                    <span className="trl-m-badge" style={{ background: lvl.color }}>
                      TRL {lvl.level}
                    </span>
                    <span className={`trl-m-status ${scoreData?.status}`}>
                      {scoreData?.status === 'validated' ? 'Validated' : scoreData?.status === 'in-progress' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                  <h4 className="trl-m-title" style={{ marginTop: '0.6rem' }}>{lvl.title}</h4>
                  <p className="trl-m-summary" style={{ marginTop: '0.35rem' }}>{lvl.summary}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    <span>Gate Criteria Met</span>
                    <strong>{scoreData?.percentage || 0}%</strong>
                  </div>
                  <div className="trl-progress-track" style={{ height: '6px' }}>
                    <div
                      className="trl-progress-fill"
                      style={{
                        width: `${scoreData?.percentage || 0}%`,
                        background: scoreData?.status === 'validated' ? '#10b981' : scoreData?.status === 'in-progress' ? '#f59e0b' : '#64748b'
                      }}
                    />
                  </div>

                  <div className="trl-m-deliverables">
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>Required Deliverables:</strong>
                    <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                      {lvl.deliverables.slice(0, 2).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Gap Analysis & Roadmap */}
      {viewMode === 'roadmap' && (
        <div className="trl-gap-panel">
          {assessment.gaps.length === 0 ? (
            <div className="trl-question-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <CheckCircle2 size={40} style={{ color: '#10b981', margin: '0 auto 1rem auto' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>No Immediate Milestone Gaps!</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Your technology fulfills all core criteria for TRL {assessment.strictTrl}. You are ready for formal qualification or commercial operations.
              </p>
            </div>
          ) : (
            assessment.gaps.map((gap) => (
              <div key={gap.id} className="trl-gap-card">
                <div className="trl-gap-header">
                  <span>Prerequisite to Reach TRL {gap.level}</span>
                  <span style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                    Status: {gap.currentStatus}
                  </span>
                </div>
                <h4 className="trl-gap-action">{gap.actionRequired}</h4>
                <p className="trl-gap-advice">{gap.helpText}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: Grant Funding Matcher */}
      {viewMode === 'grants' && (
        <div className="trl-grants-grid">
          {assessment.eligibleGrants.length === 0 ? (
            <div className="trl-question-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1.5rem' }}>
              <AlertCircle size={40} style={{ color: '#f59e0b', margin: '0 auto 1rem auto' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>No Direct Grants for Current Stage</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Advance your technical proof of concept or review national commercialization loans.
              </p>
            </div>
          ) : (
            assessment.eligibleGrants.map((grant) => (
              <div key={grant.id} className="trl-grant-card">
                <div className="trl-grant-head">
                  <div>
                    <h4 className="trl-grant-name">{grant.name}</h4>
                    <span className="trl-grant-provider">{grant.provider}</span>
                  </div>
                  <span className="trl-grant-trl-pill">
                    TRL {grant.minTrl}–{grant.maxTrl} Eligible
                  </span>
                </div>

                <p className="trl-grant-desc">{grant.description}</p>

                <div className="trl-grant-budget">
                  <span>{grant.grantType}</span>
                  <span style={{ color: '#10b981' }}>{grant.budget}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Cerilas SEO Section with FAQ and Standards Table */}
      <ToolSeoDivider />
      <TrlCalculatorSeo />
    </div>
  );
}
