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
import { REVENUECAT_CONFIG, cleanupOrphanedPaywallElements } from '../revenuecat/revenueCatService';
import { useTranslation } from '../i18n';
import './RevenueCatPaywallModal.css';

export default function RevenueCatPaywallModal({ 
  isOpen, 
  onClose,
  initialProductId = null 
}) {
  const { 
    isPro, 
    currentOffering, 
    purchasePackage, 
    openCustomerCenter
  } = useRevenueCat();

  const { language } = useTranslation();
  const isTr = language === 'tr';

  // State: selected plan ('free' | 'pro' | 'unlimited')
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  
  // State: billing cycle ('monthly' | 'annual')
  const [billingCycle, setBillingCycle] = useState('annual');

  // Independent cycle override per card (synced to master billingCycle by default)
  const [cardCycles, setCardCycles] = useState({
    pro: 'annual',
    unlimited: 'annual'
  });

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Available packages from RevenueCat
  const availablePackages = currentOffering?.availablePackages || [];

  // Match packages dynamically from the RevenueCat offering
  const getPackageForSelection = (planId, cycle) => {
    if (!availablePackages || availablePackages.length === 0) return null;

    if (planId === 'pro') {
      if (cycle === 'annual') {
        return availablePackages.find(pkg => 
          pkg.identifier === '$rc_annual' || 
          pkg.packageType === 'ANNUAL' ||
          pkg.product?.identifier === 'yearly' ||
          pkg.product?.identifier?.toLowerCase().includes('annual') ||
          pkg.product?.identifier?.toLowerCase().includes('year')
        ) || availablePackages.find(pkg => pkg.identifier === '$rc_annual') || availablePackages[0];
      } else {
        return availablePackages.find(pkg => 
          pkg.product?.identifier === 'pri_01m41vjy149vqr2av5b43x4yf9' ||
          pkg.identifier === 'pri_01m41vjy149vqr2av5b43x4yf9' ||
          pkg.identifier === '$rc_monthly' || 
          pkg.packageType === 'MONTHLY' ||
          pkg.product?.identifier === 'monthly'
        ) || availablePackages[0];
      }
    }

    if (planId === 'unlimited') {
      if (cycle === 'annual') {
        return availablePackages.find(pkg => 
          pkg.product?.identifier?.toLowerCase().includes('unlimited') && 
          (pkg.packageType === 'ANNUAL' || pkg.identifier?.toLowerCase().includes('annual'))
        ) || availablePackages.find(pkg => 
          pkg.identifier === '$rc_annual' || 
          pkg.packageType === 'ANNUAL' ||
          pkg.product?.identifier === 'yearly'
        ) || availablePackages[0];
      } else {
        return availablePackages.find(pkg => 
          pkg.product?.identifier === 'pri_01m41vmta5xebbmwt1k46xbfsf' ||
          pkg.identifier === 'pri_01m41vmta5xebbmwt1k46xbfsf' ||
          pkg.product?.identifier?.toLowerCase().includes('unlimited') ||
          pkg.identifier === '$rc_monthly' || 
          pkg.packageType === 'MONTHLY'
        ) || availablePackages[0];
      }
    }

    return null;
  };

  // Switch master cycle
  const handleMasterCycleChange = (newCycle) => {
    setBillingCycle(newCycle);
    setCardCycles({
      pro: newCycle,
      unlimited: newCycle
    });
  };

  // Switch specific card cycle
  const handleCardCycleChange = (planId, newCycle, e) => {
    if (e) e.stopPropagation();
    setCardCycles(prev => ({ ...prev, [planId]: newCycle }));
    setSelectedPlanId(planId);
  };

  // Dynamic packages
  const proMonthlyPkg = getPackageForSelection('pro', 'monthly');
  const proAnnualPkg = getPackageForSelection('pro', 'annual');
  const unlimitedMonthlyPkg = getPackageForSelection('unlimited', 'monthly');
  const unlimitedAnnualPkg = getPackageForSelection('unlimited', 'annual');

  // Plan Definitions in exact order: Free -> Pro -> Unlimited
  const plans = [
    {
      id: 'free',
      name: isTr ? 'Forever Free' : 'Forever Free',
      badge: isTr ? 'Ömür Boyu Ücretsiz' : 'Free Forever',
      badgeType: 'neutral',
      desc: isTr 
        ? 'Tüm temel araçlar ömür boyu bedava, premium araçlar için sınırlı token kotası.' 
        : 'Free tools free forever, with limited free token allowance for premium tools.',
      price: '$0',
      period: isTr ? '/ ömür boyu' : '/ forever',
      subDetail: isTr ? 'Kredi kartı gerekmez • %100 İstemci taraflı' : 'No credit card required • 100% Client-side',
      hasCycleSwitch: false,
      features: [
        isTr ? 'Tüm ücretsiz araçlar sınırsız ve ömür boyu bedava' : 'All free tools free forever',
        isTr ? 'Premium araçlar için sınırlı token hakkı' : 'Limited token allowance for premium tools',
        isTr ? '%100 İstemci taraflı gizlilik (Local WASM/WebGPU)' : '100% In-browser confidentiality (Local WASM)',
        isTr ? 'Dosyalarınız asla sunucuya yüklenmez' : 'Zero server uploads (Files stay on device)',
        isTr ? 'Standart tarayıcı işlem hızı' : 'Standard client processing speed'
      ],
      ctaText: !isPro 
        ? (isTr ? 'Mevcut Paketiniz' : 'Current Plan') 
        : (isTr ? 'Ücretsiz Plana Dön' : 'Switch to Free'),
      ctaVariant: 'secondary'
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: isTr ? 'En Popüler' : 'Most Popular',
      badgeType: 'featured',
      desc: isTr 
        ? 'Geliştiriciler ve yoğun kullanıcılar için yüksek token hakkı ve öncelikli işlem hızı.' 
        : 'High token allowance for premium AI, PDF and developer tools with priority execution.',
      hasCycleSwitch: true,
      currentCycle: cardCycles.pro,
      price: cardCycles.pro === 'annual' 
        ? (proAnnualPkg?.product?.price?.formattedPrice || '$49.90')
        : (proMonthlyPkg?.product?.price?.formattedPrice || '$4.99'),
      period: cardCycles.pro === 'annual' ? (isTr ? '/ yıl' : '/ year') : (isTr ? '/ ay' : '/ month'),
      savingsPill: cardCycles.pro === 'annual' ? (isTr ? '🎁 2 Ay Bedava!' : '🎁 2 Months Free!') : null,
      subDetail: cardCycles.pro === 'annual'
        ? (isTr ? '10 ay fiyatına 12 ay erişim (Aylık ~$4.16)' : '12 months for the price of 10 (~$4.16/mo)')
        : (isTr ? 'Aylık faturalandırılır • İstediğiniz an iptal edin' : 'Billed monthly • Cancel anytime'),
      matchedPkg: cardCycles.pro === 'annual' ? proAnnualPkg : proMonthlyPkg,
      features: [
        isTr ? 'Tüm ücretsiz araçlar sınırsız ve ömür boyu bedava' : 'All free tools free forever',
        isTr ? 'Premium araçlar için genişletilmiş token hakkı' : 'Expanded token allowance for premium tools',
        isTr ? 'Öncelikli çok çekirdekli işlem hızları' : 'Priority concurrency & multi-threaded speed',
        isTr ? 'Reklamsız ve dikkat dağıtmayan çalışma alanı' : 'Ad-free workspace with zero distractions',
        isTr ? 'Öncelikli e-posta desteği ve ticari kullanım' : 'Priority email support & commercial rights'
      ],
      ctaText: isTr ? 'Pro\'ya Abone Ol' : 'Subscribe to Pro',
      ctaVariant: 'primary'
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      badge: isTr ? 'Maksimum Güç' : 'Power User',
      badgeType: 'turbo',
      desc: isTr 
        ? 'Profesyonel ekipler ve yoğun AI/PDF işlemleri için maksimum tahsis ve turbo hız.' 
        : 'Maximum token allowance and turbo concurrency for power users and teams.',
      hasCycleSwitch: true,
      currentCycle: cardCycles.unlimited,
      price: cardCycles.unlimited === 'annual' 
        ? (unlimitedAnnualPkg?.product?.price?.formattedPrice || '$99.90')
        : (unlimitedMonthlyPkg?.product?.price?.formattedPrice || '$9.99'),
      period: cardCycles.unlimited === 'annual' ? (isTr ? '/ yıl' : '/ year') : (isTr ? '/ ay' : '/ month'),
      savingsPill: cardCycles.unlimited === 'annual' ? (isTr ? '🎁 2 Ay Bedava!' : '🎁 2 Months Free!') : null,
      subDetail: cardCycles.unlimited === 'annual'
        ? (isTr ? '10 ay fiyatına 12 ay erişim (Aylık ~$8.33)' : '12 months for the price of 10 (~$8.33/mo)')
        : (isTr ? 'Aylık faturalandırılır • İstediğiniz an iptal edin' : 'Billed monthly • Cancel anytime'),
      matchedPkg: cardCycles.unlimited === 'annual' ? unlimitedAnnualPkg : unlimitedMonthlyPkg,
      features: [
        isTr ? 'Tüm ücretsiz ve Pro özellikleri dahil' : 'Everything in Free & Pro included',
        isTr ? 'Maksimum token tahsisi (Tüm AI, PDF ve araştırma araçları)' : 'Maximum token allowance across all tools',
        isTr ? 'Turbo işlem hızı & en yüksek concurrency' : 'Turbo execution speed & highest priority',
        isTr ? '7/24 VIP öncelikli teknik destek' : '24/7 VIP priority developer support',
        isTr ? 'Gelecek tüm araçlara anında erişim' : 'Instant access to all upcoming tools'
      ],
      ctaText: isTr ? 'Unlimited\'a Abone Ol' : 'Subscribe to Unlimited',
      ctaVariant: 'turbo'
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

    // If Free plan clicked, simply close modal or navigate
    if (planToProcess.id === 'free') {
      onClose();
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
        setPurchaseSuccess(true);
      }
    } catch (err) {
      if (!err?.isCancelled) {
        console.error('[RevenueCat Paywall] Checkout error:', err);
        setErrorMessage(err.message || (isTr 
          ? 'Ödeme tamamlanamadı. Lütfen kart bilgilerinizi kontrol ediniz.' 
          : 'Payment could not be completed. Please try again.'));
      }
    } finally {
      setIsPurchasing(false);
      cleanupOrphanedPaywallElements();
    }
  };

  return createPortal(
    <div 
      className={`rc-paywall-backdrop ${isPurchasing ? 'is-purchasing-active' : ''}`}
      onClick={() => isPurchasing ? handleCancelCheckout() : onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rc-paywall-main-title"
    >
      <div 
        className="rc-paywall-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="rc-paywall-header">
          <button 
            type="button" 
            className="rc-paywall-close-btn"
            onClick={isPurchasing ? handleCancelCheckout : onClose}
            aria-label={isTr ? 'Kapat' : 'Close'}
            title={isPurchasing ? (isTr ? 'İptal Et' : 'Cancel') : (isTr ? 'Kapat' : 'Close')}
          >
            <X size={17} />
          </button>

          <div className="rc-paywall-badge">
            <Crown size={14} />
            <span>Cerilas Tools Plans</span>
          </div>

          <h2 id="rc-paywall-main-title" className="rc-paywall-title">
            {isTr ? 'Paketinizi Seçin ve Sınırları Kaldırın' : 'Simple, Transparent Plans Tailored For You'}
          </h2>
          <p className="rc-paywall-subtitle">
            {isTr 
              ? 'Sıfır sunucu depolaması. İstemci taraflı %100 gizlilik. İhtiyacınıza uygun paketi seçin.' 
              : 'Zero server file uploads. 100% In-browser confidentiality. Choose the plan that fits your workflow.'}
          </p>

          {/* Master Billing Switcher with 2 Months Free Badge */}
          <div className="rc-billing-switch-wrapper" role="group" aria-label="Billing frequency">
            <button
              type="button"
              className={`rc-toggle-tab ${billingCycle === 'monthly' ? 'is-active' : ''}`}
              onClick={() => handleMasterCycleChange('monthly')}
            >
              {isTr ? 'Aylık Ödeme' : 'Monthly Billing'}
            </button>
            <button
              type="button"
              className={`rc-toggle-tab ${billingCycle === 'annual' ? 'is-active' : ''}`}
              onClick={() => handleMasterCycleChange('annual')}
            >
              <span>{isTr ? 'Yıllık Ödeme' : 'Annual Billing'}</span>
              <span className="rc-discount-pill">
                <Gift size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                {isTr ? '2 Ay Bedava' : '2 Months Free'}
              </span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="rc-paywall-body">
          {/* Active Pro Banner */}
          {isPro && !purchaseSuccess && (
            <div className="rc-active-pro-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontSize: '0.9rem', color: '#6ee7b7', fontWeight: 600 }}>
                  {isTr 
                    ? 'Hesabınızda aktif cerilas_tools_pro aboneliği bulunmaktadır.' 
                    : 'You currently have active cerilas_tools_pro entitlement.'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={openCustomerCenter}
                className="rc-manage-sub-link-btn"
              >
                {isTr ? 'Aboneliği Yönet' : 'Manage Subscription'}
              </button>
            </div>
          )}

          {/* Success Banner */}
          {purchaseSuccess ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto', color: '#10b981' }}>
                <Check size={32} />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
                {isTr ? 'Tebrikler! Aboneliğiniz Aktifleştirildi' : 'Welcome to Cerilas Pro!'}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', maxWidth: 440, margin: '0 auto 1.5rem auto' }}>
                {isTr 
                  ? 'Aboneliğiniz RevenueCat üzerinden başarıyla onaylandı. Tüm limit ve araçlar hesabınıza tanımlandı.' 
                  : 'Your subscription has been activated via RevenueCat. All premium limits and tools are unlocked immediately.'}
              </p>
              <button 
                type="button" 
                className="rc-subscribe-btn"
                style={{ margin: '0 auto' }}
                onClick={onClose}
              >
                {isTr ? 'Araçları Kullanmaya Başla' : 'Start Using Tools'}
              </button>
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
                          {isCardFeatured && <Sparkles size={11} style={{ marginRight: 4 }} />}
                          {isCardTurbo && <Zap size={11} style={{ marginRight: 4 }} />}
                          <span>{plan.badge}</span>
                        </div>
                      )}

                      {/* Header Info */}
                      <div className="rc-plan-card-head">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 className="rc-plan-name">{plan.name}</h3>
                          <div className={`rc-plan-radio ${isSelected ? 'is-checked' : ''}`}>
                            {isSelected && <div className="rc-plan-radio-dot" />}
                          </div>
                        </div>

                        <p className="rc-plan-desc">{plan.desc}</p>
                      </div>

                      {/* Price Section */}
                      <div className="rc-plan-pricing-section">
                        {/* Monthly vs Yearly Switch on card for Pro & Unlimited */}
                        {plan.hasCycleSwitch ? (
                          <div className="rc-card-cycle-pill-group" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={`rc-card-cycle-pill ${plan.currentCycle === 'monthly' ? 'is-active' : ''}`}
                              onClick={(e) => handleCardCycleChange(plan.id, 'monthly', e)}
                            >
                              {isTr ? 'Aylık' : 'Monthly'}
                            </button>
                            <button
                              type="button"
                              className={`rc-card-cycle-pill ${plan.currentCycle === 'annual' ? 'is-active' : ''}`}
                              onClick={(e) => handleCardCycleChange(plan.id, 'annual', e)}
                            >
                              <span>{isTr ? 'Yıllık' : 'Yearly'}</span>
                              <span className="rc-cycle-badge-save">{isTr ? '2 Ay Bedava' : '2 Mo Free'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="rc-card-cycle-spacer" />
                        )}

                        {/* Savings Banner for Annual */}
                        {plan.savingsPill && (
                          <div className="rc-plan-savings-pill">
                            <Gift size={13} />
                            <span>{plan.savingsPill}</span>
                          </div>
                        )}

                        <div className="rc-plan-price-row">
                          <span className="rc-plan-price-num">{plan.price}</span>
                          <span className="rc-plan-price-period">{plan.period}</span>
                        </div>

                        <div className="rc-plan-subdetail">
                          {plan.subDetail}
                        </div>
                      </div>

                      {/* Feature Bullet Points */}
                      <ul className="rc-plan-features-list">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="rc-plan-feature-item">
                            <Check size={14} className="rc-plan-feature-icon" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Card CTA Action Button */}
                      <div className="rc-plan-card-foot">
                        <button
                          type="button"
                          className={`rc-card-action-btn ${isSelected ? 'is-active' : ''} ${plan.id === 'free' ? 'btn-free' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanId(plan.id);
                            handleStartCheckout(plan);
                          }}
                          disabled={isPurchasing}
                        >
                          {isPurchasing && isSelected ? (
                            <Loader2 size={15} className="spin" />
                          ) : (
                            <span>{plan.ctaText}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security & Benefits Guarantee Box */}
              <div className="rc-benefits-box">
                <h4 className="rc-benefits-title">
                  <ShieldCheck size={15} color="#38bdf8" />
                  <span>{isTr ? 'Cerilas Tools Güvencesi & Mimari Standartlar:' : 'Cerilas Tools Core Guarantees:'}</span>
                </h4>
                <ul className="rc-benefits-list">
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>{isTr ? 'Sıfır Sunucu Depolaması:' : 'Zero Server Storage:'}</strong> {isTr ? '%100 istemci taraflı gizlilik' : '100% in-browser confidentiality'}</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>{isTr ? '31+ Aracın Tamamı:' : 'Full 31+ Tools:'}</strong> {isTr ? 'Kesintisiz ve reklamsız erişim' : 'Unlimited & uninterrupted access'}</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>{isTr ? 'Esnek İptal:' : 'Cancel Anytime:'}</strong> {isTr ? 'Tek tıkla self-servis iptal ve yönetim' : 'One-click self-service cancellation'}</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>{isTr ? 'Öncelikli Güncellemeler:' : 'Priority Sync:'}</strong> {isTr ? 'Yeni araçlara anında erişim' : 'Instant access to newly released tools'}</span>
                  </li>
                </ul>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="rc-error-alert">
                  <AlertCircle size={17} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary Footer CTA */}
              <div className="rc-paywall-actions">
                <button
                  type="button"
                  className="rc-subscribe-btn"
                  onClick={() => handleStartCheckout()}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      <span>{isTr ? 'Ödeme Penceresi Açıldı...' : 'Checkout Window Open...'}</span>
                    </>
                  ) : selectedPlan.id === 'free' ? (
                    <>
                      <span>{isTr ? 'Ücretsiz Plan ile Devam Et' : 'Continue with Free Plan'}</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>
                        {isTr 
                          ? `${selectedPlan.name} ile Devam Et (${selectedPlan.price} ${selectedPlan.period})` 
                          : `Continue with ${selectedPlan.name} (${selectedPlan.price} ${selectedPlan.period})`}
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
                    {isTr ? 'Ödeme Penceresini Kapat / İptal Et' : 'Cancel & Close Payment Window'}
                  </button>
                )}

                <div className="rc-security-note">
                  <span>🔒 {isTr ? 'RevenueCat & Stripe ile 256-bit SSL şifreli güvenli ödeme' : 'Secure checkout powered by RevenueCat & Stripe'}</span>
                  <span>•</span>
                  <span>{isTr ? 'İstediğiniz zaman iptal edebilirsiniz' : 'Cancel anytime'}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
