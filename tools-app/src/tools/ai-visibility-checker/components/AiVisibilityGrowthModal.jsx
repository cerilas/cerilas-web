import React from 'react';
import { 
  TrendingUp, 
  ArrowRight, 
  X, 
  Sparkles, 
  Bot, 
  Search, 
  CheckCircle2, 
  BarChart3,
  ExternalLink 
} from 'lucide-react';

export default function AiVisibilityGrowthModal({
  isOpen,
  onClose,
  domain,
  score,
  grade = 'B',
  onNavigateGrowth
}) {
  if (!isOpen) return null;

  const isTr = typeof window !== 'undefined' && (
    localStorage.getItem('preferred_language') === 'tr' ||
    navigator.language?.startsWith('tr')
  );

  const cleanDomain = domain ? domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : 'Siteniz';

  const handleLaunchGrowth = () => {
    if (onNavigateGrowth) {
      onNavigateGrowth();
    } else {
      window.location.hash = '#/growth';
    }
    onClose();
  };

  return (
    <div className="aivc-growth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="aivc-growth-modal-card animate-scale-up" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="aivc-growth-modal-glow" />

        {/* Close Button */}
        <button 
          type="button" 
          className="aivc-growth-modal-close" 
          onClick={onClose}
          aria-label={isTr ? 'Kapat' : 'Close'}
        >
          <X size={18} />
        </button>

        {/* Brand Ecosystem Pill */}
        <div className="aivc-growth-modal-badge">
          <img 
            src="/cgrowthlogo.svg" 
            alt="GrowthControl" 
            className="aivc-modal-brand-logo"
            width={16}
            height={16}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="aivc-modal-badge-text">GrowthControl Platform</span>
          <span className="aivc-modal-badge-sub">GEO &amp; SEO Suite</span>
        </div>

        {/* Modal Header */}
        <div className="aivc-growth-modal-header">
          <h3 className="aivc-growth-modal-title">
            {isTr ? (
              <>
                İlk Tarama Tamamlandı!<br />
                <span className="gradient-text">{cleanDomain}</span> Verilerini Sürekli Takip Edin
              </>
            ) : (
              <>
                Initial Audit Complete!<br />
                Supercharge <span className="gradient-text">{cleanDomain}</span> with GrowthControl
              </>
            )}
          </h3>
          <p className="aivc-growth-modal-sub">
            {isTr 
              ? 'Tek seferlik tarama buzdağının sadece görünen kısmı. GrowthControl platformu ile yapay zeka arama motorlarındaki alıntılarınızı her hafta otomatik ölçün, Google Search Console verilerinizi bağlayın ve öncelikli aksiyon akışını başlatın.'
              : 'This single-page audit is just the tip of the iceberg. With GrowthControl, automate continuous weekly AI citation testing across Gemini & ChatGPT, connect Google Search Console, and unlock weekly prioritized action items.'
            }
          </p>
        </div>

        {/* 3 Minimalist Highlights */}
        <div className="aivc-growth-modal-features">
          <div className="aivc-growth-feature-item">
            <div className="aivc-feature-icon-box">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="aivc-feature-text">
              <strong>{isTr ? 'Otomatik Haftalık GEO Radarı' : 'Automated Weekly GEO Testing'}</strong>
              <span>
                {isTr 
                  ? 'Gemini, ChatGPT ve Perplexity alıntı payınızı her hafta otomatik tarayın ve rakip farklarını yakalayın.'
                  : 'Weekly citation tracking across Gemini, Perplexity and ChatGPT with competitor voice share.'
                }
              </span>
            </div>
          </div>

          <div className="aivc-growth-feature-item">
            <div className="aivc-feature-icon-box">
              <BarChart3 size={16} className="text-emerald" />
            </div>
            <div className="aivc-feature-text">
              <strong>{isTr ? 'Google Search Console Entegrasyonu' : 'Verified Google Search Console Sync'}</strong>
              <span>
                {isTr 
                  ? '1. parti arama gösterimleri, tıklamalar ve gerçek kullanıcı anahtar kelimelerini tek tıkla bağlayın.'
                  : 'Sync live search console clicks, impressions, and exact keywords with zero third-party exposure.'
                }
              </span>
            </div>
          </div>

          <div className="aivc-growth-feature-item">
            <div className="aivc-feature-icon-box">
              <Sparkles size={16} className="text-amber" />
            </div>
            <div className="aivc-feature-text">
              <strong>{isTr ? 'Haftalık Öncelikli Aksiyon Akışı' : 'Weekly Prioritized Action Feed'}</strong>
              <span>
                {isTr 
                  ? 'Karmaşık grafikler yerine, bu hafta organik trafiğinizi artıracak somut adımları teslim alın.'
                  : 'Clear weekly to-do list telling you exactly which technical and content fixes will yield top ROI.'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="aivc-growth-modal-actions">
          <button
            type="button"
            className="aivc-growth-modal-primary-btn"
            onClick={handleLaunchGrowth}
          >
            <TrendingUp size={16} />
            <span>{isTr ? 'GrowthControl\'de Aç (Ücretsiz)' : 'Open in GrowthControl (Free)'}</span>
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            className="aivc-growth-modal-secondary-btn"
            onClick={onClose}
          >
            <span>{isTr ? 'Sonuçları İncelemeye Devam Et' : 'Continue Viewing Audit Results'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
