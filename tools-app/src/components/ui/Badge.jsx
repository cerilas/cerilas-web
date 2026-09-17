import React from 'react';
import './Badge.css';

export default function Badge({
  children,
  variant = 'neutral', // 'success' | 'purple' | 'blue' | 'warning' | 'danger' | 'neutral'
  icon = null,
  className = ''
}) {
  return (
    <span className={`c-badge c-badge-${variant} ${className}`}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
