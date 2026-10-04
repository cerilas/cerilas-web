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
  Zap
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

  const [selectedProductId, setSelectedProductId] = useState('monthly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Map products to offerings packages if available
  const availablePackages = currentOffering?.availablePackages || [];

  // Match packages dynamically from the RevenueCat offering
  const getPackageForProduct = (targetId) => {
    if (!availablePackages || availablePackages.length === 0) return null;

    // 1. Direct match by product or package identifier
    const directMatch = availablePackages.find(pkg => 
      pkg.product?.identifier === targetId ||
      pkg.identifier === targetId
    );
    if (directMatch) return directMatch;

    const lower = (targetId || '').toLowerCase();

    // 2. Monthly aliases
    if (
      lower.includes('month') || 
      lower.includes('pro') || 
      lower === 'pri_01m41vjy149vqr2av5b43x4yf9' || 
      lower === 'monthly'
    ) {
      return availablePackages.find(pkg => 
        pkg.identifier === '$rc_monthly' || 
        pkg.product?.identifier === 'monthly' || 
        pkg.packageType === 'MONTHLY'
      ) || availablePackages[0];
    }

    // 3. Unlimited Monthly alias
    if (lower.includes('unlimited') || lower === 'pri_01m41vmta5xebbmwt1k46xbfsf') {
      return availablePackages.find(pkg => 
        pkg.identifier === '$rc_monthly' || 
        pkg.product?.identifier === 'monthly'
      ) || availablePackages[0];
    }

    // 4. Yearly aliases
    if (lower.includes('year') || lower.includes('annual') || lower === 'yearly') {
      return availablePackages.find(pkg => 
        pkg.identifier === '$rc_annual' || 
        pkg.product?.identifier === 'yearly' || 
        pkg.packageType === 'ANNUAL'
      );
    }

    // 5. Lifetime aliases
    if (lower.includes('life') || lower === 'lifetime') {
      return availablePackages.find(pkg => 
        pkg.identifier === '$rc_lifetime' || 
        pkg.product?.identifier === 'lifetime' || 
        pkg.packageType === 'LIFETIME'
      );
    }

    return availablePackages[0] || null;
  };

  const monthlyPkg = getPackageForProduct('monthly');
  const yearlyPkg = getPackageForProduct('yearly');
  const lifetimePkg = getPackageForProduct('lifetime');

  const productList = [
    {
      id: 'monthly',
      aliasIds: ['pri_01m41vjy149vqr2av5b43x4yf9', 'pro', 'monthly'],
      name: isTr ? 'PRO Aylık' : 'PRO Monthly',
      matchedPkg: monthlyPkg,
      badge: isTr ? 'En Popüler' : 'Most Popular',
      fallbackPrice: '$9.99 / ay',
      periodText: isTr ? '/ ay' : '/ mo',
      desc: isTr 
        ? '31+ araca sınırsız erişim, genişletilmiş token kotası ve öncelikli işlem hızı.' 
        : 'Full access to all 31+ developer, AI, PDF and financial tools with priority tokens.'
    },
    {
      id: 'yearly',
      aliasIds: ['yearly', 'annual'],
      name: isTr ? 'PRO Yıllık' : 'PRO Yearly',
      matchedPkg: yearlyPkg,
      badge: isTr ? '%33 İndirim' : 'Save 33%',
      fallbackPrice: '$79.99 / yıl',
      periodText: isTr ? '/ yıl' : '/ yr',
      desc: isTr 
        ? 'Yıllık peşin faturalandırma ile 4 ay ücretsiz kullanım avantajı.' 
        : 'Best annual rate with 4 months free. Billed annually.'
    },
    {
      id: 'lifetime',
      aliasIds: ['lifetime'],
      name: isTr ? 'Ömür Boyu VIP' : 'Lifetime Access',
      matchedPkg: lifetimePkg,
      badge: isTr ? 'Tek Seferlik' : 'Best Value',
      fallbackPrice: '$99.99 tek sefer',
      periodText: isTr ? 'tek sefer' : 'one-time',
      desc: isTr 
        ? 'Tek sefer ödeyin, cerilas_tools_pro üyeliğine ve gelecek tüm araçlara ömür boyu sahip olun.' 
        : 'Pay once, own forever. All present and future tools with lifetime VIP entitlement.'
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
      const match = productList.find(p => 
        p.id === initialProductId || 
        p.aliasIds?.includes(initialProductId)
      );
      if (match) {
        setSelectedProductId(match.id);
      }
    }
  }, [initialProductId]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isPurchasing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPurchasing, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const selectedItem = productList.find(p => p.id === selectedProductId) || productList[0];
  const selectedDisplayPrice = selectedItem?.matchedPkg?.product?.price?.formattedPrice 
    || selectedItem?.fallbackPrice;

  // Handle checkout via RevenueCat Web Billing
  const handleStartCheckout = async (targetProductItem = null) => {
    cleanupOrphanedPaywallElements();
    setErrorMessage('');

    const itemToBuy = targetProductItem || selectedItem;
    const pkgToPurchase = itemToBuy?.matchedPkg || availablePackages[0];

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
      className="rc-paywall-backdrop"
      onClick={() => !isPurchasing && onClose()}
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
            onClick={onClose}
            disabled={isPurchasing}
            aria-label={isTr ? 'Kapat' : 'Close'}
          >
            <X size={17} />
          </button>

          <div className="rc-paywall-badge">
            <Crown size={14} />
            <span>Cerilas Tools PRO</span>
          </div>

          <h2 id="rc-paywall-main-title" className="rc-paywall-title">
            {isTr ? 'Cerilas Tools PRO ile Tüm Sınırları Kaldırın' : 'Unlock Full Privacy-First Tool Suite'}
          </h2>
          <p className="rc-paywall-subtitle">
            {isTr 
              ? 'Sıfır sunucu depolaması. İstemci taraflı güvenlik. Sınırsız dönüştürme ve genişletilmiş yapay zeka token kotası.' 
              : 'Zero server file storage. Client-side deterministic security. Unlimited conversions, batch processing, and maximum AI allowance.'}
          </p>
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
                {isTr ? 'Cerilas PRO Aktifleştirildi!' : 'Welcome to Cerilas Pro!'}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', maxWidth: 440, margin: '0 auto 1.5rem auto' }}>
                {isTr 
                  ? 'Aboneliğiniz RevenueCat üzerinden onaylandı. Tüm araç ve limitler anında hesabınıza tanımlandı.' 
                  : 'Your subscription has been activated via RevenueCat. All premium limits and tools are unlocked immediately.'}
              </p>
              <button 
                type="button" 
                className="rc-subscribe-btn"
                style={{ margin: '0 auto' }}
                onClick={onClose}
              >
                {isTr ? 'Araçları Kullanmaya Başla' : 'Start Using Pro Tools'}
              </button>
            </div>
          ) : (
            <>
              {/* Product Selection Grid */}
              <div className="rc-products-grid">
                {productList.map((item) => {
                  const isSelected = selectedProductId === item.id;
                  const displayPrice = item.matchedPkg?.product?.price?.formattedPrice || item.fallbackPrice;

                  return (
                    <div 
                      key={item.id}
                      className={`rc-product-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedProductId(item.id)}
                    >
                      {item.badge && (
                        <div className="rc-product-pill-badge">
                          {item.badge}
                        </div>
                      )}

                      <div className="rc-product-card-top">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <h4 className="rc-product-name">{item.name}</h4>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isSelected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#3b82f6' }} />}
                          </div>
                        </div>

                        <div className="rc-product-price">
                          {displayPrice}
                        </div>
                        <p className="rc-product-desc">{item.desc}</p>
                      </div>

                      <button
                        type="button"
                        className={`rc-card-action-btn ${isSelected ? 'is-active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductId(item.id);
                          handleStartCheckout(item);
                        }}
                        disabled={isPurchasing}
                      >
                        {isPurchasing && isSelected ? (
                          <Loader2 size={15} className="spin" />
                        ) : (
                          <span>{isSelected ? (isTr ? 'Bu Paketi Al' : 'Subscribe Now') : (isTr ? 'Seç ve Al' : 'Select & Pay')}</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Benefits Checklist */}
              <div className="rc-benefits-box">
                <h4 className="rc-benefits-title">
                  <Sparkles size={14} color="#38bdf8" />
                  <span>{isTr ? 'Cerilas Tools PRO Paketine Dahil Olanlar:' : 'Everything Included in Cerilas Tools Pro:'}</span>
                </h4>
                <ul className="rc-benefits-list">
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>{isTr ? '31+ Aracın Tamamı:' : 'Full 31+ Tools:'}</strong> {isTr ? 'Sınırsız ve kesintisiz erişim' : 'Unlimited & uninterrupted access'}</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>{isTr ? 'Sıfır Sunucu Depolaması:' : 'Zero Server Storage:'}</strong> {isTr ? '%100 istemci taraflı gizlilik' : '100% in-browser confidentiality'}</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>{isTr ? 'Yüksek Token Kotası:' : 'High Token Allowance:'}</strong> {isTr ? 'Gelişmiş AI & PDF işlemleri' : 'Heavy AI & PDF processing'}</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>{isTr ? 'Öncelikli Güncellemeler:' : 'Priority Sync:'}</strong> {isTr ? 'Yeni araçlara anında erişim' : 'Immediate access to upcoming tools'}</span>
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

              {/* CTA Action */}
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
                      <span>{isTr ? 'Ödeme Sayfası Açılıyor...' : 'Opening Checkout...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>
                        {isTr 
                          ? `${selectedItem.name} ile Devam Et (${selectedDisplayPrice})` 
                          : `Continue with ${selectedItem.name} (${selectedDisplayPrice})`}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="rc-security-note">
                  <span>🔒 {isTr ? 'RevenueCat & Stripe ile 256-bit SSL güvenli ödeme' : 'Secure checkout powered by RevenueCat & Stripe'}</span>
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
