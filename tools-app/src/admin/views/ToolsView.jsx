import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  SlidersHorizontal, 
  Sparkles, 
  Table as TableIcon, 
  LayoutGrid, 
  CheckCircle2, 
  Eye, 
  Activity, 
  Users, 
  Download, 
  Copy, 
  Check, 
  Info,
  ShieldCheck,
  TrendingUp,
  Box
} from 'lucide-react';
import ToolDetailModal from '../components/ToolDetailModal';

export default function ToolsView({ tools = [], statsOverview = null, loading = false, onSelectTool }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [selectedToolForModal, setSelectedToolForModal] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    tools.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return ['All', ...Array.from(set)];
  }, [tools]);

  // Merge manifest tools with stats from statsOverview if available
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
        download_count: downloads,
        copy_count: copies,
        use_count: uses,
        total_tasks: totalTasks,
        cvr: cvr,
        is_active: tool.is_active !== undefined ? tool.is_active : true
      };
    });
  }, [tools, statsOverview]);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return mergedTools.filter(tool => {
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = (tool.title || '').toLowerCase().includes(q);
      const matchSlug = (tool.slug || '').toLowerCase().includes(q);
      const matchDesc = (tool.description || tool.short_description || '').toLowerCase().includes(q);
      const matchKeywords = Array.isArray(tool.keywords) && tool.keywords.some(k => k.toLowerCase().includes(q));

      return matchTitle || matchSlug || matchDesc || matchKeywords;
    });
  }, [mergedTools, selectedCategory, searchQuery]);

  // Aggregate KPI numbers
  const totalToolsCount = mergedTools.length;
  const totalVisitorsCount = mergedTools.reduce((acc, t) => acc + (t.unique_visitors_count || 0), 0);
  const totalTasksCompleted = mergedTools.reduce((acc, t) => acc + (t.total_tasks || 0), 0);
  const avgCvr = totalVisitorsCount > 0 
    ? ((totalTasksCompleted / totalVisitorsCount) * 100).toFixed(1) 
    : '0.0';

  const handleCopyLink = (slug, e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(`https://tools.cerilas.com/tool/${slug}`);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (err) {}
  };

  return (
    <div className="admin-body">
      {/* 1. KPI Top Summary Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Registered Tools</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Box size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">{totalToolsCount}</div>
          <div className="admin-kpi-sub">
            <CheckCircle2 size={13} color="#10b981" />
            <span style={{ color: '#10b981', fontWeight: 600 }}>100% Operational</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Unique Visitors</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">{totalVisitorsCount.toLocaleString()}</div>
          <div className="admin-kpi-sub">
            <span>Verified browser devices</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Tasks Executed</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Download size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#10b981' }}>
            {totalTasksCompleted.toLocaleString()}
          </div>
          <div className="admin-kpi-sub">
            <span>Downloads, copies & generations</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Conversion Rate</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#3b82f6' }}>
            {avgCvr}%
          </div>
          <div className="admin-kpi-sub">
            <span>Visitor to task conversion</span>
          </div>
        </div>
      </div>

      {/* 2. Toolbar (Search, Filter, View Switcher) */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input 
            type="text" 
            className="admin-search-input"
            placeholder="Search tools by title, slug, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`admin-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="admin-view-switcher">
          <button 
            type="button"
            className={`admin-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Data Table View"
          >
            <TableIcon size={15} />
          </button>
          <button 
            type="button"
            className={`admin-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid Cards View"
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {/* 3. Main Tools Display: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="admin-table-container">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Category</th>
                  <th>Engine / Privacy</th>
                  <th>Visitors</th>
                  <th>Tasks Done</th>
                  <th>CVR</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.map((tool) => {
                  const isAi = tool.category === 'AI Assisted' || (tool.keywords && tool.keywords.includes('ai'));
                  return (
                    <tr key={tool.slug}>
                      <td>
                        <div 
                          className="admin-tool-cell"
                          style={{ cursor: 'pointer' }}
                          onClick={() => onSelectTool ? onSelectTool(tool.slug) : setSelectedToolForModal(tool)}
                          title="Click to view tool details"
                        >
                          <img 
                            src={`/tool-icons/${tool.slug}.webp`} 
                            alt="" 
                            className="admin-tool-logo"
                            onError={(e) => {
                              if (!e.target.dataset.triedPng) {
                                e.target.dataset.triedPng = 'true';
                                e.target.src = `/tool-icons/${tool.slug}.png`;
                              }
                            }}
                          />
                          <div className="admin-tool-title-wrap">
                            <span className="admin-tool-title" style={{ transition: 'color 0.15s' }}>{tool.title}</span>
                            <span className="admin-tool-slug">/{tool.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-status-pill" style={{ background: 'rgba(150, 150, 150, 0.1)', color: 'var(--text-muted)' }}>
                          {tool.category || 'General'}
                        </span>
                      </td>
                      <td>
                        {isAi ? (
                          <span className="admin-status-pill admin-status-ai">
                            <Sparkles size={11} />
                            Gemini AI
                          </span>
                        ) : (
                          <span className="admin-status-pill admin-status-active">
                            <ShieldCheck size={11} />
                            Client WASM
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="admin-metric-num">
                          {Number(tool.unique_visitors_count || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="admin-metric-num" style={{ color: '#10b981' }}>
                          {Number(tool.total_tasks || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="admin-cvr-cell">
                          {tool.cvr}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-action-btns" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            className="admin-action-btn"
                            onClick={() => onSelectTool ? onSelectTool(tool.slug) : setSelectedToolForModal(tool)}
                            title="View Tool Details & Analytics"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                          <button 
                            type="button" 
                            className="admin-action-btn"
                            onClick={(e) => handleCopyLink(tool.slug, e)}
                            title="Copy Live URL"
                          >
                            {copiedSlug === tool.slug ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                          </button>
                          <a 
                            href={`/tool/${tool.slug}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="admin-action-btn primary"
                            title="Open live tool in new tab"
                          >
                            <ExternalLink size={13} />
                            <span>Open</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-grid">
          {filteredTools.map((tool) => {
            const isAi = tool.category === 'AI Assisted' || (tool.keywords && tool.keywords.includes('ai'));
            return (
              <div key={tool.slug} className="admin-grid-card">
                <div>
                  <div className="admin-grid-top">
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                      onClick={() => onSelectTool ? onSelectTool(tool.slug) : setSelectedToolForModal(tool)}
                      title="Click to view tool details"
                    >
                      <img 
                        src={`/tool-icons/${tool.slug}.webp`} 
                        alt="" 
                        className="admin-tool-logo"
                        onError={(e) => {
                          if (!e.target.dataset.triedPng) {
                            e.target.dataset.triedPng = 'true';
                            e.target.src = `/tool-icons/${tool.slug}.png`;
                          }
                        }}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{tool.title}</h4>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          /{tool.slug}
                        </span>
                      </div>
                    </div>
                    {isAi ? (
                      <span className="admin-status-pill admin-status-ai">
                        <Sparkles size={10} />
                        AI
                      </span>
                    ) : (
                      <span className="admin-status-pill admin-status-active">
                        <ShieldCheck size={10} />
                        WASM
                      </span>
                    )}
                  </div>

                  <p className="admin-grid-desc">
                    {tool.description || tool.short_description || tool.seo?.description || 'No description provided.'}
                  </p>

                  <div className="admin-grid-metrics">
                    <div className="admin-grid-metric-box">
                      <span className="admin-grid-metric-label">Visitors</span>
                      <span className="admin-grid-metric-val">{Number(tool.unique_visitors_count || 0).toLocaleString()}</span>
                    </div>
                    <div className="admin-grid-metric-box">
                      <span className="admin-grid-metric-label">Tasks</span>
                      <span className="admin-grid-metric-val" style={{ color: '#10b981' }}>{Number(tool.total_tasks || 0).toLocaleString()}</span>
                    </div>
                    <div className="admin-grid-metric-box">
                      <span className="admin-grid-metric-label">CVR</span>
                      <span className="admin-grid-metric-val" style={{ color: '#3b82f6' }}>{tool.cvr}%</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--card-border, rgba(0,0,0,0.06))', paddingTop: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="admin-action-btn"
                    onClick={() => onSelectTool ? onSelectTool(tool.slug) : setSelectedToolForModal(tool)}
                    title="View Tool Details & Analytics"
                  >
                    <Eye size={13} />
                    <span>Details</span>
                  </button>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      type="button" 
                      className="admin-action-btn"
                      onClick={(e) => handleCopyLink(tool.slug, e)}
                    >
                      {copiedSlug === tool.slug ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    </button>
                    <a 
                      href={`/tool/${tool.slug}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="admin-action-btn primary"
                    >
                      <ExternalLink size={13} />
                      <span>Open</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Inspection Detail Modal */}
      {selectedToolForModal && (
        <ToolDetailModal 
          tool={selectedToolForModal}
          isOpen={!!selectedToolForModal}
          onClose={() => setSelectedToolForModal(null)}
        />
      )}
    </div>
  );
}
