import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo - Purple
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Blue - Cyan
  'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald - Teal
  'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', // Amber - Orange
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', // Pink - Rose
  'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', // Violet - Fuchsia
  'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', // Sky - Blue
  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', // Teal - Emerald
];

function getGradient(str) {
  if (!str) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

/**
 * GrowthFavicon
 * Renders brand favicon if available. If missing or fails to load,
 * automatically falls back to a modern, customized default placeholder badge.
 */
export default function GrowthFavicon({ 
  src, 
  domain, 
  name, 
  size = 22, 
  className = '',
  style = {},
  variant = 'letter' // 'letter' | 'globe'
}) {
  const cleanDomain = (domain || '')
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .trim();

  const [hasError, setHasError] = useState(!src);

  // If src changes, reset error state
  useEffect(() => {
    setHasError(!src);
  }, [src, cleanDomain]);

  // If a valid src is present and hasn't errored out, render image
  if (src && !hasError) {
    return (
      <img
        src={src}
        alt=""
        className={`growth-favicon-img ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(4, Math.round(size * 0.25)),
          objectFit: 'contain',
          flexShrink: 0,
          ...style
        }}
        onError={() => setHasError(true)}
      />
    );
  }

  // DEFAULT PLACEHOLDER: Modern initial letter or globe badge
  const displayName = (name || cleanDomain || '').trim();
  const letter = displayName.charAt(0).toUpperCase();
  const gradient = getGradient(cleanDomain || name);

  return (
    <div
      className={`growth-favicon-placeholder ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: Math.max(4, Math.round(size * 0.25)),
        background: gradient,
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.max(10, Math.round(size * 0.54)),
        lineHeight: 1,
        textTransform: 'uppercase',
        flexShrink: 0,
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.28), 0 1px 2px rgba(0, 0, 0, 0.12)',
        userSelect: 'none',
        letterSpacing: '-0.02em',
        ...style
      }}
      title={name || cleanDomain || 'Brand'}
    >
      {letter && variant !== 'globe' ? (
        letter
      ) : (
        <Globe size={Math.max(10, Math.round(size * 0.6))} strokeWidth={2.2} />
      )}
    </div>
  );
}
