import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  Flame,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Lock,
  Eye,
  Activity
} from 'lucide-react';
import { startupRunwayCalculatorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import StartupRunwaySeo from './components/StartupRunwaySeo';
import '../finance-shared/finance-tools.css';

export default function StartupRunwayCalculator({ onBack, toolMeta }) {
  const { visitorCount, trackAction, trackUse, conversionCount, getConversionLabel } = useToolAnalytics(startupRunwayCalculatorManifest.slug, toolMeta);

  // Default initial values
  const [cashBalance, setCashBalance] = useState(600000);
  const [grossBurn, setGrossBurn] = useState(48000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(12000);
  const [growthRate, setGrowthRate] = useState(8);
  const [additionalSpend, setAdditionalSpend] = useState(0);
  const [expenseCutPercent, setExpenseCutPercent] = useState(0);
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
  }, [cashBalance, grossBurn, monthlyRevenue, growthRate, additionalSpend, expenseCutPercent, trackUse]);


  // Calculate dynamic month-by-month runway
  const runwayData = useMemo(() => {
    const effectiveGrossBurn = (grossBurn * (1 - expenseCutPercent / 100)) + additionalSpend;
    const initialNetBurn = effectiveGrossBurn - monthlyRevenue;

    let remainingCash = cashBalance;
    let currentRev = monthlyRevenue;
    let months = 0;
    let reachedBreakEven = false;
    let breakEvenMonth = 0;
    const maxMonths = 60;
    const trajectory = [];

    while (remainingCash > 0 && months < maxMonths) {
      months++;
      const currentNetBurn = effectiveGrossBurn - currentRev;
      
      if (currentNetBurn <= 0 && !reachedBreakEven) {
        reachedBreakEven = true;
        breakEvenMonth = months;
      }

      remainingCash -= currentNetBurn;
      trajectory.push({
        month: months,
        revenue: Math.round(currentRev),
        grossBurn: Math.round(effectiveGrossBurn),
        netBurn: Math.round(currentNetBurn),
        cashRemaining: Math.max(0, Math.round(remainingCash))
      });

      if (remainingCash <= 0) break;
      currentRev = currentRev * (1 + growthRate / 100);
    }

    // Static runway (without growth compounding)
    const staticRunwayMonths = initialNetBurn > 0 
      ? Number((cashBalance / initialNetBurn).toFixed(1)) 
      : 999;

    // Dynamic runway in months
    const dynamicRunwayMonths = reachedBreakEven && remainingCash > 0
      ? Infinity 
      : Number((months - (remainingCash < 0 ? Math.abs(remainingCash) / trajectory[trajectory.length - 1]?.netBurn || 0 : 0)).toFixed(1));

    // Zero cash date calculation
    const today = new Date();
    let zeroCashDateStr = 'Never (Profitable)';
    if (isFinite(dynamicRunwayMonths) && dynamicRunwayMonths > 0) {
      const zeroDate = new Date(today.getTime() + dynamicRunwayMonths * 30.4375 * 24 * 60 * 60 * 1000);
      zeroCashDateStr = zeroDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // Verdict & Benchmark
    let status = 'success';
    let verdictLabel = 'Healthy Runway';
    if (!isFinite(dynamicRunwayMonths) || dynamicRunwayMonths >= 18) {
      status = 'success';
      verdictLabel = dynamicRunwayMonths === Infinity ? 'Default Alive (Profitable)' : 'Exceptional Runway (18+ Mo)';
    } else if (dynamicRunwayMonths >= 12) {
      status = 'blue';
      verdictLabel = 'Standard Seed/Series A (12-18 Mo)';
    } else if (dynamicRunwayMonths >= 6) {
      status = 'warning';
      verdictLabel = 'Active Fundraising Zone (6-12 Mo)';
    } else {
      status = 'danger';
      verdictLabel = 'Critical Burn Zone (< 6 Mo)';
    }

    return {
      effectiveGrossBurn,
      initialNetBurn,
      staticRunwayMonths,
      dynamicRunwayMonths,
      zeroCashDateStr,
      status,
      verdictLabel,
      reachedBreakEven,
      breakEvenMonth,
      trajectory: trajectory.slice(0, 12)
    };
  }, [cashBalance, grossBurn, monthlyRevenue, growthRate, additionalSpend, expenseCutPercent]);

  // Copy Summary Report
  const handleCopyReport = () => {
    trackAction('copy_runway_report');
    const report = `📊 Startup Runway & Burn Analysis (Cerilas Tools)
---------------------------------------------
💰 Cash Balance: $${cashBalance.toLocaleString()}
🔥 Gross Monthly Burn: $${grossBurn.toLocaleString()}
📈 Monthly Revenue: $${monthlyRevenue.toLocaleString()} (${growthRate}% MoM Growth)
📉 Net Monthly Burn: $${runwayData.initialNetBurn.toLocaleString()}
⏱ Runway: ${runwayData.dynamicRunwayMonths === Infinity ? 'Infinite (Break-even reached)' : `${runwayData.dynamicRunwayMonths} Months`}
🗓 Zero Cash Date: ${runwayData.zeroCashDateStr}
🎯 Health Verdict: ${runwayData.verdictLabel}
---------------------------------------------
Generated via https://tools.cerilas.com/#/tool/startup-runway-calculator`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCashBalance(600000);
    setGrossBurn(48000);
    setMonthlyRevenue(12000);
    setGrowthRate(8);
    setAdditionalSpend(0);
    setExpenseCutPercent(0);
  };

  return (
    <div className="c-tool-page-container finance-tool-container">
      <ToolHeader 
        title={startupRunwayCalculatorManifest.title}
        subtitle={startupRunwayCalculatorManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        slug={startupRunwayCalculatorManifest.slug}
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
            <Badge variant="blue" icon={<Calendar size={11} />}>Dynamic MoM Model</Badge>
            <Badge variant="success" icon={<CheckCircle2 size={11} />}>VC Benchmark</Badge>
          </>
        }
      />

      <div className="calc-workspace">
        <div className="calc-grid">
          {/* Left Column: Interactive Input Controls */}
          <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <DollarSign size={18} />
              <span>Financial Inputs</span>
            </h2>
            <button type="button" onClick={handleReset} className="calc-btn-secondary" style={{ height: '32px', padding: '0 0.7rem', fontSize: '0.76rem' }}>
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="calc-inputs-list">
            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Current Cash Balance</label>
                <span className="calc-field-hint">In bank / treasury</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={cashBalance}
                  onChange={(e) => setCashBalance(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={10000}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Monthly Gross Burn</label>
                <span className="calc-field-hint">Total monthly operational spend</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={grossBurn}
                  onChange={(e) => setGrossBurn(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Monthly Revenue (MRR)</label>
                <span className="calc-field-hint">Current cash collected</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Expected Revenue Growth</label>
                <span className="calc-field-hint">{growthRate}% MoM</span>
              </div>
              <div className="calc-input-wrap">
                <input 
                  type="range" 
                  className="calc-range" 
                  value={growthRate}
                  onChange={(e) => setGrowthRate(Number(e.target.value))}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>
            </div>

            {/* What-if Scenarios */}
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(120, 120, 128, 0.1)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Scenario Simulations
              </span>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Add Planned Hiring / Expenses</label>
                <span className="calc-field-hint">+${additionalSpend.toLocaleString()}/mo</span>
              </div>
              <input 
                type="range" 
                className="calc-range" 
                value={additionalSpend}
                onChange={(e) => setAdditionalSpend(Number(e.target.value))}
                min={0}
                max={50000}
                step={2500}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Simulate Cost Cut</label>
                <span className="calc-field-hint">-{expenseCutPercent}% burn</span>
              </div>
              <input 
                type="range" 
                className="calc-range" 
                value={expenseCutPercent}
                onChange={(e) => setExpenseCutPercent(Number(e.target.value))}
                min={0}
                max={50}
                step={5}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Key Outputs & Visuals */}
        <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <Flame size={18} />
              <span>Runway Projections</span>
            </h2>
            <span className={`calc-kpi-badge badge-${runwayData.status}`}>
              {runwayData.verdictLabel}
            </span>
          </div>

          {/* Primary Hero KPI */}
          <div className={`calc-hero-kpi status-${runwayData.status}`}>
            <div className="calc-kpi-top">
              <span className="calc-kpi-label">Estimated Cash Runway</span>
              <Calendar size={18} style={{ opacity: 0.6 }} />
            </div>
            <div className="calc-kpi-value">
              {runwayData.dynamicRunwayMonths === Infinity 
                ? 'Infinite' 
                : `${runwayData.dynamicRunwayMonths} Mo`}
            </div>
            <p className="calc-kpi-subtext">
              {runwayData.dynamicRunwayMonths === Infinity 
                ? `Revenue outpaces burn by Month ${runwayData.breakEvenMonth}. You reach profitability before running out of cash!` 
                : `Projected cash depletion date: ${runwayData.zeroCashDateStr}.`}
            </p>
          </div>

          {/* Secondary KPIs */}
          <div className="calc-sub-grid">
            <div className="calc-sub-card">
              <span className="calc-sub-label">Net Monthly Burn</span>
              <span className="calc-sub-value" style={{ color: runwayData.initialNetBurn > 0 ? '#ef4444' : '#10b981' }}>
                ${Math.abs(runwayData.initialNetBurn).toLocaleString()}/mo
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Static Runway (0% Growth)</span>
              <span className="calc-sub-value">
                {runwayData.staticRunwayMonths > 100 ? '100+ Mo' : `${runwayData.staticRunwayMonths} Mo`}
              </span>
            </div>
          </div>

          {/* Benchmark Guidance */}
          <div className="calc-benchmark-box">
            <div className="calc-benchmark-header">
              <span>Venture Capital Target</span>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>18 Months Ideal</span>
            </div>
            <div className="calc-benchmark-track">
              <div 
                className="calc-benchmark-fill" 
                style={{ 
                  width: `${Math.min(100, (runwayData.dynamicRunwayMonths === Infinity ? 24 : runwayData.dynamicRunwayMonths) / 24 * 100)}%`,
                  background: runwayData.dynamicRunwayMonths >= 18 ? '#10b981' : runwayData.dynamicRunwayMonths >= 12 ? '#3b82f6' : '#f59e0b'
                }}
              />
            </div>
            <div className="calc-benchmark-labels">
              <span>0m</span>
              <span>6m (Fundraise)</span>
              <span>12m (Healthy)</span>
              <span>18m+ (Ideal)</span>
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
      <StartupRunwaySeo />

      {/* AdSlot */}
      <AdSlot format="billboard" slotId="ad-runway-billboard" />
    </div>
  );
}
