import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  Sparkles, 
  Wrench, 
  Bot, 
  FileText, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Layers,
  Search,
  CheckCircle,
  XCircle,
  X,
  HelpCircle,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Code2,
  CheckSquare,
  Square,
  Globe,
  Network
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { SkeletonBlock } from '../components/GrowthSkeleton';

const TAB_NAME_MAP = {
  'ai-visibility': 'AI Visibility Engine (GEO)',
  'technical': 'Technical Audit & Issues',
  'search': 'Search Performance (GSC)',
  'directories': 'Directories & Distribution',
  'competitors': 'Competitor Intelligence',
  'analytics': 'Web Analytics (GA4)',
  'settings': 'Workspace & Integrations'
};

export default function GrowthActionFeed() {
  const { activeWorkspace, setActiveTab } = useGrowth();
  const { token } = useAuth();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [activeGuideOpp, setActiveGuideOpp] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Completed steps local & persisted mapping: { [oppId]: { [stepIndex]: boolean } }
  const [completedStepsMap, setCompletedStepsMap] = useState({});

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deleteConfirmOpp, setDeleteConfirmOpp] = useState(null);

  // New action form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('ai_visibility');
  const [newDescription, setNewDescription] = useState('');
  const [newImpact, setNewImpact] = useState(80);
  const [newEffort, setNewEffort] = useState(30);
  const [newStepsText, setNewStepsText] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [newLinkTab, setNewLinkTab] = useState('');
  const [newTrafficUpside, setNewTrafficUpside] = useState('+15–25% Growth');
  const [creatingAction, setCreatingAction] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOpportunities = async (silent = false) => {
    if (!activeWorkspace?.id || !token) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setOpportunities(json.data);
        
        // Populate completed steps from evidence
        const newStepsMap = {};
        json.data.forEach(opp => {
          if (opp.evidence?.completed_steps && typeof opp.evidence.completed_steps === 'object') {
            newStepsMap[opp.id] = opp.evidence.completed_steps;
          }
        });
        setCompletedStepsMap(prev => ({ ...prev, ...newStepsMap }));
      }
    } catch (err) {
      console.error('Fetch opportunities error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [activeWorkspace?.id, token]);

  const handleSyncOpportunities = async () => {
    if (!activeWorkspace?.id || !token || syncing) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setOpportunities(json.data);
        showToast('AI growth actions refreshed and synchronized with live telemetry! 🚀');
      } else {
        showToast(json.error || 'Failed to scan and synthesize actions.');
      }
    } catch (err) {
      console.error('Sync opportunities error:', err);
      showToast('Connection error, please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateStatus = async (oppId, newStatus) => {
    setUpdatingId(oppId);
    // Optimistic update
    setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, status: newStatus } : o));
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities/${oppId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Action status updated: ${newStatus === 'completed' ? 'Completed ✅' : newStatus === 'in_progress' ? 'In Progress ⏳' : 'Pending 📋'}`);
      } else {
        // Rollback on error
        fetchOpportunities(true);
      }
    } catch (err) {
      console.error('Update status error:', err);
      fetchOpportunities(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStep = async (opp, stepIdx) => {
    const oppId = opp.id;
    const currentSteps = completedStepsMap[oppId] || {};
    const updatedSteps = {
      ...currentSteps,
      [stepIdx]: !currentSteps[stepIdx]
    };

    setCompletedStepsMap(prev => ({
      ...prev,
      [oppId]: updatedSteps
    }));

    // Save evidence to backend
    const updatedEvidence = {
      ...(typeof opp.evidence === 'object' ? opp.evidence : {}),
      completed_steps: updatedSteps
    };

    try {
      await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities/${oppId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ evidence: updatedEvidence })
      });
    } catch (err) {
      console.error('Failed to persist step state:', err);
    }
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || creatingAction) return;

    setCreatingAction(true);
    try {
      const steps = newStepsText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          description: newDescription.trim(),
          impact_score: parseInt(newImpact, 10),
          effort_score: parseInt(newEffort, 10),
          action_steps: steps,
          code_snippet: newCodeSnippet.trim() || null,
          link_tab: newLinkTab || null,
          estimated_traffic_upside: newTrafficUpside.trim() || '+15–25% Growth'
        })
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setOpportunities(prev => [json.data, ...prev]);
        setIsNewModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewStepsText('');
        setNewCodeSnippet('');
        setNewLinkTab('');
        showToast('Custom action successfully added! 🎉');
      } else {
        alert(json.error || 'Failed to create action.');
      }
    } catch (err) {
      console.error('Create action error:', err);
    } finally {
      setCreatingAction(false);
    }
  };

  const handleDeleteOpportunity = async (oppId) => {
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities/${oppId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setOpportunities(prev => prev.filter(o => o.id !== oppId));
        setDeleteConfirmOpp(null);
        showToast('Action removed from feed.');
      }
    } catch (err) {
      console.error('Delete opportunity error:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showToast('Code copied to clipboard! 📋');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const navigateToTool = (tabKey) => {
    if (tabKey && setActiveTab) {
      setActiveTab(tabKey);
      setActiveGuideOpp(null);
    }
  };

  // Stats Calculations
  const totalCount = opportunities.length;
  const openOpps = opportunities.filter(o => o.status === 'open' || o.status === 'in_progress');
  const openCount = opportunities.filter(o => o.status === 'open').length;
  const inProgressCount = opportunities.filter(o => o.status === 'in_progress').length;
  const completedCount = opportunities.filter(o => o.status === 'completed').length;
  const quickWinsCount = opportunities.filter(o => (o.effort_score || 30) <= 35 && (o.impact_score || 70) >= 70 && o.status !== 'completed').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Dynamic growth impact calculation from cumulative open impact scores
  const calculatedGrowthImpact = useMemo(() => {
    if (openOpps.length === 0) return 0;
    const avgImpact = Math.round(openOpps.reduce((acc, o) => acc + (o.impact_score || 75), 0) / 10);
    return Math.min(65, Math.max(18, avgImpact));
  }, [openOpps]);

  const geoCount = opportunities.filter(o => o.category === 'ai_visibility').length;
  const techCount = opportunities.filter(o => o.category === 'technical').length;
  const searchCount = opportunities.filter(o => o.category === 'search').length;
  const distCount = opportunities.filter(o => o.category === 'distribution').length;

  // Filter and Sort
  const filteredAndSorted = useMemo(() => {
    return opportunities
      .filter(opp => {
        // Category filter
        if (filterCategory === 'quick_wins') {
          if (!((opp.effort_score || 30) <= 35 && (opp.impact_score || 70) >= 70 && opp.status !== 'completed')) return false;
        } else if (filterCategory === 'completed') {
          if (opp.status !== 'completed') return false;
        } else if (filterCategory !== 'all') {
          if (opp.category !== filterCategory) return false;
        }

        // Status filter
        if (filterStatus !== 'all' && opp.status !== filterStatus) {
          return false;
        }

        // Search query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = opp.title?.toLowerCase().includes(q);
          const matchDesc = opp.description?.toLowerCase().includes(q);
          const matchSteps = Array.isArray(opp.action_steps) && opp.action_steps.some(s => s.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchSteps) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return (b.priority_score || 0) - (a.priority_score || 0);
        } else if (sortBy === 'impact') {
          return (b.impact_score || 0) - (a.impact_score || 0);
        } else if (sortBy === 'effort') {
          return (a.effort_score || 50) - (b.effort_score || 50);
        } else if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });
  }, [opportunities, filterCategory, filterStatus, searchQuery, sortBy]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ai_visibility':
        return <img src="/AI-logos/gemini-color.svg" alt="GEO" style={{ width: 13, height: 13 }} />;
      case 'technical':
        return <Wrench size={13} className="text-primary" />;
      case 'search':
        return <Search size={13} className="text-success" />;
      case 'distribution':
        return <Network size={13} className="text-warning" />;
      default:
        return <Layers size={13} />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'ai_visibility': return 'AI Search (GEO)';
      case 'technical': return 'Technical SEO';
      case 'search': return 'Organic Search';
      case 'distribution': return 'Directories & Authority';
      default: return 'Custom Action';
    }
  };

  return (
    <div className="growth-page-container animate-fade">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="growth-toast">
          <Sparkles size={16} className="text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Priority Action Engine"
        badgeIcon={Zap}
        title="Priority Action Feed"
        subtitle="Actionable, high-impact growth tasks synthesized from real-time search queries, crawler technical audits, directory citations, and AI recommendations."
        coverImage="/growth-covers/overview-cover.jpg"
        stats={[
          { label: 'Total Opportunities', value: `${totalCount} Tasks`, sub: `${openCount} open, ${inProgressCount} in progress` },
          { label: 'Quick Wins', value: `${quickWinsCount} Steps`, sub: 'Low effort, high impact' },
          { label: 'Completed', value: `${completedCount} Actions`, sub: `${completionPercentage}% completion rate` }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button 
              type="button" 
              onClick={handleSyncOpportunities}
              disabled={syncing}
              className="growth-primary-btn"
              title="Scans real-time telemetry and generates fresh AI actions"
            >
              {syncing ? <Loader2 size={15} className="spin" /> : <Bot size={15} />}
              <span>{syncing ? 'Analyzing Telemetry...' : 'Sync Telemetry with AI'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="growth-secondary-btn"
            >
              <Plus size={15} />
              <span>New Custom Action</span>
            </button>

            <button 
              type="button" 
              onClick={() => fetchOpportunities(false)}
              className="growth-secondary-btn"
              title="Refresh Action Feed"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Top Impact Metrics Cards */}
      <div className="growth-stats-grid four-col">
        <div 
          className="growth-stat-card" 
          style={{ cursor: 'pointer' }}
          onClick={() => { setFilterCategory('all'); setFilterStatus('all'); }}
          title="List all actions"
        >
          <div className="stat-card-header">
            <span className="stat-card-title">Total Opportunities</span>
            <Layers size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{totalCount}</div>
          <div className="stat-card-sub">{openCount} open, {inProgressCount} in progress</div>
        </div>

        <div 
          className="growth-stat-card highlight-quickwin" 
          style={{ cursor: 'pointer' }}
          onClick={() => setFilterCategory('quick_wins')}
          title="Filter quick wins"
        >
          <div className="stat-card-header">
            <span className="stat-card-title">Quick Wins</span>
            <Zap size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">{quickWinsCount}</div>
          <div className="stat-card-sub">Low effort, maximum upside</div>
        </div>

        <div 
          className="growth-stat-card" 
          style={{ cursor: 'pointer' }}
          onClick={() => setFilterCategory('completed')}
          title="Filter completed actions"
        >
          <div className="stat-card-header">
            <span className="stat-card-title">Completed</span>
            <CheckCircle2 size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">{completedCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {totalCount}</span></div>
          <div className="stat-card-sub">{completionPercentage}% completion rate</div>
        </div>

        <div className="growth-stat-card highlight-growth">
          <div className="stat-card-header">
            <span className="stat-card-title">Estimated Growth Impact</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">
            {openCount > 0 ? `+${calculatedGrowthImpact}%` : 'Maximum! 🚀'}
          </div>
          <div className="stat-card-sub">
            {openCount > 0 ? `Upon completing remaining ${openCount} actions` : 'All priority goals completed'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="growth-action-filters-bar">
        <div className="growth-filter-chips">
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            All ({totalCount})
          </button>
          
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'quick_wins' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('quick_wins')}
          >
            <Zap size={13} />
            <span>Quick Wins ({quickWinsCount})</span>
          </button>
          
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'ai_visibility' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('ai_visibility')}
          >
            <img src="/AI-logos/gemini-color.svg" alt="GEO" style={{ width: 13, height: 13 }} />
            <span>GEO &amp; AI ({geoCount})</span>
          </button>
          
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'technical' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('technical')}
          >
            <Wrench size={13} />
            <span>Technical SEO ({techCount})</span>
          </button>
          
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'search' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('search')}
          >
            <Search size={13} />
            <span>Organic Search ({searchCount})</span>
          </button>

          <button
            type="button"
            className={`filter-chip ${filterCategory === 'distribution' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('distribution')}
          >
            <Network size={13} />
            <span>Directories ({distCount})</span>
          </button>

          <button
            type="button"
            className={`filter-chip ${filterCategory === 'completed' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('completed')}
          >
            <CheckCircle2 size={13} />
            <span>Completed ({completedCount})</span>
          </button>
        </div>

        <div className="growth-filter-right">
          <div className="growth-search-input-wrap">
            <Search size={14} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search actions, keywords, or code snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="growth-search-input"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="growth-select"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open / Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="growth-select"
          >
            <option value="priority">Sort: Priority Score</option>
            <option value="impact">Sort: Growth Impact</option>
            <option value="effort">Sort: Lowest Effort (Quickest)</option>
            <option value="title">Sort: Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Action Items List */}
      <div className="growth-action-feed-list">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="growth-skeleton-opp-card">
                <div className="skeleton-opp-left">
                  <SkeletonBlock width="42px" height="42px" borderRadius="10px" />
                  <div className="skeleton-opp-info">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <SkeletonBlock width="75px" height="18px" borderRadius="999px" />
                      <SkeletonBlock width="90px" height="18px" borderRadius="999px" />
                    </div>
                    <SkeletonBlock width="65%" height="18px" borderRadius="4px" style={{ marginTop: 4 }} />
                    <SkeletonBlock width="85%" height="14px" borderRadius="4px" />
                  </div>
                </div>
                <div className="skeleton-opp-right">
                  <SkeletonBlock width="90px" height="32px" borderRadius="8px" />
                  <SkeletonBlock width="32px" height="32px" borderRadius="8px" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="growth-empty-card">
            <CheckCircle size={44} className="text-success" />
            <h3>No Actions Found</h3>
            <p>All priority tasks under these filters have been completed or no records match your query.</p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => { setFilterCategory('all'); setFilterStatus('all'); setSearchQuery(''); }}
              >
                Clear Filters
              </button>
              <button
                type="button"
                className="growth-primary-btn"
                onClick={handleSyncOpportunities}
              >
                <Bot size={14} />
                <span>Scan Telemetry with AI</span>
              </button>
            </div>
          </div>
        ) : (
          filteredAndSorted.map((opp) => {
            const isExpanded = expandedId === opp.id;
            const isCompleted = opp.status === 'completed';
            const isInProgress = opp.status === 'in_progress';
            const actionSteps = Array.isArray(opp.action_steps) ? opp.action_steps : [];
            const stepsMap = completedStepsMap[opp.id] || {};
            const completedStepsCount = actionSteps.filter((_, idx) => stepsMap[idx]).length;
            const stepProgressPct = actionSteps.length > 0 ? Math.round((completedStepsCount / actionSteps.length) * 100) : 0;
            const hasSnippet = Boolean(opp.code_snippet);

            return (
              <div 
                key={opp.id} 
                className={`growth-action-card ${isCompleted ? 'is-completed' : ''} ${opp.priority_score >= 88 ? 'is-high-priority' : ''}`}
              >
                <div className="growth-action-main-row">
                  {/* Status Toggle Circle */}
                  <button
                    type="button"
                    className={`growth-action-toggle-circle ${isCompleted ? 'is-checked' : ''}`}
                    onClick={() => handleUpdateStatus(opp.id, isCompleted ? 'open' : 'completed')}
                    title={isCompleted ? 'Reopen task' : 'Mark as completed'}
                    disabled={updatingId === opp.id}
                  >
                    {updatingId === opp.id ? (
                      <Loader2 size={13} className="spin" />
                    ) : isCompleted ? (
                      <Check size={14} />
                    ) : (
                      <div className="inner-dot" />
                    )}
                  </button>

                  {/* Body Content */}
                  <div className="growth-action-info-col" onClick={() => setExpandedId(isExpanded ? null : opp.id)}>
                    <div className="growth-action-tags-row">
                      <span className={`opp-cat-pill cat-${opp.category}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {getCategoryIcon(opp.category)}
                        <span>{getCategoryLabel(opp.category)}</span>
                      </span>
                      
                      {(opp.effort_score || 30) <= 35 && (opp.impact_score || 70) >= 70 && (
                        <span className="opp-quickwin-pill">
                          <Zap size={11} />
                          <span>Quick Win</span>
                        </span>
                      )}

                      <span className="opp-score-pill">
                        Priority Score: <strong>{opp.priority_score || 80}/100</strong>
                      </span>
                      
                      {opp.estimated_traffic_upside && (
                        <span className="opp-traffic-upside-pill">
                          <Sparkles size={11} />
                          <span>{opp.estimated_traffic_upside}</span>
                        </span>
                      )}

                      {/* Status indicator tag */}
                      {isInProgress && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 600 }}>
                          In Progress
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 600 }}>
                          Completed
                        </span>
                      )}
                    </div>

                    <h3 className="growth-action-title">{opp.title}</h3>
                    <p className="growth-action-desc">{opp.description}</p>
                  </div>

                  {/* Right Action Controls */}
                  <div className="growth-action-ctrl-col">
                    <button
                      type="button"
                      className="growth-guide-btn"
                      onClick={() => setActiveGuideOpp(opp)}
                      title="View implementation guide, code snippets, and steps"
                    >
                      {hasSnippet ? <Code2 size={14} /> : <HelpCircle size={14} />}
                      <span>{hasSnippet ? 'Guide & Code' : 'How to Fix?'}</span>
                    </button>

                    <button
                      type="button"
                      className="growth-action-expand-btn"
                      onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                      title={isExpanded ? 'Hide details' : 'Show steps and details'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="growth-action-expanded-drawer animate-fade">
                    {/* Diagnostic Evidence */}
                    {opp.evidence && (
                      <div className="growth-evidence-box">
                        <AlertCircle size={16} className="text-warning" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <strong>Diagnosis &amp; Telemetry:</strong>{' '}
                          <span>{opp.evidence.reason || 'Identified by growth telemetry engine.'}</span>
                        </div>
                      </div>
                    )}

                    {/* Step by step interactive checklist */}
                    {actionSteps.length > 0 && (
                      <div className="growth-steps-checklist">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="steps-checklist-title">
                            Implementation Steps ({completedStepsCount}/{actionSteps.length} Completed):
                          </span>
                          <span className="action-step-progress-label">{stepProgressPct}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="action-step-progress-bar">
                          <div 
                            className="action-step-progress-fill" 
                            style={{ width: `${stepProgressPct}%` }}
                          />
                        </div>

                        <div className="steps-list" style={{ marginTop: '0.4rem' }}>
                          {actionSteps.map((step, sIdx) => {
                            const isStepDone = Boolean(stepsMap[sIdx]);
                            return (
                              <div 
                                key={sIdx} 
                                className="action-step-item"
                                onClick={() => handleToggleStep(opp, sIdx)}
                              >
                                <div className={`action-step-checkbox ${isStepDone ? 'is-checked' : ''}`}>
                                  {isStepDone ? <Check size={11} /> : null}
                                </div>
                                <span className={`action-step-text ${isStepDone ? 'is-done' : ''}`}>
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Code Snippet Box inside expanded view */}
                    {opp.code_snippet && (
                      <div className="guide-code-section" style={{ marginTop: '0.5rem' }}>
                        <div className="code-header">
                          <span>Integration Code / Configuration Template:</span>
                          <button 
                            type="button" 
                            className="copy-code-btn"
                            onClick={() => copyToClipboard(opp.code_snippet)}
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                        </div>
                        <pre className="code-block" style={{ maxHeight: '160px' }}>
                          {opp.code_snippet}
                        </pre>
                      </div>
                    )}

                    {/* Direct Tool Jump Link if available */}
                    {opp.link_tab && TAB_NAME_MAP[opp.link_tab] && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 10, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#c7d2fe' }}>
                          <Sparkles size={14} className="text-primary" />
                          <span>You can resolve this step directly in the dedicated module:</span>
                        </div>
                        <button
                          type="button"
                          className="growth-secondary-btn"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          onClick={() => navigateToTool(opp.link_tab)}
                        >
                          <span>Open {TAB_NAME_MAP[opp.link_tab]}</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    )}

                    {/* Status Changer and Delete Bar */}
                    <div className="growth-action-status-bar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="status-bar-label">Change Status:</span>
                        <div className="status-buttons-row">
                          <button
                            type="button"
                            className={`status-btn ${opp.status === 'open' ? 'active' : ''}`}
                            onClick={() => handleUpdateStatus(opp.id, 'open')}
                          >
                            Pending
                          </button>
                          <button
                            type="button"
                            className={`status-btn ${opp.status === 'in_progress' ? 'active' : ''}`}
                            onClick={() => handleUpdateStatus(opp.id, 'in_progress')}
                          >
                            In Progress
                          </button>
                          <button
                            type="button"
                            className={`status-btn ${opp.status === 'completed' ? 'active' : ''}`}
                            onClick={() => handleUpdateStatus(opp.id, 'completed')}
                          >
                            Completed
                          </button>
                          <button
                            type="button"
                            className={`status-btn ${opp.status === 'dismissed' ? 'active' : ''}`}
                            onClick={() => handleUpdateStatus(opp.id, 'dismissed')}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="action-del-btn"
                        onClick={() => setDeleteConfirmOpp(opp)}
                        title="Delete action"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* How to Fix Modal */}
      {activeGuideOpp && (
        <div className="growth-modal-backdrop" onClick={() => setActiveGuideOpp(null)}>
          <div className="growth-guide-modal animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-category-tag">{getCategoryLabel(activeGuideOpp.category)}</span>
                <h2>{activeGuideOpp.title}</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setActiveGuideOpp(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="growth-modal-body">
              <p className="guide-intro">{activeGuideOpp.description}</p>

              {activeGuideOpp.evidence && (
                <div className="growth-evidence-box">
                  <AlertCircle size={15} className="text-warning" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Diagnosis:</strong> <span>{activeGuideOpp.evidence.reason}</span>
                  </div>
                </div>
              )}

              {/* Ready to copy code snippet */}
              {activeGuideOpp.code_snippet && (
                <div className="guide-code-section">
                  <div className="code-header">
                    <span>Implementation Code / Configuration:</span>
                    <button 
                      type="button" 
                      className="copy-code-btn"
                      onClick={() => copyToClipboard(activeGuideOpp.code_snippet)}
                    >
                      {copiedCode ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="code-block">
                    {activeGuideOpp.code_snippet}
                  </pre>
                </div>
              )}

              {/* Steps Guide */}
              <div className="guide-steps-list">
                <h4>Step-by-Step Implementation Guide:</h4>
                <ol>
                  {(activeGuideOpp.action_steps || []).map((step, idx) => (
                    <li key={idx} style={{ marginBottom: 6 }}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Link to Dedicated Tool */}
              {activeGuideOpp.link_tab && TAB_NAME_MAP[activeGuideOpp.link_tab] && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>Dedicated Module</div>
                    <div style={{ color: '#a5b4fc', fontSize: '0.78rem' }}>You can navigate directly to this module to test and apply changes.</div>
                  </div>
                  <button
                    type="button"
                    className="growth-primary-btn"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                    onClick={() => navigateToTool(activeGuideOpp.link_tab)}
                  >
                    <span>Open {TAB_NAME_MAP[activeGuideOpp.link_tab]}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="growth-modal-footer">
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setActiveGuideOpp(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="growth-primary-btn"
                onClick={() => {
                  handleUpdateStatus(activeGuideOpp.id, 'completed');
                  setActiveGuideOpp(null);
                }}
              >
                <Check size={15} />
                <span>Mark as Implemented &amp; Completed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Action Modal */}
      {isNewModalOpen && (
        <div className="growth-modal-backdrop" onClick={() => setIsNewModalOpen(false)}>
          <div className="growth-guide-modal animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Plus size={18} className="text-primary" />
                <h2>Add Custom Action / Task</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setIsNewModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity}>
              <div className="growth-modal-body">
                <div className="growth-modal-field">
                  <label>Action Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Build FAQ Schema Markup to earn rich search snippets"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="growth-modal-row">
                  <div className="growth-modal-field">
                    <label>Category</label>
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                      <option value="ai_visibility">AI Search (GEO)</option>
                      <option value="technical">Technical SEO</option>
                      <option value="search">Organic Search</option>
                      <option value="distribution">Directories &amp; Authority</option>
                      <option value="custom">Custom Task</option>
                    </select>
                  </div>

                  <div className="growth-modal-field">
                    <label>Related Module</label>
                    <select value={newLinkTab} onChange={e => setNewLinkTab(e.target.value)}>
                      <option value="">None (Independent Action)</option>
                      <option value="ai-visibility">AI Visibility (GEO)</option>
                      <option value="technical">Site Audit &amp; Crawl Issues</option>
                      <option value="search">Search Performance (GSC)</option>
                      <option value="directories">Directories &amp; Distribution</option>
                      <option value="competitors">Competitor Intelligence</option>
                      <option value="settings">Brand &amp; Integrations</option>
                    </select>
                  </div>
                </div>

                <div className="growth-modal-field">
                  <label>Description &amp; Growth Objective</label>
                  <textarea
                    rows={2}
                    placeholder="Why is this step important and how does it drive traffic or citations?"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="growth-modal-row">
                  <div className="growth-modal-field">
                    <label>Growth Impact Score (1 - 100): {newImpact}</label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={newImpact}
                      onChange={e => setNewImpact(e.target.value)}
                    />
                  </div>

                  <div className="growth-modal-field">
                    <label>Effort Level (1 - 100): {newEffort} {newEffort <= 35 ? '(Quick Win ⚡)' : ''}</label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={newEffort}
                      onChange={e => setNewEffort(e.target.value)}
                    />
                  </div>
                </div>

                <div className="growth-modal-field">
                  <label>Implementation Steps (One step per line)</label>
                  <textarea
                    rows={3}
                    placeholder="Step 1: Extract FAQ items from customer support inquiries&#10;Step 2: Add FAQPage JSON-LD in the header template&#10;Step 3: Validate using Google Rich Results Test"
                    value={newStepsText}
                    onChange={e => setNewStepsText(e.target.value)}
                  />
                </div>

                <div className="growth-modal-field">
                  <label>Code / Configuration Template (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="<script type='application/ld+json'>..."
                    value={newCodeSnippet}
                    onChange={e => setNewCodeSnippet(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div className="growth-modal-footer">
                <button
                  type="button"
                  className="growth-secondary-btn"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAction || !newTitle.trim()}
                  className="growth-primary-btn"
                >
                  {creatingAction ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                  <span>{creatingAction ? 'Adding...' : 'Add Action to Feed'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpp && (
        <div className="growth-modal-backdrop" onClick={() => setDeleteConfirmOpp(null)}>
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <h2>Delete Action</h2>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setDeleteConfirmOpp(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="growth-modal-body">
              <p>
                Are you sure you want to permanently delete <strong>"{deleteConfirmOpp.title}"</strong> from your action feed?
              </p>
            </div>
            <div className="growth-modal-footer">
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setDeleteConfirmOpp(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="growth-danger-btn"
                style={{ padding: '0.55rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => handleDeleteOpportunity(deleteConfirmOpp.id)}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
