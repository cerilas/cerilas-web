import React, { useState } from 'react';
import { Sparkles, ArrowRight, HelpCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const SAMPLE_PROMPTS = [
  'I want to compare whether patients receiving treatment A improve more than patients receiving treatment B.',
  'We are launching a customer satisfaction survey across our 50,000 active app users.',
  'Testing if our new checkout page increases the conversion rate compared to the old page.',
  'Investigating whether daily exercise duration correlates with resting heart rate in adults.',
  'Estimating average household income in a metropolitan district with 95% confidence.'
];

/**
 * Deterministic NLP classifier for study methodologies
 */
export function classifyStudyIntent(query) {
  if (!query || query.trim().length < 5) return null;
  const q = query.toLowerCase();

  // A/B test patterns
  if (
    (q.includes('a/b') || q.includes('ab test') || q.includes('split test') || q.includes('variant') || q.includes('landing page') || q.includes('checkout')) &&
    (q.includes('conversion') || q.includes('click') || q.includes('sign up') || q.includes('visitors') || q.includes('traffic'))
  ) {
    return {
      mode: 'ab-test',
      modeName: 'A/B Test',
      confidence: 'High',
      reason: 'You are running an experiment comparing user conversion rates between website or product variants (Variant A vs. Variant B).'
    };
  }

  // Two proportions comparison (binary outcomes between two groups)
  if (
    (q.includes('compare') || q.includes('difference between') || q.includes('versus') || q.includes('vs')) &&
    (q.includes('proportion') || q.includes('rate') || q.includes('percentage') || q.includes('cure rate') || q.includes('mortality') || q.includes('success rate') || q.includes('churn rate'))
  ) {
    return {
      mode: 'two-proportions',
      modeName: 'Compare Two Proportions',
      confidence: 'High',
      reason: 'You are comparing a binary percentage or event rate between two separate groups or cohorts.'
    };
  }

  // Correlation patterns
  if (
    q.includes('correlat') ||
    q.includes('association') ||
    q.includes('relationship between') ||
    q.includes('pearson') ||
    q.includes('correlate')
  ) {
    return {
      mode: 'correlation',
      modeName: 'Correlation Study',
      confidence: 'High',
      reason: 'You are measuring the linear relationship or degree of association between two continuous variables.'
    };
  }

  // Two means comparison (continuous outcome between two groups)
  if (
    (q.includes('compare') || q.includes('treatment') || q.includes('control') || q.includes('group a') || q.includes('versus') || q.includes('vs') || q.includes('improve more') || q.includes('intervention')) &&
    (q.includes('mean') || q.includes('score') || q.includes('blood pressure') || q.includes('weight') || q.includes('time') || q.includes('exam') || q.includes('continuous') || q.includes('level') || q.includes('pain') || q.includes('scale'))
  ) {
    return {
      mode: 'two-means',
      modeName: 'Compare Two Means',
      confidence: 'High',
      reason: 'You are comparing a continuous outcome (e.g., scores, biological metrics, duration) between two independent groups.'
    };
  }

  // Single Mean estimation
  if (
    q.includes('average') ||
    q.includes('mean') ||
    q.includes('standard deviation') ||
    (q.includes('estimate') && (q.includes('income') || q.includes('height') || q.includes('age') || q.includes('price') || q.includes('cost') || q.includes('time')))
  ) {
    return {
      mode: 'mean',
      modeName: 'Estimate a Mean',
      confidence: 'High',
      reason: 'You are estimating the central average value of a continuous numeric variable with a desired margin of error.'
    };
  }

  // Single Proportion estimation
  if (
    (q.includes('proportion') || q.includes('percentage') || q.includes('prevalence') || q.includes('how many people have') || q.includes('incidence')) &&
    !q.includes('survey')
  ) {
    return {
      mode: 'proportion',
      modeName: 'Estimate a Proportion',
      confidence: 'Medium',
      reason: 'You are estimating the percentage or prevalence of individuals who have a specific characteristic.'
    };
  }

  // Survey / General Population Survey
  if (
    q.includes('survey') ||
    q.includes('questionnaire') ||
    q.includes('poll') ||
    q.includes('population') ||
    q.includes('residents') ||
    q.includes('voters') ||
    q.includes('customers') ||
    q.includes('employees')
  ) {
    return {
      mode: 'survey',
      modeName: 'Survey / Population Estimate',
      confidence: 'High',
      reason: 'You are conducting a survey or poll to generalize opinions or responses across a defined target population.'
    };
  }

  // Default fallback for general comparative clinical questions
  if (q.includes('treatment') || q.includes('patient') || q.includes('therapy')) {
    return {
      mode: 'two-means',
      modeName: 'Compare Two Means',
      confidence: 'Moderate',
      reason: 'Clinical research evaluating efficacy between treatment cohorts typically uses an independent two-group comparison.'
    };
  }

  return {
    mode: 'survey',
    modeName: 'Survey / Population Estimate',
    confidence: 'Moderate',
    reason: 'For general sample size planning without a specific hypothesis test, a population survey model provides the most conservative baseline.'
  };
}

export default function SmartAssistant({ onApplyRecommendation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = (textToAnalyze) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : prompt;
    if (!text || text.trim().length < 5) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const rec = classifyStudyIntent(text);
      setRecommendation(rec);
      setIsAnalyzing(false);
    }, 180);
  };

  const handleUsePreset = (preset) => {
    setPrompt(preset);
    handleAnalyze(preset);
  };

  return (
    <div className="ssc-assistant-card">
      <div className="ssc-assistant-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="ssc-assistant-header-left">
          <div className="ssc-assistant-icon-pill">
            <Sparkles size={16} />
            <span>Smart Research Assistant</span>
          </div>
          <h3 className="ssc-assistant-headline">
            Not sure which calculator to choose?
          </h3>
          <p className="ssc-assistant-subheadline">
            Describe your research question in plain English and our statistical classifier will select the appropriate method.
          </p>
        </div>
        <button 
          type="button" 
          className="ssc-assistant-toggle-btn"
          aria-expanded={isOpen}
        >
          {isOpen ? 'Close Assistant' : 'Describe Study'}
        </button>
      </div>

      {isOpen && (
        <div className="ssc-assistant-body">
          <div className="ssc-assistant-input-wrap">
            <label htmlFor="ssc-study-desc" className="ssc-label">
              Describe your research or experiment:
            </label>
            <textarea
              id="ssc-study-desc"
              className="ssc-textarea"
              rows={3}
              placeholder="Example: I want to compare whether patients receiving treatment A improve more than patients receiving treatment B..."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (recommendation) setRecommendation(null);
              }}
            />
            
            <div className="ssc-assistant-actions">
              <div className="ssc-presets-wrap">
                <span className="ssc-presets-label">Try example:</span>
                <div className="ssc-presets-list">
                  {SAMPLE_PROMPTS.slice(0, 3).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="ssc-preset-chip"
                      onClick={() => handleUsePreset(p)}
                    >
                      {idx === 0 ? 'Clinical Trial' : idx === 1 ? 'User Survey' : 'A/B Test'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="ssc-btn-primary ssc-btn-analyze"
                disabled={prompt.trim().length < 5 || isAnalyzing}
                onClick={() => handleAnalyze()}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={14} className="ssc-spin" />
                    <span>Analyzing methodology...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Recommend Calculator</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {recommendation && (
            <div className="ssc-recommendation-box">
              <div className="ssc-rec-header">
                <div className="ssc-rec-badge">
                  <CheckCircle2 size={16} />
                  <span>Recommended Calculator: <strong>{recommendation.modeName}</strong></span>
                </div>
                <span className="ssc-rec-confidence">
                  {recommendation.confidence} Confidence
                </span>
              </div>
              <p className="ssc-rec-reason">
                {recommendation.reason}
              </p>
              <div className="ssc-rec-footer">
                <button
                  type="button"
                  className="ssc-btn-apply-rec"
                  onClick={() => {
                    onApplyRecommendation(recommendation.mode);
                    setIsOpen(false);
                  }}
                >
                  <span>Use This Calculator</span>
                  <ArrowRight size={14} />
                </button>
                <span className="ssc-rec-disclaimer">
                  Calculations will run deterministically according to exact statistical formulas.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
