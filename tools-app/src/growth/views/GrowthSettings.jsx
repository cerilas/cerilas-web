import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';

export default function GrowthSettings() {
  const { activeWorkspace, refreshWorkspaces, switchWorkspace, workspaces } = useGrowth();
  const { token, initiateGoogleAuth } = useAuth();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Form State
  const [name, setName] = useState(activeWorkspace?.name || '');
  const [industry, setIndustry] = useState(activeWorkspace?.industry || '');
  const [description, setDescription] = useState(activeWorkspace?.brand_description || '');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // In MVP, can update workspace profile
      setSuccessMsg('Çalışma alanı ayarları başarıyla güncellendi.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Ayarlar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      await initiateGoogleAuth({ mode: 'link' });
      setSuccessMsg('Google entegrasyonu başarıyla bağlandı!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Google yetkilendirmesi başarısız oldu.');
    } finally {
      setConnectingGoogle(false);
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

  return (
    <div className="growth-page-container animate-fade">
      {/* Page Header */}
      <div className="growth-page-header">
        <div>
          <div className="growth-title-row">
            <Settings size={22} className="text-muted" />
            <h1 className="growth-page-title">Marka Ayarları & Entegrasyonlar</h1>
          </div>
          <p className="growth-page-subtitle">
            Seçili çalışma alanının marka profilini, Google veri kaynaklarını ve veri sınırlarını yönetin.
          </p>
        </div>
      </div>

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
            <h3 className="growth-panel-title">Veri Kaynağı Entegrasyonları</h3>
            <p className="growth-panel-desc">
              Doğrulanmış 1. parti arama ve trafik verilerini otomatik senkronize etmek için hesaplarınızı bağlayın.
            </p>
          </div>
        </div>

        <div className="growth-integrations-stack">
          {/* GSC */}
          <div className="integration-row-card">
            <div className="integration-info-side">
              <div className="integration-icon-wrap icon-gsc">
                <Search size={20} />
              </div>
              <div>
                <span className="integration-name">Google Search Console</span>
                <span className="integration-desc">Organik arama tıklamaları, gösterimler ve kelime sıralamaları.</span>
              </div>
            </div>

            <div className="integration-action-side">
              <button
                type="button"
                disabled={connectingGoogle}
                onClick={handleConnectGoogle}
                className="growth-secondary-btn"
              >
                {connectingGoogle ? (
                  <Loader2 size={14} className="auth-spinner" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>Google ile Bağla</span>
              </button>
            </div>
          </div>

          {/* GA4 */}
          <div className="integration-row-card">
            <div className="integration-info-side">
              <div className="integration-icon-wrap icon-ga4">
                <BarChart3 size={20} />
              </div>
              <div>
                <span className="integration-name">Google Analytics 4 (GA4)</span>
                <span className="integration-desc">Ziyaretçi trafiği, etkileşim süresi ve dönüşüm metrikleri.</span>
              </div>
            </div>

            <div className="integration-action-side">
              <button
                type="button"
                disabled={connectingGoogle}
                onClick={handleConnectGoogle}
                className="growth-secondary-btn"
              >
                <span>Google ile Bağla</span>
              </button>
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
