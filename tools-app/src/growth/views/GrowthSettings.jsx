import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { GrowthSettingsSkeleton } from '../components/GrowthSkeleton';

export default function GrowthSettings() {
  const { activeWorkspace, refreshWorkspaces, switchWorkspace, workspaces } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [syncingGsc, setSyncingGsc] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);

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
        throw new Error(d.error || 'Ayarlar kaydedilemedi.');
      }

      setSuccessMsg('Çalışma alanı ayarları başarıyla güncellendi.');
      await refreshWorkspaces();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Ayarlar kaydedilemedi.');
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
        throw new Error(data.error || 'Google yetkilendirme bağlantısı alınamadı.');
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
        throw new Error('Açılır pencere tarayıcınız tarafından engellendi. Lütfen izin verin.');
      }

      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'GROWTH_GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          setSuccessMsg(`Google hesabı (${event.data.email}) başarıyla bağlandı! Mülkler senkronize ediliyor.`);
          await fetchIntegrations();
          setConnectingGoogle(false);
          setTimeout(() => setSuccessMsg(''), 5000);
        } else if (event.data?.type === 'GROWTH_GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          setErrorMsg(`Google yetkilendirme hatası: ${event.data.error || 'Bilinmeyen hata'}`);
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
      setErrorMsg(err.message || 'Google yetkilendirmesi başlatılamadı.');
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
      if (!res.ok) throw new Error(data.error || 'Search Console senkronizasyonu başarısız.');
      setSuccessMsg('Google Search Console verileri ve sıralamalar canlı olarak güncellendi.');
      await fetchIntegrations();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Senkronizasyon yapılamadı.');
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
        setSuccessMsg(`Aktif mülk "${propertyName || propertyId}" olarak güncellendi.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg('Mülk seçilemedi: ' + err.message);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Google Search Console ve GA4 bağlantısını kesmek istediğinize emin misiniz? Canlı telemetri verileri kaldırılacaktır.')) {
      return;
    }

    setDisconnectingGoogle(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations/google/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Google entegrasyonu bağlantısı başarıyla kaldırıldı.');
        if (data.data) setIntegrations(data.data);
        else await fetchIntegrations();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg('Bağlantı kesilemedi: ' + err.message);
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`"${activeWorkspace?.name}" çalışma alanını ve bağlı tüm analiz verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await refreshWorkspaces();
      }
    } catch (err) {
      alert('Silme işlemi başarısız: ' + err.message);
    }
  };

  if (loading) {
    return <GrowthSettingsSkeleton />;
  }

  const isGoogleConnected = integrations.gsc?.connected || integrations.ga4?.connected;

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Doğrulanmış Veri Entegrasyonları"
        badgeIcon={Settings}
        title="Marka Ayarları & Entegrasyonlar"
        subtitle="Google Search Console ve GA4 veri boru hatlarını ve çalışma alanı yapılandırmalarını yönetin."
        coverImage="/growth-covers/integrations-cover.jpg"
        stats={[
          { label: 'Google Servisleri', value: isGoogleConnected ? 'Bağlı & Canlı' : 'Bağlantı Bekliyor', sub: isGoogleConnected ? 'Search Console & GA4' : 'OAuth 2.0 Hazır' },
          { label: 'Doğrulama', value: isGoogleConnected ? 'Yetkili Hesap' : 'Beklemede', sub: isGoogleConnected ? (integrations.gsc?.email || 'Aktif') : 'Google Girişi Gerekli' },
          { label: 'Boru Hattı', value: isGoogleConnected ? 'Otomatik' : 'Hazır', sub: 'Canlı Telemetri' }
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
            <h3 className="growth-panel-title">Doğrulanmış Veri Kaynağı Entegrasyonları</h3>
            <p className="growth-panel-desc">
              Doğrulanmış 1. parti organik arama ve trafik verilerini senkronize etmek için resmi Google hesabınızı bağlayın.
            </p>
          </div>
          {isGoogleConnected && (
            <button
              type="button"
              disabled={disconnectingGoogle}
              onClick={handleDisconnectGoogle}
              className="growth-secondary-btn btn-sm text-danger"
              style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
            >
              {disconnectingGoogle ? <Loader2 size={13} className="auth-spinner" /> : <Unlink size={13} />}
              <span>Google Bağlantısını Kes</span>
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
                      <span>Aktif & Canlı</span>
                    </span>
                  ) : (
                    <span className="integration-status-badge unconnected">
                      Bağlantı Yok
                    </span>
                  )}
                </div>
                <span className="integration-desc">Organik arama tıklamaları, gösterimler ve gerçek kelime sıralamaları.</span>
                
                {integrations.gsc?.connected && (
                  <div className="integration-meta-line">
                    <span>{integrations.gsc.email}</span>
                    <span className="integration-meta-dot">•</span>
                    <span>Mülk: <strong style={{ color: '#f1f5f9' }}>{integrations.gsc.selectedSite || 'Mülk seçilmedi'}</strong></span>
                    {integrations.gsc.lastSyncAt && (
                      <>
                        <span className="integration-meta-dot">•</span>
                        <span>Son eşitleme: {new Date(integrations.gsc.lastSyncAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
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
                    <span>{syncingGsc ? 'Senkronize Ediliyor...' : 'Şimdi Eşitle'}</span>
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
                  <span>Google ile Bağla</span>
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
                      <span>Aktif & Canlı</span>
                    </span>
                  ) : (
                    <span className="integration-status-badge unconnected">
                      Bağlantı Yok
                    </span>
                  )}
                </div>
                <span className="integration-desc">Ziyaretçi trafiği, etkileşim süresi ve dönüşüm metrikleri.</span>

                {integrations.ga4?.connected && (
                  <div className="integration-meta-line">
                    <span>{integrations.ga4.email}</span>
                    <span className="integration-meta-dot">•</span>
                    <span>Mülk: <strong style={{ color: '#f1f5f9' }}>{integrations.ga4.selectedPropertyName || integrations.ga4.selectedPropertyId || 'Mülk seçilmedi'}</strong></span>
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
                    <span>Bağlı</span>
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
                  <span>Google ile Bağla</span>
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
            <h3 className="growth-panel-title">Marka Profili</h3>
            <p className="growth-panel-desc">Yapay zeka analizlerinde ve rakip karşılaştırmalarında kullanılan bilgiler.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="growth-form-grid">
          <div className="growth-field-group">
            <label className="growth-field-label">Marka Adı</label>
            <input
              type="text"
              className="growth-field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="growth-field-group">
            <label className="growth-field-label">Sektör</label>
            <input
              type="text"
              className="growth-field-input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div className="growth-field-group field-span-2">
            <label className="growth-field-label">Birincil Alan Adı (Domain)</label>
            <input
              type="text"
              disabled
              className="growth-field-input is-disabled"
              value={activeWorkspace?.primary_domain || ''}
            />
          </div>

          <div className="growth-field-group field-span-2">
            <label className="growth-field-label">Açıklama</label>
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
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Delete Workspace */}
      <div className="growth-panel-card danger-zone-card">
        <div className="danger-zone-header">
          <Trash2 size={20} className="text-danger" />
          <div>
            <h3 className="danger-title">Çalışma Alanını Sil</h3>
            <p className="danger-desc">
              Bu markayı ve ilişkili tüm teknik denetim kayıtlarını, GEO promptlarını ve aksiyon geçmişini kalıcı olarak siler.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDeleteWorkspace}
          className="growth-danger-btn"
        >
          <span>Bu Markayı Kalıcı Olarak Sil</span>
        </button>
      </div>
    </div>
  );
}
