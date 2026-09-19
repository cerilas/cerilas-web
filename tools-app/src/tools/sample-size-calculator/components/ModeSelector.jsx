import React from 'react';
import { 
  Users, 
  Percent, 
  TrendingUp, 
  GitCompare, 
  Scale, 
  Activity, 
  Split 
} from 'lucide-react';

export const MODES = [
  {
    id: 'survey',
    title: 'Survey / Population Estimate',
    shortTitle: 'Survey / Population',
    icon: Users,
    desc: 'Calculate sample size based on population size, confidence level, and margin of error.',
    tag: 'Surveys & Polls'
  },
  {
    id: 'proportion',
    title: 'Estimate a Proportion',
    shortTitle: 'Estimate Proportion',
    icon: Percent,
    desc: 'Estimating the percentage of people with a specific characteristic or outcome.',
    tag: 'Prevalence & Polls'
  },
  {
    id: 'mean',
    title: 'Estimate a Mean',
    shortTitle: 'Estimate Mean',
    icon: TrendingUp,
    desc: 'Estimating average continuous values such as blood pressure, income, or response time.',
    tag: 'Continuous Data'
  },
  {
    id: 'two-means',
    title: 'Compare Two Means',
    shortTitle: 'Compare Two Means',
    icon: Scale,
    desc: 'Treatment group vs. control group to detect differences with Cohen\'s d effect size.',
    tag: 'Clinical & Lab Trials'
  },
  {
    id: 'two-proportions',
    title: 'Compare Two Proportions',
    shortTitle: 'Two Proportions',
    icon: GitCompare,
    desc: 'Compare binary conversion or success rates between two independent cohorts.',
    tag: 'Comparative Rates'
  },
  {
    id: 'correlation',
    title: 'Correlation Study',
    shortTitle: 'Correlation Study',
    icon: Activity,
    desc: 'Calculate sample size required to detect a linear Pearson correlation coefficient r.',
    tag: 'Association'
  },
  {
    id: 'ab-test',
    title: 'A/B Test',
    shortTitle: 'A/B Experiment',
    icon: Split,
    desc: 'Sample size and test duration required per variant with absolute or relative MDE lift.',
    tag: 'Product & CRO'
  }
];

export default function ModeSelector({ selectedMode, onSelectMode, isCollapsed, onToggleCollapse }) {
  return (
    <div className="ssc-mode-selector-wrapper">
      <div className="ssc-mode-header">
        <div className="ssc-mode-title-group">
          <span className="ssc-section-eyebrow">Select Methodology</span>
          <h2 className="ssc-section-title">What are you trying to calculate?</h2>
        </div>
        {onToggleCollapse && (
          <button 
            type="button" 
            className="ssc-btn-text" 
            onClick={onToggleCollapse}
          >
            {isCollapsed ? 'Show All 7 Methods' : 'Compact View'}
          </button>
        )}
      </div>

      {!isCollapsed ? (
        <div className="ssc-mode-grid">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                className={`ssc-mode-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectMode(mode.id)}
              >
                <div className="ssc-mode-card-top">
                  <div className="ssc-mode-icon-box">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span className="ssc-mode-tag">{mode.tag}</span>
                </div>
                <div className="ssc-mode-card-body">
                  <h3 className="ssc-mode-card-title">{mode.title}</h3>
                  <p className="ssc-mode-card-desc">{mode.desc}</p>
                </div>
                <div className="ssc-mode-indicator">
                  <span className="ssc-radio-dot" />
                  <span className="ssc-select-text">{isSelected ? 'Active Model' : 'Select'}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="ssc-mode-tab-bar">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                className={`ssc-mode-tab ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectMode(mode.id)}
              >
                <Icon size={16} strokeWidth={2} />
                <span>{mode.shortTitle}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
