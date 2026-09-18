import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingDown,
  Clock,
  ShieldCheck,
  Flame,
  AlertTriangle,
  ChevronDown,
  Check,
  Calculator,
  Compass,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import '../../finance-shared/FinanceSeo.css';

const FAQ_ITEMS = [
  {
    q: 'How do you calculate startup runway accurately?',
    a: 'Startup runway is calculated by dividing your current cash balance (including bank deposits and liquid short-term investments) by your net monthly burn rate. Net burn rate equals your total monthly cash outflows (payroll, server infrastructure, rent, marketing) minus your actual collected monthly cash revenues. Formula: Runway (Months) = Total Cash Balance / Net Monthly Burn Rate.'
  },
  {
    q: 'What is the difference between Gross Burn Rate and Net Burn Rate?',
    a: 'Gross Burn Rate measures the absolute total cash your startup spends each month regardless of income (e.g., spending $100,000/mo on engineering, SaaS tools, and marketing). Net Burn Rate is the actual monthly deficit after subtracting cash collections (e.g., if you generate $40,000 in monthly revenue while spending $100,000, your Net Burn is $60,000/mo). Investors and board members evaluate runway strictly based on Net Burn.'
  },
  {
    q: 'How many months of runway should a venture-backed startup maintain?',
    a: 'Top venture capital firms (including Sequoia, Y Combinator, and Andreessen Horowitz) advise early-stage startups to maintain at least 18 to 24 months of runway following a funding round. Fundraisings typically take 4 to 6 months from initial partner meetings to legal wiring. Operating with less than 12 months puts founders in a weak negotiating position, while less than 6 months constitutes an emergency requiring immediate headcount or expense reductions.'
  },
  {
    q: 'When is a startup officially "Default Alive" vs "Default Dead"?',
    a: 'Coined by Y Combinator founder Paul Graham, a startup is "Default Alive" if its current trajectory of revenue growth and expense burn will allow it to achieve cash flow profitability before running out of money. If the company will exhaust its cash reserves before breaking even at its current growth rate, it is "Default Dead" and completely reliant on securing follow-on venture rounds to survive.'
  },
  {
    q: 'Should founders factor expected future funding into their cash runway calculations?',
    a: 'No, never. Conservative financial planning dictates that runway calculations must only include cash currently cleared in your business bank accounts. Verbal investor commitments, unsigned term sheets, conditional grants, or expected venture debt should never be included in your zero-cash runway forecast until the funds have settled.'
  },
  {
    q: 'How does revenue churn or customer expansion impact runway length?',
    a: 'In subscription (SaaS) businesses, monthly revenue fluctuates. If churn exceeds new acquisitions, Net Burn accelerates month-over-month, shortening runway faster than a static formula predicts. Conversely, strong Net Negative Churn (expansion revenue exceeding churn) naturally depresses net burn, extending your survival runway automatically.'
  },
  {
    q: 'What are the quickest ways to extend startup runway without external capital?',
    a: 'The three most immediate levers to extend runway are: (1) Offering discounts (15–20%) to monthly subscribers for switching to upfront annual payments to pull future cash forward; (2) Auditing and eliminating redundant third-party SaaS subscriptions and cloud computing waste; (3) Pausing non-performing top-of-funnel paid marketing campaigns to concentrate on high-converting organic channels.'
  },
  {
    q: 'Is this Startup Runway Calculator completely free and private?',
    a: 'Yes, 100%. Cerilas Tools runs this calculator entirely client-side inside your browser memory. Your company financial metrics, cash balance, and burn figures are never transmitted to our servers or saved in any database, ensuring total confidentiality for founders and CFOs.'
  }
];

export default function StartupRunwaySeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'startup-runway-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/startup-runway-calculator#software',
          'name': 'Cerilas Free Startup Runway & Cash Burn Rate Calculator',
          'alternateName': [
            'Startup Runway Calculator',
            'Burn Rate Calculator for SaaS',
            'Cash Out Date Forecaster',
            'Venture Capital Runway Estimator',
            'Default Alive Calculator'
          ],
          'operatingSystem': 'All modern browsers (Chrome, Safari, Firefox, Edge)',
          'applicationCategory': 'BusinessApplication, FinanceApplication',
          'image': 'https://tools.cerilas.com/og-image.svg',
          'softwareVersion': '2.0.0',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
          },
          'author': {
            '@type': 'Organization',
            'name': 'Cerilas High Tech',
            'url': 'https://cerilas.com'
          },
          'description': 'The definitive free startup runway and cash burn calculator. Forecast your exact Zero-Cash Date, compute Net vs Gross Burn, and test Default Alive scenarios with complete in-browser privacy.'
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/startup-runway-calculator#howto',
          'name': 'How to Calculate Your Startup Runway and Zero-Cash Date',
          'description': 'A 4-step framework for founders to forecast survival months and avoid emergency fundraising.',
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Determine Cleared Liquid Cash',
              'text': 'Sum all checking accounts, savings deposits, and liquid cash equivalents currently in your corporate accounts.'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Calculate Monthly Gross Outflows',
              'text': 'Tally all operating expenses: employee payroll, benefits, SaaS tools, cloud infrastructure, and office overhead.'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Subtract Monthly Collected Revenue',
              'text': 'Deduct actual collected recurring revenues from gross expenses to establish your true Net Monthly Burn Rate.'
            },
            {
              '@type': 'HowToStep',
              'position': 4,
              'name': 'Compute Runway & Zero-Cash Date',
              'text': 'Divide liquid cash by net monthly burn. Identify your exact Zero-Cash Date and establish a fundraising trigger 6 months prior.'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/startup-runway-calculator#faq',
          'mainEntity': FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            'name': item.q,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.a
            }
          }))
        }
      ]
    };

    jsonLdScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(jsonLdScript);

    return () => {
      const existing = document.getElementById('startup-runway-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="finance-seo-root" aria-label="Startup Runway and Cash Burn Complete Financial Guide">
      {/* Header */}
      <div className="finance-seo-header">
        <div className="finance-seo-badge">
          <Sparkles size={14} />
          <span>Venture Finance & Capital Efficiency Architecture</span>
        </div>
        <h2 className="finance-seo-main-title">
          The Definitive Guide to Startup Runway, Burn Rates & Zero-Cash Planning
        </h2>
        <p className="finance-seo-main-desc">
          Cash is the oxygen of every early-stage company. Discover how venture capitalists audit burn multiples, 
          forecast exact zero-cash dates, and structure fundraising schedules to avoid catastrophic down-rounds.
        </p>
      </div>

      {/* AI / VC Knowledge Capsule */}
      <div className="finance-ai-capsule">
        <div className="finance-capsule-header">
          <Clock className="finance-capsule-icon" size={22} />
          <h3 className="finance-capsule-title">Executive Summary: Why Runway Governs Valuation Leverage</h3>
        </div>
        <div className="finance-capsule-body">
          In venture capital, <strong>runway is leverage</strong>. Founders who begin fundraising with 12+ months of cash 
          consistently secure 35% higher valuations and retain cleaner governance terms because they can comfortably walk away 
          from predatory term sheets. Conversely, entering the market with under 5 months forces emergency bridge loans, 
          severe dilution, or immediate insolvency.
        </div>
        <div className="finance-capsule-highlights">
          <div className="finance-capsule-item">
            <Flame size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <strong>Net Burn Is King:</strong> Never conflate Gross spend with Net burn. True cash longevity equals cash in bank divided by net monthly deficit.
            </div>
          </div>
          <div className="finance-capsule-item">
            <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>The 6-Month Red Line:</strong> When runway drops below 6 months, founders must shift 100% of executive bandwidth to financing or immediate breakeven.
            </div>
          </div>
          <div className="finance-capsule-item">
            <TrendingDown size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <strong>Default Alive Benchmark:</strong> High-growth SaaS startups must reach profitability before cash zero without relying on external financing miracles.
            </div>
          </div>
        </div>
      </div>

      {/* Three Strategic Pillars */}
      <div className="finance-pillars-grid">
        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Calculator size={22} />
          </div>
          <h3 className="finance-pillar-title">1. Dynamic vs Static Burn</h3>
          <p className="finance-pillar-desc">
            Static runway models assume expenses and revenue remain frozen forever. Dynamic forecasting incorporates headcount expansion, annual cloud commits, and seasonal CAC spikes to provide realistic cash horizons.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Compass size={22} />
          </div>
          <h3 className="finance-pillar-title">2. The 18-24 Month Gold Standard</h3>
          <p className="finance-pillar-desc">
            Venture cycles contract during macroeconomic downturns. Seed and Series A companies should target 18 to 24 months of runway at closing, allowing 12 months for execution and 6 months for subsequent fundraising.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <DollarSign size={22} />
          </div>
          <h3 className="finance-pillar-title">3. Burn Multiple Efficiency</h3>
          <p className="finance-pillar-desc">
            Coined by Craft Ventures, Burn Multiple measures how much net cash you burn to generate each dollar of Net New ARR (Net Burn / Net New ARR). Top quartile startups achieve a Burn Multiple under 1.2x.
          </p>
        </div>
      </div>

      {/* Funding Stage Benchmark Table */}
      <div>
        <h3 className="finance-section-heading">Startup Runway Benchmarks by Funding Stage</h3>
        <p className="finance-section-subheading">
          Compare your company&apos;s current cash longevity against top-tier venture standards across each growth stage.
        </p>
        <div className="finance-table-container">
          <table className="finance-benchmark-table">
            <thead>
              <tr>
                <th>Funding Stage</th>
                <th>Target Runway</th>
                <th>Ideal Net Burn Multiplier</th>
                <th>VC Status / Recommendation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Pre-Seed / Angel</strong></td>
                <td>12 – 18 Months</td>
                <td>Frugal / Near Zero (&lt; $15k/mo)</td>
                <td><span className="finance-tag tier-green">Focus: Product-Market Fit</span></td>
              </tr>
              <tr>
                <td><strong>Seed Round ($2M - $4M)</strong></td>
                <td>18 – 24 Months</td>
                <td>$50k – $120k / month</td>
                <td><span className="finance-tag tier-blue">Focus: Repeatable Sales Motion</span></td>
              </tr>
              <tr>
                <td><strong>Series A ($8M - $15M)</strong></td>
                <td>20 – 24 Months</td>
                <td>$150k – $350k / month</td>
                <td><span className="finance-tag tier-blue">Focus: GTM Scale &amp; Rule of 40</span></td>
              </tr>
              <tr>
                <td><strong>Series B+ ($25M+)</strong></td>
                <td>24 – 30 Months</td>
                <td>Burn Multiple &lt; 1.5x</td>
                <td><span className="finance-tag tier-green">Focus: Cash Flow Breakeven</span></td>
              </tr>
              <tr>
                <td><strong>Danger Zone (Any Stage)</strong></td>
                <td>&lt; 6 Months</td>
                <td>Accelerating Burn</td>
                <td><span className="finance-tag tier-red">Emergency: Raise or Cut Immediately</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-World Case Study */}
      <div className="finance-case-study">
        <div className="finance-case-header">
          <h3 className="finance-case-title">Real-World Case Study: Calculating Runway for CloudScale Inc.</h3>
          <span className="finance-tag tier-blue">Step-by-Step Numerical Walkthrough</span>
        </div>
        <p className="calc-guide-text">
          Consider <strong>CloudScale Inc.</strong>, a B2B SaaS startup with $1,400,000 in bank deposits after their Seed round. 
          Their monthly payroll for 8 engineers is $95,000, cloud hosting on AWS is $15,000, and tooling/marketing is $10,000. 
          They currently generate $40,000 in collected Monthly Recurring Revenue (MRR).
        </p>
        <div className="finance-case-math-box">
          1. Gross Monthly Burn = $95,000 (Payroll) + $15,000 (Cloud) + $10,000 (SaaS) = <span className="highlight">$120,000 / month</span><br />
          2. Collected Monthly Revenue = <span className="highlight">$40,000 / month</span><br />
          3. Net Monthly Burn Rate = $120,000 - $40,000 = <span className="highlight">$80,000 / month</span><br />
          4. True Cash Runway = $1,400,000 / $80,000 = <span className="highlight">17.5 Months</span><br />
          5. Zero-Cash Date = Exactly 17.5 months from today.<br />
          6. Fundraise Trigger Date = Month 11.5 (allowing 6 full months to close their Series A).
        </div>
        <p className="calc-guide-text">
          If CloudScale Inc. accelerates MRR growth by $5,000 each month while holding expenses flat, their net burn drops to $0 within 16 months, 
          achieving <strong>Default Alive</strong> status without ever needing another venture dollar.
        </p>
      </div>

      {/* 4 Steps Framework */}
      <div>
        <h3 className="finance-section-heading">4 Strategic Steps to Extend Your Startup Runway</h3>
        <p className="finance-section-subheading">
          Actionable tactics founders can execute this week to extend company life by 3 to 6 months.
        </p>
        <div className="finance-steps-grid">
          <div className="finance-step-card">
            <span className="finance-step-number">Step 01</span>
            <h4 className="finance-step-title">Annual Upfront Billing</h4>
            <p className="finance-step-text">
              Offer a 15% to 20% discount to existing monthly accounts in exchange for upfront annual payments. This immediately pulls 12 months of working capital forward.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 02</span>
            <h4 className="finance-step-title">Audit Cloud &amp; Tool Sprawl</h4>
            <p className="finance-step-text">
              Inspect AWS/GCP commitments, unused seat licenses on Salesforce/Hubspot, and duplicate SaaS subscriptions. Most Series A startups recover $8k–$20k/mo.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 03</span>
            <h4 className="finance-step-title">Rationalize Paid Acquisition</h4>
            <p className="finance-step-text">
              Eliminate paid ads with CAC payback periods exceeding 14 months. Reallocate capital toward high-intent organic search, customer referrals, and product-led loops.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 04</span>
            <h4 className="finance-step-title">Establish Milestone Triggers</h4>
            <p className="finance-step-text">
              Define hard milestones: If ARR does not hit target X by Month Y, immediately initiate hiring freezes or cost reductions rather than waiting for 3 months of runway.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="finance-faq-section">
        <div>
          <h3 className="finance-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="finance-section-subheading">
            Comprehensive answers to venture capital, cash flow, and financial longevity inquiries.
          </p>
        </div>

        <div className="finance-faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className={`finance-faq-item ${openFaq === idx ? 'open' : ''}`}>
              <button
                type="button"
                className="finance-faq-question-btn"
                onClick={() => toggleFaq(idx)}
                aria-expanded={openFaq === idx}
              >
                <span>{item.q}</span>
                <ChevronDown className="finance-faq-chevron" size={18} />
              </button>
              {openFaq === idx && (
                <div className="finance-faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
