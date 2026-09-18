import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Scale,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Check,
  ChevronDown,
  ShieldCheck,
  Award,
  Layers,
  Zap
} from 'lucide-react';
import '../../finance-shared/FinanceSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is the LTV:CAC ratio and why is it so important in SaaS?',
    a: 'The LTV:CAC ratio compares the Customer Lifetime Value (total gross profit generated from a customer account) to the Customer Acquisition Cost (total expenditure required to acquire that account). In venture capital, it is considered the supreme measure of business model scalability. A healthy ratio proves that every dollar invested in sales and marketing yields an attractive, compounding return.'
  },
  {
    q: 'What is considered a "Good" vs "Bad" LTV to CAC ratio?',
    a: 'The industry golden standard for B2B SaaS is an LTV:CAC ratio between 3.0x and 5.0x. A ratio below 1.5x indicates unsustainable unit economics where the business destroys capital on every customer. Conversely, a ratio above 5.0x often signals that a startup is being overly conservative and underinvesting in marketing, leaving market share to competitors.'
  },
  {
    q: 'Why must LTV always be calculated using Gross Margin rather than Top-Line Revenue?',
    a: 'You cannot pay customer acquisition costs with top-line revenue; you can only pay them with gross profit after deducting direct service costs (hosting, third-party APIs, and customer support). If a customer pays $10,000 over their lifetime but your Gross Margin is 70%, your true LTV is $7,000. Ignoring margin inflates LTV artificially by 40%+, leading to dangerous marketing overspend.'
  },
  {
    q: 'What is the relationship between the LTV:CAC ratio and the CAC Payback Period?',
    a: 'LTV:CAC measures the magnitude of your return (how many dollars you make per dollar spent), while the CAC Payback Period measures velocity (how fast you get your money back). A company might boast an impressive 5.0x LTV:CAC, but if its payback period is 36 months, it will suffer severe working capital strain without constant venture equity financing.'
  },
  {
    q: 'How does customer churn affect the LTV:CAC ratio?',
    a: 'Customer lifetime is mathematically derived as the reciprocal of churn (Lifespan = 1 / Churn). Reducing monthly churn from 4% to 2% doubles expected customer lifespan from 25 to 50 months, which immediately doubles your LTV and doubles your LTV:CAC ratio without spending an extra penny on sales or marketing.'
  },
  {
    q: 'How do expansion revenue and Net Negative Churn impact unit economics?',
    a: 'When existing customers expand their subscriptions through seat upgrades or consumption overages faster than other customers churn, average LTV increases dramatically. In companies with 120%+ Net Revenue Retention (NRR), customer lifetime value can become 3x to 5x higher than initial contract values.'
  },
  {
    q: 'Should early-stage Seed startups obsess over their LTV:CAC ratio?',
    a: 'In the earliest stages (Pre-Seed to Seed), customer cohort lifespans are too young to measure empirical LTV accurately. Seed investors focus heavily on CAC Payback Period (under 12 months) and qualitative Product-Market Fit. By Series A and B ($1M–$10M ARR), however, an audited LTV:CAC ratio of 3x+ is non-negotiable.'
  },
  {
    q: 'What are the fastest levers to improve an underperforming LTV:CAC ratio?',
    a: 'To repair an LTV:CAC ratio: (1) Raise pricing by 15%–25% on new accounts to instantly increase ARPU; (2) Introduce usage-based expansion tiers; (3) Cut paid marketing channels with payback periods over 15 months; (4) Overhaul onboarding to eliminate first-90-day churn.'
  }
];

export default function LtvCacSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'ltv-cac-calculator-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/ltv-cac-calculator#software',
          'name': 'Cerilas Free SaaS LTV:CAC Ratio & Unit Economics Calculator',
          'alternateName': [
            'LTV to CAC Calculator',
            'SaaS Unit Economics Calculator',
            'Customer Lifetime Value to CAC Ratio Tool',
            'CAC Payback Velocity Calculator'
          ],
          'operatingSystem': 'All modern web browsers',
          'applicationCategory': 'BusinessApplication, FinanceApplication',
          'image': 'https://tools.cerilas.com/og-image.svg',
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
          'description': 'Analyze your SaaS unit economics, benchmark your LTV:CAC ratio against top-tier venture standards, and calculate your margin-adjusted payback period.'
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/ltv-cac-calculator#howto',
          'name': 'How to Calculate Your SaaS LTV:CAC Ratio & Unit Economics',
          'description': 'A 4-step framework for founders to evaluate capital efficiency and venture readiness.',
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Compute Margin-Adjusted LTV',
              'text': 'Multiply Average Revenue Per User (ARPU) by Gross Margin percentage, then divide by monthly churn rate.'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Calculate Fully-Loaded CAC',
              'text': 'Sum all sales and marketing costs (ad spend, salaries, software) and divide by new customers acquired.'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Divide LTV by CAC',
              'text': 'Calculate the ratio (LTV / CAC) to determine your return on investment per customer account.'
            },
            {
              '@type': 'HowToStep',
              'position': 4,
              'name': 'Verify Payback Period Velocity',
              'text': 'Ensure your CAC Payback Period is under 12 to 18 months to guarantee healthy working capital turnover.'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/ltv-cac-calculator#faq',
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
      const existing = document.getElementById('ltv-cac-calculator-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="finance-seo-root" aria-label="LTV:CAC Ratio and Unit Economics Complete Industry Guide">
      {/* Header */}
      <div className="finance-seo-header">
        <div className="finance-seo-badge">
          <Sparkles size={14} />
          <span>SaaS Unit Economics &amp; Valuation Architecture</span>
        </div>
        <h2 className="finance-seo-main-title">
          The SaaS LTV:CAC Ratio, Gross Margin Leverage &amp; Payback Velocity
        </h2>
        <p className="finance-seo-main-desc">
          The ratio between Customer Lifetime Value (LTV) and Customer Acquisition Cost (CAC) governs startup fundability. 
          Understand the golden 3x–5x benchmark, optimize gross margin profitability, and synchronize return magnitude with payback velocity.
        </p>
      </div>

      {/* AI / VC Executive Capsule */}
      <div className="finance-ai-capsule">
        <div className="finance-capsule-header">
          <Scale className="finance-capsule-icon" size={22} />
          <h3 className="finance-capsule-title">Executive Overview: Why LTV:CAC Governs Venture Scalability</h3>
        </div>
        <div className="finance-capsule-body">
          In SaaS, growth without positive unit economics is suicidal. A business can boast 100% YoY top-line growth, 
          but if its LTV:CAC is 1.2x, each incremental customer destroys net cash value. 
          Venture capital firms look for a <strong>3.0x to 5.0x multiple</strong> because it guarantees that every $1,000,000 poured 
          into marketing generates $3,000,000 to $5,000,000 of high-margin lifetime gross profit to fund R&amp;D and enterprise expansion.
        </div>
        <div className="finance-capsule-highlights">
          <div className="finance-capsule-item">
            <Award size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>The 3x–5x Sweet Spot:</strong> Less than 3x burns capital unnecessarily; higher than 5x indicates you are under-spending on marketing.
            </div>
          </div>
          <div className="finance-capsule-item">
            <Percent size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <strong>Gross Profit, Not Revenue:</strong> Top-line revenue LTV overstates real profitability by 20%–40%. Always deduct COGS.
            </div>
          </div>
          <div className="finance-capsule-item">
            <Clock size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <div>
              <strong>Magnitude vs Velocity:</strong> High LTV is useless if payback takes 36 months. Cash must be recouped within 12 months.
            </div>
          </div>
        </div>
      </div>

      {/* 3 Strategic Pillars */}
      <div className="finance-pillars-grid">
        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Scale size={22} />
          </div>
          <h3 className="finance-pillar-title">1. Return Magnitude (LTV:CAC)</h3>
          <p className="finance-pillar-desc">
            Answers: &quot;For every $1 spent acquiring a customer, how many dollars of net gross profit will they generate over their lifetime?&quot; Target: 3.0x to 5.0x.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Clock size={22} />
          </div>
          <h3 className="finance-pillar-title">2. Capital Velocity (Payback)</h3>
          <p className="finance-pillar-desc">
            Answers: &quot;How many months until customer gross margins repay the upfront cash spent to acquire them?&quot; Elite target: &lt; 12 months.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Percent size={22} />
          </div>
          <h3 className="finance-pillar-title">3. Margin Resilience (COGS)</h3>
          <p className="finance-pillar-desc">
            Software Gross Margins (75%–85%) provide the financial buffer required to absorb acquisition costs. Low-margin SaaS (&lt; 65%) struggles to achieve viable unit economics.
          </p>
        </div>
      </div>

      {/* LTV:CAC Benchmarks Table */}
      <div>
        <h3 className="finance-section-heading">LTV:CAC Ratio Benchmarks &amp; Investment Verdicts</h3>
        <p className="finance-section-subheading">
          How venture capital investment committees evaluate startup unit economics during funding rounds.
        </p>
        <div className="finance-table-container">
          <table className="finance-benchmark-table">
            <thead>
              <tr>
                <th>LTV:CAC Ratio</th>
                <th>Classification</th>
                <th>Economic Reality</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>&lt; 1.0x</strong></td>
                <td><span className="finance-tag tier-red">Capital Destruction</span></td>
                <td>Losing money on every acquired account. Fast path to bankruptcy.</td>
                <td>Immediately halt paid marketing; overhaul core product &amp; pricing.</td>
              </tr>
              <tr>
                <td><strong>1.0x – 2.5x</strong></td>
                <td><span className="finance-tag tier-orange">Marginal Efficiency</span></td>
                <td>Barely covering overhead; vulnerable to slight churn spikes.</td>
                <td>Focus on reducing churn and introducing expansion tiers.</td>
              </tr>
              <tr>
                <td><strong>3.0x – 5.0x</strong></td>
                <td><span className="finance-tag tier-green">The Golden Standard</span></td>
                <td>Optimal balance of capital efficiency and aggressive growth.</td>
                <td>Pour capital into Go-to-Market; scale sales and marketing teams.</td>
              </tr>
              <tr>
                <td><strong>&gt; 5.0x</strong></td>
                <td><span className="finance-tag tier-blue">Underinvesting in Scale</span></td>
                <td>Unit economics are so profitable that you are leaving market share behind.</td>
                <td>Increase marketing budget; test higher-cost acquisition channels.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-World Case Study */}
      <div className="finance-case-study">
        <div className="finance-case-header">
          <h3 className="finance-case-title">Real-World Case Study: Unit Economics at DevMetrics</h3>
          <span className="finance-tag tier-green">Complete Mathematical Model</span>
        </div>
        <p className="calc-guide-text">
          Let&apos;s analyze <strong>DevMetrics</strong>, a developer tools SaaS platform. Their unit economics metrics are:
        </p>
        <div className="finance-case-math-box">
          • Monthly ARPU = <span className="highlight">$250 / month</span><br />
          • Software Gross Margin = <span className="highlight">80% (Hosting + AI inference COGS = $50/mo)</span><br />
          • Monthly Gross Profit per Customer = $250 × 80% = <span className="highlight">$200 / month</span><br />
          • Monthly Customer Churn Rate = <span className="highlight">2.5% per month</span><br />
          --------------------------------------------------<br />
          1. Customer Lifespan = 1 / 0.025 = <span className="highlight">40 Months (3.33 Years)</span><br />
          2. Margin-Adjusted LTV = 40 months × $200 gross profit = <span className="highlight">$8,000 LTV</span><br />
          3. Fully-Loaded CAC = <span className="highlight">$1,600 / customer</span><br />
          4. LTV:CAC Ratio = $8,000 / $1,600 = <span className="highlight">5.0x (Elite Status)</span><br />
          5. CAC Payback Period = $1,600 / $200 = <span className="highlight">8.0 Months (&lt; 12 Month Target!)</span>
        </div>
        <p className="calc-guide-text">
          DevMetrics exhibits textbook SaaS health: an elite 5.0x return multiple paired with a rapid 8-month cash recoup cycle. 
          This allows them to compound revenue efficiently without suffering working capital crunches.
        </p>
      </div>

      {/* 4 Steps Playbook */}
      <div>
        <h3 className="finance-section-heading">4 Strategic Levers to Elevate Your LTV:CAC Ratio</h3>
        <p className="finance-section-subheading">
          Tactical product and operational optimizations to widen the margin between acquisition cost and lifetime value.
        </p>
        <div className="finance-steps-grid">
          <div className="finance-step-card">
            <span className="finance-step-number">Step 01</span>
            <h4 className="finance-step-title">Implement Value-Metric Pricing</h4>
            <p className="finance-step-text">
              Charge based on usage metrics that grow in tandem with customer success (active users, API events, or storage). This expands LTV organically over time.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 02</span>
            <h4 className="finance-step-title">Optimize First-30-Day Onboarding</h4>
            <p className="finance-step-text">
              Over 50% of customer churn happens during initial onboarding. Shortening time-to-value (TTV) directly extends lifespan and multiplies LTV.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 03</span>
            <h4 className="finance-step-title">Double Down on High-LTV Channels</h4>
            <p className="finance-step-text">
              Segment your CAC and LTV by acquisition source. Reallocate capital away from low-retention social ads toward high-intent organic search and partner ecosystems.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 04</span>
            <h4 className="finance-step-title">Optimize Infrastructure COGS</h4>
            <p className="finance-step-text">
              Audit cloud architecture, reserved compute instances, and database queries. Increasing gross margin from 70% to 80% boosts LTV by 14% instantly.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="finance-faq-section">
        <div>
          <h3 className="finance-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="finance-section-subheading">
            Authoritative insights into venture capital benchmarks, payback velocity, and lifetime value modeling.
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
