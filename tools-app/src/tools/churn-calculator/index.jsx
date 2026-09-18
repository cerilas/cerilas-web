import React, { useEffect,  useState, useMemo  } from 'react';
import {
  RotateCcw,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Eye
} from 'lucide-react';
import { churnCalculatorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import ChurnSeo from './components/ChurnSeo';
import '../finance-shared/finance-tools.css';

export default function ChurnCalculator({ onBack, toolMeta }) {
  const { visitorCount, trackAction, trackUse, conversionCount, getConversionLabel } = useToolAnalytics(churnCalculatorManifest.slug, toolMeta);

  // Inputs
  const [startCustomers, setStartCustomers] = useState(500);
  const [lostCustomers, setLostCustomers] = useState(15);
  const [startMrr, setStartMrr] = useState(50000);
  const [churnedMrr, setChurnedMrr] = useState(1800);
  const [expansionMrr, setExpansionMrr] = useState(4200);
  const [contractionMrr, setContractionMrr] = useState(600);
  const [copied, setCopied] = useState(false);

  // Analytics: Track calculations when inputs change (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      trackUse?.();
    }, 2000);
    return () => clearTimeout(handler);
  }, [startCustomers, lostCustomers, startMrr, churnedMrr, expansionMrr, contractionMrr, trackUse]);


  // Calculations
  const metrics = useMemo(() => {
    // Logo Churn %
    const logoChurnRate = startCustomers > 0 
      ? Number(((lostCustomers / startCustomers) * 100).toFixed(2)) 
      : 0;

    // Gross Revenue Churn %
    const grossRevChurnRate = startMrr > 0 
      ? Number(((churnedMrr / startMrr) * 100).toFixed(2)) 
      : 0;

    // Gross Revenue Retention (GRR %) = (Start - Contraction - Churn) / Start * 100
    const grr = startMrr > 0 
      ? Number((((startMrr - contractionMrr - churnedMrr) / startMrr) * 100).toFixed(1)) 
      : 0;

    // Net Revenue Retention (NRR %) = (Start + Expansion - Contraction - Churn) / Start * 100
    const nrr = startMrr > 0 
      ? Number((((startMrr + expansionMrr - contractionMrr - churnedMrr) / startMrr) * 100).toFixed(1)) 
      : 0;

    // Average Customer Lifetime (Months)
    const avgLifetimeMonths = logoChurnRate > 0 
      ? Number((100 / logoChurnRate).toFixed(1)) 
      : 999;

    let nrrStatus = 'success';
    let nrrLabel = 'Elite Expansion (NRR > 115%)';
    if (nrr >= 120) {
      nrrStatus = 'success';
      nrrLabel = 'Top Tier Enterprise (NRR ≥ 120%)';
    } else if (nrr >= 105) {
      nrrStatus = 'blue';
      nrrLabel = 'Strong Expansion (105% - 120%)';
    } else if (nrr >= 95) {
      nrrStatus = 'warning';
      nrrLabel = 'Moderate SMB Retention (95% - 105%)';
    } else {
      nrrStatus = 'danger';
      nrrLabel = 'High Churn Leak (< 95%)';
    }

    return {
      logoChurnRate,
      grossRevChurnRate,
      grr,
      nrr,
      avgLifetimeMonths,
      nrrStatus,
      nrrLabel
    };
  }, [startCustomers, lostCustomers, startMrr, churnedMrr, expansionMrr, contractionMrr]);

  const handleCopyReport = () => {
    trackAction('copy_churn_report');
    const report = `📊 SaaS Retention & Churn Analysis (Cerilas Tools)
---------------------------------------------
👥 Logo Churn Rate: ${metrics.logoChurnRate}% / month (${lostCustomers} lost of ${startCustomers})
💸 Gross Revenue Churn: ${metrics.grossRevChurnRate}% / month ($${churnedMrr.toLocaleString()})
📈 Net Revenue Retention (NRR): ${metrics.nrr}% (${metrics.nrrLabel})
🛡 Gross Revenue Retention (GRR): ${metrics.grr}%
⏳ Avg Customer Lifetime: ${metrics.avgLifetimeMonths} Months
---------------------------------------------
Generated via https://tools.cerilas.com/#/tool/churn-calculator`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStartCustomers(500);
    setLostCustomers(15);
    setStartMrr(50000);
    setChurnedMrr(1800);
    setExpansionMrr(4200);
    setContractionMrr(600);
  };

  return (
    <div className="c-tool-page-container finance-tool-container">
      <ToolHeader 
        title={churnCalculatorManifest.title}
        subtitle={churnCalculatorManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        slug={churnCalculatorManifest.slug}
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
            <Badge variant="blue" icon={<Activity size={11} />}>Net Revenue Retention</Badge>
            <Badge variant="success" icon={<CheckCircle2 size={11} />}>Cohort Life</Badge>
          </>
        }
      />

      <div className="calc-workspace">
        <div className="calc-grid">
          {/* Left Column: Inputs */}
          <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <Users size={18} />
              <span>Retention Parameters</span>
            </h2>
            <button type="button" onClick={handleReset} className="calc-btn-secondary" style={{ height: '32px', padding: '0 0.7rem', fontSize: '0.76rem' }}>
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="calc-inputs-list">
            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Active Customers (Start of Month)</label>
                <span className="calc-field-hint">Accounts baseline</span>
              </div>
              <input 
                type="number" 
                className="calc-input" 
                value={startCustomers}
                onChange={(e) => setStartCustomers(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                step={25}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label" style={{ color: '#ef4444' }}>
                  <ArrowDownRight size={14} /> Customers Lost (Cancellations)
                </label>
                <span className="calc-field-hint">Cancelled accounts</span>
              </div>
              <input 
                type="number" 
                className="calc-input" 
                value={lostCustomers}
                onChange={(e) => setLostCustomers(Math.max(0, Number(e.target.value) || 0))}
                min={0}
                step={1}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Starting MRR</label>
                <span className="calc-field-hint">Month opening revenue</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={startMrr}
                  onChange={(e) => setStartMrr(Math.max(1, Number(e.target.value) || 1))}
                  min={1}
                  step={1000}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label" style={{ color: '#ef4444' }}>
                  Churned MRR (Lost Revenue)
                </label>
                <span className="calc-field-hint">From cancellations</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={churnedMrr}
                  onChange={(e) => setChurnedMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={250}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label" style={{ color: '#10b981' }}>
                  Expansion MRR (Upgrades)
                </label>
                <span className="calc-field-hint">From retained customers</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={expansionMrr}
                  onChange={(e) => setExpansionMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={250}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label" style={{ color: '#f59e0b' }}>
                  Contraction MRR (Downgrades)
                </label>
                <span className="calc-field-hint">Reduced tier / seats</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={contractionMrr}
                  onChange={(e) => setContractionMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={100}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Metrics */}
        <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <RotateCcw size={18} />
              <span>Retention Summary</span>
            </h2>
            <span className={`calc-kpi-badge badge-${metrics.nrrStatus}`}>
              {metrics.nrrLabel}
            </span>
          </div>

          {/* Primary Hero KPI: NRR */}
          <div className="calc-hero-kpi status-success">
            <div className="calc-kpi-top">
              <span className="calc-kpi-label">Net Revenue Retention (NRR)</span>
              <Activity size={18} style={{ opacity: 0.6 }} />
            </div>
            <div className="calc-kpi-value" style={{ color: metrics.nrr >= 100 ? '#10b981' : '#ef4444' }}>
              {metrics.nrr}%
            </div>
            <p className="calc-kpi-subtext">
              {metrics.nrr >= 100 
                ? 'Negative Net Churn achieved! Your customer base expands revenue even with zero new acquisitions.'
                : 'Net contraction. Upgrades do not yet compensate for churned and downgraded accounts.'}
            </p>
          </div>

          {/* Secondary Cards */}
          <div className="calc-sub-grid">
            <div className="calc-sub-card">
              <span className="calc-sub-label">Customer (Logo) Churn</span>
              <span className="calc-sub-value" style={{ color: metrics.logoChurnRate <= 2.5 ? '#10b981' : '#f59e0b' }}>
                {metrics.logoChurnRate}%/mo
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Gross Revenue Churn</span>
              <span className="calc-sub-value">
                {metrics.grossRevChurnRate}%/mo
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Gross Revenue Retention (GRR)</span>
              <span className="calc-sub-value">
                {metrics.grr}%
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Average Customer Lifetime</span>
              <span className="calc-sub-value" style={{ color: '#3b82f6' }}>
                {metrics.avgLifetimeMonths > 120 ? '120+ Mo' : `${metrics.avgLifetimeMonths} Mo`}
              </span>
            </div>
          </div>

          {/* Benchmark Box */}
          <div className="calc-benchmark-box">
            <div className="calc-benchmark-header">
              <span>NRR Target Benchmarks</span>
              <span style={{ fontWeight: 600 }}>Median: 104%</span>
            </div>
            <div className="calc-benchmark-track">
              <div 
                className="calc-benchmark-fill" 
                style={{ 
                  width: `${Math.min(100, Math.max(10, (metrics.nrr / 140) * 100))}%`,
                  background: metrics.nrr >= 115 ? '#10b981' : metrics.nrr >= 100 ? '#3b82f6' : '#f59e0b'
                }}
              />
            </div>
            <div className="calc-benchmark-labels">
              <span>80% (High Churn)</span>
              <span>100% (Neutral)</span>
              <span>120%+ (Enterprise Tier)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="calc-actions-row">
            <button type="button" onClick={handleCopyReport} className="calc-btn-primary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Summary Copied!' : 'Copy Retention Report'}</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Comprehensive Long-Form SEO & Venture Guide */}
      <ChurnSeo />

      {/* AdSlot */}
      <AdSlot format="billboard" slotId="ad-churn-billboard" />
    </div>
  );
}
