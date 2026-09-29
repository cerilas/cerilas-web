import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Bot,
  X
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { GrowthContentSkeleton } from '../components/GrowthSkeleton';

export default function GrowthContent() {
  const { activeWorkspace } = useGrowth();

  const [loading, setLoading] = useState(true);
  const [activeTabSub, setActiveTabSub] = useState('clusters'); // clusters, audit, brief
  const [selectedBriefTopic, setSelectedBriefTopic] = useState('');
  const [generatedBrief, setGeneratedBrief] = useState(null);
  const [copiedBrief, setCopiedBrief] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(timer);
  }, [activeWorkspace?.id]);

  // Content Topic Clusters
  const clusters = [
    {
      pillarTitle: `${activeWorkspace?.name || 'Markanız'} ile Dijital Büyüme & AI Stratejisi`,
      pillarUrl: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/rehber/dijital-buyume`,
      status: 'Yayınlandı',
      clusterSubpages: [
        { title: 'Yapay Zeka (GEO) Nedir ve Nasıl Uygulanır?', status: 'Öneri' },
        { title: '/llms.txt Dosyası Nasıl Hazırlanır?', status: 'Yayınlandı' },
        { title: 'Google AI Overview Sıralama Faktörleri', status: 'Taslak' },
        { title: 'E-E-A-T Sinyallerini Güçlendirme Yöntemleri', status: 'Öneri' }
      ]
    },
    {
      pillarTitle: `${activeWorkspace?.industry || 'Teknoloji'} Sektöründe En Verimli Araçlar`,
      pillarUrl: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/araclar`,
      status: 'Yayınlandı',
      clusterSubpages: [
        { title: 'Hız ve Performans Artıran 10 Ücretsiz Araç', status: 'Yayınlandı' },
        { title: 'Web Geliştiriciler İçin Pratik Çözümler', status: 'Yayınlandı' },
        { title: 'Otomasyon ve API Entegrasyon İpuçları', status: 'Öneri' }
      ]
    }
  ];

  // Crawled pages content audit
  const pagesAudit = [
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/`, wordCount: 1450, hasDesc: true, status: 'İyi', action: 'Görsel alt etiketlerini zenginleştirin' },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/hakkimizda`, wordCount: 420, hasDesc: true, status: 'Orta', action: 'Kurucu ve ekip E-E-A-T biyografileri ekleyin' },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/iletisim`, wordCount: 180, hasDesc: false, status: 'Zayıf', action: 'Açıklama ve Organization şeması ekleyin' },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/growth`, wordCount: 1850, hasDesc: true, status: 'Mükemmel', action: 'FAQ bölümünü 3 soruyla genişletin' }
  ];

  const handleGenerateBrief = (topic) => {
    setSelectedBriefTopic(topic);
    setGeneratedBrief({
      title: `${topic} — Kapsamlı Uygulama Rehberi`,
      targetAudience: activeWorkspace?.target_audience || 'Geliştiriciler, girişimciler ve dijital ajanslar',
      estimatedWords: '1,500 – 2,200 Kelime',
      h1: `${topic}: Sıfırdan Zirveye Adım Adım Strateji`,
      h2List: [
        '1. Temel Kavramlar ve Neden Önemlidir?',
        '2. Google ve Yapay Zeka Arama Motorları Nasıl Değerlendirir?',
        '3. Adım Adım Kurulum ve Entegrasyon Rehberi',
        '4. Sık Yapılan Hatalar ve En İyi Pratikler',
        '5. Sıkça Sorulan Sorular (FAQ - Schema Uyumlu)'
      ],
      faqs: [
        { q: `${topic} ne kadar sürede sonuç verir?`, a: 'Doğru teknik indeksleme ve kaliteli içerikle ilk 14–30 gün içinde AI ve arama motorlarında görünürlük artışı başlar.' },
        { q: 'Hangi Schema.org türü kullanılmalıdır?', a: 'Article, FAQPage ve HowTo yapılandırılmış veri işaretlemeleri bir arada önerilir.' }
      ]
    });
  };

  const copyBriefText = () => {
    if (!generatedBrief) return;
    const text = `# ${generatedBrief.title}\n\nHedef Kitle: ${generatedBrief.targetAudience}\nÖnerilen Uzunluk: ${generatedBrief.estimatedWords}\n\n## H1: ${generatedBrief.h1}\n\n${generatedBrief.h2List.join('\n')}\n\n## Sıkça Sorulan Sorular\n${generatedBrief.faqs.map(f => `S: ${f.q}\nC: ${f.a}`).join('\n\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  if (loading) {
    return <GrowthContentSkeleton />;
  }

  return (
    <div className="growth-page-container animate-fade">
      {/* Header Cover */}
      <GrowthPageCover
        badge="İçerik Stratejisi & Topic Clusters"
        badgeIcon={FileText}
        title="İçerik Stratejisi & Bilgi Kazanımı"
        subtitle="Yapay zeka modellerinin ve Google'ın tercih ettiği konu kümeleri, içerik denetimleri ve tek tıkla GEO uyumlu içerik taslakları."
        coverImage="/growth-covers/overview-cover.jpg"
        stats={[
          { label: 'Konu Kümeleri', value: clusters.length, sub: 'Pillar & cluster yapısı' },
          { label: 'Taranan Sayfa', value: pagesAudit.length, sub: 'İçerik sağlığı analizi' },
          { label: 'Bilgi Skoru', value: '88/100', sub: 'Yüksek derinlik' }
        ]}
        actions={
          <button 
            type="button" 
            className="growth-primary-btn"
            onClick={() => handleGenerateBrief('Yapay Zeka (GEO) ve /llms.txt Stratejisi')}
          >
            <Sparkles size={15} />
            <span>AI İçerik Taslağı Üret</span>
          </button>
        }
      />

      {/* Top 4 Metrics */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Taranan Sayfalar</span>
            <Layers size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{pagesAudit.length}</div>
          <div className="stat-card-sub text-muted">İçerik sağlığı incelenen</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Bilgi Kazanımı (Gain)</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">%78</div>
          <div className="stat-card-sub text-muted">Orijinal değer katan içerik oranı</div>
        </div>

        <div className="growth-stat-card highlight-quickwin">
          <div className="stat-card-header">
            <span className="stat-card-title">Zayıf / İnce İçerik</span>
            <AlertTriangle size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">1 Sayfa</div>
          <div className="stat-card-sub text-muted">&lt;300 kelime veya eksik meta</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Konu Kümeleri</span>
            <BookOpen size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">{clusters.length} Küme</div>
          <div className="stat-card-sub text-muted">Pillar &amp; Destekleyici içerikler</div>
        </div>
      </div>

      {/* Subnav Pills */}
      <div className="growth-subnav-bar">
        <div className="growth-subnav-pills">
          <button
            type="button"
            className={`subnav-pill ${activeTabSub === 'clusters' ? 'active' : ''}`}
            onClick={() => setActiveTabSub('clusters')}
          >
            Konu Kümeleri &amp; Otorite Mimarisi ({clusters.length})
          </button>
          <button
            type="button"
            className={`subnav-pill ${activeTabSub === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTabSub('audit')}
          >
            Sayfa Sayfa İçerik Sağlığı Denetimi ({pagesAudit.length})
          </button>
        </div>
      </div>

      {/* View 1: Topic Clusters */}
      {activeTabSub === 'clusters' && (
        <div className="growth-clusters-grid">
          {clusters.map((cluster, cIdx) => (
            <div key={cIdx} className="growth-panel-card cluster-card">
              <div className="cluster-header">
                <div className="cluster-pillar-info">
                  <span className="cluster-tag">Pillar (Ana Merkez Sayfa)</span>
                  <h3 className="cluster-pillar-title">{cluster.pillarTitle}</h3>
                  <a href={cluster.pillarUrl} target="_blank" rel="noopener noreferrer" className="growth-table-link">
                    <span>{cluster.pillarUrl}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <span className="cluster-status-badge">{cluster.status}</span>
              </div>

              <div className="cluster-subpages-list">
                <span className="subpages-title">Destekleyici Konular (Cluster Articles):</span>
                <div className="subpages-grid">
                  {cluster.clusterSubpages.map((sub, sIdx) => (
                    <div key={sIdx} className="cluster-subpage-item">
                      <div className="subpage-info">
                        <ChevronRight size={13} className="text-primary" />
                        <span className="subpage-title">{sub.title}</span>
                      </div>
                      <div className="subpage-action-wrap">
                        <span className={`subpage-status-pill ${sub.status === 'Yayınlandı' ? 'live' : 'draft'}`}>
                          {sub.status}
                        </span>
                        {sub.status !== 'Yayınlandı' && (
                          <button
                            type="button"
                            className="create-brief-btn"
                            onClick={() => handleGenerateBrief(sub.title)}
                            title="Bu konu için AI taslağı oluştur"
                          >
                            <Sparkles size={11} />
                            <span>Taslak</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Pages Content Audit */}
      {activeTabSub === 'audit' && (
        <div className="growth-panel-card">
          <div className="growth-table-wrap">
            <table className="growth-table">
              <thead>
                <tr>
                  <th>Sayfa URL</th>
                  <th>Kelime Sayısı</th>
                  <th>Meta Açıklaması</th>
                  <th>İçerik Durumu</th>
                  <th>Önerilen İyileştirme</th>
                </tr>
              </thead>
              <tbody>
                {pagesAudit.map((page, idx) => (
                  <tr key={idx}>
                    <td className="font-mono">
                      <a href={page.url} target="_blank" rel="noopener noreferrer" className="growth-table-link">
                        <span>{page.url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>
                      <span className={`font-mono ${page.wordCount < 300 ? 'text-warning font-semibold' : ''}`}>
                        {page.wordCount} kelime
                      </span>
                    </td>
                    <td>
                      {page.hasDesc ? (
                        <span className="text-success inline-flex items-center gap-1 text-xs">
                          <CheckCircle2 size={13} /> Mevcut
                        </span>
                      ) : (
                        <span className="text-danger inline-flex items-center gap-1 text-xs font-semibold">
                          <AlertTriangle size={13} /> Eksik (CTR Düşüşü)
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${page.status === 'Mükemmel' || page.status === 'İyi' ? 'good' : 'warning'}`}>
                        {page.status}
                      </span>
                    </td>
                    <td>
                      <span className="action-hint-text">{page.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Content Brief Modal */}
      {generatedBrief && (
        <div className="growth-modal-backdrop" onClick={() => setGeneratedBrief(null)}>
          <div className="growth-guide-modal animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Sparkles size={18} className="text-primary" />
                <h2>GEO ve SEO Uyumlu İçerik Taslağı</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setGeneratedBrief(null)}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="growth-modal-body">
              <div className="brief-meta-grid">
                <div className="brief-meta-item">
                  <span className="meta-label">Önerilen Başlık:</span>
                  <strong className="meta-val">{generatedBrief.title}</strong>
                </div>
                <div className="brief-meta-item">
                  <span className="meta-label">Hedef Kitle:</span>
                  <span className="meta-val">{generatedBrief.targetAudience}</span>
                </div>
                <div className="brief-meta-item">
                  <span className="meta-label">Önerilen Uzunluk:</span>
                  <span className="meta-val font-mono">{generatedBrief.estimatedWords}</span>
                </div>
              </div>

              <div className="brief-structure-box">
                <h4>Önerilen H2 Başlık Hiyerarşisi:</h4>
                <ul>
                  {generatedBrief.h2List.map((h2, idx) => (
                    <li key={idx}><strong>{h2}</strong></li>
                  ))}
                </ul>
              </div>

              <div className="brief-faq-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 15, height: 15 }} />
                  <img src="/AI-logos/chatgpt-black.svg" alt="ChatGPT" style={{ width: 14, height: 14, filter: 'brightness(1.8)' }} />
                  <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" style={{ width: 14, height: 14 }} />
                  <h4 style={{ margin: 0 }}>AI Arama Motorları İçin Hazır FAQ (Schema.org Uyumlu):</h4>
                </div>
                {generatedBrief.faqs.map((faq, idx) => (
                  <div key={idx} className="faq-item">
                    <span className="faq-q">S: {faq.q}</span>
                    <span className="faq-a">C: {faq.a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="growth-modal-footer">
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setGeneratedBrief(null)}
              >
                Kapat
              </button>
              <button
                type="button"
                className="growth-primary-btn"
                onClick={copyBriefText}
              >
                {copiedBrief ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copiedBrief ? 'Kopyalandı!' : 'Taslağı Markdown Olarak Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
