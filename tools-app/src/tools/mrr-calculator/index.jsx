import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  DollarSign,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  MinusCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  Activity,
  Zap
} from 'lucide-react';
import { mrrCalculatorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import MrrSeo from './components/MrrSeo';
import '../finance-shared/finance-tools.css';

export default function MrrCalculator({ onBack, toolMeta }) {
  const { visitorCount, trackAction, trackUse, conversionCount, getConversionLabel } = useToolAnalytics(mrrCalculatorManifest.slug, toolMeta);

  // Inputs
  const [startingMrr, setStartingMrr] = useState(50000);
  const [newMrr, setNewMrr] = useState(8500);
  const [expansionMrr, setExpansionMrr] = useState(3500);
  const [contractionMrr, setContractionMrr] = useState(1000);
  const [churnedMrr, setChurnedMrr] = useState(2000);
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
  }, [startingMrr, newMrr, expansionMrr, contractionMrr, churnedMrr, trackUse]);


  // Calculations
  const metrics = useMemo(() => {
    const grossAdditions = newMrr + expansionMrr;
    const grossLosses = contractionMrr + churnedMrr;
    const netNewMrr = grossAdditions - grossLosses;
    const endingMrr = Math.max(0, startingMrr + netNewMrr);
    
    const growthRate = startingMrr > 0 
      ? Number(((netNewMrr / startingMrr) * 100).toFixed(1)) 
      : 0;

    const annualizedArr = endingMrr * 12;

    // SaaS Quick Ratio = (New + Expansion) / (Contraction + Churned)
    const quickRatio = grossLosses > 0 
      ? Number((grossAdditions / grossLosses).toFixed(2)) 
      : 99.9;

    let quickStatus = 'success';
    let quickLabel = 'Elite Growth (> 4.0x)';
    if (quickRatio >= 4.0) {
      quickStatus = 'success';
      quickLabel = 'Elite SaaS Scale (≥ 4.0x)';
    } else if (quickRatio >= 2.0) {
      quickStatus = 'blue';
      quickLabel = 'Healthy Growth (2.0x - 4.0x)';
    } else if (quickRatio >= 1.0) {
      quickStatus = 'warning';
      quickLabel = 'Slow Growth / Leaky Bucket (1.0x - 2.0x)';
    } else {
      quickStatus = 'danger';
      quickLabel = 'Contracting (< 1.0x)';
    }

    return {
      grossAdditions,
      grossLosses,
      netNewMrr,
      endingMrr,
      growthRate,
      annualizedArr,
      quickRatio,
      quickStatus,
      quickLabel
    };
  }, [startingMrr, newMrr, expansionMrr, contractionMrr, churnedMrr]);

  const handleCopyReport = () => {
    trackAction('copy_mrr_report');
    const report = `📊 SaaS MRR & Quick Ratio Report (Cerilas Tools)
---------------------------------------------
🔹 Starting MRR: $${startingMrr.toLocaleString()}
➕ New MRR: +$${newMrr.toLocaleString()}
📈 Expansion MRR: +$${expansionMrr.toLocaleString()}
📉 Contraction MRR: -$${contractionMrr.toLocaleString()}
❌ Churned MRR: -$${churnedMrr.toLocaleString()}
---------------------------------------------
🚀 Ending MRR: $${metrics.endingMrr.toLocaleString()}
⚡ Net New MRR: ${metrics.netNewMrr >= 0 ? '+' : ''}$${metrics.netNewMrr.toLocaleString()} (${metrics.growthRate >= 0 ? '+' : ''}${metrics.growthRate}% MoM)
💰 Run-Rate ARR: $${metrics.annualizedArr.toLocaleString()}
🎯 SaaS Quick Ratio: ${metrics.quickRatio}x (${metrics.quickLabel})
---------------------------------------------
Generated via https://tools.cerilas.com/#/tool/mrr-calculator`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStartingMrr(50000);
    setNewMrr(8500);
    setExpansionMrr(3500);
    setContractionMrr(1000);
    setChurnedMrr(2000);
  };

  return (
    <div className="c-tool-page-container finance-tool-container">
      <ToolHeader 
        title={mrrCalculatorManifest.title}
        subtitle={mrrCalculatorManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        slug={mrrCalculatorManifest.slug}
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
            <Badge variant="blue" icon={<BarChart3 size={11} />}>SaaS Quick Ratio</Badge>
            <Badge variant="success" icon={<CheckCircle2 size={11} />}>B2B Benchmarks</Badge>
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
              <span>MRR Movement Components</span>
            </h2>
            <button type="button" onClick={handleReset} className="calc-btn-secondary" style={{ height: '32px', padding: '0 0.7rem', fontSize: '0.76rem' }}>
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="calc-inputs-list">
            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Starting MRR (Beginning of Month)</label>
                <span className="calc-field-hint">Base recurring revenue</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={startingMrr}
                  onChange={(e) => setStartingMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label" style={{ color: '#10b981' }}>
                  <PlusCircle size={14} /> New MRR (New Customers)
                </label>
                <span className="calc-field-hint">First-time acquired subscribers</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={newMrr}
                  onChange={(e) => setNewMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={500}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label" style={{ color: '#3b82f6' }}>
                  <ArrowUpRight size={14} /> Expansion MRR (Upgrades)
                </label>
                <span className="calc-field-hint">Tier upgrades &amp; extra seats</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={expansionMrr}
                  onChange={(e) => setExpansionMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={500}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label" style={{ color: '#f59e0b' }}>
                  <ArrowDownRight size={14} /> Contraction MRR (Downgrades)
                </label>
                <span className="calc-field-hint">Lower tiers &amp; reduced usage</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={contractionMrr}
                  onChange={(e) => setContractionMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={250}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label" style={{ color: '#ef4444' }}>
                  <MinusCircle size={14} /> Churned MRR (Cancellations)
                </label>
                <span className="calc-field-hint">Completely lost customer revenue</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={churnedMrr}
                  onChange={(e) => setChurnedMrr(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={500}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Metrics */}
        <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <TrendingUp size={18} />
              <span>MRR Summary</span>
            </h2>
            <span className={`calc-kpi-badge badge-${metrics.quickStatus}`}>
              {metrics.quickLabel}
            </span>
          </div>

          {/* Primary KPI: Ending MRR */}
          <div className="calc-hero-kpi status-success">
            <div className="calc-kpi-top">
              <span className="calc-kpi-label">Ending MRR</span>
              <DollarSign size={18} style={{ opacity: 0.6 }} />
            </div>
            <div className="calc-kpi-value">
              ${metrics.endingMrr.toLocaleString()}
            </div>
            <p className="calc-kpi-subtext">
              Net growth of <strong>{metrics.netNewMrr >= 0 ? '+' : ''}${metrics.netNewMrr.toLocaleString()}</strong> ({metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate}% MoM)
            </p>
          </div>

          {/* Secondary Cards */}
          <div className="calc-sub-grid">
            <div className="calc-sub-card">
              <span className="calc-sub-label">Run-Rate ARR</span>
              <span className="calc-sub-value" style={{ color: '#3b82f6' }}>
                ${metrics.annualizedArr.toLocaleString()}
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">SaaS Quick Ratio</span>
              <span className="calc-sub-value">
                {metrics.quickRatio}x
              </span>
            </div>
          </div>

          {/* Visual Additions vs Losses Breakdown */}
          <div className="calc-benchmark-box">
            <div className="calc-benchmark-header">
              <span>Gross Additions vs Losses</span>
              <span>+${metrics.grossAdditions.toLocaleString()} / -${metrics.grossLosses.toLocaleString()}</span>
            </div>
            <div className="calc-benchmark-track">
              <div 
                className="calc-benchmark-fill" 
                style={{ 
                  width: `${Math.min(100, Math.max(10, (metrics.grossAdditions / (metrics.grossAdditions + metrics.grossLosses || 1)) * 100))}%`,
                  background: metrics.quickRatio >= 4.0 ? '#10b981' : metrics.quickRatio >= 2.0 ? '#3b82f6' : '#f59e0b'
                }}
              />
            </div>
            <div className="calc-benchmark-labels">
              <span>Losses: ${metrics.grossLosses.toLocaleString()}</span>
              <span>Net: +${metrics.netNewMrr.toLocaleString()}</span>
              <span>Additions: ${metrics.grossAdditions.toLocaleString()}</span>
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
      <MrrSeo />

      {/* AdSlot */}
      <AdSlot format="billboard" slotId="ad-mrr-billboard" />
    </div>
  );
}
