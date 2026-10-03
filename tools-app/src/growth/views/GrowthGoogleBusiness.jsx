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
    { label: 'Google Rating', value: `⭐ ${Number(profile.rating || 0).toFixed(1)} / 5.0`, sub: 'Customer Satisfaction', positive: true },
    { label: 'Total Reviews', value: `${profile.total_reviews} Reviews`, sub: 'Google Maps Volume' },
    { label: 'Low Rating (1-2★)', value: `${profile.low_rating_count || 0} Total`, sub: profile.unanswered_low_count > 0 ? `${profile.unanswered_low_count} Unanswered` : 'All Answered' },
    { label: 'AI Recommendation Risk', value: profile.ai_recommendation_risk || 'Low Risk', sub: 'Local GEO Score' }
  ] : null;

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Local GEO & Reputation Radar"
        badgeIcon={MapPin}
        title="Google Business Profile & Review Radar"
        subtitle="Connect your business Google Maps profile to audit total review volume, customer rating sentiment, and low-star citations."
        coverImage="/growth-covers/geo-cover.jpg"
        stats={coverStats}
        actions={
          profile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Supported Search Engines:</span>
              <AiEngineGroup size={18} />
            </div>
          ) : null
        }
        rightSlot={null}
      />

      {/* Main Google Business & Reviews Radar Card */}
      <GoogleBusinessProfileCard onProfileChange={setProfile} />

      {/* Local GEO & Review Education Info Box */}
      {profile && (
        <div className="growth-panel-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <div className="ai-report-icon-box" style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#38bdf8' }}>
              <Info size={17} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-main, #f8fafc)', fontWeight: 700 }}>
                How AI Answer Engines Use Google Reviews
              </h4>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                Perplexity, Google Gemini, and ChatGPT Search use Google Maps data as their primary source for local business recommendations.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            <div className="gbp-tip-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <Star size={13} color="#eab308" fill="#eab308" />
                <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #f8fafc)' }}>4.2+ Rating Threshold</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>
                AI models often filter out businesses below a 4.2 rating or 30+ reviews, or cite them with cautionary caveats regarding customer complaints.
              </p>
            </div>

            <div className="gbp-tip-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <AlertTriangle size={13} color="#f87171" />
                <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #f8fafc)' }}>Negative Review Semantics</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>
                Specific recurring complaint patterns in 1-2 star reviews (delays, poor support, defects) inject negative contextual tokens into LLM retrieval memory.
              </p>
            </div>

            <div className="gbp-tip-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <Sparkles size={13} color="#38bdf8" />
                <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #f8fafc)' }}>Importance of Business Responses</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>
                Low-star reviews politely answered with constructive solutions by the business owner are treated by AI as resolved issues, recovering trust.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
