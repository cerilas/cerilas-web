import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Crown, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { useRevenueCat } from '../context/RevenueCatContext';
import { REVENUECAT_CONFIG } from '../revenuecat/revenueCatService';
import './RevenueCatPaywallModal.css';

export default function RevenueCatPaywallModal({ 
  isOpen, 
  onClose,
  initialProductId = null 
}) {
  const { 
    isPro, 
    offerings, 
    currentOffering, 
    purchasePackage, 
    presentPaywall,
    openCustomerCenter, 
    isLoading: isRcLoading 
  } = useRevenueCat();

  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId || REVENUECAT_CONFIG.PRODUCTS.PRO_MONTHLY.id
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const nativePaywallContainerRef = useRef(null);

  // Map products to offerings packages if available
  const availablePackages = currentOffering?.availablePackages || [];

  const getPackageForProduct = (productId) => {
    return availablePackages.find(pkg => 
      pkg.product?.identifier === productId ||
      pkg.identifier === productId ||
      (productId === 'monthly' && pkg.packageType === 'MONTHLY') ||
      (productId === 'yearly' && pkg.packageType === 'ANNUAL') ||
      (productId === 'lifetime' && pkg.packageType === 'LIFETIME')
    );
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setPurchaseSuccess(false);
      setIsPurchasing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }
  }, [initialProductId]);

  // Handle ESC key
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

  const productList = [
    {
      ...REVENUECAT_CONFIG.PRODUCTS.PRO_MONTHLY,
      matchedPkg: getPackageForProduct(REVENUECAT_CONFIG.PRODUCTS.PRO_MONTHLY.id),
      desc: 'Full access to all 31+ developer, AI, PDF and financial tools with priority tokens.'
    },
    {
      ...REVENUECAT_CONFIG.PRODUCTS.UNLIMITED_MONTHLY,
      matchedPkg: getPackageForProduct(REVENUECAT_CONFIG.PRODUCTS.UNLIMITED_MONTHLY.id),
      desc: 'Maximum token allowance, batch processing & unlimited heavy tool workflows.'
    },
    {
      ...REVENUECAT_CONFIG.PRODUCTS.YEARLY,
      matchedPkg: getPackageForProduct(REVENUECAT_CONFIG.PRODUCTS.YEARLY.id) || getPackageForProduct('yearly'),
      desc: 'Best annual rate with 2 months free. Billed annually.'
    },
    {
      ...REVENUECAT_CONFIG.PRODUCTS.LIFETIME,
      matchedPkg: getPackageForProduct(REVENUECAT_CONFIG.PRODUCTS.LIFETIME.id) || getPackageForProduct('lifetime'),
      desc: 'Pay once, own forever. All present and future tools with lifetime VIP entitlement.'
    }
  ];

  const handleCheckout = async () => {
    setErrorMessage('');
    const selectedItem = productList.find(p => p.id === selectedProductId);

    if (!selectedItem) {
      setErrorMessage('Please select a plan to continue.');
      return;
    }

    setIsPurchasing(true);

    try {
      if (selectedItem.matchedPkg) {
        // Direct checkout via RevenueCat Web SDK purchase
        const res = await purchasePackage(selectedItem.matchedPkg);
        if (res.success) {
          setPurchaseSuccess(true);
        }
      } else {
        // Trigger RevenueCat native paywall modal
        await presentPaywall({
          onSuccess: () => {
            setPurchaseSuccess(true);
          },
          onClose: () => {
            setIsPurchasing(false);
          }
        });
      }
    } catch (err) {
      if (!err?.isCancelled) {
        setErrorMessage(err.message || 'Payment could not be completed. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
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
            aria-label="Close"
          >
            <X size={17} />
          </button>

          <div className="rc-paywall-badge">
            <Crown size={14} />
            <span>Cerilas Tools PRO</span>
          </div>

          <h2 id="rc-paywall-main-title" className="rc-paywall-title">
            Unlock Full Privacy-First Tool Suite
          </h2>
          <p className="rc-paywall-subtitle">
            Zero server file storage. Client-side deterministic security. Unlimited conversions, batch processing, and maximum AI allowance.
          </p>
        </div>

        {/* Body */}
        <div className="rc-paywall-body">
          {/* Active Pro Banner */}
          {isPro && !purchaseSuccess && (
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontSize: '0.9rem', color: '#6ee7b7', fontWeight: 600 }}>
                  You currently have active <strong>cerilas_tools_pro</strong> entitlement.
                </span>
              </div>
              <button 
                type="button" 
                onClick={openCustomerCenter}
                className="rc-subscribe-btn"
                style={{ width: 'auto', padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
              >
                Manage Subscription
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
                Welcome to Cerilas Pro!
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', maxWidth: 440, margin: '0 auto 1.5rem auto' }}>
                Your subscription has been activated via RevenueCat. All premium limits and tools are unlocked immediately.
              </p>
              <button 
                type="button" 
                className="rc-subscribe-btn"
                style={{ margin: '0 auto' }}
                onClick={onClose}
              >
                Start Using Pro Tools
              </button>
            </div>
          ) : (
            <>
              {/* Product Selection Grid */}
              <div className="rc-products-grid">
                {productList.map((item) => {
                  const isSelected = selectedProductId === item.id;
                  const displayPrice = item.matchedPkg?.product?.currentPrice?.formattedPrice 
                    || item.matchedPkg?.product?.price?.formattedPrice
                    || item.fallbackPrice;

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

                      <div>
                        <h4 className="rc-product-name">{item.name}</h4>
                        <div className="rc-product-price">{displayPrice}</div>
                        <p className="rc-product-desc">{item.desc}</p>
                      </div>

                      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: isSelected ? '#60a5fa' : '#64748b' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${isSelected ? '#3b82f6' : '#64748b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />}
                        </div>
                        <span>{isSelected ? 'Selected' : 'Select'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Benefits Checklist */}
              <div className="rc-benefits-box">
                <h4 className="rc-benefits-title">
                  <Sparkles size={14} color="#38bdf8" />
                  <span>Everything Included in Cerilas Tools Pro:</span>
                </h4>
                <ul className="rc-benefits-list">
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>Full 31+ Tools:</strong> Lifetime &amp; unlimited access</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>Zero Server Storage:</strong> 100% in-browser confidentiality</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>High Token Allowance:</strong> Heavy AI &amp; PDF processing</span>
                  </li>
                  <li className="rc-benefit-item">
                    <Check size={15} className="rc-benefit-icon" />
                    <span><strong>Priority Sync:</strong> Immediate access to upcoming tools</span>
                  </li>
                </ul>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.14)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 10, color: '#fca5a5', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* CTA Action */}
              <div className="rc-paywall-actions">
                <button
                  type="button"
                  className="rc-subscribe-btn"
                  onClick={handleCheckout}
                  disabled={isPurchasing || isRcLoading}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      <span>Processing Checkout...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Subscribe with RevenueCat</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="rc-security-note">
                  <span>🔒 Secure checkout powered by RevenueCat &amp; Stripe</span>
                  <span>•</span>
                  <span>Cancel anytime</span>
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
