import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Check,
  ChevronDown,
  ShieldCheck,
  Award,
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';
import '../../finance-shared/FinanceSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is Customer Lifetime Value (LTV) and how is it calculated in SaaS?',
    a: 'Customer Lifetime Value (LTV or CLV) represents the total net gross profit an enterprise expects to earn from a customer account across the entire duration of the commercial relationship. In SaaS, true LTV is calculated by multiplying Average Revenue Per User (ARPU) by Gross Margin percentage, and dividing by the monthly customer churn rate. Formula: LTV = (ARPU × Gross Margin %) / Monthly Churn Rate.'
  },
  {
    q: 'Why do generic calculators calculate LTV incorrectly by omitting Gross Margin?',
    a: 'Many basic online tools compute LTV simply as (ARPU / Churn Rate). This calculates Gross Revenue LTV, not true profit. Because delivering software incurs direct costs (cloud hosting, database IOPS, third-party AI APIs, and customer support), you must multiply by Gross Margin. A SaaS generating $1,000 in revenue with an 80% margin yields an LTV of $800, not $1,000.'
  },
  {
    q: 'What is Discounted LTV (DCF) and why does it matter for enterprise software?',
    a: 'When enterprise customer lifespans stretch beyond 3 to 5 years, dollars received in year 4 or 5 are worth less today due to the time value of money, inflation, and your weighted average cost of capital (WACC). Discounted LTV applies a Discounted Cash Flow (DCF) rate (typically 8%–12%) to discount future cash streams back to Present Value (PV), which institutional auditors and acquirers expect.'
  },
  {
    q: 'How does lowering churn affect LTV mathematically?',
    a: 'Customer lifespan in months is the reciprocal of monthly churn (Lifespan = 1 / Churn). If a company reduces monthly churn from 4% (25-month lifespan) to 2% (50-month lifespan), customer lifetime doubles. Because LTV is directly proportional to lifespan, cutting churn in half doubles your Customer Lifetime Value across your entire customer base.'
  },
  {
    q: 'What is the relationship between LTV and your Go-to-Market (GTM) strategy?',
    a: 'Your LTV dictates what sales motion your unit economics can support: (1) LTV < $500 requires 100% self-serve Product-Led Growth (PLG) with zero human touch; (2) LTV $1,000–$5,000 can support paid search advertising and lightweight inside sales; (3) LTV $25,000–$100,000+ justifies dedicated outbound Account Executives, Solutions Architects, and enterprise proof-of-concepts.'
  },
  {
    q: 'What is the Linear Churn Fallacy in SaaS LTV modeling?',
    a: 'The linear churn fallacy assumes churn rates remain static indefinitely. If a startup experiences 0.5% monthly churn, a linear formula suggests an average customer stays for 200 months (over 16 years). In reality, technology platforms evolve rapidly; prudent financial models cap customer lifespan assumptions at 36 to 60 months when projecting cash flows.'
  },
  {
    q: 'How do expansion revenue and tier upgrades affect LTV calculations?',
    a: 'In companies with strong Net Negative Churn (NRR > 100%), customer spend increases over time rather than remaining flat. For expansion-heavy SaaS models, cohort-based LTV modeling or adding an expansion rate variable into the LTV formula yields a significantly higher and more accurate lifetime value.'
  },
  {
    q: 'What are the three most powerful levers to increase customer LTV?',
    a: 'Mathematically, you can expand LTV by: (1) Increasing ARPU through value-metric pricing and add-on modules; (2) Improving Gross Margin by optimizing cloud architecture and infrastructure efficiency; (3) Decreasing churn by investing in customer onboarding, CS playbooks, and automated dunning.'
  }
];

export default function LtvSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'ltv-calculator-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/ltv-calculator#software',
          'name': 'Cerilas Free SaaS Customer Lifetime Value (LTV) Calculator',
          'alternateName': [
            'SaaS LTV Calculator',
            'Customer Lifetime Value Tool',
            'CLV Calculator for Subscription Businesses',
            'Margin-Adjusted LTV Calculator'
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
          'description': 'Calculate margin-adjusted SaaS Customer Lifetime Value (LTV), evaluate customer lifespan horizons, and model Discounted LTV (DCF).'
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/ltv-calculator#howto',
          'name': 'How to Calculate True Margin-Adjusted Customer Lifetime Value (LTV)',
          'description': 'A 4-step framework to determine gross profit per customer account.',
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Establish Average Revenue Per User (ARPU)',
              'text': 'Calculate your monthly collected revenue divided by active paying customer accounts.'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Apply Software Gross Margin',
              'text': 'Multiply ARPU by your gross margin percentage to deduct hosting, database, and payment processing COGS.'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Divide by Monthly Churn Rate',
              'text': 'Divide your monthly gross profit per user by your monthly customer churn rate to compute true LTV.'
            },
            {
              '@type': 'HowToStep',
              'position': 4,
              'name': 'Calculate Discounted LTV for Long Horizons',
              'text': 'For lifespans exceeding 36 months, discount future cash flows using your company cost of capital (WACC).'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/ltv-calculator#faq',
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
      const existing = document.getElementById('ltv-calculator-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="finance-seo-root" aria-label="Customer Lifetime Value Complete Industry Guide">
      {/* Header */}
      <div className="finance-seo-header">
        <div className="finance-seo-badge">
          <Sparkles size={14} />
          <span>SaaS Unit Economics Architecture</span>
        </div>
        <h2 className="finance-seo-main-title">
          Customer Lifetime Value (LTV), Margin Multipliers &amp; DCF Modeling
        </h2>
        <p className="finance-seo-main-desc">
          Customer Lifetime Value sets the ceiling on what you can afford to spend on customer acquisition. 
          Discover how to compute margin-adjusted LTV, model discounted cash flows for enterprise accounts, 
          and align your lifetime value with scalable sales motions.
        </p>
      </div>

      {/* AI / VC Executive Capsule */}
      <div className="finance-ai-capsule">
        <div className="finance-capsule-header">
          <DollarSign className="finance-capsule-icon" size={22} />
          <h3 className="finance-capsule-title">Executive Summary: Why LTV Dictates Your GTM Sales Motion</h3>
        </div>
        <div className="finance-capsule-body">
          In venture-backed software, <strong>your LTV defines your product&apos;s go-to-market boundaries</strong>. 
          A product with a $400 LTV can never afford an outbound sales force, because a single Account Executive salary 
          requires hundreds of closed deals just to break even. Conversely, an enterprise software product with a $120,000 LTV 
          can comfortably spend $30,000 on executive conferences, customized pilot integrations, and dedicated engineering support.
        </div>
        <div className="finance-capsule-highlights">
          <div className="finance-capsule-item">
            <Percent size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>Margin-Adjusted Accuracy:</strong> Never calculate LTV using revenue. True LTV reflects gross profit after subtracting cloud hosting and third-party APIs.
            </div>
          </div>
          <div className="finance-capsule-item">
            <Calendar size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <strong>Reciprocal Lifespan:</strong> Cutting monthly churn from 4% to 2% doubles customer lifespan from 25 to 50 months, doubling LTV overnight.
            </div>
          </div>
          <div className="finance-capsule-item">
            <Clock size={18} style={{ color: '#8b5cf6', flexShrink: 0 }} />
            <div>
              <strong>Discounted Cash Flows:</strong> For 4+ year enterprise accounts, apply an 8%–12% discount rate to account for the time value of money.
            </div>
          </div>
        </div>
      </div>

      {/* 3 Strategic Pillars */}
      <div className="finance-pillars-grid">
        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <DollarSign size={22} />
          </div>
          <h3 className="finance-pillar-title">1. ARPU Expansion</h3>
          <p className="finance-pillar-desc">
            Average Revenue Per User is the most direct lever. Introducing usage-based pricing or add-on enterprise security features expands lifetime value without increasing customer acquisition costs.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Percent size={22} />
          </div>
          <h3 className="finance-pillar-title">2. Gross Margin Efficiency</h3>
          <p className="finance-pillar-desc">
            COGS directly erodes LTV. Improving gross margin from 70% to 85% by optimizing AWS architectures and support workflows immediately boosts lifetime gross profit by 21%.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Calendar size={22} />
          </div>
          <h3 className="finance-pillar-title">3. Churn Compression</h3>
          <p className="finance-pillar-desc">
            Lifespan is the mathematical reciprocal of churn (1 / Churn). Retaining accounts longer compounds subscription cash, allowing you to outbid competitors for customer leads.
          </p>
        </div>
      </div>

      {/* LTV Tiers by Sales Motion Table */}
      <div>
        <h3 className="finance-section-heading">SaaS LTV Tiers &amp; Viable Go-to-Market Motions</h3>
        <p className="finance-section-subheading">
          How customer lifetime value dictates your organizational structure, marketing budget, and sales complexity.
        </p>
        <div className="finance-table-container">
          <table className="finance-benchmark-table">
            <thead>
              <tr>
                <th>LTV Tier</th>
                <th>Typical Lifespan</th>
                <th>Target CAC</th>
                <th>Viable Sales Motion</th>
                <th>Customer Profile</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Micro-SaaS / B2C (&lt; $500)</strong></td>
                <td>12 – 18 Months</td>
                <td><span className="finance-tag tier-green">&lt; $120</span></td>
                <td>100% Product-Led Growth (PLG), self-checkout</td>
                <td>Consumers, Freelancers, Solopreneurs</td>
              </tr>
              <tr>
                <td><strong>SMB SaaS ($1,000 – $5,000)</strong></td>
                <td>24 – 36 Months</td>
                <td><span className="finance-tag tier-blue">$300 – $1,200</span></td>
                <td>Inbound marketing, recorded product tours, inside sales</td>
                <td>Startups, Small Agencies, Boutiques</td>
              </tr>
              <tr>
                <td><strong>Mid-Market ($10,000 – $40,000)</strong></td>
                <td>36 – 48 Months</td>
                <td><span className="finance-tag tier-orange">$2,500 – $10,000</span></td>
                <td>Dedicated Account Executives, customized live demos</td>
                <td>Growing Companies (50–500 employees)</td>
              </tr>
              <tr>
                <td><strong>Enterprise Tier ($100,000+)</strong></td>
                <td>48 – 72+ Months</td>
                <td><span className="finance-tag tier-green">$25,000 – $60,000</span></td>
                <td>Field sales, RFP compliance, multi-stakeholder security audits</td>
                <td>Fortune 500, Global Enterprises, Governments</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-World Case Study */}
      <div className="finance-case-study">
        <div className="finance-case-header">
          <h3 className="finance-case-title">Real-World Case Study: LTV Modeling at TaskFlow Pro</h3>
          <span className="finance-tag tier-green">Complete Mathematical Model</span>
        </div>
        <p className="calc-guide-text">
          Let&apos;s analyze <strong>TaskFlow Pro</strong>, a workflow management SaaS startup. Their operating metrics are:
        </p>
        <div className="finance-case-math-box">
          • Average Revenue Per User (ARPU) = <span className="highlight">$200 / month</span><br />
          • Software Gross Margin = <span className="highlight">80% (Hosting + payment processing COGS = $40/mo)</span><br />
          • Monthly Gross Profit = $200 × 80% = <span className="highlight">$160 / month</span><br />
          • Monthly Customer Churn Rate = <span className="highlight">2.0% per month</span><br />
          • Annual Discount Rate (WACC) = <span className="highlight">10%</span><br />
          --------------------------------------------------<br />
          1. Expected Customer Lifespan = 1 / 0.02 = <span className="highlight">50 Months (4.17 Years)</span><br />
          2. Gross Revenue per Customer = 50 months × $200 = <span className="highlight">$10,000</span><br />
          3. Margin-Adjusted LTV = 50 months × $160 gross profit = <span className="highlight">$8,000 LTV</span><br />
          4. Discounted LTV (DCF at 10% WACC) = <span className="highlight">$6,240 Present Value</span><br />
          5. Target Maximum CAC (at 3.5x Ratio) = $8,000 / 3.5 = <span className="highlight">$2,285 CAC Allowance</span>
        </div>
        <p className="calc-guide-text">
          By factoring in gross margin and applying a DCF discount rate, TaskFlow Pro models its true economic value at $6,240–$8,000 per customer, 
          allowing its executive team to aggressively budget up to $2,285 per customer acquisition while preserving strong profit margins.
        </p>
      </div>

      {/* 4 Steps Playbook */}
      <div>
        <h3 className="finance-section-heading">4 Strategic Levers to Expand Customer Lifetime Value</h3>
        <p className="finance-section-subheading">
          Operational and pricing tactics to compound revenue retention across customer accounts.
        </p>
        <div className="finance-steps-grid">
          <div className="finance-step-card">
            <span className="finance-step-number">Step 01</span>
            <h4 className="finance-step-title">Align with a Value Metric</h4>
            <p className="finance-step-text">
              Transition from flat-rate pricing to scalable value metrics (active users, API requests, transactions processed). This guarantees ARPU expands naturally alongside customer success.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 02</span>
            <h4 className="finance-step-title">Optimize Infrastructure COGS</h4>
            <p className="finance-step-text">
              Audit cloud spend, database reads, and third-party LLM API token consumption. Expanding gross margin from 70% to 85% delivers an immediate 21% uplift to bottom-line LTV.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 03</span>
            <h4 className="finance-step-title">Invest in Proactive Customer Success</h4>
            <p className="finance-step-text">
              Deploy dedicated CSMs to drive product adoption before renewal milestones. Reducing monthly churn from 3% to 1.5% doubles your average customer lifespan and LTV.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 04</span>
            <h4 className="finance-step-title">Incentivize Multi-Year Commitments</h4>
            <p className="finance-step-text">
              Offer price locks or feature access guarantees in exchange for 2-year or 3-year enterprise contracts, eliminating annual renewal churn risks entirely.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="finance-faq-section">
        <div>
          <h3 className="finance-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="finance-section-subheading">
            Authoritative insights into customer lifetime value modeling, gross margin leverage, and venture capital benchmarks.
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
