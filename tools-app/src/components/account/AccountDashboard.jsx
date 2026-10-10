import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, 
  Package, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
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
  Calendar,
  Clock,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRevenueCat } from '../../context/RevenueCatContext';
import { checkProEntitlement } from '../../revenuecat/revenueCatService';
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
    scheduleDowngrade,
    resumeSubscription,
    syncPlan,
    getSubscriptionStatus,
    getInvoices, 
    initiateGoogleAuth,
    unlinkGoogleAccount,
    logout 
  } = useAuth();
  const { 
    isPro: isRevenueCatPro, 
    customerInfo: rcCustomerInfo,
    openCustomerCenter,
    presentPaywall,
    downgradeToFree,
    effectivePlan,
    managementUrl,
    cancelUrl,
    clearManualOverride,
    refreshCustomerInfo
  } = useRevenueCat();
  const { language } = useTranslation();
  const isTr = language === 'tr';

  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'package' | 'billing'

  // Custom Modal States
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
  const [dialogModal, setDialogModal] = useState({
    isOpen: false,
    type: 'info', // 'warning' | 'danger' | 'success' | 'info'
    badge: '',
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: null
  });

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
  const [packageBillingCycle, setPackageBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

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
    setDialogModal({
      isOpen: true,
      type: 'warning',
      badge: isTr ? 'GÜVENLİK' : 'SECURITY',
      title: isTr ? 'Google Bağlantısını Kaldır' : 'Disconnect Google Account',
      message: isTr 
        ? 'Google hesabınızın bağlantısını kaldırmak istediğinize emin misiniz? Şifreniz ile giriş yapmaya devam edebilirsiniz.' 
        : 'Are you sure you want to disconnect your Google account? You will still be able to sign in with your password.',
      confirmText: isTr ? 'Bağlantıyı Kaldır' : 'Disconnect',
      cancelText: isTr ? 'Vazgeç' : 'Cancel',
      onConfirm: async () => {
        setDialogModal(prev => ({ ...prev, isOpen: false }));
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
      }
    });
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

  // Compute the period end date for Pro/Unlimited
  const proEntitlement = rcCustomerInfo?.entitlements?.active?.['cerilas_tools_pro'] 
    || rcCustomerInfo?.entitlements?.all?.['cerilas_tools_pro'];

  const getPeriodEndDate = () => {
    if (proEntitlement?.expirationDate) {
      const d = new Date(proEntitlement.expirationDate);
      if (!isNaN(d.getTime())) return d;
    }
    if (user?.plan_expires_at) {
      const d = new Date(user.plan_expires_at);
      if (!isNaN(d.getTime())) return d;
    }
    if (invoices && invoices.length > 0 && invoices[0].invoice_date) {
      const invDate = new Date(invoices[0].invoice_date);
      if (!isNaN(invDate.getTime())) {
        return new Date(invDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    }
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  };

  const periodEndDate = getPeriodEndDate();
  const formattedPeriodEndDate = periodEndDate.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Upgrade / Downgrade Plan handler
  const handleUpgradePlan = async (targetPlan) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (targetPlan === 'unlimited' || targetPlan === 'enterprise') {
      presentPaywall({ 
        defaultPackageId: 'unlimited',
        cycle: packageBillingCycle 
      });
      return;
    }

    if (targetPlan === 'pro') {
      // Check if user already has an active Pro entitlement in RevenueCat / DB
      const hasActiveRcPro = isRevenueCatPro || (rcCustomerInfo && checkProEntitlement(rcCustomerInfo));
      if (hasActiveRcPro) {
        setUpgradingPlan('pro');
        try {
          if (syncPlan) await syncPlan('pro', true);
          if (clearManualOverride) clearManualOverride();
          if (refreshCustomerInfo) await refreshCustomerInfo();
          
          setDialogModal({
            isOpen: true,
            type: 'success',
            badge: isTr ? 'PRO AKTİF' : 'PRO ACTIVE',
            title: isTr ? 'Pro Aboneliğiniz Hesabınızla Eşitlendi' : 'Pro Subscription Synced',
            message: isTr 
              ? `Hesabınızda ${formattedPeriodEndDate} tarihine kadar geçerli bir Pro aboneliği zaten aktiftir. Tekrar satın alma işlemi yapılmadan Pro yetkileriniz profilinize başarıyla geri yüklendi.` 
              : `Your account already has an active Pro subscription until ${formattedPeriodEndDate}. Your Pro membership has been synced with no extra charge.`,
            confirmText: isTr ? 'Tamam, Harika' : 'Got it',
            onConfirm: () => setDialogModal(prev => ({ ...prev, isOpen: false }))
          });
          return;
        } catch (e) {
          console.warn('Sync existing pro failed:', e);
        } finally {
          setUpgradingPlan(null);
        }
      }

      presentPaywall({ 
        defaultPackageId: 'pro',
        cycle: packageBillingCycle 
      });
      return;
    }

    if (targetPlan === 'free') {
      if (user?.cancel_at_period_end) {
        setDialogModal({
          isOpen: true,
          type: 'info',
          badge: isTr ? 'BİLGİ' : 'NOTICE',
          title: isTr ? 'Downgrade Zaten Planlandı' : 'Downgrade Already Scheduled',
          message: isTr 
            ? `Pro üyeliğiniz ${formattedPeriodEndDate} tarihine kadar aktif kalacak ve bu tarihten sonra otomatik olarak Ücretsiz plana geçecektir.` 
            : `Your Pro membership is already scheduled to end on ${formattedPeriodEndDate}.`,
          confirmText: isTr ? 'Anladım' : 'Got it',
          onConfirm: () => setDialogModal(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }
      setIsDowngradeModalOpen(true);
      return;
    }
  };

  // Confirm Downgrade Handler (Scheduled Downgrade + Paddle Portal Sync)
  const handleConfirmDowngrade = async () => {
    setIsDowngradeModalOpen(false);
    setUpgradingPlan('free');
    setPlanSuccessMsg('');
    try {
      const result = await scheduleDowngrade(periodEndDate.toISOString());
      
      // Open authenticated Paddle Customer Portal cancellation in new tab if available
      const targetPortalUrl = result?.cancel_url || result?.management_url || cancelUrl || managementUrl;
      if (targetPortalUrl && typeof window !== 'undefined') {
        window.open(targetPortalUrl, '_blank', 'noopener,noreferrer');
      }

      setDialogModal({
        isOpen: true,
        type: 'success',
        badge: isTr ? 'BAŞARILI' : 'SUCCESS',
        title: isTr ? 'Downgrade Planlandı' : 'Downgrade Scheduled',
        message: isTr 
          ? `Pro üyeliğiniz ${formattedPeriodEndDate} tarihine kadar kesintisiz devam edecektir. Yinelenen ödemenin durdurulması için Paddle Müşteri Portalı yeni sekmede açılmıştır. Bu tarihten sonra hesabınız otomatik olarak Ücretsiz (Free) plana geçecektir.`
          : `Your Pro membership will remain active until ${formattedPeriodEndDate}. The Paddle Customer Portal has been opened in a new tab to manage auto-renewal. After this date, your account will switch to the Free plan.`,
        confirmText: isTr ? 'Harika, Anladım' : 'Got it',
        onConfirm: () => setDialogModal(prev => ({ ...prev, isOpen: false }))
      });

      const successText = isTr 
        ? `Pro üyeliğiniz ${formattedPeriodEndDate} tarihine kadar aktif kalacak, sonrasında Ücretsiz plana geçecektir.` 
        : `Your Pro membership will remain active until ${formattedPeriodEndDate}.`;
      setPlanSuccessMsg(successText);
      try {
        const updatedInvoices = await getInvoices();
        setInvoices(updatedInvoices);
      } catch (_) {}
      setTimeout(() => setPlanSuccessMsg(''), 6000);
    } catch (err) {
      setDialogModal({
        isOpen: true,
        type: 'danger',
        badge: isTr ? 'HATA' : 'ERROR',
        title: isTr ? 'İşlem Başarısız' : 'Action Failed',
        message: err.message || (isTr ? 'Downgrade işlemi gerçekleştirilemedi.' : 'Failed to schedule downgrade.'),
        confirmText: isTr ? 'Tamam' : 'Close',
        onConfirm: () => setDialogModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setUpgradingPlan(null);
    }
  };

  // Resume Subscription Handler (Cancel Scheduled Downgrade)
  const handleResumeSubscription = () => {
    setDialogModal({
      isOpen: true,
      type: 'warning',
      badge: isTr ? 'ABONELİK YENİLEME' : 'SUBSCRIPTION RENEWAL',
      title: isTr ? 'Aboneliği Devam Ettir' : 'Resume Pro Subscription',
      message: isTr 
        ? 'Planlanan iptal işlemi geri alınacak ve Pro üyeliğiniz kesintisiz olarak devam edecektir.'
        : 'The scheduled cancellation will be reverted and your Pro membership will continue renewing.',
      confirmText: isTr ? 'Aboneliği Sürdür' : 'Resume Subscription',
      cancelText: isTr ? 'Vazgeç' : 'Cancel',
      onConfirm: async () => {
        setUpgradingPlan('pro');
        try {
          await resumeSubscription();
          if (clearManualOverride) clearManualOverride();
          if (refreshCustomerInfo) await refreshCustomerInfo();
          setDialogModal({
            isOpen: true,
            type: 'success',
            badge: isTr ? 'BAŞARILI' : 'SUCCESS',
            title: isTr ? 'Abonelik Sürdürüldü' : 'Subscription Resumed',
            message: isTr 
              ? 'Pro üyeliğiniz başarıyla sürdürüldü. Dönem sonunda yenilenmeye devam edecektir.' 
              : 'Your Pro subscription has been resumed successfully.',
            confirmText: isTr ? 'Tamam' : 'Close',
            onConfirm: () => setDialogModal(prev => ({ ...prev, isOpen: false }))
          });
          const successText = isTr ? 'Pro aboneliğiniz başarıyla sürdürüldü.' : 'Pro subscription resumed successfully.';
          setPlanSuccessMsg(successText);
          setTimeout(() => setPlanSuccessMsg(''), 5000);
        } catch (err) {
          setDialogModal({
            isOpen: true,
            type: 'danger',
            badge: isTr ? 'HATA' : 'ERROR',
            title: isTr ? 'İşlem Başarısız' : 'Action Failed',
            message: err.message || (isTr ? 'Abonelik sürdürülemedi.' : 'Failed to resume subscription.'),
            confirmText: isTr ? 'Tamam' : 'Close',
            onConfirm: () => setDialogModal(prev => ({ ...prev, isOpen: false }))
          });
        } finally {
          setUpgradingPlan(null);
        }
      }
    });
  };

  const userInitials = (user?.name || user?.email || 'C')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const currentPlan = (effectivePlan || user?.plan || 'free').toLowerCase();

  // If user is not authenticated and is trying to access Profile or Billing, show auth prompt
  if (!isAuthenticated && !loading && activeTab !== 'package') {
    return (
      <div className="account-page-root auth-required-page">
        <div className="account-panel-card auth-required-card">
          <div className="auth-modal-logo-wrap" style={{ margin: '0 auto 1.25rem' }}>
            <ShieldCheck size={28} style={{ color: 'var(--text-main, #38bdf8)' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main, #ffffff)' }}>
            {isTr ? 'Giriş Yapmanız Gerekiyor' : 'Authentication Required'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {isTr 
              ? 'Profiliniz ve faturalandırma bilgilerinize erişmek için lütfen giriş yapın veya ücretsiz üye olun.' 
              : 'Please sign in or create an account to view your profile and billing information.'}
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
                  {currentPlan === 'pro' ? 'Pro' : (currentPlan === 'enterprise' || currentPlan === 'unlimited') ? 'Unlimited' : (isTr ? 'Ücretsiz Plan' : 'Free Starter')}
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

            {/* Scheduled Downgrade Notice Banner */}
            {user?.cancel_at_period_end && (
              <div className="account-scheduled-downgrade-banner">
                <div className="account-scheduled-banner-left">
                  <div className="account-scheduled-banner-icon">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="account-scheduled-banner-title">
                      {isTr ? 'Abonelik İptali Planlandı (Dönem Sonunda Sona Erecek)' : 'Subscription Cancels at Period End'}
                    </h4>
                    <p className="account-scheduled-banner-desc">
                      {isTr 
                        ? `Pro üyeliğiniz ${formattedPeriodEndDate} tarihine kadar kesintisiz aktiftir. Bu tarihten sonra otomatik olarak Ücretsiz plana geçeceksiniz (Kartınızdan yeni ücret çekilmeyecektir).`
                        : `Your Pro membership is active until ${formattedPeriodEndDate}. After this date, your account will switch to Free with no renewal charges.`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResumeSubscription}
                  disabled={upgradingPlan === 'resume'}
                  className="account-scheduled-resume-btn"
                >
                  <RotateCcw size={14} />
                  <span>{isTr ? 'Aboneliği Sürdür (İptali Geri Al)' : 'Resume Subscription'}</span>
                </button>
              </div>
            )}

            {/* Guest Welcome Banner if visitor is not logged in */}
            {!isAuthenticated && (
              <div className="account-guest-banner">
                <div className="guest-banner-left">
                  <div className="guest-banner-icon-wrap">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="guest-banner-title">
                      {isTr ? 'Şeffaf Planlar & %100 Gizlilik' : 'Transparent Plans & 100% Privacy'}
                    </h3>
                    <p className="guest-banner-desc">
                      {isTr 
                        ? 'Tüm temel araçlar ömür boyu ücretsizdir. Yüksek hacimli AI ve token kullanımı için paketinizi seçebilirsiniz.' 
                        : 'All core utilities are free forever. Select a plan below for expanded AI token quotas and concurrency.'}
                    </p>
                  </div>
                </div>
                <div className="guest-banner-actions">
                  <button 
                    type="button" 
                    onClick={() => openAuthModal('login')} 
                    className="guest-auth-btn btn-login"
                  >
                    {isTr ? 'Giriş Yap' : 'Sign In'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => openAuthModal('register')} 
                    className="guest-auth-btn btn-register"
                  >
                    {isTr ? 'Ücretsiz Kayıt Ol' : 'Create Free Account'}
                  </button>
                </div>
              </div>
            )}

            {/* Current Subscription Status Card */}
            <div className="account-panel-card account-current-sub-card">
              <div className="account-panel-header">
                <div>
                  <div className="account-panel-pill">
                    <Crown size={13} />
                    <span>{isTr ? 'ÜYELİK DURUMU' : 'MEMBERSHIP STATUS'}</span>
                  </div>
                  <h2 className="account-panel-title">{isTr ? 'Mevcut Abonelik Paketiniz' : 'Current Subscription'}</h2>
                  <p className="account-panel-desc">
                    {isTr 
                      ? 'Hesabınıza tanımlı paket limitleri, aktif token tahsisi ve kullanım hakları.' 
                      : 'Your active plan limits, quotas, and feature entitlements.'}
                  </p>
                </div>
                <div className="account-header-actions-row">
                  {isRevenueCatPro && (
                    <span className="account-active-status-tag tag-rc-pro">
                      <Crown size={13} />
                      <span>PRO ACTIVE</span>
                    </span>
                  )}
                  <span className="account-active-status-tag tag-emerald">
                    <span className="status-indicator-dot" />
                    <span>{isTr ? 'Aktif Üyelik' : 'Active Account'}</span>
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
                  <div className="account-metric-top">
                    <span className="account-metric-label">{isTr ? 'Plan Adı' : 'Plan Name'}</span>
                    <Crown size={15} className="metric-icon text-amber" />
                  </div>
                  <span className="account-metric-val">
                    {currentPlan === 'pro' ? 'Pro' : (currentPlan === 'enterprise' || currentPlan === 'unlimited') ? 'Unlimited' : 'Forever Free'}
                  </span>
                </div>
                <div className="account-metric-box">
                  <div className="account-metric-top">
                    <span className="account-metric-label">{isTr ? 'Ücretsiz Araçlar' : 'Free Tools'}</span>
                    <Sparkles size={15} className="metric-icon text-cyan" />
                  </div>
                  <span className="account-metric-val">
                    {isTr ? 'Ömür Boyu Sınırsız' : 'Unlimited Free'}
                  </span>
                </div>
                <div className="account-metric-box">
                  <div className="account-metric-top">
                    <span className="account-metric-label">{isTr ? 'Premium Araçlar' : 'Premium Tools'}</span>
                    <Zap size={15} className="metric-icon text-indigo" />
                  </div>
                  <span className="account-metric-val">
                    {currentPlan === 'free' 
                      ? (isTr ? 'Tokenli (Ücretsiz Kota)' : 'Token (Free Quota)')
                      : currentPlan === 'pro'
                      ? (isTr ? 'Genişletilmiş Token' : 'Expanded Token Allowance')
                      : (isTr ? 'Maksimum Tahsis' : 'Maximum Token Allowance')}
                  </span>
                </div>
                <div className="account-metric-box">
                  <div className="account-metric-top">
                    <span className="account-metric-label">{isTr ? 'Gizlilik & Depolama' : 'Privacy & Storage'}</span>
                    <ShieldCheck size={15} className="metric-icon text-emerald" />
                  </div>
                  <span className="account-metric-val">
                    {isTr ? '%100 İstemci Taraflı' : '100% Client-Side'}
                  </span>
                </div>
              </div>

              <div className="account-plan-perks-list">
                <div className="account-perk-item">
                  <div className="account-perk-icon-circle"><Check size={13} /></div>
                  <span><strong>Free tools free forever:</strong> {isTr ? 'Tüm ücretsiz araçlar sınırsız ve ömür boyu bedava' : 'All free utility tools are free forever'}</span>
                </div>
                <div className="account-perk-item">
                  <div className="account-perk-icon-circle"><Check size={13} /></div>
                  <span><strong>Premium tools uses token:</strong> {isTr ? 'Premium araçlar token kullanır, sınırlı ücretsiz kullanım hakkı içerir' : 'Premium tools use tokens with a limited free tier allowance'}</span>
                </div>
                <div className="account-perk-item">
                  <div className="account-perk-icon-circle"><Check size={13} /></div>
                  <span><strong>%100 In-Browser Privacy:</strong> {isTr ? 'Sıfır sunucu depolaması, dosyalarınız asla cihazınızdan çıkmaz' : 'Zero server file uploads, files never leave your device'}</span>
                </div>
              </div>
            </div>

            {/* Plans Switcher / Upgrade Matrix */}
            <div className="account-panel-card account-upgrade-matrix-card">
              <div className="account-panel-header">
                <div>
                  <div className="account-panel-pill pill-cyan">
                    <Sparkles size={13} />
                    <span>{isTr ? 'FİYATLANDIRMA & YÜKSELTME' : 'PRICING & UPGRADE'}</span>
                  </div>
                  <h2 className="account-panel-title">{isTr ? 'Paketinizi Seçin veya Yükseltin' : 'Select or Upgrade Your Plan'}</h2>
                  <p className="account-panel-desc">
                    {isTr 
                      ? 'İhtiyacınıza uygun paketi seçerek limitlerinizi ve işlem hızınızı anında genişletin.' 
                      : 'Choose the plan tailored to your team or daily workflow.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { window.location.hash = '#/pricing'; }}
                  className="account-pricing-link-btn"
                >
                  <span>{isTr ? 'Detaylı Kıyaslama' : 'Compare Plans'}</span>
                  <ExternalLink size={14} />
                </button>
              </div>

              {/* Billing Frequency Switcher */}
              <div className="account-billing-switch-wrapper" role="group" aria-label="Billing frequency">
                <button
                  type="button"
                  className={`account-billing-toggle-tab ${packageBillingCycle === 'monthly' ? 'is-active' : ''}`}
                  onClick={() => setPackageBillingCycle('monthly')}
                >
                  {isTr ? 'Aylık Ödeme' : 'Monthly Billing'}
                </button>
                <button
                  type="button"
                  className={`account-billing-toggle-tab ${packageBillingCycle === 'annual' ? 'is-active' : ''}`}
                  onClick={() => setPackageBillingCycle('annual')}
                >
                  <span>{isTr ? 'Yıllık Ödeme' : 'Annual Billing'}</span>
                  <span className="account-billing-discount-badge">
                    {isTr ? '🎁 2 Ay Bedava' : '🎁 2 Months Free'}
                  </span>
                </button>
              </div>

              {planSuccessMsg && (
                <div className="account-alert-banner alert-success" style={{ margin: '0 0 1.5rem 0' }}>
                  <CheckCircle2 size={16} />
                  <span>{planSuccessMsg}</span>
                </div>
              )}

              <div className="account-upgrade-grid">
                {/* Plan 1: Free */}
                <div className={`account-upgrade-card ${currentPlan === 'free' ? 'is-current-card' : ''}`}>
                  <div className="account-upgrade-card-head">
                    <h3 className="account-upgrade-card-name">Forever Free</h3>
                    <p className="account-upgrade-card-desc">
                      {isTr ? 'Tüm ücretsiz araçlar sınırsız, premium araçlar için sınırlı kota.' : 'Free tools free forever, with limited free allowance for premium tools.'}
                    </p>
                    <div className="account-upgrade-price-wrap">
                      <span className="account-upgrade-currency">$</span>
                      <span className="account-upgrade-amount">0</span>
                      <span className="account-upgrade-period">/ {isTr ? 'ömür boyu' : 'forever'}</span>
                    </div>
                    <div className="account-upgrade-price-detail">
                      {isTr ? 'Kredi kartı gerekmez &bull; Herkese açık' : 'No credit card required &bull; Free forever'}
                    </div>
                  </div>

                  <ul className="account-upgrade-features-list">
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon"><Check size={13} /></div>
                      <span><strong>Free tools free forever:</strong> {isTr ? 'Tüm ücretsiz araçlar sınırsız' : 'Unlimited free tools'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon"><Check size={13} /></div>
                      <span><strong>Premium tools:</strong> {isTr ? 'Sınırlı ücretsiz token hakkı' : 'Limited free allowance'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon"><Check size={13} /></div>
                      <span><strong>%100 Tarayıcı Gizliliği:</strong> {isTr ? 'Sıfır sunucu depolaması' : 'Zero server file uploads'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon"><Check size={13} /></div>
                      <span>{isTr ? 'Standart WebAssembly işlem hızı' : 'Standard WebAssembly speed'}</span>
                    </li>
                  </ul>

                  <div className="account-upgrade-card-footer">
                    {currentPlan === 'free' ? (
                      <div className="account-current-plan-pill">{isTr ? 'Mevcut Planınız' : 'Current Plan'}</div>
                    ) : user?.cancel_at_period_end ? (
                      <div className="account-scheduled-plan-pill">
                        <Clock size={13} />
                        <span>{isTr ? 'Dönem Sonunda Aktif' : 'Active at Period End'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={upgradingPlan === 'free'}
                        onClick={() => handleUpgradePlan('free')}
                        className="account-plan-action-btn btn-secondary-sub"
                      >
                        {upgradingPlan === 'free' ? <Loader2 size={15} className="auth-spinner" /> : (isTr ? 'Ücretsiz Plana Geç' : 'Downgrade to Free')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Plan 2: Pro (Featured) */}
                <div className={`account-upgrade-card is-featured ${currentPlan === 'pro' ? 'is-current-card is-active-featured' : ''}`}>
                  <div className="account-card-top-tag tag-featured">
                    <Sparkles size={12} />
                    <span>{isTr ? 'POPÜLER SEÇİM' : 'POPULAR CHOICE'}</span>
                  </div>

                  <div className="account-upgrade-card-head">
                    <h3 className="account-upgrade-card-name">Pro</h3>
                    <p className="account-upgrade-card-desc">
                      {isTr ? 'Genişletilmiş token kotası ve öncelikli istemci işlem hızı.' : 'Expanded token allowance with priority client-side execution.'}
                    </p>
                    <div className="account-upgrade-price-wrap">
                      <span className="account-upgrade-currency">$</span>
                      <span className="account-upgrade-amount">
                        {packageBillingCycle === 'annual' ? '99.90' : '9.99'}
                      </span>
                      <span className="account-upgrade-period">
                        {packageBillingCycle === 'annual' ? (isTr ? '/ yıl' : '/ year') : (isTr ? '/ ay' : '/ month')}
                      </span>
                    </div>
                    <div className="account-upgrade-price-detail is-highlight">
                      {packageBillingCycle === 'annual' 
                        ? (isTr ? '🎁 2 Ay Bedava (Aylık ~$8.33)' : '🎁 2 Months Free (~$8.33/mo)')
                        : (isTr ? 'Aylık faturalandırılır ($9.99/ay)' : 'Billed monthly at $9.99/mo')}
                    </div>
                  </div>

                  <ul className="account-upgrade-features-list">
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-cyan"><Check size={13} /></div>
                      <span><strong>Free tools free forever:</strong> {isTr ? 'Tüm ücretsiz araçlar sınırsız' : 'Unlimited free tools'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-cyan"><Check size={13} /></div>
                      <span><strong>Premium tools:</strong> {isTr ? 'Genişletilmiş yüksek token kotası' : 'Expanded token allowance'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-cyan"><Check size={13} /></div>
                      <span><strong>Öncelikli Concurrency:</strong> {isTr ? 'Daha hızlı WebAssembly motoru' : 'Faster multi-threaded WASM'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-cyan"><Check size={13} /></div>
                      <span><strong>Reklamsız çalışma alanı</strong></span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-cyan"><Check size={13} /></div>
                      <span>{isTr ? 'Öncelikli destek & ticari kullanım' : 'Priority support & commercial rights'}</span>
                    </li>
                  </ul>

                  <div className="account-upgrade-card-footer">
                    {currentPlan === 'pro' ? (
                      user?.cancel_at_period_end ? (
                        <button
                          type="button"
                          onClick={handleResumeSubscription}
                          className="account-plan-action-btn btn-primary-featured"
                          title={isTr ? 'Aboneliği Sürdür' : 'Resume Subscription'}
                        >
                          <RotateCcw size={14} />
                          <span>{isTr ? 'Aboneliği Sürdür' : 'Resume Plan'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openCustomerCenter('overview')}
                          className="account-current-plan-pill is-manage-btn"
                        >
                          <Check size={14} />
                          <span>{isTr ? 'Mevcut Planınız (Yönet)' : 'Active Plan (Manage)'}</span>
                        </button>
                      )
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                        <button
                          type="button"
                          disabled={upgradingPlan === 'pro'}
                          onClick={() => handleUpgradePlan('pro')}
                          className="account-plan-action-btn btn-primary-featured"
                        >
                          {upgradingPlan === 'pro' ? (
                            <Loader2 size={15} className="auth-spinner" />
                          ) : isRevenueCatPro || checkProEntitlement(rcCustomerInfo) ? (
                            <>
                              <RotateCcw size={14} />
                              <span>{isTr ? "Pro'yu Geri Yükle" : 'Restore Pro Plan'}</span>
                            </>
                          ) : (
                            <>
                              <span>{isTr ? "Pro'ya Abone Ol" : 'Subscribe to Pro'}</span>
                              <Sparkles size={14} />
                            </>
                          )}
                        </button>
                        {(managementUrl || cancelUrl) && (
                          <button
                            type="button"
                            onClick={() => openCustomerCenter('overview')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted, #94a3b8)',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '2px 0'
                            }}
                          >
                            <ExternalLink size={12} />
                            <span>{isTr ? 'Paddle Portalında Yönet' : 'Manage on Paddle'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan 3: Unlimited */}
                <div className={`account-upgrade-card is-turbo ${currentPlan === 'enterprise' || currentPlan === 'unlimited' ? 'is-current-card is-active-turbo' : ''}`}>
                  <div className="account-card-top-tag tag-turbo">
                    <Zap size={12} />
                    <span>{isTr ? 'MAKSİMUM GÜÇ' : 'POWER USER'}</span>
                  </div>

                  <div className="account-upgrade-card-head">
                    <h3 className="account-upgrade-card-name">Unlimited</h3>
                    <p className="account-upgrade-card-desc">
                      {isTr ? 'Ağır kullanım ve profesyoneller için maksimum token kotası.' : 'Maximum token allowance and turbo execution speed.'}
                    </p>
                    <div className="account-upgrade-price-wrap">
                      <span className="account-upgrade-currency">$</span>
                      <span className="account-upgrade-amount">
                        {packageBillingCycle === 'annual' ? '149.90' : '14.99'}
                      </span>
                      <span className="account-upgrade-period">
                        {packageBillingCycle === 'annual' ? (isTr ? '/ yıl' : '/ year') : (isTr ? '/ ay' : '/ month')}
                      </span>
                    </div>
                    <div className="account-upgrade-price-detail is-highlight-purple">
                      {packageBillingCycle === 'annual' 
                        ? (isTr ? '🎁 2 Ay Bedava (Aylık ~$12.49)' : '🎁 2 Months Free (~$12.49/mo)')
                        : (isTr ? 'Aylık faturalandırılır ($14.99/ay)' : 'Billed monthly at $14.99/mo')}
                    </div>
                  </div>

                  <ul className="account-upgrade-features-list">
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-purple"><Check size={13} /></div>
                      <span><strong>Free tools free forever:</strong> {isTr ? 'Tüm ücretsiz araçlar sınırsız' : 'Unlimited free tools'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-purple"><Check size={13} /></div>
                      <span><strong>Maksimum Token Kotası:</strong> {isTr ? 'Tüm premium araçlarda tam güç' : 'Maximum token quota'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-purple"><Check size={13} /></div>
                      <span><strong>Turbo WASM & WebGPU:</strong> {isTr ? 'En yüksek donanım ivmesi' : 'Hardware-accelerated processing'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-purple"><Check size={13} /></div>
                      <span><strong>VIP Destek:</strong> {isTr ? '7/24 öncelikli kanal' : '24/7 priority support'}</span>
                    </li>
                    <li className="account-upgrade-feature-item">
                      <div className="account-feature-check-icon icon-purple"><Check size={13} /></div>
                      <span>{isTr ? 'Yeni araçlara erken erişim' : 'Early access to upcoming tools'}</span>
                    </li>
                  </ul>

                  <div className="account-upgrade-card-footer">
                    {currentPlan === 'enterprise' || currentPlan === 'unlimited' ? (
                      <button
                        type="button"
                        onClick={openCustomerCenter}
                        className="account-current-plan-pill is-manage-btn"
                      >
                        <Check size={14} />
                        <span>{isTr ? 'Mevcut Planınız (Yönet)' : 'Active Plan (Manage)'}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={upgradingPlan === 'unlimited' || upgradingPlan === 'enterprise'}
                          onClick={() => handleUpgradePlan('unlimited')}
                          className="account-plan-action-btn btn-primary-turbo"
                        >
                          {upgradingPlan === 'unlimited' || upgradingPlan === 'enterprise' ? (
                            <Loader2 size={15} className="auth-spinner" />
                          ) : (
                            <>
                              <span>
                                {currentPlan === 'pro'
                                  ? (isTr ? "Unlimited'a Yükselt" : 'Upgrade to Unlimited')
                                  : (isTr ? "Unlimited'a Abone Ol" : 'Subscribe to Unlimited')}
                              </span>
                              <Zap size={14} />
                            </>
                          )}
                        </button>

                        {currentPlan === 'pro' && (
                          <button
                            type="button"
                            onClick={() => openCustomerCenter('overview')}
                            className="account-portal-shortcut-btn"
                            style={{
                              marginTop: '8px',
                              fontSize: '11px',
                              background: 'transparent',
                              border: 'none',
                              color: '#818cf8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              textDecoration: 'underline',
                              width: '100%'
                            }}
                          >
                            <ExternalLink size={12} />
                            <span>{isTr ? 'Paddle portalından prorated yükselt' : 'Upgrade via Paddle Portal (Prorated)'}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
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
                        {currentPlan === 'pro' ? 'Pro' : (currentPlan === 'enterprise' || currentPlan === 'unlimited') ? 'Unlimited' : (isTr ? 'Cerilas Kullanıcısı' : 'Cerilas Member')}
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
                              onClick={() => setDialogModal({
                                isOpen: true,
                                type: 'info',
                                badge: 'PDF',
                                title: isTr ? 'Fatura Hazırlanıyor' : 'Generating Invoice',
                                message: isTr ? `${inv.invoice_number} numaralı faturanız hazırlanıyor...` : `Generating PDF invoice ${inv.invoice_number}...`,
                                confirmText: isTr ? 'Tamam' : 'OK',
                                onConfirm: () => setDialogModal(prev => ({ ...prev, isOpen: false }))
                              })}
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

      {/* Downgrade Confirmation Modal */}
      {isDowngradeModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="account-dialog-backdrop"
          onClick={() => setIsDowngradeModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="account-dialog-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="account-dialog-close-btn"
              onClick={() => setIsDowngradeModalOpen(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="account-dialog-icon-wrap type-warning">
              <Calendar size={26} />
            </div>

            <div className="account-dialog-badge badge-amber">
              <span>{isTr ? 'Plan Değişikliği' : 'Subscription Update'}</span>
            </div>

            <h3 className="account-dialog-title">
              {isTr ? 'Ücretsiz Plana Geçiş (Downgrade)' : 'Downgrade to Free Plan'}
            </h3>

            <p className="account-dialog-desc">
              {isTr 
                ? 'Aboneliğinizi ücretsiz plana düşürmek üzeresiniz. Mevcut ödeme döneminiz korunacaktır.'
                : 'You are about to downgrade to the free plan. Your active paid period will be preserved.'}
            </p>

            {/* Highlighted Period End Box */}
            <div className="account-dialog-period-box">
              <div className="account-dialog-period-headline">
                <Clock size={17} />
                <span>
                  {isTr 
                    ? `Pro Üyeliğiniz ${formattedPeriodEndDate} Tarihine Kadar Devam Edecektir`
                    : `Your Pro Membership Will Continue Until ${formattedPeriodEndDate}`}
                </span>
              </div>

              <div className="account-dialog-period-list">
                <div className="account-dialog-period-row">
                  <span className="row-label">
                    <Calendar size={13} />
                    <span>{isTr ? 'Geçerlilik Bitiş Tarihi:' : 'Access Valid Until:'}</span>
                  </span>
                  <span className="row-value val-highlight">{formattedPeriodEndDate}</span>
                </div>
                <div className="account-dialog-period-row">
                  <span className="row-label">
                    <CreditCard size={13} />
                    <span>{isTr ? 'Otomatik Yenileme:' : 'Auto-Renewal:'}</span>
                  </span>
                  <span className="row-value">{isTr ? 'Durdurulacak ($0.00)' : 'Cancelled ($0.00)'}</span>
                </div>
                <div className="account-dialog-period-row">
                  <span className="row-label">
                    <ShieldCheck size={13} />
                    <span>{isTr ? 'Sonraki Plan:' : 'Future Plan:'}</span>
                  </span>
                  <span className="row-value">{isTr ? 'Forever Free (Ücretsiz)' : 'Forever Free'}</span>
                </div>
              </div>
            </div>

            <ul className="account-dialog-perks">
              <li className="account-dialog-perk-item">
                <div className="account-dialog-perk-icon"><Check size={11} /></div>
                <span><strong>{formattedPeriodEndDate}</strong> {isTr ? 'tarihine kadar tüm Pro ayrıcalıklarınız ve token limitleriniz kesintisiz aktiftir.' : 'until this date, all Pro features and quotas remain fully active.'}</span>
              </li>
              <li className="account-dialog-perk-item">
                <div className="account-dialog-perk-icon"><Check size={11} /></div>
                <span>{isTr ? 'Belirtilen tarihe kadar kartınızdan herhangi bir ek yenileme ücreti çekilmeyecektir.' : 'No recurring renewal charges will be made to your payment method.'}</span>
              </li>
              <li className="account-dialog-perk-item">
                <div className="account-dialog-perk-icon"><Check size={11} /></div>
                <span>{isTr ? 'Dönem sonunda hesabınız otomatik olarak ücretsiz plana geçecektir.' : 'At period end, your account will smoothly switch to the Free plan.'}</span>
              </li>
            </ul>

            <div className="account-dialog-actions">
              <button
                type="button"
                onClick={() => setIsDowngradeModalOpen(false)}
                className="account-dialog-btn btn-cancel"
              >
                {isTr ? "Vazgeç (Pro'da Kal)" : 'Keep Pro Plan'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDowngrade}
                disabled={upgradingPlan === 'free'}
                className="account-dialog-btn btn-confirm-warning"
              >
                {upgradingPlan === 'free' ? (
                  <Loader2 size={15} className="auth-spinner" />
                ) : (
                  <>
                    <ExternalLink size={14} />
                    <span>{isTr ? "Paddle Portalını Aç ve Onayla" : 'Confirm & Open Paddle Portal'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Universal Alert / Confirm Modal */}
      {dialogModal.isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="account-dialog-backdrop"
          onClick={() => setDialogModal(prev => ({ ...prev, isOpen: false }))}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="account-dialog-card"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="account-dialog-close-btn"
              onClick={() => setDialogModal(prev => ({ ...prev, isOpen: false }))}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className={`account-dialog-icon-wrap type-${dialogModal.type || 'info'}`}>
              {dialogModal.type === 'success' ? <CheckCircle2 size={26} /> :
               dialogModal.type === 'danger' ? <AlertCircle size={26} /> :
               dialogModal.type === 'warning' ? <AlertTriangle size={26} /> :
               <ShieldCheck size={26} />}
            </div>

            {dialogModal.badge && (
              <div className={`account-dialog-badge badge-${dialogModal.type === 'warning' ? 'amber' : 'cyan'}`}>
                <span>{dialogModal.badge}</span>
              </div>
            )}

            <h3 className="account-dialog-title">
              {dialogModal.title}
            </h3>

            <p className="account-dialog-desc">
              {dialogModal.message}
            </p>

            <div className="account-dialog-actions">
              {dialogModal.cancelText && (
                <button
                  type="button"
                  onClick={() => setDialogModal(prev => ({ ...prev, isOpen: false }))}
                  className="account-dialog-btn btn-cancel"
                >
                  {dialogModal.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (typeof dialogModal.onConfirm === 'function') {
                    dialogModal.onConfirm();
                  } else {
                    setDialogModal(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className={`account-dialog-btn btn-confirm-${dialogModal.type === 'warning' ? 'warning' : dialogModal.type === 'danger' ? 'danger' : 'primary'}`}
              >
                {dialogModal.confirmText || (isTr ? 'Tamam' : 'OK')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
