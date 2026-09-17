import React from 'react';
import { Layers } from 'lucide-react';
import './AdSlot.css';

/**
 * Google AdSense Ready Ad Slot Component.
 * Implements standard IAB/Google ad unit dimensions with zero layout shift (CLS).
 *
 * Formats:
 * - 'leaderboard': 728x90 desktop / 320x50 or 320x100 mobile
 * - 'rectangle': 300x250 Medium Rectangle
 * - 'billboard': 970x250 or 970x90 Large Billboard
 * - 'horizontal': Responsive fluid banner (auto)
 */
export default function AdSlot({ 
  format = 'leaderboard', 
  slotId = 'placeholder-slot',
  adClient = 'ca-pub-XXXXXXXXXXXXXXXX',
  style = {},
  className = ''
}) {
  const getFormatDetails = () => {
    switch (format) {
      case 'rectangle':
        return {
          title: '300 × 250 Medium Rectangle',
          dimensions: '300px × 250px',
          cssClass: 'ad-slot-rectangle'
        };
      case 'billboard':
        return {
          title: '970 × 250 Billboard / Super Leaderboard',
          dimensions: '970px × 250px (Mobile 320×100)',
          cssClass: 'ad-slot-billboard'
        };
      case 'horizontal':
        return {
          title: 'Responsive Fluid In-Content Ad',
          dimensions: '100% × Auto',
          cssClass: 'ad-slot-horizontal'
        };
      case 'leaderboard':
      default:
        return {
          title: '728 × 90 Leaderboard Banner',
          dimensions: '728px × 90px (Mobile 320×50)',
          cssClass: 'ad-slot-leaderboard'
        };
    }
  };

  const details = getFormatDetails();

  return (
    <div 
      className={`ad-slot-wrapper ${details.cssClass} ${className}`}
      style={style}
      aria-label="Advertisement Space"
    >
      {/* Ready for Google AdSense Script insertion */}
      {/* 
        <ins 
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adClient}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      */}

      {/* Elegant Apple-Minimalist Placeholder Container */}
      <div className="ad-slot-inner">
        <div className="ad-slot-badge">
          <Layers size={12} />
          <span>Advertisement</span>
        </div>
        <div className="ad-slot-info">
          <span className="ad-slot-size">{details.title}</span>
          <span className="ad-slot-sub">Google AdSense Ready • Reserved Space</span>
        </div>
      </div>
    </div>
  );
}
