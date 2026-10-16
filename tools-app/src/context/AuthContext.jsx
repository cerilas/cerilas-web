import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cerilas_tools_user_token';
const USER_KEY = 'cerilas_tools_user_profile';
const ALL_TOKEN_KEYS = [
  'cerilas_tools_user_token',
  'cerilas_tools_auth_token',
  'cerilas_user_token',
  'cerilas_auth_token',
  'token'
];

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  for (const k of ALL_TOKEN_KEYS) {
    try {
      const val = localStorage.getItem(k);
      if (val && typeof val === 'string' && val.trim().length > 15) {
        return val.trim();
      }
    } catch (e) {}
  }
  return null;
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.email)) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

const isAllowedAuthOrigin = (origin) => {
  if (!origin) return true;
  if (origin === window.location.origin) return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  if (origin.endsWith('.cerilas.com') || origin === 'https://cerilas.com') return true;
  return false;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken() && !getStoredUser()));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [authRedirectTab, setAuthRedirectTab] = useState(null);

  // Fetch current user from server using stored token
  const fetchCurrentUser = useCallback(async (jwtToken) => {
    const activeToken = jwtToken || getStoredToken();
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

      if (res.status === 401) {
        // Token is truly expired or invalid
        ALL_TOKEN_KEYS.forEach(k => {
          try { localStorage.removeItem(k); } catch (e) {}
        });
        try { localStorage.removeItem(USER_KEY); } catch (e) {}
        setToken(null);
        setUser(null);
        return null;
      }

      if (!res.ok) {
        // Temporary server / network issue: retain session, do not wipe token or user!
        return null;
      }

      const data = await res.json();
      const verifiedUser = data.user || (data.authenticated ? data.user : null);
      if (verifiedUser) {
        setUser(verifiedUser);
        setToken(activeToken);
        ALL_TOKEN_KEYS.forEach(k => {
          try { localStorage.setItem(k, activeToken); } catch (e) {}
        });
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
        } catch (e) {}
        return verifiedUser;
      }
    } catch (err) {
      console.warn('Auth check warning:', err.message);
      // DO NOT wipe out user session on network / timeout errors
    } finally {
      setLoading(false);
    }
  }, []);

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
      throw new Error(data.error || 'Sign in failed.');
    }

    if (data.token) {
      ALL_TOKEN_KEYS.forEach(k => {
        try { localStorage.setItem(k, data.token); } catch (e) {}
      });
      if (data.user) {
        try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } catch (e) {}
      }
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data.user;
    } else {
      throw new Error('Invalid server response.');
    }
  };

  const requestPasswordReset = async (email, language = 'en') => {
    const res = await fetch('/api/auth/password/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, language })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  };

  const validateResetToken = async (resetToken, language = 'en') => {
    const res = await fetch('/api/auth/password/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, language })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.valid) {
      throw new Error(data.error || 'Invalid reset link.');
    }
    return data;
  };

  const resetPassword = async (resetToken, password, language = 'en') => {
    const res = await fetch('/api/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password, language })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      throw new Error(data.error || 'Password reset failed.');
    }
    storeRotatedSession(data);
    return data.user;
  };

  // The server revokes every older JWT on password change, so the returned token must replace the stored one.
  const changePassword = async ({ currentPassword, newPassword, language = 'en' }) => {
    const res = await fetch('/api/auth/password/change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, language })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      throw new Error(data.error || 'Password change failed.');
    }
    storeRotatedSession(data);
    return data;
  };

  function storeRotatedSession(data) {
    ALL_TOKEN_KEYS.forEach(k => {
      try { localStorage.setItem(k, data.token); } catch (e) {}
    });
    if (data.user) {
      try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } catch (e) {}
    }
    setToken(data.token);
    setUser(data.user);
  }

  // Register handler
  const register = async ({ email, password, first_name, last_name, phone }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name, last_name, phone })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    if (data.token) {
      ALL_TOKEN_KEYS.forEach(k => {
        try { localStorage.setItem(k, data.token); } catch (e) {}
      });
      if (data.user) {
        try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } catch (e) {}
      }
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data.user;
    } else {
      throw new Error('Invalid server response.');
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
      throw new Error(data.error || 'Google sign-in failed.');
    }

    if (data.token) {
      ALL_TOKEN_KEYS.forEach(k => {
        try { localStorage.setItem(k, data.token); } catch (e) {}
      });
      if (data.user) {
        try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } catch (e) {}
      }
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data.user;
    } else {
      throw new Error('Invalid server response.');
    }
  };

  // Google OAuth Popup flow
  const initiateGoogleAuth = async ({ mode = 'signin' } = {}) => {
    try {
      const stateParam = mode === 'link' && token ? `link_${token}` : 'user_auth';
      const res = await fetch(`/api/auth/google/url?state=${encodeURIComponent(stateParam)}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not get the Google authorization URL.');
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
          if (!isAllowedAuthOrigin(event.origin)) return;
          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            if (cleanupTimer) clearInterval(cleanupTimer);
            const { token: receivedToken, user: receivedUser } = event.data.data || {};
            if (receivedToken) {
              ALL_TOKEN_KEYS.forEach(k => {
                try { localStorage.setItem(k, receivedToken); } catch (e) {}
              });
              if (receivedUser) {
                try { localStorage.setItem(USER_KEY, JSON.stringify(receivedUser)); } catch (e) {}
              }
              setToken(receivedToken);
              setUser(receivedUser);
              setIsAuthModalOpen(false);
              resolve(receivedUser);
            }
          } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            if (cleanupTimer) clearInterval(cleanupTimer);
            reject(new Error(decodeURIComponent(event.data.error || 'Google sign-in could not be completed.')));
          }
        };

        window.addEventListener('message', messageListener);

        cleanupTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(cleanupTimer);
            window.removeEventListener('message', messageListener);
            setTimeout(() => {
              const currentStored = getStoredToken();
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
    if (!token) throw new Error('Not signed in.');
    const res = await fetch('/api/auth/google/unlink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not unlink Google account.');
    }

    setUser(data.user);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch (e) {}
    return data.user;
  };

  // Auto-listen to global window postMessage for Google Auth
  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (!isAllowedAuthOrigin(event.origin)) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token: receivedToken, user: receivedUser } = event.data.data || {};
        if (receivedToken) {
          ALL_TOKEN_KEYS.forEach(k => {
            try { localStorage.setItem(k, receivedToken); } catch (e) {}
          });
          if (receivedUser) {
            try { localStorage.setItem(USER_KEY, JSON.stringify(receivedUser)); } catch (e) {}
            setUser(receivedUser);
          }
          setToken(receivedToken);
          setIsAuthModalOpen(false);
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Logout handler
  const logout = () => {
    ALL_TOKEN_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    try { localStorage.removeItem(USER_KEY); } catch (e) {}
    setToken(null);
    setUser(null);
    if (window.location.hash.startsWith('#/account') || window.location.hash.startsWith('#/profile') || window.location.hash.startsWith('#/billing')) {
      window.location.hash = '#/';
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    if (!token) throw new Error('Not signed in.');

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
      throw new Error(data.error || 'Could not update profile.');
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
    if (!token) throw new Error('Not signed in.');

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
      throw new Error(data.error || 'Could not update billing details.');
    }

    setUser(data.user);
    return data.user;
  };

  // Upgrade Plan
  const upgradePlan = async (plan) => {
    if (!token) throw new Error('Not signed in.');

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
      throw new Error(data.error || 'Could not upgrade plan.');
    }

    setUser(data.user);
    return data.user;
  };

  // Schedule Downgrade (Retain Pro until period end date, then auto-switch to Free)
  const scheduleDowngrade = async (periodEndDate) => {
    if (!token) throw new Error('Not signed in.');

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
      throw new Error(data.error || 'Could not downgrade plan.');
    }

    setUser(data.user);
    return data;
  };

  // Resume Subscription (cancel scheduled downgrade)
  const resumeSubscription = async () => {
    if (!token) throw new Error('Not signed in.');

    const res = await fetch('/api/auth/resume-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not resume subscription.');
    }

    setUser(data.user);
    return data;
  };

  // Sync Plan with RevenueCat
  const syncPlan = async (plan = 'pro', force = true) => {
    if (!token) return null;

    const res = await fetch('/api/auth/sync-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan, force })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Plan senkronize edilemedi.');
    }

    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  // Get live subscription status
  const getSubscriptionStatus = async () => {
    if (!token) return null;

    const res = await fetch('/api/auth/subscription-status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) return null;
    return await res.json();
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
      throw new Error(data.error || 'Could not load invoices.');
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
    isAuthenticated: Boolean(user || token),
    login,
    register,
    requestPasswordReset,
    validateResetToken,
    resetPassword,
    changePassword,
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
    syncPlan,
    getSubscriptionStatus,
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
