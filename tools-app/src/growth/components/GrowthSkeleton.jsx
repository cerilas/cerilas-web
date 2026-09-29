import React from 'react';
import './GrowthSkeleton.css';

/**
 * Base Shimmer Block Primitive
 */
export function SkeletonBlock({ className = '', style = {}, height, width, borderRadius }) {
  const customStyle = {
    ...(height ? { height } : {}),
    ...(width ? { width } : {}),
    ...(borderRadius ? { borderRadius } : {}),
    ...style
  };
  return <div className={`growth-skeleton-shimmer ${className}`} style={customStyle} />;
}

/**
 * Skeleton Header Cover (matches GrowthPageCover)
 */
export function SkeletonCover() {
  return (
    <div className="growth-skeleton-cover">
      <div className="skeleton-cover-left">
        <SkeletonBlock width="130px" height="24px" borderRadius="999px" />
        <SkeletonBlock width="340px" height="34px" borderRadius="8px" />
        <SkeletonBlock width="520px" height="18px" borderRadius="6px" />
      </div>
      <div className="skeleton-cover-stats">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-cover-stat-box">
            <SkeletonBlock width="70px" height="13px" borderRadius="4px" />
            <SkeletonBlock width="95px" height="24px" borderRadius="6px" />
            <SkeletonBlock width="115px" height="12px" borderRadius="4px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4-Column Metric Row Skeleton
 */
export function SkeletonMetricCards({ count = 4 }) {
  return (
    <div className="growth-skeleton-metrics-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="growth-skeleton-metric-card">
          <div className="skeleton-metric-top">
            <SkeletonBlock width="85px" height="14px" borderRadius="4px" />
            <SkeletonBlock width="32px" height="32px" borderRadius="8px" />
          </div>
          <SkeletonBlock width="110px" height="30px" borderRadius="6px" />
          <SkeletonBlock width="140px" height="13px" borderRadius="4px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Table (For keywords, queries, audit pages)
 */
export function SkeletonTable({ rows = 6, cols = 5, hasHeader = true }) {
  return (
    <div className="growth-skeleton-card">
      {hasHeader && (
        <div className="skeleton-card-header">
          <SkeletonBlock width="200px" height="22px" borderRadius="6px" />
          <SkeletonBlock width="240px" height="36px" borderRadius="10px" />
        </div>
      )}
      <div className="growth-skeleton-table">
        <div className="skeleton-table-head">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} width={c === 0 ? '30%' : `${15 + (c % 2) * 5}%`} height="16px" borderRadius="4px" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="skeleton-table-row">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBlock key={c} width={c === 0 ? '45%' : `${20 + (c % 2) * 10}%`} height="16px" borderRadius="4px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 1. Overview Page Skeleton
 */
export function GrowthOverviewSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      {/* Hero Spotlight Card */}
      <div className="growth-skeleton-overview-hero">
        <div className="skeleton-hero-left">
          <div className="skeleton-hero-pill-row">
            <SkeletonBlock width="120px" height="22px" borderRadius="999px" />
            <SkeletonBlock width="70px" height="22px" borderRadius="999px" />
          </div>
          <SkeletonBlock width="380px" height="36px" borderRadius="8px" />
          <SkeletonBlock width="520px" height="18px" borderRadius="6px" />
          <SkeletonBlock width="180px" height="26px" borderRadius="8px" />
        </div>

        <div className="skeleton-gauge-box">
          <SkeletonBlock width="140px" height="14px" borderRadius="4px" />
          <SkeletonBlock width="100px" height="48px" borderRadius="10px" />
          <SkeletonBlock width="160px" height="12px" borderRadius="4px" />
        </div>
      </div>

      {/* Subscores 5-Column Grid */}
      <div className="growth-skeleton-metrics-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="growth-skeleton-metric-card">
            <SkeletonBlock width="70px" height="13px" borderRadius="4px" />
            <SkeletonBlock width="90px" height="26px" borderRadius="6px" />
            <SkeletonBlock width="100%" height="6px" borderRadius="999px" />
          </div>
        ))}
      </div>

      {/* Opportunities & Priority Actions Skeleton */}
      <div className="growth-skeleton-card">
        <div className="skeleton-card-header">
          <div>
            <SkeletonBlock width="220px" height="22px" borderRadius="6px" />
            <SkeletonBlock width="340px" height="14px" borderRadius="4px" style={{ marginTop: 6 }} />
          </div>
          <SkeletonBlock width="110px" height="34px" borderRadius="10px" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="growth-skeleton-opp-card">
              <div className="skeleton-opp-left">
                <SkeletonBlock width="40px" height="40px" borderRadius="10px" />
                <div className="skeleton-opp-info">
                  <SkeletonBlock width="65%" height="16px" borderRadius="4px" />
                  <SkeletonBlock width="45%" height="13px" borderRadius="4px" />
                </div>
              </div>
              <div className="skeleton-opp-right">
                <SkeletonBlock width="70px" height="24px" borderRadius="999px" />
                <SkeletonBlock width="90px" height="32px" borderRadius="8px" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Split Audit Cards */}
      <div className="growth-skeleton-split-grid">
        <div className="growth-skeleton-card">
          <SkeletonBlock width="180px" height="20px" borderRadius="6px" />
          <SkeletonBlock width="100%" height="80px" borderRadius="10px" />
          <SkeletonBlock width="100%" height="50px" borderRadius="8px" />
        </div>
        <div className="growth-skeleton-card">
          <SkeletonBlock width="180px" height="20px" borderRadius="6px" />
          <SkeletonBlock width="100%" height="80px" borderRadius="10px" />
          <SkeletonBlock width="100%" height="50px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Search Page Skeleton
 */
export function GrowthSearchSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />
      <SkeletonMetricCards count={4} />

      {/* GSC Telemetry Banner Skeleton */}
      <div className="growth-skeleton-card" style={{ padding: '1.25rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <SkeletonBlock width="36px" height="36px" borderRadius="10px" />
            <div>
              <SkeletonBlock width="260px" height="18px" borderRadius="4px" />
              <SkeletonBlock width="180px" height="13px" borderRadius="4px" style={{ marginTop: 6 }} />
            </div>
          </div>
          <SkeletonBlock width="130px" height="34px" borderRadius="8px" />
        </div>
      </div>

      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}

/**
 * 3. AI Visibility Page Skeleton
 */
export function GrowthAiVisibilitySkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />

      {/* 3 AI Engine Cards (Gemini, Perplexity, GPT Search) */}
      <div className="growth-skeleton-3col-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="growth-skeleton-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SkeletonBlock width="38px" height="38px" borderRadius="10px" />
              <div>
                <SkeletonBlock width="120px" height="18px" borderRadius="4px" />
                <SkeletonBlock width="80px" height="12px" borderRadius="4px" style={{ marginTop: 4 }} />
              </div>
            </div>
            <SkeletonBlock width="100%" height="50px" borderRadius="8px" />
            <SkeletonBlock width="100%" height="8px" borderRadius="999px" />
          </div>
        ))}
      </div>

      <SkeletonTable rows={4} cols={4} />
    </div>
  );
}

/**
 * 4. Technical Audit Page Skeleton
 */
export function GrowthTechnicalAuditSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />

      <div className="growth-skeleton-split-grid">
        <div className="growth-skeleton-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <SkeletonBlock width="76px" height="76px" borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBlock width="160px" height="22px" borderRadius="6px" />
              <SkeletonBlock width="220px" height="14px" borderRadius="4px" />
            </div>
          </div>
        </div>

        <div className="growth-skeleton-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <SkeletonBlock width="45px" height="28px" borderRadius="6px" />
                <SkeletonBlock width="65px" height="12px" borderRadius="4px" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="growth-skeleton-card">
        <div className="skeleton-card-header">
          <SkeletonBlock width="180px" height="20px" borderRadius="6px" />
          <SkeletonBlock width="260px" height="34px" borderRadius="999px" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="growth-skeleton-opp-card">
              <div className="skeleton-opp-left">
                <SkeletonBlock width="34px" height="34px" borderRadius="8px" />
                <div className="skeleton-opp-info">
                  <SkeletonBlock width="70%" height="16px" borderRadius="4px" />
                  <SkeletonBlock width="40%" height="13px" borderRadius="4px" />
                </div>
              </div>
              <SkeletonBlock width="80px" height="24px" borderRadius="999px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 5. Keywords Page Skeleton
 */
export function GrowthKeywordsSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />
      <SkeletonMetricCards count={4} />
      <SkeletonTable rows={7} cols={5} />
    </div>
  );
}

/**
 * 6. Competitors Page Skeleton
 */
export function GrowthCompetitorsSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />

      <div className="growth-skeleton-3col-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="growth-skeleton-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SkeletonBlock width="40px" height="40px" borderRadius="10px" />
              <div style={{ flex: 1 }}>
                <SkeletonBlock width="130px" height="18px" borderRadius="4px" />
                <SkeletonBlock width="90px" height="13px" borderRadius="4px" style={{ marginTop: 4 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <SkeletonBlock width="50%" height="45px" borderRadius="8px" />
              <SkeletonBlock width="50%" height="45px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>

      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}

/**
 * 7. Content Page Skeleton
 */
export function GrowthContentSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />
      <SkeletonMetricCards count={3} />

      <div className="growth-skeleton-split-grid">
        {[1, 2].map(i => (
          <div key={i} className="growth-skeleton-card">
            <SkeletonBlock width="65%" height="22px" borderRadius="6px" />
            <SkeletonBlock width="40%" height="14px" borderRadius="4px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {[1, 2, 3].map(s => (
                <SkeletonBlock key={s} width="100%" height="38px" borderRadius="8px" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <SkeletonTable rows={4} cols={4} />
    </div>
  );
}

/**
 * 8. Action Feed Skeleton
 */
export function GrowthActionFeedSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />

      <div className="growth-skeleton-card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonBlock key={i} width="110px" height="32px" borderRadius="999px" />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="growth-skeleton-opp-card">
            <div className="skeleton-opp-left">
              <SkeletonBlock width="42px" height="42px" borderRadius="10px" />
              <div className="skeleton-opp-info">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <SkeletonBlock width="75px" height="18px" borderRadius="999px" />
                  <SkeletonBlock width="90px" height="18px" borderRadius="999px" />
                </div>
                <SkeletonBlock width="65%" height="18px" borderRadius="4px" style={{ marginTop: 4 }} />
                <SkeletonBlock width="85%" height="14px" borderRadius="4px" />
              </div>
            </div>
            <div className="skeleton-opp-right">
              <SkeletonBlock width="90px" height="32px" borderRadius="8px" />
              <SkeletonBlock width="32px" height="32px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 9. Directories Skeleton
 */
export function GrowthDirectoriesSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />
      <SkeletonMetricCards count={3} />

      <div className="growth-skeleton-3col-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="growth-skeleton-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SkeletonBlock width="42px" height="42px" borderRadius="10px" />
              <div style={{ flex: 1 }}>
                <SkeletonBlock width="130px" height="18px" borderRadius="4px" />
                <SkeletonBlock width="80px" height="13px" borderRadius="4px" style={{ marginTop: 4 }} />
              </div>
            </div>
            <SkeletonBlock width="100%" height="34px" borderRadius="6px" />
            <SkeletonBlock width="100%" height="36px" borderRadius="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 10. AI Prompts Skeleton
 */
export function GrowthAiPromptsSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />

      <div className="growth-skeleton-card">
        <SkeletonBlock width="240px" height="20px" borderRadius="6px" />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <SkeletonBlock width="100%" height="46px" borderRadius="10px" />
          <SkeletonBlock width="130px" height="46px" borderRadius="10px" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="growth-skeleton-opp-card">
            <div className="skeleton-opp-left">
              <SkeletonBlock width="38px" height="38px" borderRadius="10px" />
              <div className="skeleton-opp-info">
                <SkeletonBlock width="75%" height="18px" borderRadius="4px" />
                <SkeletonBlock width="40%" height="13px" borderRadius="4px" />
              </div>
            </div>
            <SkeletonBlock width="95px" height="32px" borderRadius="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 11. Reports Skeleton
 */
export function GrowthReportsSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="growth-skeleton-card">
            <div className="skeleton-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SkeletonBlock width="40px" height="40px" borderRadius="10px" />
                <div>
                  <SkeletonBlock width="240px" height="20px" borderRadius="6px" />
                  <SkeletonBlock width="140px" height="13px" borderRadius="4px" style={{ marginTop: 4 }} />
                </div>
              </div>
              <SkeletonBlock width="90px" height="26px" borderRadius="999px" />
            </div>
            <SkeletonBlock width="100%" height="40px" borderRadius="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 12. Settings Skeleton
 */
export function GrowthSettingsSkeleton() {
  return (
    <div className="growth-skeleton-container animate-fade">
      <SkeletonCover />

      <div className="growth-skeleton-card">
        <SkeletonBlock width="220px" height="22px" borderRadius="6px" />
        <SkeletonBlock width="340px" height="14px" borderRadius="4px" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBlock width="110px" height="14px" borderRadius="4px" />
              <SkeletonBlock width="100%" height="42px" borderRadius="10px" />
            </div>
          ))}
          <SkeletonBlock width="130px" height="38px" borderRadius="10px" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
        </div>
      </div>
    </div>
  );
}
