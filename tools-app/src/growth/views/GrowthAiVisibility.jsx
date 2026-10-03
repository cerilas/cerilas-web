import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bot, 
  Sparkles, 
  Plus, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Globe, 
  Languages, 
  ExternalLink, 
  Loader2, 
  FileText,
  Search,
  MessageSquare,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  Check,
  ArrowUpRight,
  X,
  History,
  Calendar,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Trash2,
  StopCircle,
  Layers,
  Lock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import AiEngineBadge, { AiEngineGroup } from '../components/AiEngineBadge';
import { SkeletonBlock } from '../components/GrowthSkeleton';
import AiVisibilityDropdown from '../../tools/ai-visibility-checker/components/AiVisibilityDropdown';
import FlagIcon from '../../tools/ai-visibility-checker/components/FlagIcon';
import { MARKET_OPTIONS, LANGUAGE_OPTIONS, getMarketOption, getLanguageOption } from '../../tools/ai-visibility-checker/options';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export default function GrowthAiVisibility() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptTopic, setNewPromptTopic] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('TR');
  const [selectedLanguage, setSelectedLanguage] = useState('tr');
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [runningPromptId, setRunningPromptId] = useState(null);
  const [lastRunResult, setLastRunResult] = useState(null);

  // AI Prompt Generator Modal State
  const [isAiGenModalOpen, setIsAiGenModalOpen] = useState(false);
  const [generatingAiPrompts, setGeneratingAiPrompts] = useState(false);
  const [aiGeneratedSuggestions, setAiGeneratedSuggestions] = useState([]);
  const [savingAiPrompts, setSavingAiPrompts] = useState(false);
  const [aiGenError, setAiGenError] = useState('');

  // Delete Prompt Modal State
  const [deleteTargetPrompt, setDeleteTargetPrompt] = useState(null);
  const [deletingPromptId, setDeletingPromptId] = useState(null);

  // Live Real-Time GEO Readiness Audit
  const [geoReadiness, setGeoReadiness] = useState(null);
  const [loadingGeoReadiness, setLoadingGeoReadiness] = useState(true);
  const [scanningGeoReadiness, setScanningGeoReadiness] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Batch Scan State
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, activePromptId: null });
  const [batchResultsMap, setBatchResultsMap] = useState({});
  const abortScanRef = useRef(false);
  const progressCardRef = useRef(null);
  const reportPanelRef = useRef(null);

  // Historical Batch Reports State
  const [reportsList, setReportsList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'cited' | 'mentioned' | 'not_cited'
  const [expandedQueries, setExpandedQueries] = useState({});

  const toggleQuery = (id) => {
    setExpandedQueries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Historical Reports Filter & Pagination State
  const [historyDateFilter, setHistoryDateFilter] = useState('all'); // 'all' | 'today' | '7d' | '30d' | 'custom'
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historySortOrder, setHistorySortOrder] = useState('newest'); // 'newest' | 'oldest' | 'score_high' | 'score_low'
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 6;

  const filteredAndSortedReports = React.useMemo(() => {
    let result = [...reportsList];

    // Filter by date
    if (historyDateFilter === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.created_at) >= todayStart);
    } else if (historyDateFilter === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter(r => new Date(r.created_at) >= sevenDaysAgo);
    } else if (historyDateFilter === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(r => new Date(r.created_at) >= thirtyDaysAgo);
    } else if (historyDateFilter === 'custom') {
      if (historyStartDate) {
        const start = new Date(historyStartDate);
        start.setHours(0, 0, 0, 0);
        result = result.filter(r => new Date(r.created_at) >= start);
      }
      if (historyEndDate) {
        const end = new Date(historyEndDate);
        end.setHours(23, 59, 59, 999);
        result = result.filter(r => new Date(r.created_at) <= end);
      }
    }

    // Sort
    result.sort((a, b) => {
      if (historySortOrder === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (historySortOrder === 'score_high') {
        return (Number(b.visibility_score) || 0) - (Number(a.visibility_score) || 0);
      }
      if (historySortOrder === 'score_low') {
        return (Number(a.visibility_score) || 0) - (Number(b.visibility_score) || 0);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return result;
  }, [reportsList, historyDateFilter, historyStartDate, historyEndDate, historySortOrder]);

  const totalHistoryPages = Math.ceil(filteredAndSortedReports.length / historyPerPage) || 1;
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);

  const paginatedReports = React.useMemo(() => {
    const startIndex = (currentHistoryPage - 1) * historyPerPage;
    return filteredAndSortedReports.slice(startIndex, startIndex + historyPerPage);
  }, [filteredAndSortedReports, currentHistoryPage, historyPerPage]);

  const fetchPrompts = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch prompts.');
      const list = data.data || [];
      setPrompts(list);
      try {
        window.dispatchEvent(new CustomEvent('growth:prompts-updated', { detail: { count: list.length } }));
      } catch {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsList = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoadingReports(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/ai-reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReportsList(data.data || []);
        // Auto-load latest report if none selected yet
        if (!activeReport && data.data && data.data.length > 0) {
          handleLoadReport(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch AI reports list error:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleLoadReport = async (reportId) => {
    if (!reportId) {
      setActiveReport(null);
      return;
    }
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/ai-reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setActiveReport(data.data);
      }
    } catch (err) {
      console.error('Load report error:', err);
    }
  };

  const handleDeleteReport = async (reportId, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scan report?')) return;
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/ai-reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReportsList(prev => prev.filter(r => r.id !== reportId));
        if (activeReport?.id === reportId) {
          setActiveReport(null);
        }
      }
    } catch (err) {
      console.error('Delete report error:', err);
    }
  };

  const fetchGeoReadiness = async (forceRescan = false) => {
    if (!activeWorkspace?.id || !token || !activeWorkspace?.primary_domain) {
      setLoadingGeoReadiness(false);
      return;
    }
    if (forceRescan) setScanningGeoReadiness(true);
    else setLoadingGeoReadiness(true);
    setGeoError(null);

    try {
      const endpoint = forceRescan
        ? `/api/growth/workspaces/${activeWorkspace.id}/geo-readiness/scan`
        : `/api/growth/workspaces/${activeWorkspace.id}/geo-readiness`;
      const res = await fetch(endpoint, {
        method: forceRescan ? 'POST' : 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch GEO readiness analysis.');
      setGeoReadiness(data.data);
    } catch (err) {
      console.error('Fetch GEO readiness error:', err);
      setGeoError(err.message);
    } finally {
      setLoadingGeoReadiness(false);
      setScanningGeoReadiness(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchReportsList();
    fetchGeoReadiness(false);
  }, [activeWorkspace?.id, activeWorkspace?.primary_domain, token]);

  // Auto-scroll to batch progress card
  useEffect(() => {
    if (isBatchScanning && progressCardRef.current) {
      progressCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isBatchScanning]);

  const handleAddPrompt = async (e) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

    if (prompts.length >= 10) {
      alert('Maximum limit of 10 tracked prompts reached. To add a new prompt, please delete an existing one.');
      return;
    }

    setAddingPrompt(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: newPromptText.trim(),
          topic: newPromptTopic.trim() || 'General',
          country: selectedCountry || 'TR',
          language: selectedLanguage || 'tr'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add prompt.');
      }
      setNewPromptText('');
      setNewPromptTopic('');
      fetchPrompts();
    } catch (err) {
      console.error('Add prompt error:', err);
      alert(err.message || 'An error occurred while adding prompt.');
    } finally {
      setAddingPrompt(false);
    }
  };

  const handleRunPrompt = async (promptId) => {
    setRunningPromptId(promptId);
    setLastRunResult(null);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/${promptId}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation could not be executed.');
      setLastRunResult(data.data);
      fetchPrompts();
    } catch (err) {
      console.error('Run prompt error:', err);
      alert(err.message);
    } finally {
      setRunningPromptId(null);
    }
  };

  // AI Prompt Generator Handlers
  const handleOpenAiModal = () => {
    if (prompts.length >= 10) {
      alert('Maximum limit of 10 tracked prompts already reached (10/10).');
      return;
    }
    setIsAiGenModalOpen(true);
    setAiGenError('');
    setAiGeneratedSuggestions([]);
    fetchAiPromptSuggestions();
  };

  const fetchAiPromptSuggestions = async () => {
    if (!activeWorkspace?.id || !token) return;
    setGeneratingAiPrompts(true);
    setAiGenError('');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/generate-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          country: selectedCountry || 'TR',
          language: selectedLanguage || 'tr'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate prompt suggestions.');
      const suggestions = (data.suggestions || []).map(s => ({ ...s, selected: true }));
      setAiGeneratedSuggestions(suggestions);
    } catch (err) {
      console.error('Fetch AI prompt suggestions error:', err);
      setAiGenError(err.message || 'An error occurred while generating queries with AI.');
    } finally {
      setGeneratingAiPrompts(false);
    }
  };

  const handleToggleSuggestion = (index) => {
    setAiGeneratedSuggestions(prev => prev.map((item, idx) => idx === index ? { ...item, selected: !item.selected } : item));
  };

  const handleToggleSelectAllSuggestions = () => {
    const allSelected = aiGeneratedSuggestions.every(s => s.selected);
    setAiGeneratedSuggestions(prev => prev.map(s => ({ ...s, selected: !allSelected })));
  };

  const handleSaveSelectedAiPrompts = async () => {
    const selectedItems = aiGeneratedSuggestions.filter(s => s.selected);
    if (selectedItems.length === 0 || !activeWorkspace?.id || !token) return;

    setSavingAiPrompts(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompts: selectedItems.map(s => ({ prompt: s.prompt, topic: s.topic })),
          country: selectedCountry || 'TR',
          language: selectedLanguage || 'tr'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add queries.');
      setIsAiGenModalOpen(false);
      setAiGeneratedSuggestions([]);
      fetchPrompts();
    } catch (err) {
      console.error('Save AI prompts error:', err);
      alert(err.message || 'An error occurred while adding queries.');
    } finally {
      setSavingAiPrompts(false);
    }
  };

  // Delete Prompt Handler
  const handleConfirmDeletePrompt = async () => {
    if (!deleteTargetPrompt || !activeWorkspace?.id || !token) return;
    const promptId = deleteTargetPrompt.id;
    setDeletingPromptId(promptId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/${promptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Prompt silinemedi.');
      setDeleteTargetPrompt(null);
      fetchPrompts();
    } catch (err) {
      console.error('Delete prompt error:', err);
      alert(err.message || 'Prompt silinemedi.');
    } finally {
      setDeletingPromptId(null);
    }
  };

  // Start Batch Scan for all prompts
  const handleStartBatchScan = async () => {
    if (!prompts || prompts.length === 0 || isBatchScanning) return;

    setIsBatchScanning(true);
    abortScanRef.current = false;
    setBatchProgress({ current: 0, total: prompts.length, activePromptId: prompts[0].id });
    setBatchResultsMap({});

    const collectedResults = [];
    const primaryDomain = String(activeWorkspace?.primary_domain || '')
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      .trim();

    for (let i = 0; i < prompts.length; i++) {
      if (abortScanRef.current) break;
      const p = prompts[i];
      setBatchProgress({ current: i, total: prompts.length, activePromptId: p.id });

      try {
        const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/${p.id}/run`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.data) {
          const itemResult = {
            promptId: p.id,
            prompt: p.prompt,
            topic: p.topic,
            country: p.country,
            language: p.language,
            brandMentioned: Boolean(data.data.brand_mentioned),
            domainCited: Boolean(data.data.domain_cited),
            citationsCount: (data.data.citations || []).length,
            citations: data.data.citations || [],
            responseText: data.data.response_text || '',
            model: data.data.model || 'gemini-3.8-flash',
            checkedAt: data.data.checked_at || new Date().toISOString()
          };
          collectedResults.push(itemResult);
          setBatchResultsMap(prev => ({ ...prev, [p.id]: itemResult }));
        } else {
          const errResult = {
            promptId: p.id,
            prompt: p.prompt,
            topic: p.topic,
            country: p.country,
            language: p.language,
            brandMentioned: false,
            domainCited: false,
            citationsCount: 0,
            citations: [],
            responseText: 'Scan failed: ' + (data.error || 'Unknown error'),
            isError: true
          };
          collectedResults.push(errResult);
          setBatchResultsMap(prev => ({ ...prev, [p.id]: errResult }));
        }
      } catch (err) {
        const errResult = {
          promptId: p.id,
          prompt: p.prompt,
          topic: p.topic,
          country: p.country,
          language: p.language,
          brandMentioned: false,
          domainCited: false,
          citationsCount: 0,
          citations: [],
          responseText: 'Connection error: ' + err.message,
          isError: true
        };
        collectedResults.push(errResult);
        setBatchResultsMap(prev => ({ ...prev, [p.id]: errResult }));
      }

      setBatchProgress({ current: i + 1, total: prompts.length, activePromptId: null });
      // Brief pause between requests for UI clarity & polite pacing
      await new Promise(r => setTimeout(r, 600));
    }

    if (!abortScanRef.current && collectedResults.length > 0) {
      const total = collectedResults.length;
      const mentionedCount = collectedResults.filter(r => r.brandMentioned).length;
      const citedCount = collectedResults.filter(r => r.domainCited).length;
      const score = Math.round(((mentionedCount * 0.5 + citedCount * 0.5) / total) * 100);

      // Aggregate all citations & top domains
      const domainCounts = {};
      collectedResults.forEach(r => {
        (r.citations || []).forEach(c => {
          if (c.domain) {
            domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1;
          }
        });
      });
      const topSources = Object.entries(domainCounts)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const reportPayload = {
        total_prompts: total,
        mentioned_count: mentionedCount,
        cited_count: citedCount,
        visibility_score: score,
        model: 'gemini-3.8-flash',
        summary: {
          totalCitationsFound: Object.values(domainCounts).reduce((a, b) => a + b, 0),
          uniqueDomainsCited: Object.keys(domainCounts).length,
          topSources,
          primaryDomain
        },
        results: collectedResults
      };

      try {
        const saveRes = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/ai-reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(reportPayload)
        });
        const saveData = await saveRes.json();
        if (saveRes.ok && saveData.data) {
          setActiveReport(saveData.data);
          fetchReportsList();
          setTimeout(() => {
            reportPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 350);
        } else {
          setActiveReport({ ...reportPayload, created_at: new Date().toISOString() });
        }
      } catch {
        setActiveReport({ ...reportPayload, created_at: new Date().toISOString() });
      }
    }

    setIsBatchScanning(false);
    fetchPrompts();
  };

  const handleCancelBatchScan = () => {
    abortScanRef.current = true;
    setIsBatchScanning(false);
  };

  // Filter report results
  const reportResults = activeReport?.results || [];
  const filteredReportResults = reportResults.filter(r => {
    if (activeFilter === 'cited') return r.domainCited;
    if (activeFilter === 'mentioned') return r.brandMentioned;
    if (activeFilter === 'not_cited') return !r.domainCited;
    return true;
  });

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Cover Banner with Merged Live GEO Readiness Score Widget */}
      <GrowthPageCover
        badge="Generative Engine Optimization (GEO)"
        badgeIcon={Bot}
        title="AI (GEO) Visibility &amp; Citation Tracking"
        subtitle="Monitor how often your brand is recommended and cited as a source across AI search engines like Google Gemini, ChatGPT Search, and Perplexity."
        coverImage="/growth-covers/geo-cover.jpg"
        actions={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Scanned AI Engines:</span>
              <AiEngineGroup size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="growth-badge blue" style={{ fontSize: '0.74rem' }}>
                <MessageSquare size={11} /> {prompts.length} / 10 Tracked Prompts
              </span>
              <span className="growth-badge purple" style={{ fontSize: '0.74rem' }}>
                <History size={11} /> {reportsList.length} Saved Reports
              </span>
            </div>
          </div>
        }
        rightSlot={
          <div className="hero-merged-score-widget">
            {/* Top Bar: Domain Pill + Status Tag + Rescan Button */}
            <div className="hero-score-widget-topbar">
              <div className="hero-score-widget-domain-group">
                {activeWorkspace?.primary_domain && (
                  <span className="geo-domain-tag">
                    <Globe size={11} color="#3b82f6" />
                    <span>{activeWorkspace.primary_domain}</span>
                  </span>
                )}
                {geoReadiness && (
                  <span className={`geo-badge-status ${geoReadiness.geoScore >= 70 ? 'good' : 'warning'}`}>
                    {geoReadiness.geoScore >= 80 ? '✓ Excellent AI Readiness' : geoReadiness.geoScore >= 50 ? '⚡ Improvements Needed' : '✕ Deficiencies Found'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchGeoReadiness(true)}
                disabled={scanningGeoReadiness || !activeWorkspace?.primary_domain}
                className="hero-score-rescan-btn"
                title="Re-scan live robots.txt, llms.txt and Schema standards"
              >
                <RefreshCw size={11} className={scanningGeoReadiness ? 'spin' : ''} />
                <span>{scanningGeoReadiness ? 'Scanning...' : 'Rescan Now'}</span>
              </button>
            </div>

            {/* Score Body */}
            {loadingGeoReadiness ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
                <Loader2 size={20} className="spin" style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Evaluating live AI readiness standards...</span>
              </div>
            ) : geoReadiness ? (
              <>
                <div className="hero-score-widget-body">
                  <div className={`geo-score-radial-box ${geoReadiness.geoScore >= 70 ? '' : geoReadiness.geoScore >= 50 ? 'warning' : 'danger'}`}>
                    <span className="geo-score-radial-num">{geoReadiness.geoScore}</span>
                    <span className="geo-score-radial-max">/100</span>
                  </div>

                  <div className="hero-score-widget-texts">
                    <h4 className="hero-score-widget-title">
                      {geoReadiness.geoScore >= 80 ? 'High AI Readiness & Crawlability' : 'AI Crawlability Optimization Recommended'}
                    </h4>
                    <p className="hero-score-widget-desc">
                      {geoReadiness.summaryText || 'Your domain crawlability and citation readiness have been analyzed for AI search engines.'}
                    </p>
                    {geoReadiness.checked_at && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                        Last Scan: {formatRelativeTime(geoReadiness.checked_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Standards Mini Bar */}
                <div className="hero-score-widget-standards-bar">
                  {(geoReadiness.standards || []).map((std, sIdx) => {
                    const isPassed = std.passed;
                    return (
                      <a
                        key={sIdx}
                        href={std.link || '#'}
                        target={std.link ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="hero-std-pill"
                        title={std.desc}
                      >
                        <span className={`hero-std-dot ${isPassed ? 'passed' : 'failed'}`} />
                        <span>{std.title}: {isPassed ? 'Active' : 'Missing'}</span>
                        {std.link && <ExternalLink size={10} style={{ opacity: 0.6 }} />}
                      </a>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ padding: '0.75rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                <Globe size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Domain not analyzed. Please verify your domain in Settings.
              </div>
            )}
          </div>
        }
      />

      {/* =========================================================================
          BATCH SCAN PROGRESS & HISTORICAL REPORT SECTION
          ========================================================================= */}

      {/* 1. Live Animated Batch Scan Progress Card */}
      {isBatchScanning && (
        <div ref={progressCardRef} className="ai-batch-scan-card">
          <div className="ai-batch-scan-header">
            <div className="ai-batch-scan-title">
              <Loader2 size={20} className="spin" color="#3b82f6" />
              <span>Live AI Scan in Progress...</span>
            </div>
            <div className="ai-batch-scan-actions">
              <button type="button" onClick={handleCancelBatchScan} className="ai-batch-cancel-btn">
                <StopCircle size={14} />
                <span>Stop Scan</span>
              </button>
            </div>
          </div>

          <div className="ai-batch-progress-bar-wrap">
            <div className="ai-batch-progress-meta">
              <span>Scanned Prompts: {batchProgress.current} / {batchProgress.total}</span>
              <span>{Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}% Completed</span>
            </div>
            <div className="ai-batch-progress-track">
              <div 
                className="ai-batch-progress-fill" 
                style={{ width: `${Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%` }} 
              />
            </div>
          </div>

          <div className="ai-batch-prompts-list">
            {prompts.map((p, idx) => {
              const res = batchResultsMap[p.id];
              const isProbing = batchProgress.activePromptId === p.id;
              const isDone = !!res;

              return (
                <div key={p.id} className={`ai-batch-prompt-row ${isProbing ? 'probing' : isDone ? 'done' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', width: 22 }}>#{idx + 1}</span>
                    <span className="ai-batch-prompt-text">"{p.prompt}"</span>
                  </div>

                  <div className="ai-batch-status-pills">
                    {isProbing ? (
                      <span className="ai-pill probing">
                        <Loader2 size={12} className="spin" />
                        <span>Querying Gemini 3.8...</span>
                      </span>
                    ) : isDone ? (
                      <>
                        {res.brandMentioned ? (
                          <span className="ai-pill success">
                            <Check size={11} strokeWidth={3} />
                            <span>Brand Mentioned</span>
                          </span>
                        ) : (
                          <span className="ai-pill danger">
                            <X size={11} strokeWidth={3} />
                            <span>Not Mentioned</span>
                          </span>
                        )}

                        {res.domainCited ? (
                          <span className="ai-pill success">
                            <Globe size={11} />
                            <span>Your Site Cited</span>
                          </span>
                        ) : res.citationsCount > 0 ? (
                          <span className="ai-pill neutral">
                            <Globe size={11} />
                            <span>{res.citationsCount} External Sources</span>
                          </span>
                        ) : (
                          <span className="ai-pill neutral">
                            <span>No Citations</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="ai-pill queued">
                        <Clock size={11} />
                        <span>Queued in Line</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. AI Visibility Summary Report (Minik Rapor) */}
      {activeReport && !isBatchScanning && (
        <div ref={reportPanelRef} className="ai-report-panel animate-fade">
          <div className="ai-report-topbar">
            <div className="ai-report-top-left">
              <div className="ai-report-header-title-row">
                <div className="ai-report-icon-box">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 className="ai-report-heading">
                    AI Visibility &amp; Citation Report
                  </h3>
                  <div className="ai-report-meta-row">
                    <span className="ai-report-meta-item highlight">
                      <Calendar size={12} />
                      <span>{formatFullDate(activeReport.created_at)}</span>
                      <span className="ai-report-meta-sub">({formatRelativeTime(activeReport.created_at)})</span>
                    </span>
                    <span className="ai-report-meta-dot">•</span>
                    <span className="ai-report-meta-item">
                      <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 13, height: 13 }} />
                      <span>{activeReport.model || 'gemini-3.8-flash'}</span>
                    </span>
                    <span className="ai-report-meta-dot">•</span>
                    <span className="ai-report-meta-item">
                      <span>{activeReport.total_prompts} Prompts Analyzed</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ai-report-top-right">
              {reportsList.length > 1 && (
                <div className="ai-report-history-select-wrap">
                  <History size={13} color="#94a3b8" />
                  <select
                    className="ai-report-history-select"
                    value={activeReport.id || ''}
                    onChange={(e) => handleLoadReport(e.target.value)}
                  >
                    {reportsList.map(r => (
                      <option key={r.id} value={r.id}>
                        {formatFullDate(r.created_at)} (Score: {r.visibility_score}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeReport.id && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteReport(activeReport.id, e)}
                  className="growth-secondary-btn"
                  title="Delete this report from archive"
                  style={{ padding: '0.35rem 0.65rem', color: '#f87171' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 4 Mini Report Metric Cards */}
          <div className="ai-report-metrics-grid">
            <div className="ai-report-metric-card score-card">
              <span className="ai-report-metric-label">GEO Visibility Score</span>
              <div className={`ai-report-metric-val ${activeReport.visibility_score >= 70 ? 'score-high' : activeReport.visibility_score >= 40 ? 'score-mid' : 'score-low'}`}>
                {activeReport.visibility_score}%
              </div>
              <span className="ai-report-metric-sub">
                {activeReport.visibility_score >= 70 ? 'High Visibility' : activeReport.visibility_score >= 40 ? 'Moderate Presence' : 'Needs Improvement'}
              </span>
            </div>

            <div className="ai-report-metric-card">
              <span className="ai-report-metric-label">Brand Mention Rate</span>
              <div className="ai-report-metric-val">
                {activeReport.mentioned_count} / {activeReport.total_prompts}
              </div>
              <span className="ai-report-metric-sub">
                {Math.round(((activeReport.mentioned_count || 0) / (activeReport.total_prompts || 1)) * 100)}% of prompts mentioned your brand
              </span>
            </div>

            <div className="ai-report-metric-card">
              <span className="ai-report-metric-label">Your Site Was Cited</span>
              <div className="ai-report-metric-val text-success">
                {activeReport.cited_count} / {activeReport.total_prompts}
              </div>
              <span className="ai-report-metric-sub">
                {Math.round(((activeReport.cited_count || 0) / (activeReport.total_prompts || 1)) * 100)}% direct URL / domain citations
              </span>
            </div>

            <div className="ai-report-metric-card">
              <span className="ai-report-metric-label">Total Sources Cited</span>
              <div className="ai-report-metric-val">
                {activeReport.summary?.totalCitationsFound || 0}
              </div>
              <span className="ai-report-metric-sub">
                {activeReport.summary?.uniqueDomainsCited || 0} Unique domains cited
              </span>
            </div>
          </div>

          {/* Top Sources Pill Breakdown */}
          {activeReport.summary?.topSources && activeReport.summary.topSources.length > 0 && (
            <div className="ai-report-sources-box">
              <div className="ai-report-sources-title">
                <Globe size={13} color="#3b82f6" />
                <span>Top Domains Cited by AI Engines:</span>
              </div>
              <div className="ai-report-sources-pills">
                {activeReport.summary.topSources.map((s, sIdx) => {
                  const isUser = activeReport.summary.primaryDomain && s.domain.includes(activeReport.summary.primaryDomain);
                  return (
                    <span key={sIdx} className={`ai-source-tag ${isUser ? 'is-user' : ''}`}>
                      <Globe size={11} />
                      <span>{s.domain}</span>
                      <span className="ai-source-count">{s.count} citations</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="ai-report-filters-bar">
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main, #ffffff)' }}>
              Analyzed Prompts ({filteredReportResults.length} / {reportResults.length})
            </span>

            <div className="ai-filter-tabs">
              <button 
                type="button" 
                className={`ai-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All ({reportResults.length})
              </button>
              <button 
                type="button" 
                className={`ai-filter-tab ${activeFilter === 'cited' ? 'active' : ''}`}
                onClick={() => setActiveFilter('cited')}
              >
                Your Site Cited ({reportResults.filter(r => r.domainCited).length})
              </button>
              <button 
                type="button" 
                className={`ai-filter-tab ${activeFilter === 'mentioned' ? 'active' : ''}`}
                onClick={() => setActiveFilter('mentioned')}
              >
                Brand Mentioned ({reportResults.filter(r => r.brandMentioned).length})
              </button>
              <button 
                type="button" 
                className={`ai-filter-tab ${activeFilter === 'not_cited' ? 'active' : ''}`}
                onClick={() => setActiveFilter('not_cited')}
              >
                No Citations ({reportResults.filter(r => !r.domainCited).length})
              </button>
            </div>
          </div>

          {/* Prompt Breakdown List */}
          <div className="ai-report-results-list">
            {filteredReportResults.map((item, idx) => {
              const isExpanded = !!expandedQueries[item.promptId || idx];
              const marketOpt = getMarketOption(item.country || 'TR');
              const langOpt = getLanguageOption(item.language || 'tr');

              return (
                <div key={item.promptId || idx} className="ai-report-item-card">
                  <div className="ai-report-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span className="ai-report-item-query">"{item.prompt}"</span>
                      <span className="prompt-topic-tag">{item.topic || 'General'}</span>
                      <span className="prompt-meta-badge" title={`Market: ${marketOpt.label}`}>
                        {marketOpt.icon}
                        <span>{marketOpt.code || item.country || 'TR'}</span>
                      </span>
                      <span className="prompt-meta-badge lang" title={`Language: ${langOpt.label}`}>
                        <Languages size={11} color="#8b5cf6" />
                        <span>{langOpt.code || (item.language || 'TR').toUpperCase()}</span>
                      </span>
                    </div>

                    <div className="ai-report-item-badges">
                      {item.brandMentioned ? (
                        <span className="ai-pill success">
                          <Check size={11} strokeWidth={3} />
                          <span>Brand Mentioned</span>
                        </span>
                      ) : (
                        <span className="ai-pill danger">
                          <X size={11} strokeWidth={3} />
                          <span>Not Mentioned</span>
                        </span>
                      )}

                      {item.domainCited ? (
                        <span className="ai-pill success">
                          <Globe size={11} />
                          <span>Your Site Cited</span>
                        </span>
                      ) : item.citationsCount > 0 ? (
                        <span className="ai-pill neutral">
                          <Globe size={11} />
                          <span>{item.citationsCount} External Citations</span>
                        </span>
                      ) : (
                        <span className="ai-pill neutral">
                          <span>No Citations</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleQuery(item.promptId || idx)}
                        className="ai-report-preview-toggle"
                      >
                        <span>{isExpanded ? 'Hide' : 'View Response'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <div className="ai-result-text-box">
                        <span className="ai-box-sub">Response Generated by Gemini 3.8:</span>
                        <p className="ai-response-content">{item.responseText}</p>
                      </div>

                      {item.citations && item.citations.length > 0 && (
                        <div className="ai-citations-box">
                          <span className="ai-box-sub">Cited Sources:</span>
                          <div className="citations-list">
                            {item.citations.map((c, cIdx) => (
                              <a key={cIdx} href={c.url} target="_blank" rel="noopener noreferrer" className="citation-pill">
                                <Globe size={12} />
                                <span>{c.domain}</span>
                                <ExternalLink size={10} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Individual Prompt Test Drawer (Single Run Result) */}
      {lastRunResult && !isBatchScanning && (
        <div className="growth-ai-run-result-banner animate-fade">
          <div className="ai-result-header">
            <div className="ai-result-title-row">
              <img src="/AI-logos/gemini-color.svg" alt="Google Gemini" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <h4>Live AI Test Result (Google Gemini)</h4>
            </div>
            <button type="button" onClick={() => setLastRunResult(null)} className="ai-result-close" aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="ai-result-stats-row">
            <div className="ai-stat-box">
              <span className="ai-stat-label">Brand Mentioned?</span>
              <span className={`ai-stat-val ${lastRunResult.brand_mentioned ? 'text-success' : 'text-danger'}`}>
                {lastRunResult.brand_mentioned ? 'YES, MENTIONED' : 'NO'}
              </span>
            </div>
            <div className="ai-stat-box">
              <span className="ai-stat-label">Your Site Cited?</span>
              <span className={`ai-stat-val ${lastRunResult.domain_cited ? 'text-success' : 'text-danger'}`}>
                {lastRunResult.domain_cited ? 'YES, CITED' : 'NO'}
              </span>
            </div>
            <div className="ai-stat-box">
              <span className="ai-stat-label">Tested Engine</span>
              <span className="ai-stat-val text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 16, height: 16 }} />
                <span>{lastRunResult.model || 'gemini-3.8-flash'}</span>
              </span>
            </div>
          </div>

          <div className="ai-result-text-box">
            <span className="ai-box-sub">Response Generated by AI:</span>
            <p className="ai-response-content">{lastRunResult.response_text}</p>
          </div>

          {lastRunResult.citations && lastRunResult.citations.length > 0 && (
            <div className="ai-citations-box">
              <span className="ai-box-sub">Cited Sources &amp; Websites:</span>
              <div className="citations-list">
                {lastRunResult.citations.map((c, cIdx) => (
                  <a key={cIdx} href={c.url} target="_blank" rel="noopener noreferrer" className="citation-pill">
                    <Globe size={12} />
                    <span>{c.domain}</span>
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Tracked Prompt Card */}
      <div className="growth-panel-card growth-add-prompt-card">
        <div className="growth-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="ai-report-icon-box" style={{ width: 38, height: 38, borderRadius: 10 }}>
              <Plus size={18} />
            </div>
            <div>
              <h3 className="growth-panel-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                Track New Search Query (Prompt)
              </h3>
              <p className="growth-panel-desc" style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Monitor your brand's presence across Gemini, ChatGPT, and Perplexity searches.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {prompts.length < 10 ? (
              <span className="growth-badge warning" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={13} />
                Setup Incomplete ({prompts.length} / 10 Queries)
              </span>
            ) : (
              <span className="growth-badge green" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={13} />
                Setup Complete (10/10)
              </span>
            )}

            <button
              type="button"
              onClick={handleOpenAiModal}
              disabled={prompts.length >= 10 || isBatchScanning}
              className="growth-primary-btn ai-generate-magic-btn"
              title="Let Gemini AI analyze your website and industry to generate queries automatically"
            >
              <Sparkles size={14} />
              <span>Generate Queries with AI</span>
            </button>
          </div>
        </div>

        {/* Setup Status & Progress Notification */}
        {prompts.length < 10 && (
          <div className="growth-prompt-setup-banner">
            <div className="setup-banner-left">
              <div className="setup-banner-icon-box">
                <AlertCircle size={22} color="#f59e0b" />
              </div>
              <div className="setup-banner-text">
                <div className="setup-banner-title-row">
                  <h4 className="setup-banner-title">Setup Incomplete (Track 10 Queries)</h4>
                  <span className="setup-banner-badge">{prompts.length} / 10 Queries ({prompts.length * 10}%)</span>
                </div>
                <p className="setup-banner-desc">
                  For a consistent GEO visibility score across Google Gemini, ChatGPT and Perplexity, define at least 10 search questions. You can add the remaining <strong>{10 - prompts.length}</strong> manually or click <strong>Generate Queries with AI</strong> to auto-generate them in one click.
                </p>
                <div className="setup-progress-track">
                  <div className="setup-progress-fill" style={{ width: `${(prompts.length / 10) * 100}%` }} />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenAiModal}
              className="growth-primary-btn setup-banner-cta-btn"
            >
              <Sparkles size={14} />
              <span>Complete with AI ({10 - prompts.length} Queries)</span>
            </button>
          </div>
        )}

        {prompts.length >= 10 && (
          <div className="growth-prompt-completed-banner">
            <CheckCircle2 size={16} color="#10b981" />
            <span><strong>Setup Complete:</strong> 10 search queries are actively monitored. You can test them individually live below or click "Scan All Sequentially" to generate a timestamped GEO Report.</span>
          </div>
        )}

        <form onSubmit={handleAddPrompt} className="growth-prompt-form-grid" style={prompts.length >= 10 ? { opacity: 0.7 } : {}}>
          <div className="growth-prompt-inputs-split">
            <div className="growth-field-item flex-3">
              <label className="growth-field-label">
                <MessageSquare size={13} color="#3b82f6" />
                <span>Target Search Query / Prompt</span>
              </label>
              <input
                type="text"
                placeholder={prompts.length >= 10 ? "Limit reached (10/10) - Delete an existing prompt to add a new one" : "e.g. What is the best B2B SEO and growth platform?"}
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                className="growth-custom-text-input"
                disabled={addingPrompt || prompts.length >= 10}
                required
              />
            </div>

            <div className="growth-field-item flex-1">
              <label className="growth-field-label">
                <Sparkles size={13} color="#8b5cf6" />
                <span>Category / Topic</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SEO &amp; Growth"
                value={newPromptTopic}
                onChange={(e) => setNewPromptTopic(e.target.value)}
                className="growth-custom-text-input"
                disabled={addingPrompt || prompts.length >= 10}
              />
            </div>
          </div>

          <div className="growth-prompt-targeting-split">
            <div className="growth-dropdown-col">
              <AiVisibilityDropdown
                id="growth-prompt-country"
                label="Target Market / Country"
                icon={<Globe size={13} color="#3b82f6" />}
                options={MARKET_OPTIONS}
                value={selectedCountry}
                onChange={setSelectedCountry}
                disabled={addingPrompt || prompts.length >= 10}
              />
            </div>

            <div className="growth-dropdown-col">
              <AiVisibilityDropdown
                id="growth-prompt-language"
                label="Query Language"
                icon={<Languages size={13} color="#8b5cf6" />}
                options={LANGUAGE_OPTIONS}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                disabled={addingPrompt || prompts.length >= 10}
              />
            </div>

            <div className="growth-submit-col">
              <button
                type="submit"
                disabled={addingPrompt || !newPromptText.trim() || prompts.length >= 10}
                className="growth-primary-btn growth-prompt-submit-btn"
                style={prompts.length >= 10 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                {addingPrompt ? (
                  <Loader2 size={15} className="spin" />
                ) : prompts.length >= 10 ? (
                  <Lock size={15} />
                ) : (
                  <Plus size={15} />
                )}
                <span>{prompts.length >= 10 ? 'Limit Reached (10/10)' : 'Track Prompt'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tracked Prompts List */}
      <div className="growth-panel-card">
        <div className="growth-panel-header">
          <div>
            <h3 className="growth-panel-title">Tracked Prompts ({prompts.length} / 10)</h3>
            <p className="growth-panel-desc">
              Search queries monitored on a regular basis. Scan all sequentially to generate a timestamped snapshot report.
            </p>
          </div>

          <div className="growth-panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {reportsList.length > 0 && (
              <div className="ai-report-history-select-wrap">
                <History size={13} color="#a1a1aa" />
                <select
                  className="ai-report-history-select"
                  value={activeReport?.id || ''}
                  onChange={(e) => handleLoadReport(e.target.value)}
                  disabled={isBatchScanning}
                  title="Review Historical AI Reports"
                >
                  {reportsList.map(r => (
                    <option key={r.id} value={r.id}>
                      {formatFullDate(r.created_at)} — {r.visibility_score}% GEO ({r.total_prompts} Prompts)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              disabled={isBatchScanning || prompts.length === 0}
              onClick={handleStartBatchScan}
              className="growth-primary-btn"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
              title="Tests all prompts sequentially, generating and archiving a timestamped report"
            >
              {isBatchScanning ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Scanning ({batchProgress.current}/{batchProgress.total})...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Scan All Sequentially (Create 1 Report)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="growth-skeleton-opp-card">
                <div className="skeleton-opp-info">
                  <SkeletonBlock width="70%" height="16px" borderRadius="4px" />
                  <SkeletonBlock width="35%" height="13px" borderRadius="4px" style={{ marginTop: 6 }} />
                </div>
                <SkeletonBlock width="110px" height="34px" borderRadius="8px" />
              </div>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="growth-empty-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#a78bfa'
            }}>
              <MessageSquare size={28} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main, #ffffff)', marginBottom: 8 }}>
              No Tracked Search Queries Yet (Setup Pending)
            </h4>
            <p style={{ maxWidth: 480, margin: '0 auto 20px', color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.6 }}>
              At least 10 industry queries should be tracked to compute a reliable GEO visibility score across AI search engines. Generate queries with AI in one click or add them manually above.
            </p>
            <button
              type="button"
              onClick={handleOpenAiModal}
              className="growth-primary-btn ai-generate-magic-btn"
              style={{ margin: '0 auto', display: 'inline-flex' }}
            >
              <Sparkles size={14} />
              <span>Generate Queries with AI</span>
            </button>
          </div>
        ) : (
          <div className="growth-prompts-table">
            {prompts.map((p) => {
              const isRunning = runningPromptId === p.id;
              const marketOpt = getMarketOption(p.country || 'TR');
              const langOpt = getLanguageOption(p.language || 'tr');

              return (
                <div key={p.id} className="prompt-table-row">
                  <div className="prompt-info-col">
                    <span className="prompt-text">"{p.prompt}"</span>
                    <div className="prompt-meta-row">
                      <span className="prompt-topic-tag">{p.topic || 'General'}</span>
                      <span className="prompt-meta-badge" title={`Target Country: ${marketOpt.label}`}>
                        {marketOpt.icon}
                        <span>{marketOpt.code || p.country || 'TR'}</span>
                      </span>
                      <span className="prompt-meta-badge lang" title={`Query Language: ${langOpt.label}`}>
                        <Languages size={12} color="#8b5cf6" />
                        <span>{langOpt.code || (p.language || 'TR').toUpperCase()}</span>
                      </span>
                      <span className="prompt-runs-tag">{p.run_count || 0} Tests Run</span>
                      {p.last_brand_mentioned !== null && p.last_brand_mentioned !== undefined && (
                        <span className={`prompt-mention-status-tag ${p.last_brand_mentioned ? 'mentioned' : 'not-mentioned'}`}>
                          {p.last_brand_mentioned ? '✓ Brand Recommended' : '✕ Not Listed'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="prompt-actions-col">
                    <button
                      type="button"
                      disabled={isRunning || isBatchScanning}
                      onClick={() => handleRunPrompt(p.id)}
                      className="growth-run-test-btn"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 size={14} className="auth-spinner" />
                          <span>Querying Gemini...</span>
                        </>
                      ) : (
                        <>
                          <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 14, height: 14 }} />
                          <span>Test with Gemini</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isRunning || isBatchScanning}
                      onClick={() => setDeleteTargetPrompt(p)}
                      className="prompt-row-delete-btn"
                      title="Remove Prompt"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Historical AI Reports Timeline & Archive */}
      {reportsList.length > 0 && !isBatchScanning && (
        <div id="ai-reports-history-section" className="growth-panel-card ai-reports-history-panel animate-fade">
          <div className="growth-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="ai-report-icon-box" style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(59, 130, 246, 0.22))', borderColor: 'rgba(168, 85, 247, 0.35)', color: '#c084fc' }}>
                <History size={18} />
              </div>
              <div>
                <h3 className="growth-panel-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                  Timestamped AI Report Archive
                </h3>
                <p className="growth-panel-desc" style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Total of {reportsList.length} archived audit reports. Click any report to inspect.
                </p>
              </div>
            </div>
          </div>

          {/* Date Filter & Sort Toolbar */}
          <div className="ai-history-toolbar">
            <div className="ai-history-date-filters">
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
                <Filter size={12} /> Filter:
              </span>
              {[
                { key: 'all', label: `All (${reportsList.length})` },
                { key: 'today', label: 'Today' },
                { key: '7d', label: 'Last 7 Days' },
                { key: '30d', label: 'Last 30 Days' },
                { key: 'custom', label: 'Custom Date' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setHistoryDateFilter(f.key);
                    setHistoryPage(1);
                  }}
                  className={`ai-history-filter-pill ${historyDateFilter === f.key ? 'active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowUpDown size={12} /> Sort:
              </span>
              <select
                className="ai-history-sort-select"
                value={historySortOrder}
                onChange={(e) => {
                  setHistorySortOrder(e.target.value);
                  setHistoryPage(1);
                }}
              >
                <option value="newest">Date (Newest)</option>
                <option value="oldest">Date (Oldest)</option>
                <option value="score_high">Score (Highest)</option>
                <option value="score_low">Score (Lowest)</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs Row */}
          {historyDateFilter === 'custom' && (
            <div className="ai-history-custom-range animate-fade">
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} color="#3b82f6" /> Start:
              </span>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => {
                  setHistoryStartDate(e.target.value);
                  setHistoryPage(1);
                }}
                className="ai-history-date-input"
              />
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 6 }}>End:</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => {
                  setHistoryEndDate(e.target.value);
                  setHistoryPage(1);
                }}
                className="ai-history-date-input"
              />
              {(historyStartDate || historyEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                    setHistoryPage(1);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    marginLeft: 6
                  }}
                >
                  Reset Dates
                </button>
              )}
            </div>
          )}

          {/* Reports Grid */}
          {filteredAndSortedReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
              <Calendar size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--text-main, #e2e8f0)', fontWeight: 600 }}>
                No saved reports match the selected date criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setHistoryDateFilter('all');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setHistoryPage(1);
                }}
                className="growth-secondary-btn"
                style={{ margin: '0 auto', fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="ai-reports-history-grid">
              {paginatedReports.map((rep) => {
                const isSelected = activeReport?.id === rep.id;
                const repScore = Number(rep.visibility_score) || 0;
                const scoreClass = repScore >= 70 ? '' : repScore >= 40 ? 'warning' : 'danger';

                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      handleLoadReport(rep.id);
                      reportPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`ai-history-report-card ${isSelected ? 'active' : ''}`}
                    title="Inspect report details for this date"
                  >
                    <div className="ai-history-card-top">
                      <div className="ai-history-date-box">
                        <span className="ai-history-date-full">
                          <Calendar size={13} color="#3b82f6" />
                          <span>{formatFullDate(rep.created_at)}</span>
                        </span>
                        <span className="ai-history-date-rel">
                          <Clock size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'text-bottom' }} />
                          {formatRelativeTime(rep.created_at)}
                        </span>
                      </div>

                      <div className={`ai-history-score-badge ${scoreClass}`}>
                        <span>{repScore}% GEO</span>
                      </div>
                    </div>

                    <div className="ai-history-stats-row">
                      <div className="ai-history-stat-item">
                        <span className="ai-history-stat-label">Tested</span>
                        <span className="ai-history-stat-val">{rep.total_prompts} Prompts</span>
                      </div>
                      <div className="ai-history-stat-item">
                        <span className="ai-history-stat-label">Brand</span>
                        <span className="ai-history-stat-val" style={{ color: rep.mentioned_count > 0 ? '#34d399' : '#f87171' }}>
                          {rep.mentioned_count} Mentioned
                        </span>
                      </div>
                      <div className="ai-history-stat-item">
                        <span className="ai-history-stat-label">Citations</span>
                        <span className="ai-history-stat-val" style={{ color: rep.cited_count > 0 ? '#34d399' : '#94a3b8' }}>
                          {rep.cited_count} Sites
                        </span>
                      </div>
                    </div>

                    <div className="ai-history-card-footer">
                      <button
                        type="button"
                        className="ai-history-view-btn"
                      >
                        <span>{isSelected ? '✓ Currently Viewing' : 'Inspect Report'}</span>
                        <ArrowUpRight size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteReport(rep.id, e)}
                        className="ai-history-delete-btn"
                        title="Delete this report from archive"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedReports.length > historyPerPage && (
            <div className="ai-history-pagination-bar">
              <span className="ai-history-page-info">
                Showing <strong>{(currentHistoryPage - 1) * historyPerPage + 1}</strong> - <strong>{Math.min(currentHistoryPage * historyPerPage, filteredAndSortedReports.length)}</strong> of <strong>{filteredAndSortedReports.length}</strong> reports (Page {currentHistoryPage} / {totalHistoryPages})
              </span>

              <div className="ai-history-pagination-nav">
                <button
                  type="button"
                  onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                  disabled={currentHistoryPage <= 1}
                  className="ai-history-page-btn"
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setHistoryPage(pageNum)}
                    className={`ai-history-page-btn ${pageNum === currentHistoryPage ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                  disabled={currentHistoryPage >= totalHistoryPages}
                  className="ai-history-page-btn"
                  title="Next Page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Prompt Generator Modal */}
      {isAiGenModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => !savingAiPrompts && !generatingAiPrompts && setIsAiGenModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-gen-modal-title"
        >
          <div className="growth-modal-card ai-gen-modal-card animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="ai-gen-modal-header-icon">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 id="ai-gen-modal-title" className="ai-gen-modal-title">
                    Generate Search Prompts with AI
                  </h2>
                  <p className="ai-gen-modal-subtitle">
                    Gemini analyzes your domain <strong>{activeWorkspace?.primary_domain || activeWorkspace?.name}</strong> and industry to generate GEO-focused search prompts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="growth-modal-close"
                onClick={() => setIsAiGenModalOpen(false)}
                disabled={savingAiPrompts || generatingAiPrompts}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="growth-modal-body">
              {generatingAiPrompts ? (
                <div className="ai-gen-loading-box">
                  <div className="ai-gen-pulse-circle">
                    <Loader2 size={32} className="spin text-primary" style={{ color: '#8b5cf6' }} />
                  </div>
                  <h4 className="ai-gen-loading-title">
                    Generating AI Search Prompts...
                  </h4>
                  <p className="ai-gen-loading-desc">
                    Google Gemini is modeling your target audience, industry, and critical user queries directed at AI engines.
                  </p>
                </div>
              ) : aiGenError ? (
                <div className="growth-alert-card warning" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem', borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.86rem' }}>
                    <strong>Error:</strong> {aiGenError}
                  </div>
                  <button
                    type="button"
                    onClick={fetchAiPromptSuggestions}
                    className="growth-secondary-btn"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    Retry
                  </button>
                </div>
              ) : aiGeneratedSuggestions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No prompt suggestions found.
                </div>
              ) : (
                <div className="ai-gen-suggestions-wrap">
                  <div className="ai-gen-suggestions-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="ai-gen-count-badge">
                        {aiGeneratedSuggestions.filter(s => s.selected).length} / {aiGeneratedSuggestions.length} Prompts Selected
                      </span>
                      <span className="ai-gen-info-count">
                        (Total when added: {Math.min(10, prompts.length + aiGeneratedSuggestions.filter(s => s.selected).length)}/10)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSelectAllSuggestions}
                      className="ai-gen-toggle-all-btn"
                    >
                      {aiGeneratedSuggestions.every(s => s.selected) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="ai-gen-list">
                    {aiGeneratedSuggestions.map((item, idx) => (
                      <label key={idx} className={`ai-gen-item ${item.selected ? 'is-selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSuggestion(idx)}
                          className="ai-gen-checkbox"
                        />
                        <div className="ai-gen-item-content">
                          <span className="ai-gen-prompt-text">"{item.prompt}"</span>
                          <div className="ai-gen-item-meta">
                            <span className="ai-gen-topic-pill">{item.topic || 'Industry Leadership'}</span>
                            <span className="ai-gen-engine-tag">
                              <Sparkles size={10} color="#8b5cf6" />
                              <span>GEO Targeted</span>
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="growth-modal-footer">
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setIsAiGenModalOpen(false)}
                disabled={savingAiPrompts}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveSelectedAiPrompts}
                disabled={generatingAiPrompts || savingAiPrompts || aiGeneratedSuggestions.filter(s => s.selected).length === 0}
                className="growth-primary-btn ai-gen-save-btn"
              >
                {savingAiPrompts ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Add Selected to Tracker ({aiGeneratedSuggestions.filter(s => s.selected).length} Prompts)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal - Custom UI */}
      {deleteTargetPrompt && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => !deletingPromptId && setDeleteTargetPrompt(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-prompt-modal-title"
        >
          <div 
            className="growth-modal-card comp-delete-modal-card animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="growth-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="comp-delete-modal-icon">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h2 id="delete-prompt-modal-title" className="ai-gen-modal-title">
                    Remove Search Prompt from Tracker
                  </h2>
                  <p className="ai-gen-modal-subtitle">
                    This prompt will be removed from tracking, freeing up a slot in your list.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="growth-modal-close"
                onClick={() => setDeleteTargetPrompt(null)}
                disabled={Boolean(deletingPromptId)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="growth-modal-body">
              <div className="delete-target-preview-box">
                <p className="delete-target-preview-text">
                  "{deleteTargetPrompt.prompt}"
                </p>
                <div className="delete-target-preview-meta">
                  <span className="prompt-topic-tag">{deleteTargetPrompt.topic || 'General'}</span>
                  <span>{deleteTargetPrompt.run_count || 0} Tests Run</span>
                </div>
              </div>
              <div className="delete-modal-explain-box">
                <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>Deleting this prompt will free up 1 slot in your 10-prompt tracking limit. Are you sure?</span>
              </div>
            </div>

            <div className="growth-modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setDeleteTargetPrompt(null)}
                disabled={Boolean(deletingPromptId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="comp-delete-confirm-btn"
                onClick={handleConfirmDeletePrompt}
                disabled={Boolean(deletingPromptId)}
              >
                {deletingPromptId ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Remove from Tracker</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
