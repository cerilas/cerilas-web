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
    label: 'Otomatik Tespit (Auto)',
    code: 'AUTO',
    desc: 'Alan adı uzantısı ve sunucuya göre algılanır'
  },
  {
    value: 'TR',
    icon: <FlagIcon code="TR" />,
    label: 'Türkiye (Turkey)',
    code: 'TR',
    desc: 'Google Türkiye yerelleştirilmiş arama dizini'
  },
  {
    value: 'US',
    icon: <FlagIcon code="US" />,
    label: 'Amerika Birleşik Devletleri',
    code: 'US',
    desc: 'Google US canlı arama dizini & grounding'
  },
  {
    value: 'GB',
    icon: <FlagIcon code="GB" />,
    label: 'Birleşik Krallık (UK)',
    code: 'UK',
    desc: 'Google UK canlı arama dizini'
  },
  {
    value: 'DE',
    icon: <FlagIcon code="DE" />,
    label: 'Almanya (Deutschland)',
    code: 'DE',
    desc: 'Google Deutschland arama dizini'
  },
  {
    value: 'FR',
    icon: <FlagIcon code="FR" />,
    label: 'Fransa (France)',
    code: 'FR',
    desc: 'Google France yerelleştirilmiş sonuçlar'
  },
  {
    value: 'CA',
    icon: <FlagIcon code="CA" />,
    label: 'Kanada (Canada)',
    code: 'CA',
    desc: 'Google Canada arama dizini'
  },
  {
    value: 'AU',
    icon: <FlagIcon code="AU" />,
    label: 'Avustralya (Australia)',
    code: 'AU',
    desc: 'Google Australia arama dizini'
  },
  {
    value: 'ES',
    icon: <FlagIcon code="ES" />,
    label: 'İspanya (España)',
    code: 'ES',
    desc: 'Google España arama grounding'
  },
  {
    value: 'IT',
    icon: <FlagIcon code="IT" />,
    label: 'İtalya (Italia)',
    code: 'IT',
    desc: 'Google Italia yerel arama'
  },
  {
    value: 'NL',
    icon: <FlagIcon code="NL" />,
    label: 'Hollanda (Nederland)',
    code: 'NL',
    desc: 'Google Nederland arama dizini'
  },
  {
    value: 'GLOBAL',
    icon: (
      <div className="aivc-icon-badge emerald">
        <Globe size={13} color="#10b981" />
      </div>
    ),
    label: 'Global / Dünya Geneli',
    code: 'GLOBAL',
    desc: 'Yerelleştirilmemiş küresel arama dizini'
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
    label: 'Otomatik Tespit (Auto)',
    code: 'AUTO',
    desc: 'Web sitesi HTML diline göre algılanır'
  },
  {
    value: 'tr',
    icon: <FlagIcon code="TR" />,
    label: 'Türkçe (Turkish)',
    code: 'TR',
    desc: 'Doğal Türkçe arama ve soru kalıpları'
  },
  {
    value: 'en',
    icon: <FlagIcon code="US" />,
    label: 'İngilizce (English)',
    code: 'EN',
    desc: 'Küresel ticari ve bilgi aramaları'
  },
  {
    value: 'de',
    icon: <FlagIcon code="DE" />,
    label: 'Almanca (Deutsch)',
    code: 'DE',
    desc: 'Almanca sorgular ve pazar aramaları'
  },
  {
    value: 'fr',
    icon: <FlagIcon code="FR" />,
    label: 'Fransızca (Français)',
    code: 'FR',
    desc: 'Fransızca sorgular ve pazar aramaları'
  },
  {
    value: 'es',
    icon: <FlagIcon code="ES" />,
    label: 'İspanyolca (Español)',
    code: 'ES',
    desc: 'İspanyolca sorgular ve pazar aramaları'
  },
  {
    value: 'it',
    icon: <FlagIcon code="IT" />,
    label: 'İtalyanca (Italiano)',
    code: 'IT',
    desc: 'İtalyanca sorgular ve pazar aramaları'
  },
  {
    value: 'nl',
    icon: <FlagIcon code="NL" />,
    label: 'Felemenkçe (Nederlands)',
    code: 'NL',
    desc: 'Hollanda dili sorgular'
  },
  {
    value: 'pt',
    icon: <FlagIcon code="PT" />,
    label: 'Portekizce (Português)',
    code: 'PT',
    desc: 'Portekizce arama sorguları'
  },
  {
    value: 'ar',
    icon: <FlagIcon code="AR" />,
    label: 'Arapça (العربية)',
    code: 'AR',
    desc: 'Arapça arama sorguları'
  }
];

export function getMarketOption(code) {
  if (!code) return MARKET_OPTIONS[1]; // default TR
  const upper = String(code).toUpperCase().trim();
  return MARKET_OPTIONS.find(m => m.value.toUpperCase() === upper || m.code === upper) || {
    value: upper,
    label: upper,
    code: upper,
    icon: <FlagIcon code={upper} />
  };
}

export function getLanguageOption(code) {
  if (!code) return LANGUAGE_OPTIONS[1]; // default tr
  const lower = String(code).toLowerCase().trim();
  return LANGUAGE_OPTIONS.find(l => l.value.toLowerCase() === lower || l.code.toLowerCase() === lower) || {
    value: lower,
    label: lower.toUpperCase(),
    code: lower.toUpperCase(),
    icon: <FlagIcon code={lower.toUpperCase()} />
  };
}
