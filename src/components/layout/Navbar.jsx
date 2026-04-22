import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "../../context/LanguageContext";
import logoImg from "../../assets/logo.png";

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
  const { t, lang, toggleLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logoImg} alt="Cerilas" className="h-9 sm:h-12 w-auto transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center">
            {/* Show all on XL and up */}
            <div className="hidden xl:flex items-center gap-1">
              {navRoutes.map(({ key, path }) => (
                <NavLink
                  key={key}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    `px-2 xl:px-3 py-2 text-[13px] xl:text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-cyan-400 bg-cyan-400/10"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
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
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    `px-2 py-2 text-[13px] font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-cyan-400 bg-cyan-400/10"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
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
                <button className={`px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1 ${moreOpen ? "text-white bg-white/5" : "text-gray-300"}`}>
                  {t.nav.more}
                  <svg className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-[60]"
                    >
                      {secondaryRoutes.map(({ key, path }) => (
                        <NavLink
                          key={key}
                          to={path}
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm transition-colors ${
                              isActive ? "text-cyan-400 bg-cyan-400/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`
                          }
                        >
                          {t.nav[key]}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
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
