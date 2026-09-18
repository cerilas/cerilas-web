import React, { useEffect, useRef } from 'react';
import './AdSlot.css';

/**
 * Google AdSense Ad Slot Component.
 * Implements standard IAB/Google ad unit dimensions with responsive auto sizing.
 *
 * Formats:
 * - 'leaderboard': Leaderboard Banner (auto responsive)
 * - 'billboard': Billboard / Super Leaderboard
 * - 'rectangle': Medium Rectangle
 * - 'horizontal': Fluid In-Content Banner
 */
export default function AdSlot({ 
  format = 'leaderboard', 
  slotId,
  adClient = 'ca-pub-9892289069070642',
  style = {},
  className = ''
}) {
  const adRef = useRef(null);

  // Default to user's Leaderboard Banners unit (3592000841) if slotId is not numeric
  const effectiveSlotId = (slotId && /^\d+$/.test(slotId)) ? slotId : '3592000841';
  const effectiveAdClient = (adClient && adClient.startsWith('ca-pub-') && !adClient.includes('X'))
    ? adClient
    : 'ca-pub-9892289069070642';

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && adRef.current) {
        // Prevent duplicate push if AdSense already loaded/processed this ins element
        const isProcessed = adRef.current.getAttribute('data-adsbygoogle-status');
        if (!isProcessed) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      }
    } catch (err) {
      console.warn('AdSense push error for slot:', effectiveSlotId, err);
    }
  }, [effectiveSlotId]);

  const getFormatClass = () => {
    switch (format) {
      case 'rectangle':
        return 'ad-slot-rectangle';
      case 'billboard':
        return 'ad-slot-billboard';
      case 'horizontal':
        return 'ad-slot-horizontal';
      case 'leaderboard':
      default:
        return 'ad-slot-leaderboard';
    }
  };

  return (
    <div 
      className={`ad-slot-wrapper ${getFormatClass()} ${className}`}
      style={style}
      aria-label="Advertisement Space"
    >
      <ins 
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', textAlign: 'center' }}
        data-ad-client={effectiveAdClient}
        data-ad-slot={effectiveSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
