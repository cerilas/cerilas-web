import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Layers, 
  Plus, 
  Trash2,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGrowth } from '../GrowthContext';
import './GrowthOnboardingModal.css';

export default function GrowthOnboardingModal({ isOpen, onClose }) {
  const { token } = useAuth();
  const { refreshWorkspaces, switchWorkspace } = useGrowth();

  const [step, setStep] = useState(1); // 1: URL input, 2: Scanning, 3: Review & Launch
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('DNS ve bağlantı kontrol ediliyor...');
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  // Editable Brand Fields
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessModel, setBusinessModel] = useState('B2B');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleStartScan = async (e) => {
    e?.preventDefault();
    if (!url.trim()) {
      setError('Lütfen web sitenizin adresini girin.');
      return;
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setError('');
    setScanning(true);
    setStep(2);

    try {
      setScanProgress('Site kaynak kodu taranıyor ve başlıklar çözümleniyor...');
      setTimeout(() => setScanProgress('Meta etiketler, Schema.org ve SEO sinyalleri taranıyor...'), 800);
      setTimeout(() => setScanProgress('Yapay Zeka (GEO) ve /llms.txt görünürlüğü değerlendiriliyor...'), 1600);

      const res = await fetch('/api/growth/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tarama başarısız oldu.');
      }

      const { scan, brand } = data.data;
      setScanResult(scan);
      setBrandName(brand.brandName || scan.domain);
      setIndustry(brand.industry || 'Technology & Digital Services');
      setBusinessModel(brand.businessModel || 'B2B');
      setDescription(brand.description || scan.meta?.metaDescription || '');
      setTargetAudience(brand.targetAudience || '');
      setKeywords(brand.primaryKeywords || []);
      setCompetitors(brand.suggestedCompetitors || []);

      setStep(3);
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Web sitesi taranamadı. Lütfen URL adresini kontrol edin.');
      setStep(1);
    } finally {
      setScanning(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleAddCompetitor = () => {
    if (competitorDomain.trim()) {
      const clean = competitorDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      setCompetitors([...competitors, { name: clean, domain: clean }]);
      setCompetitorDomain('');
    }
  };

  const handleRemoveCompetitor = (idx) => {
    setCompetitors(competitors.filter((_, i) => i !== idx));
  };

  const handleCreateWorkspace = async () => {
    if (!brandName.trim()) {
      setError('Lütfen bir marka adı belirtin.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const payload = {
        name: brandName.trim(),
        url: scanResult?.url || url.trim(),
        industry,
        business_model: businessModel,
        description,
        target_audience: targetAudience,
        primary_keywords: keywords,
        competitors,
        initial_scan: scanResult
      };

      const res = await fetch('/api/growth/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Çalışma alanı oluşturulamadı.');
      }

      const created = data.data.workspace;
      await refreshWorkspaces(created.slug);
      switchWorkspace(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="growth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="growth-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button type="button" className="growth-modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="growth-modal-header">
          <div className="growth-badge-tag">
            <Sparkles size={13} className="text-primary" />
            <span>Cerilas Growth • AI Growth Intelligence</span>
          </div>
          <h2 className="growth-modal-title">
            {step === 1 && 'Yeni Marka veya Web Sitesi Ekleyin'}
            {step === 2 && 'Web Siteniz Yapay Zeka ile Analiz Ediliyor'}
            {step === 3 && 'Marka Analizi Tamamlandı'}
          </h2>
          <p className="growth-modal-subtitle">
            {step === 1 && 'Sitenizin arama performansını, teknik sağlığını ve AI arama motorlarındaki (GEO) görünürlüğünü takip edin.'}
            {step === 2 && 'Sayfa yapısı, başlıklar, yapılandırılmış veri ve GEO hazırbulunuşluğu taranıyor...'}
            {step === 3 && 'Yapay zekanın çıkardığı bilgileri inceleyin ve kontrol panelinizi başlatın.'}
          </p>
        </div>

        {error && (
          <div className="growth-alert-banner alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: URL Input */}
        {step === 1 && (
          <form onSubmit={handleStartScan} className="growth-onboarding-form">
            <div className="growth-field-group">
              <label className="growth-field-label">Web Sitesi URL Adresi</label>
              <div className="growth-url-input-wrap">
                <Globe size={18} className="growth-field-icon" />
                <input
                  type="text"
                  required
                  autoFocus
                  className="growth-field-input"
                  placeholder="ornek.com veya https://cerilas.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <span className="growth-field-hint">
                Tek tıkla otomatik tarama, teknik SEO incelemesi ve yapay zeka marka profili oluşturulacaktır.
              </span>
            </div>

            <button type="submit" disabled={scanning || !url.trim()} className="growth-primary-btn">
              <span>Analizi Başlat</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: Scanning Animation */}
        {step === 2 && (
          <div className="growth-scan-loading-card">
            <div className="growth-pulse-ring-wrap">
              <div className="growth-pulse-ring" />
              <Cpu size={32} className="growth-pulse-icon" />
            </div>
            <h4 className="growth-scan-status-title">Analiz Devam Ediyor</h4>
            <p className="growth-scan-status-subtext">{scanProgress}</p>
            <div className="growth-progress-bar-wrap">
              <div className="growth-progress-bar-fill" />
            </div>
          </div>
        )}

        {/* Step 3: Review Extracted Info & Launch */}
        {step === 3 && (
          <div className="growth-review-layout">
            {/* Quick Diagnostic Gauges */}
            <div className="growth-scores-banner">
              <div className="growth-score-box">
                <span className="growth-score-label">Teknik SEO Skoru</span>
                <div className="growth-score-val-row">
                  <span className="growth-score-number">{scanResult?.technicalScore || 85}</span>
                  <span className="growth-score-denom">/100</span>
                </div>
                <span className="growth-score-desc">Sayfa Hızı, SSL, Meta ve Şema</span>
              </div>

              <div className="growth-score-box geo-box">
                <span className="growth-score-label">Yapay Zeka (GEO) Hazırlığı</span>
                <div className="growth-score-val-row">
                  <span className="growth-score-number">{scanResult?.geoScore || 75}</span>
                  <span className="growth-score-denom">/100</span>
                </div>
                <span className="growth-score-desc">AI Crawler, llms.txt & Alıntılanabilirlik</span>
              </div>
            </div>

            {/* Brand Form */}
            <div className="growth-form-grid">
              <div className="growth-field-group">
                <label className="growth-field-label">Marka / Şirket Adı</label>
                <input
                  type="text"
                  className="growth-field-input"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
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
                <label className="growth-field-label">Açıklama (Özet)</label>
                <textarea
                  rows={2}
                  className="growth-field-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Primary Keywords */}
              <div className="growth-field-group field-span-2">
                <label className="growth-field-label">Takip Edilecek Anahtar Kelimeler</label>
                <div className="growth-tags-wrap">
                  {keywords.map((kw) => (
                    <span key={kw} className="growth-tag-pill">
                      <span>{kw}</span>
                      <button type="button" onClick={() => handleRemoveKeyword(kw)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <div className="growth-tag-add-row">
                    <input
                      type="text"
                      placeholder="Kelime ekle..."
                      className="growth-inline-input"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); }}}
                    />
                    <button type="button" className="growth-tag-add-btn" onClick={handleAddKeyword}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Competitors */}
              <div className="growth-field-group field-span-2">
                <label className="growth-field-label">Takip Edilecek Rakipler (Opsiyonel)</label>
                <div className="growth-competitors-list">
                  {competitors.map((comp, idx) => (
                    <div key={idx} className="growth-comp-row">
                      <span className="growth-comp-name">{comp.name || comp.domain}</span>
                      <span className="growth-comp-domain">{comp.domain}</span>
                      <button type="button" onClick={() => handleRemoveCompetitor(idx)} className="growth-comp-del">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <div className="growth-comp-add-row">
                    <input
                      type="text"
                      placeholder="rakipdomain.com"
                      className="growth-field-input"
                      value={competitorDomain}
                      onChange={(e) => setCompetitorDomain(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCompetitor(); }}}
                    />
                    <button type="button" className="growth-add-comp-btn" onClick={handleAddCompetitor}>
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="growth-onboarding-actions">
              <button
                type="button"
                onClick={handleCreateWorkspace}
                disabled={creating || !brandName.trim()}
                className="growth-primary-btn btn-lg"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="auth-spinner" />
                    <span>Çalışma Alanı Kuruluyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Kontrol Panelini Başlat</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
