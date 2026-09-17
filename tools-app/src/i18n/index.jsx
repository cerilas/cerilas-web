import React, { createContext, useContext, useState, useMemo } from 'react';
import { translations } from './translations';

const I18nContext = createContext(null);

export function I18nProvider({ children, initialLanguage = 'en' }) {
  const [language, setLanguage] = useState(initialLanguage);

  const t = useMemo(() => {
    return (path, params = {}) => {
      const keys = path.split('.');
      const currentDict = translations[language] || translations.en;
      let value = keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), currentDict);

      // Fallback to English if missing in current language
      if (value === undefined && language !== 'en') {
        value = keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), translations.en);
      }

      if (typeof value !== 'string') {
        return path;
      }

      // Parameter replacement: {name} -> value
      return value.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
    };
  }, [language]);

  const availableLanguages = Object.keys(translations);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    availableLanguages,
    t
  }), [language, t, availableLanguages]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
