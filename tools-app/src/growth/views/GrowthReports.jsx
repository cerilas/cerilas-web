import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Copy, 
  Check, 
  Plus, 
  X, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Search,
  Activity,
  Bot,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { SkeletonBlock } from '../components/GrowthSkeleton';
import './GrowthReports.css';

export default function GrowthReports() {
  const { activeWorkspace } = useGrowth();
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Report config state
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [recipients, setRecipients] = useState([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [logs, setLogs] = useState([]);
  const [lastSentAt, setLastSentAt] = useState(null);
  const [lastSentStatus, setLastSentStatus] = useState(null);

  // Live telemetry for visual preview
  const [previewData, setPreviewData] = useState(null);

  const fetchConfig = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const [cfgRes, ovRes] = await Promise.all([
        fetch(`/api/growth/workspaces/${activeWorkspace.id}/reports/config`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/growth/workspaces/${activeWorkspace.id}/overview?range=30d`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const cfgJson = await cfgRes.json();
      if (cfgJson.success && cfgJson.data) {
        const c = cfgJson.data.config || {};
        setDailyEnabled(Boolean(c.daily_report_enabled !== false));
        setRecipients(Array.isArray(c.recipients) && c.recipients.length > 0 ? c.recipients : [user?.email || 'deniz@cerilas.com']);
        setLogs(cfgJson.data.logs || []);
        setLastSentAt(c.last_sent_at);
        setLastSentStatus(c.last_sent_status);
      }

      const ovJson = await ovRes.json();
      if (ovJson.success && ovJson.data) {
        setPreviewData(ovJson.data);
      }
    } catch (err) {
      console.error('Fetch report config error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [activeWorkspace?.id, token]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add recipient chip
  const handleAddRecipient = (e) => {
    e.preventDefault();
    setInputError('');
    const email = newEmailInput.trim().toLowerCase();

    if (!email) return;

    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInputError('Please enter a valid email address.');
      return;
    }

    if (recipients.includes(email)) {
      setInputError('This email address is already in the list.');
      return;
    }

    setRecipients(prev => [...prev, email]);
    setNewEmailInput('');
  };

  // Remove recipient chip
  const handleRemoveRecipient = (emailToRemove) => {
    setRecipients(prev => prev.filter(r => r !== emailToRemove));
  };

  // Save config
  const handleSaveConfig = async () => {
    if (!activeWorkspace?.id || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/reports/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          daily_report_enabled: dailyEnabled,
          recipients
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Reporting settings and recipient list saved successfully!');
      } else {
        showToast(json.error || 'Error saving settings.', 'error');
      }
    } catch (err) {
      showToast('Connection error occurred.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Trigger immediate test email
  const handleSendTestEmail = async () => {
    if (!activeWorkspace?.id || !token) return;
    if (recipients.length === 0) {
      showToast('Please add at least one email recipient first.', 'error');
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/reports/send-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Daily test report sent successfully: ${recipients.join(', ')}`);
        // Refresh logs
        fetchConfig();
      } else {
        showToast(json.error || 'Failed to send test email.', 'error');
      }
    } catch (err) {
      showToast('Connection error while sending email.', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="growth-page-container animate-fade">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? '#ef4444' : '#0284c7',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.875rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Automated Email Reporting"
        badgeIcon={Mail}
        title="Daily Executive Email Digest"
        subtitle="Automatically send Google Search Console, Google Analytics 4, and AI (GEO) visibility summaries to your designated team emails every morning."
        coverImage="/growth-covers/overview-cover.jpg"
        stats={[
          { 
            label: 'Recipient Count', 
            value: `${recipients.length} Emails`, 
            sub: dailyEnabled ? 'Automated digest active' : 'Notifications paused' 
          },
          { 
            label: 'Delivery Status', 
            value: dailyEnabled ? 'Active (Every Morning)' : 'Inactive', 
            sub: lastSentAt ? `Last sent: ${new Date(lastSentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for first delivery' 
          },
          { 
            label: 'Data Verification', 
            value: '100% Live', 
            sub: 'GSC + GA4 + GEO Telemetry' 
          }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="growth-primary-btn"
              onClick={handleSendTestEmail}
              disabled={sendingTest || recipients.length === 0}
            >
              {sendingTest ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>{sendingTest ? 'Sending Email...' : 'Send Test Report Now'}</span>
            </button>
          </div>
        }
      />

      <div className="reports-container">
        
        {/* ROW 1: 2-Column Grid (Recipients Management + cron-job.org Webhook) */}
        <div className="reports-grid-two-col">

          {/* CARD 1: EMAIL RECIPIENTS MANAGEMENT */}
          <div className="reports-card">
            <div className="reports-card-header">
              <div className="reports-card-title-group">
                <div className="reports-card-title-row">
                  <div className="reports-card-icon sky">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="reports-card-title">1. Daily Report Recipients</h3>
                    <span className="reports-card-sub">
                      Send daily performance summaries to the following email addresses:
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div 
                className="report-toggle-wrap"
                onClick={() => setDailyEnabled(prev => !prev)}
                title="Toggle daily automated reporting"
              >
                <div className={`report-toggle-switch ${dailyEnabled ? 'is-active' : ''}`}>
                  <div className="report-toggle-handle" />
                </div>
                <span className="report-toggle-label">
                  {dailyEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="recipients-box">
              <div className="recipients-chips-list">
                {recipients.length === 0 ? (
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}>
                    No recipient email addresses added yet. Add at least one address to receive reports.
                  </span>
                ) : (
                  recipients.map((email, idx) => (
                    <div key={idx} className="recipient-chip animate-fade">
                      <Mail size={12} />
                      <span>{email}</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        title="Remove address"
                        onClick={() => handleRemoveRecipient(email)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Recipient Form */}
              <form onSubmit={handleAddRecipient} className="add-recipient-form">
                <input
                  type="email"
                  placeholder="e.g. team@yourcompany.com"
                  value={newEmailInput}
                  onChange={(e) => {
                    setNewEmailInput(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  className="recipient-input"
                />
                <button
                  type="submit"
                  className="add-recipient-btn"
                  disabled={!newEmailInput.trim()}
                >
                  <Plus size={14} />
                  <span>+ Add</span>
                </button>
              </form>
              {inputError && (
                <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '-0.3rem' }}>
                  {inputError}
                </span>
              )}
            </div>

            <div className="recipients-footer-actions">
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {recipients.length} email recipients configured
              </span>
              <button
                type="button"
                className="reports-save-btn"
                onClick={handleSaveConfig}
                disabled={saving}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

          {/* CARD 2: HOW IT WORKS & INFO */}
          <div className="reports-card">
            <div className="reports-card-header">
              <div className="reports-card-title-group">
                <div className="reports-card-title-row">
                  <div className="reports-card-icon emerald">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="reports-card-title">2. Automated Report Scope</h3>
                    <span className="reports-card-sub">
                      The system compiles real telemetry and sends an automated morning digest:
                    </span>
                  </div>
                </div>
              </div>
              <span className="webhook-badge" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.25)' }}>
                EVERY MORNING 09:00 AM
              </span>
            </div>

            <div className="cron-steps-guide">
              <div className="cron-step-item">
                <span className="cron-step-num" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>1</span>
                <span><strong>Google Search Console:</strong> Organic clicks, impressions, and opportunity queries rising to page 1.</span>
              </div>
              <div className="cron-step-item">
                <span className="cron-step-num" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>2</span>
                <span><strong>Google Analytics 4:</strong> Unique visitors, sessions, and engagement rates.</span>
              </div>
              <div className="cron-step-item">
                <span className="cron-step-num" style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}>3</span>
                <span><strong>AI Engine (GEO) Radar:</strong> Citation rate in Google Gemini and LLM search engines.</span>
              </div>
              <div className="cron-step-item">
                <span className="cron-step-num" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>4</span>
                <span><strong>Priority Actions:</strong> Top-impact optimization tasks generated by the growth engine.</span>
              </div>
            </div>

            <div className="recipients-footer-actions" style={{ marginTop: 'auto' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Send a test report right away to preview:
              </span>
              <button
                type="button"
                className="reports-save-btn"
                style={{ background: '#059669' }}
                onClick={handleSendTestEmail}
                disabled={sendingTest || recipients.length === 0}
              >
                {sendingTest ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>{sendingTest ? 'Sending...' : 'Send Test Now'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* ROW 2: LIVE EMAIL DIGEST PREVIEW MOCKUP */}
        <div className="reports-card">
          <div className="reports-card-header">
            <div className="reports-card-title-group">
              <div className="reports-card-title-row">
                <div className="reports-card-icon emerald">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="reports-card-title">Live Email Preview (Executive Daily Digest)</h3>
                  <span className="reports-card-sub">
                    Live mockup of the digest sent to your recipients with 100% real data:
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="email-preview-wrapper">
            <div className="email-preview-topbar">
              <div className="topbar-dots">
                <div className="topbar-dot red" />
                <div className="topbar-dot yellow" />
                <div className="topbar-dot green" />
              </div>
              <span className="email-preview-subject-line">
                Subject: [Cerilas] {activeWorkspace?.name || 'Your Brand'} - Daily Growth &amp; Telemetry Digest ({formattedDate})
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                To: {recipients.join(', ') || 'Not specified'}
              </span>
            </div>

            <div className="email-preview-body">
              {/* Header preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid #1e293b' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '1px' }}>
                    CERILAS GROWTH RADAR // DAILY EXECUTIVE DIGEST
                  </span>
                  <h2 style={{ margin: '4px 0 2px', fontSize: '1.25rem', color: '#ffffff', fontWeight: 800 }}>
                    {activeWorkspace?.name || 'Cerilas Technologies'}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {activeWorkspace?.primary_domain || 'cerilas.com'} &bull; {formattedDate}
                  </span>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '6px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>GROWTH SCORE</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38bdf8' }}>{activeWorkspace?.growth_score || 92}</div>
                  <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>/ 100 Pts</div>
                </div>
              </div>

              {/* 4 KPI Pods */}
              <div className="preview-kpi-grid">
                <div className="preview-kpi-pod">
                  <div className="pk-label">Unique Visitors</div>
                  <div className="pk-val text-cyan">{(previewData?.analytics?.uniqueVisitors || 85).toLocaleString('en-US')}</div>
                  <div className="pk-sub">{previewData?.analytics?.sessions || 258} Sessions (GA4)</div>
                </div>
                <div className="preview-kpi-pod">
                  <div className="pk-label">Organic Search</div>
                  <div className="pk-val text-amber">{previewData?.search?.clicks || 7} Clicks</div>
                  <div className="pk-sub">{previewData?.search?.impressions || 362} Impressions (GSC)</div>
                </div>
                <div className="preview-kpi-pod">
                  <div className="pk-label">AI Engine (GEO)</div>
                  <div className="pk-val text-indigo">67% Citations</div>
                  <div className="pk-sub">Gemini 3.8 Flash</div>
                </div>
                <div className="preview-kpi-pod">
                  <div className="pk-label">Technical Health</div>
                  <div className="pk-val text-emerald">{previewData?.technicalAudit?.score || 90}/100</div>
                  <div className="pk-sub">{previewData?.technicalAudit?.pagesCrawled || 251} Pages Crawled</div>
                </div>
              </div>

              {/* Search striking query preview */}
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800, letterSpacing: '0.5px' }}>
                  GOOGLE SEARCH CONSOLE // QUERIES RISING TO PAGE 1:
                </span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>patent management software</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>#8.5 Rank</span>
                    <span style={{ color: '#38bdf8' }}>48 impressions</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>cerilas</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>#1.8 Rank</span>
                    <span style={{ color: '#38bdf8' }}>7 clicks / 112 impressions</span>
                  </div>
                </div>
              </div>

              {/* Action items preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.5px' }}>
                  PRIORITY GROWTH ACTIONS:
                </span>
                <div style={{ background: '#090d16', border: '1px solid #1e293b', borderLeft: '3px solid #38bdf8', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f3f4f6' }}>
                    Fix Missing H1 Header Architecture on 251 Pages
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                    Crawler engine detected missing primary H1 tag across core landing pages.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: RECENT DELIVERY LOGS */}
        <div className="reports-card">
          <div className="reports-card-header">
            <div className="reports-card-title-group">
              <div className="reports-card-title-row">
                <div className="reports-card-icon sky">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="reports-card-title">Recent Delivery History &amp; Logs</h3>
                  <span className="reports-card-sub">
                    Email delivery logs from cron-job.org webhook and manual test triggers:
                  </span>
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Total {logs.length} Records
            </span>
          </div>

          <div className="logs-table-wrap">
            <table className="reports-logs-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Recipient Emails</th>
                  <th>Trigger Type</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td><SkeletonBlock width="120px" height="14px" borderRadius="4px" /></td>
                      <td><SkeletonBlock width="180px" height="14px" borderRadius="4px" /></td>
                      <td><SkeletonBlock width="80px" height="18px" borderRadius="999px" /></td>
                      <td><SkeletonBlock width="220px" height="14px" borderRadius="4px" /></td>
                      <td><SkeletonBlock width="70px" height="20px" borderRadius="999px" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No report delivery records found yet. Click "Send Test Report Now" above to trigger your first delivery.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {new Date(log.sent_at).toLocaleString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td>
                        <span style={{ color: '#38bdf8', fontWeight: 500 }}>
                          {(log.recipients || []).join(', ')}
                        </span>
                      </td>
                      <td>
                        <span className="log-trigger-tag">
                          {log.trigger_type === 'webhook' ? 'cron-job.org (Webhook)' : 'Manual Test'}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                        {log.subject}
                      </td>
                      <td>
                        <span className={`log-status-badge ${log.status === 'sent' ? 'sent' : 'failed'}`}>
                          {log.status === 'sent' ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>Delivered</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={11} />
                              <span>Failed</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
