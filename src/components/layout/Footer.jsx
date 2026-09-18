import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { usePublicTheme } from "../../context/publicTheme";
import logoDarkMode from "../../assets/cerilas-logo-darkmode.png";
import logoLightMode from "../../assets/cerilas-logo-lightmode.png";
import toolsLogo from "../../assets/platform-logo.webp";

const navRoutes = [
  { key: "home", path: "/" },
  { key: "about", path: "/about" },
  { key: "capabilities", path: "/capabilities" },
  { key: "projects", path: "/projects" },
  { key: "consultancy", path: "/consultancy" },
  { key: "careers", path: "/careers" },
  { key: "contact", path: "/contact" },
];

export default function Footer() {
  const { t, localizedPath } = useLang();
  const { resolvedTheme } = usePublicTheme();
  const isLight = resolvedTheme === "light";
  const f = t.footer;
  const year = new Date().getFullYear();
  const [nlEmail, setNlEmail] = useState("");
  const [nlDone, setNlDone] = useState(false);

  return (
    <footer className="public-footer bg-gray-950 border-t border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to={localizedPath("/")}>
              <img
                src={resolvedTheme === "light" ? logoLightMode : logoDarkMode}
                alt="Cerilas"
                className="h-11 w-auto mb-2"
              />
            </Link>
            <p className="mt-2 text-sm text-cyan-400 font-medium tracking-wide">{f.tagline}</p>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              {t.home.heroDesc}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a href="mailto:hi@cerilas.com" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                hi@cerilas.com
              </a>
              <span className="w-1 h-1 bg-gray-800 rounded-full" />
              <a 
                href="https://www.linkedin.com/company/cerilas/" 
                target="_blank" 
                rel="noreferrer"
                className="text-gray-400 hover:text-cyan-400 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">{f.links}</h4>
            <ul className="space-y-2">
              {navRoutes.map(({ key, path }) => (
                <li key={key}>
                  <Link
                    to={localizedPath(path)}
                    className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    {t.nav[key]}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://tools.cerilas.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm transition-colors inline-flex items-center gap-1.5 group ${
                    isLight ? 'text-slate-600 hover:text-blue-600' : 'text-gray-400 hover:text-cyan-400'
                  }`}
                >
                  <span>Cerilas Tools</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                  }`}>
                    Free
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                    isLight ? 'text-slate-400 group-hover:text-blue-600' : 'text-gray-500 group-hover:text-cyan-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">{f.legal}</h4>
            <ul className="space-y-2">
              {[
                { label: f.termsLabel, slug: "terms" },
                { label: f.privacyLabel, slug: "privacy" },
                { label: f.refundLabel, slug: "refund" },
                { label: f.accessLabel, slug: "accessibility" },
              ].map(({ label, slug }) => (
                <li key={slug}>
                  <Link to={localizedPath(`/legal/${slug}`)} className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">{f.newsletter}</h4>
            <p className="text-sm text-gray-400 mb-4">{f.newsletterDesc}</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!nlEmail) return;
                try {
                  await fetch('/api/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: nlEmail }),
                  });
                } catch (error) {
                  console.error("Newsletter subscription failed", error);
                }
                setNlDone(true);
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              {nlDone ? (
                <p className="text-cyan-400 text-sm font-medium">✓</p>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    value={nlEmail}
                    onChange={(e) => setNlEmail(e.target.value)}
                    placeholder={f.newsletterPlaceholder}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    {f.newsletterButton}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>

        <div className={`mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isLight ? 'border-slate-200' : 'border-gray-800/60'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-center sm:text-left">
            <p className={isLight ? 'text-slate-500' : 'text-gray-500'}>
              © {year} {t.brand.fullName}. {f.rights}
            </p>
            <span className={`hidden sm:inline-block w-1 h-1 rounded-full ${
              isLight ? 'bg-slate-300' : 'bg-gray-800'
            }`} />
            <p className={isLight ? 'text-slate-400' : 'text-gray-600'}>
              Gaziantep, Türkiye
            </p>
          </div>

          {/* Sağ Alt Köşe: Tools Cerilas Logo & Link */}
          <a
            href="https://tools.cerilas.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`tools-footer-badge group flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-300 ${
              isLight
                ? 'bg-white border border-slate-200/90 hover:border-blue-400/80 hover:bg-slate-50/80 shadow-[0_2px_8px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.12)]'
                : 'bg-gray-900/90 border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-900 shadow-sm hover:shadow-cyan-500/10'
            }`}
            title="Cerilas Tools — Free AI & Developer Utilities"
          >
            <img
              src={toolsLogo}
              alt="Cerilas' Tools"
              className="w-7 h-7 rounded-lg object-contain transition-transform duration-300 group-hover:scale-110 shadow-sm flex-shrink-0"
              onError={(e) => {
                e.target.src = "/platform-logo.png";
              }}
            />
            <div className="flex flex-col text-left">
              <span className={`text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isLight ? 'text-slate-700 group-hover:text-blue-600' : 'text-gray-200 group-hover:text-cyan-400'
              }`}>
                Cerilas' <span className={`font-bold ${isLight ? 'text-slate-900 group-hover:text-blue-600' : 'text-white group-hover:text-cyan-300'}`}>Tools</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none ${
                  isLight
                    ? 'text-blue-600 bg-blue-50 border border-blue-200/80'
                    : 'text-cyan-400 bg-cyan-950/80 border border-cyan-800/60'
                }`}>
                  Free
                </span>
              </span>
              <span className={`text-[11px] transition-colors ${
                isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-gray-500 group-hover:text-gray-400'
              }`}>
                tools.cerilas.com
              </span>
            </div>
            <svg 
              className={`w-3.5 h-3.5 transition-all ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                isLight ? 'text-slate-400 group-hover:text-blue-600' : 'text-gray-500 group-hover:text-cyan-400'
              }`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
