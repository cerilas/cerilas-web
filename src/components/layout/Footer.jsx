import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import logoImg from "../../assets/logo.png";

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
  const { t } = useLang();
  const f = t.footer;
  const year = new Date().getFullYear();
  const [nlEmail, setNlEmail] = useState("");
  const [nlDone, setNlDone] = useState(false);

  return (
    <footer className="bg-gray-950 border-t border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/">
              <img src={logoImg} alt="Cerilas" className="h-11 w-auto mb-2" />
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
                    to={path}
                    className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    {t.nav[key]}
                  </Link>
                </li>
              ))}
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
                  <Link to={`/legal/${slug}`} className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
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
                } catch {}
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

        <div className="mt-12 pt-6 border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {year} {t.brand.fullName}. {f.rights}
          </p>
          <p className="text-xs text-gray-600">
            Gaziantep, Türkiye
          </p>
        </div>
      </div>
    </footer>
  );
}
