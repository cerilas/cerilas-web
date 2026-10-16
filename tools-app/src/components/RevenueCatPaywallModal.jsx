import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, 
  X, 
  Sparkles, 
  Crown, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift,
  ExternalLink
} from 'lucide-react';
import { useRevenueCat } from '../context/RevenueCatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { REVENUECAT_CONFIG, cleanupOrphanedPaywallElements, checkProEntitlement } from '../revenuecat/revenueCatService';
import './RevenueCatPaywallModal.css';

export default function RevenueCatPaywallModal({ 
  isOpen, 
  onClose,
  initialProductId = null,
  initialCycle = null
}) {
  const { 
    isPro, 
    currentOffering, 
    purchasePackage, 
    openCustomerCenter,
    customerInfo,
    clearManualOverride,
    refreshCustomerInfo
  } = useRevenueCat();
  const { user, syncPlan } = useAuth();

  const { theme, isDark } = useTheme();

  // State: selected plan ('free' | 'pro' | 'unlimited')
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  
  // State: billing cycle ('monthly' | 'annual') - default is monthly
  const [billingCycle, setBillingCycle] = useState('monthly');

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isRestoredPro, setIsRestoredPro] = useState(false);

  // Check whether user currently has active Pro
  const hasActivePro = isPro || checkProEntitlement(customerInfo) || (user?.plan === 'pro');

  // Available packages from RevenueCat
  const availablePackages = currentOffering?.availablePackages || [];

  // Robust package classification helpers
  const isAnnualPackage = (pkg) => {
    if (!pkg) return false;
    if (pkg.packageType === 'ANNUAL') return true;
    if (pkg.identifier === '$rc_annual') return true;
    const id = String(pkg.product?.identifier || pkg.identifier || '').toLowerCase();
    if (id.includes('annual') || id.includes('yearly') || id.includes('year')) return true;
    const period = String(pkg.product?.subscriptionPeriod || pkg.product?.normalDuration || '').toLowerCase();
    if (period.includes('y') || period.includes('year') || period.includes('p1y')) return true;
    const amount = Number(pkg.product?.price?.amount || 0);
    if (amount >= 50) return true;
    return false;
  };

  const isMonthlyPackage = (pkg) => {
    if (!pkg) return false;
    if (pkg.packageType === 'MONTHLY') return true;
    if (pkg.identifier === '$rc_monthly') return true;
    const id = String(pkg.product?.identifier || pkg.identifier || '').toLowerCase();
    if (id.includes('month')) return true;
    const period = String(pkg.product?.subscriptionPeriod || pkg.product?.normalDuration || '').toLowerCase();
    if (period.includes('m') || period.includes('month') || period.includes('p1m')) return true;
    const amount = Number(pkg.product?.price?.amount || 0);
    if (amount > 0 && amount < 40) return true;
    return false;
  };

  // Match packages dynamically from the RevenueCat offering
  const getPackageForSelection = (planId, cycle) => {
    if (!availablePackages || availablePackages.length === 0) return null;

    if (planId === 'pro') {
      if (cycle === 'annual') {
        return availablePackages.find(pkg => {
          if (!isAnnualPackage(pkg)) return false;
          const id = String(pkg.product?.identifier || pkg.identifier || '').toLowerCase();
          return !id.includes('unlimited');
        }) || null;
      } else {
        return availablePackages.find(pkg => {
          if (!isMonthlyPackage(pkg)) return false;
          const id = String(pkg.product?.identifier || pkg.identifier || '').toLowerCase();
          return !id.includes('unlimited');
        }) || availablePackages.find(pkg => pkg.packageType === 'MONTHLY') || availablePackages[0];
      }
    }

    if (planId === 'unlimited') {
      const targetId = REVENUECAT_CONFIG.PRODUCTS?.UNLIMITED_MONTHLY?.id || 'pri_01m41vmta5xebbmwt1k46xbfsf';
      return availablePackages.find(pkg => {
        const id = String(pkg.product?.identifier || pkg.identifier || '').toLowerCase();
        return id.includes('unlimited') || id === targetId;
      }) || null;
    }

    return null;
  };

  // Switch master cycle
  const handleMasterCycleChange = (newCycle) => {
    setBillingCycle(newCycle);
  };

  // Dynamic packages
  const proMonthlyPkg = getPackageForSelection('pro', 'monthly');
  const proAnnualPkg = getPackageForSelection('pro', 'annual');
  const unlimitedMonthlyPkg = getPackageForSelection('unlimited', 'monthly');
  const unlimitedAnnualPkg = getPackageForSelection('unlimited', 'annual');

  // Canonical price resolver
  const getPlanPrice = (planId, cycle) => {
    if (planId === 'free') return '$0';

    if (planId === 'pro') {
      if (cycle === 'annual') {
        if (proAnnualPkg && isAnnualPackage(proAnnualPkg) && proAnnualPkg.product?.price?.formattedPrice) {
          return proAnnualPkg.product.price.formattedPrice;
        }
        return '$99.90';
      } else {
        if (proMonthlyPkg && isMonthlyPackage(proMonthlyPkg) && proMonthlyPkg.product?.price?.formattedPrice) {
          return proMonthlyPkg.product.price.formattedPrice;
        }
        return '$9.99';
      }
    }

    if (planId === 'unlimited') {
      if (cycle === 'annual') {
        if (unlimitedAnnualPkg && isAnnualPackage(unlimitedAnnualPkg) && unlimitedAnnualPkg.product?.price?.formattedPrice) {
          return unlimitedAnnualPkg.product.price.formattedPrice;
        }
        return '$149.90';
      } else {
        if (unlimitedMonthlyPkg && isMonthlyPackage(unlimitedMonthlyPkg) && unlimitedMonthlyPkg.product?.price?.formattedPrice) {
          return unlimitedMonthlyPkg.product.price.formattedPrice;
        }
        return '$14.99';
      }
    }

    return '$0';
  };

  // Plan Definitions in exact order: Free -> Pro -> Unlimited (Detailed & Minimalist)
  const plans = [
    {
      id: 'free',
      name: 'Free',
      badge: null,
      price: '$0',
      period: '/ forever',
      ctaPriceDetail: '$0',
      subDetail: 'No credit card needed',
      features: [
        '1 Workspace (Website / Brand)',
        '3 GEO / AEO Search Prompts',
        'Basic token allowance & free tools',
        '1 Daily AI Action & Competitor Discovery',
        'Standard execution speed'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'Popular',
      badgeType: 'featured',
      price: billingCycle === 'annual' ? '$99.90' : '$9.99',
      period: billingCycle === 'annual' ? '/ yr' : '/ mo',
      ctaPriceDetail: billingCycle === 'annual' ? '$99.90 / yr ($8.33/mo)' : '$9.99 / mo',
      savingsPill: billingCycle === 'annual' ? '2 Months Free' : null,
      subDetail: billingCycle === 'annual'
        ? 'Billed annually ($8.33/mo)'
        : 'Billed monthly',
      matchedPkg: billingCycle === 'annual' ? (proAnnualPkg || proMonthlyPkg || availablePackages[0]) : (proMonthlyPkg || availablePackages[0]),
      features: [
        '3 Workspaces (Websites / Brands)',
        '15 Trackable GEO / AEO Prompts',
        '3 Competitor Tracking Radar',
        'Unlimited Technical Site Audit & Issues',
        'Daily Executive Email Digest Reports',
        '3 Daily AI Priority Actions & Discovery',
        '5x Token Allowance & Commercial Rights'
      ]
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      badge: 'Turbo',
      badgeType: 'turbo',
      price: billingCycle === 'annual' ? '$149.90' : '$14.99',
      period: billingCycle === 'annual' ? '/ yr' : '/ mo',
      ctaPriceDetail: billingCycle === 'annual' ? '$149.90 / yr ($12.49/mo)' : '$14.99 / mo',
      savingsPill: billingCycle === 'annual' ? '2 Months Free' : null,
      subDetail: billingCycle === 'annual'
        ? 'Billed annually ($12.49/mo)'
        : 'Billed monthly',
      matchedPkg: unlimitedMonthlyPkg || unlimitedAnnualPkg || availablePackages.find(p => {
        const id = String(p.product?.identifier || p.identifier || '').toLowerCase();
        return id.includes('unlimited') || id === 'pri_01m41vmta5xebbmwt1k46xbfsf';
      }),
      features: [
        'Unlimited Workspaces (All brands)',
        '30 Trackable GEO / AEO Prompts',
        'Unlimited Competitor Tracking Radar',
        'Full Technical Site Audit & Reports',
        'Unlimited AI Actions & Discovery Runs',
        'Maximum Token Allowance & Turbo Speed',
        '24/7 Dedicated VIP Priority Support'
      ]
    }
  ];

  // Clean up any stale RevenueCat DOM overlays whenever modal state changes
  useEffect(() => {
    cleanupOrphanedPaywallElements();
    if (isOpen) {
      setErrorMessage('');
      setPurchaseSuccess(false);
      setIsPurchasing(false);
    }
  }, [isOpen]);

  // Sync initial product selection if provided
  useEffect(() => {
    if (initialProductId) {
      const lower = String(initialProductId).toLowerCase();
      if (lower.includes('unlimited') || lower.includes('enterprise')) {
        setSelectedPlanId('unlimited');
      } else if (lower.includes('free')) {
        setSelectedPlanId('free');
      } else {
        setSelectedPlanId('pro');
      }

      if (lower.includes('month')) {
        handleMasterCycleChange('monthly');
      } else if (lower.includes('year') || lower.includes('annual')) {
        handleMasterCycleChange('annual');
      }
    }
  }, [initialProductId]);

  // Sync initial billing cycle if provided (default to monthly)
  useEffect(() => {
    if (initialCycle) {
      handleMasterCycleChange(initialCycle);
    } else {
      handleMasterCycleChange('monthly');
    }
  }, [initialCycle, isOpen]);

  // Cancel / abort active purchasing
  const handleCancelCheckout = () => {
    setIsPurchasing(false);
    cleanupOrphanedPaywallElements();
    try {
      const testOverlays = document.querySelectorAll('.rc-simulated-store-modal-overlay');
      testOverlays.forEach(o => {
        o.parentElement?.remove?.();
        o.remove?.();
      });
    } catch (_) {}
  };

  // Watch for any RevenueCat test store or billing container and ensure it's on top
  useEffect(() => {
    if (!isPurchasing) return;

    const elevateRevenueCatElements = () => {
      const selectors = [
        '.rc-simulated-store-modal-overlay',
        '.rc-simulated-store-modal',
        '.rcb-ui-root',
        '.rcb-ui-container',
        '.rcb-ui-container.fullscreen'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.setProperty('z-index', '2147483647', 'important');
          el.style.setProperty('pointer-events', 'auto', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
          if (el.parentElement && el.parentElement !== document.body) {
            el.parentElement.style.setProperty('z-index', '2147483647', 'important');
          }
        });
      });
    };

    elevateRevenueCatElements();
    const interval = setInterval(elevateRevenueCatElements, 100);
    return () => clearInterval(interval);
  }, [isPurchasing]);

  // Handle ESC key to dismiss or cancel checkout
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isPurchasing) {
          handleCancelCheckout();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPurchasing, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

  // Handle checkout via RevenueCat Web Billing
  const handleStartCheckout = async (targetPlan = null) => {
    cleanupOrphanedPaywallElements();
    setErrorMessage('');

    const planToProcess = targetPlan || selectedPlan;

    // If Free plan clicked, simply close modal
    if (planToProcess.id === 'free') {
      onClose();
      return;
    }

    // Check if user already has active Pro in RevenueCat / DB and is trying to re-purchase Pro
    const hasActivePro = isPro || checkProEntitlement(customerInfo) || (user?.plan === 'pro');
    if (planToProcess.id === 'pro' && hasActivePro) {
      setIsPurchasing(true);
      try {
        if (syncPlan) await syncPlan('pro', true);
        if (clearManualOverride) clearManualOverride();
        if (refreshCustomerInfo) await refreshCustomerInfo();
        setIsRestoredPro(true);
        setPurchaseSuccess(true);
      } catch (e) {
        console.warn('Auto restore failed:', e);
      } finally {
        setIsPurchasing(false);
      }
      return;
    }

    const pkgToPurchase = planToProcess.matchedPkg;

    if (!pkgToPurchase) {
      if (planToProcess.id === 'unlimited') {
        openCustomerCenter('overview');
        setErrorMessage('Paddle Customer Portal opened to complete your Unlimited upgrade.');
        return;
      }
      setErrorMessage('Subscription package not available. Please refresh and try again.');
      return;
    }

    setIsPurchasing(true);

    try {
      const res = await purchasePackage(pkgToPurchase);
      if (res && res.success) {
        if (planToProcess.id === 'unlimited') {
          try {
            if (syncPlan) await syncPlan('unlimited', true);
            if (clearManualOverride) clearManualOverride();
            if (refreshCustomerInfo) await refreshCustomerInfo();
          } catch (_) {}
        }
        if (res.isAlreadyPurchased) {
          setIsRestoredPro(true);
        }
        setPurchaseSuccess(true);
      }
    } catch (err) {
      if (!err?.isCancelled) {
        console.error('[RevenueCat Paywall] Checkout error:', err);
        const rawMsg = err?.message || '';

        // Check if error is product already purchased / active subscription
        if (
          err?.isAlreadyPurchased ||
          err?.errorCode === 6 ||
          rawMsg.toLowerCase().includes('already purchased') ||
          rawMsg.toLowerCase().includes('already has an active subscription') ||
          rawMsg.toLowerCase().includes('already bought') ||
          rawMsg.toLowerCase().includes('zaten')
        ) {
          if (planToProcess.id === 'unlimited') {
            openCustomerCenter('overview');
            setErrorMessage('Paddle requires upgrading active subscriptions directly via the Customer Portal to avoid double billing. The portal has been opened in a new tab.');
            return;
          }
          try {
            if (syncPlan) await syncPlan('pro', true);
            if (clearManualOverride) clearManualOverride();
            if (refreshCustomerInfo) await refreshCustomerInfo();
            setIsRestoredPro(true);
            setPurchaseSuccess(true);
            return;
          } catch (_) {}
        }

        let userMsg = '';
        if (
          rawMsg.includes('8101') || 
          rawMsg.includes('not fully configured') || 
          rawMsg.includes('not_enabled') || 
          rawMsg.includes('onboarding')
        ) {
          userMsg = 'Checkouts are not yet enabled for this Paddle account (Onboarding in review). Please complete verification in your Paddle dashboard.';
        } else {
          userMsg = rawMsg || 'Payment could not be completed. Please try again.';
        }
        setErrorMessage(userMsg);
      }
    } finally {
      setIsPurchasing(false);
      cleanupOrphanedPaywallElements();
    }
  };

  return createPortal(
    <div 
      className={`rc-paywall-backdrop ${isPurchasing ? 'is-purchasing-active' : ''} ${isDark ? 'is-dark-theme' : 'is-light-theme'}`}
      data-theme={theme || (isDark ? 'dark' : 'light')}
      onClick={() => isPurchasing ? handleCancelCheckout() : onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rc-paywall-main-title"
    >
      <div 
        className={`rc-paywall-card ${purchaseSuccess ? 'is-success-card' : ''}`}
        data-theme={theme || (isDark ? 'dark' : 'light')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow Effect */}
        <div className="rc-paywall-ambient-glow" aria-hidden="true" />

        {/* Header - Only show plan title and billing cycle toggle when NOT in success state */}
        <div className={`rc-paywall-header ${purchaseSuccess ? 'is-success-header' : ''}`}>
          <button 
            type="button" 
            className="rc-paywall-close-btn"
            onClick={isPurchasing ? handleCancelCheckout : onClose}
            aria-label="Close"
            title={isPurchasing ? 'Cancel' : 'Close'}
          >
            <X size={17} />
          </button>

          {!purchaseSuccess && (
            <>
              <h2 id="rc-paywall-main-title" className="rc-paywall-title">
                Choose Plan
              </h2>

              {/* Master Billing Switcher */}
              <div className="rc-billing-switch-wrapper" role="group" aria-label="Billing frequency">
                <button
                  type="button"
                  className={`rc-toggle-tab ${billingCycle === 'monthly' ? 'is-active' : ''}`}
                  onClick={() => handleMasterCycleChange('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`rc-toggle-tab ${billingCycle === 'annual' ? 'is-active' : ''}`}
                  onClick={() => handleMasterCycleChange('annual')}
                >
                  <span>Annual</span>
                  <span className="rc-discount-pill">
                    2 Months Free
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Body - Scrollable content area if screen is compact */}
        <div className="rc-paywall-body">
          {/* Active Pro Banner */}
          {isPro && !purchaseSuccess && (
            <div className="rc-active-pro-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span className="rc-active-pro-banner-text">
                  You already have a subscription.
                </span>
              </div>
              <button 
                type="button" 
                onClick={openCustomerCenter}
                className="rc-manage-sub-link-btn"
              >
                Manage
              </button>
            </div>
          )}

          {/* Success Banner */}
          {purchaseSuccess ? (
            <div className="rc-success-view">
              <div className="rc-success-icon-badge">
                <Check size={36} />
              </div>

              <div className="rc-success-plan-pill">
                <Sparkles size={13} />
                <span>
                  {isRestoredPro 
                    ? 'Pro Subscription Verified'
                    : selectedPlan.name === 'Unlimited' 
                    ? 'Unlimited Plan Activated' 
                    : 'Pro Plan Activated'}
                </span>
              </div>

              <h3 className="rc-success-title">
                {isRestoredPro 
                  ? 'Pro Subscription Restored!' 
                  : selectedPlan.name === 'Unlimited'
                  ? 'Welcome to Cerilas Unlimited!'
                  : 'Welcome to Cerilas Pro!'}
              </h3>
              <p className="rc-success-desc">
                {isRestoredPro 
                  ? 'Your active Pro subscription was verified with Paddle & RevenueCat. All Pro benefits have been restored with zero extra charges.'
                  : 'Your payment was successful. All tools, advanced features, and priority speed are now unlocked.'}
              </p>

              <div className="rc-success-perks">
                <div className="rc-success-perk-item">
                  <CheckCircle2 size={16} className="rc-success-perk-icon" />
                  <span>Full Unlimited Access to All Tools</span>
                </div>
                <div className="rc-success-perk-item">
                  <CheckCircle2 size={16} className="rc-success-perk-icon" />
                  <span>High Priority Execution Speed</span>
                </div>
                <div className="rc-success-perk-item">
                  <CheckCircle2 size={16} className="rc-success-perk-icon" />
                  <span>Instant Account Provisioning</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="rc-subscribe-btn rc-success-action-btn"
                  style={{ flex: 1, minWidth: '160px' }}
                  onClick={onClose}
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </button>
                <button 
                  type="button" 
                  className="account-btn btn-secondary-sub"
                  style={{ 
                    padding: '0.8rem 1.25rem', 
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-main, #ffffff)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer'
                  }}
                  onClick={() => openCustomerCenter('overview')}
                >
                  Manage on Paddle
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Selection Grid: Ordered Free -> Pro -> Unlimited */}
              <div className="rc-plans-grid">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isCardFeatured = plan.id === 'pro';
                  const isCardTurbo = plan.id === 'unlimited';

                  return (
                    <div 
                      key={plan.id}
                      className={`rc-plan-card ${isSelected ? 'is-selected' : ''} ${isCardFeatured ? 'is-featured' : ''} ${isCardTurbo ? 'is-turbo' : ''}`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      {/* Card Top Pill Badge */}
                      {plan.badge && (
                        <div className={`rc-plan-top-badge badge-${plan.badgeType || 'default'}`}>
                          <span>{plan.badge}</span>
                        </div>
                      )}

                      {/* Header Info */}
                      <div className="rc-plan-card-head">
                        <h3 className="rc-plan-name">{plan.name}</h3>
                        <div className={`rc-plan-radio ${isSelected ? 'is-checked' : ''}`}>
                          {isSelected && <div className="rc-plan-radio-dot" />}
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="rc-plan-pricing-section">
                        <div className="rc-plan-price-row">
                          <span className="rc-plan-price-num">{plan.price}</span>
                          <span className="rc-plan-price-period">{plan.period}</span>
                        </div>

                        <div className="rc-plan-subdetail-row">
                          <span className="rc-plan-subdetail">{plan.subDetail}</span>
                          {plan.savingsPill && (
                            <span className="rc-plan-savings-pill">{plan.savingsPill}</span>
                          )}
                        </div>
                      </div>

                      {/* Feature Bullet Points */}
                      <ul className="rc-plan-features-list">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="rc-plan-feature-item">
                            <Check size={13} className="rc-plan-feature-icon" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="rc-error-alert">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pinned Bottom Actions Bar */}
        {!purchaseSuccess && (
          <div className="rc-paywall-footer">
            <button
              type="button"
              className="rc-subscribe-btn"
              onClick={() => handleStartCheckout()}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Processing...</span>
                </>
              ) : selectedPlan.id === 'free' ? (
                <>
                  <span>Continue with Free Plan</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>
                    {`Continue with ${selectedPlan.name} — ${selectedPlan.ctaPriceDetail}`}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {hasActivePro && selectedPlan.id === 'unlimited' && (
              <button
                type="button"
                onClick={() => openCustomerCenter('overview')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  marginTop: '0.25rem'
                }}
              >
                <ExternalLink size={13} />
                <span>Or upgrade in Paddle Portal (Prorated)</span>
              </button>
            )}

            {isPurchasing && (
              <button 
                type="button" 
                onClick={handleCancelCheckout}
                className="rc-cancel-checkout-link"
              >
                Cancel
              </button>
            )}

            <div className="rc-security-note">
              <span>🔒 256-bit SSL secured • Cancel anytime</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
