import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import ToolsView from './views/ToolsView';
import ToolDetailView from './views/ToolDetailView';
import OverviewView from './views/OverviewView';
import AnalyticsView from './views/AnalyticsView';
import SystemHealthView from './views/SystemHealthView';
import ScrapersView from './views/ScrapersView';
import AdminLogin from './AdminLogin';
import { getAllRegisteredTools } from '../tools/registry';
import './AdminDashboard.css';

export default function AdminDashboard() {
  // Authentication state
  const [authUser, setAuthUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Default tab is 'tools' as requested: "First item in the sidebar is Tools, showing the tools catalog on load"
  const [currentTab, setCurrentTab] = useState('tools');
  const [selectedToolSlug, setSelectedToolSlug] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tools, setTools] = useState(() => getAllRegisteredTools());
  const [statsOverview, setStatsOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hash-based deep link routing (e.g. #/tools/:slug or #/analytics)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '';
      const toolMatch = hash.match(/#(?:(?:\/admin)?\/tools\/)([^/?#]+)/);
      if (toolMatch && toolMatch[1]) {
        setSelectedToolSlug(toolMatch[1]);
        setCurrentTab('tools');
        return;
      }
      
      const tabMatch = hash.match(/#(?:(?:\/admin)?\/)(overview|analytics|system|tools|scrapers)/);
      if (tabMatch && tabMatch[1]) {
        setCurrentTab(tabMatch[1]);
        setSelectedToolSlug(null);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Verify authentication status with backend
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        if (isMounted) {
          setAuthUser(null);
          setAuthChecking(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (isMounted) {
          if (res.ok && json.authenticated && json.user) {
            setAuthUser(json.user);
          } else {
            localStorage.removeItem('admin_token');
            setAuthUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth verification network error:', err);
        if (isMounted) {
          localStorage.removeItem('admin_token');
          setAuthUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    };

    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch telemetry and stats
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tools/stats/overview');
        const json = await res.json();
        if (isMounted && json.status === 'success' && json.data) {
          setStatsOverview(json.data);
        }
      } catch (err) {
        console.warn('Could not fetch overview stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Merge registered manifest tools with real-time database stats
  const mergedTools = useMemo(() => {
    const dbStatsMap = {};
    if (statsOverview && Array.isArray(statsOverview.tools)) {
      statsOverview.tools.forEach(st => {
        dbStatsMap[st.slug] = st;
      });
    }

    return tools.map(tool => {
      const dbStat = dbStatsMap[tool.slug] || {};
      const uniqueVisitors = dbStat.unique_visitors_count !== undefined 
        ? dbStat.unique_visitors_count 
        : (tool.unique_visitors_count || 0);
      const views = dbStat.view_count !== undefined
        ? dbStat.view_count
        : (tool.view_count || 0);
      const downloads = dbStat.download_count !== undefined ? dbStat.download_count : (tool.download_count || 0);
      const copies = dbStat.copy_count !== undefined ? dbStat.copy_count : (tool.copy_count || 0);
      const uses = dbStat.use_count !== undefined ? dbStat.use_count : (tool.use_count || 0);
      const totalTasks = downloads + copies + uses;

      const cvr = dbStat.total_cvr !== undefined
        ? dbStat.total_cvr
        : (uniqueVisitors > 0 ? ((totalTasks / uniqueVisitors) * 100).toFixed(1) : 0);

      return {
        ...tool,
        unique_visitors_count: uniqueVisitors,
        view_count: views,
        download_count: downloads,
        copy_count: copies,
        use_count: uses,
        total_tasks: totalTasks,
        cvr: cvr,
        is_active: tool.is_active !== undefined ? tool.is_active : true
      };
    });
  }, [tools, statsOverview]);

  const selectedTool = useMemo(() => {
    if (!selectedToolSlug) return null;
    return mergedTools.find(t => t.slug === selectedToolSlug) || null;
  }, [mergedTools, selectedToolSlug]);

  // Set document title dynamically
  useEffect(() => {
    if (selectedTool) {
      document.title = `${selectedTool.title} | Admin - Cerilas Tools`;
    } else {
      document.title = 'Cerilas Tools - Admin Suite';
    }
  }, [selectedTool, currentTab]);

  const liveVisitors = statsOverview?.liveVisitors || 1;

  const handleSelectTool = (slug) => {
    setSelectedToolSlug(slug);
    setCurrentTab('tools');
    setIsSidebarOpen(false);
    window.location.hash = `#/tools/${slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToTools = () => {
    setSelectedToolSlug(null);
    setIsSidebarOpen(false);
    window.location.hash = '#/tools';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    setSelectedToolSlug(null);
    setIsSidebarOpen(false);
    window.location.hash = `#/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    if (currentTab === 'tools') {
      if (selectedToolSlug) {
        return (
          <ToolDetailView 
            tool={selectedTool} 
            onBack={handleBackToTools} 
          />
        );
      }
      return (
        <ToolsView 
          tools={mergedTools} 
          statsOverview={statsOverview} 
          loading={loading}
          onSelectTool={handleSelectTool}
        />
      );
    }

    switch (currentTab) {
      case 'overview':
        return (
          <OverviewView 
            statsOverview={statsOverview} 
            tools={mergedTools} 
            onSelectToolTab={() => handleSelectTab('tools')} 
          />
        );
      case 'analytics':
        return (
          <AnalyticsView 
            statsOverview={statsOverview} 
            tools={mergedTools} 
          />
        );
      case 'system':
        return <SystemHealthView />;
      case 'scrapers':
        return <ScrapersView />;
      default:
        return (
          <ToolsView 
            tools={mergedTools} 
            statsOverview={statsOverview} 
            loading={loading}
            onSelectTool={handleSelectTool}
          />
        );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAuthUser(null);
  };

  // 1. Loading verification state
  if (authChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-color, #09090b)',
        color: 'var(--text-main, #f8fafc)',
        gap: '1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'adminSpin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted, #94a3b8)' }}>
          Yönetici yetkisi kontrol ediliyor...
        </span>
      </div>
    );
  }

  // 2. Unauthenticated state: Render Apple minimalist login page
  if (!authUser) {
    return <AdminLogin onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  return (
    <div className="admin-layout">
      {/* 1. Left Navigation Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        totalToolsCount={tools.length}
        activeToolsCount={tools.length}
      />

      {/* 2. Main Admin Workspace */}
      <div className="admin-main">
        <AdminHeader
          currentTab={currentTab}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          liveVisitors={liveVisitors}
          selectedToolTitle={selectedTool ? selectedTool.title : null}
          onBackToTools={handleBackToTools}
          authUser={authUser}
          onLogout={handleLogout}
        />

        {/* 3. Render Active View */}
        <main style={{ flexGrow: 1 }}>
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}
