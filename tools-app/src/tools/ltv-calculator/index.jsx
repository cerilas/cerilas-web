import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Percent,
  Copy,
  Check,
  RotateCcw,
  Award,
  CheckCircle2,
  Sparkles,
  Lock,
  Eye,
  Activity,
  Zap
} from 'lucide-react';
import { ltvCalculatorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import LtvSeo from './components/LtvSeo';
import '../finance-shared/finance-tools.css';

export default function LtvCalculator({ onBack, toolMeta }) {
  const { visitorCount, trackAction, trackUse, conversionCount, getConversionLabel } = useToolAnalytics(ltvCalculatorManifest.slug, toolMeta);

  // Inputs
  const [arpu, setArpu] = useState(150);
  const [grossMargin, setGrossMargin] = useState(80);
  const [monthlyChurn, setMonthlyChurn] = useState(2.5);
  const [discountRate, setDiscountRate] = useState(10);
  const [copied, setCopied] = useState(false);

  // Analytics: Track calculations when inputs change (debounced, skip initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const handler = setTimeout(() => {
      trackUse?.();
    }, 2500);
    return () => clearTimeout(handler);
  }, [arpu, grossMargin, monthlyChurn, discountRate, trackUse]);


  // Calculations
  const metrics = useMemo(() => {
    const churnDecimal = monthlyChurn > 0 ? monthlyChurn / 100 : 0.001;
    const marginDecimal = grossMargin / 100;
    
    // Customer Lifespan in months
    const lifespanMonths = Number((1 / churnDecimal).toFixed(1));
    const lifespanYears = Number((lifespanMonths / 12).toFixed(1));

    // Gross Revenue per Customer
    const grossRevenuePerCustomer = Math.round(arpu / churnDecimal);

    // Standard LTV (Gross Profit) = (ARPU * Gross Margin) / Churn Rate
    const ltv = Math.round((arpu * marginDecimal) / churnDecimal);

    // Discounted LTV = LTV / (1 + DiscountRate / 12)^lifespan
    const monthlyDiscountRate = discountRate / 100 / 12;
    const discountedLtv = Math.round(ltv / Math.pow(1 + monthlyDiscountRate, Math.min(lifespanMonths, 36)));

    let status = 'success';
    let verdictLabel = 'High Value Customer (LTV > $3,000)';
    if (ltv >= 5000) {
      status = 'success';
      verdictLabel = 'Enterprise Tier (LTV ≥ $5,000)';
    } else if (ltv >= 2000) {
      status = 'blue';
      verdictLabel = 'Strong Mid-Market ($2,000 - $5,000)';
    } else if (ltv >= 500) {
      status = 'warning';
      verdictLabel = 'Standard SMB Tier ($500 - $2,000)';
    } else {
      status = 'danger';
      verdictLabel = 'Low ARPU / High Churn (< $500)';
    }

    return {
      lifespanMonths,
      lifespanYears,
      grossRevenuePerCustomer,
      ltv,
      discountedLtv,
      status,
      verdictLabel
    };
  }, [arpu, grossMargin, monthlyChurn, discountRate]);

  const handleCopyReport = () => {
    trackAction('copy_ltv_report');
    const report = `📊 Customer Lifetime Value (LTV) Report (Cerilas Tools)
---------------------------------------------
💰 Average Revenue Per User (ARPU): $${arpu.toLocaleString()}/mo
🛡 Gross Margin: ${grossMargin}%
📉 Monthly Churn Rate: ${monthlyChurn}%
---------------------------------------------
⭐ Margin-Adjusted LTV: $${metrics.ltv.toLocaleString()}
💸 Gross Revenue per Customer: $${metrics.grossRevenuePerCustomer.toLocaleString()}
⏳ Expected Lifespan: ${metrics.lifespanMonths} Months (${metrics.lifespanYears} Years)
🏦 Discounted LTV (${discountRate}% WACC): $${metrics.discountedLtv.toLocaleString()}
🎯 Verdict: ${metrics.verdictLabel}
---------------------------------------------
Generated via https://tools.cerilas.com/#/tool/ltv-calculator`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setArpu(150);
    setGrossMargin(80);
    setMonthlyChurn(2.5);
    setDiscountRate(10);
  };

  return (
    <div className="c-tool-page-container finance-tool-container">
      <ToolHeader 
        title={ltvCalculatorManifest.title}
        subtitle={ltvCalculatorManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        slug={ltvCalculatorManifest.slug}
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
            <Badge variant="blue" icon={<Percent size={11} />}>Margin Adjusted</Badge>
            <Badge variant="success" icon={<CheckCircle2 size={11} />}>SaaS Benchmark</Badge>
          </>
        }
      />

      <div className="calc-workspace">
        <div className="calc-grid">
          {/* Left Column: Inputs */}
          <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <DollarSign size={18} />
              <span>Unit Economics Inputs</span>
            </h2>
            <button type="button" onClick={handleReset} className="calc-btn-secondary" style={{ height: '32px', padding: '0 0.7rem', fontSize: '0.76rem' }}>
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="calc-inputs-list">
            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Average Revenue Per User (ARPU)</label>
                <span className="calc-field-hint">Monthly spend per account</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={arpu}
                  onChange={(e) => setArpu(Math.max(1, Number(e.target.value) || 1))}
                  min={1}
                  step={10}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Gross Margin Percentage</label>
                <span className="calc-field-hint">{grossMargin}% (SaaS benchmark: 75%–85%)</span>
              </div>
              <input 
                type="range" 
                className="calc-range" 
                value={grossMargin}
                onChange={(e) => setGrossMargin(Number(e.target.value))}
                min={20}
                max={100}
                step={1}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Monthly Customer Churn Rate</label>
                <span className="calc-field-hint">{monthlyChurn}% / mo</span>
              </div>
              <input 
                type="range" 
                className="calc-range" 
                value={monthlyChurn}
                onChange={(e) => setMonthlyChurn(Number(e.target.value))}
                min={0.2}
                max={15}
                step={0.1}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Annual Discount Rate (WACC)</label>
                <span className="calc-field-hint">{discountRate}%</span>
              </div>
              <input 
                type="range" 
                className="calc-range" 
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                min={0}
                max={25}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output Metrics */}
        <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <Award size={18} />
              <span>Lifetime Value Summary</span>
            </h2>
            <span className={`calc-kpi-badge badge-${metrics.status}`}>
              {metrics.verdictLabel}
            </span>
          </div>

          {/* Primary Hero KPI: LTV */}
          <div className="calc-hero-kpi status-success">
            <div className="calc-kpi-top">
              <span className="calc-kpi-label">Customer Lifetime Value (LTV)</span>
              <DollarSign size={18} style={{ opacity: 0.6 }} />
            </div>
            <div className="calc-kpi-value">
              ${metrics.ltv.toLocaleString()}
            </div>
            <p className="calc-kpi-subtext">
              Net gross profit generated over an expected <strong>{metrics.lifespanMonths} month</strong> customer lifespan.
            </p>
          </div>

          {/* Secondary Cards */}
          <div className="calc-sub-grid">
            <div className="calc-sub-card">
              <span className="calc-sub-label">Customer Lifespan</span>
              <span className="calc-sub-value" style={{ color: '#3b82f6' }}>
                {metrics.lifespanMonths} Mo ({metrics.lifespanYears} Yrs)
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Gross Revenue (Pre-Margin)</span>
              <span className="calc-sub-value">
                ${metrics.grossRevenuePerCustomer.toLocaleString()}
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Discounted LTV (DCF)</span>
              <span className="calc-sub-value">
                ${metrics.discountedLtv.toLocaleString()}
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Annualized Contribution</span>
              <span className="calc-sub-value" style={{ color: '#10b981' }}>
                ${Math.round(arpu * (grossMargin / 100) * 12).toLocaleString()}/yr
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="calc-actions-row">
            <button type="button" onClick={handleCopyReport} className="calc-btn-primary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Summary Copied!' : 'Copy LTV Report'}</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Comprehensive Long-Form SEO & Venture Guide */}
      <LtvSeo />

      {/* AdSlot */}
      <AdSlot format="billboard" slotId="ad-ltv-billboard" />
    </div>
  );
}
