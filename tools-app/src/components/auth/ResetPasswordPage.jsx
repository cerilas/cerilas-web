import React, { useEffect, useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import './AuthModal.css';

const MIN_PASSWORD_LENGTH = 8;

function readTokenFromUrl() {
  if (typeof window === 'undefined') return '';
  const fromSearch = new URLSearchParams(window.location.search).get('token');
  if (fromSearch) return fromSearch;
  const hashQuery = window.location.hash.split('?')[1] || '';
  return new URLSearchParams(hashQuery).get('token') || '';
}

export default function ResetPasswordPage() {
  const { validateResetToken, resetPassword } = useAuth();
  const { language } = useTranslation();
  const isTr = language === 'tr';

  const [resetToken] = useState(readTokenFromUrl);
  const [status, setStatus] = useState(resetToken ? 'checking' : 'invalid');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = isTr ? 'Şifre Sıfırla | Cerilas' : 'Reset Password | Cerilas';
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex, nofollow');
  }, [isTr]);

  useEffect(() => {
    // Keep the one-time token out of browser history and Referer headers.
    if (resetToken) window.history.replaceState(null, '', '/reset-password');
  }, [resetToken]);

  useEffect(() => {
    if (!resetToken) return;
    let cancelled = false;
    validateResetToken(resetToken, language)
      .then((data) => {
        if (cancelled) return;
        setMaskedEmail(data.email || '');
        setStatus('form');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('invalid');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(isTr ? `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError(isTr ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, password, language);
      setStatus('done');
    } catch (err) {
      setError(err.message || (isTr ? 'Şifre güncellenemedi.' : 'Could not update your password.'));
    } finally {
      setLoading(false);
    }
  };

  const requestNewLink = () => {
    window.location.href = '/#/forgot-password';
  };

  const titles = {
    checking: isTr ? 'Bağlantı kontrol ediliyor' : 'Checking your link',
    invalid: isTr ? 'Bağlantı geçersiz' : 'Link expired or invalid',
    form: isTr ? 'Yeni şifre belirleyin' : 'Choose a new password',
    done: isTr ? 'Şifreniz güncellendi' : 'Password updated'
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-modal-container">
        <div className="auth-modal-header">
          <div className="auth-modal-logo-wrap">
            <img
              src="/cgrowthlogo.svg"
              alt="Cerilas"
              className="auth-modal-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/platform-logo.webp';
              }}
            />
          </div>
          <h1 className="auth-modal-title">{titles[status]}</h1>
          {status === 'form' && maskedEmail && (
            <p className="auth-modal-subtitle">
              {isTr ? `${maskedEmail} hesabı için yeni şifrenizi girin.` : `Enter a new password for ${maskedEmail}.`}
            </p>
          )}
        </div>

        {error && (
          <div className="auth-modal-error">
            <AlertCircle size={16} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {status === 'checking' && (
          <div className="auth-reset-notice" role="status">
            <Loader2 size={20} className="auth-spinner" />
            <p>{isTr ? 'Lütfen bekleyin...' : 'Please wait...'}</p>
          </div>
        )}

        {status === 'invalid' && (
          <button type="button" className="auth-submit-btn" onClick={requestNewLink}>
            <span>{isTr ? 'Yeni Bağlantı İste' : 'Request a New Link'}</span>
            <ArrowRight size={16} />
          </button>
        )}

        {status === 'form' && (
          <form onSubmit={handleSubmit} className="auth-modal-form">
            <div className="auth-input-group">
              <label className="auth-input-label">{isTr ? 'Yeni Şifre' : 'New Password'}</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  className="auth-input auth-password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="auth-input-group">
              <label className="auth-input-label">{isTr ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password'}</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? (
                <>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>{isTr ? 'Kaydediliyor...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <span>{isTr ? 'Şifreyi Güncelle' : 'Update Password'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {status === 'done' && (
          <>
            <div className="auth-reset-notice" role="status">
              <CheckCircle2 size={20} className="auth-reset-notice-icon" />
              <p>
                {isTr
                  ? 'Yeni şifrenizle giriş yaptınız. Diğer cihazlardaki oturumlarınız güvenlik için kapatıldı.'
                  : "You're now signed in with your new password. Sessions on your other devices were signed out for security."}
              </p>
            </div>
            <button type="button" className="auth-submit-btn" style={{ marginTop: '1rem' }} onClick={() => { window.location.href = '/growth'; }}>
              <span>{isTr ? 'GrowthControl’e Devam Et' : 'Continue to GrowthControl'}</span>
              <ArrowRight size={16} />
            </button>
            <p className="auth-switch-text" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <a className="auth-inline-switch-btn" href="/">{isTr ? 'Ücretsiz araçlara git' : 'Go to free tools'}</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
