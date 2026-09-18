import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Award, 
  Copy, 
  Check, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles,
  Percent,
  Lock,
  Eye
} from 'lucide-react';
import { ltvCacCalculatorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import '../finance-shared/finance-tools.css';

export default function LtvCacCalculator({ onBack, toolMeta }) {
  const { visitorCount, trackAction } = useToolAnalytics(ltvCacCalculatorManifest.slug, toolMeta);

  // Inputs
  const [ltv, setLtv] = useState(4800);
  const [cac, setCac] = useState(1200);
  const [arpu, setArpu] = useState(150);
  const [grossMargin, setGrossMargin] = useState(80);
  const [copied, setCopied] = useState(false);

  // Calculations
  const metrics = useMemo(() => {
    const ratio = cac > 0 ? Number((ltv / cac).toFixed(2)) : 0;
    
    // Monthly gross profit per customer
    const monthlyGrossProfit = arpu * (grossMargin / 100);
    
    // Payback Period (Months) = CAC / Monthly Gross Profit
    const paybackMonths = monthlyGrossProfit > 0 
      ? Number((cac / monthlyGrossProfit).toFixed(1)) 
      : 99.9;

    // Verdicts
    let ratioStatus = 'success';
    let ratioLabel = 'Golden Standard (3.0x - 5.0x)';
    if (ratio >= 5.0) {
      ratioStatus = 'blue';
      ratioLabel = 'Underinvesting in Growth (> 5.0x)';
    } else if (ratio >= 3.0) {
      ratioStatus = 'success';
      ratioLabel = 'Golden Standard (3.0x - 5.0x)';
    } else if (ratio >= 1.5) {
      ratioStatus = 'warning';
      ratioLabel = 'Marginal Efficiency (1.5x - 3.0x)';
    } else {
      ratioStatus = 'danger';
      ratioLabel = 'Unsustainable Unit Economics (< 1.5x)';
    }

    let paybackStatus = 'success';
    if (paybackMonths <= 12) {
      paybackStatus = 'success';
    } else if (paybackMonths <= 18) {
      paybackStatus = 'blue';
    } else {
      paybackStatus = 'warning';
    }

    return {
      ratio,
      paybackMonths,
      monthlyGrossProfit,
      ratioStatus,
      ratioLabel,
      paybackStatus
    };
  }, [ltv, cac, arpu, grossMargin]);

  const handleCopyReport = () => {
    trackAction('copy_ltv_cac_report');
    const report = `📊 SaaS Unit Economics (LTV:CAC) Report (Cerilas Tools)
---------------------------------------------
💰 Customer Lifetime Value (LTV): $${ltv.toLocaleString()}
💸 Customer Acquisition Cost (CAC): $${cac.toLocaleString()}
💵 ARPU: $${arpu.toLocaleString()}/mo (${grossMargin}% Gross Margin)
---------------------------------------------
⭐ LTV:CAC Ratio: ${metrics.ratio}x (${metrics.ratioLabel})
⏱ CAC Payback Period: ${metrics.paybackMonths} Months
💵 Monthly Gross Profit: $${Math.round(metrics.monthlyGrossProfit).toLocaleString()}/customer
---------------------------------------------
Generated via https://tools.cerilas.com/#/tool/ltv-cac-calculator`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setLtv(4800);
    setCac(1200);
    setArpu(150);
    setGrossMargin(80);
  };

  return (
    <div className="c-tool-page-container finance-tool-container">
      <ToolHeader 
        title={ltvCacCalculatorManifest.title}
        subtitle={ltvCacCalculatorManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        slug={ltvCacCalculatorManifest.slug}
        badges={
          <>
            <Badge variant="success" icon={<Lock size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            <Badge variant="blue" icon={<Scale size={11} />}>Unit Economics</Badge>
            <Badge variant="success" icon={<CheckCircle2 size={11} />}>Payback Period</Badge>
          </>
        }
      />

      <div className="calc-workspace">
        <div className="calc-grid">
          {/* Left Column: Inputs */}
          <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <Scale size={18} />
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
                <label className="calc-field-label">Customer Lifetime Value (LTV)</label>
                <span className="calc-field-hint">Gross profit per customer</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={ltv}
                  onChange={(e) => setLtv(Math.max(1, Number(e.target.value) || 1))}
                  min={1}
                  step={100}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Customer Acquisition Cost (CAC)</label>
                <span className="calc-field-hint">Cost to acquire each customer</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={cac}
                  onChange={(e) => setCac(Math.max(1, Number(e.target.value) || 1))}
                  min={1}
                  step={50}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Monthly ARPU</label>
                <span className="calc-field-hint">Monthly revenue per account</span>
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
                <span className="calc-field-hint">{grossMargin}%</span>
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
          </div>
        </div>

        {/* Right Column: Output Metrics */}
        <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <Award size={18} />
              <span>Unit Economics Verdict</span>
            </h2>
            <span className={`calc-kpi-badge badge-${metrics.ratioStatus}`}>
              {metrics.ratioLabel}
            </span>
          </div>

          {/* Primary Hero KPI: LTV:CAC Ratio */}
          <div className={`calc-hero-kpi status-${metrics.ratioStatus}`}>
            <div className="calc-kpi-top">
              <span className="calc-kpi-label">LTV:CAC Ratio</span>
              <Scale size={18} style={{ opacity: 0.6 }} />
            </div>
            <div className="calc-kpi-value">
              {metrics.ratio}x
            </div>
            <p className="calc-kpi-subtext">
              {metrics.ratio >= 3.0 && metrics.ratio <= 5.0
                ? 'Golden Standard. Optimal balance between aggressive growth and capital sustainability.'
                : metrics.ratio > 5.0
                ? 'High efficiency, but you may be underinvesting in marketing. You can afford to bid more aggressively for leads.'
                : 'Warning: Unit economics are squeezed. Focus on churn reduction or increasing pricing.'}
            </p>
          </div>

          {/* Secondary Cards */}
          <div className="calc-sub-grid">
            <div className="calc-sub-card">
              <span className="calc-sub-label">CAC Payback Period</span>
              <span className="calc-sub-value" style={{ color: metrics.paybackMonths <= 12 ? '#10b981' : '#f59e0b' }}>
                {metrics.paybackMonths} Months
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Net Return per Customer</span>
              <span className="calc-sub-value" style={{ color: '#3b82f6' }}>
                +${Math.max(0, ltv - cac).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Benchmark Box */}
          <div className="calc-benchmark-box">
            <div className="calc-benchmark-header">
              <span>SaaS Benchmark Spectrum</span>
              <span style={{ fontWeight: 600 }}>Target: 3.0x - 5.0x</span>
            </div>
            <div className="calc-benchmark-track">
              <div 
                className="calc-benchmark-fill" 
                style={{ 
                  width: `${Math.min(100, (metrics.ratio / 6) * 100)}%`,
                  background: metrics.ratio >= 3.0 ? '#10b981' : metrics.ratio >= 1.5 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
            <div className="calc-benchmark-labels">
              <span>1x (Break-even)</span>
              <span>3x (Ideal)</span>
              <span>5x+ (Scale Up)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="calc-actions-row">
            <button type="button" onClick={handleCopyReport} className="calc-btn-primary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Summary Copied!' : 'Copy LTV:CAC Report'}</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* SEO Guide */}
      <ToolSeoDivider label="LTV:CAC Benchmarks, Payback Periods & Venture FAQs" />

      <section className="calc-guide-section">
        <div className="calc-guide-card">
          <h3 className="calc-guide-title">Why the LTV:CAC Ratio Governs SaaS Success</h3>
          <p className="calc-guide-text">
            The ratio between Customer Lifetime Value (LTV) and Customer Acquisition Cost (CAC) is universally considered the ultimate litmus test of a startup's unit economics and scalability. It indicates how much value you unlock for every dollar funneled into growth.
          </p>

          <div className="calc-formula-box">
            <strong>LTV:CAC Ratio Formula:</strong><br />
            LTV:CAC = Customer Lifetime Value / Customer Acquisition Cost
          </div>

          <p className="calc-guide-text">
            Alongside the ratio, venture capital investors closely examine the <strong>CAC Payback Period</strong>, which measures the number of months required to recoup the upfront cash spent to win each account.
          </p>
          <div className="calc-formula-box">
            <strong>CAC Payback Period Formula:</strong><br />
            Payback Period (Months) = CAC / [Monthly ARPU × Gross Margin (%)]
          </div>
        </div>

        <div className="calc-guide-card">
          <h3 className="calc-guide-title">Frequently Asked Questions</h3>
          <div className="calc-faq-grid">
            <div className="calc-faq-item">
              <h4 className="calc-faq-q">What is the "Golden Ratio" for SaaS?</h4>
              <p className="calc-faq-a">
                An LTV:CAC ratio of <strong>3.0x to 5.0x</strong> is considered ideal. A ratio below 1.0x destroys capital on every customer, whereas a ratio above 5.0x suggests you are being overly conservative and leaving market share on the table.
              </p>
            </div>
            <div className="calc-faq-item">
              <h4 className="calc-faq-q">What is an ideal CAC Payback Period?</h4>
              <p className="calc-faq-a">
                Top-quartile venture-backed SaaS startups achieve a payback period of <strong>under 12 months</strong>. A payback under 12 months enables you to recycle customer revenue into new marketing channels within the same fiscal year, accelerating compounding growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AdSlot */}
      <AdSlot format="billboard" slotId="ad-ltv-cac-billboard" />
    </div>
  );
}
