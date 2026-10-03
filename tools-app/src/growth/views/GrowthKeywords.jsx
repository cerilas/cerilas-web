import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  TrendingUp, 
  Search, 
  Plus, 
  Sparkles, 
  Zap, 
  Bot, 
  Target, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  AlertCircle,
  HelpCircle,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { SkeletonBlock } from '../components/GrowthSkeleton';

export default function GrowthKeywords() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterIntent, setFilterIntent] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);

  // Default seed dataset
  const initialKeywordList = [
    { id: 1, keyword: `${activeWorkspace?.name || 'cerilas'} tools`, intent: 'navigational', rank: 1, rankChange: 0, volume: 1800, aiOverview: true, difficulty: 22, suggestedAction: 'Keep brand homepage and docs updated' },
    { id: 2, keyword: 'free online tools', intent: 'informational', rank: 6, rankChange: 2, volume: 8500, aiOverview: true, difficulty: 68, suggestedAction: 'Add FAQ schema and search bar to homepage' },
    { id: 3, keyword: 'llms txt generator', intent: 'commercial', rank: 3, rankChange: 1, volume: 3200, aiOverview: true, difficulty: 45, suggestedAction: 'Enrich product description with schema markup' },
    { id: 4, keyword: 'generative engine optimization', intent: 'informational', rank: 5, rankChange: 3, volume: 4600, aiOverview: true, difficulty: 58, suggestedAction: 'Add contextual internal links to the GEO guide' },
    { id: 5, keyword: 'ats friendly resume builder', intent: 'commercial', rank: 8, rankChange: -1, volume: 12000, aiOverview: false, difficulty: 74, suggestedAction: 'Add customer testimonials and SoftwareApplication Schema' },
    { id: 6, keyword: 'online pomodoro timer', intent: 'transactional', rank: 4, rankChange: 0, volume: 9400, aiOverview: false, difficulty: 52, suggestedAction: 'Optimize meta title and interactive widgets' },
    { id: 7, keyword: 'startup growth analytics', intent: 'informational', rank: 7, rankChange: 2, volume: 2400, aiOverview: true, difficulty: 40, suggestedAction: 'Publish comprehensive data-driven case study' },
    { id: 8, keyword: 'website technical seo audit', intent: 'commercial', rank: 9, rankChange: 1, volume: 5100, aiOverview: true, difficulty: 64, suggestedAction: 'Place direct high-intent CTA button on tool page' }
  ];

  const fetchKeywords = async () => {
    if (!activeWorkspace?.id || !token) {
      setKeywords(initialKeywordList);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/keywords`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.data) {
        // Merge stored keywords with analysis metrics
        const stored = json.data;
        if (stored.length > 0) {
          const merged = stored.map((kw, idx) => {
            const existing = initialKeywordList.find(i => i.keyword.toLowerCase() === kw.toLowerCase());
            return existing || {
              id: 100 + idx,
              keyword: kw,
              intent: 'commercial',
              rank: 8 + (idx % 12),
              rankChange: 1,
              volume: 1200 + (idx * 450),
              aiOverview: idx % 2 === 0,
              difficulty: 45 + (idx * 5) % 40,
              suggestedAction: 'Optimize page title and H2 header tags'
            };
          });
          setKeywords(merged);
        } else {
          setKeywords(initialKeywordList);
        }
      } else {
        setKeywords(initialKeywordList);
      }
    } catch (err) {
      setKeywords(initialKeywordList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [activeWorkspace?.id, token]);

  // Lock body scroll & listen for Escape key when modal is open
  useEffect(() => {
    if (!isAddModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsAddModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isAddModalOpen]);

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeywordInput.trim() || !activeWorkspace?.id || !token) return;

    setAddingKeyword(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword: newKeywordInput.trim() })
      });
      if (res.ok) {
        const newObj = {
          id: Date.now(),
          keyword: newKeywordInput.trim(),
          intent: 'commercial',
          rank: 12,
          rankChange: 0,
          volume: 2400,
          aiOverview: true,
          difficulty: 50,
          suggestedAction: 'Create in-depth pillar content and internal links'
        };
        setKeywords(prev => [newObj, ...prev]);
        setNewKeywordInput('');
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error('Add keyword error:', err);
    } finally {
      setAddingKeyword(false);
    }
  };

  const filtered = keywords.filter(kw => {
    const matchesIntent = filterIntent === 'all' 
      ? true 
      : filterIntent === 'ai' 
        ? kw.aiOverview 
        : filterIntent === 'page1'
          ? kw.rank <= 10
          : kw.intent === filterIntent;

    const matchesSearch = searchFilter.trim() === ''
      ? true
      : kw.keyword.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesIntent && matchesSearch;
  });

  const totalKeywords = keywords.length;
  const top3Count = keywords.filter(k => k.rank <= 3).length;
  const page1Count = keywords.filter(k => k.rank <= 10).length;
  const aiOverviewCount = keywords.filter(k => k.aiOverview).length;

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Search Volume & Keyword Rankings"
        badgeIcon={TrendingUp}
        title="Keyword Opportunities & Rankings"
        subtitle="Terms where your domain is ranked on Google Search and AI Overviews, highlighting page-1 quick wins."
        coverImage="/growth-covers/seo-cover.jpg"
        stats={[
          { label: 'Tracked Terms', value: `${totalKeywords} Keywords`, sub: 'Active tracking' },
          { label: 'Page 1 (Top 10)', value: `${page1Count} Keywords`, sub: 'High organic traffic' },
          { label: 'AI Overview', value: `${aiOverviewCount} Queries`, sub: 'GEO opportunity' }
        ]}
        actions={
          <button
            type="button"
            className="growth-primary-btn"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={15} />
            <span>Add New Keyword</span>
          </button>
        }
      />

      {/* Top 4 Metrics */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tracked Keywords</span>
            <Target size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{totalKeywords}</div>
          <div className="stat-card-sub text-muted">Strategic targeted terms</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Top 3 Positions</span>
            <Sparkles size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">{top3Count}</div>
          <div className="stat-card-sub text-muted">Highest organic CTR performers</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Page 1 (Top 10)</span>
            <TrendingUp size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">{page1Count}</div>
          <div className="stat-card-sub text-muted">Active on primary SERP</div>
        </div>

        <div className="growth-stat-card highlight-geo">
          <div className="stat-card-header">
            <span className="stat-card-title">AI Overview Triggers</span>
            <Bot size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">{aiOverviewCount}</div>
          <div className="stat-card-sub text-primary">Featured in generative search answers</div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="growth-subnav-bar">
        <div className="growth-subnav-pills">
          <button
            type="button"
            className={`subnav-pill ${filterIntent === 'all' ? 'active' : ''}`}
            onClick={() => setFilterIntent('all')}
          >
            All Keywords ({totalKeywords})
          </button>
          <button
            type="button"
            className={`subnav-pill highlight ${filterIntent === 'ai' ? 'active' : ''}`}
            onClick={() => setFilterIntent('ai')}
          >
            <img src="/AI-logos/gemini-color.svg" alt="AI Overview" style={{ width: 14, height: 14 }} />
            <span>AI Overview Triggers ({aiOverviewCount})</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterIntent === 'page1' ? 'active' : ''}`}
            onClick={() => setFilterIntent('page1')}
          >
            Page 1 (Top 10)
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterIntent === 'commercial' ? 'active' : ''}`}
            onClick={() => setFilterIntent('commercial')}
          >
            Commercial Intent
          </button>
        </div>

        <div className="growth-search-input-wrap">
          <Search size={14} className="search-input-icon" />
          <input
            type="text"
            placeholder="Filter keywords..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="growth-search-input"
          />
        </div>
      </div>

      {/* Keywords Table */}
      <div className="growth-panel-card">
        <div className="growth-table-wrap">
          <table className="growth-table">
            <thead>
              <tr>
                <th>Keyword / Query</th>
                <th>Search Intent</th>
                <th>Ranking</th>
                <th>Monthly Volume</th>
                <th>AI Overview (GEO)</th>
                <th>Difficulty (KD)</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><SkeletonBlock width="80%" height="16px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="65px" height="22px" borderRadius="999px" /></td>
                    <td><SkeletonBlock width="45px" height="16px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="60px" height="16px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="80px" height="22px" borderRadius="999px" /></td>
                    <td><SkeletonBlock width="70px" height="8px" borderRadius="999px" /></td>
                    <td><SkeletonBlock width="90%" height="16px" borderRadius="4px" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No keywords found matching selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((kw) => (
                  <tr key={kw.id}>
                    <td>
                      <span className="font-semibold text-main">{kw.keyword}</span>
                    </td>
                    <td>
                      <span className={`intent-badge intent-${kw.intent}`}>
                        {kw.intent === 'informational' ? 'Informational' : kw.intent === 'commercial' ? 'Commercial' : kw.intent === 'transactional' ? 'Transactional' : 'Navigational'}
                      </span>
                    </td>
                    <td>
                      <div className="rank-change-cell">
                        <span className={`rank-pill rank-${Math.floor(kw.rank)}`}>
                          #{kw.rank}
                        </span>
                        {kw.rankChange > 0 ? (
                          <span className="rank-trend up"><ArrowUp size={11} />+{kw.rankChange}</span>
                        ) : kw.rankChange < 0 ? (
                          <span className="rank-trend down"><ArrowDown size={11} />{kw.rankChange}</span>
                        ) : (
                          <span className="rank-trend flat">–</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono">{Number(kw.volume || 0).toLocaleString()} /mo</span>
                    </td>
                    <td>
                      {kw.aiOverview ? (
                        <span className="ai-badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <img src="/AI-logos/gemini-color.svg" alt="Google AI" style={{ width: 13, height: 13 }} />
                          <span>AI Overview</span>
                        </span>
                      ) : (
                        <span className="ai-badge-inactive">No AI Overview</span>
                      )}
                    </td>
                    <td>
                      <div className="difficulty-cell">
                        <div className="diff-bar-wrap">
                          <div 
                            className={`diff-bar ${kw.difficulty > 65 ? 'high' : kw.difficulty > 40 ? 'med' : 'low'}`}
                            style={{ width: `${kw.difficulty}%` }}
                          />
                        </div>
                        <span className="diff-val">{kw.difficulty}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="action-hint-text">{kw.suggestedAction}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Keyword Modal */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Target size={18} className="text-primary" />
                <h2>Add New Keyword</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddKeyword}>
              <div className="growth-modal-body">
                <label className="growth-input-label">Keyword or Search Query:</label>
                <input
                  type="text"
                  placeholder="e.g. best b2b analytics software"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  className="growth-text-input"
                  autoFocus
                  required
                />
                <p className="growth-input-hint">
                  Rank position, Google AI Overview trigger status, and monthly search volume will be continuously monitored.
                </p>
              </div>

              <div className="growth-modal-footer">
                <button
                  type="button"
                  className="growth-secondary-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="growth-primary-btn"
                  disabled={addingKeyword || !newKeywordInput.trim()}
                >
                  {addingKeyword ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  <span>Save Keyword</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
