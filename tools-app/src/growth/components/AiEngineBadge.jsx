import React from 'react';

const ENGINE_CONFIG = {
  gemini: {
    name: 'Google Gemini',
    shortName: 'Gemini',
    icon: '/AI-logos/gemini-color.svg',
    color: '#1a73e8',
    bg: 'rgba(26, 115, 232, 0.12)',
    border: 'rgba(26, 115, 232, 0.25)'
  },
  chatgpt: {
    name: 'ChatGPT Search',
    shortName: 'ChatGPT',
    icon: '/AI-logos/chatgpt-black.svg',
    color: '#10a37f',
    bg: 'rgba(16, 163, 127, 0.12)',
    border: 'rgba(16, 163, 127, 0.25)',
    filter: 'brightness(1.8)'
  },
  perplexity: {
    name: 'Perplexity AI',
    shortName: 'Perplexity',
    icon: '/AI-logos/perplexity-color.svg',
    color: '#20b2aa',
    bg: 'rgba(32, 178, 170, 0.12)',
    border: 'rgba(32, 178, 170, 0.25)'
  },
  claude: {
    name: 'Claude 3.5 Sonnet',
    shortName: 'Claude',
    icon: '/AI-logos/claude-color.svg',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.25)'
  },
  grok: {
    name: 'xAI Grok',
    shortName: 'Grok',
    icon: '/AI-logos/grok-black.svg',
    color: '#ffffff',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.2)',
    filter: 'brightness(2)'
  }
};

export default function AiEngineBadge({ 
  engine = 'gemini', 
  size = 18, 
  showLabel = true, 
  pill = false,
  short = false,
  className = '',
  style = {} 
}) {
  const key = String(engine).toLowerCase();
  let conf = ENGINE_CONFIG[key];
  if (!conf) {
    if (key.includes('gemini')) conf = ENGINE_CONFIG.gemini;
    else if (key.includes('gpt') || key.includes('chat') || key.includes('openai')) conf = ENGINE_CONFIG.chatgpt;
    else if (key.includes('perp')) conf = ENGINE_CONFIG.perplexity;
    else if (key.includes('claude')) conf = ENGINE_CONFIG.claude;
    else if (key.includes('grok')) conf = ENGINE_CONFIG.grok;
    else conf = ENGINE_CONFIG.gemini;
  }

  if (pill) {
    return (
      <span 
        className={`growth-ai-engine-pill ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '8px',
          background: conf.bg,
          border: `1px solid ${conf.border}`,
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#f1f5f9',
          ...style
        }}
      >
        <img 
          src={conf.icon} 
          alt={conf.name} 
          style={{ 
            width: size, 
            height: size, 
            objectFit: 'contain', 
            filter: conf.filter || 'none' 
          }} 
        />
        {showLabel && <span>{short ? conf.shortName : conf.name}</span>}
      </span>
    );
  }

  return (
    <span 
      className={`growth-ai-engine-inline ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        ...style
      }}
    >
      <img 
        src={conf.icon} 
        alt={conf.name} 
        style={{ 
          width: size, 
          height: size, 
          objectFit: 'contain', 
          filter: conf.filter || 'none' 
        }} 
      />
      {showLabel && <span>{short ? conf.shortName : conf.name}</span>}
    </span>
  );
}

export function AiEngineGroup({ size = 20, style = {} }) {
  const engines = ['gemini', 'chatgpt', 'perplexity', 'claude'];
  return (
    <div 
      className="growth-ai-engine-group" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '0.3rem 0.65rem',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        ...style 
      }}
    >
      {engines.map((e) => (
        <img 
          key={e}
          src={ENGINE_CONFIG[e].icon}
          alt={ENGINE_CONFIG[e].name}
          title={ENGINE_CONFIG[e].name}
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
            filter: ENGINE_CONFIG[e].filter || 'none'
          }}
        />
      ))}
      <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '0.2rem', fontWeight: 500 }}>
        Canlı GEO Taraması
      </span>
    </div>
  );
}
