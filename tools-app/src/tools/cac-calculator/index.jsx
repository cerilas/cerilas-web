import React, { useState, useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Copy, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  PieChart,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { cacCalculatorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import '../finance-shared/finance-tools.css';

export default function CacCalculator({ onBack, toolMeta }) {
  const { trackAction } = useToolAnalytics(cacCalculatorManifest.slug, toolMeta);

  // Inputs
  const [adSpend, setAdSpend] = useState(15000);
  const [salaries, setSalaries] = useState(18000);
  const [softwareTools, setSoftwareTools] = useState(2500);
  const [agencyFees, setAgencyFees] = useState(3000);
  const [totalNewCustomers, setTotalNewCustomers] = useState(75);
  const [paidNewCustomers, setPaidNewCustomers] = useState(45);
  const [copied, setCopied] = useState(false);

  // Calculations
  const metrics = useMemo(() => {
    const totalExpenses = adSpend + salaries + softwareTools + agencyFees;
    
    // Blended CAC = Total S&M Spend / Total New Customers
    const blendedCac = totalNewCustomers > 0 
      ? Math.round(totalExpenses / totalNewCustomers) 
      : 0;

    // Paid CAC = Ad Spend / Paid Customers
    const paidCac = paidNewCustomers > 0 
      ? Math.round(adSpend / paidNewCustomers) 
      : 0;

    // Organic share
    const organicCustomers = Math.max(0, totalNewCustomers - paidNewCustomers);
    const organicShare = totalNewCustomers > 0 
      ? Number(((organicCustomers / totalNewCustomers) * 100).toFixed(1)) 
      : 0;

    let tierLabel = 'SMB SaaS Tier ($200 - $1,000)';
    let tierStatus = 'blue';
    if (blendedCac >= 5000) {
      tierLabel = 'Enterprise B2B Tier (≥ $5,000)';
      tierStatus = 'success';
    } else if (blendedCac >= 1000) {
      tierLabel = 'Mid-Market Tier ($1,000 - $5,000)';
      tierStatus = 'blue';
    } else if (blendedCac >= 150) {
      tierLabel = 'SMB Tier ($150 - $1,000)';
      tierStatus = 'warning';
    } else {
      tierLabel = 'Self-Serve / Consumer (< $150)';
      tierStatus = 'success';
    }

    return {
      totalExpenses,
      blendedCac,
      paidCac,
      organicCustomers,
      organicShare,
      tierLabel,
      tierStatus
    };
  }, [adSpend, salaries, softwareTools, agencyFees, totalNewCustomers, paidNewCustomers]);

  const handleCopyReport = () => {
    trackAction('copy_cac_report');
    const report = `📊 Customer Acquisition Cost (CAC) Report (Cerilas Tools)
---------------------------------------------
💰 Total S&M Spend: $${metrics.totalExpenses.toLocaleString()}
  • Paid Ad Spend: $${adSpend.toLocaleString()}
  • Team Salaries: $${salaries.toLocaleString()}
  • Software/Tools: $${softwareTools.toLocaleString()}
  • Agency/Contractors: $${agencyFees.toLocaleString()}
👥 Total New Customers: ${totalNewCustomers} (Paid: ${paidNewCustomers}, Organic: ${metrics.organicCustomers})
🌱 Organic Share: ${metrics.organicShare}%
---------------------------------------------
⭐ Blended CAC: $${metrics.blendedCac.toLocaleString()} / customer
🎯 Paid CAC: $${metrics.paidCac.toLocaleString()} / customer
🏷 Market Tier: ${metrics.tierLabel}
---------------------------------------------
Generated via https://tools.cerilas.com/#/tool/cac-calculator`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setAdSpend(15000);
    setSalaries(18000);
    setSoftwareTools(2500);
    setAgencyFees(3000);
    setTotalNewCustomers(75);
    setPaidNewCustomers(45);
  };

  return (
    <div className="calc-container">
      <ToolHeader 
        title="CAC Calculator"
        subtitle="Deconstruct Customer Acquisition Cost, compare Blended vs Paid CAC, and track sales efficiency."
        onBack={onBack}
        backLabel="All Tools"
        slug="cac-calculator"
        badges={
          <>
            <Badge variant="blue" icon={<BarChart3 size={11} />}>Blended vs Paid</Badge>
            <Badge variant="success" icon={<CheckCircle2 size={11} />}>Acquisition Efficiency</Badge>
          </>
        }
      />

      <div className="calc-grid">
        {/* Left Column: Input Form */}
        <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <DollarSign size={18} />
              <span>Sales &amp; Marketing Expenses</span>
            </h2>
            <button type="button" onClick={handleReset} className="calc-btn-secondary" style={{ height: '32px', padding: '0 0.7rem', fontSize: '0.76rem' }}>
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="calc-inputs-list">
            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Direct Ad Spend</label>
                <span className="calc-field-hint">Google, Meta, LinkedIn Ads</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={adSpend}
                  onChange={(e) => setAdSpend(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Sales &amp; Marketing Salaries</label>
                <span className="calc-field-hint">Team payroll &amp; commissions</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={salaries}
                  onChange={(e) => setSalaries(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Marketing Software &amp; Tooling</label>
                <span className="calc-field-hint">HubSpot, CRM, email tools</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={softwareTools}
                  onChange={(e) => setSoftwareTools(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={250}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Agencies &amp; Contractors</label>
                <span className="calc-field-hint">External consultants &amp; design</span>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-affix calc-affix-prefix">$</span>
                <input 
                  type="number" 
                  className="calc-input has-prefix" 
                  value={agencyFees}
                  onChange={(e) => setAgencyFees(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={500}
                />
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Total New Customers Acquired</label>
                <span className="calc-field-hint">All channels combined</span>
              </div>
              <input 
                type="number" 
                className="calc-input" 
                value={totalNewCustomers}
                onChange={(e) => setTotalNewCustomers(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                step={5}
              />
            </div>

            <div className="calc-field">
              <div className="calc-field-header">
                <label className="calc-field-label">Customers Acquired via Paid Ads</label>
                <span className="calc-field-hint">Direct ad attribution</span>
              </div>
              <input 
                type="number" 
                className="calc-input" 
                value={paidNewCustomers}
                onChange={(e) => setPaidNewCustomers(Math.min(totalNewCustomers, Math.max(0, Number(e.target.value) || 0)))}
                min={0}
                max={totalNewCustomers}
                step={5}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output Metrics */}
        <div className="calc-panel">
          <div className="calc-panel-header">
            <h2 className="calc-panel-title">
              <Users size={18} />
              <span>Acquisition Economics</span>
            </h2>
            <span className={`calc-kpi-badge badge-${metrics.tierStatus}`}>
              {metrics.tierLabel}
            </span>
          </div>

          {/* Primary KPI: Blended CAC */}
          <div className="calc-hero-kpi status-success">
            <div className="calc-kpi-top">
              <span className="calc-kpi-label">Blended CAC (Fully Loaded)</span>
              <DollarSign size={18} style={{ opacity: 0.6 }} />
            </div>
            <div className="calc-kpi-value">
              ${metrics.blendedCac.toLocaleString()}
            </div>
            <p className="calc-kpi-subtext">
              Total spend of <strong>${metrics.totalExpenses.toLocaleString()}</strong> across <strong>{totalNewCustomers}</strong> new accounts.
            </p>
          </div>

          {/* Secondary Cards */}
          <div className="calc-sub-grid">
            <div className="calc-sub-card">
              <span className="calc-sub-label">Paid CAC (Ads Only)</span>
              <span className="calc-sub-value" style={{ color: '#3b82f6' }}>
                ${metrics.paidCac.toLocaleString()}
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Organic Share</span>
              <span className="calc-sub-value" style={{ color: '#10b981' }}>
                {metrics.organicShare}% ({metrics.organicCustomers} accounts)
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Total S&amp;M Overhead</span>
              <span className="calc-sub-value">
                ${metrics.totalExpenses.toLocaleString()}
              </span>
            </div>

            <div className="calc-sub-card">
              <span className="calc-sub-label">Team &amp; Tooling Ratio</span>
              <span className="calc-sub-value">
                {Math.round(((salaries + softwareTools + agencyFees) / metrics.totalExpenses) * 100)}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="calc-actions-row">
            <button type="button" onClick={handleCopyReport} className="calc-btn-primary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Summary Copied!' : 'Copy CAC Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEO Guide */}
      <ToolSeoDivider label="CAC Formulas, Blended vs Paid Differences & FAQs" />

      <section className="calc-guide-section">
        <div className="calc-guide-card">
          <h3 className="calc-guide-title">How to Calculate Customer Acquisition Cost (CAC)</h3>
          <p className="calc-guide-text">
            Customer Acquisition Cost (CAC) is the total amount of capital invested to convince a potential customer to buy your product or service. In SaaS, computing a <strong>fully-loaded Blended CAC</strong> is critical because ad spend alone only represents a fraction of true acquisition costs.
          </p>

          <div className="calc-formula-box">
            <strong>Blended CAC Formula:</strong><br />
            Blended CAC = Total S&M Spend (Ads + Payroll + Software + Agencies) / Total New Customers
          </div>

          <p className="calc-guide-text">
            By contrast, <strong>Paid CAC</strong> only divides direct ad spend by paid customer conversions. While Paid CAC is useful for measuring campaign ad efficiency, investors prioritize Blended CAC because it reflects true economic unit viability.
          </p>
        </div>

        <div className="calc-guide-card">
          <h3 className="calc-guide-title">Frequently Asked Questions</h3>
          <div className="calc-faq-grid">
            <div className="calc-faq-item">
              <h4 className="calc-faq-q">Should customer success salaries be included in CAC?</h4>
              <p className="calc-faq-a">
                Customer success salaries dedicated to onboarding and retention are typically classified under Cost of Goods Sold (COGS) rather than CAC. However, SDRs, Account Executives, and growth marketers must always be included in CAC.
              </p>
            </div>
            <div className="calc-faq-item">
              <h4 className="calc-faq-q">How does organic acquisition impact Blended CAC?</h4>
              <p className="calc-faq-a">
                A strong organic acquisition motion (word of mouth, product-led growth, and organic search SEO) drives Blended CAC down significantly, allowing you to acquire customers at a fraction of your competitors' cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AdSlot */}
      <AdSlot format="billboard" slotId="ad-cac-billboard" />
    </div>
  );
}
