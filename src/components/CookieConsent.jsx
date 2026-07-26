import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { usePublicTheme } from '../context/publicTheme';

const STORAGE_KEY = 'cerilas_cookie_consent';

const copy = {
  tr: {
    title: 'Çerez tercihleri',
    text: 'Deneyimi iyileştirmek ve site performansını ölçmek için zorunlu çerezlere ek olarak analitik çerezleri kullanabiliriz.',
    necessary: 'Zorunlu',
    necessaryDesc: 'Güvenlik, oturum ve temel site işlevleri için gereklidir.',
    analytics: 'Analitik',
    analyticsDesc: 'Ziyaretleri anonimleştirilmiş ölçüm verileriyle anlamamıza yardımcı olur.',
    manage: 'Tercihleri yönet',
    reject: 'Sadece zorunlu',
    accept: 'Tümünü kabul et',
    save: 'Tercihleri kaydet',
    privacy: 'Gizlilik politikası',
  },
  en: {
    title: 'Cookie preferences',
    text: 'We may use analytics cookies in addition to essential cookies to improve the experience and measure site performance.',
    necessary: 'Essential',
    necessaryDesc: 'Required for security, sessions, and core website functionality.',
    analytics: 'Analytics',
    analyticsDesc: 'Helps us understand visits through aggregated measurement data.',
    manage: 'Manage preferences',
    reject: 'Essential only',
    accept: 'Accept all',
    save: 'Save preferences',
    privacy: 'Privacy policy',
  },
};

function updateGoogleConsent(analytics) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
  window.gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

export default function CookieConsent() {
  const location = useLocation();
  const { lang, localizedPath } = useLang();
  const { resolvedTheme } = usePublicTheme();
  const t = copy[lang] || copy.tr;
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
        return;
      }
      const preference = JSON.parse(stored);
      const analyticsEnabled = Boolean(preference.analytics);
      setAnalytics(analyticsEnabled);
      updateGoogleConsent(analyticsEnabled);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible || location.pathname.startsWith('/admin')) return null;

  const savePreference = (analyticsEnabled) => {
    const preference = {
      necessary: true,
      analytics: analyticsEnabled,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    setAnalytics(analyticsEnabled);
    updateGoogleConsent(analyticsEnabled);
    window.dispatchEvent(new CustomEvent('cerilas-cookie-consent', { detail: preference }));
    setVisible(false);
  };

  return (
    <div className={`public-theme-${resolvedTheme} fixed inset-x-0 bottom-0 z-[80] p-3 sm:p-5 pointer-events-none`}>
      <div className="pointer-events-auto mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-gray-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
              <h2 className="text-sm font-semibold text-white">{t.title}</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">{t.text}</p>
            <Link
              to={localizedPath('/legal/privacy')}
              className="mt-2 inline-flex text-xs font-medium text-cyan-300 hover:text-cyan-200"
            >
              {t.privacy}
            </Link>

            {expanded && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-800 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{t.necessary}</div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{t.necessaryDesc}</p>
                    </div>
                    <span className="rounded-full bg-gray-800 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      Always on
                    </span>
                  </div>
                </div>

                <label className="cursor-pointer rounded-xl border border-gray-800 bg-white/[0.03] p-3 transition-colors hover:border-cyan-500/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{t.analytics}</div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{t.analyticsDesc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnalytics((value) => !value)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${analytics ? 'bg-cyan-400' : 'bg-gray-700'}`}
                      aria-pressed={analytics}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${analytics ? 'translate-x-5' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:min-w-44">
            <button
              type="button"
              onClick={() => savePreference(true)}
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-cyan-300"
            >
              {t.accept}
            </button>
            <button
              type="button"
              onClick={() => expanded ? savePreference(analytics) : setExpanded(true)}
              className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:border-gray-500 hover:bg-white/5"
            >
              {expanded ? t.save : t.manage}
            </button>
            <button
              type="button"
              onClick={() => savePreference(false)}
              className="px-4 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-300"
            >
              {t.reject}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
