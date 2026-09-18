import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useLang } from "../../context/LanguageContext";
import { usePublicTheme } from "../../context/publicTheme";
import logoDarkMode from "../../assets/cerilas-logo-darkmode.png";
import logoLightMode from "../../assets/cerilas-logo-lightmode.png";

const mainRoutes = [
  { key: "home", path: "/" },
  { key: "about", path: "/about" },
  { key: "capabilities", path: "/capabilities" },
  { key: "projects", path: "/projects" },
];

const secondaryRoutes = [
  { key: "useCases", path: "/use-cases" },
  { key: "consultancy", path: "/consultancy" },
  { key: "careers", path: "/careers" },
  { key: "contact", path: "/contact" },
];

const navRoutes = [...mainRoutes, ...secondaryRoutes];

export default function Navbar() {
  const { t, lang, toggleLang, localizedPath } = useLang();
  const { resolvedTheme, toggleTheme } = usePublicTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const useLightNavigation = resolvedTheme === "light";
  const navTextClass = useLightNavigation
    ? "text-slate-600 hover:text-slate-950 hover:bg-slate-900/5"
    : "text-gray-300 hover:text-white hover:bg-white/5";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        useLightNavigation
          ? "public-navbar-light bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,.06)]"
          : scrolled
            ? "theme-dark-media bg-gray-950/95 backdrop-blur border-b border-gray-800/60 shadow-lg"
            : "theme-dark-media bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={localizedPath("/")} className="flex items-center gap-2 group">
            <img
              src={useLightNavigation ? logoLightMode : logoDarkMode}
              alt="Cerilas"
              className="h-[2.2rem] sm:h-[2.8rem] w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center">
            {/* Show all on XL and up */}
            <div className="hidden xl:flex items-center gap-1">
              {navRoutes.map(({ key, path }) => (
                <NavLink
                  key={key}
                  to={localizedPath(path)}
                  end={path === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-2 xl:px-3 py-2 text-[13px] xl:text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-cyan-400 bg-cyan-400/10"
                        : navTextClass
                    }`
                  }
                >
                  {t.nav[key]}
                </NavLink>
              ))}
            </div>

            {/* Show Main + Dropdown on LG screens */}
            <div className="flex xl:hidden items-center gap-0.5">
              {mainRoutes.map(({ key, path }) => (
                <NavLink
                  key={key}
                  to={localizedPath(path)}
                  end={path === "/"}
                  className={({ isActive }) =>
                    `px-2 py-2 text-[13px] font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-cyan-400 bg-cyan-400/10"
                        : navTextClass
                    }`
                  }
                >
                  {t.nav[key]}
                </NavLink>
              ))}
              
              {/* More Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setMoreOpen(true)}
                onMouseLeave={() => setMoreOpen(false)}
              >
                <button className={`px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1 ${
                  moreOpen
                    ? useLightNavigation
                      ? "text-slate-950 bg-slate-900/5"
                      : "text-white bg-white/5"
                    : useLightNavigation
                      ? "text-slate-600"
                      : "text-gray-300"
                }`}>
                  {t.nav.more}
                  <svg className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {moreOpen && (
                    <Motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 top-full mt-1 w-48 rounded-xl border py-2 shadow-2xl z-[60] ${
                        useLightNavigation
                          ? "bg-white border-slate-200"
                          : "theme-dark-media bg-gray-900 border-gray-800"
                      }`}
                    >
                      {secondaryRoutes.map(({ key, path }) => (
                        <NavLink
                          key={key}
                          to={localizedPath(path)}
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm transition-colors ${
                              isActive
                                ? "text-cyan-500 bg-cyan-400/5"
                                : useLightNavigation
                                  ? "text-slate-600 hover:text-slate-950 hover:bg-slate-900/5"
                                  : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`
                          }
                        >
                          {t.nav[key]}
                        </NavLink>
                      ))}
                    </Motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                useLightNavigation
                  ? "border-slate-200 bg-white text-slate-600 hover:border-cyan-500 hover:text-cyan-600"
                  : "border-gray-700 bg-gray-950/30 text-gray-300 hover:border-cyan-500 hover:text-cyan-300"
              }`}
              aria-label={resolvedTheme === "light" ? "Koyu temaya geç" : "Açık temaya geç"}
              title={resolvedTheme === "light" ? "Koyu temaya geç" : "Açık temaya geç"}
            >
              {resolvedTheme === "light" ? (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
                useLightNavigation
                  ? "border-slate-200 text-slate-600 hover:border-cyan-500 hover:text-cyan-600"
                  : "border-gray-700 text-gray-300 hover:border-cyan-500 hover:text-cyan-400"
              }`}
            >
              {lang === "tr" ? "EN" : "TR"}
            </button>

            {/* Mobile menu button */}
            <button
              className={`lg:hidden p-2 rounded-md transition-colors ${
                useLightNavigation
                  ? "text-slate-600 hover:text-slate-950 hover:bg-slate-900/5"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`lg:hidden backdrop-blur border-b ${
              resolvedTheme === "light"
                ? "bg-white/98 border-slate-200"
                : "theme-dark-media bg-gray-950/98 border-gray-800"
            }`}
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navRoutes.map(({ key, path }) => (
                <NavLink
                  key={key}
                  to={localizedPath(path)}
                  end={path === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-cyan-500 bg-cyan-400/10"
                        : resolvedTheme === "light"
                          ? "text-slate-600 hover:text-slate-950 hover:bg-slate-900/5"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  {t.nav[key]}
                </NavLink>
              ))}
              <div className={`pt-3 border-t mt-2 ${resolvedTheme === "light" ? "border-slate-200" : "border-gray-800"}`}>
                <button
                  onClick={toggleLang}
                  className={`px-4 py-2 text-xs font-semibold border rounded-md hover:border-cyan-500 hover:text-cyan-500 transition-colors ${
                    resolvedTheme === "light" ? "text-slate-600 border-slate-200" : "text-gray-300 border-gray-700"
                  }`}
                >
                  {lang === "tr" ? t.common.switchToEnglish : t.common.switchToTurkish}
                </button>
              </div>
            </nav>
          </Motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
