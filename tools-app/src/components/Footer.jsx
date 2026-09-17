import React from 'react';
import { useTranslation } from '../i18n';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="https://cerilas.com" target="_blank" rel="noopener noreferrer">
            {t('footer.mainSite')}
          </a>
          <a href="#/">{t('footer.allTools')}</a>
          <a href="https://cerilas.com/#contact" target="_blank" rel="noopener noreferrer">
            {t('footer.support')}
          </a>
        </div>
        <p>{t('footer.copyright', { year: currentYear })}</p>
      </div>
    </footer>
  );
}
