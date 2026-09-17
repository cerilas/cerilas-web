import React from 'react';
import './Card.css';

export default function Card({
  children,
  title = null,
  subtitle = null,
  headerAction = null,
  size = 'md', // 'sm' | 'md'
  className = '',
  style = {},
  ...props
}) {
  return (
    <div className={`c-panel c-panel-${size} ${className}`} style={style} {...props}>
      {(title || headerAction) && (
        <div className="c-panel-header">
          <div>
            {title && <h3 className="c-panel-title">{title}</h3>}
            {subtitle && <p className="c-panel-subtitle">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
