import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Clock, 
  CreditCard,
  X,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useRevenueCat } from '../context/RevenueCatContext';
import './pricing.css';

export default function PricingView({ onBack }) {
  const { language } = useTranslation();
  const { isPro, presentPaywall, openCustomerCenter } = useRevenueCat();
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="pricing-page-container">
      {/* Navigation & Breadcrumbs */}
      <div className="pricing-nav-bar">
        <div className="pricing-breadcrumbs">
          <button 
            type="button" 
            className="pricing-back-btn" 
            onClick={onBack || (() => { window.location.hash = '#/'; })}
            aria-label="Back to tools"
          >
            <ArrowLeft size={14} />
            <span>{language === 'tr' ? 'Araçlara Dön' : 'Back to Tools'}</span>
          </button>
          <span>/</span>
          <span className="pricing-crumb-current">Pricing &amp; Plans</span>
        </div>
      </div>

      {/* Header Section */}
      <header className="pricing-header-section">
        <div className="pricing-pill-badge">
          <ShieldCheck size={13} />
          <span>Transparent &bull; Zero Server Storage</span>
        </div>
        <h1 className="pricing-main-title">
          Simple, Predictable Plans for Everyone
        </h1>
        <p className="pricing-lead-text">
          Access our suite of 31+ privacy-first developer, PDF, AI, research, and financial tools with zero server file uploads. Choose the plan tailored to your workflow.
        </p>

        {/* Billing Cycle Switcher */}
        <div className="pricing-billing-switch-wrapper" role="group" aria-label="Billing frequency">
          <button
            type="button"
            className={`pricing-toggle-tab ${billingCycle === 'monthly' ? 'is-active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`pricing-toggle-tab ${billingCycle === 'annual' ? 'is-active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            <span>Annual Billing</span>
            <span className="pricing-discount-pill">2 Months Free</span>
          </button>
        </div>
      </header>

      {/* 3 Pricing Plans Grid */}
      <div className="pricing-cards-grid">
        {/* Plan 1: Forever Free */}
        <div className="pricing-card">
          <div className="pricing-card-header">
            <div className="pricing-plan-name-row">
              <h2 className="pricing-plan-name">Forever Free</h2>
            </div>
            <p className="pricing-plan-desc">
              Free tools free forever, Premium tools uses token, limited free allowance.
            </p>

            <div className="pricing-price-box">
              <div className="pricing-price-row">
                <span className="pricing-currency">$</span>
                <span className="pricing-amount">0</span>
                <span className="pricing-period">/ month</span>
              </div>
              <div className="pricing-billing-detail">
                Free forever &bull; No card required
              </div>
            </div>
          </div>

          <ul className="pricing-features-list">
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Free tools free forever:</strong> Unlimited access to all free tools</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Premium tools uses token:</strong> Limited free allowance included</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>100% In-Browser Privacy:</strong> Local WebAssembly &amp; WebGPU processing</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Zero Server Uploads:</strong> Files never leave your local device</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span>Standard client-side processing speeds</span>
            </li>
          </ul>

          <div className="pricing-card-footer">
            <button 
              type="button" 
              className="pricing-cta-btn is-default"
              onClick={onBack || (() => { window.location.hash = '#/'; })}
            >
              Current Plan
            </button>
          </div>
        </div>

        {/* Plan 2: Pro */}
        <div className="pricing-card is-featured">
          <div className="pricing-card-top-tag">Popular Choice</div>

          <div className="pricing-card-header">
            <div className="pricing-plan-name-row">
              <h2 className="pricing-plan-name">Pro</h2>
            </div>
            <p className="pricing-plan-desc">
              Free tools free forever, with higher token allowance for premium tools.
            </p>

            <div className="pricing-price-box">
              <div className="pricing-price-row">
                <span className="pricing-currency">$</span>
                <span className="pricing-amount">
                  {billingCycle === 'annual' ? '99.90' : '9.99'}
                </span>
                <span className="pricing-period">
                  {billingCycle === 'annual' ? '/ year' : '/ month'}
                </span>
              </div>
              <div className="pricing-billing-detail">
                {billingCycle === 'annual' 
                  ? 'Equivalent to $8.33/mo (2 Months Free)' 
                  : 'Billed monthly at $9.99/mo'}
              </div>
            </div>
          </div>

          <ul className="pricing-features-list">
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Free tools free forever:</strong> Unlimited access to all free tools</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Premium tools:</strong> Expanded token allowance for heavy usage</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Priority concurrency:</strong> Faster multi-threaded WebAssembly execution</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Ad-free workspace</strong> with distraction-free layout</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span>Priority email support &amp; commercial usage rights</span>
            </li>
          </ul>

          <div className="pricing-card-footer">
            {isPro ? (
              <button 
                type="button" 
                className="pricing-cta-btn"
                style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#10b981' }}
                onClick={openCustomerCenter}
              >
                <Check size={16} />
                <span>{language === 'tr' ? 'Mevcut Plan (Yönet)' : 'Active Plan (Manage)'}</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="pricing-cta-btn"
                onClick={() => presentPaywall({ defaultPackageId: 'pro', cycle: billingCycle })}
              >
                <span>{language === 'tr' ? 'Pro\'ya Abone Ol' : 'Subscribe to Pro'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Plan 3: Unlimited */}
        <div className="pricing-card">
          <div className="pricing-card-header">
            <div className="pricing-plan-name-row">
              <h2 className="pricing-plan-name">Unlimited</h2>
            </div>
            <p className="pricing-plan-desc">
              Free tools free forever, with maximum token allowance for premium tools.
            </p>

            <div className="pricing-price-box">
              <div className="pricing-price-row">
                <span className="pricing-currency">$</span>
                <span className="pricing-amount">
                  {billingCycle === 'annual' ? '149.90' : '14.99'}
                </span>
                <span className="pricing-period">
                  {billingCycle === 'annual' ? '/ year' : '/ month'}
                </span>
              </div>
              <div className="pricing-billing-detail">
                {billingCycle === 'annual' 
                  ? 'Equivalent to $12.49/mo (2 Months Free)' 
                  : 'Billed monthly at $14.99/mo'}
              </div>
            </div>
          </div>

          <ul className="pricing-features-list">
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Free tools free forever:</strong> Unlimited access to all free tools</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Premium tools:</strong> Maximum token allowance &amp; highest limits</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Live Grants Directory:</strong> Full tracking &amp; export of 660+ Horizon Europe &amp; Cascade calls</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span><strong>Maximum Turbo Speed:</strong> Highest priority client-side execution</span>
            </li>
            <li className="pricing-feature-item">
              <Check size={16} className="pricing-check-icon" />
              <span>24/7 dedicated support &amp; early access to beta releases</span>
            </li>
          </ul>

          <div className="pricing-card-footer">
            <button 
              type="button" 
              className="pricing-cta-btn"
              onClick={() => presentPaywall({ defaultPackageId: 'unlimited', cycle: billingCycle })}
            >
              <span>{language === 'tr' ? 'Unlimited Başlat' : 'Get Unlimited'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <section className="pricing-table-section">
        <div className="pricing-section-header">
          <h3 className="pricing-section-title">Feature Comparison</h3>
          <p className="pricing-section-sub">Comprehensive overview of plan limits and processing capabilities</p>
        </div>

        <div className="pricing-table-card">
          <table className="pricing-table">
            <thead>
              <tr>
                <th className="col-feature">Feature / Toolset</th>
                <th className="col-plan">Forever Free</th>
                <th className="col-plan is-highlight">Pro ($9.99/mo)</th>
                <th className="col-plan">Unlimited ($14.99/mo)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="col-feature">Free Tools</td>
                <td className="col-plan">Free Forever</td>
                <td className="col-plan is-highlight">Free Forever</td>
                <td className="col-plan">Free Forever</td>
              </tr>
              <tr>
                <td className="col-feature">Premium Tools (Token-based)</td>
                <td className="col-plan">Limited Free Allowance</td>
                <td className="col-plan is-highlight">Expanded Token Allowance</td>
                <td className="col-plan">Maximum Token Allowance</td>
              </tr>
              <tr>
                <td className="col-feature">EU Horizon Europe &amp; Cascade Funding Grants</td>
                <td className="col-plan">Standard Directory</td>
                <td className="col-plan is-highlight">Standard Directory</td>
                <td className="col-plan">Full Directory &amp; Custom Exports</td>
              </tr>
              <tr>
                <td className="col-feature">In-Browser Local Privacy (Zero server file storage)</td>
                <td className="col-plan">Yes (100% Client-side)</td>
                <td className="col-plan is-highlight">Yes (100% Client-side)</td>
                <td className="col-plan">Yes (100% Client-side)</td>
              </tr>
              <tr>
                <td className="col-feature">Processing Priority</td>
                <td className="col-plan">Standard</td>
                <td className="col-plan is-highlight">High Priority</td>
                <td className="col-plan">Maximum Turbo</td>
              </tr>
              <tr>
                <td className="col-feature">Annual Billing Discount</td>
                <td className="col-plan">None ($0)</td>
                <td className="col-plan is-highlight">2 Months Free ($99.90/yr)</td>
                <td className="col-plan">2 Months Free ($149.90/yr)</td>
              </tr>
              <tr>
                <td className="col-feature">Commercial Usage License</td>
                <td className="col-plan">Personal</td>
                <td className="col-plan is-highlight">Included</td>
                <td className="col-plan">Included</td>
              </tr>
              <tr>
                <td className="col-feature">Customer Support</td>
                <td className="col-plan">Community</td>
                <td className="col-plan is-highlight">Priority Email</td>
                <td className="col-plan">24/7 Dedicated Support</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="pricing-faq-section">
        <div className="pricing-section-header">
          <h3 className="pricing-section-title">Frequently Asked Questions</h3>
          <p className="pricing-section-sub">Everything you need to know about our billing and infrastructure</p>
        </div>

        <div className="pricing-faq-grid">
          <div className="pricing-faq-card">
            <h4 className="pricing-faq-q">How does the 2 months free annual discount work?</h4>
            <p className="pricing-faq-a">
              When you choose annual billing, you pay for only 10 months upfront and receive 12 full months of service. For the Pro plan, you pay $99.90 instead of $119.88 (saving $19.98). For the Unlimited plan, you pay $149.90 instead of $179.88 (saving $29.98).
            </p>
          </div>

          <div className="pricing-faq-card">
            <h4 className="pricing-faq-q">How does checkout &amp; subscription billing work?</h4>
            <p className="pricing-faq-a">
              Self-serve checkout is live and securely processed via RevenueCat &amp; Stripe with 256-bit SSL encryption. All major cards and digital wallets are supported. Upgrades and unlocks take effect immediately across your account.
            </p>
          </div>

          <div className="pricing-faq-card">
            <h4 className="pricing-faq-q">Are my files or sensitive data uploaded to your servers?</h4>
            <p className="pricing-faq-a">
              No. Cerilas Tools is built on a zero-server edge architecture. Calculations, PDF edits, image conversions, and document parsing execute entirely inside your local browser via WebAssembly (WASM). Your data never touches remote servers.
            </p>
          </div>

          <div className="pricing-faq-card">
            <h4 className="pricing-faq-q">Can I switch plans or cancel at any time?</h4>
            <p className="pricing-faq-a">
              Yes. You can upgrade, downgrade, or cancel your subscription at any time with one click from your account dashboard with zero cancellation fees or hidden terms.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
