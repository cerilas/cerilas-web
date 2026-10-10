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
  Gift
} from 'lucide-react';
import { useRevenueCat } from '../context/RevenueCatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { REVENUECAT_CONFIG, cleanupOrphanedPaywallElements, checkProEntitlement } from '../revenuecat/revenueCatService';
import { useTranslation } from '../i18n';
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
  const { language } = useTranslation();
  const isTr = language === 'tr';

  // State: selected plan ('free' | 'pro' | 'unlimited')
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  
  // State: billing cycle ('monthly' | 'annual') - default is monthly
  const [billingCycle, setBillingCycle] = useState('monthly');

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isRestoredPro, setIsRestoredPro] = useState(false);

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
      if (cycle === 'annual') {
        return availablePackages.find(pkg => {
          if (!isAnnualPackage(pkg)) return false;
          const id = String(pkg.product?.identifier || pkg.identifier || '').toLowerCase();
          return id.includes('unlimited');
        }) || null;
      } else {
        return availablePackages.find(pkg => {
          const id = String(pkg.product?.identifier || pkg.identifier || '').toLowerCase();
          return id.includes('unlimited') && isMonthlyPackage(pkg);
        }) || null;
      }
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
      period: isTr ? '/ ömür boyu' : '/ forever',
      ctaPriceDetail: '$0',
      subDetail: isTr ? 'Kredi kartı gerekmez' : 'No credit card needed',
      features: [
        isTr ? '1 Workspace (Web sitesi / Marka)' : '1 Workspace (Website / Brand)',
        isTr ? '3 GEO / AEO Arama İstemi (Prompt)' : '3 GEO / AEO Search Prompts',
        isTr ? 'Temel token kotası & ücretsiz araçlar' : 'Basic token allowance & free tools',
        isTr ? 'Günlük 1 AI Aksiyon & Rakip Keşfi' : '1 Daily AI Action & Competitor Discovery',
        isTr ? 'Standart işlem ve yanıt hızı' : 'Standard execution speed'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: isTr ? 'Popüler' : 'Popular',
      badgeType: 'featured',
      price: billingCycle === 'annual' ? '$99.90' : '$9.99',
      period: billingCycle === 'annual' ? (isTr ? '/ yıl' : '/ yr') : (isTr ? '/ ay' : '/ mo'),
      ctaPriceDetail: billingCycle === 'annual' ? (isTr ? '$99.90 / yıl ($8.33/ay)' : '$99.90 / yr ($8.33/mo)') : (isTr ? '$9.99 / ay' : '$9.99 / mo'),
      savingsPill: billingCycle === 'annual' ? (isTr ? '2 Ay Bedava' : '2 Months Free') : null,
      subDetail: billingCycle === 'annual'
        ? (isTr ? 'Yıllık çekim ($8.33/ay)' : 'Billed annually ($8.33/mo)')
        : (isTr ? 'Aylık çekim' : 'Billed monthly'),
      matchedPkg: billingCycle === 'annual' ? (proAnnualPkg || proMonthlyPkg || availablePackages[0]) : (proMonthlyPkg || availablePackages[0]),
      features: [
        isTr ? '3 Workspace (Web sitesi / Marka)' : '3 Workspaces (Websites / Brands)',
        isTr ? '5 Takip Edilebilir GEO / AEO İstemi' : '5 Trackable GEO / AEO Prompts',
        isTr ? '3 Rakip Takip Radarı' : '3 Competitor Tracking Radar',
        isTr ? 'Sınırsız Teknik Site Denetimi (Audit)' : 'Unlimited Technical Site Audit & Issues',
        isTr ? 'Günlük Yönetici E-Posta Özeti (Digest)' : 'Daily Executive Email Digest Reports',
        isTr ? 'Günlük 3 AI Aksiyon & Rakip Keşfi' : '3 Daily AI Priority Actions & Discovery',
        isTr ? '5x Token Kotası & Ticari Lisans' : '5x Token Allowance & Commercial Rights'
      ]
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      badge: isTr ? 'Turbo' : 'Turbo',
      badgeType: 'turbo',
      price: billingCycle === 'annual' ? '$149.90' : '$14.99',
      period: billingCycle === 'annual' ? (isTr ? '/ yıl' : '/ yr') : (isTr ? '/ ay' : '/ mo'),
      ctaPriceDetail: billingCycle === 'annual' ? (isTr ? '$149.90 / yıl ($12.49/ay)' : '$149.90 / yr ($12.49/mo)') : (isTr ? '$14.99 / ay' : '$14.99 / mo'),
      savingsPill: billingCycle === 'annual' ? (isTr ? '2 Ay Bedava' : '2 Months Free') : null,
      subDetail: billingCycle === 'annual'
        ? (isTr ? 'Yıllık çekim ($12.49/ay)' : 'Billed annually ($12.49/mo)')
        : (isTr ? 'Aylık çekim' : 'Billed monthly'),
      matchedPkg: billingCycle === 'annual' ? (unlimitedAnnualPkg || unlimitedMonthlyPkg || proAnnualPkg || availablePackages[0]) : (unlimitedMonthlyPkg || proMonthlyPkg || availablePackages[0]),
      features: [
        isTr ? 'Sınırsız Workspace (Tüm markalarınız)' : 'Unlimited Workspaces (All brands)',
        isTr ? '10 Takip Edilebilir GEO / AEO İstemi' : '10 Trackable GEO / AEO Prompts',
        isTr ? 'Sınırsız Rakip Takip Radarı' : 'Unlimited Competitor Tracking Radar',
        isTr ? 'Tam Kapsamlı Teknik Denetim & Raporlar' : 'Full Technical Site Audit & Reports',
        isTr ? 'Sınırsız AI Aksiyon & Rakip Keşfi' : 'Unlimited AI Actions & Discovery Runs',
        isTr ? 'Maksimum Token Kotası & Turbo Hız' : 'Maximum Token Allowance & Turbo Speed',
        isTr ? '7/24 VIP Öncelikli Teknik Destek' : '24/7 Dedicated VIP Priority Support'
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

    const pkgToPurchase = planToProcess.matchedPkg || availablePackages[0];

    if (!pkgToPurchase) {
      setErrorMessage(isTr 
        ? 'Abonelik paketi hazırlanamadı. Lütfen sayfayı yenileyip tekrar deneyiniz.' 
        : 'Subscription package not available. Please refresh and try again.');
      return;
    }

    setIsPurchasing(true);

    try {
      const res = await purchasePackage(pkgToPurchase);
      if (res && res.success) {
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
          rawMsg.toLowerCase().includes('zaten')
        ) {
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
          userMsg = isTr 
            ? 'Paddle canlı ödeme onayı henüz tamamlanmamış (Onboarding incelemede). Paddle panelinizdeki hesap onay adımlarını tamamlayınız.'
            : 'Checkouts are not yet enabled for this Paddle account (Onboarding in review). Please complete verification in your Paddle dashboard.';
        } else {
          userMsg = rawMsg || (isTr 
            ? 'Ödeme tamamlanamadı. Lütfen kart bilgilerinizi kontrol ediniz.' 
            : 'Payment could not be completed. Please try again.');
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
            aria-label={isTr ? 'Kapat' : 'Close'}
            title={isPurchasing ? (isTr ? 'İptal Et' : 'Cancel') : (isTr ? 'Kapat' : 'Close')}
          >
            <X size={17} />
          </button>

          {!purchaseSuccess && (
            <>
              <h2 id="rc-paywall-main-title" className="rc-paywall-title">
                {isTr ? 'Paket Seçin' : 'Choose Plan'}
              </h2>

              {/* Master Billing Switcher */}
              <div className="rc-billing-switch-wrapper" role="group" aria-label="Billing frequency">
                <button
                  type="button"
                  className={`rc-toggle-tab ${billingCycle === 'monthly' ? 'is-active' : ''}`}
                  onClick={() => handleMasterCycleChange('monthly')}
                >
                  {isTr ? 'Aylık' : 'Monthly'}
                </button>
                <button
                  type="button"
                  className={`rc-toggle-tab ${billingCycle === 'annual' ? 'is-active' : ''}`}
                  onClick={() => handleMasterCycleChange('annual')}
                >
                  <span>{isTr ? 'Yıllık' : 'Annual'}</span>
                  <span className="rc-discount-pill">
                    {isTr ? '2 Ay Bedava' : '2 Months Free'}
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
                  {isTr 
                    ? 'Aktif cerilas_tools_pro aboneliğiniz bulunmaktadır.' 
                    : 'Active subscription detected.'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={openCustomerCenter}
                className="rc-manage-sub-link-btn"
              >
                {isTr ? 'Yönet' : 'Manage'}
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
                    ? (isTr ? 'Pro Aboneliğiniz Doğrulandı' : 'Pro Subscription Verified')
                    : selectedPlan.name === 'Unlimited' 
                    ? (isTr ? 'Unlimited Plan Aktifleştirildi' : 'Unlimited Plan Activated') 
                    : (isTr ? 'Pro Plan Aktifleştirildi' : 'Pro Plan Activated')}
                </span>
              </div>

              <h3 className="rc-success-title">
                {isRestoredPro 
                  ? (isTr ? 'Pro Aboneliğiniz Hesabınızla Eşitlendi!' : 'Pro Subscription Restored!') 
                  : (isTr ? 'Aboneliğiniz Aktifleştirildi!' : 'Welcome to Cerilas Pro!')}
              </h3>
              <p className="rc-success-desc">
                {isRestoredPro 
                  ? (isTr 
                    ? 'Paddle ve RevenueCat altyapısında aktif Pro aboneliğiniz doğrulandı. Mükerrer bir ücret alınmadan Pro ayrıcalıklarınız profilinize eksiksiz geri tanımlandı.' 
                    : 'Your active Pro subscription was verified with Paddle & RevenueCat. All Pro benefits have been restored with zero extra charges.')
                  : (isTr 
                    ? 'Ödemeniz başarıyla tamamlandı. Tüm araçlar, analizler ve genişletilmiş kotalar hesabınıza anında tanımlandı.' 
                    : 'Your payment was successful. All tools, advanced features, and priority speed are now unlocked.')}
              </p>

              <div className="rc-success-perks">
                <div className="rc-success-perk-item">
                  <CheckCircle2 size={16} className="rc-success-perk-icon" />
                  <span>{isTr ? 'Tüm Araçlara Sınırsız Erişim' : 'Full Unlimited Access to All Tools'}</span>
                </div>
                <div className="rc-success-perk-item">
                  <CheckCircle2 size={16} className="rc-success-perk-icon" />
                  <span>{isTr ? 'Yüksek İşlem & Yanıt Hızı' : 'High Priority Execution Speed'}</span>
                </div>
                <div className="rc-success-perk-item">
                  <CheckCircle2 size={16} className="rc-success-perk-icon" />
                  <span>{isTr ? 'Otomatik Aktif Hesap Hakları' : 'Instant Account Provisioning'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="rc-subscribe-btn rc-success-action-btn"
                  style={{ flex: 1, minWidth: '160px' }}
                  onClick={onClose}
                >
                  <span>{isTr ? 'Kullanmaya Başla' : 'Get Started'}</span>
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
                  {isTr ? 'Paddle Aboneliğini Yönet' : 'Manage on Paddle'}
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
                  <span>{isTr ? 'Lütfen bekleyin...' : 'Processing...'}</span>
                </>
              ) : selectedPlan.id === 'free' ? (
                <>
                  <span>{isTr ? 'Ücretsiz Plan ile Devam Et' : 'Continue with Free Plan'}</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>
                    {isTr 
                      ? `${selectedPlan.name} ile Devam Et — ${selectedPlan.ctaPriceDetail}` 
                      : `Continue with ${selectedPlan.name} — ${selectedPlan.ctaPriceDetail}`}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {isPurchasing && (
              <button 
                type="button" 
                onClick={handleCancelCheckout}
                className="rc-cancel-checkout-link"
              >
                {isTr ? 'İptal Et' : 'Cancel'}
              </button>
            )}

            <div className="rc-security-note">
              <span>🔒 {isTr ? '256-bit SSL güvenli ödeme • İstediğiniz an iptal edin' : '256-bit SSL secured • Cancel anytime'}</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
