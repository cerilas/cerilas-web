import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "../../context/LanguageContext";

const navRoutes = [
  { key: "home", path: "/" },
  { key: "about", path: "/about" },
  { key: "capabilities", path: "/capabilities" },
  { key: "projects", path: "/projects" },
  { key: "useCases", path: "/use-cases" },
  { key: "consultancy", path: "/consultancy" },
  { key: "careers", path: "/careers" },
  { key: "contact", path: "/contact" },
];

export default function Navbar() {
  const { t, lang, toggleLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-gray-950/95 backdrop-blur border-b border-gray-800/60 shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="group inline-flex flex-col items-start leading-none">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              {t.brand.shortName}
            </span>
            <span className="hidden sm:block w-full max-w-full text-[10px] text-gray-400 font-medium tracking-wide mt-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">
              Yüksek Teknoloji
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navRoutes.map(({ key, path }) => (
              <NavLink
                key={key}
                to={path}
                end={path === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-cyan-400 bg-cyan-400/10"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {t.nav[key]}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-700 text-xs font-semibold text-gray-300 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
            >
              {lang === "tr" ? "EN" : "TR"}
            </button>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
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
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-gray-950/98 backdrop-blur border-b border-gray-800"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navRoutes.map(({ key, path }) => (
                <NavLink
                  key={key}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    `px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive ? "text-cyan-400 bg-cyan-400/10" : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  {t.nav[key]}
                </NavLink>
              ))}
              <div className="pt-3 border-t border-gray-800 mt-2">
                <button
                  onClick={toggleLang}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 border border-gray-700 rounded-md hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                >
                  {lang === "tr" ? t.common.switchToEnglish : t.common.switchToTurkish}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
