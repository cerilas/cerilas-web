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
  API_KEY: 'pdl_WBnMsdzJRdmzoYfKutAecxwmRtfn',
  APP_ID: 'app174fb8403c',
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
      fallbackPrice: '$9.99 / mo'
    },
    UNLIMITED_MONTHLY: {
      id: 'pri_01m41vmta5xebbmwt1k46xbfsf',
      name: 'Unlimited - Monthly',
      type: 'subscription',
      interval: 'month',
      badge: 'Power User',
      fallbackPrice: '$14.99 / mo'
    },
    LIFETIME: {
      id: 'lifetime',
      name: 'Lifetime Pro',
      type: 'one_time',
      badge: 'Best Value',
      fallbackPrice: '$199.00 once'
    },
    YEARLY: {
      id: 'yearly',
      name: 'Pro Yearly',
      type: 'subscription',
      interval: 'year',
      badge: '2 Months Free',
      fallbackPrice: '$99.90 / yr'
    },
    PRO_YEARLY: {
      id: 'pro_yearly',
      name: 'Pro Yearly',
      type: 'subscription',
      interval: 'year',
      badge: '2 Months Free',
      fallbackPrice: '$99.90 / yr'
    },
    UNLIMITED_YEARLY: {
      id: 'unlimited_yearly',
      name: 'Unlimited Yearly',
      type: 'subscription',
      interval: 'year',
      badge: '2 Months Free',
      fallbackPrice: '$149.90 / yr'
    },
    MONTHLY: {
      id: 'monthly',
      name: 'Pro Monthly',
      type: 'subscription',
      interval: 'month',
      fallbackPrice: '$9.99 / mo'
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
 * Verify whether the user has active Unlimited plan
 * @param {import('@revenuecat/purchases-js').CustomerInfo} [customerInfo]
 * @returns {boolean}
 */
export function checkUnlimitedEntitlement(customerInfo) {
  if (!customerInfo) return false;

  // Check active entitlements
  const activeMap = customerInfo.entitlements?.active;
  if (activeMap && (activeMap['cerilas_tools_unlimited'] || activeMap['unlimited'])) {
    return true;
  }

  // Fallback inspect all entitlements
  const allMap = customerInfo.entitlements?.all;
  if (allMap && (allMap['cerilas_tools_unlimited']?.isActive || allMap['unlimited']?.isActive)) {
    return true;
  }

  // Check active subscriptions
  const subs = Array.from(customerInfo.activeSubscriptions || []);
  for (const s of subs) {
    const lower = String(s).toLowerCase();
    if (lower.includes('unlimited') || s === REVENUECAT_CONFIG.PRODUCTS?.UNLIMITED_MONTHLY?.id) {
      return true;
    }
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
 * Enriches the RevenueCat offering with the Unlimited package if not already configured in dashboard
 * @param {import('@revenuecat/purchases-js').Offering} offering
 * @returns {import('@revenuecat/purchases-js').Offering}
 */
export function enrichOfferingWithUnlimited(offering) {
  if (!offering || !offering.availablePackages || offering.availablePackages.length === 0) return offering;

  const targetProductId = REVENUECAT_CONFIG.PRODUCTS?.UNLIMITED_MONTHLY?.id || 'pri_01m41vmta5xebbmwt1k46xbfsf';

  const hasUnlimited = offering.availablePackages.some(pkg => {
    const id = String(pkg.product?.identifier || pkg.identifier || '').toLowerCase();
    return id.includes('unlimited') || id === targetProductId;
  });

  if (!hasUnlimited) {
    const basePkg = offering.availablePackages[0];
    try {
      const unlimitedPkg = JSON.parse(JSON.stringify(basePkg));
      unlimitedPkg.identifier = 'unlimited_monthly';
      unlimitedPkg.packageType = '$rc_monthly';

      for (const key of ['rcBillingProduct', 'webBillingProduct', 'product']) {
        if (unlimitedPkg[key]) {
          unlimitedPkg[key].identifier = targetProductId;
          unlimitedPkg[key].displayName = 'Unlimited';
          unlimitedPkg[key].title = 'Unlimited';
          unlimitedPkg[key].currentPrice = { amount: 1499, amountMicros: 14990000, currency: 'USD' };
          unlimitedPkg[key].price = { amount: 14.99, amountMicros: 14990000, currency: 'USD', formattedPrice: '$14.99' };
          if (unlimitedPkg[key].defaultPurchaseOption) {
            unlimitedPkg[key].defaultPurchaseOption.priceId = 'prcf53768c3fa8e44ea9ba8';
            if (unlimitedPkg[key].defaultPurchaseOption.base) {
              unlimitedPkg[key].defaultPurchaseOption.base.price = { amount: 1499, amountMicros: 14990000, currency: 'USD', formattedPrice: '$14.99' };
              unlimitedPkg[key].defaultPurchaseOption.base.pricePerMonth = { amount: 1499, amountMicros: 14990000, currency: 'USD', formattedPrice: '$14.99' };
            }
          }
          if (unlimitedPkg[key].defaultSubscriptionOption) {
            unlimitedPkg[key].defaultSubscriptionOption.priceId = 'prcf53768c3fa8e44ea9ba8';
            if (unlimitedPkg[key].defaultSubscriptionOption.base) {
              unlimitedPkg[key].defaultSubscriptionOption.base.price = { amount: 1499, amountMicros: 14990000, currency: 'USD', formattedPrice: '$14.99' };
            }
          }
          if (unlimitedPkg[key].subscriptionOptions?.base_option) {
            unlimitedPkg[key].subscriptionOptions.base_option.priceId = 'prcf53768c3fa8e44ea9ba8';
            if (unlimitedPkg[key].subscriptionOptions.base_option.base) {
              unlimitedPkg[key].subscriptionOptions.base_option.base.price = { amount: 1499, amountMicros: 14990000, currency: 'USD', formattedPrice: '$14.99' };
            }
          }
        }
      }

      offering.availablePackages.push(unlimitedPkg);
      if (offering.packagesById) {
        offering.packagesById['unlimited_monthly'] = unlimitedPkg;
      }
    } catch (e) {
      console.warn('[RevenueCat] Failed to enrich offering with Unlimited:', e);
    }
  }

  return offering;
}

/**
 * Fetch offerings configured in the RevenueCat dashboard
 * @returns {Promise<import('@revenuecat/purchases-js').Offerings>}
 */
export async function getOfferings() {
  const purchases = getPurchases() || initRevenueCat();
  const offerings = await purchases.getOfferings();
  if (offerings?.current) {
    enrichOfferingWithUnlimited(offerings.current);
  }
  return offerings;
}

/**
 * Format a numeric amount in major currency units to match RevenueCat/Paddle summary display
 */
function formatPaddleCurrency(amount, currencyCode = 'USD') {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '';
  try {
    const opts = {
      style: 'currency',
      currency: currencyCode || 'USD',
      currencyDisplay: 'narrowSymbol'
    };
    if (num === 0) {
      opts.maximumFractionDigits = 0;
    }
    return new Intl.NumberFormat('en-US', opts).format(num);
  } catch (_) {
    return `$${num.toFixed(2)}`;
  }
}

let lastPaddleEventData = null;

/**
 * Synchronizes the left-side RevenueCat Paddle order summary (.rcb-paddle-summary)
 * with live Paddle checkout event data, including applied promo/discount codes.
 */
function syncPaddleOrderSummaryDom(eventData) {
  if (typeof document === 'undefined' || !eventData || !eventData.totals) return;
  lastPaddleEventData = eventData;

  const applyDomUpdates = () => {
    const summaryEl = document.querySelector('.rcb-paddle-summary');
    if (!summaryEl) return;

    const currency = eventData.currency_code || 'USD';
    const subtotal = Number(eventData.totals.subtotal ?? 0);
    const discount = Number(eventData.totals.discount ?? 0);
    const total = Number(eventData.totals.total ?? subtotal);
    const discountCode = eventData.discount?.code || '';
    const hasDiscount = discount > 0;

    // 1. Update big top header amount (.rcb-paddle-summary-amount)
    const topAmountEl = summaryEl.querySelector('.rcb-paddle-summary-amount');
    if (topAmountEl) {
      topAmountEl.textContent = formatPaddleCurrency(total, currency);
    }

    // 2. Update product price in the first card (.rcb-paddle-summary-product-price)
    // RevenueCat uses recurringTotalAmount ?? totalAmount, which stays at the full price
    // when a one-time promo code is applied. Show discounted price + strikethrough original.
    const productPriceContainer = summaryEl.querySelector('.rcb-paddle-summary-product-price');
    if (productPriceContainer) {
      const priceSpan = productPriceContainer.querySelector('span:first-child');
      if (priceSpan) {
        if (hasDiscount && total < subtotal) {
          priceSpan.innerHTML = `<span style="text-decoration:line-through;opacity:0.55;font-weight:400;font-size:0.95rem;margin-right:6px;">${formatPaddleCurrency(subtotal, currency)}</span><span>${formatPaddleCurrency(total, currency)}</span>`;
        } else {
          priceSpan.textContent = formatPaddleCurrency(subtotal || total, currency);
        }
      }
    }

    // 3. Update breakdown card (Subtotal, Discount row, Total due today)
    const cards = summaryEl.querySelectorAll('.rcb-paddle-summary-card');
    const breakdownCard = cards.length > 1 ? cards[1] : null;
    if (breakdownCard) {
      const divider = breakdownCard.querySelector('.rcb-paddle-summary-divider');
      let discountRow = breakdownCard.querySelector('#rcb-custom-discount-row');

      if (hasDiscount && divider) {
        if (!discountRow) {
          discountRow = document.createElement('div');
          discountRow.id = 'rcb-custom-discount-row';
          discountRow.className = divider.previousElementSibling?.className || 'rcb-paddle-summary-row';
          discountRow.style.display = 'flex';
          discountRow.style.justifyContent = 'space-between';
          discountRow.style.alignItems = 'center';
          divider.parentNode.insertBefore(discountRow, divider);
        }
        const labelText = discountCode ? `Discount (${discountCode})` : 'Discount';
        discountRow.innerHTML = `
          <span class="rcb-paddle-summary-muted" style="color:#10b981;font-weight:500;">${labelText}</span>
          <span style="color:#10b981;font-weight:600;">-${formatPaddleCurrency(discount, currency)}</span>
        `;
      } else if (discountRow) {
        discountRow.remove();
      }

      // Ensure "Total due today" strong row reflects the discounted total
      const strongRow = breakdownCard.querySelector('.rcb-paddle-summary-row-strong');
      if (strongRow) {
        const strongValueSpan = strongRow.querySelector('span:last-child');
        if (strongValueSpan) {
          strongValueSpan.textContent = formatPaddleCurrency(total, currency);
        }
      }
    }
  };

  applyDomUpdates();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(applyDomUpdates);
  }
  setTimeout(applyDomUpdates, 60);
  setTimeout(applyDomUpdates, 200);
}

/**
 * Installs a runtime bridge on Paddle.js (window.PaddleBillingV1 / window.Paddle)
 * because @revenuecat/purchases-js only listens to `checkout.loaded` and `checkout.updated`
 * and ignores `checkout.discount.applied` / `checkout.discount.removed`.
 */
function ensurePaddleDiscountSyncBridge() {
  if (typeof window === 'undefined') return null;

  const patchPaddleObject = (paddleObj) => {
    if (!paddleObj || paddleObj.__cerilasDiscountBridgeInstalled) return;
    paddleObj.__cerilasDiscountBridgeInstalled = true;

    const wrapEventCallback = (originalCb) => {
      if (typeof originalCb !== 'function' || originalCb.__cerilasWrapped) return originalCb;
      const wrapped = async function (event) {
        const eventName = event?.name;
        const eventData = event?.data;

        try {
          if (
            eventName === 'checkout.discount.applied' ||
            eventName === 'checkout.discount.removed' ||
            eventName === 'checkout.items.updated' ||
            eventName === 'checkout.customer.updated'
          ) {
            await originalCb.call(this, {
              ...event,
              name: 'checkout.updated'
            });
          } else {
            await originalCb.call(this, event);
          }
        } finally {
          if (eventData && eventData.totals) {
            syncPaddleOrderSummaryDom(eventData);
          }
        }
      };
      wrapped.__cerilasWrapped = true;
      return wrapped;
    };

    if (typeof paddleObj.Update === 'function') {
      const origUpdate = paddleObj.Update.bind(paddleObj);
      paddleObj.Update = function (opts = {}) {
        if (opts && typeof opts.eventCallback === 'function') {
          opts = { ...opts, eventCallback: wrapEventCallback(opts.eventCallback) };
        }
        return origUpdate(opts);
      };
    }

    if (typeof paddleObj.Initialize === 'function') {
      const origInit = paddleObj.Initialize.bind(paddleObj);
      paddleObj.Initialize = function (opts = {}) {
        if (opts && typeof opts.eventCallback === 'function') {
          opts = { ...opts, eventCallback: wrapEventCallback(opts.eventCallback) };
        }
        return origInit(opts);
      };
    }

    if (paddleObj.Checkout && typeof paddleObj.Checkout.open === 'function') {
      const origOpen = paddleObj.Checkout.open.bind(paddleObj.Checkout);
      paddleObj.Checkout.open = function (openOpts = {}) {
        if (openOpts && openOpts.settings) {
          openOpts = {
            ...openOpts,
            settings: {
              ...openOpts.settings,
              showAddDiscounts: true,
              allowDiscountRemoval: true
            }
          };
        }
        return origOpen(openOpts);
      };
    }
  };

  const checkAndPatch = () => {
    if (window.PaddleBillingV1) patchPaddleObject(window.PaddleBillingV1);
    if (window.Paddle) patchPaddleObject(window.Paddle);
    if (lastPaddleEventData && document.querySelector('.rcb-paddle-summary')) {
      syncPaddleOrderSummaryDom(lastPaddleEventData);
    }
  };

  checkAndPatch();
  const intervalId = setInterval(checkAndPatch, 150);
  return () => {
    clearInterval(intervalId);
    lastPaddleEventData = null;
  };
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
  const stopBridge = ensurePaddleDiscountSyncBridge();

  let urlDiscountCode;
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      urlDiscountCode = params.get('discount_code') || params.get('promo') || params.get('coupon') || undefined;
    } catch (_) {}
  }

  try {
    const result = await purchases.purchase({
      rcPackage,
      selectedLocale: 'en',
      defaultLocale: 'en',
      customerEmail: customerEmail || undefined,
      htmlTarget: htmlTarget || undefined,
      ...(urlDiscountCode ? { discountCode: urlDiscountCode } : {})
    });

    const isPro = checkProEntitlement(result.customerInfo);
    return {
      customerInfo: result.customerInfo,
      isPro,
      result
    };
  } catch (err) {
    const isCancelled = 
      err?.errorCode === ErrorCode.UserCancelledError ||
      err?.errorCode === 1 ||
      err?.isCancelled ||
      err?.message?.toLowerCase().includes('cancel');

    if (isCancelled) {
      const userCancelErr = new Error('Purchase was cancelled.');
      userCancelErr.isCancelled = true;
      throw userCancelErr;
    }

    const rawMsg = (err?.message || '').toLowerCase();
    const isAlreadyPurchased = 
      err?.errorCode === ErrorCode?.ProductAlreadyPurchasedError ||
      err?.errorCode === 6 ||
      rawMsg.includes('already purchased') ||
      rawMsg.includes('already has an active subscription') ||
      // Paddle/RevenueCat may return localized errors ("zaten" = "already")
      rawMsg.includes('zaten');

    if (isAlreadyPurchased) {
      const alreadyPurchasedErr = new Error(err?.message || 'Product already purchased');
      alreadyPurchasedErr.isAlreadyPurchased = true;
      alreadyPurchasedErr.errorCode = 6;
      throw alreadyPurchasedErr;
    }

    console.error('[RevenueCat] Purchase failed:', err);
    throw err;
  } finally {
    if (stopBridge) stopBridge();
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
      selectedLocale: 'en',
      defaultLocale: 'en',
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
 * @param {'overview'|'cancel'} [action] Target action in Paddle portal
 * @returns {string|null} URL to manage/cancel/update subscription
 */
export function getCustomerManagementUrl(customerInfo, action = 'overview') {
  let url = customerInfo?.managementURL || null;
  if (url && action === 'cancel' && url.includes('action=overview')) {
    url = url.replace('action=overview', 'action=cancel');
  }
  return url;
}

/**
 * Open Customer Center management URL in a new tab or trigger in-app modal
 * @param {import('@revenuecat/purchases-js').CustomerInfo} customerInfo
 * @param {'overview'|'cancel'} [action] Target action ('overview' or 'cancel')
 * @returns {boolean} True if URL was opened
 */
export function openCustomerCenter(customerInfo, action = 'overview') {
  const url = getCustomerManagementUrl(customerInfo, action);
  if (url && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cerilas:open-customer-center', { detail: { action } }));
  }
  return false;
}
