import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Settings, 
  Search, 
  BarChart3, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Trash2, 
  Save, 
  Loader2,
  Sparkles,
  RefreshCw,
  Unlink,
  ChevronDown,
  X,
  AlertTriangle
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { GrowthSettingsSkeleton } from '../components/GrowthSkeleton';
import GrowthDeleteWorkspaceModal from '../components/GrowthDeleteWorkspaceModal';

export default function GrowthSettings() {
  const { activeWorkspace, refreshWorkspaces, switchWorkspace, workspaces } = useGrowth();
  const { token } = useAuth();

  const isTr = typeof window !== 'undefined' && (
    localStorage.getItem('preferred_language') === 'tr' ||
    (navigator.language && navigator.language.startsWith('tr'))
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [syncingGsc, setSyncingGsc] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDisconnectGoogleModalOpen, setIsDisconnectGoogleModalOpen] = useState(false);

  // Integrations state
  const [integrations, setIntegrations] = useState({
    gsc: { connected: false },
    ga4: { connected: false }
  });

  // Form State
  const [name, setName] = useState(activeWorkspace?.name || '');
  const [industry, setIndustry] = useState(activeWorkspace?.industry || '');
  const [description, setDescription] = useState(activeWorkspace?.brand_description || '');

  const fetchIntegrations = useCallback(async () => {
    if (!activeWorkspace?.id || !token) return;
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setIntegrations(data.data);
      }
    } catch (err) {
      console.error('Integrations fetch error:', err);
    }
  }, [activeWorkspace?.id, token]);

  useEffect(() => {
    setLoading(true);
    setName(activeWorkspace?.name || '');
    setIndustry(activeWorkspace?.industry || '');
    setDescription(activeWorkspace?.brand_description || '');

    fetchIntegrations().finally(() => {
      setLoading(false);
    });
  }, [activeWorkspace?.id, fetchIntegrations]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          industry,
          brand_description: description
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save settings.');
      }

      setSuccessMsg('Workspace settings updated successfully.');
      await refreshWorkspaces();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!activeWorkspace?.id) return;
    setConnectingGoogle(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations/google/url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to get Google authorization URL.');
      }

      const width = 560;
      const height = 680;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

      const popup = window.open(
        data.url,
        'GoogleIntegrationAuth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Popup window was blocked by your browser. Please allow popups.');
      }

      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'GROWTH_GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          setSuccessMsg(`Google account (${event.data.email}) connected successfully! Syncing properties...`);
          await fetchIntegrations();
          setConnectingGoogle(false);
          setTimeout(() => setSuccessMsg(''), 5000);
        } else if (event.data?.type === 'GROWTH_GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          setErrorMsg(`Google authorization error: ${event.data.error || 'Unknown error'}`);
          setConnectingGoogle(false);
        }
      };

      window.addEventListener('message', handleMessage);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setConnectingGoogle(false);
        }
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate Google authorization.');
      setConnectingGoogle(false);
    }
  };

  const handleSyncGsc = async () => {
    setSyncingGsc(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations/google/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search Console synchronization failed.');
      setSuccessMsg('Google Search Console data and keyword rankings updated live.');
      await fetchIntegrations();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Synchronization failed.');
    } finally {
      setSyncingGsc(false);
    }
  };

  const handleSelectProperty = async (type, propertyId, propertyName) => {
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations/google/select-property`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, propertyId, propertyName })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setIntegrations(data.data);
        setSuccessMsg(`Active property updated to "${propertyName || propertyId}".`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg('Failed to select property: ' + err.message);
    }
  };

  const handleOpenDisconnectModal = () => {
    setIsDisconnectGoogleModalOpen(true);
  };

  const handleConfirmDisconnectGoogle = async () => {
    setIsDisconnectGoogleModalOpen(false);
    setDisconnectingGoogle(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations/google/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Google integration disconnected successfully.');
        if (data.data) setIntegrations(data.data);
        else await fetchIntegrations();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg('Failed to disconnect: ' + err.message);
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return <GrowthSettingsSkeleton />;
  }

  const isGoogleConnected = integrations.gsc?.connected || integrations.ga4?.connected;

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Verified Data Integrations"
        badgeIcon={Settings}
        title="Brand Settings &amp; Integrations"
        subtitle="Manage Google Search Console and GA4 data telemetry pipelines and workspace configurations."
        coverImage="/growth-covers/integrations-cover.jpg"
        stats={[
          { label: 'Google Services', value: isGoogleConnected ? 'Connected & Live' : 'Awaiting Connection', sub: isGoogleConnected ? 'Search Console & GA4' : 'OAuth 2.0 Ready' },
          { label: 'Verification', value: isGoogleConnected ? 'Authorized Account' : 'Pending', sub: isGoogleConnected ? (integrations.gsc?.email || 'Active') : 'Google Login Required' },
          { label: 'Data Pipeline', value: isGoogleConnected ? 'Automated' : 'Ready', sub: 'Live Telemetry' }
        ]}
      />

      {successMsg && (
        <div className="growth-alert-banner alert-success">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="growth-alert-banner alert-error">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Integrations Section */}
      <div className="growth-panel-card">
        <div className="growth-panel-header">
          <div>
            <h3 className="growth-panel-title">Verified Data Source Integrations</h3>
            <p className="growth-panel-desc">
              Connect your official Google account to stream verified 1st-party organic search queries and user traffic telemetry.
            </p>
          </div>
          {isGoogleConnected && (
            <button
              type="button"
              disabled={disconnectingGoogle}
              onClick={handleOpenDisconnectModal}
              className="growth-secondary-btn btn-sm text-danger"
              style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
            >
              {disconnectingGoogle ? <Loader2 size={13} className="auth-spinner" /> : <Unlink size={13} />}
              <span>Disconnect Google</span>
            </button>
          )}
        </div>

        <div className="growth-integrations-stack">
          {/* GSC Row */}
          <div className="integration-row-card">
            <div className="integration-info-side">
              <div className="integration-icon-wrap" style={{ background: 'rgba(66, 133, 244, 0.1)', border: '1px solid rgba(66, 133, 244, 0.25)', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                <img src="/growth-covers/gsc-badge.svg" alt="Google Search Console" style={{ width: 26, height: 26, objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="integration-name">Google Search Console</span>
                  {integrations.gsc?.connected ? (
                    <span className="integration-status-badge connected">
                      <CheckCircle2 size={12} />
                      <span>Active &amp; Live</span>
                    </span>
                  ) : (
                    <span className="integration-status-badge unconnected">
                      Not Connected
                    </span>
                  )}
                </div>
                <span className="integration-desc">Organic search clicks, impressions, and verified keyword rankings.</span>
                
                {integrations.gsc?.connected && (
                  <div className="integration-meta-line">
                    <span>{integrations.gsc.email}</span>
                    <span className="integration-meta-dot">•</span>
                    <span>Property: <strong style={{ color: '#f1f5f9' }}>{integrations.gsc.selectedSite || 'No property selected'}</strong></span>
                    {integrations.gsc.lastSyncAt && (
                      <>
                        <span className="integration-meta-dot">•</span>
                        <span>Last synced: {new Date(integrations.gsc.lastSyncAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="integration-action-side">
              {integrations.gsc?.connected ? (
                <div className="integration-action-cluster">
                  {integrations.gsc.availableSites?.length > 1 && (
                    <select
                      className="integration-prop-select"
                      value={integrations.gsc.selectedSite || ''}
                      onChange={(e) => handleSelectProperty('search_console', e.target.value, e.target.value)}
                    >
                      {integrations.gsc.availableSites.map((site) => (
                        <option key={site.siteUrl} value={site.siteUrl}>
                          {site.siteUrl}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    disabled={syncingGsc}
                    onClick={handleSyncGsc}
                    className="growth-secondary-btn btn-sm"
                  >
                    <RefreshCw size={13} className={syncingGsc ? 'auth-spinner' : ''} />
                    <span>{syncingGsc ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={connectingGoogle}
                  onClick={handleConnectGoogle}
                  className="growth-secondary-btn"
                >
                  {connectingGoogle ? (
                    <Loader2 size={14} className="auth-spinner" />
                  ) : (
                    <img src="/growth-covers/google-icon.svg" alt="Google" style={{ width: 14, height: 14 }} />
                  )}
                  <span>Connect with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* GA4 Row */}
          <div className="integration-row-card">
            <div className="integration-info-side">
              <div className="integration-icon-wrap" style={{ background: 'rgba(234, 67, 53, 0.1)', border: '1px solid rgba(234, 67, 53, 0.25)', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                <img src="/growth-covers/ga4-badge.svg" alt="Google Analytics 4" style={{ width: 26, height: 26, objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="integration-name">Google Analytics 4 (GA4)</span>
                  {integrations.ga4?.connected ? (
                    <span className="integration-status-badge connected">
                      <CheckCircle2 size={12} />
                      <span>Active &amp; Live</span>
                    </span>
                  ) : (
                    <span className="integration-status-badge unconnected">
                      Not Connected
                    </span>
                  )}
                </div>
                <span className="integration-desc">User sessions, engagement time, and verified conversion metrics.</span>

                {integrations.ga4?.connected && (
                  <div className="integration-meta-line">
                    <span>{integrations.ga4.email}</span>
                    <span className="integration-meta-dot">•</span>
                    <span>Property: <strong style={{ color: '#f1f5f9' }}>{integrations.ga4.selectedPropertyName || integrations.ga4.selectedPropertyId || 'No property selected'}</strong></span>
                  </div>
                )}
              </div>
            </div>

            <div className="integration-action-side">
              {integrations.ga4?.connected ? (
                <div className="integration-action-cluster">
                  {integrations.ga4.availableProperties?.length > 1 && (
                    <select
                      className="integration-prop-select"
                      value={integrations.ga4.selectedPropertyId || ''}
                      onChange={(e) => {
                        const prop = integrations.ga4.availableProperties.find(p => p.propertyId === e.target.value);
                        handleSelectProperty('analytics', e.target.value, prop?.displayName || e.target.value);
                      }}
                    >
                      {integrations.ga4.availableProperties.map((prop) => (
                        <option key={prop.propertyId} value={prop.propertyId}>
                          {prop.displayName} ({prop.propertyId})
                        </option>
                      ))}
                    </select>
                  )}
                  <span style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={14} />
                    <span>Connected</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={connectingGoogle}
                  onClick={handleConnectGoogle}
                  className="growth-secondary-btn"
                >
                  {connectingGoogle ? (
                    <Loader2 size={14} className="auth-spinner" />
                  ) : (
                    <img src="/growth-covers/google-icon.svg" alt="Google" style={{ width: 14, height: 14 }} />
                  )}
                  <span>Connect with Google</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Details Form */}
      <div className="growth-panel-card">
        <div className="growth-panel-header">
          <div>
            <h3 className="growth-panel-title">Brand Profile</h3>
            <p className="growth-panel-desc">Core business profile used in AI citations, GEO prompts, and competitor benchmarking.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="growth-form-grid">
          <div className="growth-field-group">
            <label className="growth-field-label">Brand Name</label>
            <input
              type="text"
              className="growth-field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="growth-field-group">
            <label className="growth-field-label">Industry</label>
            <input
              type="text"
              className="growth-field-input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div className="growth-field-group field-span-2">
            <label className="growth-field-label">Primary Domain (Domain)</label>
            <input
              type="text"
              disabled
              className="growth-field-input is-disabled"
              value={activeWorkspace?.primary_domain || ''}
            />
          </div>

          <div className="growth-field-group field-span-2">
            <label className="growth-field-label">Description</label>
            <textarea
              rows={3}
              className="growth-field-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="growth-field-group field-span-2">
            <button type="submit" disabled={saving} className="growth-primary-btn" style={{ maxWidth: '200px' }}>
              {saving ? <Loader2 size={16} className="auth-spinner" /> : <Save size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Delete Workspace */}
      <div className="growth-panel-card danger-zone-card">
        <div className="danger-zone-header">
          <Trash2 size={20} className="text-danger" />
          <div>
            <h3 className="danger-title">Delete Workspace</h3>
            <p className="danger-desc">
              Permanently deletes this brand and all associated technical audit logs, GEO prompts, and growth action history.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenDeleteModal}
          className="growth-danger-btn"
        >
          <span>{isTr ? 'Çalışma Alanını Kalıcı Olarak Sil' : 'Permanently Delete Workspace'}</span>
        </button>
      </div>

      {/* Custom Workspace / Site Deletion Modal */}
      <GrowthDeleteWorkspaceModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        workspace={activeWorkspace}
        token={token}
        onSuccess={async () => {
          await refreshWorkspaces();
        }}
      />

      {/* Custom Disconnect Google Confirmation Modal */}
      {isDisconnectGoogleModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-delete-modal-backdrop"
          onClick={() => !disconnectingGoogle && setIsDisconnectGoogleModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="growth-disconnect-google-title"
        >
          <div 
            className="growth-delete-modal-card" 
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="growth-delete-modal-header">
              <div className="growth-delete-header-top">
                <div className="growth-delete-header-badge-wrap">
                  <div className="growth-delete-modal-icon-badge" style={{ background: 'rgba(234, 179, 8, 0.14)', borderColor: 'rgba(234, 179, 8, 0.32)', color: '#eab308' }}>
                    <Unlink size={19} />
                  </div>
                  <span className="growth-delete-pill" style={{ background: 'rgba(234, 179, 8, 0.12)', borderColor: 'rgba(234, 179, 8, 0.28)', color: '#facc15' }}>
                    {isTr ? 'Bağlantı Kaldırma' : 'Disconnect Integration'}
                  </span>
                </div>
                <button
                  type="button"
                  className="growth-delete-modal-close-btn"
                  onClick={() => setIsDisconnectGoogleModalOpen(false)}
                  disabled={disconnectingGoogle}
                >
                  <X size={16} />
                </button>
              </div>

              <h2 id="growth-disconnect-google-title" className="growth-delete-modal-title">
                {isTr ? 'Google Entegrasyonunu Kaldır?' : 'Disconnect Google Integration?'}
              </h2>
              <p className="growth-delete-modal-subtitle">
                {isTr
                  ? 'Google Search Console ve GA4 bağlantısı kesilecek. Canlı arama sorguları ve organik trafik telemetrisi artık güncellenmeyecek.'
                  : 'Google Search Console and GA4 will be unlinked from this workspace. Live telemetry feeds will be removed.'}
              </p>
            </div>

            <div className="growth-delete-modal-footer">
              <button
                type="button"
                className="growth-delete-cancel-btn"
                onClick={() => setIsDisconnectGoogleModalOpen(false)}
                disabled={disconnectingGoogle}
              >
                {isTr ? 'Vazgeç' : 'Cancel'}
              </button>
              <button
                type="button"
                className="growth-delete-submit-btn"
                onClick={handleConfirmDisconnectGoogle}
                disabled={disconnectingGoogle}
                style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', borderColor: '#a16207' }}
              >
                {disconnectingGoogle ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>{isTr ? 'Bağlantı Kesiliyor...' : 'Disconnecting...'}</span>
                  </>
                ) : (
                  <>
                    <Unlink size={15} />
                    <span>{isTr ? 'Evet, Bağlantıyı Kaldır' : 'Yes, Disconnect Google'}</span>
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
