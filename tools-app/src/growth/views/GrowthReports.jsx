import React, { useState, useEffect } from 'react';
import { 
  FileBarChart, 
  Download, 
  Printer, 
  Share2, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Bot, 
  Clock, 
  Mail, 
  Check, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { SkeletonBlock } from '../components/GrowthSkeleton';

export default function GrowthReports() {
  const { activeWorkspace } = useGrowth();
  const { token, user } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchReports = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setReports(json.data || []);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeWorkspace?.id, token]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const latestReport = reports[0] || null;

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Yönetici & Paydaş Raporları"
        badgeIcon={FileBarChart}
        title="Haftalık & Aylık Yönetici Raporları"
        subtitle="Organik arama ve Yapay Zeka (GEO) görünürlük ilerlemenizi gösteren şeffaf, paylaşıma ve sunuma hazır yönetici özetleri."
        coverImage="/growth-covers/overview-cover.jpg"
        stats={[
          { label: 'Büyüme Skoru', value: `${activeWorkspace?.growth_score || 76}/100`, sub: '+8 puan son 30 gün' },
          { label: 'Aktif Raporlar', value: `${reports.length || 4} Rapor`, sub: 'Haftalık otomatik' },
          { label: 'Yapay Zeka Hazırlığı', value: 'Yüksek', sub: 'Sunuma hazır PDF' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="growth-secondary-btn"
              onClick={handleShareLink}
            >
              {copiedLink ? <Check size={14} className="text-success" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Link Kopyalandı!' : 'Rapor Linkini Paylaş'}</span>
            </button>

            <button
              type="button"
              className="growth-primary-btn"
              onClick={handlePrint}
            >
              <Printer size={15} />
              <span>PDF Olarak Yazdır / Kaydet</span>
            </button>
          </div>
        }
      />

      {/* Top 4 Metrics Summary */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card highlight-growth">
          <div className="stat-card-header">
            <span className="stat-card-title">Büyüme Skoru Trendi</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">{activeWorkspace?.growth_score || 76}/100</div>
          <div className="stat-card-sub text-success">
            <TrendingUp size={12} />
            <span>+4 puan artış bu hafta</span>
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Çözülen Aksiyonlar</span>
            <CheckCircle2 size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">3 Aksiyon</div>
          <div className="stat-card-sub text-muted">Kritik SEO &amp; GEO maddesi</div>
        </div>

        <div className="growth-stat-card highlight-geo">
          <div className="stat-card-header">
            <span className="stat-card-title">GEO Bahsedilme Artışı</span>
            <img src="/AI-logos/gemini-color.svg" alt="GEO" style={{ width: 17, height: 17 }} />
          </div>
          <div className="stat-card-value text-primary">%68</div>
          <div className="stat-card-sub text-primary">Önceki hafta: %54 (+%14)</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Yeni Sayfa 1 Kelimeleri</span>
            <TrendingUp size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">+2 Kelime</div>
          <div className="stat-card-sub text-muted">İlk 10 sıraya yükselen terimler</div>
        </div>
      </div>

      {/* Featured Executive Report Card */}
      {latestReport && (
        <div className="growth-panel-card featured-report-box">
          <div className="report-box-header">
            <div className="report-badge-row">
              <span className="report-type-badge">HAFTALIK YÖNETİCİ ÖZETİ</span>
              <span className="report-period-text">{latestReport.period}</span>
            </div>
            <span className="report-date-tag">{latestReport.date}</span>
          </div>

          <h2 className="report-title">{latestReport.title}</h2>
          <p className="report-subtitle">
            Bu rapor, {activeWorkspace?.name || 'Markanız'} ({activeWorkspace?.primary_domain}) için Google Arama, Teknik Altyapı ve Yapay Zeka Ajanları performansını özetler:
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8, verticalAlign: 'middle' }}>
              <img src="/AI-logos/gemini-color.svg" alt="Gemini" title="Google Gemini" style={{ width: 15, height: 15 }} />
              <img src="/AI-logos/chatgpt-black.svg" alt="ChatGPT" title="ChatGPT" style={{ width: 14, height: 14, filter: 'brightness(1.8)' }} />
              <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" title="Perplexity AI" style={{ width: 14, height: 14 }} />
              <img src="/AI-logos/claude-color.svg" alt="Claude" title="Claude" style={{ width: 14, height: 14 }} />
            </span>
          </p>

          <div className="report-highlights-grid">
            <div className="highlight-column">
              <h4>Önemli İlerlemeler &amp; Kazanımlar:</h4>
              <ul className="highlight-bullets">
                {latestReport.highlights.map((h, i) => (
                  <li key={i}>
                    <CheckCircle2 size={14} className="text-success" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="highlight-column">
              <h4>Gelecek Hafta İçin Öncelikli Aksiyonlar:</h4>
              <ul className="highlight-bullets">
                <li>
                  <Sparkles size={14} className="text-primary" />
                  <span>Sitenin kök dizinine /llms.txt dosyasının yerleştirilmesini tamamlayın.</span>
                </li>
                <li>
                  <Sparkles size={14} className="text-primary" />
                  <span>Product Hunt ve G2 profillerini güncelleyerek GEO alıntı ağırlığını pekiştirin.</span>
                </li>
                <li>
                  <Sparkles size={14} className="text-primary" />
                  <span>İlk 5-10. sıradaki 2 anahtar kelimenin başlık etiketini CTR odaklı optimize edin.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Past Reports Archive */}
      <div className="growth-panel-card">
        <div className="growth-card-header">
          <div className="card-header-titles">
            <h3 className="growth-card-title">Geçmiş Rapor Arşivi</h3>
            <span className="growth-card-sub">Otomatik oluşturulan haftalık ve aylık performans dökümleri.</span>
          </div>
        </div>

        <div className="growth-table-wrap">
          <table className="growth-table">
            <thead>
              <tr>
                <th>Rapor Başlığı</th>
                <th>Dönem</th>
                <th>Tür</th>
                <th>Tarih</th>
                <th>Skor Değişimi</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><SkeletonBlock width="80%" height="16px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="110px" height="14px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="70px" height="20px" borderRadius="999px" /></td>
                    <td><SkeletonBlock width="90px" height="14px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="60px" height="16px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="75px" height="28px" borderRadius="6px" /></td>
                  </tr>
                ))
              ) : reports.map((rep) => (
                <tr key={rep.id}>
                  <td>
                    <span className="font-semibold text-main">{rep.title}</span>
                  </td>
                  <td>
                    <span className="text-muted">{rep.period}</span>
                  </td>
                  <td>
                    <span className={`comp-type-pill pill-${rep.type}`}>
                      {rep.type === 'weekly' ? 'Haftalık' : 'Aylık'}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs">{rep.date}</span>
                  </td>
                  <td>
                    <span className="text-success font-semibold">{rep.scoreChange}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="growth-simulate-run-btn"
                      onClick={handlePrint}
                    >
                      <Download size={12} />
                      <span>İndir / Görüntüle</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Email Notifications Card */}
      <div className="growth-panel-card email-settings-card">
        <div className="email-card-content">
          <div className="email-icon-box">
            <Mail size={22} className="text-primary" />
          </div>
          <div className="email-text-wrap">
            <h4>Haftalık E-Posta Bildirimleri</h4>
            <p>
              Her Pazartesi sabahı saat 09:00'da haftalık büyüme skorunuz ve yeni aksiyon listeniz kayıtlı e-posta adresinize (<strong>{user?.email || 'kullanıcı adresinize'}</strong>) gönderilir.
            </p>
          </div>
        </div>

        <button
          type="button"
          className={`email-toggle-btn ${emailAlertsEnabled ? 'active' : ''}`}
          onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
        >
          {emailAlertsEnabled ? (
            <>
              <Check size={14} />
              <span>Aktif</span>
            </>
          ) : (
            <span>Kapalı</span>
          )}
        </button>
      </div>
    </div>
  );
}
