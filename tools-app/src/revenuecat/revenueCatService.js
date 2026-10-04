/**
 * Cerilas Tools - RevenueCat Web SDK Service
 * Handles SDK initialization, entitlement verification, customer info retrieval,
 * offerings, paywalls, and self-service Customer Center subscription management.
 */

import { Purchases, ErrorCode } from '@revenuecat/purchases-js';

// ============================================================================
// Configuration Constants
// ============================================================================
export const REVENUECAT_CONFIG = {
  API_KEY: 'test_QcfBRgbKRBopjvuWkSgRumPyFWK',
  ENTITLEMENT_ID: 'cerilas_tools_pro',
  ANONYMOUS_USER_STORAGE_KEY: 'cerilas_rc_anon_user_id',
  
  // Configured products
  PRODUCTS: {
    PRO_MONTHLY: {
      id: 'pri_01m41vjy149vqr2av5b43x4yf9',
      name: 'PRO - Paid Monthly',
      type: 'subscription',
      interval: 'month',
      badge: 'Popular',
      fallbackPrice: '$4.99 / mo'
    },
    UNLIMITED_MONTHLY: {
      id: 'pri_01m41vmta5xebbmwt1k46xbfsf',
      name: 'Unlimited - Monthly',
      type: 'subscription',
      interval: 'month',
      badge: 'Power User',
      fallbackPrice: '$9.99 / mo'
    },
    LIFETIME: {
      id: 'lifetime',
      name: 'Lifetime Pro',
      type: 'one_time',
      badge: 'Best Value',
      fallbackPrice: '$149.00 once'
    },
    YEARLY: {
      id: 'yearly',
      name: 'Pro Yearly',
      type: 'subscription',
      interval: 'year',
      badge: 'Save 20%',
      fallbackPrice: '$49.90 / yr'
    },
    MONTHLY: {
      id: 'monthly',
      name: 'Pro Monthly',
      type: 'subscription',
      interval: 'month',
      fallbackPrice: '$4.99 / mo'
    }
  }
};

/**
 * Get or create a persistent anonymous user ID for web visitors
 */
export function getOrCreateAnonymousAppUserId() {
  if (typeof window === 'undefined') {
    return 'anon_server_user';
  }

  try {
    let anonId = localStorage.getItem(REVENUECAT_CONFIG.ANONYMOUS_USER_STORAGE_KEY);
    if (!anonId) {
      if (typeof Purchases.generateRevenueCatAnonymousAppUserId === 'function') {
        anonId = Purchases.generateRevenueCatAnonymousAppUserId();
      } else {
        anonId = `$RCAnonymousID:${Math.random().toString(36).substring(2)}${Date.now()}`;
      }
      localStorage.setItem(REVENUECAT_CONFIG.ANONYMOUS_USER_STORAGE_KEY, anonId);
    }
    return anonId;
  } catch (e) {
    return `$RCAnonymousID:${Date.now()}`;
  }
}

/**
 * Initialize or re-configure RevenueCat SDK
 * @param {string|null} userId Optional authenticated user ID
 * @param {string|null} userEmail Optional user email for receipt delivery
 * @returns {Purchases} Shared Purchases instance
 */
export function initRevenueCat(userId = null, userEmail = null) {
  if (typeof window === 'undefined') return null;

  const targetUserId = userId || getOrCreateAnonymousAppUserId();

  if (Purchases.isConfigured()) {
    const instance = Purchases.getSharedInstance();
    // If the user identity changed, update it
    if (userId && instance.getAppUserId() !== userId) {
      instance.changeUser(userId).catch(err => {
        console.warn('[RevenueCat] Error changing user:', err);
      });
    }
    if (userEmail) {
      instance.setAttributes({ $email: userEmail }).catch(() => {});
    }
    return instance;
  }

  try {
    const instance = Purchases.configure({
      apiKey: REVENUECAT_CONFIG.API_KEY,
      appUserId: targetUserId
    });

    if (userEmail) {
      instance.setAttributes({ $email: userEmail }).catch(() => {});
    }

    return instance;
  } catch (err) {
    console.error('[RevenueCat] Initialization error:', err);
    throw err;
  }
}

/**
 * Get shared Purchases instance safely
 */
export function getPurchases() {
  if (typeof window !== 'undefined' && Purchases.isConfigured()) {
    return Purchases.getSharedInstance();
  }
  return null;
}

/**
 * Fetch latest CustomerInfo from RevenueCat
 * @returns {Promise<import('@revenuecat/purchases-js').CustomerInfo>}
 */
export async function getCustomerInfo() {
  const purchases = getPurchases() || initRevenueCat();
  return await purchases.getCustomerInfo();
}

/**
 * Verify whether the user has active 'cerilas_tools_pro' entitlement
 * @param {import('@revenuecat/purchases-js').CustomerInfo} [customerInfo] Optional customerInfo to inspect
 * @returns {boolean}
 */
export function checkProEntitlement(customerInfo) {
  if (!customerInfo || !customerInfo.entitlements) return false;

  // Direct active map check
  const activeMap = customerInfo.entitlements.active;
  if (activeMap && activeMap[REVENUECAT_CONFIG.ENTITLEMENT_ID]) {
    return true;
  }

  // Fallback inspect all entitlements
  const allMap = customerInfo.entitlements.all;
  if (allMap && allMap[REVENUECAT_CONFIG.ENTITLEMENT_ID]?.isActive) {
    return true;
  }

  return false;
}

/**
 * Convenience method to check pro entitlement asynchronously directly from SDK
 * @returns {Promise<boolean>}
 */
export async function isUserPro() {
  const purchases = getPurchases() || initRevenueCat();
  try {
    return await purchases.isEntitledTo(REVENUECAT_CONFIG.ENTITLEMENT_ID);
  } catch (err) {
    console.warn('[RevenueCat] isUserPro check failed, falling back to customerInfo:', err);
    const info = await purchases.getCustomerInfo();
    return checkProEntitlement(info);
  }
}

/**
 * Fetch offerings configured in the RevenueCat dashboard
 * @returns {Promise<import('@revenuecat/purchases-js').Offerings>}
 */
export async function getOfferings() {
  const purchases = getPurchases() || initRevenueCat();
  return await purchases.getOfferings();
}

/**
 * Purchase a specific package using RevenueCat Web Billing
 * @param {import('@revenuecat/purchases-js').Package} rcPackage Package object from offerings
 * @param {string} [customerEmail] Optional email address
 * @param {HTMLElement} [htmlTarget] Optional mount target for checkout modal
 * @returns {Promise<{customerInfo: any, isPro: boolean}>}
 */
export async function purchasePackage(rcPackage, customerEmail = null, htmlTarget = null) {
  const purchases = getPurchases() || initRevenueCat();

  try {
    const result = await purchases.purchase({
      rcPackage,
      customerEmail: customerEmail || undefined,
      htmlTarget: htmlTarget || undefined
    });

    const isPro = checkProEntitlement(result.customerInfo);
    return {
      customerInfo: result.customerInfo,
      isPro,
      result
    };
  } catch (err) {
    if (err?.errorCode === ErrorCode.UserCancelledError) {
      const userCancelErr = new Error('Purchase was cancelled.');
      userCancelErr.isCancelled = true;
      throw userCancelErr;
    }
    console.error('[RevenueCat] Purchase failed:', err);
    throw err;
  }
}

/**
 * Present a RevenueCat Paywall using modern SDK method
 * @param {Object} options Paywall options
 * @param {HTMLElement} [options.htmlTarget] Mount element (if null, opens full-screen overlay)
 * @param {import('@revenuecat/purchases-js').Offering} [options.offering] Custom offering to present
 * @param {string} [options.customerEmail] Pre-filled customer email
 * @param {Function} [options.onSuccess] Callback on successful purchase
 * @param {Function} [options.onClose] Callback when paywall is dismissed
 * @returns {Promise<import('@revenuecat/purchases-js').PaywallPurchaseResult>}
 */
/**
 * Safely removes any orphaned RevenueCat native paywall DOM containers
 */
export function cleanupOrphanedPaywallElements() {
  if (typeof document === 'undefined') return;
  const stale = document.getElementById('rcb-ui-pw-root');
  if (stale) {
    try {
      stale.remove();
    } catch (_) {}
  }
}

/**
 * Present a RevenueCat Paywall using modern SDK method or fall back to Cerilas UI paywall
 * @param {Object} options Paywall options
 * @param {HTMLElement} [options.htmlTarget] Mount element
 * @param {import('@revenuecat/purchases-js').Offering} [options.offering] Custom offering to present
 * @param {string} [options.customerEmail] Pre-filled customer email
 * @param {Function} [options.onSuccess] Callback on successful purchase
 * @param {Function} [options.onClose] Callback when paywall is dismissed
 */
export async function presentPaywall(options = {}) {
  cleanupOrphanedPaywallElements();
  const purchases = getPurchases() || initRevenueCat();

  try {
    const offerings = await purchases.getOfferings().catch(() => null);
    const current = options.offering || offerings?.current;

    // Check if the offering in RevenueCat dashboard actually has paywall components configured.
    // If not, calling purchases.presentPaywall() will inject a full-screen #rcb-ui-pw-root div
    // and throw "This offering doesn't have a paywall attached", blocking all mouse clicks.
    if (!current?.paywallComponents && !current?.uiConfig) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cerilas:open-paywall', { detail: options }));
      }
      return { status: 'in_app_paywall_opened' };
    }

    const paywallParams = {
      htmlTarget: options.htmlTarget || undefined,
      offering: options.offering || undefined,
      customerEmail: options.customerEmail || undefined,
      onBack: (closePaywall) => {
        cleanupOrphanedPaywallElements();
        if (options.onClose) options.onClose();
        closePaywall();
      },
      listener: {
        onPurchaseCompleted: (customerInfo) => {
          cleanupOrphanedPaywallElements();
          if (options.onSuccess) options.onSuccess(customerInfo);
        },
        onPurchaseError: (error) => {
          console.error('[RevenueCat Paywall] Purchase error:', error);
        }
      }
    };

    return await purchases.presentPaywall(paywallParams);
  } catch (err) {
    cleanupOrphanedPaywallElements();
    console.warn('[RevenueCat] Native presentPaywall unavailable or thrown, opening in-app paywall modal:', err?.message || err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cerilas:open-paywall', { detail: options }));
    }
    return { status: 'in_app_paywall_opened' };
  }
}

/**
 * Get the Customer Center self-service management URL for active subscribers
 * @param {import('@revenuecat/purchases-js').CustomerInfo} [customerInfo]
 * @returns {string|null} URL to manage/cancel/update subscription
 */
export function getCustomerManagementUrl(customerInfo) {
  return customerInfo?.managementURL || null;
}

/**
 * Open Customer Center management URL in a new tab or trigger in-app modal
 * @param {import('@revenuecat/purchases-js').CustomerInfo} customerInfo
 * @returns {boolean} True if URL was opened
 */
export function openCustomerCenter(customerInfo) {
  const url = getCustomerManagementUrl(customerInfo);
  if (url && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cerilas:open-customer-center'));
  }
  return false;
}
