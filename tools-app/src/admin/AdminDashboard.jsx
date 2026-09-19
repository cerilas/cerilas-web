import React, { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import ToolsView from './views/ToolsView';
import OverviewView from './views/OverviewView';
import AnalyticsView from './views/AnalyticsView';
import SystemHealthView from './views/SystemHealthView';
import { getAllRegisteredTools } from '../tools/registry';
import './AdminDashboard.css';

export default function AdminDashboard() {
  // Default tab is 'tools' as requested: "Sol menüdeki ilk item Tools olacak, girince tools'ların listesi çıkacak"
  const [currentTab, setCurrentTab] = useState('tools');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tools, setTools] = useState(() => getAllRegisteredTools());
  const [statsOverview, setStatsOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set document title for Admin
  useEffect(() => {
    document.title = 'Cerilas Tools - Admin Suite';
  }, [currentTab]);

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

  const liveVisitors = statsOverview?.liveVisitors || 1;

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'tools':
        return (
          <ToolsView 
            tools={tools} 
            statsOverview={statsOverview} 
            loading={loading} 
          />
        );
      case 'overview':
        return (
          <OverviewView 
            statsOverview={statsOverview} 
            tools={tools} 
            onSelectToolTab={() => setCurrentTab('tools')} 
          />
        );
      case 'analytics':
        return (
          <AnalyticsView 
            statsOverview={statsOverview} 
            tools={tools} 
          />
        );
      case 'system':
        return <SystemHealthView />;
      default:
        return (
          <ToolsView 
            tools={tools} 
            statsOverview={statsOverview} 
            loading={loading} 
          />
        );
    }
  };

  return (
    <div className="admin-layout">
      {/* 1. Left Navigation Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
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
        />

        {/* 3. Render Active View */}
        <main style={{ flexGrow: 1 }}>
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}
