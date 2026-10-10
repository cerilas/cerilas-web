import React from 'react';
import { Compass, Globe, Sparkles } from 'lucide-react';
import FlagIcon from './components/FlagIcon';

export const MARKET_OPTIONS = [
  {
    value: 'auto',
    icon: (
      <div className="aivc-icon-badge">
        <Compass size={13} color="#3b82f6" />
      </div>
    ),
    label: 'Auto-detect (Global)',
    code: 'AUTO',
    desc: 'Inferred automatically via domain TLD and server host'
  },
  {
    value: 'US',
    icon: <FlagIcon code="US" />,
    label: 'United States',
    code: 'US',
    desc: 'Google US live search index & grounding'
  },
  {
    value: 'GB',
    icon: <FlagIcon code="GB" />,
    label: 'United Kingdom',
    code: 'UK',
    desc: 'Google UK live search index'
  },
  {
    value: 'DE',
    icon: <FlagIcon code="DE" />,
    label: 'Germany',
    code: 'DE',
    desc: 'Google Germany localized search index'
  },
  {
    value: 'FR',
    icon: <FlagIcon code="FR" />,
    label: 'France',
    code: 'FR',
    desc: 'Google France localized results'
  },
  {
    value: 'CA',
    icon: <FlagIcon code="CA" />,
    label: 'Canada',
    code: 'CA',
    desc: 'Google Canada search index'
  },
  {
    value: 'AU',
    icon: <FlagIcon code="AU" />,
    label: 'Australia',
    code: 'AU',
    desc: 'Google Australia search index'
  },
  {
    value: 'TR',
    icon: <FlagIcon code="TR" />,
    label: 'Turkey',
    code: 'TR',
    desc: 'Google Turkey localized search index'
  },
  {
    value: 'ES',
    icon: <FlagIcon code="ES" />,
    label: 'Spain',
    code: 'ES',
    desc: 'Google Spain search index & grounding'
  },
  {
    value: 'IT',
    icon: <FlagIcon code="IT" />,
    label: 'Italy',
    code: 'IT',
    desc: 'Google Italy localized search'
  },
  {
    value: 'NL',
    icon: <FlagIcon code="NL" />,
    label: 'Netherlands',
    code: 'NL',
    desc: 'Google Netherlands search index'
  },
  {
    value: 'GLOBAL',
    icon: (
      <div className="aivc-icon-badge emerald">
        <Globe size={13} color="#10b981" />
      </div>
    ),
    label: 'Worldwide / Global',
    code: 'GLOBAL',
    desc: 'Unlocalized global search index'
  }
];

export const LANGUAGE_OPTIONS = [
  {
    value: 'auto',
    icon: (
      <div className="aivc-icon-badge purple">
        <Sparkles size={13} color="#8b5cf6" />
      </div>
    ),
    label: 'Auto-detect',
    code: 'AUTO',
    desc: 'Inferred automatically from website HTML lang'
  },
  {
    value: 'en',
    icon: <FlagIcon code="US" />,
    label: 'English',
    code: 'EN',
    desc: 'Global commercial & informational search'
  },
  {
    value: 'tr',
    icon: <FlagIcon code="TR" />,
    label: 'Turkish',
    code: 'TR',
    desc: 'Natural Turkish search & question patterns'
  },
  {
    value: 'de',
    icon: <FlagIcon code="DE" />,
    label: 'German',
    code: 'DE',
    desc: 'German search queries & market intent'
  },
  {
    value: 'fr',
    icon: <FlagIcon code="FR" />,
    label: 'French',
    code: 'FR',
    desc: 'French search queries & market intent'
  },
  {
    value: 'es',
    icon: <FlagIcon code="ES" />,
    label: 'Spanish',
    code: 'ES',
    desc: 'Spanish search queries & market intent'
  },
  {
    value: 'it',
    icon: <FlagIcon code="IT" />,
    label: 'Italian',
    code: 'IT',
    desc: 'Italian search queries & market intent'
  },
  {
    value: 'nl',
    icon: <FlagIcon code="NL" />,
    label: 'Dutch',
    code: 'NL',
    desc: 'Dutch language queries & intent'
  },
  {
    value: 'pt',
    icon: <FlagIcon code="PT" />,
    label: 'Portuguese',
    code: 'PT',
    desc: 'Portuguese search queries'
  },
  {
    value: 'ar',
    icon: <FlagIcon code="AR" />,
    label: 'Arabic',
    code: 'AR',
    desc: 'Arabic search queries'
  }
];

export function getMarketOption(code) {
  if (!code) return MARKET_OPTIONS[0];
  const upper = String(code).toUpperCase().trim();
  return MARKET_OPTIONS.find(m => m.value.toUpperCase() === upper || m.code === upper) || {
    value: upper,
    label: upper,
    code: upper,
    icon: <FlagIcon code={upper} />
  };
}

export function getLanguageOption(code) {
  if (!code) return LANGUAGE_OPTIONS[0];
  const lower = String(code).toLowerCase().trim();
  return LANGUAGE_OPTIONS.find(l => l.value.toLowerCase() === lower || l.code.toLowerCase() === lower) || {
    value: lower,
    label: lower.toUpperCase(),
    code: lower.toUpperCase(),
    icon: <FlagIcon code={lower.toUpperCase()} />
  };
}
