import React from 'react';

/**
 * Modern Vector Flag Icons for Country & Language Selection
 * Features: High-precision SVG vectors, consistent 20x14 aspect ratio, subtle border & shadow.
 */
export default function FlagIcon({ code, className = '' }) {
  const normCode = (code || '').toUpperCase().trim();

  // Helper wrapper to give every flag uniform rounded corners and micro-shadow
  const wrap = (content) => (
    <svg
      viewBox="0 0 24 16"
      width="20"
      height="14"
      className={`aivc-flag-icon ${className}`}
      aria-hidden="true"
      style={{
        borderRadius: '3px',
        overflow: 'hidden',
        display: 'inline-block',
        verticalAlign: 'middle',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        flexShrink: 0
      }}
    >
      {content}
    </svg>
  );

  switch (normCode) {
    // 1. Turkey (TR)
    case 'TR':
      return wrap(
        <g>
          <rect width="24" height="16" fill="#E30A17" />
          <circle cx="8.8" cy="8" r="4.2" fill="#FFFFFF" />
          <circle cx="10" cy="8" r="3.36" fill="#E30A17" />
          <polygon
            points="13.2,8 11.8,6.8 12.3,8.5 11,9.4 12.6,9.4"
            fill="#FFFFFF"
            transform="rotate(-15 12.4 8)"
          />
        </g>
      );

    // 2. United States (US / EN)
    case 'US':
    case 'EN':
      return wrap(
        <g>
          <rect width="24" height="16" fill="#FFFFFF" />
          {/* 7 Red stripes */}
          <rect y="0" width="24" height="1.23" fill="#B22234" />
          <rect y="2.46" width="24" height="1.23" fill="#B22234" />
          <rect y="4.92" width="24" height="1.23" fill="#B22234" />
          <rect y="7.38" width="24" height="1.23" fill="#B22234" />
          <rect y="9.84" width="24" height="1.23" fill="#B22234" />
          <rect y="12.3" width="24" height="1.23" fill="#B22234" />
          <rect y="14.77" width="24" height="1.23" fill="#B22234" />
          {/* Blue canton */}
          <rect width="10" height="8.61" fill="#3C3B6E" />
          {/* Star grid dots */}
          <circle cx="2" cy="1.8" r="0.6" fill="#FFFFFF" />
          <circle cx="5" cy="1.8" r="0.6" fill="#FFFFFF" />
          <circle cx="8" cy="1.8" r="0.6" fill="#FFFFFF" />
          <circle cx="3.5" cy="3.5" r="0.6" fill="#FFFFFF" />
          <circle cx="6.5" cy="3.5" r="0.6" fill="#FFFFFF" />
          <circle cx="2" cy="5.2" r="0.6" fill="#FFFFFF" />
          <circle cx="5" cy="5.2" r="0.6" fill="#FFFFFF" />
          <circle cx="8" cy="5.2" r="0.6" fill="#FFFFFF" />
          <circle cx="3.5" cy="6.9" r="0.6" fill="#FFFFFF" />
          <circle cx="6.5" cy="6.9" r="0.6" fill="#FFFFFF" />
        </g>
      );

    // 3. United Kingdom (GB / UK)
    case 'GB':
    case 'UK':
      return wrap(
        <g>
          <rect width="24" height="16" fill="#012169" />
          {/* Diagonal saltire white */}
          <line x1="0" y1="0" x2="24" y2="16" stroke="#FFFFFF" strokeWidth="3" />
          <line x1="24" y1="0" x2="0" y2="16" stroke="#FFFFFF" strokeWidth="3" />
          {/* Diagonal saltire red */}
          <line x1="0" y1="0" x2="24" y2="16" stroke="#C8102E" strokeWidth="1.2" />
          <line x1="24" y1="0" x2="0" y2="16" stroke="#C8102E" strokeWidth="1.2" />
          {/* Cross white */}
          <rect x="9.5" width="5" height="16" fill="#FFFFFF" />
          <rect y="5.5" width="24" height="5" fill="#FFFFFF" />
          {/* Cross red */}
          <rect x="10.5" width="3" height="16" fill="#C8102E" />
          <rect y="6.5" width="24" height="3" fill="#C8102E" />
        </g>
      );

    // 4. Germany (DE)
    case 'DE':
      return wrap(
        <g>
          <rect y="0" width="24" height="5.33" fill="#000000" />
          <rect y="5.33" width="24" height="5.34" fill="#DD0000" />
          <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
        </g>
      );

    // 5. France (FR)
    case 'FR':
      return wrap(
        <g>
          <rect x="0" width="8" height="16" fill="#002654" />
          <rect x="8" width="8" height="16" fill="#FFFFFF" />
          <rect x="16" width="8" height="16" fill="#CE1126" />
        </g>
      );

    // 6. Canada (CA)
    case 'CA':
      return wrap(
        <g>
          <rect width="24" height="16" fill="#FF0000" />
          <rect x="6" width="12" height="16" fill="#FFFFFF" />
          {/* Maple leaf silhouette */}
          <path
            d="M12 3.5 L12.8 6 L14.5 5.5 L13.8 7.2 L15.5 8 L13.5 9 L13.2 10.5 L12.3 9.8 L12.3 12.5 L11.7 12.5 L11.7 9.8 L10.8 10.5 L10.5 9 L8.5 8 L10.2 7.2 L9.5 5.5 L11.2 6 Z"
            fill="#FF0000"
          />
        </g>
      );

    // 7. Australia (AU)
    case 'AU':
      return wrap(
        <g>
          <rect width="24" height="16" fill="#00008B" />
          {/* Mini Union Jack in canton */}
          <g>
            <rect width="11" height="8" fill="#012169" />
            <line x1="0" y1="0" x2="11" y2="8" stroke="#FFFFFF" strokeWidth="1.6" />
            <line x1="11" y1="0" x2="0" y2="8" stroke="#FFFFFF" strokeWidth="1.6" />
            <line x1="0" y1="0" x2="11" y2="8" stroke="#C8102E" strokeWidth="0.8" />
            <line x1="11" y1="0" x2="0" y2="8" stroke="#C8102E" strokeWidth="0.8" />
            <rect x="4.5" width="2" height="8" fill="#FFFFFF" />
            <rect y="3" width="11" height="2" fill="#FFFFFF" />
            <rect x="5" width="1" height="8" fill="#C8102E" />
            <rect y="3.5" width="11" height="1" fill="#C8102E" />
          </g>
          {/* Commonwealth Star */}
          <polygon points="5.5,10 6.2,12 8,12 6.5,13 7.2,15 5.5,13.8 3.8,15 4.5,13 3,12 4.8,12" fill="#FFFFFF" transform="scale(0.8) translate(1.5, 0.5)" />
          {/* Southern cross dots */}
          <circle cx="18" cy="3" r="0.7" fill="#FFFFFF" />
          <circle cx="15.5" cy="7" r="0.7" fill="#FFFFFF" />
          <circle cx="20.5" cy="6" r="0.7" fill="#FFFFFF" />
          <circle cx="18" cy="11" r="0.7" fill="#FFFFFF" />
          <circle cx="19.2" cy="8.2" r="0.5" fill="#FFFFFF" />
        </g>
      );

    // 8. Spain (ES)
    case 'ES':
      return wrap(
        <g>
          <rect y="0" width="24" height="4" fill="#AA151B" />
          <rect y="4" width="24" height="8" fill="#F1BF00" />
          <rect y="12" width="24" height="4" fill="#AA151B" />
          {/* Coat of arms silhouette */}
          <rect x="5.5" y="6" width="3" height="4" rx="0.5" fill="#AA151B" />
          <circle cx="7" cy="5.2" r="1" fill="#AA151B" />
          <rect x="6.2" y="6.8" width="1.6" height="2.4" fill="#F1BF00" />
        </g>
      );

    // 9. Italy (IT)
    case 'IT':
      return wrap(
        <g>
          <rect x="0" width="8" height="16" fill="#009246" />
          <rect x="8" width="8" height="16" fill="#FFFFFF" />
          <rect x="16" width="8" height="16" fill="#CE2B37" />
        </g>
      );

    // 10. Netherlands (NL)
    case 'NL':
      return wrap(
        <g>
          <rect y="0" width="24" height="5.33" fill="#AE1C28" />
          <rect y="5.33" width="24" height="5.34" fill="#FFFFFF" />
          <rect y="10.67" width="24" height="5.33" fill="#21468B" />
        </g>
      );

    // 11. Portugal (PT)
    case 'PT':
      return wrap(
        <g>
          <rect x="0" width="9.6" height="16" fill="#046A38" />
          <rect x="9.6" width="14.4" height="16" fill="#DA291C" />
          {/* Armillary sphere and shield */}
          <circle cx="9.6" cy="8" r="3.2" fill="#FFC400" />
          <rect x="8.4" y="6.8" width="2.4" height="2.4" rx="0.3" fill="#FFFFFF" />
          <rect x="8.7" y="7.1" width="1.8" height="1.8" fill="#002654" />
        </g>
      );

    // 12. Arabic / Saudi Arabia (AR / SA)
    case 'AR':
    case 'SA':
      return wrap(
        <g>
          <rect width="24" height="16" fill="#006C35" />
          {/* Arabic Calligraphy & Sword Representation */}
          <path d="M5 6.5 Q8 5 12 6.5 Q16 5 19 6.5 Q16 7.5 12 7 Q8 7.5 5 6.5 Z" fill="#FFFFFF" />
          <rect x="6" y="9.5" width="12" height="0.8" rx="0.4" fill="#FFFFFF" />
          <polygon points="18,9.9 16.5,8.8 16.5,11" fill="#FFFFFF" />
          <rect x="7" y="8.8" width="0.8" height="2.2" rx="0.3" fill="#FFFFFF" />
        </g>
      );

    default:
      return wrap(
        <g>
          <rect width="24" height="16" fill="rgba(150,150,150,0.15)" />
          <text
            x="12"
            y="11"
            textAnchor="middle"
            fill="currentColor"
            fontSize="7"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {normCode.slice(0, 2)}
          </text>
        </g>
      );
  }
}
