import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Bot, 
  MapPin, 
  Users2, 
  FileText, 
  Wrench, 
  Share2, 
  FileBarChart, 
  Settings,
  Sparkles,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';

const NAV_GROUPS = [
  {
    title: 'GENEL BAKIŞ',
    items: [
      { id: 'overview', label: 'Genel Bakış & Skor', icon: LayoutDashboard },
      { id: 'action-feed', label: 'Aksiyon Akışı (Öncelikler)', icon: Zap, badge: 'Öncelikli' }
    ]
  },
  {
    title: 'ARAMA MOTORU (SEO)',
    items: [
      { id: 'search', label: 'Arama Performansı (GSC)', icon: Search },
      { id: 'keywords', label: 'Anahtar Kelime Fırsatları', icon: TrendingUp }
    ]
  },
  {
    title: 'YAPAY ZEKA ARAMA (GEO)',
    items: [
      { id: 'ai-visibility', label: 'AI Görünürlüğü (GEO)', icon: Bot, isNew: true },
      { id: 'ai-prompts', label: 'Takip Edilen Promptlar', icon: Cpu }
    ]
  },
  {
    title: 'RAKİP VE PAZAR',
    items: [
      { id: 'competitors', label: 'Rakip İstihbaratı', icon: Users2 }
    ]
  },
  {
    title: 'TEKNİK VE İÇERİK',
    items: [
      { id: 'technical', label: 'Site Denetimi & Hatalar', icon: Wrench },
      { id: 'content', label: 'İçerik Stratejisi & Fırsatlar', icon: FileText },
      { id: 'directories', label: 'Dizinler & Dağıtım', icon: Share2 }
    ]
  },
  {
    title: 'YÖNETİM',
    items: [
      { id: 'reports', label: 'Haftalık / Aylık Raporlar', icon: FileBarChart },
      { id: 'settings', label: 'Marka & Entegrasyonlar', icon: Settings }
    ]
  }
];

export default function GrowthSidebar() {
  const { activeTab, setActiveTab, activeWorkspace } = useGrowth();

  return (
    <aside className="growth-app-sidebar">
      {/* Platform Branding Mini */}
      <div className="growth-sidebar-brand-box">
        <div className="growth-logo-glow-wrap">
          <Sparkles size={16} className="text-primary" />
        </div>
        <div className="growth-brand-titles">
          <span className="growth-app-title">Cerilas Growth</span>
          <span className="growth-app-tag">AI Intelligence v1.0</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="growth-sidebar-nav">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="growth-nav-group">
            <span className="growth-group-title">{group.title}</span>
            <div className="growth-group-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`growth-nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (activeWorkspace) {
                        window.location.hash = `#/growth/${activeWorkspace.slug}/${item.id}`;
                      }
                    }}
                  >
                    <Icon size={16} className="growth-nav-icon" />
                    <span className="growth-nav-label">{item.label}</span>
                    {item.badge && <span className="growth-nav-badge">{item.badge}</span>}
                    {item.isNew && <span className="growth-nav-new-badge">GEO</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer (Active workspace status card) */}
      {activeWorkspace && (
        <div className="growth-sidebar-footer">
          <div className="growth-footer-score-pill">
            <div className="growth-footer-dot" />
            <span>Skor: {activeWorkspace.growth_score || 72}/100</span>
          </div>
          <span className="growth-footer-domain">{activeWorkspace.primary_domain}</span>
        </div>
      )}
    </aside>
  );
}
