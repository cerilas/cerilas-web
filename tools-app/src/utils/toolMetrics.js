/**
 * Enterprise Conversion Metrics System for Cerilas Tools
 * Maps each tool to its genuine conversion action and localized badge text.
 */

export const TOOL_CONVERSION_METRICS = {

  'arr-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' },
    tr: { action: 'hesaplandı', badge: 'hesaplama yapıldı', singular: 'hesaplama yapıldı', short: 'hesaplama' }
  },
  'cac-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' },
    tr: { action: 'hesaplandı', badge: 'hesaplama yapıldı', singular: 'hesaplama yapıldı', short: 'hesaplama' }
  },
  'churn-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' },
    tr: { action: 'hesaplandı', badge: 'hesaplama yapıldı', singular: 'hesaplama yapıldı', short: 'hesaplama' }
  },
  'ltv-cac-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' },
    tr: { action: 'hesaplandı', badge: 'hesaplama yapıldı', singular: 'hesaplama yapıldı', short: 'hesaplama' }
  },
  'ltv-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' },
    tr: { action: 'hesaplandı', badge: 'hesaplama yapıldı', singular: 'hesaplama yapıldı', short: 'hesaplama' }
  },
  'mrr-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' },
    tr: { action: 'hesaplandı', badge: 'hesaplama yapıldı', singular: 'hesaplama yapıldı', short: 'hesaplama' }
  },
  'startup-runway-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' },
    tr: { action: 'hesaplandı', badge: 'hesaplama yapıldı', singular: 'hesaplama yapıldı', short: 'hesaplama' }
  },

  'qr-code-generator': {
    actionKey: 'generated',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const downloads = tool.download_count || 0;
      const copies = tool.copy_count || 0;
      const uses = tool.use_count || 0;
      return (downloads + copies) > 0 ? (downloads + copies) : uses;
    },
    en: {
      action: 'generated',
      badge: 'QR codes generated',
      singular: 'QR code generated',
      short: 'QR codes'
    },
    tr: {
      action: 'oluşturuldu',
      badge: 'QR kod oluşturuldu',
      singular: 'QR kod oluşturuldu',
      short: 'QR kod'
    }
  },
  'image-compressor': {
    actionKey: 'compressed',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.download_count || tool.use_count || 0;
    },
    en: {
      action: 'compressed',
      badge: 'images compressed',
      singular: 'image compressed',
      short: 'compressed'
    },
    tr: {
      action: 'sıkıştırıldı',
      badge: 'görsel sıkıştırıldı',
      singular: 'görsel sıkıştırıldı',
      short: 'sıkıştırma'
    }
  },
  'pomodoro-timer': {
    actionKey: 'completed',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.download_count || tool.use_count || 0;
    },
    en: {
      action: 'completed',
      badge: 'sessions completed',
      singular: 'session completed',
      short: 'sessions'
    },
    tr: {
      action: 'tamamlandı',
      badge: 'seans tamamlandı',
      singular: 'seans tamamlandı',
      short: 'seans'
    }
  },
  'pdf-compressor': {
    actionKey: 'compressed',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.download_count || tool.use_count || 0;
    },
    en: {
      action: 'compressed',
      badge: 'PDFs compressed',
      singular: 'PDF compressed',
      short: 'compressed'
    },
    tr: {
      action: 'sıkıştırıldı',
      badge: 'PDF sıkıştırıldı',
      singular: 'PDF sıkıştırıldı',
      short: 'sıkıştırma'
    }
  },
  'ats-resume-checker': {
    actionKey: 'scanned',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.use_count || 0;
    },
    en: {
      action: 'scanned',
      badge: 'resumes scanned',
      singular: 'resume scanned',
      short: 'scanned'
    },
    tr: {
      action: 'tarandı',
      badge: 'özgeçmiş tarandı',
      singular: 'özgeçmiş tarandı',
      short: 'tarama'
    }
  },
  'background-remover': {
    actionKey: 'removed',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.download_count || tool.use_count || 0;
    },
    en: {
      action: 'removed',
      badge: 'backgrounds removed',
      singular: 'background removed',
      short: 'cutouts'
    },
    tr: {
      action: 'temizlendi',
      badge: 'arka plan temizlendi',
      singular: 'arka plan temizlendi',
      short: 'silindi'
    }
  },
  'pdf-rag-cleaner': {
    actionKey: 'cleaned',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const downloads = tool.download_count || 0;
      const copies = tool.copy_count || 0;
      const uses = tool.use_count || 0;
      return (downloads + copies) > 0 ? (downloads + copies) : uses;
    },
    en: {
      action: 'cleaned',
      badge: 'documents cleaned',
      singular: 'document cleaned',
      short: 'cleaned'
    },
    tr: {
      action: 'temizlendi',
      badge: 'döküman temizlendi',
      singular: 'döküman temizlendi',
      short: 'temizlendi'
    }
  },
  'ai-content-detector': {
    actionKey: 'analyzed',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.use_count || 0;
    },
    en: {
      action: 'analyzed',
      badge: 'texts analyzed',
      singular: 'text analyzed',
      short: 'analyzed'
    },
    tr: {
      action: 'analiz edildi',
      badge: 'metin analiz edildi',
      singular: 'metin analiz edildi',
      short: 'analiz'
    }
  },
  'pdf-editor': {
    actionKey: 'edited',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.download_count || tool.use_count || 0;
    },
    en: {
      action: 'edited',
      badge: 'PDFs edited',
      singular: 'PDF edited',
      short: 'edited'
    },
    tr: {
      action: 'düzenlendi',
      badge: 'PDF düzenlendi',
      singular: 'PDF düzenlendi',
      short: 'düzenleme'
    }
  },
  'video-compressor': {
    actionKey: 'compressed',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.download_count || tool.use_count || 0;
    },
    en: {
      action: 'compressed',
      badge: 'videos compressed',
      singular: 'video compressed',
      short: 'compressed'
    },
    tr: {
      action: 'sıkıştırıldı',
      badge: 'video sıkıştırıldı',
      singular: 'video sıkıştırıldı',
      short: 'sıkıştırma'
    }
  },
  'webhook-tester': {
    actionKey: 'tested',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.use_count || 0;
    },
    en: {
      action: 'tested',
      badge: 'webhooks sent',
      singular: 'webhook sent',
      short: 'sent'
    },
    tr: {
      action: 'gönderildi',
      badge: 'istek gönderildi',
      singular: 'istek gönderildi',
      short: 'istek'
    }
  },
  'json-beautifier': {
    actionKey: 'formatted',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const copies = tool.copy_count || 0;
      const downloads = tool.download_count || 0;
      return tool.use_count || (copies + downloads);
    },
    en: {
      action: 'formatted',
      badge: 'JSONs formatted',
      singular: 'JSON formatted',
      short: 'formatted'
    },
    tr: {
      action: 'formatlandı',
      badge: 'JSON formatlandı',
      singular: 'JSON formatlandı',
      short: 'format'
    }
  },
  'email-signature-generator': {
    actionKey: 'created',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const copies = tool.copy_count || 0;
      const downloads = tool.download_count || 0;
      const uses = tool.use_count || 0;
      return (copies + downloads) > 0 ? (copies + downloads) : uses;
    },
    en: {
      action: 'created',
      badge: 'signatures created',
      singular: 'signature created',
      short: 'signatures'
    },
    tr: {
      action: 'oluşturuldu',
      badge: 'imza oluşturuldu',
      singular: 'imza oluşturuldu',
      short: 'imza'
    }
  },
  'ai-crawler-checker': {
    actionKey: 'checked',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.use_count || 0;
    },
    en: {
      action: 'checked',
      badge: 'websites audited',
      singular: 'website audited',
      short: 'audits'
    },
    tr: {
      action: 'denetlendi',
      badge: 'site denetlendi',
      singular: 'site denetlendi',
      short: 'denetim'
    }
  },
  'ai-link-hallucination-checker': {
    actionKey: 'verified',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.use_count || 0;
    },
    en: {
      action: 'verified',
      badge: 'audits completed',
      singular: 'audit completed',
      short: 'audits'
    },
    tr: {
      action: 'doğrulandı',
      badge: 'metin doğrulandı',
      singular: 'metin doğrulandı',
      short: 'doğrulama'
    }
  },
  'llms-txt': {
    actionKey: 'generated',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const downloads = tool.download_count || 0;
      const copies = tool.copy_count || 0;
      const uses = tool.use_count || 0;
      return (downloads + copies) > 0 ? (downloads + copies) : uses;
    },
    en: {
      action: 'generated',
      badge: 'guides generated',
      singular: 'guide generated',
      short: 'guides'
    },
    tr: {
      action: 'oluşturuldu',
      badge: 'rehber oluşturuldu',
      singular: 'rehber oluşturuldu',
      short: 'rehber'
    }
  },
  'html-to-llm-markdown': {
    actionKey: 'converted',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const downloads = tool.download_count || 0;
      const copies = tool.copy_count || 0;
      const uses = tool.use_count || 0;
      return (downloads + copies) > 0 ? (downloads + copies) : uses;
    },
    en: {
      action: 'converted',
      badge: 'pages converted',
      singular: 'page converted',
      short: 'pages'
    },
    tr: {
      action: 'dönüştürüldü',
      badge: 'sayfa dönüştürüldü',
      singular: 'sayfa dönüştürüldü',
      short: 'sayfa'
    }
  },
  'html-to-markdown': {
    actionKey: 'converted',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const downloads = tool.download_count || 0;
      const copies = tool.copy_count || 0;
      const uses = tool.use_count || 0;
      return (downloads + copies) > 0 ? (downloads + copies) : uses;
    },
    en: {
      action: 'converted',
      badge: 'pages converted',
      singular: 'page converted',
      short: 'pages'
    },
    tr: {
      action: 'dönüştürüldü',
      badge: 'sayfa dönüştürüldü',
      singular: 'sayfa dönüştürüldü',
      short: 'sayfa'
    }
  },
  'token-counter-universal': {
    actionKey: 'counted',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const downloads = tool.download_count || 0;
      const copies = tool.copy_count || 0;
      const uses = tool.use_count || 0;
      return (downloads + copies) > 0 ? (downloads + copies) : uses;
    },
    en: {
      action: 'counted',
      badge: 'texts audited',
      singular: 'text audited',
      short: 'audits'
    },
    tr: {
      action: 'sayıldı',
      badge: 'metin incelendi',
      singular: 'metin incelendi',
      short: 'analiz'
    }
  },
  'token-counter': {
    actionKey: 'counted',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'counted', badge: 'texts audited', singular: 'text audited', short: 'audits' },
    tr: { action: 'sayıldı', badge: 'metin incelendi', singular: 'metin incelendi', short: 'analiz' }
  },
  'trl-calculator': {
    actionKey: 'assessed',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const copies = tool.copy_count || 0;
      const downloads = tool.download_count || 0;
      const uses = tool.use_count || 0;
      return (copies + downloads) > 0 ? (copies + downloads) : uses;
    },
    en: {
      action: 'assessed',
      badge: 'evaluations completed',
      singular: 'evaluation completed',
      short: 'assessments'
    },
    tr: {
      action: 'değerlendirildi',
      badge: 'TRL analizi yapıldı',
      singular: 'TRL analizi yapıldı',
      short: 'analiz'
    }
  }
};

/**
 * Get the conversion metric definition for a tool slug.
 */
export function getToolConversionMetric(slug) {
  if (slug && TOOL_CONVERSION_METRICS[slug]) {
    return TOOL_CONVERSION_METRICS[slug];
  }
  return {
    actionKey: 'used',
    getConversionCount: (tool) => tool?.use_count || tool?.download_count || 0,
    en: {
      action: 'used',
      badge: 'times used',
      singular: 'time used',
      short: 'used'
    },
    tr: {
      action: 'kullanıldı',
      badge: 'kez kullanıldı',
      singular: 'kez kullanıldı',
      short: 'kullanım'
    }
  };
}

/**
 * Get conversion count for a tool object.
 */
export function getConversionCount(tool) {
  if (!tool) return 0;
  const metric = getToolConversionMetric(tool.slug);
  return metric.getConversionCount(tool);
}

/**
 * Get formatted conversion badge string (e.g., "14 images compressed", "117 QR codes generated").
 */
export function getConversionLabel(slug, count, lang = 'en') {
  const metric = getToolConversionMetric(slug);
  const locale = metric[lang] || metric.en;
  return count === 1 ? locale.singular : locale.badge;
}

/**
 * Get short 1-word action or noun for tight single-line UI display (e.g., "sessions", "compressed", "QR kod").
 */
export function getShortConversionLabel(slug, lang = 'en') {
  const metric = getToolConversionMetric(slug);
  const locale = metric[lang] || metric.en;
  return locale.short || locale.action || 'used';
}
