import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const GrowthContext = createContext(null);

export function GrowthProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, search, ai-visibility, local, competitors, content, technical, distribution, reports, settings
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [error, setError] = useState('');

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
        throw new Error(data.error || 'Çalışma alanları alınamadı.');
      }

      const list = data.data || [];
      setWorkspaces(list);

      if (list.length > 0) {
        let selected = null;
        if (preferSlug) {
          selected = list.find(w => w.slug === preferSlug || String(w.id) === preferSlug);
        }
        if (!selected) {
          // Check saved workspace slug from localStorage
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
        setIsOnboardingOpen(true);
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
      // Update URL hash / path
      window.location.hash = `#/growth/${ws.slug}/${activeTab}`;
    }
  };

  const value = {
    workspaces,
    activeWorkspace,
    activeTab,
    loading,
    error,
    isOnboardingOpen,
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
