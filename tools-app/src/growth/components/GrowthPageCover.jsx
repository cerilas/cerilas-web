import React from 'react';
import { Sparkles } from 'lucide-react';

export default function GrowthPageCover({
  title,
  subtitle,
  badge = 'Cerilas Growth',
  badgeIcon: BadgeIcon = Sparkles,
  coverImage,
  stats = [],
  actions
}) {
  return (
    <div className="growth-page-hero-banner">
      {coverImage && (
        <div className="hero-banner-bg-wrap">
          <img 
            src={coverImage} 
            alt="" 
            className="hero-banner-bg-img"
            loading="lazy"
          />
          <div className="hero-banner-overlay" />
        </div>
      )}

      <div className="hero-banner-content">
        <div className="hero-banner-text-col">
          <div className="hero-banner-badge">
            <BadgeIcon size={14} className="text-primary" />
            <span>{badge}</span>
          </div>

          <h1 className="hero-banner-title">{title}</h1>
          {subtitle && <p className="hero-banner-desc">{subtitle}</p>}

          {actions && <div className="hero-banner-actions">{actions}</div>}
        </div>

        {stats && stats.length > 0 && (
          <div className="hero-banner-stats-pillbox">
            {stats.map((st, sIdx) => {
              const Icon = st.icon;
              return (
                <div key={sIdx} className="hero-banner-stat-chip">
                  <div className="chip-label-row">
                    {Icon && <Icon size={13} className="text-muted" />}
                    <span className="chip-label">{st.label}</span>
                  </div>
                  <div className="chip-val-row">
                    <span className={`chip-val ${st.positive ? 'text-success' : ''}`}>{st.value}</span>
                    {st.sub && <span className="chip-sub">{st.sub}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
