import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const GAP = 14;
const VIEWPORT_MARGIN = 8;

/**
 * Chart hover card rendered in a body portal with fixed positioning, so it is never clipped by
 * cards with overflow: hidden. Opens above the point and flips below when there is no room;
 * horizontally it is clamped to the viewport.
 */
export default function GrowthChartTooltip({ anchorRef, xPercent, yPercent, accent = '#38bdf8', children }) {
  const tooltipRef = useRef(null);
  const [layout, setLayout] = useState(null);

  useLayoutEffect(() => {
    const compute = () => {
      const anchor = anchorRef?.current;
      const tip = tooltipRef.current;
      if (!anchor || !tip) return;

      const rect = anchor.getBoundingClientRect();
      const pointX = rect.left + (xPercent / 100) * rect.width;
      const pointY = rect.top + (yPercent / 100) * rect.height;
      const { offsetWidth: w, offsetHeight: h } = tip;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const placeBelow = pointY - GAP - h < VIEWPORT_MARGIN && pointY + GAP + h <= vh - VIEWPORT_MARGIN;
      const top = placeBelow ? pointY + GAP : pointY - GAP - h;
      const left = Math.min(Math.max(pointX - w / 2, VIEWPORT_MARGIN), vw - w - VIEWPORT_MARGIN);
      const arrowLeft = Math.min(Math.max(pointX - left, 16), w - 16);

      setLayout({ top, left, arrowLeft, placement: placeBelow ? 'below' : 'above' });
    };

    compute();
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [anchorRef, xPercent, yPercent]);

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      className={`gtt-card gtt-${layout?.placement || 'above'}`}
      style={{
        top: layout ? `${layout.top}px` : '-9999px',
        left: layout ? `${layout.left}px` : '-9999px',
        visibility: layout ? 'visible' : 'hidden',
        '--gtt-accent': accent,
        '--gtt-arrow-left': layout ? `${layout.arrowLeft}px` : '50%'
      }}
    >
      {children}
      <span className="gtt-arrow" aria-hidden="true" />
    </div>,
    document.body
  );
}
