import React, { useState, useMemo, useEffect } from 'react';
import {
  Scale, 
  HelpCircle, 
  Sparkles, 
  SlidersHorizontal, 
  Bookmark, 
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronRight,
  Users,
  Activity,
  ShieldCheck
} from 'lucide-react';
import ModeSelector, { MODES } from './components/ModeSelector';
import SmartAssistant from './components/SmartAssistant';
import LiveResultCard from './components/LiveResultCard';
import CalculationBreakdown from './components/CalculationBreakdown';
import SavedStudiesModal from './components/SavedStudiesModal';
import SampleSizeReportModal from './components/SampleSizeReportModal';
import SampleSizeCalculatorSeo from './components/SampleSizeCalculatorSeo';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Badge, ToolHeader } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import { sampleSizeCalculatorManifest } from './manifest';
import {
  calculateSurveySampleSize,
  calculateProportionSampleSize,
  calculateMeanSampleSize,
  calculateTwoMeansSampleSize,
  calculateTwoProportionsSampleSize,
  calculateCorrelationSampleSize,
  calculateABTestSampleSize
} from './lib/sampleSizeEngine';
import './sample-size-calculator.css';

export default function SampleSizeCalculator({ onBack, toolMeta }) {
  const {
    visitorCount,
    conversionCount,
    getConversionLabel,
    trackCopy,
    trackDownload,
    trackUse
  } = useToolAnalytics(sampleSizeCalculatorManifest.slug, toolMeta);

  // Active calculation mode: survey, proportion, mean, two-means, two-proportions, correlation, ab-test
  const [activeMode, setActiveMode] = useState('survey');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isModeCollapsed, setIsModeCollapsed] = useState(false);

  // Modals state
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 1. Survey / Population inputs
  const [surveyPopulation, setSurveyPopulation] = useState(10000);
  const [surveyIsFinite, setSurveyIsFinite] = useState(true);
  const [surveyConfidence, setSurveyConfidence] = useState(0.95);
  const [surveyMarginOfError, setSurveyMarginOfError] = useState(0.05);
  const [surveyProportion, setSurveyProportion] = useState(0.50);
  const [surveyDropout, setSurveyDropout] = useState(0.10);

  // 2. Estimate Proportion inputs
  const [propPopulation, setPropPopulation] = useState(10000);
  const [propIsFinite, setPropIsFinite] = useState(false);
  const [propConfidence, setPropConfidence] = useState(0.95);
  const [propMarginOfError, setPropMarginOfError] = useState(0.05);
  const [propExpected, setPropExpected] = useState(0.50);
  const [propDropout, setPropDropout] = useState(0.05);

  // 3. Estimate Mean inputs
  const [meanConfidence, setMeanConfidence] = useState(0.95);
  const [meanMarginOfError, setMeanMarginOfError] = useState(2);
  const [meanStdDev, setMeanStdDev] = useState(10);
  const [meanPopulation, setMeanPopulation] = useState(5000);
  const [meanIsFinite, setMeanIsFinite] = useState(false);
  const [meanDropout, setMeanDropout] = useState(0.05);

  // 4. Compare Two Means inputs
  const [twoMeansEffectSize, setTwoMeansEffectSize] = useState(0.5);
  const [twoMeansPower, setTwoMeansPower] = useState(0.80);
  const [twoMeansAlpha, setTwoMeansAlpha] = useState(0.05);
  const [twoMeansIsTwoSided, setTwoMeansIsTwoSided] = useState(true);
  const [twoMeansRatio, setTwoMeansRatio] = useState(1);
  const [twoMeansDropout, setTwoMeansDropout] = useState(0.10);

  // 5. Compare Two Proportions inputs
  const [twoPropsP1, setTwoPropsP1] = useState(0.20);
  const [twoPropsP2, setTwoPropsP2] = useState(0.30);
  const [twoPropsPower, setTwoPropsPower] = useState(0.80);
  const [twoPropsAlpha, setTwoPropsAlpha] = useState(0.05);
  const [twoPropsIsTwoSided, setTwoPropsIsTwoSided] = useState(true);
  const [twoPropsRatio, setTwoPropsRatio] = useState(1);
  const [twoPropsDropout, setTwoPropsDropout] = useState(0.10);

  // 6. Correlation Study inputs
  const [corrR, setCorrR] = useState(0.30);
  const [corrPower, setCorrPower] = useState(0.80);
  const [corrAlpha, setCorrAlpha] = useState(0.05);
  const [corrIsTwoSided, setCorrIsTwoSided] = useState(true);
  const [corrDropout, setCorrDropout] = useState(0.05);

  // 7. A/B Test inputs
  const [abBaselineCR, setAbBaselineCR] = useState(0.05);
  const [abMde, setAbMde] = useState(0.20);
  const [abMdeType, setAbMdeType] = useState('relative'); // 'relative' or 'absolute'
  const [abPower, setAbPower] = useState(0.80);
  const [abAlpha, setAbAlpha] = useState(0.05);
  const [abDailyTraffic, setAbDailyTraffic] = useState(5000);
  const [abIsTwoSided, setAbIsTwoSided] = useState(true);

  // Active mode configuration
  const activeModeMeta = useMemo(() => {
    return MODES.find((m) => m.id === activeMode) || MODES[0];
  }, [activeMode]);

  // Compute live result & assumptions dynamically based on active mode
  const { result, assumptions, inputs } = useMemo(() => {
    switch (activeMode) {
      case 'survey': {
        const res = calculateSurveySampleSize({
          populationSize: surveyPopulation,
          isFinite: surveyIsFinite,
          confidenceLevel: surveyConfidence,
          marginOfError: surveyMarginOfError,
          expectedProportion: surveyProportion,
          dropoutRate: surveyDropout
        });
        const currentInputs = {
          populationSize: surveyPopulation,
          isFinite: surveyIsFinite,
          confidenceLevel: surveyConfidence,
          marginOfError: surveyMarginOfError,
          expectedProportion: surveyProportion,
          dropoutRate: surveyDropout
        };
        const currentAssumptions = [
          { label: 'Population (N)', value: surveyIsFinite ? Number(surveyPopulation).toLocaleString() : 'Infinite / Unknown' },
          { label: 'Confidence Level', value: `${(surveyConfidence * 100).toFixed(0)}%` },
          { label: 'Margin of Error', value: `±${(surveyMarginOfError * 100).toFixed(1).replace(/\.0$/, '')}%` },
          { label: 'Expected Proportion', value: `${(surveyProportion * 100).toFixed(0)}%` },
          { label: 'Expected Non-Response', value: `${(surveyDropout * 100).toFixed(0)}%` }
        ];
        return { result: res, assumptions: currentAssumptions, inputs: currentInputs };
      }

      case 'proportion': {
        const res = calculateProportionSampleSize({
          populationSize: propPopulation,
          isFinite: propIsFinite,
          confidenceLevel: propConfidence,
          marginOfError: propMarginOfError,
          expectedProportion: propExpected,
          dropoutRate: propDropout
        });
        const currentInputs = {
          populationSize: propPopulation,
          isFinite: propIsFinite,
          confidenceLevel: propConfidence,
          marginOfError: propMarginOfError,
          expectedProportion: propExpected,
          dropoutRate: propDropout
        };
        const currentAssumptions = [
          { label: 'Confidence Level', value: `${(propConfidence * 100).toFixed(0)}%` },
          { label: 'Margin of Error', value: `±${(propMarginOfError * 100).toFixed(1).replace(/\.0$/, '')}%` },
          { label: 'Estimated Proportion', value: `${(propExpected * 100).toFixed(0)}%` },
          { label: 'Population Setting', value: propIsFinite ? `${Number(propPopulation).toLocaleString()}` : 'Infinite' },
          { label: 'Dropout Allowance', value: `${(propDropout * 100).toFixed(0)}%` }
        ];
        return { result: res, assumptions: currentAssumptions, inputs: currentInputs };
      }

      case 'mean': {
        const res = calculateMeanSampleSize({
          confidenceLevel: meanConfidence,
          marginOfError: meanMarginOfError,
          stdDev: meanStdDev,
          populationSize: meanPopulation,
          isFinite: meanIsFinite,
          dropoutRate: meanDropout
        });
        const currentInputs = {
          confidenceLevel: meanConfidence,
          marginOfError: meanMarginOfError,
          stdDev: meanStdDev,
          populationSize: meanPopulation,
          isFinite: meanIsFinite,
          dropoutRate: meanDropout
        };
        const currentAssumptions = [
          { label: 'Confidence Level', value: `${(meanConfidence * 100).toFixed(0)}%` },
          { label: 'Precision Margin (E)', value: `±${meanMarginOfError}` },
          { label: 'Expected Std Dev (σ)', value: `${meanStdDev}` },
          { label: 'Population Setting', value: meanIsFinite ? `${Number(meanPopulation).toLocaleString()}` : 'Unspecified' },
          { label: 'Dropout Allowance', value: `${(meanDropout * 100).toFixed(0)}%` }
        ];
        return { result: res, assumptions: currentAssumptions, inputs: currentInputs };
      }

      case 'two-means': {
        const res = calculateTwoMeansSampleSize({
          effectSizeD: twoMeansEffectSize,
          power: twoMeansPower,
          alpha: twoMeansAlpha,
          isTwoSided: twoMeansIsTwoSided,
          allocationRatio: twoMeansRatio,
          dropoutRate: twoMeansDropout
        });
        const currentInputs = {
          effectSizeD: twoMeansEffectSize,
          power: twoMeansPower,
          alpha: twoMeansAlpha,
          isTwoSided: twoMeansIsTwoSided,
          allocationRatio: twoMeansRatio,
          dropoutRate: twoMeansDropout
        };
        const currentAssumptions = [
          { label: "Cohen's d Effect Size", value: `${twoMeansEffectSize}` },
          { label: 'Statistical Power (1 - β)', value: `${(twoMeansPower * 100).toFixed(0)}%` },
          { label: 'Significance Level (α)', value: `${twoMeansAlpha} (${twoMeansIsTwoSided ? 'Two-sided' : 'One-sided'})` },
          { label: 'Group Allocation', value: twoMeansRatio === 1 ? '1:1 Equal' : `${twoMeansRatio}:1` },
          { label: 'Expected Dropout', value: `${(twoMeansDropout * 100).toFixed(0)}%` }
        ];
        return { result: res, assumptions: currentAssumptions, inputs: currentInputs };
      }

      case 'two-proportions': {
        const res = calculateTwoProportionsSampleSize({
          p1: twoPropsP1,
          p2: twoPropsP2,
          power: twoPropsPower,
          alpha: twoPropsAlpha,
          isTwoSided: twoPropsIsTwoSided,
          allocationRatio: twoPropsRatio,
          dropoutRate: twoPropsDropout
        });
        const currentInputs = {
          p1: twoPropsP1,
          p2: twoPropsP2,
          power: twoPropsPower,
          alpha: twoPropsAlpha,
          isTwoSided: twoPropsIsTwoSided,
          allocationRatio: twoPropsRatio,
          dropoutRate: twoPropsDropout
        };
        const currentAssumptions = [
          { label: 'Control Proportion (p₁)', value: `${(twoPropsP1 * 100).toFixed(1)}%` },
          { label: 'Treatment Proportion (p₂)', value: `${(twoPropsP2 * 100).toFixed(1)}%` },
          { label: 'Absolute Difference (Δ)', value: `${(Math.abs(twoPropsP2 - twoPropsP1) * 100).toFixed(1)}%` },
          { label: 'Power (1 - β)', value: `${(twoPropsPower * 100).toFixed(0)}%` },
          { label: 'Significance (α)', value: `${twoPropsAlpha}` },
          { label: 'Dropout Allowance', value: `${(twoPropsDropout * 100).toFixed(0)}%` }
        ];
        return { result: res, assumptions: currentAssumptions, inputs: currentInputs };
      }

      case 'correlation': {
        const res = calculateCorrelationSampleSize({
          expectedCorrelation: corrR,
          power: corrPower,
          alpha: corrAlpha,
          isTwoSided: corrIsTwoSided,
          dropoutRate: corrDropout
        });
        const currentInputs = {
          expectedCorrelation: corrR,
          power: corrPower,
          alpha: corrAlpha,
          isTwoSided: corrIsTwoSided,
          dropoutRate: corrDropout
        };
        const currentAssumptions = [
          { label: 'Expected Correlation (r)', value: `${corrR}` },
          { label: 'Statistical Power', value: `${(corrPower * 100).toFixed(0)}%` },
          { label: 'Significance (α)', value: `${corrAlpha} (${corrIsTwoSided ? 'Two-sided' : 'One-sided'})` },
          { label: 'Dropout Rate', value: `${(corrDropout * 100).toFixed(0)}%` }
        ];
        return { result: res, assumptions: currentAssumptions, inputs: currentInputs };
      }

      case 'ab-test': {
        const res = calculateABTestSampleSize({
          baselineConversionRate: abBaselineCR,
          mde: abMde,
          mdeType: abMdeType,
          power: abPower,
          alpha: abAlpha,
          trafficSplit: 0.50,
          dailyTraffic: abDailyTraffic,
          isTwoSided: abIsTwoSided
        });
        const currentInputs = {
          baselineConversionRate: abBaselineCR,
          mde: abMde,
          mdeType: abMdeType,
          power: abPower,
          alpha: abAlpha,
          dailyTraffic: abDailyTraffic,
          isTwoSided: abIsTwoSided
        };
        const currentAssumptions = [
          { label: 'Baseline CR', value: `${(abBaselineCR * 100).toFixed(2)}%` },
          { label: 'Target MDE', value: abMdeType === 'relative' ? `+${(abMde * 100).toFixed(1)}% rel.` : `+${(abMde * 100).toFixed(2)}% abs.` },
          { label: 'Variant Expected CR', value: `${((abMdeType === 'relative' ? abBaselineCR * (1 + abMde) : abBaselineCR + abMde) * 100).toFixed(2)}%` },
          { label: 'Power (1 - β)', value: `${(abPower * 100).toFixed(0)}%` },
          { label: 'Significance (α)', value: `${abAlpha}` },
          { label: 'Daily Traffic', value: `${Number(abDailyTraffic).toLocaleString()} visitors/day` }
        ];
        return { result: res, assumptions: currentAssumptions, inputs: currentInputs };
      }

      default:
        return { result: null, assumptions: [], inputs: {} };
    }
  }, [
    activeMode,
    surveyPopulation, surveyIsFinite, surveyConfidence, surveyMarginOfError, surveyProportion, surveyDropout,
    propPopulation, propIsFinite, propConfidence, propMarginOfError, propExpected, propDropout,
    meanConfidence, meanMarginOfError, meanStdDev, meanPopulation, meanIsFinite, meanDropout,
    twoMeansEffectSize, twoMeansPower, twoMeansAlpha, twoMeansIsTwoSided, twoMeansRatio, twoMeansDropout,
    twoPropsP1, twoPropsP2, twoPropsPower, twoPropsAlpha, twoPropsIsTwoSided, twoPropsRatio, twoPropsDropout,
    corrR, corrPower, corrAlpha, corrIsTwoSided, corrDropout,
    abBaselineCR, abMde, abMdeType, abPower, abAlpha, abDailyTraffic, abIsTwoSided
  ]);

  // Load calculation back from saved workspace modal
  const handleLoadSaved = (saved) => {
    if (!saved || !saved.mode) return;
    setActiveMode(saved.mode);
    const inp = saved.inputs || {};

    if (saved.mode === 'survey') {
      if (inp.populationSize !== undefined) setSurveyPopulation(inp.populationSize);
      if (inp.isFinite !== undefined) setSurveyIsFinite(inp.isFinite);
      if (inp.confidenceLevel !== undefined) setSurveyConfidence(inp.confidenceLevel);
      if (inp.marginOfError !== undefined) setSurveyMarginOfError(inp.marginOfError);
      if (inp.expectedProportion !== undefined) setSurveyProportion(inp.expectedProportion);
      if (inp.dropoutRate !== undefined) setSurveyDropout(inp.dropoutRate);
    } else if (saved.mode === 'two-means') {
      if (inp.effectSizeD !== undefined) setTwoMeansEffectSize(inp.effectSizeD);
      if (inp.power !== undefined) setTwoMeansPower(inp.power);
      if (inp.alpha !== undefined) setTwoMeansAlpha(inp.alpha);
      if (inp.isTwoSided !== undefined) setTwoMeansIsTwoSided(inp.isTwoSided);
      if (inp.allocationRatio !== undefined) setTwoMeansRatio(inp.allocationRatio);
      if (inp.dropoutRate !== undefined) setTwoMeansDropout(inp.dropoutRate);
    } else if (saved.mode === 'two-proportions') {
      if (inp.p1 !== undefined) setTwoPropsP1(inp.p1);
      if (inp.p2 !== undefined) setTwoPropsP2(inp.p2);
      if (inp.power !== undefined) setTwoPropsPower(inp.power);
      if (inp.alpha !== undefined) setTwoPropsAlpha(inp.alpha);
    } else if (saved.mode === 'ab-test') {
      if (inp.baselineConversionRate !== undefined) setAbBaselineCR(inp.baselineConversionRate);
      if (inp.mde !== undefined) setAbMde(inp.mde);
      if (inp.mdeType !== undefined) setAbMdeType(inp.mdeType);
      if (inp.dailyTraffic !== undefined) setAbDailyTraffic(inp.dailyTraffic);
    }
  };

  return (
    <div className="c-tool-page-container ssc-root">
      {/* Standardized ToolHeader with All Tools back button and badges */}
      <ToolHeader
        title={sampleSizeCalculatorManifest.title}
        subtitle={sampleSizeCalculatorManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        slug={sampleSizeCalculatorManifest.slug}
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
            <Badge variant="neutral" icon={<Scale size={12} strokeWidth={2} />}>
              Scientific R&D
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              100% Client-Side Privacy
            </Badge>
          </>
        }
      />

      {/* Top Toolbar: Beginner / Advanced Mode & Saved Calculations */}
      <div className="ssc-top-toolbar">
        <div className="ssc-mode-toggle-group">
          <button
            type="button"
            className={`ssc-toggle-tab ${!isAdvancedMode ? 'active' : ''}`}
            onClick={() => setIsAdvancedMode(false)}
          >
            <span>Simple Mode</span>
          </button>
          <button
            type="button"
            className={`ssc-toggle-tab ${isAdvancedMode ? 'active' : ''}`}
            onClick={() => setIsAdvancedMode(true)}
          >
            <SlidersHorizontal size={14} />
            <span>Advanced Mode (α, β, Power)</span>
          </button>
        </div>

        <div className="ssc-workspace-actions">
          <button
            type="button"
            className="ssc-btn-workspace"
            onClick={() => setIsSavedModalOpen(true)}
          >
            <Bookmark size={15} />
            <span>Saved Studies Workspace</span>
          </button>
        </div>
      </div>

      {/* 1. Methodology Selector (Cards) */}
      <ModeSelector 
        selectedMode={activeMode}
        onSelectMode={(m) => {
          setActiveMode(m);
          setIsModeCollapsed(true);
        }}
        isCollapsed={isModeCollapsed}
        onToggleCollapse={() => setIsModeCollapsed(!isModeCollapsed)}
      />

      {/* 2. Smart Research Assistant (Plain English Study Classifier) */}
      <SmartAssistant 
        onApplyRecommendation={(mode) => {
          setActiveMode(mode);
          setIsModeCollapsed(true);
        }}
      />

      {/* 3. Main Workspace Split Layout: Inputs on Left, Sticky Live Result on Right */}
      <div className="ssc-workspace-layout">
        <div className="ssc-input-panel">
          <div className="ssc-input-panel-header">
            <div>
              <span className="ssc-section-eyebrow">Parameters</span>
              <h3 className="ssc-panel-title">{activeModeMeta.title}</h3>
            </div>
            <span className="ssc-mode-tag">{isAdvancedMode ? 'Academic Parameters' : 'Simple Presets'}</span>
          </div>

          {/* ================= MODE 1: SURVEY ================= */}
          {activeMode === 'survey' && (
            <div className="ssc-form-fields">
              {/* Population Type */}
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-survey-pop-type" className="ssc-label">Population Scope</label>
                  <span className="ssc-hint">Finite vs. Infinite</span>
                </div>
                <select
                  id="ssc-survey-pop-type"
                  className="ssc-select"
                  value={surveyIsFinite ? 'finite' : 'infinite'}
                  onChange={(e) => setSurveyIsFinite(e.target.value === 'finite')}
                >
                  <option value="finite">Finite Population (Known Size N)</option>
                  <option value="infinite">Unknown / Very Large Population (Infinite)</option>
                </select>
              </div>

              {surveyIsFinite && (
                <div className="ssc-form-group">
                  <div className="ssc-label-row">
                    <label htmlFor="ssc-survey-pop" className="ssc-label">Population Size (N)</label>
                    <span className="ssc-hint">Total eligible individuals</span>
                  </div>
                  <input
                    id="ssc-survey-pop"
                    type="number"
                    className="ssc-input"
                    min="1"
                    step="100"
                    value={surveyPopulation}
                    onChange={(e) => setSurveyPopulation(Math.max(1, Number(e.target.value) || 0))}
                  />
                  <div className="ssc-input-presets">
                    {[1000, 5000, 10000, 50000, 100000].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`ssc-input-preset-btn ${surveyPopulation === num ? 'active' : ''}`}
                        onClick={() => setSurveyPopulation(num)}
                      >
                        {num.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence Level */}
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-survey-conf" className="ssc-label">
                    {isAdvancedMode ? 'Confidence Level (1 - α)' : 'Confidence Level'}
                  </label>
                  <span className="ssc-hint">95% is standard</span>
                </div>
                <select
                  id="ssc-survey-conf"
                  className="ssc-select"
                  value={surveyConfidence}
                  onChange={(e) => setSurveyConfidence(Number(e.target.value))}
                >
                  <option value={0.80}>80% (Z = 1.282) — Exploratory</option>
                  <option value={0.85}>85% (Z = 1.440)</option>
                  <option value={0.90}>90% (Z = 1.645) — Quick poll</option>
                  <option value={0.95}>95% (Z = 1.960) — Scientific standard</option>
                  <option value={0.98}>98% (Z = 2.326)</option>
                  <option value={0.99}>99% (Z = 2.576) — High precision / Clinical</option>
                </select>
              </div>

              {/* Margin of Error */}
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-survey-moe" className="ssc-label">
                    {isAdvancedMode ? 'Margin of Error (e)' : 'Margin of Error'}
                  </label>
                  <span className="ssc-hint">± percentage acceptable difference</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-survey-moe"
                    type="number"
                    className="ssc-input"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={surveyMarginOfError * 100}
                    onChange={(e) => setSurveyMarginOfError((Number(e.target.value) || 1) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
                <div className="ssc-input-presets">
                  {[2, 3, 5, 10].map((moe) => (
                    <button
                      key={moe}
                      type="button"
                      className={`ssc-input-preset-btn ${surveyMarginOfError === moe / 100 ? 'active' : ''}`}
                      onClick={() => setSurveyMarginOfError(moe / 100)}
                    >
                      ±{moe}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Proportion */}
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-survey-prop" className="ssc-label">
                    {isAdvancedMode ? 'Population Proportion / Distribution (p)' : 'Expected Answer Distribution'}
                  </label>
                  <span className="ssc-hint">50% is safest</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-survey-prop"
                    type="number"
                    className="ssc-input"
                    min="1"
                    max="99"
                    step="1"
                    value={surveyProportion * 100}
                    onChange={(e) => setSurveyProportion((Number(e.target.value) || 50) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
                <span className="ssc-hint" style={{ marginTop: '0.35rem' }}>
                  💡 Use 50% if you do not know the expected proportion. This produces the maximum mathematical variance and the most conservative sample size.
                </span>
              </div>

              {/* Dropout Rate */}
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-survey-dropout" className="ssc-label">Expected Dropout / Non-Response Rate</label>
                  <span className="ssc-hint">Incomplete submissions buffer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-survey-dropout"
                    type="number"
                    className="ssc-input"
                    min="0"
                    max="70"
                    step="5"
                    value={surveyDropout * 100}
                    onChange={(e) => setSurveyDropout((Number(e.target.value) || 0) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
                <div className="ssc-input-presets">
                  {[0, 5, 10, 15, 20].map((drop) => (
                    <button
                      key={drop}
                      type="button"
                      className={`ssc-input-preset-btn ${surveyDropout === drop / 100 ? 'active' : ''}`}
                      onClick={() => setSurveyDropout(drop / 100)}
                    >
                      {drop}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 2: ESTIMATE PROPORTION ================= */}
          {activeMode === 'proportion' && (
            <div className="ssc-form-fields">
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-prop-exp" className="ssc-label">Expected Prevalence / Proportion (p)</label>
                  <span className="ssc-hint">e.g. 20% smokers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-prop-exp"
                    type="number"
                    className="ssc-input"
                    min="1"
                    max="99"
                    step="1"
                    value={propExpected * 100}
                    onChange={(e) => setPropExpected((Number(e.target.value) || 50) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>

              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-prop-moe" className="ssc-label">Desired Precision / Margin of Error (e)</label>
                  <span className="ssc-hint">± percentage bounds</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-prop-moe"
                    type="number"
                    className="ssc-input"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={propMarginOfError * 100}
                    onChange={(e) => setPropMarginOfError((Number(e.target.value) || 1) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>

              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-prop-conf" className="ssc-label">Confidence Level</label>
                  <span className="ssc-hint">95% standard</span>
                </div>
                <select
                  id="ssc-prop-conf"
                  className="ssc-select"
                  value={propConfidence}
                  onChange={(e) => setPropConfidence(Number(e.target.value))}
                >
                  <option value={0.90}>90% (Z = 1.645)</option>
                  <option value={0.95}>95% (Z = 1.960)</option>
                  <option value={0.99}>99% (Z = 2.576)</option>
                </select>
              </div>

              <div className="ssc-switch-row">
                <div className="ssc-switch-label">
                  <span className="ssc-switch-title">Finite Population Correction</span>
                  <span className="ssc-switch-desc">Enable if population is finite and known</span>
                </div>
                <label className="ssc-toggle-control">
                  <input
                    type="checkbox"
                    checked={propIsFinite}
                    onChange={(e) => setPropIsFinite(e.target.checked)}
                  />
                  <span className="ssc-toggle-slider" />
                </label>
              </div>

              {propIsFinite && (
                <div className="ssc-form-group" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="ssc-prop-pop" className="ssc-label">Population Size (N)</label>
                  <input
                    id="ssc-prop-pop"
                    type="number"
                    className="ssc-input"
                    value={propPopulation}
                    onChange={(e) => setPropPopulation(Math.max(1, Number(e.target.value) || 0))}
                  />
                </div>
              )}

              <div className="ssc-form-group">
                <label htmlFor="ssc-prop-dropout" className="ssc-label">Expected Dropout Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-prop-dropout"
                    type="number"
                    className="ssc-input"
                    min="0"
                    max="60"
                    value={propDropout * 100}
                    onChange={(e) => setPropDropout((Number(e.target.value) || 0) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 3: ESTIMATE MEAN ================= */}
          {activeMode === 'mean' && (
            <div className="ssc-form-fields">
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-mean-sd" className="ssc-label">
                    {isAdvancedMode ? 'Expected Standard Deviation (σ)' : 'Estimated Standard Deviation'}
                  </label>
                  <span className="ssc-hint">Spread of numeric data</span>
                </div>
                <input
                  id="ssc-mean-sd"
                  type="number"
                  className="ssc-input"
                  min="0.1"
                  step="0.5"
                  value={meanStdDev}
                  onChange={(e) => setMeanStdDev(Math.max(0.01, Number(e.target.value) || 0))}
                />
                <span className="ssc-hint" style={{ marginTop: '0.35rem' }}>
                  💡 If unknown, estimate σ from pilot studies, previous published literature, or the range rule of thumb (σ ≈ Range / 4).
                </span>
              </div>

              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-mean-moe" className="ssc-label">
                    {isAdvancedMode ? 'Margin of Error / Precision (E)' : 'Acceptable Error Margin (E)'}
                  </label>
                  <span className="ssc-hint">In measurement units (e.g. ±2 mmHg, ±$500)</span>
                </div>
                <input
                  id="ssc-mean-moe"
                  type="number"
                  className="ssc-input"
                  min="0.01"
                  step="0.1"
                  value={meanMarginOfError}
                  onChange={(e) => setMeanMarginOfError(Math.max(0.001, Number(e.target.value) || 0))}
                />
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-mean-conf" className="ssc-label">Confidence Level</label>
                <select
                  id="ssc-mean-conf"
                  className="ssc-select"
                  value={meanConfidence}
                  onChange={(e) => setMeanConfidence(Number(e.target.value))}
                >
                  <option value={0.90}>90% (Z = 1.645)</option>
                  <option value={0.95}>95% (Z = 1.960)</option>
                  <option value={0.99}>99% (Z = 2.576)</option>
                </select>
              </div>

              <div className="ssc-switch-row">
                <div className="ssc-switch-label">
                  <span className="ssc-switch-title">Finite Population Correction</span>
                  <span className="ssc-switch-desc">Adjust if sampling from a bounded community</span>
                </div>
                <label className="ssc-toggle-control">
                  <input
                    type="checkbox"
                    checked={meanIsFinite}
                    onChange={(e) => setMeanIsFinite(e.target.checked)}
                  />
                  <span className="ssc-toggle-slider" />
                </label>
              </div>

              {meanIsFinite && (
                <div className="ssc-form-group" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="ssc-mean-pop" className="ssc-label">Population Size (N)</label>
                  <input
                    id="ssc-mean-pop"
                    type="number"
                    className="ssc-input"
                    value={meanPopulation}
                    onChange={(e) => setMeanPopulation(Math.max(1, Number(e.target.value) || 0))}
                  />
                </div>
              )}

              <div className="ssc-form-group">
                <label htmlFor="ssc-mean-dropout" className="ssc-label">Expected Dropout / Non-Response Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-mean-dropout"
                    type="number"
                    className="ssc-input"
                    min="0"
                    max="60"
                    value={meanDropout * 100}
                    onChange={(e) => setMeanDropout((Number(e.target.value) || 0) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 4: COMPARE TWO MEANS ================= */}
          {activeMode === 'two-means' && (
            <div className="ssc-form-fields">
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-means-d" className="ssc-label">
                    {isAdvancedMode ? "Standardized Effect Size (Cohen's d)" : 'Expected Difference (Effect Size)'}
                  </label>
                  <span className="ssc-hint">d = (μ₁ - μ₂) / σ</span>
                </div>
                <input
                  id="ssc-means-d"
                  type="number"
                  className="ssc-input"
                  min="0.05"
                  max="3.0"
                  step="0.05"
                  value={twoMeansEffectSize}
                  onChange={(e) => setTwoMeansEffectSize(Math.max(0.01, Number(e.target.value) || 0))}
                />
                <div className="ssc-input-presets">
                  <button
                    type="button"
                    className={`ssc-input-preset-btn ${twoMeansEffectSize === 0.2 ? 'active' : ''}`}
                    onClick={() => setTwoMeansEffectSize(0.2)}
                  >
                    Small (0.2)
                  </button>
                  <button
                    type="button"
                    className={`ssc-input-preset-btn ${twoMeansEffectSize === 0.5 ? 'active' : ''}`}
                    onClick={() => setTwoMeansEffectSize(0.5)}
                  >
                    Medium (0.5)
                  </button>
                  <button
                    type="button"
                    className={`ssc-input-preset-btn ${twoMeansEffectSize === 0.8 ? 'active' : ''}`}
                    onClick={() => setTwoMeansEffectSize(0.8)}
                  >
                    Large (0.8)
                  </button>
                </div>
              </div>

              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-means-pwr" className="ssc-label">Statistical Power (1 - β)</label>
                  <span className="ssc-hint">Probability of detecting real difference</span>
                </div>
                <select
                  id="ssc-means-pwr"
                  className="ssc-select"
                  value={twoMeansPower}
                  onChange={(e) => setTwoMeansPower(Number(e.target.value))}
                >
                  <option value={0.80}>80% (Z_β = 0.842) — Standard</option>
                  <option value={0.85}>85% (Z_β = 1.036)</option>
                  <option value={0.90}>90% (Z_β = 1.282) — High power</option>
                  <option value={0.95}>95% (Z_β = 1.645) — Rigorous clinical</option>
                </select>
                <span className="ssc-hint" style={{ marginTop: '0.35rem' }}>
                  💡 80% is standard. Higher power requires a larger participant pool to avoid false negatives.
                </span>
              </div>

              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-means-alpha" className="ssc-label">
                    {isAdvancedMode ? 'Significance Level (α)' : 'Significance Level (Risk of False Positive)'}
                  </label>
                  <span className="ssc-hint">Usually 0.05</span>
                </div>
                <select
                  id="ssc-means-alpha"
                  className="ssc-select"
                  value={twoMeansAlpha}
                  onChange={(e) => setTwoMeansAlpha(Number(e.target.value))}
                >
                  <option value={0.10}>0.10 (10% error risk)</option>
                  <option value={0.05}>0.05 (5% error risk) — Standard</option>
                  <option value={0.01}>0.01 (1% error risk) — Conservative</option>
                </select>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-means-tail" className="ssc-label">Hypothesis Test Type</label>
                <select
                  id="ssc-means-tail"
                  className="ssc-select"
                  value={twoMeansIsTwoSided ? 'two' : 'one'}
                  onChange={(e) => setTwoMeansIsTwoSided(e.target.value === 'two')}
                >
                  <option value="two">Two-sided (Standard — Group A ≠ Group B)</option>
                  <option value="one">One-sided (Directional — Group A &gt; Group B)</option>
                </select>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-means-ratio" className="ssc-label">Group Allocation Ratio (Control : Treatment)</label>
                <select
                  id="ssc-means-ratio"
                  className="ssc-select"
                  value={twoMeansRatio}
                  onChange={(e) => setTwoMeansRatio(Number(e.target.value))}
                >
                  <option value={1}>1:1 (Equal groups)</option>
                  <option value={2}>1:2 (Twice as many in Treatment)</option>
                  <option value={0.5}>2:1 (Twice as many in Control)</option>
                </select>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-means-dropout" className="ssc-label">Expected Dropout Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-means-dropout"
                    type="number"
                    className="ssc-input"
                    min="0"
                    max="60"
                    value={twoMeansDropout * 100}
                    onChange={(e) => setTwoMeansDropout((Number(e.target.value) || 0) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 5: COMPARE TWO PROPORTIONS ================= */}
          {activeMode === 'two-proportions' && (
            <div className="ssc-form-fields">
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-props-p1" className="ssc-label">Control Group Baseline Proportion (p₁)</label>
                  <span className="ssc-hint">e.g. Current success rate</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-props-p1"
                    type="number"
                    className="ssc-input"
                    min="1"
                    max="99"
                    step="1"
                    value={twoPropsP1 * 100}
                    onChange={(e) => setTwoPropsP1((Number(e.target.value) || 20) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>

              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-props-p2" className="ssc-label">Expected Treatment Proportion (p₂)</label>
                  <span className="ssc-hint">Target rate with intervention</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-props-p2"
                    type="number"
                    className="ssc-input"
                    min="1"
                    max="99"
                    step="1"
                    value={twoPropsP2 * 100}
                    onChange={(e) => setTwoPropsP2((Number(e.target.value) || 30) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
                <span className="ssc-hint" style={{ marginTop: '0.35rem' }}>
                  Detecting difference: <strong>{Math.abs(twoPropsP2 - twoPropsP1) > 0 ? `${(Math.abs(twoPropsP2 - twoPropsP1) * 100).toFixed(1)} percentage points` : 'Values must not be equal'}</strong>
                </span>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-props-pwr" className="ssc-label">Statistical Power (1 - β)</label>
                <select
                  id="ssc-props-pwr"
                  className="ssc-select"
                  value={twoPropsPower}
                  onChange={(e) => setTwoPropsPower(Number(e.target.value))}
                >
                  <option value={0.80}>80% — Standard</option>
                  <option value={0.85}>85%</option>
                  <option value={0.90}>90% — High power</option>
                  <option value={0.95}>95%</option>
                </select>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-props-alpha" className="ssc-label">Significance Level (α)</label>
                <select
                  id="ssc-props-alpha"
                  className="ssc-select"
                  value={twoPropsAlpha}
                  onChange={(e) => setTwoPropsAlpha(Number(e.target.value))}
                >
                  <option value={0.10}>0.10</option>
                  <option value={0.05}>0.05 (Standard)</option>
                  <option value={0.01}>0.01</option>
                </select>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-props-dropout" className="ssc-label">Expected Dropout Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-props-dropout"
                    type="number"
                    className="ssc-input"
                    min="0"
                    max="60"
                    value={twoPropsDropout * 100}
                    onChange={(e) => setTwoPropsDropout((Number(e.target.value) || 0) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 6: CORRELATION ================= */}
          {activeMode === 'correlation' && (
            <div className="ssc-form-fields">
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-corr-r" className="ssc-label">
                    {isAdvancedMode ? 'Expected Correlation Coefficient (r)' : 'Expected Linear Correlation (r)'}
                  </label>
                  <span className="ssc-hint">Between -1.0 and +1.0</span>
                </div>
                <input
                  id="ssc-corr-r"
                  type="number"
                  className="ssc-input"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={corrR}
                  onChange={(e) => setCorrR(Number(e.target.value) || 0.1)}
                />
                <div className="ssc-input-presets">
                  <button
                    type="button"
                    className={`ssc-input-preset-btn ${corrR === 0.10 ? 'active' : ''}`}
                    onClick={() => setCorrR(0.10)}
                  >
                    Weak (0.10)
                  </button>
                  <button
                    type="button"
                    className={`ssc-input-preset-btn ${corrR === 0.30 ? 'active' : ''}`}
                    onClick={() => setCorrR(0.30)}
                  >
                    Moderate (0.30)
                  </button>
                  <button
                    type="button"
                    className={`ssc-input-preset-btn ${corrR === 0.50 ? 'active' : ''}`}
                    onClick={() => setCorrR(0.50)}
                  >
                    Strong (0.50)
                  </button>
                </div>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-corr-pwr" className="ssc-label">Statistical Power</label>
                <select
                  id="ssc-corr-pwr"
                  className="ssc-select"
                  value={corrPower}
                  onChange={(e) => setCorrPower(Number(e.target.value))}
                >
                  <option value={0.80}>80% (Standard)</option>
                  <option value={0.85}>85%</option>
                  <option value={0.90}>90%</option>
                  <option value={0.95}>95%</option>
                </select>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-corr-alpha" className="ssc-label">Significance Level (α)</label>
                <select
                  id="ssc-corr-alpha"
                  className="ssc-select"
                  value={corrAlpha}
                  onChange={(e) => setCorrAlpha(Number(e.target.value))}
                >
                  <option value={0.10}>0.10</option>
                  <option value={0.05}>0.05 (Standard)</option>
                  <option value={0.01}>0.01</option>
                </select>
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-corr-dropout" className="ssc-label">Expected Dropout Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-corr-dropout"
                    type="number"
                    className="ssc-input"
                    min="0"
                    max="60"
                    value={corrDropout * 100}
                    onChange={(e) => setCorrDropout((Number(e.target.value) || 0) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 7: A/B TEST ================= */}
          {activeMode === 'ab-test' && (
            <div className="ssc-form-fields">
              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-ab-base" className="ssc-label">Baseline Conversion Rate</label>
                  <span className="ssc-hint">Current Variant A conversion</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-ab-base"
                    type="number"
                    className="ssc-input"
                    min="0.1"
                    max="90"
                    step="0.5"
                    value={(abBaselineCR * 100).toFixed(2)}
                    onChange={(e) => setAbBaselineCR((Number(e.target.value) || 1) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>

              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-ab-mde" className="ssc-label">Minimum Detectable Effect (MDE)</label>
                  <span className="ssc-hint">Target uplift to detect</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    className={`ssc-input-preset-btn ${abMdeType === 'relative' ? 'active' : ''}`}
                    onClick={() => setAbMdeType('relative')}
                  >
                    Relative Uplift (%)
                  </button>
                  <button
                    type="button"
                    className={`ssc-input-preset-btn ${abMdeType === 'absolute' ? 'active' : ''}`}
                    onClick={() => setAbMdeType('absolute')}
                  >
                    Absolute Uplift (percentage points)
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="ssc-ab-mde"
                    type="number"
                    className="ssc-input"
                    min="0.1"
                    max="200"
                    step="1"
                    value={abMde * 100}
                    onChange={(e) => setAbMde((Number(e.target.value) || 1) / 100)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
                <div className="ssc-recruitment-target-box" style={{ marginTop: '0.5rem' }}>
                  <span className="ssc-rec-label">Expected Variant B Conversion Rate:</span>
                  <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>
                    {((abMdeType === 'relative' ? abBaselineCR * (1 + abMde) : abBaselineCR + abMde) * 100).toFixed(2)}%
                  </strong>
                </div>
              </div>

              <div className="ssc-form-group">
                <div className="ssc-label-row">
                  <label htmlFor="ssc-ab-traffic" className="ssc-label">Daily Traffic to Page</label>
                  <span className="ssc-hint">Visitors per day (for duration estimate)</span>
                </div>
                <input
                  id="ssc-ab-traffic"
                  type="number"
                  className="ssc-input"
                  min="100"
                  step="500"
                  value={abDailyTraffic}
                  onChange={(e) => setAbDailyTraffic(Math.max(1, Number(e.target.value) || 0))}
                />
              </div>

              <div className="ssc-form-group">
                <label htmlFor="ssc-ab-pwr" className="ssc-label">Statistical Power</label>
                <select
                  id="ssc-ab-pwr"
                  className="ssc-select"
                  value={abPower}
                  onChange={(e) => setAbPower(Number(e.target.value))}
                >
                  <option value={0.80}>80% (Industry standard)</option>
                  <option value={0.85}>85%</option>
                  <option value={0.90}>90%</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Live Result & Sticky Calculation Column */}
        <div className="ssc-result-column">
          <LiveResultCard 
            result={result}
            mode={activeMode}
            modeTitle={activeModeMeta.title}
            assumptions={assumptions}
            onOpenReport={() => setIsReportModalOpen(true)}
            onSaveCalculation={() => setIsSavedModalOpen(true)}
            onCopyTrack={trackCopy}
            onDownloadTrack={trackDownload}
          />

          <CalculationBreakdown 
            breakdownText={result?.breakdown}
            modeTitle={activeModeMeta.title}
          />
        </div>
      </div>

      {/* 4. SEO Divider & Comprehensive Guide, Worked Examples, FAQs & Schemas */}
      <ToolSeoDivider label="Comprehensive Methodology & Statistical Power Guide" />
      <SampleSizeCalculatorSeo />

      {/* Saved Studies Workspace Modal */}
      <SavedStudiesModal 
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        currentCalculation={{
          mode: activeMode,
          modeTitle: activeModeMeta.title,
          result,
          assumptions,
          inputs
        }}
        onLoadCalculation={handleLoadSaved}
      />

      {/* Printable Research Report Modal */}
      <SampleSizeReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        calculation={{
          mode: activeMode,
          modeTitle: activeModeMeta.title,
          result,
          assumptions,
          inputs
        }}
        onDownloadTrack={trackDownload}
        onCopyTrack={trackCopy}
      />
    </div>
  );
}
