import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CreditCard, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useRevenueCat } from '../context/RevenueCatContext';
import './RevenueCatPaywallModal.css';

export default function RevenueCatCustomerCenterModal({ isOpen, onClose }) {
  const { 
    customerInfo, 
    isPro, 
    activeSubscriptions, 
    managementUrl, 
    refreshCustomerInfo,
    setIsPaywallOpen
  } = useRevenueCat();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);
    try {
      await refreshCustomerInfo();
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    } catch (err) {
      console.warn('Customer center refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const proEntitlement = customerInfo?.entitlements?.active?.['cerilas_tools_pro'] 
    || customerInfo?.entitlements?.all?.['cerilas_tools_pro'];

  const expirationDate = proEntitlement?.expirationDate 
    ? new Date(proEntitlement.expirationDate).toLocaleDateString(undefined, { dateStyle: 'long' })
    : null;

  return createPortal(
    <div 
      className="rc-paywall-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rc-customer-center-title"
    >
      <div 
        className="rc-paywall-card"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="rc-paywall-header" style={{ padding: '1.75rem 1.75rem 1rem 1.75rem' }}>
          <button 
            type="button" 
            className="rc-paywall-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>

          <div className="rc-paywall-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
            <CreditCard size={14} />
            <span>Customer Center &bull; Web Billing</span>
          </div>

          <h2 id="rc-customer-center-title" className="rc-paywall-title" style={{ fontSize: '1.45rem' }}>
            Subscription &amp; Account Center
          </h2>
          <p className="rc-paywall-subtitle">
            Manage your active Cerilas Pro entitlements, billing portal, and renewal preferences.
          </p>
        </div>

        {/* Body */}
        <div className="rc-paywall-body" style={{ padding: '1.25rem 1.75rem 1.75rem 1.75rem', gap: '1.15rem' }}>
          {/* Status Box */}
          <div style={{ padding: '1.25rem', borderRadius: 16, background: isPro ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)', border: `1.5px solid ${isPro ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255, 255, 255, 0.08)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isPro ? <CheckCircle2 size={20} color="#10b981" /> : <Lock size={18} color="#94a3b8" />}
                <strong style={{ fontSize: '1.05rem', color: isPro ? '#6ee7b7' : '#f8fafc' }}>
                  {isPro ? 'Cerilas Tools PRO Active' : 'Free Tier'}
                </strong>
              </div>
              <span className="rc-product-pill-badge" style={{ position: 'static', background: isPro ? '#10b981' : '#64748b' }}>
                {isPro ? 'Active' : 'Unsubscribed'}
              </span>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>
                <span>Entitlement: </span>
                <code style={{ color: '#38bdf8' }}>cerilas_tools_pro</code>
              </div>
              {expirationDate && (
                <div>
                  <span>Next Renewal / Expiration: </span>
                  <strong style={{ color: '#f8fafc' }}>{expirationDate}</strong>
                </div>
              )}
              {activeSubscriptions.length > 0 && (
                <div>
                  <span>Active Products: </span>
                  <span style={{ color: '#f8fafc' }}>{activeSubscriptions.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Self-Service Portal Action */}
          {managementUrl ? (
            <div style={{ padding: '1.15rem', borderRadius: 14, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#93c5fd', marginBottom: 2 }}>
                  RevenueCat Billing Portal
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#bfdbfe' }}>
                  Update payment method, download invoices, or modify your subscription tier.
                </span>
              </div>
              <a 
                href={managementUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rc-subscribe-btn"
                style={{ width: 'auto', padding: '0.55rem 1rem', fontSize: '0.84rem', textDecoration: 'none' }}
              >
                <span>Open Portal</span>
                <ExternalLink size={13} />
              </a>
            </div>
          ) : (
            !isPro && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  Upgrade now to unlock all 31+ privacy-first tools with unlimited priority processing.
                </p>
                <button
                  type="button"
                  className="rc-subscribe-btn"
                  onClick={() => {
                    onClose();
                    setIsPaywallOpen(true);
                  }}
                  style={{ margin: '0 auto' }}
                >
                  <span>View Pro Plans &amp; Subscribe</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )
          )}

          {/* Refresh / Restore Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Purchased on another device or recently subscribed?
            </span>
            <button
              type="button"
              className="growth-secondary-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : refreshSuccess ? 'Updated!' : 'Sync Status'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
