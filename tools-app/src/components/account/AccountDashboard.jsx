import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Package, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Trash2, 
  ArrowLeft, 
  Send, 
  Loader2, 
  Sparkles, 
  Zap, 
  Check, 
  Phone, 
  Mail, 
  Building2, 
  Download, 
  ExternalLink,
  Crown,
  Camera,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRevenueCat } from '../../context/RevenueCatContext';
import { useTranslation } from '../../i18n';
import './AccountDashboard.css';

const PRESET_AVATARS = [
  { id: '1', name: 'Cyber Bot', role: 'AI Robot', url: '/avatars/avatar-1.svg' },
  { id: '2', name: 'Alex', role: 'Developer', url: '/avatars/avatar-2.svg' },
  { id: '3', name: 'Sophia', role: 'Creative', url: '/avatars/avatar-3.svg' },
  { id: '4', name: 'Felix', role: 'Minimalist', url: '/avatars/avatar-4.svg' },
  { id: '5', name: 'Leo', role: 'Explorer', url: '/avatars/avatar-5.svg' },
  { id: '6', name: 'Quantum', role: 'AI Neural', url: '/avatars/avatar-6.svg' },
  { id: '7', name: 'Chloe', role: 'Designer', url: '/avatars/avatar-7.svg' },
  { id: '8', name: 'Maya', role: 'Engineer', url: '/avatars/avatar-8.svg' },
  { id: '9', name: 'Zack', role: 'Hacker', url: '/avatars/avatar-9.svg' },
  { id: '10', name: 'Nexus', role: 'Cyberpunk', url: '/avatars/avatar-10.svg' }
];

export default function AccountDashboard({ initialTab = 'profile', onBack }) {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    openAuthModal, 
    updateProfile, 
    sendPhoneOtp, 
    verifyPhoneOtp, 
    updateBilling, 
    upgradePlan, 
    getInvoices, 
    initiateGoogleAuth,
    unlinkGoogleAccount,
    logout 
  } = useAuth();
  const { 
    isPro: isRevenueCatPro, 
    customerInfo: rcCustomerInfo,
    openCustomerCenter,
    presentPaywall 
  } = useRevenueCat();
  const { language } = useTranslation();
  const isTr = language === 'tr';

  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'package' | 'billing'

  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Google Connection State
  const [googleActionLoading, setGoogleActionLoading] = useState(false);
  const [googleSuccessMsg, setGoogleSuccessMsg] = useState('');
  const [googleErrorMsg, setGoogleErrorMsg] = useState('');

  // SMS OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpMsg, setOtpMsg] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isChangingPhone, setIsChangingPhone] = useState(false);

  // Billing State
  const [billingType, setBillingType] = useState('individual'); // 'individual' | 'company'
  const [billingName, setBillingName] = useState('');
  const [billingTaxId, setBillingTaxId] = useState('');
  const [billingTaxOffice, setBillingTaxOffice] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingCountry, setBillingCountry] = useState('Türkiye');
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingSuccessMsg, setBillingSuccessMsg] = useState('');
  const [billingErrorMsg, setBillingErrorMsg] = useState('');

  // Plan / Invoices State
  const [invoices, setInvoices] = useState([]);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [planSuccessMsg, setPlanSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  // Sync state from user object
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setAvatarUrl(user.avatar_url || '');
      setPhone(user.phone || '');
      setBillingType(user.billing_type || 'individual');
      setBillingName(user.billing_name || (user.name || ''));
      setBillingTaxId(user.billing_tax_id || '');
      setBillingTaxOffice(user.billing_tax_office || '');
      setBillingAddress(user.billing_address || '');
      setBillingCity(user.billing_city || '');
      setBillingCountry(user.billing_country || 'Türkiye');
    }
  }, [user]);

  // Read URL query params if hash has tab parameter
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const tabMatch = hash.match(/tab=([a-zA-Z0-9_-]+)/);
      if (tabMatch && ['profile', 'package', 'plan', 'billing'].includes(tabMatch[1])) {
        setActiveTab(tabMatch[1] === 'plan' ? 'package' : tabMatch[1]);
      } else if (hash.includes('profile')) {
        setActiveTab('profile');
      } else if (hash.includes('package') || hash.includes('plan')) {
        setActiveTab('package');
      } else if (hash.includes('billing')) {
        setActiveTab('billing');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch Invoices when Billing tab is opened
  useEffect(() => {
    if (activeTab === 'billing' || activeTab === 'package') {
      getInvoices().then(setInvoices).catch(() => {});
    }
  }, [activeTab, getInvoices]);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = `#/account?tab=${tab}`;
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setBillingSuccessMsg('');
    setBillingErrorMsg('');
    setPlanSuccessMsg('');
  };

  // Image upload handling
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileErrorMsg(isTr ? 'Görsel boyutu 2 MB\'tan küçük olmalıdır.' : 'Image size must be under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setAvatarUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        phone: phone
      });
      setProfileSuccessMsg(isTr ? 'Profil bilgileriniz başarıyla güncellendi.' : 'Profile updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      setProfileErrorMsg(err.message || (isTr ? 'Profil güncellenemedi.' : 'Failed to update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  // Google Account Linking
  const handleLinkGoogle = async () => {
    setGoogleActionLoading(true);
    setGoogleSuccessMsg('');
    setGoogleErrorMsg('');
    try {
      await initiateGoogleAuth({ mode: 'link' });
      setGoogleSuccessMsg(isTr ? 'Google hesabınız başarıyla bağlandı!' : 'Google account linked successfully!');
      setTimeout(() => setGoogleSuccessMsg(''), 4500);
    } catch (err) {
      setGoogleErrorMsg(err.message || (isTr ? 'Google hesabı bağlanamadı.' : 'Failed to link Google account.'));
    } finally {
      setGoogleActionLoading(false);
    }
  };

  // Google Account Disconnecting
  const handleUnlinkGoogle = async () => {
    if (!window.confirm(isTr ? 'Google bağlantısını kaldırmak istediğinize emin misiniz?' : 'Are you sure you want to disconnect Google?')) {
      return;
    }
    setGoogleActionLoading(true);
    setGoogleSuccessMsg('');
    setGoogleErrorMsg('');
    try {
      await unlinkGoogleAccount();
      setGoogleSuccessMsg(isTr ? 'Google hesabı bağlantısı başarıyla kaldırıldı.' : 'Google account disconnected successfully.');
      setTimeout(() => setGoogleSuccessMsg(''), 4500);
    } catch (err) {
      setGoogleErrorMsg(err.message || (isTr ? 'Google bağlantısı kaldırılamadı.' : 'Failed to disconnect Google.'));
    } finally {
      setGoogleActionLoading(false);
    }
  };

  // SMS OTP Send
  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setOtpError('Please enter your phone number.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpMsg('');

    try {
      const res = await sendPhoneOtp(phone.trim());
      setOtpSent(true);
      setOtpCountdown(180); // 3 minutes
      setOtpMsg(res.message || 'Verification code sent via SMS to your phone.');
      if (res.debugCode) {
        console.info('Test/Sandbox SMS OTP Code:', res.debugCode);
      }
    } catch (err) {
      setOtpError(err.message || 'Failed to send SMS verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // SMS OTP Verify
  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpMsg('');

    try {
      await verifyPhoneOtp(phone.trim(), otpCode.trim());
      setOtpSent(false);
      setOtpCode('');
      setIsChangingPhone(false);
      setProfileSuccessMsg('Phone number verified successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 5000);
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Save Billing Information
  const handleSaveBilling = async (e) => {
    e?.preventDefault();
    setSavingBilling(true);
    setBillingSuccessMsg('');
    setBillingErrorMsg('');

    try {
      await updateBilling({
        billing_type: billingType,
        billing_name: billingName,
        billing_tax_id: billingTaxId,
        billing_tax_office: billingTaxOffice,
        billing_address: billingAddress,
        billing_city: billingCity,
        billing_country: billingCountry
      });
      setBillingSuccessMsg(isTr ? 'Fatura bilgileriniz başarıyla kaydedildi.' : 'Billing details saved successfully.');
      setTimeout(() => setBillingSuccessMsg(''), 4000);
    } catch (err) {
      setBillingErrorMsg(err.message || (isTr ? 'Fatura bilgileri kaydedilemedi.' : 'Failed to save billing info.'));
    } finally {
      setSavingBilling(false);
    }
  };

  // Upgrade Plan handler
  const handleUpgradePlan = async (targetPlan) => {
    if (targetPlan === 'pro' || targetPlan === 'enterprise') {
      presentPaywall({ defaultPackageId: targetPlan === 'enterprise' ? 'unlimited' : 'pro' });
      return;
    }
    setUpgradingPlan(targetPlan);
    setPlanSuccessMsg('');
    try {
      await upgradePlan(targetPlan);
      setPlanSuccessMsg(isTr ? `Planınız ${targetPlan.toUpperCase()} olarak güncellendi!` : `Plan updated to ${targetPlan.toUpperCase()}!`);
      const updatedInvoices = await getInvoices();
      setInvoices(updatedInvoices);
      setTimeout(() => setPlanSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Plan güncellenemedi.');
    } finally {
      setUpgradingPlan(null);
    }
  };

  const userInitials = (user?.name || user?.email || 'C')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const currentPlan = isRevenueCatPro ? 'pro' : (user?.plan || 'free');

  if (!isAuthenticated && !loading) {
    return (
      <div className="account-page-root" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <div className="account-panel-card" style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 2rem' }}>
          <div className="auth-modal-logo-wrap" style={{ margin: '0 auto 1.25rem' }}>
            <ShieldCheck size={28} style={{ color: 'var(--text-main)' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {isTr ? 'Giriş Yapmanız Gerekiyor' : 'Authentication Required'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {isTr 
              ? 'Paketiniz, profiliniz ve faturalandırma bilgilerinize erişmek için lütfen giriş yapın veya ücretsiz üye olun.' 
              : 'Please sign in or create an account to view your package, profile, and billing information.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="account-btn btn-primary btn-lg"
            >
              {isTr ? 'Giriş Yap' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="account-btn btn-secondary btn-lg"
            >
              {isTr ? 'Kayıt Ol' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page-root">
      {/* Top Breadcrumb & Back */}
      <div className="account-top-bar">
        <button
          type="button"
          onClick={onBack || (() => { window.location.hash = '#/'; })}
          className="account-back-btn"
        >
          <ArrowLeft size={15} />
          <span>{isTr ? 'Araçlara Dön' : 'Back to Tools'}</span>
        </button>
        <span className="account-top-divider">/</span>
        <span className="account-top-current">{isTr ? 'Hesap Portalı' : 'Account Portal'}</span>
      </div>

      {/* User Header Profile Card */}
      <div className="account-header-card">
        <div className="account-user-meta">
          <div className="account-header-avatar-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name} className="account-header-avatar-img" />
            ) : (
              <div className="account-header-avatar-fallback">{userInitials}</div>
            )}
            <span className="account-status-online-dot" title="Aktif" />
          </div>

          <div className="account-header-details">
            <div className="account-header-name-row">
              <h1 className="account-header-name">{user?.name || user?.email}</h1>
              <span className={`account-plan-badge badge-${currentPlan}`}>
                <Crown size={12} />
                <span>
                  {currentPlan === 'pro' ? 'Pro Developer' : currentPlan === 'enterprise' ? 'Unlimited Enterprise' : (isTr ? 'Ücretsiz Plan' : 'Free Starter')}
                </span>
              </span>
            </div>
            <div className="account-header-subrow">
              <span className="account-header-email">
                <Mail size={13} />
                <span>{user?.email}</span>
              </span>
              <span className="account-meta-dot">&bull;</span>
              <span className={`account-phone-status-pill ${user?.phone_verified ? 'is-verified' : 'is-unverified'}`}>
                {user?.phone_verified ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Phone Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} />
                    <span>Phone Unverified</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <button 
          type="button" 
          onClick={logout} 
          className="account-logout-btn"
          title={isTr ? 'Oturumu Kapat' : 'Log out'}
        >
          {isTr ? 'Çıkış Yap' : 'Log Out'}
        </button>
      </div>

      {/* Navigation Tabs (Ordered: Profil, Plan, Billing) */}
      <div className="account-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          className={`account-tab-btn ${activeTab === 'profile' ? 'is-active' : ''}`}
          onClick={() => switchTab('profile')}
        >
          <User size={17} />
          <span>{isTr ? 'Profil' : 'Profile'}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'package'}
          className={`account-tab-btn ${activeTab === 'package' ? 'is-active' : ''}`}
          onClick={() => switchTab('package')}
        >
          <Package size={17} />
          <span>{isTr ? 'Plan' : 'Plan'}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'billing'}
          className={`account-tab-btn ${activeTab === 'billing' ? 'is-active' : ''}`}
          onClick={() => switchTab('billing')}
        >
          <CreditCard size={17} />
          <span>Billing</span>
        </button>
      </div>

      {/* Main Tab Content Area */}
      <div className="account-tab-content">
        {/* ========================================================
            TAB: PLAN (My Plan & Subscription)
           ======================================================== */}
        {activeTab === 'package' && (
          <div className="account-tab-pane animate-fade">
            {planSuccessMsg && (
              <div className="account-alert-banner alert-success">
                <CheckCircle2 size={16} />
                <span>{planSuccessMsg}</span>
              </div>
            )}

            {/* Current Subscription Status Card */}
            <div className="account-panel-card">
              <div className="account-panel-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="account-panel-title">{isTr ? 'Mevcut Abonelik Paketiniz' : 'Current Subscription'}</h2>
                  <p className="account-panel-desc">
                    {isTr 
                      ? 'Hesabınıza tanımlı paket limitleri ve aktif kullanım hakları.' 
                      : 'Your active plan limits, quotas, and feature entitlements.'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  {isRevenueCatPro && (
                    <span className="account-active-status-tag" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#818cf8' }}>
                      <Crown size={13} style={{ marginRight: '4px' }} />
                      <span>RevenueCat PRO</span>
                    </span>
                  )}
                  <span className="account-active-status-tag">
                    <span className="status-indicator-dot" />
                    <span>{isTr ? 'Aktif Üyelik' : 'Active Subscription'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => openCustomerCenter()}
                    className="account-pricing-link-btn"
                    title={isTr ? 'Fatura & Abonelik Yönetim Portalı' : 'Subscription & Billing Portal'}
                  >
                    <CreditCard size={14} />
                    <span>{isTr ? 'Abonelik Portalı' : 'Customer Center'}</span>
                  </button>
                </div>
              </div>

              <div className="account-plan-overview-grid">
                <div className="account-metric-box">
                  <span className="account-metric-label">{isTr ? 'Plan Adı' : 'Plan Name'}</span>
                  <span className="account-metric-val">
                    {currentPlan === 'pro' ? 'Pro Developer' : currentPlan === 'enterprise' ? 'Unlimited Enterprise' : 'Forever Free'}
                  </span>
                </div>
                <div className="account-metric-box">
                  <span className="account-metric-label">{isTr ? 'Ücretsiz Araçlar' : 'Free Tools'}</span>
                  <span className="account-metric-val">
                    {isTr ? 'Ömür Boyu Ücretsiz' : 'Free Forever'}
                  </span>
                </div>
                <div className="account-metric-box">
                  <span className="account-metric-label">{isTr ? 'Premium Araçlar' : 'Premium Tools'}</span>
                  <span className="account-metric-val">
                    {currentPlan === 'free' 
                      ? (isTr ? 'Tokenli (Sınırlı Ücretsiz Hak)' : 'Token (Limited Free Allowance)')
                      : currentPlan === 'pro'
                      ? (isTr ? 'Genişletilmiş Token Hakkı' : 'Expanded Token Allowance')
                      : (isTr ? 'Maksimum Token Tahsisi' : 'Maximum Token Allowance')}
                  </span>
                </div>
                <div className="account-metric-box">
                  <span className="account-metric-label">{isTr ? 'Gizlilik & Depolama' : 'Privacy & Storage'}</span>
                  <span className="account-metric-val">
                    {isTr ? '%100 İstemci Taraflı' : '100% Client-Side'}
                  </span>
                </div>
              </div>

              <div className="account-plan-perks-list">
                <div className="account-perk-item">
                  <Check size={16} className="perk-icon" />
                  <span><strong>Free tools free forever</strong> — {isTr ? 'Tüm ücretsiz araçlar sınırsız ve ömür boyu bedava' : 'All free utility tools are free forever'}</span>
                </div>
                <div className="account-perk-item">
                  <Check size={16} className="perk-icon" />
                  <span><strong>Premium tools uses token, limited free allowance</strong> — {isTr ? 'Premium araçlar token kullanır, sınırlı ücretsiz kullanım hakkı içerir' : 'Premium tools use tokens with a limited free tier allowance'}</span>
                </div>
                <div className="account-perk-item">
                  <Check size={16} className="perk-icon" />
                  <span>{isTr ? 'Sıfır Sunucu Depolaması ile %100 İstemci Taraflı Gizlilik' : 'Zero Server File Uploads & Client-Side Privacy'}</span>
                </div>
              </div>
            </div>

            {/* Plans Switcher / Upgrade Matrix */}
            <div className="account-panel-card">
              <div className="account-panel-header">
                <div>
                  <h2 className="account-panel-title">{isTr ? 'Paketinizi Değiştirin veya Yükseltin' : 'Change or Upgrade Your Plan'}</h2>
                  <p className="account-panel-desc">
                    {isTr 
                      ? 'İhtiyacınıza uygun paketi seçerek limitlerinizi anında genişletin.' 
                      : 'Choose the plan tailored to your team or daily workflow.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { window.location.hash = '#/pricing'; }}
                  className="account-pricing-link-btn"
                >
                  <span>{isTr ? 'Tüm Paketleri Kıyasla' : 'Compare All Plans'}</span>
                  <ExternalLink size={14} />
                </button>
              </div>

              <div className="account-upgrade-grid">
                {/* Plan 1: Free */}
                <div className={`account-upgrade-card ${currentPlan === 'free' ? 'is-current' : ''}`}>
                  <div className="upgrade-card-head">
                    <h3 className="upgrade-card-name">Forever Free</h3>
                    <p className="upgrade-card-price">$0 <span className="period">/ {isTr ? 'ömür boyu' : 'forever'}</span></p>
                  </div>
                  <ul className="upgrade-features">
                    <li>✓ Free tools free forever</li>
                    <li>✓ Premium tools uses token</li>
                    <li>✓ Limited free allowance</li>
                    <li>✓ {isTr ? '%100 İstemci taraflı gizlilik' : '100% In-browser privacy'}</li>
                  </ul>
                  {currentPlan === 'free' ? (
                    <div className="upgrade-current-pill">{isTr ? 'Mevcut Paketiniz' : 'Current Plan'}</div>
                  ) : (
                    <button
                      type="button"
                      disabled={upgradingPlan === 'free'}
                      onClick={() => handleUpgradePlan('free')}
                      className="upgrade-action-btn btn-secondary"
                    >
                      {upgradingPlan === 'free' ? <Loader2 size={15} className="auth-spinner" /> : (isTr ? 'Ücretsiz Plana Geç' : 'Downgrade to Free')}
                    </button>
                  )}
                </div>

                {/* Plan 2: Pro Developer */}
                <div className={`account-upgrade-card card-featured ${currentPlan === 'pro' ? 'is-current' : ''}`}>
                  <div className="card-popular-badge">
                    <Sparkles size={11} />
                    <span>{isTr ? 'En Popüler' : 'Most Popular'}</span>
                  </div>
                  <div className="upgrade-card-head">
                    <h3 className="upgrade-card-name">Pro Developer</h3>
                    <p className="upgrade-card-price">$4.99 <span className="period">/ {isTr ? 'aylık' : 'month'}</span></p>
                  </div>
                  <ul className="upgrade-features">
                    <li>✓ Free tools free forever</li>
                    <li>✓ Premium tools uses token</li>
                    <li>✓ {isTr ? 'Genişletilmiş token hakkı' : 'Expanded token allowance'}</li>
                    <li>✓ {isTr ? 'Öncelikli işlem hızı' : 'Priority execution speed'}</li>
                  </ul>
                  {currentPlan === 'pro' ? (
                    <div className="upgrade-current-pill is-primary">{isTr ? 'Mevcut Paketiniz' : 'Current Plan'}</div>
                  ) : (
                    <button
                      type="button"
                      disabled={upgradingPlan === 'pro'}
                      onClick={() => handleUpgradePlan('pro')}
                      className="upgrade-action-btn btn-primary"
                    >
                      {upgradingPlan === 'pro' ? <Loader2 size={15} className="auth-spinner" /> : (isTr ? 'Pro\'ya Yükselt' : 'Upgrade to Pro')}
                    </button>
                  )}
                </div>

                {/* Plan 3: Enterprise */}
                <div className={`account-upgrade-card ${currentPlan === 'enterprise' ? 'is-current' : ''}`}>
                  <div className="upgrade-card-head">
                    <h3 className="upgrade-card-name">Enterprise</h3>
                    <p className="upgrade-card-price">$9.99 <span className="period">/ {isTr ? 'aylık' : 'month'}</span></p>
                  </div>
                  <ul className="upgrade-features">
                    <li>✓ Free tools free forever</li>
                    <li>✓ Premium tools uses token</li>
                    <li>✓ {isTr ? 'Maksimum token tahsisi' : 'Maximum token allowance'}</li>
                    <li>✓ 7/24 {isTr ? 'Öncelikli destek & Turbo hız' : 'Priority Support & Turbo speed'}</li>
                  </ul>
                  {currentPlan === 'enterprise' ? (
                    <div className="upgrade-current-pill">{isTr ? 'Mevcut Paketiniz' : 'Current Plan'}</div>
                  ) : (
                    <button
                      type="button"
                      disabled={upgradingPlan === 'enterprise'}
                      onClick={() => handleUpgradePlan('enterprise')}
                      className="upgrade-action-btn btn-secondary"
                    >
                      {upgradingPlan === 'enterprise' ? <Loader2 size={15} className="auth-spinner" /> : (isTr ? 'Enterprise\'a Yükselt' : 'Upgrade to Enterprise')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: PROFİL (My Profile, Avatar, Name, Email, SMS)
           ======================================================== */}
        {activeTab === 'profile' && (
          <div className="account-tab-pane animate-fade">
            {profileSuccessMsg && (
              <div className="account-alert-banner alert-success">
                <CheckCircle2 size={16} />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="account-alert-banner alert-error">
                <AlertCircle size={16} />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="account-profile-form">
              {/* Profile Photo / Avatar Section */}
              {/* Profile Photo / Avatar Studio Card */}
              <div className="account-panel-card avatar-studio-card">
                <div className="account-panel-header">
                  <div>
                    <div className="avatar-card-title-row">
                      <div className="avatar-header-icon-wrap">
                        <ImageIcon size={18} />
                      </div>
                      <h2 className="account-panel-title">{isTr ? 'Profil Fotoğrafı & Avatar Stüdyosu' : 'Profile Photo & Avatar Studio'}</h2>
                    </div>
                    <p className="account-panel-desc">
                      {isTr 
                        ? 'Profilinizi kişiselleştirin; dilediğiniz hazır avatarı seçin veya bilgisayarınızdan kendi fotoğrafınızı yükleyin.' 
                        : 'Personalize your identity with modern vector avatars or upload your custom photo.'}
                    </p>
                  </div>

                  <span className="avatar-source-tag">
                    {avatarUrl ? (
                      PRESET_AVATARS.some((p) => p.url === avatarUrl) ? (
                        <>
                          <Sparkles size={13} className="text-primary" />
                          <span>{PRESET_AVATARS.find((p) => p.url === avatarUrl)?.name}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} className="text-success" />
                          <span>{isTr ? 'Özel Fotoğraf' : 'Custom Photo'}</span>
                        </>
                      )
                    ) : (
                      <>
                        <User size={13} />
                        <span>{isTr ? 'Varsayılan İnisiyal' : 'Default Initials'}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="avatar-studio-layout">
                  {/* Left Column: Live Avatar Spotlight */}
                  <div className="avatar-spotlight-box">
                    <div 
                      className="avatar-preview-interactive" 
                      onClick={() => fileInputRef.current?.click()}
                      title={isTr ? 'Fotoğrafı değiştirmek için tıklayın' : 'Click to change photo'}
                    >
                      <div className="avatar-preview-ring">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="avatar-spotlight-img" />
                        ) : (
                          <div className="avatar-spotlight-fallback">{userInitials}</div>
                        )}
                        <div className="avatar-hover-overlay">
                          <Camera size={22} />
                          <span>{isTr ? 'Değiştir' : 'Change'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="avatar-spotlight-meta">
                      <span className="spotlight-user-name">{user?.name || user?.email}</span>
                      <span className="spotlight-user-role">
                        {currentPlan === 'pro' ? 'Pro Developer' : currentPlan === 'enterprise' ? 'Unlimited Enterprise' : (isTr ? 'Cerilas Kullanıcısı' : 'Cerilas Member')}
                      </span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleAvatarFileChange}
                    />

                    <div className="avatar-spotlight-actions">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="account-btn btn-secondary btn-sm avatar-upload-btn"
                      >
                        <Upload size={14} />
                        <span>{isTr ? 'Fotoğraf Yükle' : 'Upload File'}</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="account-btn btn-ghost text-danger btn-sm"
                          title={isTr ? 'Avatarı Kaldır' : 'Remove Avatar'}
                        >
                          <Trash2 size={14} />
                          <span>{isTr ? 'Kaldır' : 'Remove'}</span>
                        </button>
                      )}
                    </div>

                    <span className="avatar-format-note">
                      PNG, JPG, WebP • Maks. 2 MB
                    </span>
                  </div>

                  {/* Right Column: 10 Avatar Showcase Gallery */}
                  <div className="avatar-gallery-box">
                    <div className="avatar-gallery-top">
                      <div className="gallery-title-wrap">
                        <Sparkles size={15} className="gallery-sparkle-icon" />
                        <span className="gallery-title">{isTr ? 'Hazır Avatar Koleksiyonu' : 'Preset Avatar Collection'}</span>
                        <span className="gallery-count-pill">10 {isTr ? 'Seçenek' : 'Styles'}</span>
                      </div>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="gallery-reset-link"
                          title={isTr ? 'İnisiyal avatara dön' : 'Reset to initials'}
                        >
                          <RotateCcw size={12} />
                          <span>{isTr ? 'İnisiyale Dön' : 'Reset'}</span>
                        </button>
                      )}
                    </div>

                    <div className="avatar-gallery-grid">
                      {PRESET_AVATARS.map((avatar) => {
                        const isSelected = avatarUrl === avatar.url;
                        return (
                          <button
                            key={avatar.id}
                            type="button"
                            className={`avatar-card-item ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setAvatarUrl(avatar.url)}
                          >
                            <div className="avatar-card-img-wrap">
                              <img src={avatar.url} alt={avatar.name} className="avatar-card-img" />
                              {isSelected && (
                                <span className="avatar-selected-badge">
                                  <Check size={11} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                            <span className="avatar-card-name">{avatar.name}</span>
                            <span className="avatar-card-role">{avatar.role}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details (First Name, Last Name, Email) */}
              <div className="account-panel-card">
                <h2 className="account-panel-title">{isTr ? 'Kişisel Bilgiler' : 'Personal Details'}</h2>
                <p className="account-panel-desc">
                  {isTr ? 'Adınız, soyadınız ve kayıtlı e-posta adresiniz.' : 'Your official name and verified login email.'}
                </p>

                <div className="account-form-grid">
                  <div className="account-field-group">
                    <label className="account-field-label">{isTr ? 'İsim' : 'First Name'}</label>
                    <input
                      type="text"
                      className="account-field-input"
                      placeholder={isTr ? 'Adınız' : 'First name'}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div className="account-field-group">
                    <label className="account-field-label">{isTr ? 'Soyisim' : 'Last Name'}</label>
                    <input
                      type="text"
                      className="account-field-input"
                      placeholder={isTr ? 'Soyadınız' : 'Last name'}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  <div className="account-field-group field-span-2">
                    <div className="field-label-row">
                      <label className="account-field-label">{isTr ? 'E-posta Adresi' : 'Email Address'}</label>
                      <span className="field-badge-verified">
                        <CheckCircle2 size={12} />
                        <span>{isTr ? 'Hesap E-postası' : 'Account Email'}</span>
                      </span>
                    </div>
                    <input
                      type="email"
                      disabled
                      className="account-field-input is-disabled"
                      value={user?.email || ''}
                    />
                    <span className="account-field-helper">
                      {isTr ? 'E-posta adresi güvenliğiniz için hesap bazında kilitlenmiştir.' : 'Email address is locked for account security.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Google Account Connection Card */}
              <div className="account-panel-card">
                <div className="account-panel-header">
                  <div>
                    <h2 className="account-panel-title">
                      {isTr ? 'Google Hesabı Bağlantısı' : 'Google Account Connection'}
                    </h2>
                    <p className="account-panel-desc">
                      {isTr 
                        ? 'Google hesabınızı eşleştirerek tek tıkla şifresiz giriş yapabilir ve profilinizi otomatik senkronize edebilirsiniz.' 
                        : 'Connect your Google account for seamless one-click sign-in and profile synchronization.'}
                    </p>
                  </div>
                  {user?.google_id ? (
                    <span className="account-verified-tag">
                      <CheckCircle2 size={14} />
                      <span>{isTr ? 'Google Bağlı' : 'Google Connected'}</span>
                    </span>
                  ) : (
                    <span className="account-unverified-tag">
                      <AlertCircle size={14} />
                      <span>{isTr ? 'Bağlantı Yok' : 'Not Connected'}</span>
                    </span>
                  )}
                </div>

                {googleSuccessMsg && (
                  <div className="account-alert-banner alert-success" style={{ marginBottom: '1rem' }}>
                    <CheckCircle2 size={16} />
                    <span>{googleSuccessMsg}</span>
                  </div>
                )}
                {googleErrorMsg && (
                  <div className="account-alert-banner alert-error" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={16} />
                    <span>{googleErrorMsg}</span>
                  </div>
                )}

                <div className="google-connection-row">
                  <div className="google-connection-info">
                    <div className="google-icon-badge">
                      <svg width="22" height="22" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.33 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                      </svg>
                    </div>
                    <div className="google-connection-text">
                      <span className="google-conn-title">Google SSO</span>
                      <span className="google-conn-desc">
                        {user?.google_id 
                          ? (isTr ? 'Google hesabınız Cerilas üyeliğinize başarıyla bağlanmıştır.' : 'Your Google account is actively linked to your profile.') 
                          : (isTr ? 'Hesabınızı Google ile eşleştirerek anında giriş yapın.' : 'Link your Google account for faster logins.')}
                      </span>
                    </div>
                  </div>

                  <div className="google-connection-action">
                    {user?.google_id ? (
                      <button
                        type="button"
                        onClick={handleUnlinkGoogle}
                        disabled={googleActionLoading}
                        className="account-btn btn-secondary btn-sm"
                      >
                        {googleActionLoading ? (
                          <Loader2 size={14} className="auth-spinner" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>{isTr ? 'Bağlantıyı Kaldır' : 'Disconnect'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLinkGoogle}
                        disabled={googleActionLoading}
                        className="account-btn btn-primary btn-sm"
                      >
                        {googleActionLoading ? (
                          <Loader2 size={14} className="auth-spinner" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        <span>{isTr ? 'Google ile Bağla' : 'Connect Google'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone & SMS Verification (Netgsm Infrastructure) */}
              <div className="account-panel-card">
                <div className="account-panel-header">
                  <div>
                    <h2 className="account-panel-title">Phone & SMS Verification</h2>
                    <p className="account-panel-desc">
                      Verify your mobile phone via our secure SMS gateway infrastructure to protect your account and unlock higher limits.
                    </p>
                  </div>
                  {user?.phone_verified && !isChangingPhone && (
                    <span className="account-verified-tag">
                      <CheckCircle2 size={14} />
                      <span>Phone Verified</span>
                    </span>
                  )}
                </div>

                {/* If Phone is already verified and not actively changing */}
                {user?.phone_verified && !isChangingPhone ? (
                  <div className="phone-verified-box">
                    <div className="phone-verified-info">
                      <Phone size={18} className="phone-icon-active" />
                      <div>
                        <span className="verified-number-text">{user.phone}</span>
                        <p className="verified-status-subtext">
                          This mobile phone number is verified and safely linked to your account.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChangingPhone(true)}
                      className="account-btn btn-secondary btn-sm"
                    >
                      Change Number
                    </button>
                  </div>
                ) : (
                  /* Phone Verification Form / OTP flow */
                  <div className="phone-verification-flow">
                    <div className="account-field-group">
                      <label className="account-field-label">
                        Mobile Phone Number
                      </label>
                      <div className="phone-input-action-row">
                        <div className="phone-input-wrap">
                          <span className="phone-prefix">+90</span>
                          <input
                            type="tel"
                            className="account-field-input phone-field"
                            placeholder="5xx xxx xx xx"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={otpLoading || (otpSent && otpCountdown > 0)}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || (otpSent && otpCountdown > 0) || !phone.trim()}
                          className="account-btn btn-primary"
                        >
                          {otpLoading ? (
                            <Loader2 size={15} className="auth-spinner" />
                          ) : (
                            <Send size={15} />
                          )}
                          <span>
                            {otpSent && otpCountdown > 0
                              ? `Resend SMS (${otpCountdown}s)`
                              : 'Send Verification SMS'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Feedback Messages */}
                    {otpMsg && (
                      <div className="otp-feedback-banner is-info">
                        <Sparkles size={15} />
                        <span>{otpMsg}</span>
                      </div>
                    )}
                    {otpError && (
                      <div className="otp-feedback-banner is-error">
                        <AlertCircle size={15} />
                        <span>{otpError}</span>
                      </div>
                    )}

                    {/* 6-Digit OTP Code Input Area */}
                    {otpSent && (
                      <div className="otp-verification-box animate-scale">
                        <div className="otp-box-header">
                          <h4 className="otp-box-title">Enter 6-Digit Verification Code</h4>
                          <p className="otp-box-subtitle">
                            Enter the 6-digit verification code sent from CERILAS AS to +90 {phone}.
                          </p>
                        </div>

                        <div className="otp-input-row">
                          <input
                            type="text"
                            maxLength={6}
                            autoFocus
                            className="otp-code-input"
                            placeholder="• • • • • •"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          />
                          <button
                            type="button"
                            disabled={otpLoading || otpCode.length !== 6}
                            onClick={handleVerifyOtp}
                            className="account-btn btn-success"
                          >
                            {otpLoading ? (
                              <Loader2 size={15} className="auth-spinner" />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                            <span>Verify Code</span>
                          </button>
                        </div>

                        {isChangingPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingPhone(false);
                              setOtpSent(false);
                              setOtpCode('');
                            }}
                            className="btn-cancel-link"
                          >
                            Cancel and keep current number
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save Profile Button */}
              <div className="account-form-actions">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="account-btn btn-primary btn-lg"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={16} className="auth-spinner" />
                      <span>{isTr ? 'Kaydediliyor...' : 'Saving Changes...'}</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{isTr ? 'Profil Değişikliklerini Kaydet' : 'Save Profile Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 3: BILLING (Faturalandırma & Ödeme)
           ======================================================== */}
        {activeTab === 'billing' && (
          <div className="account-tab-pane animate-fade">
            {billingSuccessMsg && (
              <div className="account-alert-banner alert-success">
                <CheckCircle2 size={16} />
                <span>{billingSuccessMsg}</span>
              </div>
            )}
            {billingErrorMsg && (
              <div className="account-alert-banner alert-error">
                <AlertCircle size={16} />
                <span>{billingErrorMsg}</span>
              </div>
            )}

            {/* Invoicing Details Form */}
            <form onSubmit={handleSaveBilling} className="account-billing-form">
              <div className="account-panel-card">
                <div className="account-panel-header">
                  <div>
                    <h2 className="account-panel-title">{isTr ? 'Fatura Bilgileri' : 'Billing & Invoice Details'}</h2>
                    <p className="account-panel-desc">
                      {isTr 
                        ? 'Satın alımlarınız ve abonelikleriniz için düzenlenecek e-fatura / e-arşiv bilgileri.' 
                        : 'Official details used for electronic invoice issuance and receipts.'}
                    </p>
                  </div>

                  {/* Individual vs Corporate switch */}
                  <div className="billing-type-switch">
                    <button
                      type="button"
                      className={`type-switch-btn ${billingType === 'individual' ? 'is-active' : ''}`}
                      onClick={() => setBillingType('individual')}
                    >
                      <User size={14} />
                      <span>{isTr ? 'Bireysel' : 'Individual'}</span>
                    </button>
                    <button
                      type="button"
                      className={`type-switch-btn ${billingType === 'company' ? 'is-active' : ''}`}
                      onClick={() => setBillingType('company')}
                    >
                      <Building2 size={14} />
                      <span>{isTr ? 'Kurumsal' : 'Corporate'}</span>
                    </button>
                  </div>
                </div>

                <div className="account-form-grid">
                  <div className="account-field-group field-span-2">
                    <label className="account-field-label">
                      {billingType === 'individual' 
                        ? (isTr ? 'Fatura Adı & Soyadı' : 'Full Legal Name') 
                        : (isTr ? 'Şirket Resmi Unvanı' : 'Company Legal Name')}
                    </label>
                    <input
                      type="text"
                      required
                      className="account-field-input"
                      placeholder={billingType === 'individual' ? (isTr ? 'Ad Soyad' : 'John Doe') : (isTr ? 'Örn: Cerilas Bilişim ve İnovasyon A.Ş.' : 'Cerilas Inc.')}
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                    />
                  </div>

                  <div className="account-field-group">
                    <label className="account-field-label">
                      {billingType === 'individual' 
                        ? (isTr ? 'TC Kimlik Numarası (TCKN)' : 'National ID') 
                        : (isTr ? 'Vergi Kimlik Numarası (VKN)' : 'Tax Number / VAT ID')}
                    </label>
                    <input
                      type="text"
                      className="account-field-input"
                      placeholder={billingType === 'individual' ? '11111111111' : '1234567890'}
                      value={billingTaxId}
                      onChange={(e) => setBillingTaxId(e.target.value)}
                    />
                  </div>

                  {billingType === 'company' && (
                    <div className="account-field-group">
                      <label className="account-field-label">{isTr ? 'Vergi Dairesi' : 'Tax Office'}</label>
                      <input
                        type="text"
                        className="account-field-input"
                        placeholder={isTr ? 'Örn: Kadıköy V.D.' : 'Tax Office Name'}
                        value={billingTaxOffice}
                        onChange={(e) => setBillingTaxOffice(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="account-field-group field-span-2">
                    <label className="account-field-label">{isTr ? 'Fatura Adresi' : 'Billing Address'}</label>
                    <textarea
                      rows={2}
                      className="account-field-textarea"
                      placeholder={isTr ? 'Mahalle, Cadde, Sokak, Kapı No...' : 'Street address, building, suite...'}
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                    />
                  </div>

                  <div className="account-field-group">
                    <label className="account-field-label">{isTr ? 'Şehir' : 'City'}</label>
                    <input
                      type="text"
                      className="account-field-input"
                      placeholder={isTr ? 'İstanbul' : 'City'}
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                    />
                  </div>

                  <div className="account-field-group">
                    <label className="account-field-label">{isTr ? 'Ülke' : 'Country'}</label>
                    <input
                      type="text"
                      className="account-field-input"
                      value={billingCountry}
                      onChange={(e) => setBillingCountry(e.target.value)}
                    />
                  </div>
                </div>

                <div className="billing-save-row">
                  <button
                    type="submit"
                    disabled={savingBilling}
                    className="account-btn btn-primary"
                  >
                    {savingBilling ? <Loader2 size={15} className="auth-spinner" /> : <Check size={15} />}
                    <span>{isTr ? 'Fatura Bilgilerini Kaydet' : 'Save Billing Details'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Payment Method & Security Card */}
            <div className="account-panel-card">
              <div className="account-panel-header">
                <div>
                  <h2 className="account-panel-title">{isTr ? 'Ödeme Güvenliği ve Altyapı' : 'Payment Security'}</h2>
                  <p className="account-panel-desc">
                    {isTr 
                      ? 'Tüm işlemler uluslararası 256-Bit SSL sertifikası ve 3D Secure güvencesiyle gerçekleşir.' 
                      : 'All transactions are strictly encrypted with 256-Bit SSL and 3D Secure.'}
                  </p>
                </div>
                <div className="payment-security-badges">
                  <span className="security-chip">
                    <ShieldCheck size={14} />
                    <span>256-Bit SSL</span>
                  </span>
                  <span className="security-chip">
                    <Zap size={14} />
                    <span>3D Secure</span>
                  </span>
                </div>
              </div>

              <div className="payment-methods-showcase">
                <div className="card-brand-pill">Visa</div>
                <div className="card-brand-pill">Mastercard</div>
                <div className="card-brand-pill">Troy</div>
                <div className="card-brand-pill">Apple Pay</div>
              </div>
            </div>

            {/* Invoices History Table */}
            <div className="account-panel-card">
              <h2 className="account-panel-title">{isTr ? 'Fatura & Makbuz Geçmişi' : 'Invoices & Receipts'}</h2>
              <p className="account-panel-desc">
                {isTr ? 'Geçmiş abonelik ödemeleriniz ve indirilebilir e-faturalarınız.' : 'Your billing history and downloadable tax receipts.'}
              </p>

              <div className="account-invoices-table-wrap">
                <table className="account-invoices-table">
                  <thead>
                    <tr>
                      <th>{isTr ? 'Fatura No' : 'Invoice ID'}</th>
                      <th>{isTr ? 'Tarih' : 'Date'}</th>
                      <th>{isTr ? 'Paket / Açıklama' : 'Plan / Description'}</th>
                      <th>{isTr ? 'Tutar' : 'Amount'}</th>
                      <th>{isTr ? 'Durum' : 'Status'}</th>
                      <th style={{ textAlign: 'right' }}>{isTr ? 'Belge' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length > 0 ? (
                      invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="font-mono">{inv.invoice_number}</td>
                          <td>{new Date(inv.invoice_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}</td>
                          <td className="font-medium">{inv.plan_name}</td>
                          <td className="font-semibold">${Number(inv.amount).toFixed(2)}</td>
                          <td>
                            <span className="invoice-status-paid">
                              <CheckCircle2 size={12} />
                              <span>{isTr ? 'Ödendi' : 'Paid'}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => alert(isTr ? `Fatura (${inv.invoice_number}) hazırlanıyor...` : 'Generating PDF...')}
                              className="invoice-download-btn"
                              title={isTr ? 'Fatura PDF İndir' : 'Download Invoice'}
                            >
                              <Download size={13} />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="table-empty-cell">
                          {isTr ? 'Henüz düzenlenmiş bir fatura bulunmuyor.' : 'No invoices found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
