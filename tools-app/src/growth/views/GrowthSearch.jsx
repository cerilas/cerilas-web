import React from 'react';
import { 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  Globe, 
  BarChart3, 
  Zap,
  Target
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';

export default function GrowthSearch() {
  const { activeWorkspace, setActiveTab } = useGrowth();

  return (
    <div className="growth-page-container animate-fade">
      {/* Page Header */}
      <div className="growth-page-header">
        <div>
          <div className="growth-title-row">
            <Search size={22} className="text-primary" />
            <h1 className="growth-page-title">Google Search Console Analitiği & Fırsatlar</h1>
          </div>
          <p className="growth-page-subtitle">
            Google'dan gelen gerçek organik arama sorguları, gösterimler, tıklamalar ve 5-10. sıradaki hızlı yükselme fırsatları.
          </p>
        </div>
      </div>

      {/* Integration Connection Prompt Card */}
      <div className="growth-panel-card gsc-spotlight-box">
        <div className="gsc-spotlight-content">
          <div className="gsc-badge-row">
            <div className="gsc-logo-badge">
              <Search size={20} />
            </div>
            <span className="gsc-status-tag">Google Search Console Entegrasyonu</span>
          </div>

          <h3 className="gsc-spotlight-title">
            İlk Elden Google Arama Verinizi ve Tıklama Fırsatlarını Açın
          </h3>

          <p className="gsc-spotlight-desc">
            Search Console mülkünüzü Cerilas Growth'a bağlayarak sitenizin Google'da hangi aramalardan tıklama aldığını, hangi sayfalarda anahtar kelime yamyamlığı (cannibalization) yaşandığını ve sayfa 1'e en yakın kelimelerinizi otomatik tespit edin.
          </p>

          <div className="gsc-features-list">
            <div className="gsc-feature-item">
              <CheckCircle2 size={16} className="text-success" />
              <span>Pozisyon 5–10 arası yüksek hacimli hızlı fırsatlar</span>
            </div>
            <div className="gsc-feature-item">
              <CheckCircle2 size={16} className="text-success" />
              <span>Düşük tıklama oranlı (low CTR) başlık optimizasyonları</span>
            </div>
            <div className="gsc-feature-item">
              <CheckCircle2 size={16} className="text-success" />
              <span>İçerik çürümesi (content decay) erken uyarı sinyalleri</span>
            </div>
          </div>

          <div className="gsc-action-row">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="growth-primary-btn"
              style={{ maxWidth: '280px' }}
            >
              <span>Search Console Bağla</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
