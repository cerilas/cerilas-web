import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { 
  initRevenueCat, 
  getPurchases, 
  getCustomerInfo, 
  checkProEntitlement, 
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

  // Purchase a package
  const handlePurchase = useCallback(async (rcPackage, email = null) => {
    setError(null);
    try {
      const customerEmail = email || user?.email || null;
      const { customerInfo: updatedInfo, isPro: userIsPro } = await purchasePackage(rcPackage, customerEmail);
      setCustomerInfo(updatedInfo);
      setIsPro(userIsPro);
      return { success: true, customerInfo: updatedInfo, isPro: userIsPro };
    } catch (err) {
      if (err?.isCancelled) {
        return { success: false, cancelled: true };
      }
      setError(err.message || 'Purchase failed');
      throw err;
    }
  }, [user?.email]);

  // Present Paywall
  const handlePresentPaywall = useCallback(async (options = {}) => {
    try {
      return await presentPaywall({
        ...options,
        customerEmail: options.customerEmail || user?.email,
        onSuccess: (updatedInfo) => {
          setCustomerInfo(updatedInfo);
          setIsPro(checkProEntitlement(updatedInfo));
          if (options.onSuccess) options.onSuccess(updatedInfo);
        }
      });
    } catch (err) {
      console.error('[RevenueCatContext] presentPaywall failed, opening fallback modal:', err);
      setIsPaywallOpen(true);
    }
  }, [user?.email]);

  // Open Customer Center / Subscription Management
  const handleOpenCustomerCenter = useCallback(() => {
    const opened = openRCManagementUrl(customerInfo);
    if (!opened) {
      // If no direct URL, open the internal Customer Center modal
      setIsCustomerCenterOpen(true);
    }
  }, [customerInfo]);

  const activeSubscriptions = useMemo(() => {
    if (!customerInfo?.activeSubscriptions) return [];
    return Array.from(customerInfo.activeSubscriptions);
  }, [customerInfo]);

  const managementUrl = customerInfo?.managementURL || null;

  const value = useMemo(() => ({
    isInitialized,
    isLoading,
    customerInfo,
    isPro,
    offerings,
    currentOffering: offerings?.current || null,
    activeSubscriptions,
    managementUrl,
    error,
    refreshCustomerInfo,
    purchasePackage: handlePurchase,
    presentPaywall: handlePresentPaywall,
    openCustomerCenter: handleOpenCustomerCenter,
    isPaywallOpen,
    setIsPaywallOpen,
    isCustomerCenterOpen,
    setIsCustomerCenterOpen,
    config: REVENUECAT_CONFIG
  }), [
    isInitialized,
    isLoading,
    customerInfo,
    isPro,
    offerings,
    activeSubscriptions,
    managementUrl,
    error,
    refreshCustomerInfo,
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
