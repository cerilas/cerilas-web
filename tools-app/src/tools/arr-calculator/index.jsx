import React, { useEffect,  useState, useMemo  } from 'react';
import {
  Database,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle2,
  Lock,
  Eye,
  Activity,
  Zap
} from 'lucide-react';
import { arrCalculatorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import ArrSeo from './components/ArrSeo';
import '../finance-shared/finance-tools.css';

export default function ArrCalculator({ onBack, toolMeta }) {
  const { visitorCount, trackAction, trackUse, conversionCount, getConversionLabel } = useToolAnalytics(arrCalculatorManifest.slug, toolMeta);

  // Inputs
  const [currentMrr, setCurrentMrr] = useState(83333);
  const [growthRate, setGrowthRate] = useState(60);
  const [profitMargin, setProfitMargin] = useState(-15);
  const [employees, setEmployees] = useState(7);
  const [customerCount, setCustomerCount] = useState(95);
  const [copied, setCopied] = useState(false);

  // Analytics: Track calculations when inputs change (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      trackUse?.();
    }, 2000);
    return () => clearTimeout(handler);
  }, [currentMrr, growthRate, profitMargin, employees, customerCount, trackUse]);


  // Calculations
  const metrics = useMemo(() => {
    const currentArr = Math.round(currentMrr * 12);
    const arrPerEmp = employees > 0 ? Math.round(currentArr / employees) : currentArr;
    const acv = customerCount > 0 ? Math.round(currentArr / customerCount) : 0;
    
    // Rule of 40 = Growth Rate (%) + Profit Margin (%)
    const ruleOf40 = Math.round(growthRate + profitMargin);

    let r40Status = 'success';
    let r40Label = 'Top Quartile (≥ 40%)';
    if (ruleOf40 >= 40) {
      r40Status = 'success';
      r40Label = 'Elite Scale (Rule of 40 Passed)';
    } else if (ruleOf40 >= 20) {
      r40Status = 'blue';
      r40Label = 'Healthy Growth Pace (20% - 40%)';
    } else if (ruleOf40 >= 0) {
      r40Status = 'warning';
      r40Label = 'Moderate Performance (0% - 20%)';
    } else {
      r40Status = 'danger';
      r40Label = 'Heavy Burn / Slow Growth (< 0%)';
    }

    // Projections
    const year1Arr = Math.round(currentArr * (1 + growthRate / 100));
    const year2Arr = Math.round(year1Arr * (1 + growthRate / 100));
    const year3Arr = Math.round(year2Arr * (1 + growthRate / 100));

    return {
      currentArr,
      arrPerEmp,
      acv,
      ruleOf40,
      r40Status,
      r40Label,
      year1Arr,
      year2Arr,
      year3Arr
    };
  }, [currentMrr, growthRate, profitMargin, employees, customerCount]);

  const handleCopyReport = () => {
    trackAction('copy_arr_report');
    const report = `📊 SaaS ARR & Valuation Metrics (Cerilas Tools)
---------------------------------------------
💵 Current MRR: $${currentMrr.toLocaleString()}
🚀 Annual Recurring Revenue (ARR): $${metrics.currentArr.toLocaleString()}
🎯 Rule of 40 Score: ${metrics.ruleOf40}% (${metrics.r40Label})
👥 ARR per Employee: $${metrics.arrPerEmp.toLocaleString()}/employee (${employees} FTEs)
🏷 Average Contract Value (ACV): $${metrics.acv.toLocaleString()}/yr (${customerCount} customers)
---------------------------------------------
📈 Forecast at ${growthRate}% YoY Growth:
  • Year 1 ARR: $${metrics.year1Arr.toLocaleString()}
  • Year 2 ARR: $${metrics.year2Arr.toLocaleString()}
  • Year 3 ARR: $${metrics.year3Arr.toLocaleString()}
---------------------------------------------
Generated via https://tools.cerilas.com/#/tool/arr-calculator`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCurrentMrr(83333);
    setGrowthRate(60);
    setProfitMargin(-15);
    setEmployees(7);
    setCustomerCount(95);
  };

  return (
    <div className="c-tool-page-container finance-tool-container">
      <ToolHeader 
        title={arrCalculatorManifest.title}
        subtitle={arrCalculatorManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        slug={arrCalculatorManifest.slug}
        badges={
          <>
            <Badge variant="success" icon={<Lock size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
            {conversionCount > 0 && (
              <Badge variant="brand" icon={<Activity size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel()}
              </Badge>
            )}
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            <Badge variant="blue" icon={<Award size={11} />}>Rule of 40</Badge>
            <Badge variant="success" icon={<TrendingUp size={11} />}>3-Year Forecast</Badge>
          </>
        }
      />

      <div className="calc-workspace">
        <div className="calc-grid">
          {/* Left Column: Input Form */}
          <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <DollarSign size={18} />
              <span>ARR Parameters</span>
            </h2>
            <button type="button" onClick={handleReset} className="calc-btn-secondary" style={{ height: '32px', padding: '0 0.7rem', fontSize: '0.76rem' }}>
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="calc-inputs-list">
            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Current MRR</label>
                <span className="calc-field-hint">Monthly recurring run-rate</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={currentMrr}
                  onChange={(e) => setCurrentMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Expected Annual Growth Rate (YoY)</label>
                <span className="calc-field-hint">{growthRate}%</span>
              </div>
              <input 
                type="range" 
                className="calc-range" 
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                min={0}
                max={200}
                step={5}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Free Cash Flow / Profit Margin</label>
                <span className="calc-field-hint">{profitMargin}%</span>
              </div>
              <input 
                type="range" 
                className="calc-range" 
                value={profitMargin}
                onChange={(e) => setProfitMargin(Number(e.target.value))}
                min={-100}
                max={60}
                step={5}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Full-Time Employees (FTE)</label>
                <span className="calc-field-hint">Headcount</span>
              </div>
              <input 
                type="number" 
                className="calc-input" 
                value={employees}
                onChange={(e) => setEmployees(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                step={1}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Active Paying Customers</label>
                <span className="calc-field-hint">Accounts count</span>
              </div>
              <input 
                type="number" 
                className="calc-input" 
                value={customerCount}
                onChange={(e) => setCustomerCount(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                step={5}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Key Outputs */}
        <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <Database size={18} />
              <span>ARR &amp; Valuation</span>
            </h2>
            <span className={`calc-kpi-badge badge-${metrics.r40Status}`}>
              {metrics.r40Label}
            </span>
          </div>

          {/* Primary KPI: ARR */}
          <div className="calc-hero-kpi status-success">
            <div className="calc-kpi-top">
              <span className="calc-kpi-label">Annual Recurring Revenue</span>
              <DollarSign size={18} style={{ opacity: 0.6 }} />
            </div>
            <div className="calc-kpi-value">
              ${metrics.currentArr.toLocaleString()}
            </div>
            <p className="calc-kpi-subtext">
              Annualized run-rate from current <strong>${currentMrr.toLocaleString()}/month</strong> baseline.
            </p>
          </div>

          {/* Secondary KPIs */}
          <div className="calc-sub-grid">
            <div className="calc-sub-card">
              <span className="calc-sub-label">Rule of 40 Score</span>
              <span className="calc-sub-value" style={{ color: metrics.ruleOf40 >= 40 ? '#10b981' : metrics.ruleOf40 >= 20 ? '#3b82f6' : '#f59e0b' }}>
                {metrics.ruleOf40}%
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">ARR Per Employee</span>
              <span className="calc-sub-value">
                ${metrics.arrPerEmp.toLocaleString()}
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Avg Contract Value (ACV)</span>
              <span className="calc-sub-value">
                ${metrics.acv.toLocaleString()}/yr
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Year 1 Projection</span>
              <span className="calc-sub-value" style={{ color: '#10b981' }}>
                ${metrics.year1Arr.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 3-Year Trajectory */}
          <div className="calc-benchmark-box">
            <div className="calc-benchmark-header">
              <span>3-Year Compounding Projection ({growthRate}% YoY)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Year 1:</span>
                <span style={{ fontWeight: 600 }}>${metrics.year1Arr.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Year 2:</span>
                <span style={{ fontWeight: 600 }}>${metrics.year2Arr.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Year 3:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>${metrics.year3Arr.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="calc-actions-row">
            <button type="button" onClick={handleCopyReport} className="calc-btn-primary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Summary Copied!' : 'Copy Investor Report'}</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Comprehensive Long-Form SEO & Venture Guide */}
      <ArrSeo />

      {/* AdSlot */}
      <AdSlot format="billboard" slotId="ad-arr-billboard" />
    </div>
  );
}
