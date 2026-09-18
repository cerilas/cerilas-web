import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  MinusCircle,
  Check,
  ChevronDown,
  Calculator,
  ShieldCheck,
  Layers,
  HelpCircle
} from 'lucide-react';
import '../../finance-shared/FinanceSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is Monthly Recurring Revenue (MRR) and how is it calculated?',
    a: 'Monthly Recurring Revenue (MRR) is the normalized measure of predictable subscription revenue that a business expects to receive every 30 days. To calculate MRR, multiply the total number of active paying subscribers by their Average Revenue Per User (ARPU). Formula: MRR = Total Active Customers × Monthly ARPU. If customers pay annually, divide the annual contract value (ACV) by 12.'
  },
  {
    q: 'What is Net New MRR and what are its four components?',
    a: 'Net New MRR measures the true net dollar velocity of your subscription growth each month. It consists of four distinct components: (1) New MRR from newly acquired accounts, (2) Expansion MRR from existing customers upgrading tiers or seats, (3) Contraction MRR from plan downgrades, and (4) Churned MRR from cancellations. Formula: Net New MRR = (New MRR + Expansion MRR) - (Contraction MRR + Churned MRR).'
  },
  {
    q: 'What is the SaaS Quick Ratio and what is a good benchmark?',
    a: 'Developed by venture capital firm Social Capital, the SaaS Quick Ratio measures growth efficiency by comparing revenue gained against revenue lost. Formula: Quick Ratio = (New MRR + Expansion MRR) / (Contraction MRR + Churned MRR). A ratio greater than 4.0x is the venture capital gold standard, indicating top-tier capital efficiency. Ratios between 2.0x and 4.0x represent solid growth, while ratios below 1.0x signify a contracting business.'
  },
  {
    q: 'What is Net Negative Churn and why is it so valuable to investors?',
    a: 'Net Negative Churn occurs when Expansion MRR from existing customers exceeds the total revenue lost to churn and downgrades. In this scenario, your existing customer base expands in revenue even if your sales team acquires zero new customers. Companies with Net Negative Churn command 2x to 4x higher enterprise valuation multiples because growth compounds without constant marketing expense.'
  },
  {
    q: 'Should one-time setup fees, professional services, or consulting be included in MRR?',
    a: 'No, never. MRR must strictly include recurring, contractually predictable subscription revenue. One-time implementation fees, migration charges, and consulting services should be classified separately as Non-Recurring Revenue (NRR) or Professional Services Revenue to prevent misleading financial forecasting.'
  },
  {
    q: 'How should annual and multi-year upfront contracts be accounted for in MRR?',
    a: 'An upfront payment must be amortized evenly across the duration of the contract. For instance, if an enterprise signs a $60,000 upfront annual contract, it contributes exactly $5,000 to MRR each month for 12 months ($60,000 / 12). Booking the entire $60,000 in month one will severely distort your growth analytics.'
  },
  {
    q: 'How do customer discounts, free trials, and promo codes affect MRR?',
    a: 'MRR must always be calculated using the actual, net discounted price billed to the customer rather than the list catalog price. If a $200/mo subscription tier is discounted by 25% for 6 months, its MRR is $150 during the promo period and adjusts back to $200 only after the discount expires. Free trial users contribute $0 to MRR until their card is charged.'
  },
  {
    q: 'What is the difference between MRR and ARR?',
    a: 'MRR tracks operational performance on a month-to-month cadence, making it ideal for sales quotas and immediate churn tracking. ARR (Annual Recurring Revenue) is simply MRR multiplied by 12 (ARR = MRR × 12) and is the standard metric used by institutional investors and private equity firms for company valuation and M&A multiples.'
  }
];

export default function MrrSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'mrr-calculator-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/mrr-calculator#software',
          'name': 'Cerilas Free SaaS Monthly Recurring Revenue (MRR) Calculator',
          'alternateName': [
            'MRR Calculator',
            'SaaS Quick Ratio Calculator',
            'Net New MRR Estimator',
            'Subscription Revenue Forecaster'
          ],
          'operatingSystem': 'All modern browsers',
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
          'description': 'Calculate Net New MRR, evaluate your SaaS Quick Ratio, and model Net Negative Churn with the industry-standard free MRR calculator.'
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/mrr-calculator#howto',
          'name': 'How to Calculate Monthly Recurring Revenue (MRR) & Net New Growth',
          'description': 'A 4-step framework to accurately quantify your subscription cash momentum.',
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Aggregate Active Recurring Subscriptions',
              'text': 'Sum all active monthly subscription accounts, normalizing annual contracts by dividing by 12.'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Calculate New & Expansion MRR',
              'text': 'Measure revenue added from brand new accounts and upsells from existing customers.'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Deduct Contraction & Churned Revenue',
              'text': 'Subtract revenue lost to downgrades and outright cancellations to determine Net New MRR.'
            },
            {
              '@type': 'HowToStep',
              'position': 4,
              'name': 'Evaluate Your SaaS Quick Ratio',
              'text': 'Divide total additions by total losses to establish your growth efficiency multiple.'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/mrr-calculator#faq',
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
      const existing = document.getElementById('mrr-calculator-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="finance-seo-root" aria-label="Monthly Recurring Revenue Complete Industry Guide">
      {/* Header */}
      <div className="finance-seo-header">
        <div className="finance-seo-badge">
          <Sparkles size={14} />
          <span>SaaS Revenue Economics Architecture</span>
        </div>
        <h2 className="finance-seo-main-title">
          The Anatomy of Monthly Recurring Revenue (MRR) &amp; Growth Efficiency
        </h2>
        <p className="finance-seo-main-desc">
          Monthly Recurring Revenue is the single most critical top-line metric for subscription businesses. 
          Master the four components of MRR movement, achieve Net Negative Churn, and benchmark your SaaS Quick Ratio against elite venture-backed startups.
        </p>
      </div>

      {/* AI / Executive Capsule */}
      <div className="finance-ai-capsule">
        <div className="finance-capsule-header">
          <DollarSign className="finance-capsule-icon" size={22} />
          <h3 className="finance-capsule-title">Executive Overview: Why MRR Governs SaaS Enterprise Value</h3>
        </div>
        <div className="finance-capsule-body">
          Traditional businesses are valued on trailing EBITDA or net profit margins. By contrast, subscription software companies 
          are priced primarily on <strong>MRR growth velocity, net retention, and capital predictability</strong>. 
          A business with $100,000 in predictable, compounding MRR commands a valuation 5x to 15x higher than a transactional business 
          generating the same revenue because future cash flows are recurring by default.
        </div>
        <div className="finance-capsule-highlights">
          <div className="finance-capsule-item">
            <PlusCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>Expansion Drives Leverage:</strong> Acquiring new customers is 5x more expensive than expanding existing accounts. Expansion MRR is pure high-margin profit.
            </div>
          </div>
          <div className="finance-capsule-item">
            <MinusCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <strong>The Leaky Bucket:</strong> Churn acts as compound interest in reverse. A 5% monthly churn rate wipes out 46% of your customer base every 12 months.
            </div>
          </div>
          <div className="finance-capsule-item">
            <TrendingUp size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <strong>Quick Ratio Benchmark:</strong> A SaaS Quick Ratio above 4.0x proves your sales engine is generating $4 of recurring value for every $1 lost.
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars of MRR */}
      <div className="finance-pillars-grid">
        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <PlusCircle size={22} />
          </div>
          <h3 className="finance-pillar-title">1. New MRR</h3>
          <p className="finance-pillar-desc">
            Revenue generated exclusively from brand new customer accounts converted during the measurement month. Directly validates your top-of-funnel marketing channels and initial product-market fit.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <ArrowUpRight size={22} />
          </div>
          <h3 className="finance-pillar-title">2. Expansion MRR</h3>
          <p className="finance-pillar-desc">
            Incremental revenue from existing accounts through tier upgrades, additional user seats, or usage volume overages. This is the mathematical key to achieving Net Negative Churn.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <ArrowDownRight size={22} />
          </div>
          <h3 className="finance-pillar-title">3. Contraction MRR</h3>
          <p className="finance-pillar-desc">
            Revenue lost when retained customers downgrade to lower-tier plans, remove active seats, or apply permanent discounts. Serves as an early warning signal of upcoming churn.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <MinusCircle size={22} />
          </div>
          <h3 className="finance-pillar-title">4. Churned MRR</h3>
          <p className="finance-pillar-desc">
            Total monthly recurring revenue erased by customers terminating their subscriptions. High churn indicates onboarding friction, missing features, or pricing misalignment.
          </p>
        </div>
      </div>

      {/* SaaS Quick Ratio Benchmark Table */}
      <div>
        <h3 className="finance-section-heading">SaaS Quick Ratio Industry Benchmarks</h3>
        <p className="finance-section-subheading">
          How venture capital firms evaluate your capital efficiency based on recurring additions versus losses.
        </p>
        <div className="finance-table-container">
          <table className="finance-benchmark-table">
            <thead>
              <tr>
                <th>Quick Ratio Multiple</th>
                <th>Performance Tier</th>
                <th>Economic Meaning</th>
                <th>Investor Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>&gt; 4.0x</strong></td>
                <td><span className="finance-tag tier-green">Elite Scale (VC Gold Standard)</span></td>
                <td>Gaining $4+ for every $1 lost. Highly compounding flywheel.</td>
                <td>Aggressive capital injection; scale sales team immediately.</td>
              </tr>
              <tr>
                <td><strong>2.0x – 4.0x</strong></td>
                <td><span className="finance-tag tier-blue">Healthy Growth Pace</span></td>
                <td>Expansion outpaces minor leakage comfortably.</td>
                <td>Standard expansion; optimize retention and customer onboarding.</td>
              </tr>
              <tr>
                <td><strong>1.0x – 2.0x</strong></td>
                <td><span className="finance-tag tier-orange">Leaky Bucket</span></td>
                <td>Sales team works furiously just to replace lost accounts.</td>
                <td>Halt acquisition spend; fix product bugs and customer success.</td>
              </tr>
              <tr>
                <td><strong>&lt; 1.0x</strong></td>
                <td><span className="finance-tag tier-red">Net Contraction</span></td>
                <td>Losing more revenue each month than you are adding.</td>
                <td>Code red; business is shrinking. Immediate pivot required.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-World Case Study */}
      <div className="finance-case-study">
        <div className="finance-case-header">
          <h3 className="finance-case-title">Real-World Case Study: Net New MRR at DataPulse Software</h3>
          <span className="finance-tag tier-green">Worked Math Walkthrough</span>
        </div>
        <p className="calc-guide-text">
          Let&apos;s analyze <strong>DataPulse</strong>, an enterprise analytics SaaS company with a starting MRR baseline of $100,000 at the beginning of October.
        </p>
        <div className="finance-case-math-box">
          • Starting Baseline MRR: <span className="highlight">$100,000</span><br />
          • New MRR (12 new accounts): <span className="highlight">+$14,000</span><br />
          • Expansion MRR (8 existing accounts upgraded): <span className="highlight">+$6,000</span><br />
          • Contraction MRR (3 accounts downgraded): <span className="highlight">-$1,500</span><br />
          • Churned MRR (2 cancellations): <span className="highlight">-$2,500</span><br />
          --------------------------------------------------<br />
          1. Total Revenue Additions = $14,000 + $6,000 = <span className="highlight">+$20,000</span><br />
          2. Total Revenue Losses = $1,500 + $2,500 = <span className="highlight">-$4,000</span><br />
          3. Net New MRR = $20,000 - $4,000 = <span className="highlight">+$16,000 (16% MoM Growth)</span><br />
          4. Ending October MRR = $100,000 + $16,000 = <span className="highlight">$116,000</span><br />
          5. SaaS Quick Ratio = $20,000 / $4,000 = <span className="highlight">5.0x (Elite Status)</span>
        </div>
        <p className="calc-guide-text">
          Because DataPulse achieved an Expansion MRR ($6,000) greater than combined Contraction and Churn ($4,000), they unlocked 
          <strong>Net Negative Churn</strong>. Even with zero new sales next month, their existing base will yield a net expansion of +$2,000.
        </p>
      </div>

      {/* 4 Steps Playbook */}
      <div>
        <h3 className="finance-section-heading">4 Actionable Strategies to Accelerate MRR Growth</h3>
        <p className="finance-section-subheading">
          Proven product and pricing workflows to increase expansion and stem recurring revenue leaks.
        </p>
        <div className="finance-steps-grid">
          <div className="finance-step-card">
            <span className="finance-step-number">Step 01</span>
            <h4 className="finance-step-title">Implement Usage-Based Pricing</h4>
            <p className="finance-step-text">
              Tie your pricing tiers to consumption metrics (API calls, storage, active seats, or contacts). As your customers grow, your MRR expands naturally without sales touchpoints.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 02</span>
            <h4 className="finance-step-title">Automate Dunning &amp; Involuntary Churn</h4>
            <p className="finance-step-text">
              Up to 30% of SaaS churn is caused by expired credit cards. Implement pre-dunning notification emails and intelligent payment retries to instantly recover lost MRR.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 03</span>
            <h4 className="finance-step-title">Create Add-On Feature Modules</h4>
            <p className="finance-step-text">
              Unbundle high-value specialized features (such as SSO, audit logging, custom AI models, or priority support) and sell them as modular add-ons to boost ARPU.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 04</span>
            <h4 className="finance-step-title">Quarterly Price Optimization</h4>
            <p className="finance-step-text">
              Early-stage startups routinely undercharge. Grandfather early adopters while raising catalog prices by 15%–25% on new signups to reflect mature product value.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="finance-faq-section">
        <div>
          <h3 className="finance-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="finance-section-subheading">
            Authoritative answers to common subscription revenue, valuation, and accounting questions.
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
