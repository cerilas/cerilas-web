import React, { useEffect, useRef } from 'react';
import './AdSlot.css';

/**
 * Google AdSense Ad Slot Component.
 * Supports standard Leaderboard banners and Vertical Multiplex autorelaxed units.
 *
 * Formats:
 * - 'leaderboard': Leaderboard Banner (auto responsive, slot 3592000841)
 * - 'billboard': Large Billboard Banner (slot 3592000841)
 * - 'multiplex': Vertical Multiplex Matched Content (autorelaxed, slot 2582171503)
 * - 'rectangle': Vertical / Medium Rectangle (slot 2582171503)
 * - 'horizontal': Fluid In-Content Banner (slot 3592000841)
 */
export default function AdSlot({ 
  format = 'leaderboard', 
  slotId,
  adClient = 'ca-pub-9892289069070642',
  style = {},
  className = ''
}) {
  const adRef = useRef(null);

  const isMultiplex = 
    format === 'multiplex' || 
    format === 'vertical-multiplex' || 
    format === 'vertical' || 
    format === 'rectangle' || 
    slotId === '2582171503';

  // Effective slot ID: 2582171503 for multiplex/vertical, 3592000841 for leaderboard/billboard
  const effectiveSlotId = (slotId && /^\d+$/.test(slotId))
    ? slotId
    : (isMultiplex ? '2582171503' : '3592000841');

  const effectiveAdFormat = isMultiplex ? 'autorelaxed' : 'auto';

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
      case 'multiplex':
      case 'vertical-multiplex':
      case 'vertical':
        return 'ad-slot-multiplex';
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
        data-ad-format={effectiveAdFormat}
        {...(!isMultiplex ? { 'data-full-width-responsive': 'true' } : {})}
      />
    </div>
  );
}
