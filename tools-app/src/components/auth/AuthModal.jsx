import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import './AuthModal.css';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    authModalMode, 
    closeAuthModal, 
    setAuthModalMode, 
    login, 
    register,
    initiateGoogleAuth,
    authRedirectTab 
  } = useAuth();
  
  const { language } = useTranslation();
  const isTr = language === 'tr';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthModalOpen) {
      setError('');
      // Lock background scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthModalOpen, authModalMode]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await initiateGoogleAuth({ mode: 'signin' });
      if (authRedirectTab) {
        window.location.hash = `#/account?tab=${authRedirectTab}`;
      } else {
        window.location.hash = '#/account';
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      setError(err.message || (isTr ? 'Google ile oturum açılamadı.' : 'Failed to sign in with Google.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError(isTr ? 'Lütfen e-posta ve şifrenizi girin.' : 'Please enter your email and password.');
      return;
    }

    if (authModalMode === 'register' && password.length < 6) {
      setError(isTr ? 'Şifre en az 6 karakter olmalıdır.' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (authModalMode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({
          email: email.trim(),
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim()
        });
      }

      // If user came from a specific tab request (e.g. #/account?tab=billing), route them there
      if (authRedirectTab) {
        window.location.hash = `#/account?tab=${authRedirectTab}`;
      } else {
        window.location.hash = '#/account';
      }
    } catch (err) {
      setError(err.message || (isTr ? 'İşlem sırasında bir hata oluştu.' : 'An error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div 
        className="auth-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="auth-modal-close-btn" 
          onClick={closeAuthModal}
          aria-label="Kapat"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-logo-wrap">
            <img 
              src="/platform-logo.webp" 
              alt="Cerilas" 
              className="auth-modal-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/platform-logo.png';
              }}
            />
          </div>
          <h2 className="auth-modal-title">
            {authModalMode === 'login' ? (isTr ? 'Tekrar Hoş Geldiniz' : 'Welcome Back') : (isTr ? 'Cerilas Hesabı Oluşturun' : 'Create Cerilas Account')}
          </h2>
          <p className="auth-modal-subtitle">
            {authModalMode === 'login' 
              ? (isTr ? 'Araçlarınıza ve üyeliğinize erişmek için giriş yapın.' : 'Sign in to access your tools, profile, and subscription.') 
              : (isTr ? 'Gelişmiş araçlar ve sınırsız limitler için hemen katılın.' : 'Join to manage your plan, verify your phone, and access billing.')}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="auth-modal-tabs">
            <button
              type="button"
              className={`auth-modal-tab ${authModalMode === 'login' ? 'is-active' : ''}`}
              onClick={() => {
                setAuthModalMode('login');
                setError('');
              }}
            >
              {isTr ? 'Giriş Yap' : 'Sign In'}
            </button>
            <button
              type="button"
              className={`auth-modal-tab ${authModalMode === 'register' ? 'is-active' : ''}`}
              onClick={() => {
                setAuthModalMode('register');
                setError('');
              }}
            >
              {isTr ? 'Kayıt Ol' : 'Sign Up'}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="auth-modal-error">
            <AlertCircle size={16} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <div className="auth-social-area">
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <Loader2 size={17} className="auth-spinner" />
            ) : (
              <svg className="auth-google-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
              </svg>
            )}
            <span className="auth-google-text">
              {authModalMode === 'login'
                ? (isTr ? 'Google ile Giriş Yap' : 'Sign in with Google')
                : (isTr ? 'Google ile Kayıt Ol' : 'Sign up with Google')}
            </span>
          </button>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-label">
              {isTr ? 'veya e-posta ile' : 'or with email'}
            </span>
            <span className="auth-divider-line" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-modal-form">
          {authModalMode === 'register' && (
            <div className="auth-input-row">
              <div className="auth-input-group">
                <label className="auth-input-label">{isTr ? 'Ad' : 'First Name'}</label>
                <div className="auth-input-wrapper">
                  <User size={16} className="auth-field-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder={isTr ? 'Adınız' : 'John'}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div className="auth-input-group">
                <label className="auth-input-label">{isTr ? 'Soyad' : 'Last Name'}</label>
                <div className="auth-input-wrapper">
                  <User size={16} className="auth-field-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder={isTr ? 'Soyadınız' : 'Doe'}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-input-label">{isTr ? 'E-posta Adresi' : 'Email Address'}</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-field-icon" />
              <input
                type="email"
                required
                className="auth-input"
                placeholder="ornek@cerilas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div className="auth-input-group">
              <label className="auth-input-label">
                {isTr ? 'Telefon Numarası' : 'Phone Number'}
                <span className="auth-label-hint">({isTr ? 'SMS doğrulaması için' : 'For SMS verification'})</span>
              </label>
              <div className="auth-input-wrapper">
                <Phone size={16} className="auth-field-icon" />
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="05xx xxx xx xx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <div className="auth-label-row">
              <label className="auth-input-label">{isTr ? 'Şifre' : 'Password'}</label>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="auth-input auth-password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={authModalMode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="auth-spinner" />
                <span>{isTr ? 'Lütfen bekleyin...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <span>
                  {authModalMode === 'login' ? (isTr ? 'Giriş Yap' : 'Sign In') : (isTr ? 'Hesap Oluştur' : 'Create Account')}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Modal Footer */}
        <div className="auth-modal-footer">
          <div className="auth-security-badge">
            <ShieldCheck size={14} />
            <span>{isTr ? 'Uçtan Uca Güvenli & Şifreli Kimlik Doğrulama' : 'End-to-End Encrypted & Zero-Knowledge Security'}</span>
          </div>

          <p className="auth-switch-text">
            {authModalMode === 'login' ? (
              <>
                {isTr ? 'Henüz bir hesabınız yok mu?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  className="auth-inline-switch-btn"
                  onClick={() => {
                    setAuthModalMode('register');
                    setError('');
                  }}
                >
                  {isTr ? 'Hemen Üye Olun' : 'Sign up now'}
                </button>
              </>
            ) : (
              <>
                {isTr ? 'Zaten bir hesabınız var mı?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  className="auth-inline-switch-btn"
                  onClick={() => {
                    setAuthModalMode('login');
                    setError('');
                  }}
                >
                  {isTr ? 'Giriş Yapın' : 'Sign in'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
