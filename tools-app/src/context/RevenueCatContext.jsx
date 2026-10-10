import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { 
  initRevenueCat, 
  getPurchases, 
  getCustomerInfo, 
  checkProEntitlement, 
  checkUnlimitedEntitlement,
  getOfferings, 
  purchasePackage, 
  presentPaywall, 
  openCustomerCenter as openRCManagementUrl,
  REVENUECAT_CONFIG,
  getOrCreateAnonymousAppUserId
} from '../revenuecat/revenueCatService';

const RevenueCatContext = createContext(null);

export function RevenueCatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [error, setError] = useState(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isCustomerCenterOpen, setIsCustomerCenterOpen] = useState(false);
  const [paywallInitialProduct, setPaywallInitialProduct] = useState(null);
  const [paywallInitialCycle, setPaywallInitialCycle] = useState('monthly');

  // Listen to custom window events triggered across the app
  useEffect(() => {
    const handleOpenPaywallEvt = (e) => {
      if (e?.detail?.defaultPackageId || e?.detail?.initialProductId || e?.detail?.plan) {
        setPaywallInitialProduct(e.detail.defaultPackageId || e.detail.initialProductId || e.detail.plan);
      }
      setPaywallInitialCycle(e?.detail?.cycle || 'monthly');
      setIsPaywallOpen(true);
    };
    const handleOpenCustomerCenterEvt = () => {
      setIsCustomerCenterOpen(true);
    };

    window.addEventListener('cerilas:open-paywall', handleOpenPaywallEvt);
    window.addEventListener('cerilas:open-customer-center', handleOpenCustomerCenterEvt);

    return () => {
      window.removeEventListener('cerilas:open-paywall', handleOpenPaywallEvt);
      window.removeEventListener('cerilas:open-customer-center', handleOpenCustomerCenterEvt);
    };
  }, []);

  // Initialize SDK
  useEffect(() => {
    let isMounted = true;

    async function setupRevenueCat() {
      setIsLoading(true);
      setError(null);
      try {
        const userId = isAuthenticated && user?.id ? String(user.id) : null;
        const userEmail = isAuthenticated && user?.email ? String(user.email) : null;

        initRevenueCat(userId, userEmail);

        // Fetch Customer Info & Offerings in parallel
        const [info, fetchedOfferings] = await Promise.all([
          getCustomerInfo().catch(e => {
            console.warn('[RevenueCat] Failed to fetch customer info:', e);
            return null;
          }),
          getOfferings().catch(e => {
            console.warn('[RevenueCat] Failed to fetch offerings:', e);
            return null;
          })
        ]);

        if (isMounted) {
          setCustomerInfo(info);
          setIsPro(checkProEntitlement(info));
          setOfferings(fetchedOfferings);
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[RevenueCatProvider] Setup error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize RevenueCat');
          setIsLoading(false);
        }
      }
    }

    setupRevenueCat();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id, user?.email]);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      const entitled = checkProEntitlement(info);
      setIsPro(entitled);
      return info;
    } catch (err) {
      console.warn('[RevenueCat] Failed to refresh customer info:', err);
      return null;
    }
  }, []);

  const [manualPlanOverride, setManualPlanOverride] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('cerilas_manual_plan_override');
    } catch (_) {
      return null;
    }
  });

  const clearManualOverride = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cerilas_manual_plan_override');
      }
    } catch (_) {}
    setManualPlanOverride(null);
  }, []);

  // Explicit downgrade to free
  const downgradeToFree = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cerilas_manual_plan_override', 'free');
      }
    } catch (_) {}
    setManualPlanOverride('free');
    setIsPro(false);
    setIsUnlimited(false);
  }, []);

  // Purchase a package
  const handlePurchase = useCallback(async (rcPackage, email = null) => {
    setError(null);
    try {
      const customerEmail = email || user?.email || null;
      const { customerInfo: updatedInfo, isPro: userIsPro } = await purchasePackage(rcPackage, customerEmail);
      clearManualOverride();
      setCustomerInfo(updatedInfo);
      setIsPro(userIsPro);
      return { success: true, customerInfo: updatedInfo, isPro: userIsPro };
    } catch (err) {
      if (err?.isCancelled) {
        return { success: false, cancelled: true };
      }
      if (err?.isAlreadyPurchased) {
        clearManualOverride();
        setIsPro(true);
        try {
          const token = localStorage.getItem('cerilas_tools_user_token');
          if (token) {
            await fetch('/api/auth/sync-plan', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ plan: 'pro', force: true })
            });
          }
        } catch (_) {}
        const latest = await refreshCustomerInfo();
        return { 
          success: true, 
          isAlreadyPurchased: true, 
          customerInfo: latest || customerInfo, 
          isPro: true 
        };
      }
      setError(err.message || 'Purchase failed');
      throw err;
    }
  }, [user?.email, clearManualOverride, refreshCustomerInfo, customerInfo]);

  // Present Paywall - Opens custom modal with optional default selected package and billing cycle
  const handlePresentPaywall = useCallback((options = {}) => {
    if (options.defaultPackageId || options.initialProductId) {
      setPaywallInitialProduct(options.defaultPackageId || options.initialProductId);
    }
    setPaywallInitialCycle(options.cycle || 'monthly');
    setIsPaywallOpen(true);
  }, []);

  // Open Customer Center / Subscription Management
  const handleOpenCustomerCenter = useCallback((action = 'overview') => {
    const opened = openRCManagementUrl(customerInfo, action);
    if (!opened) {
      // If no direct URL, open the internal Customer Center modal
      setIsCustomerCenterOpen(true);
    }
  }, [customerInfo]);

  const activeSubscriptions = useMemo(() => {
    if (!customerInfo?.activeSubscriptions) return [];
    return Array.from(customerInfo.activeSubscriptions);
  }, [customerInfo]);

  const [isUnlimited, setIsUnlimited] = useState(false);

  // Derive effective plan: 'free' | 'pro' | 'unlimited'
  const effectivePlan = useMemo(() => {
    if (manualPlanOverride === 'free') {
      return 'free';
    }

    const dbPlan = (user?.plan || '').toLowerCase();
    if (dbPlan === 'free') {
      return 'free';
    }
    if (dbPlan === 'unlimited' || dbPlan === 'enterprise') return 'unlimited';
    if (dbPlan === 'pro') return 'pro';

    if (isUnlimited || checkUnlimitedEntitlement(customerInfo)) return 'unlimited';
    if (isPro || checkProEntitlement(customerInfo)) return 'pro';

    return 'free';
  }, [manualPlanOverride, user?.plan, isUnlimited, isPro, customerInfo]);

  // Sync to database if user is authenticated and higher tier detected
  useEffect(() => {
    if (manualPlanOverride === 'free' || user?.plan === 'free') {
      return;
    }

    if (isAuthenticated && user?.id && effectivePlan !== 'free' && user?.plan !== effectivePlan) {
      try {
        const token = localStorage.getItem('cerilas_tools_user_token');
        if (token) {
          fetch('/api/auth/sync-plan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ plan: effectivePlan })
          }).catch(() => {});
        }
      } catch (_) {}
    }
  }, [isAuthenticated, user?.id, user?.plan, effectivePlan, manualPlanOverride]);

  const managementUrl = customerInfo?.managementURL || null;

  const cancelUrl = useMemo(() => {
    return managementUrl ? managementUrl.replace('action=overview', 'action=cancel') : null;
  }, [managementUrl]);

  const value = useMemo(() => ({
    isInitialized,
    isLoading,
    customerInfo,
    isPro: effectivePlan === 'pro' || effectivePlan === 'unlimited',
    isUnlimited: effectivePlan === 'unlimited',
    effectivePlan,
    plan: effectivePlan,
    offerings,
    currentOffering: offerings?.current || null,
    activeSubscriptions,
    managementUrl,
    cancelUrl,
    clearManualOverride,
    error,
    refreshCustomerInfo,
    downgradeToFree,
    purchasePackage: handlePurchase,
    presentPaywall: handlePresentPaywall,
    openCustomerCenter: handleOpenCustomerCenter,
    isPaywallOpen,
    setIsPaywallOpen,
    paywallInitialProduct,
    setPaywallInitialProduct,
    paywallInitialCycle,
    setPaywallInitialCycle,
    isCustomerCenterOpen,
    setIsCustomerCenterOpen,
    config: REVENUECAT_CONFIG
  }), [
    isInitialized,
    isLoading,
    customerInfo,
    effectivePlan,
    offerings,
    activeSubscriptions,
    managementUrl,
    cancelUrl,
    clearManualOverride,
    error,
    refreshCustomerInfo,
    downgradeToFree,
    handlePurchase,
    handlePresentPaywall,
    handleOpenCustomerCenter,
    isPaywallOpen,
    isCustomerCenterOpen
  ]);

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}
