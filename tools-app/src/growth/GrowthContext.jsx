import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRevenueCat } from '../context/RevenueCatContext';
import { getClientPlanLimits, GROWTH_PLAN_CONFIG } from './utils/growthPlanConfig';

const GrowthContext = createContext(null);

export function GrowthProvider({ children }) {
  const { token, isAuthenticated, user } = useAuth();
  const { 
    isPro: isRcPro, 
    isUnlimited: isRcUnlimited, 
    effectivePlan: rcEffectivePlan,
    presentPaywall 
  } = useRevenueCat() || {};

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [error, setError] = useState('');

  // Real-time limits & daily usage from backend
  const [limitsSummary, setLimitsSummary] = useState(null);
  const [loadingLimits, setLoadingLimits] = useState(false);

  // Compute effective user plan ('free' | 'pro' | 'unlimited')
  const plan = useMemo(() => {
    // 1. RevenueCat derived plan
    if (rcEffectivePlan) return rcEffectivePlan;
    if (isRcUnlimited) return 'unlimited';
    if (isRcPro) return 'pro';

    // 2. Database user object
    const userPlan = (user?.plan || '').toLowerCase();
    if (userPlan === 'unlimited' || userPlan === 'enterprise') return 'unlimited';
    if (userPlan === 'pro') return 'pro';

    return 'free';
  }, [rcEffectivePlan, isRcUnlimited, isRcPro, user?.plan]);

  const planLimits = useMemo(() => {
    return getClientPlanLimits(plan);
  }, [plan]);

  const isFree = plan === 'free';
  const isPro = plan === 'pro' || plan === 'unlimited';
  const isUnlimited = plan === 'unlimited';

  // Can add workspace check (Free: 1, Pro: 3, Unlimited: Infinity)
  const canAddWorkspace = useMemo(() => {
    if (planLimits.workspaces === Infinity) return true;
    return (workspaces?.length || 0) < planLimits.workspaces;
  }, [workspaces?.length, planLimits.workspaces]);

  // Fetch workspaces for current user
  const fetchWorkspaces = useCallback(async (preferSlug = null) => {
    if (!token) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/growth/workspaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load workspaces.');
      }

      const list = data.data || [];
      setWorkspaces(list);

      if (list.length > 0) {
        let selected = null;
        if (preferSlug) {
          selected = list.find(w => w.slug === preferSlug || String(w.id) === preferSlug);
        }
        if (!selected) {
          const savedSlug = localStorage.getItem('cerilas_growth_active_workspace');
          if (savedSlug) {
            selected = list.find(w => w.slug === savedSlug);
          }
        }
        const finalSelected = selected || list[0];
        setActiveWorkspace(finalSelected);
        try {
          localStorage.setItem('cerilas_growth_active_workspace', finalSelected.slug);
        } catch (e) {}
      } else {
        setActiveWorkspace(null);
      }

      return list;
    } catch (err) {
      console.error('[GrowthContext] Error fetching workspaces:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Fetch limits summary for active workspace
  const fetchLimitsSummary = useCallback(async () => {
    if (!activeWorkspace?.id || !token) return null;
    setLoadingLimits(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/limits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setLimitsSummary(json.data);
        return json.data;
      }
    } catch (e) {
      console.warn('[GrowthContext] Fetch limits summary failed:', e);
    } finally {
      setLoadingLimits(false);
    }
    return null;
  }, [activeWorkspace?.id, token]);

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchLimitsSummary();
    }
  }, [activeWorkspace?.id, fetchLimitsSummary, plan]);

  // Switch workspace
  const switchWorkspace = (workspaceOrSlug) => {
    let ws = null;
    if (typeof workspaceOrSlug === 'string') {
      ws = workspaces.find(w => w.slug === workspaceOrSlug || String(w.id) === workspaceOrSlug);
    } else {
      ws = workspaceOrSlug;
    }

    if (ws) {
      setActiveWorkspace(ws);
      try {
        localStorage.setItem('cerilas_growth_active_workspace', ws.slug);
      } catch (e) {}
      window.location.hash = `#/growth/${ws.slug}/${activeTab}`;
    }
  };

  // Helper to trigger paywall with target plan recommendation
  const promptPaywall = useCallback((options = {}) => {
    if (typeof presentPaywall === 'function') {
      presentPaywall({
        defaultPackageId: options.plan || (plan === 'pro' ? 'unlimited' : 'pro'),
        ...options
      });
    } else {
      window.dispatchEvent(new CustomEvent('cerilas:open-paywall', { detail: options }));
    }
  }, [presentPaywall, plan]);

  const value = {
    workspaces,
    activeWorkspace,
    activeTab,
    loading,
    error,
    isOnboardingOpen,
    plan,
    planLimits,
    isFree,
    isPro,
    isUnlimited,
    canAddWorkspace,
    limitsSummary,
    loadingLimits,
    refreshLimits: fetchLimitsSummary,
    promptPaywall,
    presentPaywall: promptPaywall,
    setActiveTab,
    setIsOnboardingOpen,
    switchWorkspace,
    refreshWorkspaces: fetchWorkspaces
  };

  return <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>;
}

export function useGrowth() {
  const context = useContext(GrowthContext);
  if (!context) {
    throw new Error('useGrowth must be used within a GrowthProvider');
  }
  return context;
}
