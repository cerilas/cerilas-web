import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Check,
  ChevronDown,
  ShieldCheck,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import '../../finance-shared/FinanceSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is the difference between Customer (Logo) Churn and Revenue Churn?',
    a: 'Customer (Logo) Churn measures the percentage of customer accounts that cancel during a given period. Revenue Churn measures the percentage of recurring subscription revenue lost from those departures plus downgrades. Because contract values vary, a SaaS company can lose 5% of its lowest-paying starter accounts while retaining 99% of its revenue, which is why investors prioritize revenue retention over logo retention.'
  },
  {
    q: 'What is Net Revenue Retention (NRR) and why do top VCs demand 120%+?',
    a: 'Net Revenue Retention (NRR) measures the percentage of recurring revenue retained from an existing cohort of customers over a time window (typically monthly or annually), inclusive of plan upgrades, cross-sells, downgrades, and cancellations. When NRR exceeds 100%, the company has unlocked "Net Negative Churn", meaning its business grows naturally even without acquiring any new customers.'
  },
  {
    q: 'What is Gross Revenue Retention (GRR) and how does it differ from NRR?',
    a: 'Gross Revenue Retention (GRR) measures the percentage of recurring revenue retained from an existing customer base EXCLUDING any expansion or upsell revenue. GRR can never exceed 100% and isolates pure churn and contraction. For enterprise software, top-tier venture firms require GRR above 85% to 90%, proving the core product is sticky and essential.'
  },
  {
    q: 'What is an acceptable monthly churn rate for B2B SaaS startups?',
    a: 'Churn benchmarks depend entirely on your target customer profile: (1) Self-Serve / SMB SaaS: 2.5% to 5.0% monthly churn (30% to 45% annually) is common; (2) Mid-Market SaaS ($10k–$50k ACV): 1.0% to 1.5% monthly churn (12% to 18% annually); (3) Enterprise B2B ($100k+ ACV): under 0.5% to 0.8% monthly churn (5% to 8% annually).'
  },
  {
    q: 'What is involuntary churn and how much revenue does it typically destroy?',
    a: 'Involuntary churn (also called passive churn) occurs when a customer cancels accidentally due to expired credit cards, insufficient funds, or banking security fraud triggers. Involuntary churn accounts for 20% to 40% of all SaaS customer losses. Implementing automated pre-dunning emails, card account updaters, and smart retry schedules recovers the vast majority of these accounts.'
  },
  {
    q: 'How do you calculate Average Customer Lifetime from your churn rate?',
    a: 'Assuming linear retention, customer lifespan in months is the mathematical reciprocal of monthly customer churn. Formula: Average Lifespan (Months) = 1 / Monthly Churn Rate. For example, a 2.0% monthly churn rate yields an average customer lifespan of 1 / 0.02 = 50 months (over 4.1 years). Halving your churn rate automatically doubles customer lifetime and LTV.'
  },
  {
    q: 'How should annual contracts be factored into monthly churn tracking?',
    a: 'Annual customers only have the contractual opportunity to churn once every 12 months. Blending annual customers into monthly churn pools artificially dilutes your apparent monthly churn. Best practice is to track cohorts based on contract duration or measure annual renewal cohorts specifically in the month their contracts expire.'
  },
  {
    q: 'What are the most effective tactics to reverse accelerating customer churn?',
    a: 'Proven churn reduction playbooks include: (1) Overhauling first-30-day onboarding with in-app product tours to reach core value faster; (2) Tracking product usage telemetry to flag "at-risk" accounts before they cancel; (3) Implementing annual contract discounts; (4) Introducing a 30-day cancellation pause option rather than immediate deletion.'
  }
];

export default function ChurnSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'churn-calculator-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/churn-calculator#software',
          'name': 'Cerilas Free SaaS Churn Rate & Net Revenue Retention (NRR) Calculator',
          'alternateName': [
            'SaaS Churn Calculator',
            'Net Revenue Retention Calculator',
            'Logo vs Revenue Churn Estimator',
            'Customer Retention Rate Calculator'
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
          'description': 'Calculate Logo Churn, Gross Revenue Churn, GRR, and Net Revenue Retention (NRR) with benchmark guidance and client-side privacy.'
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/churn-calculator#howto',
          'name': 'How to Calculate Customer Churn and Net Revenue Retention (NRR)',
          'description': 'A 4-step framework for subscription founders to audit customer attrition and cohort health.',
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Establish Month Opening Baselines',
              'text': 'Record active paying customer count and starting Monthly Recurring Revenue (MRR) at the start of the month.'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Calculate Logo Churn Rate',
              'text': 'Divide customers lost to cancellation by opening customer count to compute logo attrition.'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Determine Gross Revenue Retention (GRR)',
              'text': 'Deduct churned and contraction MRR from opening MRR to establish core product stickiness.'
            },
            {
              '@type': 'HowToStep',
              'position': 4,
              'name': 'Compute Net Revenue Retention (NRR)',
              'text': 'Factor in expansion MRR from retained accounts to verify if the business achieves Net Negative Churn (> 100%).'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/churn-calculator#faq',
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
      const existing = document.getElementById('churn-calculator-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="finance-seo-root" aria-label="SaaS Churn Rate and Retention Complete Industry Guide">
      {/* Header */}
      <div className="finance-seo-header">
        <div className="finance-seo-badge">
          <Sparkles size={14} />
          <span>Cohort Retention &amp; LTV Architecture</span>
        </div>
        <h2 className="finance-seo-main-title">
          SaaS Churn Rates, Net Revenue Retention (NRR) &amp; Cohort Lifespans
        </h2>
        <p className="finance-seo-main-desc">
          Customer churn is the ultimate ceiling on subscription software compounding. 
          Master the distinction between Logo Churn and Revenue Churn, engineer Net Negative Churn, 
          and audit your customer cohort economics against venture capital benchmarks.
        </p>
      </div>

      {/* AI / VC Executive Capsule */}
      <div className="finance-ai-capsule">
        <div className="finance-capsule-header">
          <RotateCcw className="finance-capsule-icon" size={22} />
          <h3 className="finance-capsule-title">Executive Summary: Why Retention Trumps Acquisition</h3>
        </div>
        <div className="finance-capsule-body">
          In high-growth software companies, <strong>churn is compound interest in reverse</strong>. 
          A company with a 5% monthly churn rate must replace 46% of its customer base every single year just to stand still. 
          Conversely, achieving an NRR above 115% ensures your business will compound revenue organically year after year 
          even if sales and marketing performance temporarily drops to zero.
        </div>
        <div className="finance-capsule-highlights">
          <div className="finance-capsule-item">
            <Users size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <strong>Logo vs Revenue:</strong> Never judge retention on account counts alone. Losing low-tier accounts while retaining high-ACV enterprise accounts protects gross margins.
            </div>
          </div>
          <div className="finance-capsule-item">
            <TrendingUp size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>Net Negative Churn:</strong> When Expansion MRR exceeds Churned and Contraction MRR, your NRR exceeds 100%, unlocking compounding growth.
            </div>
          </div>
          <div className="finance-capsule-item">
            <ShieldCheck size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <strong>GRR Safeguard:</strong> Gross Revenue Retention (GRR) measures pure product necessity. Elite enterprise software companies achieve GRR above 90%.
            </div>
          </div>
        </div>
      </div>

      {/* 3 Strategic Pillars */}
      <div className="finance-pillars-grid">
        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Users size={22} />
          </div>
          <h3 className="finance-pillar-title">1. Logo (Customer) Churn</h3>
          <p className="finance-pillar-desc">
            Measures the raw proportion of accounts closing their subscriptions. Highlights product usability barriers, missing baseline functionality, or customer onboarding drop-offs.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <ShieldCheck size={22} />
          </div>
          <h3 className="finance-pillar-title">2. Gross Retention (GRR)</h3>
          <p className="finance-pillar-desc">
            Measures revenue retained from an existing cohort excluding any expansion. Capped at 100%. Demonstrates how much revenue is preserved in worst-case economic downturns.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <TrendingUp size={22} />
          </div>
          <h3 className="finance-pillar-title">3. Net Retention (NRR)</h3>
          <p className="finance-pillar-desc">
            Measures total retained revenue PLUS expansion. The premier health metric evaluated by Wall Street and Silicon Valley VCs to project 5-year valuation multiples.
          </p>
        </div>
      </div>

      {/* Retention Benchmarks Table */}
      <div>
        <h3 className="finance-section-heading">Retention &amp; Churn Benchmarks by Market Segment</h3>
        <p className="finance-section-subheading">
          Standard churn tolerance and NRR expectations across self-serve, mid-market, and enterprise software tiers.
        </p>
        <div className="finance-table-container">
          <table className="finance-benchmark-table">
            <thead>
              <tr>
                <th>Customer Segment</th>
                <th>Monthly Logo Churn</th>
                <th>Annual Logo Churn</th>
                <th>Target GRR</th>
                <th>Target NRR</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Self-Serve / B2C (&lt; $50/mo)</strong></td>
                <td>3.0% – 6.0%</td>
                <td>30% – 50%</td>
                <td>55% – 70%</td>
                <td><span className="finance-tag tier-orange">85% – 95%</span></td>
              </tr>
              <tr>
                <td><strong>SMB SaaS ($100–$500/mo)</strong></td>
                <td>1.5% – 3.0%</td>
                <td>18% – 30%</td>
                <td>75% – 85%</td>
                <td><span className="finance-tag tier-blue">95% – 105%</span></td>
              </tr>
              <tr>
                <td><strong>Mid-Market ($1k–$5k/mo)</strong></td>
                <td>0.8% – 1.5%</td>
                <td>10% – 18%</td>
                <td>85% – 92%</td>
                <td><span className="finance-tag tier-green">105% – 118%</span></td>
              </tr>
              <tr>
                <td><strong>Enterprise B2B ($50k+/yr)</strong></td>
                <td>&lt; 0.5% – 0.8%</td>
                <td>&lt; 6% – 10%</td>
                <td>90% – 96%+</td>
                <td><span className="finance-tag tier-green">115% – 135%+</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-World Case Study */}
      <div className="finance-case-study">
        <div className="finance-case-header">
          <h3 className="finance-case-title">Real-World Case Study: Retention Audit at CloudBase Systems</h3>
          <span className="finance-tag tier-green">Complete Mathematical Model</span>
        </div>
        <p className="calc-guide-text">
          Let&apos;s analyze <strong>CloudBase Systems</strong>, an infrastructure SaaS company. At the start of Q3, their baseline metrics were:
        </p>
        <div className="finance-case-math-box">
          • Starting Active Accounts = <span className="highlight">500 accounts</span><br />
          • Starting Baseline MRR = <span className="highlight">$50,000</span><br />
          • Accounts Cancelled (Lost) = <span className="highlight">15 accounts</span><br />
          • Churned MRR (from cancellations) = <span className="highlight">-$1,800</span><br />
          • Contraction MRR (from downgrades) = <span className="highlight">-$600</span><br />
          • Expansion MRR (from upgrades / add-on seats) = <span className="highlight">+$4,200</span><br />
          --------------------------------------------------<br />
          1. Logo Churn Rate = 15 / 500 = <span className="highlight">3.0% / month</span><br />
          2. Gross Revenue Churn = ($1,800 + $600) / $50,000 = <span className="highlight">4.8% / month</span><br />
          3. Gross Revenue Retention (GRR) = [($50,000 - $2,400) / $50,000] × 100 = <span className="highlight">95.2%</span><br />
          4. Net Revenue Retention (NRR) = [($50,000 + $4,200 - $600 - $1,800) / $50,000] × 100 = <span className="highlight">103.6%</span><br />
          5. Average Customer Lifespan = 1 / 0.03 = <span className="highlight">33.3 Months (2.78 Years)</span>
        </div>
        <p className="calc-guide-text">
          Despite losing 15 accounts (3% logo churn), CloudBase generated $4,200 in expansion revenue, easily surpassing the $2,400 in losses. 
          With an NRR of 103.6%, they achieved <strong>Negative Net Churn</strong>, proving their business expands naturally.
        </p>
      </div>

      {/* 4 Steps Playbook */}
      <div>
        <h3 className="finance-section-heading">4 Strategic Levers to Slash Customer Churn by 40%</h3>
        <p className="finance-section-subheading">
          Operational workflows to detect customer dissatisfaction early and automate involuntary payment recovery.
        </p>
        <div className="finance-steps-grid">
          <div className="finance-step-card">
            <span className="finance-step-number">Step 01</span>
            <h4 className="finance-step-title">Automate Smart Dunning</h4>
            <p className="finance-step-text">
              Deploy Stripe Billing or Churn Buster to retry failed cards on optimal days (after paydays) and send branded pre-expiration notices to eliminate passive churn.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 02</span>
            <h4 className="finance-step-title">Telemetry Health Scoring</h4>
            <p className="finance-step-text">
              Track product engagement indicators (logins per week, key feature triggers, invite rates). Automatically notify Customer Success when an account drops below healthy activity thresholds.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 03</span>
            <h4 className="finance-step-title">In-App Cancellation Surveys</h4>
            <p className="finance-step-text">
              Require feedback when a user clicks cancel. Offer tailored alternatives (e.g., a 2-month plan pause, a 30% temporary discount, or a direct call with a product specialist).
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 04</span>
            <h4 className="finance-step-title">Shift to Annual Contracts</h4>
            <p className="finance-step-text">
              Annual subscribers churn at less than half the rate of monthly subscribers. Offer 2 months free (17% discount) to lock in commitment and give users time to integrate your software deeply.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="finance-faq-section">
        <div>
          <h3 className="finance-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="finance-section-subheading">
            Essential knowledge on customer retention, revenue churn, and cohort lifetime forecasting.
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
