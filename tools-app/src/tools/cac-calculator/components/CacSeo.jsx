import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  Users,
  Target,
  PieChart,
  Check,
  ChevronDown,
  ShieldCheck,
  Activity,
  Layers,
  Search,
  Zap
} from 'lucide-react';
import '../../finance-shared/FinanceSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is Customer Acquisition Cost (CAC) and how is it calculated?',
    a: 'Customer Acquisition Cost (CAC) is the total capital required to persuade a customer to purchase your product or service. In SaaS, a true "Fully-Loaded CAC" includes not only direct digital ad spend, but also sales salaries, executive commissions, marketing tooling, agency retainers, and overhead. Formula: Blended CAC = Total S&M Spend / Total New Customers Acquired.'
  },
  {
    q: 'What is the critical difference between Blended CAC and Paid CAC?',
    a: 'Paid CAC divides direct paid advertising expenditure (Google Ads, Meta, LinkedIn) exclusively by customers converted directly through those paid campaigns. Blended CAC divides all sales and marketing costs (including team salaries and organic tooling) across ALL newly acquired customers (both paid and organic). While performance marketers use Paid CAC to optimize campaigns, venture capitalists evaluate business sustainability using fully-loaded Blended CAC.'
  },
  {
    q: 'What is the CAC Payback Period and what is a healthy timeframe?',
    a: 'The CAC Payback Period measures the number of months required for a customer\'s gross margin contributions to fully repay the cash spent to acquire them. Formula: Payback Period (Months) = CAC / [Monthly ARPU × Gross Margin (%)]. Elite venture-backed SMB startups achieve payback under 12 months. For Mid-Market and Enterprise SaaS, 12 to 18 months is considered healthy due to larger multi-year contract values and lower churn.'
  },
  {
    q: 'Should Customer Success (CS) salaries be categorized under CAC?',
    a: 'No. Customer Success Managers (CSMs) focused on customer onboarding, product adoption, and retention are classified under Cost of Goods Sold (COGS), which reduces Gross Margin. However, Sales Development Reps (SDRs), Account Executives (AEs), and Growth Marketers focused on signing new accounts must always be included 100% in CAC.'
  },
  {
    q: 'How does sales cycle length affect CAC calculation accuracy?',
    a: 'In Mid-Market and Enterprise software, sales cycles often take 3 to 9 months. Dividing December\'s marketing spend by December\'s newly signed customers creates an attribution mismatch because those customers converted from marketing dollars spent in March or June. Accurate CAC calculations require offsetting expenses by your average sales cycle lag.'
  },
  {
    q: 'Why can relying solely on Blended CAC be dangerous for founders?',
    a: 'If a startup generates significant organic word-of-mouth or viral SEO traffic, its Blended CAC will appear artificially low (e.g., $100). If founders use that low blended figure to justify aggressive paid advertising, they may fail to realize that their true Paid CAC on LinkedIn or Google Ads is $800—destroying unit economics when paid spend is scaled.'
  },
  {
    q: 'What are the fastest ways to reduce CAC without sacrificing lead volume?',
    a: 'Key levers to lower CAC include: (1) Developing Product-Led Growth (PLG) self-serve funnels that reduce salesperson intervention; (2) Creating high-intent programmatic SEO content targeting commercial search queries; (3) Implementing customer referral and incentive programs; (4) Improving website conversion rate optimization (CRO) on core pricing and demo booking pages.'
  },
  {
    q: 'What is the ideal LTV to CAC ratio for a venture-backed SaaS company?',
    a: 'The industry golden standard is an LTV:CAC ratio of 3.0x to 5.0x. A ratio below 1.5x destroys capital and leads to insolvency, while a ratio above 5.0x indicates underinvestment in marketing, suggesting the company is growing slower than its competitive potential.'
  }
];

export default function CacSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'cac-calculator-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/cac-calculator#software',
          'name': 'Cerilas Free Customer Acquisition Cost (CAC) & Payback Calculator',
          'alternateName': [
            'CAC Calculator',
            'Blended vs Paid CAC Estimator',
            'Customer Acquisition Cost Analyzer',
            'CAC Payback Period Calculator'
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
          'description': 'Calculate fully-loaded Blended CAC, compare Paid CPA vs organic customer shares, and benchmark your CAC Payback Period with client-side privacy.'
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/cac-calculator#howto',
          'name': 'How to Calculate Fully-Loaded Customer Acquisition Cost (CAC)',
          'description': 'A 4-step framework to accurately quantify your customer acquisition economics.',
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Aggregate Direct Advertising Spend',
              'text': 'Sum all paid media expenditures including Google Ads, LinkedIn Ads, Meta campaigns, and sponsored content.'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Add Sales & Marketing Payroll',
              'text': 'Include gross salaries, sales commissions, and bonuses for SDRs, Account Executives, and growth marketers.'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Include Software Tooling & Agencies',
              'text': 'Tally CRM licenses (Salesforce/HubSpot), marketing automation software, and external marketing agency retainers.'
            },
            {
              '@type': 'HowToStep',
              'position': 4,
              'name': 'Divide by Total New Customers Acquired',
              'text': 'Divide your fully-loaded expenditure by total new accounts closed in that cohort period.'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/cac-calculator#faq',
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
      const existing = document.getElementById('cac-calculator-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="finance-seo-root" aria-label="Customer Acquisition Cost Complete Financial Guide">
      {/* Header */}
      <div className="finance-seo-header">
        <div className="finance-seo-badge">
          <Sparkles size={14} />
          <span>Unit Economics &amp; Go-to-Market Architecture</span>
        </div>
        <h2 className="finance-seo-main-title">
          Customer Acquisition Cost (CAC), Blended vs. Paid &amp; Payback Benchmarks
        </h2>
        <p className="finance-seo-main-desc">
          Customer acquisition cost is the foundational metric of unit economics viability. 
          Discover how to compute a fully-loaded CAC, separate direct paid marketing from organic leverage, 
          and compress your CAC payback period under 12 months.
        </p>
      </div>

      {/* AI / VC Executive Capsule */}
      <div className="finance-ai-capsule">
        <div className="finance-capsule-header">
          <Target className="finance-capsule-icon" size={22} />
          <h3 className="finance-capsule-title">Executive Overview: The Danger of Incompletely Loaded CAC</h3>
        </div>
        <div className="finance-capsule-body">
          The most dangerous mistake in early-stage SaaS is calculating CAC based exclusively on ad spend. 
          When founders ignore sales payroll, SDR tooling, and agency fees, they believe their CAC is $150 when their 
          true economic acquisition cost is $800. This calculation blindspot leads directly to <strong>premature scaling</strong>—spending 
          millions on top-of-funnel marketing for customers whose lifetime gross profit will never repay the company&apos;s expenses.
        </div>
        <div className="finance-capsule-highlights">
          <div className="finance-capsule-item">
            <PieChart size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <strong>Fully-Loaded Integrity:</strong> True CAC includes payroll, commissions, tooling, and agency retainers alongside ad spend.
            </div>
          </div>
          <div className="finance-capsule-item">
            <DollarSign size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>Payback Velocity:</strong> A payback period under 12 months allows customer cash to be recycled into new marketing within the same fiscal year.
            </div>
          </div>
          <div className="finance-capsule-item">
            <Zap size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <div>
              <strong>Attribution Lag:</strong> For Enterprise deals with 6-month sales cycles, shift expenses back 6 months to avoid false cost spikes.
            </div>
          </div>
        </div>
      </div>

      {/* 3 Strategic Pillars */}
      <div className="finance-pillars-grid">
        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <PieChart size={22} />
          </div>
          <h3 className="finance-pillar-title">1. Blended CAC (Fully-Loaded)</h3>
          <p className="finance-pillar-desc">
            Measures company-wide acquisition efficiency by dividing all S&amp;M overhead across all new customers (paid + organic). Demonstrates the macro health of your acquisition engine.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Activity size={22} />
          </div>
          <h3 className="finance-pillar-title">2. Paid CAC (CPA)</h3>
          <p className="finance-pillar-desc">
            Divides direct advertising spend solely by customers acquired through paid channels. Crucial for performance marketers deciding whether to increase budget on a specific ad platform.
          </p>
        </div>

        <div className="finance-pillar-card">
          <div className="finance-pillar-icon-box">
            <Users size={22} />
          </div>
          <h3 className="finance-pillar-title">3. Organic Flywheel Leverage</h3>
          <p className="finance-pillar-desc">
            A high organic customer percentage (from SEO, word-of-mouth, or viral loops) insulates your startup from rising ad auction prices on Google, LinkedIn, and Meta.
          </p>
        </div>
      </div>

      {/* CAC Benchmarks by Market Tier Table */}
      <div>
        <h3 className="finance-section-heading">SaaS CAC &amp; Payback Benchmarks by Customer Segment</h3>
        <p className="finance-section-subheading">
          Typical customer acquisition costs and payback targets across different sales models and contract values.
        </p>
        <div className="finance-table-container">
          <table className="finance-benchmark-table">
            <thead>
              <tr>
                <th>Customer Segment</th>
                <th>Typical ACV (Annual Value)</th>
                <th>Average Blended CAC</th>
                <th>Target Payback Period</th>
                <th>Primary GTM Sales Motion</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Self-Serve / B2C / PLG</strong></td>
                <td>&lt; $600 / year</td>
                <td><span className="finance-tag tier-green">&lt; $150</span></td>
                <td>&lt; 6 Months</td>
                <td>Organic SEO, Viral Loops, Self-Checkout</td>
              </tr>
              <tr>
                <td><strong>SMB SaaS</strong></td>
                <td>$1,200 – $6,000 / year</td>
                <td><span className="finance-tag tier-blue">$300 – $1,200</span></td>
                <td>8 – 12 Months</td>
                <td>Inbound marketing, lightweight inside sales</td>
              </tr>
              <tr>
                <td><strong>Mid-Market SaaS</strong></td>
                <td>$10,000 – $50,000 / year</td>
                <td><span className="finance-tag tier-orange">$3,000 – $12,000</span></td>
                <td>12 – 16 Months</td>
                <td>Dedicated Account Executives, SDR outbound</td>
              </tr>
              <tr>
                <td><strong>Enterprise B2B</strong></td>
                <td>$100,000+ / year</td>
                <td><span className="finance-tag tier-red">$25,000 – $80,000+</span></td>
                <td>14 – 20 Months</td>
                <td>Field sales, RFP responses, executive dinners</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-World Case Study */}
      <div className="finance-case-study">
        <div className="finance-case-header">
          <h3 className="finance-case-title">Real-World Case Study: Calculating True CAC for FlowOps</h3>
          <span className="finance-tag tier-blue">Worked Financial Math</span>
        </div>
        <p className="calc-guide-text">
          Let&apos;s analyze <strong>FlowOps</strong>, a project management SaaS startup. During the month of September, their expenses were:
        </p>
        <div className="finance-case-math-box">
          • Paid Ad Spend (Google + LinkedIn): <span className="highlight">$25,000</span><br />
          • Sales &amp; Marketing Payroll (2 AEs, 1 Growth Marketer): <span className="highlight">$30,000</span><br />
          • Software Stack (HubSpot, ZoomInfo, ChiliPiper): <span className="highlight">$5,000</span><br />
          • Total S&amp;M Spend = $25,000 + $30,000 + $5,000 = <span className="highlight">$60,000</span><br />
          --------------------------------------------------<br />
          • Total New Customers Acquired = 100 accounts (50 from paid ads, 50 from organic search)<br />
          1. Paid CAC = $25,000 / 50 paid accounts = <span className="highlight">$500 / customer</span><br />
          2. Blended CAC (Fully-Loaded) = $60,000 / 100 total accounts = <span className="highlight">$600 / customer</span><br />
          3. Payback Period: Customers pay $100/mo at 80% Gross Margin ($80 gross profit/mo).<br />
             Payback = $600 / $80 = <span className="highlight">7.5 Months (Elite Velocity!)</span>
        </div>
        <p className="calc-guide-text">
          Because FlowOps enjoys a 50% organic customer share and recovers its fully-loaded acquisition cash in just 7.5 months, 
          its unit economics are exceptionally strong, making the company an ideal candidate for Series A funding.
        </p>
      </div>

      {/* 4 Steps Playbook */}
      <div>
        <h3 className="finance-section-heading">4 High-Leverage Tactics to Compress Your CAC</h3>
        <p className="finance-section-subheading">
          Strategic improvements to lower customer acquisition costs without choking lead flow.
        </p>
        <div className="finance-steps-grid">
          <div className="finance-step-card">
            <span className="finance-step-number">Step 01</span>
            <h4 className="finance-step-title">Invest in Programmatic SEO</h4>
            <p className="finance-step-text">
              Build high-volume, programmatic search utility pages and integration directories. Organic search captures qualified, high-intent buyers with zero marginal ad spend.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 02</span>
            <h4 className="finance-step-title">Optimize Landing Page Conversion</h4>
            <p className="finance-step-text">
              Improving website visitor-to-demo conversion rates from 2% to 3% immediately cuts your Paid CAC by 33% without changing ad creative or bidding strategies.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 03</span>
            <h4 className="finance-step-title">Automate Sales Qualification</h4>
            <p className="finance-step-text">
              Use automated qualification tools to filter out low-fit leads before they consume valuable Account Executive demo hours, maximizing AE quota close rates.
            </p>
          </div>

          <div className="finance-step-card">
            <span className="finance-step-number">Step 04</span>
            <h4 className="finance-step-title">Incentivize Customer Referrals</h4>
            <p className="finance-step-text">
              Offer a 1-month bill credit to existing satisfied customers who refer colleagues. Referral conversions close 2x faster with virtually zero acquisition expense.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="finance-faq-section">
        <div>
          <h3 className="finance-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="finance-section-subheading">
            Expert answers regarding customer acquisition economics, marketing spend, and payback metrics.
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
