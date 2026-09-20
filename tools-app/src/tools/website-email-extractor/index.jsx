import React, { useState, useMemo } from 'react';
import {
  Globe,
  Mail,
  Search,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Building2,
  Users,
  Layers,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import './EmailExtractor.css';

export default function WebsiteEmailExtractor() {
  const [targetUrl, setTargetUrl] = useState('');
  const [maxPages, setMaxPages] = useState(25);
  const [maxDepth, setMaxDepth] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [copiedKey, setCopiedKey] = useState(null);
  const [bulkCopyStatus, setBulkCopyStatus] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);
    setSelectedDept('All');
    setSearchQuery('');

    try {
      const response = await fetch('/api/tools/website-email-extractor/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl.trim(),
          maxPages: parseInt(maxPages, 10),
          maxDepth: parseInt(maxDepth, 10)
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to crawl website.');
      }

      setResults(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during site crawling.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEmail = (email, key) => {
    navigator.clipboard.writeText(email);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleBulkCopy = (separator = '\n') => {
    if (!results || !results.emails) return;
    const emailList = filteredEmails.map((e) => e.email).join(separator);
    navigator.clipboard.writeText(emailList);
    setBulkCopyStatus(separator === '\n' ? 'newline' : 'comma');
    setTimeout(() => setBulkCopyStatus(null), 2000);
  };

  const handleExportCsv = () => {
    if (!results || !results.emails || results.emails.length === 0) return;

    const headers = ['Email', 'Name', 'Department', 'Role', 'Source URL', 'Detection Method'];
    const rows = filteredEmails.map((item) => [
      `"${item.email.replace(/"/g, '""')}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.department || '').replace(/"/g, '""')}"`,
      `"${(item.role || '').replace(/"/g, '""')}"`,
      `"${(item.sourceUrl || '').replace(/"/g, '""')}"`,
      `"${(item.detectionMethod || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${results.targetDomain || 'website'}_emails.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    if (!results || !results.emails) return;
    const jsonStr = JSON.stringify(filteredEmails, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${results.targetDomain || 'website'}_emails.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departmentList = useMemo(() => {
    if (!results || !results.departmentBreakdown) return [];
    return Object.keys(results.departmentBreakdown);
  }, [results]);

  const filteredEmails = useMemo(() => {
    if (!results || !results.emails) return [];
    const q = searchQuery.toLowerCase().trim();

    return results.emails.filter((item) => {
      const matchesDept = selectedDept === 'All' || item.department === selectedDept;
      if (!matchesDept) return false;

      if (!q) return true;
      return (
        item.email.toLowerCase().includes(q) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.role && item.role.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        (item.sourceUrl && item.sourceUrl.toLowerCase().includes(q))
      );
    });
  }, [results, selectedDept, searchQuery]);

  const getDeptClass = (dept) => {
    if (!dept) return 'general';
    const d = dept.toLowerCase();
    if (d.includes('executive') || d.includes('leadership')) return 'executive';
    if (d.includes('sales') || d.includes('business')) return 'sales';
    if (d.includes('human resources') || d.includes('talent')) return 'hr';
    if (d.includes('engineering') || d.includes('technology')) return 'engineering';
    if (d.includes('support') || d.includes('operations')) return 'support';
    if (d.includes('finance') || d.includes('billing')) return 'finance';
    if (d.includes('legal') || d.includes('compliance')) return 'legal';
    if (d.includes('press') || d.includes('media')) return 'press';
    return 'general';
  };

  return (
    <div className="email-extractor-container">
      {/* Header */}
      <div className="email-extractor-header">
        <div className="email-extractor-badge-row">
          <span className="email-extractor-badge">
            <ShieldCheck size={14} />
            Zero AI & Privacy Safe
          </span>
          <span className="email-extractor-badge rule-based">
            <Layers size={14} />
            Deterministic DOM Engine
          </span>
        </div>
        <h1 className="email-extractor-title">Website Email & Department Extractor</h1>
        <p className="email-extractor-desc">
          Recursively crawl any website to discover and organize verified email addresses by department, company unit, and personnel using rule-based DOM hierarchy and regex parsing.
        </p>
      </div>

      {/* Crawl Control Form */}
      <div className="crawl-card">
        <form onSubmit={handleSubmit}>
          <div className="crawl-input-group">
            <div className="crawl-url-input-wrap">
              <Globe size={18} className="crawl-url-icon" />
              <input
                type="text"
                className="crawl-url-input"
                placeholder="Enter domain or website URL (e.g. example.com, company.org)"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="crawl-submit-btn"
              disabled={isLoading || !targetUrl.trim()}
            >
              {isLoading ? (
                <>
                  <div className="crawl-spinner" />
                  Scanning Site...
                </>
              ) : (
                <>
                  Extract Contacts
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <div className="crawl-options-row">
            <div className="crawl-options-group">
              <span className="crawl-option-label">Crawl Scope:</span>
              <select
                className="crawl-select"
                value={maxPages}
                onChange={(e) => setMaxPages(e.target.value)}
                disabled={isLoading}
              >
                <option value={10}>Quick Scan (10 Pages)</option>
                <option value={25}>Standard Scan (25 Pages)</option>
                <option value={50}>Deep Scan (50 Pages)</option>
              </select>
            </div>

            <div className="crawl-options-group">
              <span className="crawl-option-label">Subpage Depth:</span>
              <select
                className="crawl-select"
                value={maxDepth}
                onChange={(e) => setMaxDepth(e.target.value)}
                disabled={isLoading}
              >
                <option value={1}>Level 1 (Direct Links)</option>
                <option value={2}>Level 2 (Standard Hierarchy)</option>
                <option value={3}>Level 3 (Deep Nested Pages)</option>
              </select>
            </div>

            <div className="crawl-options-group" style={{ color: 'var(--text-muted)' }}>
              Domain scope: Same origin only
            </div>
          </div>
        </form>
      </div>

      {/* Loading Progress State */}
      {isLoading && (
        <div className="crawl-progress-banner">
          <div className="crawl-spinner" />
          <div className="crawl-progress-text">
            <strong>Active Site Crawling in Progress...</strong>
            <br />
            Fetching internal subpages, extracting mailto links, parsing text nodes, and evaluating DOM unit hierarchies.
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            color: '#dc2626',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {results && (
        <>
          {/* Stats Grid */}
          <div className="extractor-stats-grid">
            <div className="extractor-stat-card">
              <div className="extractor-stat-icon-wrap">
                <Mail size={20} />
              </div>
              <div>
                <div className="extractor-stat-value">{results.stats.totalEmailsFound}</div>
                <div className="extractor-stat-label">Verified Emails</div>
              </div>
            </div>

            <div className="extractor-stat-card">
              <div className="extractor-stat-icon-wrap">
                <Building2 size={20} />
              </div>
              <div>
                <div className="extractor-stat-value">{results.stats.uniqueDepartmentsCount}</div>
                <div className="extractor-stat-label">Departments Identified</div>
              </div>
            </div>

            <div className="extractor-stat-card">
              <div className="extractor-stat-icon-wrap">
                <Globe size={20} />
              </div>
              <div>
                <div className="extractor-stat-value">{results.stats.totalPagesCrawled}</div>
                <div className="extractor-stat-label">Subpages Crawled</div>
              </div>
            </div>

            <div className="extractor-stat-card">
              <div className="extractor-stat-icon-wrap">
                <Users size={20} />
              </div>
              <div>
                <div className="extractor-stat-value">{(results.durationMs / 1000).toFixed(1)}s</div>
                <div className="extractor-stat-label">Execution Time</div>
              </div>
            </div>
          </div>

          {/* Department Filter Tabs */}
          <div className="department-filter-wrap">
            <button
              className={`department-filter-pill ${selectedDept === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedDept('All')}
            >
              All Departments
              <span className="department-pill-count">{results.stats.totalEmailsFound}</span>
            </button>
            {departmentList.map((dept) => (
              <button
                key={dept}
                className={`department-filter-pill ${selectedDept === dept ? 'active' : ''}`}
                onClick={() => setSelectedDept(dept)}
              >
                {dept}
                <span className="department-pill-count">{results.departmentBreakdown[dept]}</span>
              </button>
            ))}
          </div>

          {/* Results Toolbar */}
          <div className="extractor-toolbar">
            <div className="extractor-search-wrap">
              <Search size={15} className="extractor-search-icon" />
              <input
                type="text"
                className="extractor-search-input"
                placeholder="Filter by email, name, role, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="extractor-actions-group">
              <button
                className="extractor-action-btn"
                onClick={() => handleBulkCopy('\n')}
              >
                {bulkCopyStatus === 'newline' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                Copy List (Newline)
              </button>

              <button
                className="extractor-action-btn"
                onClick={() => handleBulkCopy(', ')}
              >
                {bulkCopyStatus === 'comma' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                Copy (Comma)
              </button>

              <button className="extractor-action-btn" onClick={handleExportCsv}>
                <Download size={14} />
                Export CSV
              </button>

              <button className="extractor-action-btn" onClick={handleExportJson}>
                <Download size={14} />
                JSON
              </button>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="extractor-table-card">
            <div className="extractor-table-wrap">
              <table className="extractor-table">
                <thead>
                  <tr>
                    <th>Department / Unit</th>
                    <th>Email Address</th>
                    <th>Name / Role</th>
                    <th>Source Page</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmails.length > 0 ? (
                    filteredEmails.map((item, idx) => (
                      <tr key={item.email + idx}>
                        <td>
                          <span className={`dept-badge ${getDeptClass(item.department)}`}>
                            {item.department}
                          </span>
                        </td>
                        <td>
                          <div className="email-cell-content">
                            <a href={`mailto:${item.email}`} className="email-link-text">
                              {item.email}
                            </a>
                            <button
                              className="email-copy-btn"
                              title="Copy email address"
                              onClick={() => handleCopyEmail(item.email, idx)}
                            >
                              {copiedKey === idx ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: item.name !== 'N/A' ? 500 : 400 }}>
                            {item.name}
                          </div>
                          {item.role !== 'N/A' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {item.role}
                            </div>
                          )}
                        </td>
                        <td>
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-url-link"
                            title={item.sourceUrl}
                          >
                            {item.sourceUrl.replace(/^https?:\/\//i, '')}
                            <ExternalLink size={12} style={{ flexShrink: 0 }} />
                          </a>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.detectionMethod === 'mailto-link' ? 'Mailto Link' : 'Text Node'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        {results.emails.length === 0
                          ? 'No public email addresses were detected on the crawled pages of this site.'
                          : 'No contacts matched your current filter criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Explanatory Info Card */}
      <div className="extractor-info-card">
        <h3 className="extractor-info-title">Deterministic Architecture Without AI</h3>
        <div className="extractor-info-grid">
          <div className="extractor-info-item">
            <h4>RFC 5322 & Mailto Extraction</h4>
            <p>
              Scans document trees for explicit <code>mailto:</code> protocols and applies RFC-compliant regular expressions across all rendered text nodes, skipping tracking tags and media binaries.
            </p>
          </div>
          <div className="extractor-info-item">
            <h4>DOM Tree Heuristic Mapping</h4>
            <p>
              Identifies closest parent containers, section headings, and CSS classes to map each contact into its appropriate department (Sales, HR, Engineering, Support, Executive, Legal).
            </p>
          </div>
          <div className="extractor-info-item">
            <h4>Zero AI & Privacy Isolation</h4>
            <p>
              No data is ever dispatched to external language models, third-party vector databases, or training corpora. Contact parsing runs purely through deterministic algorithms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
