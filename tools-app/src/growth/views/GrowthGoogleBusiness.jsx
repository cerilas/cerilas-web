import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Globe,
  ExternalLink,
  Layers,
  Building2,
  HelpCircle,
  TrendingUp,
  Info
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { AiEngineGroup } from '../components/AiEngineBadge';
import GoogleBusinessProfileCard from '../components/GoogleBusinessProfileCard';

export default function GrowthGoogleBusiness() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!activeWorkspace?.id || !token) return;
    fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.connected && data.profile) {
          setProfile(data.profile);
        } else {
          setProfile(null);
        }
      })
      .catch(() => {});
  }, [activeWorkspace?.id, token]);

  const coverStats = profile ? [
    { label: 'Google Puanı', value: `⭐ ${Number(profile.rating || 0).toFixed(1)} / 5.0`, sub: 'Genel Müşteri Memnuniyeti' },
    { label: 'Toplam Yorum', value: `${profile.total_reviews} Yorum`, sub: 'Haritalar Hacmi' },
    { label: 'Düşük Yıldız (1-2★)', value: `${profile.low_rating_count || 0} Adet`, sub: profile.unanswered_low_count > 0 ? `${profile.unanswered_low_count} Yanıtsız` : 'Tümü Yanıtlandı' },
    { label: 'AI Tavsiye Riski', value: profile.ai_recommendation_risk || 'Düşük Risk', sub: 'Yerel GEO Etkisi' }
  ] : [
    { label: 'Google Haritalar', value: 'Bağlı Değil', sub: 'Profil aratın ve bağlayın' },
    { label: 'Yerel GEO Etkisi', value: 'Yüksek Önem', sub: 'ChatGPT & Gemini için kritik' },
    { label: 'Yorum Hedefi', value: '50+ Yorum', sub: 'AI güven eşiği' }
  ];

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Yerel GEO & İtibar Yönetimi"
        badgeIcon={MapPin}
        title="Google İşletme Profili & Yorum Radarı"
        subtitle="İşletmenizin Google Haritalar profilini bağlayarak toplam yorum sayısını, müşteri puanını ve düşük yıldızlı şikayetleri denetleyin."
        coverImage="/growth-covers/geo-cover.jpg"
        stats={coverStats}
        actions={<AiEngineGroup size={20} />}
      />

      {/* Main Google Business & Reviews Radar Card */}
      <GoogleBusinessProfileCard />

      {/* Local GEO & Review Education Info Box */}
      <div className="growth-panel-card" style={{ marginTop: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <div className="ai-report-icon-box" style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#38bdf8' }}>
            <Info size={17} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
              Yapay Zeka Yanıt Motorları Google Yorumlarını Nasıl Kullanır?
            </h4>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Perplexity, Google Gemini ve ChatGPT Search yerel işletme tavsiyelerinde Google Haritalar verilerini 1. kaynak olarak alır.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Star size={14} color="#eab308" fill="#eab308" />
              <strong style={{ fontSize: '0.86rem', color: '#f8fafc' }}>4.2+ Puan Eşiği</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Yapay zeka modelleri kullanıcılara öneri sunarken genellikle 4.2 puanın ve 30+ yorumun altındaki işletmeleri filtre dışı bırakır veya "bazı müşteri şikayetleri mevcuttur" uyarısıyla sunar.
            </p>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={14} color="#f87171" />
              <strong style={{ fontSize: '0.86rem', color: '#f8fafc' }}>Olumsuz Yorum Semantiği</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Düşük yıldızlı yorumlardaki spesifik şikayet kelimeleri (kargo gecikti, ilgisiz destek, ürün bozuk) LLM'lerin hafızasına olumsuz bağlam olarak işlenir.
            </p>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Sparkles size={14} color="#38bdf8" />
              <strong style={{ fontSize: '0.86rem', color: '#f8fafc' }}>İşletme Yanıtının Önemi</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
              İşletme sahibi tarafından nazik ve çözüm odaklı yanıtlanan 1-2 yıldızlı yorumlar, yapay zeka tarafından "çözüm üretilmiş şikayet" olarak kabul edilerek itibar kaybı telafi edilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
