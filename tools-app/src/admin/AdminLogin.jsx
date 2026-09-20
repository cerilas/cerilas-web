import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './AdminLogin.css';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
      }

      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        throw new Error('Geçersiz sunucu yanıtı.');
      }
    } catch (err) {
      setError(err.message || 'Giriş sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Background ambient lighting */}
      <div className="admin-login-ambient-orb orb-1" />
      <div className="admin-login-ambient-orb orb-2" />

      {/* Top action bar with theme toggle */}
      <div className="admin-login-topbar">
        <div className="admin-login-brand-tag">
          <ShieldCheck size={16} className="admin-login-brand-icon" />
          <span>Cerilas Admin Cloud</span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="admin-login-theme-btn"
          aria-label="Toggle Theme"
          title={isDark ? 'Açık Moda Geç' : 'Koyu Moda Geç'}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          {/* Logo & Header */}
          <div className="admin-login-header">
            <div className="admin-login-logo-wrap">
              <img
                src="/platform-logo.webp"
                alt="Cerilas"
                className="admin-login-logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/platform-logo.png';
                }}
              />
            </div>
            <h1 className="admin-login-title">Tools Yönetim Paneli</h1>
            <p className="admin-login-subtitle">
              cerilas.com/admin yetkili hesap bilgilerinizle oturum açın
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="admin-login-error" role="alert">
              <AlertCircle size={18} className="admin-login-error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-login-field">
              <label htmlFor="admin-email" className="admin-login-label">
                Yönetici E-posta
              </label>
              <div className="admin-login-input-wrap">
                <Mail size={18} className="admin-login-field-icon" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cerilas.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="admin-login-input"
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label htmlFor="admin-password" className="admin-login-label">
                Şifre
              </label>
              <div className="admin-login-input-wrap">
                <Lock size={18} className="admin-login-field-icon" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="admin-login-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="admin-login-spinner" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="admin-login-footer">
            <span className="admin-login-footer-badge">
              <span className="admin-login-footer-dot" />
              Merkezi Kimlik Doğrulama
            </span>
            <p className="admin-login-footer-text">
              Ana panelden (cerilas.com/admin) oluşturulan tüm hesaplar doğrudan yetkilendirilmiştir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
