import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Check,
  ChevronDown,
  ShieldCheck,
  Scale,
  Activity,
  Layers,
  BarChart3
} from 'lucide-react';
import '../../finance-shared/FinanceSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is Annual Recurring Revenue (ARR) and how is it calculated?',
    a: 'Annual Recurring Revenue (ARR) is the annualized value of all active, recurring subscription agreements. For SaaS companies billing on monthly terms, ARR is computed by multiplying current Monthly Recurring Revenue (MRR) by 12. Formula: ARR = MRR × 12. For enterprise businesses with multi-year agreements, ARR equals the total contract value (TCV) divided by the contract duration in years.'
  },
  {
    q: 'What is the Rule of 40 and why do venture capitalists treat it as law?',
    a: 'The Rule of 40 is a benchmark originating in private equity stating that a software company\'s combined Year-over-Year (YoY) revenue growth rate and profit margin should equal or exceed 40%. Formula: Rule of 40 = YoY Growth Rate (%) + Free Cash Flow Margin (%). Startups that beat the Rule of 40 consistently command 2x to 3x higher enterprise valuation multiples because they demonstrate balanced, capital-efficient scalability.'
  },
  {
    q: 'Can a startup burning cash still achieve a passing Rule of 40 score?',
    a: 'Yes, absolutely. In high-growth early stages, burning cash is standard practice provided growth compensates for the deficit. For example, if a Series A company grows ARR by 70% YoY while operating at a -20% Free Cash Flow margin, its score is 70% + (-20%) = 50%, comfortably exceeding the 40% benchmark.'
  },
  {
    q: 'What is a good ARR per Employee benchmark for SaaS startups?',
    a: 'ARR per Employee (Total ARR / Full-Time Equivalents) is the ultimate metric for measuring headcount capital efficiency. Benchmarks: (1) Seed / Series A: $100,000 to $150,000 per employee; (2) Series B / Growth: $180,000 to $250,000 per employee; (3) Best-in-Class Public Scale: $350,000 to $500,000+ per employee (exemplified by high-leverage firms like Datadog, Snowflake, and Atlassian).'
  },
  {
    q: 'What is the difference between ARR and GAAP Recognized Revenue?',
    a: 'ARR is a forward-looking momentum metric reflecting contracted run-rate, whereas GAAP Revenue is a backward-looking accounting measure governed by strict revenue recognition rules (ASC 606). For example, signing a $120,000 annual contract on December 31st adds $120,000 to ARR immediately, but generates $0 of GAAP recognized revenue for that closing fiscal year.'
  },
  {
    q: 'Should one-time implementation fees or professional services be included in ARR?',
    a: 'No. Just like MRR, ARR must strictly reflect predictable recurring subscription software revenue. One-time onboarding fees, data migration charges, custom engineering, and pilot setup charges must be stripped out and booked separately under Services Revenue.'
  },
  {
    q: 'How do usage-based and consumption pricing models calculate ARR?',
    a: 'For consumption-driven platforms (like AWS, Twilio, or Snowflake), ARR cannot be simply taken from contract maximums. Instead, companies compute an "Annualized Run-Rate" by taking trailing 30-day actual consumption and multiplying by 12, or calculating a 3-month trailing moving average to eliminate seasonal or promotional spikes.'
  },
  {
    q: 'How does ARR impact enterprise valuation multiples during fundraising or M&A?',
    a: 'Enterprise software valuations are traditionally quoted as a multiple of ARR (e.g., 8x to 25x ARR). The exact multiple awarded depends primarily on three factors: (1) YoY ARR Growth Velocity, (2) Net Revenue Retention (NRR > 120%), and (3) Rule of 40 performance. An elite startup growing at 80% with 130% NRR can command 15x–20x ARR, while a slow-growing competitor may only receive 4x–6x ARR.'
  }
];

export default function ArrSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'arr-calculator-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/arr-calculator#software',
          'name': 'Cerilas Free SaaS Annual Recurring Revenue (ARR) & Rule of 40 Calculator',
          'alternateName': [
            'ARR Calculator',
            'Rule of 40 Calculator for SaaS',
            'ARR Per Employee Benchmarker',
            'SaaS Enterprise Valuation Calculator'
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
          'description': 'Calculate Annual Recurring Revenue (ARR), measure your Rule of 40 score, and benchmark ARR per employee with complete in-browser confidentiality.'
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/arr-calculator#howto',
          'name': 'How to Calculate ARR & the Rule of 40 for Venture Capital Valuation',
          'description': 'A 4-step financial guide for SaaS founders and CFOs.',
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Annualize Monthly Recurring Revenue',
              'text': 'Multiply current contracted monthly recurring revenue (MRR) by 12 to establish your baseline ARR.'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Establish Year-over-Year Growth Rate',
              'text': 'Compare your current ARR to the exact figure 12 months prior to calculate your annual growth percentage.'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Compute Free Cash Flow Margin',
              'text': 'Calculate your trailing 12-month Operating Margin or Free Cash Flow margin as a percentage of revenue.'
            },
            {
              '@type': 'HowToStep',
              'position': 4,
              'name': 'Score the Rule of 40 & Employee Productivity',
              'text': 'Sum growth percentage and margin percentage to evaluate if your startup beats the 40% venture threshold.'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/arr-calculator#faq',
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
      const existing = document.getElementById('arr-calculator-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="finance-seo-root" aria-label="Annual Recurring Revenue and Rule of 40 Complete Industry Guide">
      {/* Header */}
      <div className="finance-seo-header">
        <div className="finance-seo-badge">
          <Sparkles size={14} />
          <span>SaaS Enterprise Valuation Architecture</span>
        </div>
        <h2 className="finance-seo-main-title">
          Annual Recurring Revenue (ARR), The Rule of 40 &amp; SaaS Valuation Multiples
        </h2>
        <p className="finance-seo-main-desc">
          ARR is the universal yardstick of software enterprise value. Learn how to normalize multi-year subscriptions, 
          beat the venture capital Rule of 40, and optimize ARR per employee to command top-decile valuation multiples.
        </p>
      </div>

      {/* AI / VC Executive Capsule */}
      <div className="finance-ai-capsule">
        <div className="finance-capsule-header">
          <Award className="finance-capsule-icon" size={22} />
          <h3 className="finance-capsule-title">Executive Summary: Why ARR Dictates Enterprise Software Multiples</h3>
        </div>
        <div className="finance-capsule-body">
          In public equity markets and private venture rounds, <strong>ARR is the baseline multiplier</strong>. 
          While traditional companies are priced on EBITDA, software enterprises are valued as a direct multiple of ARR (e.g., $10M ARR × 12x = $120M Enterprise Value). 
          The premium awarded to your ARR depends strictly on your <strong>growth velocity, retention cohort quality, and capital efficiency (Rule of 40)</strong>.
        </div>
        <div className="finance-capsule-highlights">
          <div className="finance-capsule-item">
            <TrendingUp size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <strong>Contracted Run-Rate:</strong> ARR normalizes all multi-year agreements and monthly subscriptions into a single 12-month operational run-rate.
            </div>
          </div>
          <div className="finance-capsule-item">
            <Scale size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>The Rule of 40 Tradeoff:</strong> Growth and profitability are complementary. You are allowed to burn 30% if you grow at 70%+ YoY.
            </div>
          </div>
          <div className="finance-capsule-item">
            <Users size={18} style={{ color: '#8b5cf6', flexShrink: 0 }} />
            <div>
              <strong>Headcount Capital Efficiency:</strong> High-performing SaaS organizations achieve $250k–$400k+ in ARR per full-time employee.
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
          <h3 className="finance-pillar-title">1. Contract Normalization</h3>
          <p className="finance-pillar-desc">
            ARR eliminates noise from billing frequencies. Whether a customer pays $1,000 monthly or $12,000 annually upfront, both represent exactly $12,000 in Annual Recurring Revenue.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Award size={22} />
          </div>
          <h3 className="finance-pillar-title">2. The Rule of 40 Benchmark</h3>
          <p className="finance-pillar-desc">
            Venture capitalists use this formula to balance growth against burn. Companies exceeding 40% trade at nearly double the revenue multiple of peers failing the threshold.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Users size={22} />
          </div>
          <h3 className="finance-pillar-title">3. ARR Per Employee</h3>
          <p className="finance-pillar-desc">
            Measures team bloat and operating leverage. Startups scaling headcount faster than ARR experience margin compression, leading to inevitable restructuring.
          </p>
        </div>
      </div>

      {/* Valuation Multiple Benchmark Table */}
      <div>
        <h3 className="finance-section-heading">SaaS ARR Valuation Multiples Matrix</h3>
        <p className="finance-section-subheading">
          Indicative enterprise value multiples across varying growth rates and Rule of 40 performance tiers.
        </p>
        <div className="finance-table-container">
          <table className="finance-benchmark-table">
            <thead>
              <tr>
                <th>Rule of 40 Score</th>
                <th>YoY Growth Profile</th>
                <th>Typical EV / ARR Multiple</th>
                <th>Venture Market Perception</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>&gt; 50% (Elite Scale)</strong></td>
                <td>80% – 120%+ YoY</td>
                <td><span className="finance-tag tier-green">14x – 25x+ ARR</span></td>
                <td>Market leader; aggressive competitive bidding across venture funds.</td>
              </tr>
              <tr>
                <td><strong>40% – 50% (Passed Benchmark)</strong></td>
                <td>45% – 75% YoY</td>
                <td><span className="finance-tag tier-blue">9x – 14x ARR</span></td>
                <td>Top-quartile capital efficiency; clean financing terms.</td>
              </tr>
              <tr>
                <td><strong>20% – 39% (Moderate)</strong></td>
                <td>25% – 45% YoY</td>
                <td><span className="finance-tag tier-orange">5x – 8x ARR</span></td>
                <td>Standard growth; higher scrutiny on customer acquisition payback.</td>
              </tr>
              <tr>
                <td><strong>&lt; 20% (Underperforming)</strong></td>
                <td>&lt; 20% YoY</td>
                <td><span className="finance-tag tier-red">2x – 4x ARR</span></td>
                <td>Private equity buyout territory; requires aggressive restructuring.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-World Case Study */}
      <div className="finance-case-study">
        <div className="finance-case-header">
          <h3 className="finance-case-title">Real-World Case Study: Valuing NexaSecurity at $6M ARR</h3>
          <span className="finance-tag tier-blue">Complete Financial Model Walkthrough</span>
        </div>
        <p className="calc-guide-text">
          Let&apos;s analyze <strong>NexaSecurity</strong>, a Series A cybersecurity SaaS company with 18 full-time employees, 
          generating $500,000 in current Monthly Recurring Revenue (MRR). Over the past 12 months, their revenue grew by 65%, 
          while operating at a -15% Free Cash Flow margin due to engineering hiring.
        </p>
        <div className="finance-case-math-box">
          1. Current ARR Run-Rate = $500,000 × 12 = <span className="highlight">$6,000,000 ARR</span><br />
          2. Rule of 40 Score = 65% (Growth) + (-15% FCF Margin) = <span className="highlight">50% (Benchmark Passed!)</span><br />
          3. ARR Per Employee = $6,000,000 / 18 FTEs = <span className="highlight">$333,333 / employee (Elite Tier)</span><br />
          4. Average Contract Value (ACV) across 120 enterprise clients = $6,000,000 / 120 = <span className="highlight">$50,000 / year</span><br />
          5. Market Valuation Estimate = At a 12x ARR multiple (due to 50% Rule of 40 score), enterprise value = <span className="highlight">$72,000,000</span>
        </div>
        <p className="calc-guide-text">
          Because NexaSecurity maintains an elite ARR per employee ($333k) and passes the Rule of 40 with a 50% score, 
          investors will comfortably fund their expansion without requiring near-term cash flow profitability.
        </p>
      </div>

      {/* 4 Steps Playbook */}
      <div>
        <h3 className="finance-section-heading">4 Pillars to Scale from $1M to $10M ARR</h3>
        <p className="finance-section-subheading">
          The critical operational transitions required to navigate the &quot;T2D3&quot; (Triple, Triple, Double, Double, Double) growth curve.
        </p>
        <div className="finance-steps-grid">
          <div className="finance-step-card">
            <span className="finance-step-number">Step 01</span>
            <h4 className="finance-step-title">Shift to Outbound &amp; Mid-Market</h4>
            <p className="finance-step-text">
              PLG self-serve can reach $1M–$3M ARR, but reaching $10M requires dedicated Account Executives selling higher ACV tiers ($25k–$100k) with annual contracts.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 02</span>
            <h4 className="finance-step-title">Drive Net Negative Churn</h4>
            <p className="finance-step-text">
              At $5M ARR, losing 2% monthly churn erases $1.2M of ARR every year. Building automated account expansion loops ensures existing revenue grows without sales intervention.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 03</span>
            <h4 className="finance-step-title">Benchmark Quota Capacity</h4>
            <p className="finance-step-text">
              Ensure sales rep quotas are set at 4x to 5x their On-Target Earnings (OTE). If an AE earns $150k OTE, their annual closed ARR quota should be $600k–$750k.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 04</span>
            <h4 className="finance-step-title">Protect Headcount Ratio</h4>
            <p className="finance-step-text">
              Maintain an ARR per Employee above $200k. Avoid hiring ahead of proven sales capacity to preserve capital efficiency and beat the Rule of 40.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="finance-faq-section">
        <div>
          <h3 className="finance-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="finance-section-subheading">
            Key insights into recurring contracts, enterprise valuation, and financial benchmarks.
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
