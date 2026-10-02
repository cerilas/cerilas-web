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
    { label: 'Google Puanı', value: `⭐ ${Number(profile.rating || 0).toFixed(1)} / 5.0`, sub: 'Müşteri Memnuniyeti', positive: true },
    { label: 'Toplam Yorum', value: `${profile.total_reviews} Yorum`, sub: 'Google Haritalar Hacmi' },
    { label: 'Düşük Yıldız (1-2★)', value: `${profile.low_rating_count || 0} Adet`, sub: profile.unanswered_low_count > 0 ? `${profile.unanswered_low_count} Yanıtsız` : 'Tümü Yanıtlandı' },
    { label: 'AI Tavsiye Riski', value: profile.ai_recommendation_risk || 'Düşük Risk', sub: 'Yerel GEO Puanı' }
  ] : null;

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
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Desteklenen Arama Motorları:</span>
            <AiEngineGroup size={18} />
          </div>
        }
        rightSlot={
          !profile ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1.1rem 1.35rem',
              borderRadius: 14,
              background: 'rgba(18, 18, 24, 0.65)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxWidth: 320
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="growth-badge blue">Harita &amp; GEO Radarı</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                İşletmenizi bağladığınızda Google Haritalar puanı, yorum sayısı ve 1-2 yıldızlı müşteri şikayetleri otomatik denetlenir.
              </p>
            </div>
          ) : null
        }
      />

      {/* Main Google Business & Reviews Radar Card */}
      <GoogleBusinessProfileCard />

      {/* Local GEO & Review Education Info Box */}
      <div className="growth-panel-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <div className="ai-report-icon-box" style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#38bdf8' }}>
            <Info size={17} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-main, #f8fafc)', fontWeight: 700 }}>
              Yapay Zeka Yanıt Motorları Google Yorumlarını Nasıl Kullanır?
            </h4>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
              Perplexity, Google Gemini ve ChatGPT Search yerel işletme tavsiyelerinde Google Haritalar verilerini 1. kaynak olarak alır.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <Star size={13} color="#eab308" fill="#eab308" />
              <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #f8fafc)' }}>4.2+ Puan Eşiği</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>
              AI modelleri 4.2 puan ve 30+ yorumun altındaki işletmeleri filtreleyebilir veya "şikayetler mevcuttur" uyarısıyla sunar.
            </p>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <AlertTriangle size={13} color="#f87171" />
              <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #f8fafc)' }}>Olumsuz Yorum Semantiği</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>
              Düşük yıldızlı yorumlardaki spesifik şikayet kalıpları (gecikti, ilgisiz destek, ürün bozuk) LLM'lerin hafızasına olumsuz bağlam oluşturur.
            </p>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <Sparkles size={13} color="#38bdf8" />
              <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #f8fafc)' }}>İşletme Yanıtının Önemi</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>
              İşletme sahibi tarafından nazikçe yanıtlanan olumsuz yorumlar, yapay zeka tarafından "çözüm üretilmiş şikayet" sayılarak itibar telafi edilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
