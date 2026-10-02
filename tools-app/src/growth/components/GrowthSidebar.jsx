import React from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  Search, 
  TrendingUp, 
  BrainCircuit, 
  Terminal, 
  Radar, 
  ShieldCheck, 
  FileText, 
  Network, 
  BarChart3, 
  SlidersHorizontal,
  Layers,
  Sparkles,
  Activity,
  MapPin
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';

const NAV_GROUPS = [
  {
    title: 'GENEL BAKIŞ',
    items: [
      { id: 'overview', label: 'Genel Bakış & Skor', icon: LayoutDashboard },
      { id: 'landing', label: 'Hızlı Domain Analizi', icon: Sparkles, badge: 'Insight' },
      { id: 'action-feed', label: 'Aksiyon Akışı (Öncelikler)', icon: ListTodo, badge: 'Öncelikli' }
    ]
  },
  {
    title: 'ARAMA & TRAFİK',
    items: [
      { id: 'search', label: 'Arama Performansı (GSC)', icon: Search },
      { id: 'analytics', label: 'Web Analitiği (GA4)', icon: Activity, isNew: true },
      { id: 'keywords', label: 'Anahtar Kelime Fırsatları', icon: TrendingUp }
    ]
  },
  {
    title: 'YAPAY ZEKA ARAMA (GEO)',
    items: [
      { id: 'ai-visibility', label: 'AI Görünürlüğü (GEO)', icon: BrainCircuit },
      { id: 'ai-prompts', label: 'Takip Edilen Promptlar', icon: Terminal },
      { id: 'google-business', label: 'Google İşletme & Yorumlar', icon: MapPin, isNew: true }
    ]
  },
  {
    title: 'RAKİP VE PAZAR',
    items: [
      { id: 'competitors', label: 'Rakip İstihbaratı', icon: Radar }
    ]
  },
  {
    title: 'TEKNİK VE İÇERİK',
    items: [
      { id: 'technical', label: 'Site Denetimi & Hatalar', icon: ShieldCheck },
      { id: 'content', label: 'İçerik Stratejisi & Fırsatlar', icon: FileText },
      { id: 'directories', label: 'Dizinler & Dağıtım', icon: Network }
    ]
  },
  {
    title: 'YÖNETİM',
    items: [
      { id: 'reports', label: 'Haftalık / Aylık Raporlar', icon: BarChart3 },
      { id: 'settings', label: 'Marka & Entegrasyonlar', icon: SlidersHorizontal }
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
          <Layers size={17} strokeWidth={2} />
        </div>
        <div className="growth-brand-titles">
          <span className="growth-app-title">Cerilas Growth</span>
          <span className="growth-app-tag">AI Intelligence v1.0</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="growth-sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="growth-nav-group">
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
                    <Icon size={16} strokeWidth={1.8} className="growth-nav-icon" />
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
