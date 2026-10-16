/**
 * Enterprise Conversion Metrics System for Cerilas Tools
 * Maps each tool to its genuine conversion action and badge text.
 */

export const TOOL_CONVERSION_METRICS = {

  'eu-funding-opportunities': {
    actionKey: 'explored',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'explored', badge: 'grants explored', singular: 'grant explored', short: 'searches' }
  },

  'arr-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => (tool?.use_count || 0) + (tool?.copy_count || 0),
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' }
  },
  'cac-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => (tool?.use_count || 0) + (tool?.copy_count || 0),
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' }
  },
  'churn-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => (tool?.use_count || 0) + (tool?.copy_count || 0),
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' }
  },
  'ltv-cac-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => (tool?.use_count || 0) + (tool?.copy_count || 0),
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' }
  },
  'ltv-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => (tool?.use_count || 0) + (tool?.copy_count || 0),
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' }
  },
  'mrr-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => (tool?.use_count || 0) + (tool?.copy_count || 0),
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' }
  },
  'startup-runway-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => (tool?.use_count || 0) + (tool?.copy_count || 0),
    en: { action: 'calculated', badge: 'calculations made', singular: 'calculation made', short: 'calculations' }
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
    }
  },
  'pdf-merger': {
    actionKey: 'merged',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.use_count || tool.download_count || 0;
    },
    en: {
      action: 'merged',
      badge: 'PDFs merged',
      singular: 'PDF merged',
      short: 'merged'
    }
  },
  'pdf-splitter': {
    actionKey: 'split',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      return tool.use_count || tool.download_count || 0;
    },
    en: {
      action: 'split',
      badge: 'PDFs split',
      singular: 'PDF split',
      short: 'split'
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
    }
  },
  'token-counter': {
    actionKey: 'counted',
    getConversionCount: (tool) => tool?.use_count || 0,
    en: { action: 'counted', badge: 'texts audited', singular: 'text audited', short: 'audits' }
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
    }
  },
  'sample-size-calculator': {
    actionKey: 'calculated',
    getConversionCount: (tool) => {
      if (!tool) return 0;
      const copies = tool.copy_count || 0;
      const downloads = tool.download_count || 0;
      const uses = tool.use_count || 0;
      return (copies + downloads) > 0 ? (copies + downloads) : uses;
    },
    en: {
      action: 'calculated',
      badge: 'sample sizes calculated',
      singular: 'sample size calculated',
      short: 'calculated'
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
 * Get short 1-word action or noun for tight single-line UI display (e.g., "sessions", "compressed", "QR codes").
 */
export function getShortConversionLabel(slug, lang = 'en') {
  const metric = getToolConversionMetric(slug);
  const locale = metric[lang] || metric.en;
  return locale.short || locale.action || 'used';
}
