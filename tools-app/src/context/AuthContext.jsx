import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cerilas_tools_user_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [authRedirectTab, setAuthRedirectTab] = useState(null);

  // Fetch current user from server using stored token
  const fetchCurrentUser = useCallback(async (jwtToken) => {
    const activeToken = jwtToken || token;
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });

      if (!res.ok) {
        throw new Error('Token expired or invalid');
      }

      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        return data.user;
      } else {
        throw new Error('User not found');
      }
    } catch (err) {
      console.warn('Auth check failed:', err.message);
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (e) {}
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Login handler
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Giriş yapılamadı.');
    }

    if (data.token) {
      try {
        localStorage.setItem(TOKEN_KEY, data.token);
      } catch (e) {}
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data.user;
    } else {
      throw new Error('Geçersiz sunucu yanıtı.');
    }
  };

  // Register handler
  const register = async ({ email, password, first_name, last_name, phone }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name, last_name, phone })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Kayıt işlemi başarısız.');
    }

    if (data.token) {
      try {
        localStorage.setItem(TOKEN_KEY, data.token);
      } catch (e) {}
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data.user;
    } else {
      throw new Error('Geçersiz sunucu yanıtı.');
    }
  };

  // Google sign in with credential / code
  const loginWithGoogle = async ({ credential, code }) => {
    const res = await fetch('/api/auth/google/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, code })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google ile giriş başarısız oldu.');
    }

    if (data.token) {
      try {
        localStorage.setItem(TOKEN_KEY, data.token);
      } catch (e) {}
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data.user;
    } else {
      throw new Error('Geçersiz sunucu yanıtı.');
    }
  };

  // Google OAuth Popup flow
  const initiateGoogleAuth = async ({ mode = 'signin' } = {}) => {
    try {
      const stateParam = mode === 'link' && token ? `link_${token}` : 'user_auth';
      const res = await fetch(`/api/auth/google/url?state=${encodeURIComponent(stateParam)}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Google yetkilendirme adresi alınamadı.');
      }

      const width = 520;
      const height = 640;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

      return new Promise((resolve, reject) => {
        const popup = window.open(
          data.url,
          'CerilasGoogleAuth',
          `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0,location=1`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // If popup is blocked by browser, redirect current window
          window.location.href = data.url;
          return;
        }

        let cleanupTimer = null;
        const messageListener = (event) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            if (cleanupTimer) clearInterval(cleanupTimer);
            const { token: receivedToken, user: receivedUser } = event.data.data || {};
            if (receivedToken) {
              try {
                localStorage.setItem(TOKEN_KEY, receivedToken);
              } catch (e) {}
              setToken(receivedToken);
              setUser(receivedUser);
              setIsAuthModalOpen(false);
              resolve(receivedUser);
            }
          } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            if (cleanupTimer) clearInterval(cleanupTimer);
            reject(new Error(decodeURIComponent(event.data.error || 'Google ile işlem tamamlanamadı.')));
          }
        };

        window.addEventListener('message', messageListener);

        cleanupTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(cleanupTimer);
            window.removeEventListener('message', messageListener);
            setTimeout(() => {
              const currentStored = localStorage.getItem(TOKEN_KEY);
              if (currentStored) {
                fetchCurrentUser(currentStored).then((u) => {
                  if (u) resolve(u);
                });
              }
            }, 300);
          }
        }, 800);
      });
    } catch (err) {
      console.error('Google auth initiation error:', err);
      throw err;
    }
  };

  // Unlink Google account
  const unlinkGoogleAccount = async () => {
    if (!token) throw new Error('Oturum açılmamış.');
    const res = await fetch('/api/auth/google/unlink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google hesabı bağlantısı kaldırılamadı.');
    }

    setUser(data.user);
    return data.user;
  };

  // Auto-listen to global window postMessage for Google Auth
  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token: receivedToken, user: receivedUser } = event.data.data || {};
        if (receivedToken && receivedUser) {
          try {
            localStorage.setItem(TOKEN_KEY, receivedToken);
          } catch (e) {}
          setToken(receivedToken);
          setUser(receivedUser);
          setIsAuthModalOpen(false);
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Logout handler
  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    setToken(null);
    setUser(null);
    if (window.location.hash.startsWith('#/account') || window.location.hash.startsWith('#/profile') || window.location.hash.startsWith('#/billing')) {
      window.location.hash = '#/';
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    if (!token) throw new Error('Oturum açılmamış.');

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Profil güncellenemedi.');
    }

    setUser(data.user);
    return data.user;
  };

  // Send SMS OTP code
  const sendPhoneOtp = async (phone) => {
    if (!token) throw new Error('You must be signed in.');

    const res = await fetch('/api/auth/phone/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ phone })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send SMS verification code.');
    }

    return data;
  };

  // Verify SMS OTP code
  const verifyPhoneOtp = async (phone, code) => {
    if (!token) throw new Error('You must be signed in.');

    const res = await fetch('/api/auth/phone/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ phone, code })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to verify verification code.');
    }

    setUser(data.user);
    return data;
  };

  // Update billing details
  const updateBilling = async (billingData) => {
    if (!token) throw new Error('Oturum açılmamış.');

    const res = await fetch('/api/auth/billing', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(billingData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Fatura bilgileri güncellenemedi.');
    }

    setUser(data.user);
    return data.user;
  };

  // Upgrade Plan
  const upgradePlan = async (plan) => {
    if (!token) throw new Error('Oturum açılmamış.');

    const res = await fetch('/api/auth/upgrade-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Plan yükseltilemedi.');
    }

    setUser(data.user);
    return data.user;
  };

  // Schedule Downgrade (Retain Pro until period end date, then auto-switch to Free)
  const scheduleDowngrade = async (periodEndDate) => {
    if (!token) throw new Error('Oturum açılmamış.');

    const res = await fetch('/api/auth/schedule-downgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ periodEndDate })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Downgrade işlemi gerçekleştirilemedi.');
    }

    setUser(data.user);
    return data;
  };

  // Resume Subscription (cancel scheduled downgrade)
  const resumeSubscription = async () => {
    if (!token) throw new Error('Oturum açılmamış.');

    const res = await fetch('/api/auth/resume-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Abonelik sürdürülemedi.');
    }

    setUser(data.user);
    return data;
  };

  // Fetch Invoices
  const getInvoices = async () => {
    if (!token) return [];

    const res = await fetch('/api/auth/invoices', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Faturalar alınamadı.');
    }

    return data.invoices || [];
  };

  // Open / Close modal helpers
  const openAuthModal = (mode = 'login', redirectTab = null) => {
    setAuthModalMode(mode);
    setAuthRedirectTab(redirectTab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthRedirectTab(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    initiateGoogleAuth,
    unlinkGoogleAccount,
    logout,
    updateProfile,
    sendPhoneOtp,
    verifyPhoneOtp,
    updateBilling,
    upgradePlan,
    scheduleDowngrade,
    resumeSubscription,
    getInvoices,
    refreshUser: () => fetchCurrentUser(token),
    isAuthModalOpen,
    authModalMode,
    authRedirectTab,
    openAuthModal,
    closeAuthModal,
    setAuthModalMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
