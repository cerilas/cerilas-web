import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard, Badge } from "../components/ui";
import { useProjects } from "../hooks/useProjects";
import { api } from "../lib/api";
import LiquidEther from "../components/effects/LiquidEther";
import imgConsult from "../assets/images/ux-indonesia-ywwuOBJy60c-unsplash.jpg";
import heroBg from "../assets/images/boitumelo-zqhZH1Khf_I-unsplash.jpg";

const partnerLogoModules = import.meta.glob("../cerilas-partners-logos/*.{png,jpg,jpeg,svg,webp}", {
  eager: true,
  import: "default",
});

const partnerLogos = Object.entries(partnerLogoModules)
  .sort(([a], [b]) => {
    const aName = a.split("/").pop()?.split(".")[0] || "";
    const bName = b.split("/").pop()?.split(".")[0] || "";
    return Number(aName) - Number(bName);
  })
  .map(([, src], index) => ({
    src,
    alt: `Strategic Partner ${index + 1}`,
  }));


const capIcons = [
  (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="8" width="10" height="8" rx="2" />
      <path d="M9 12h.01M15 12h.01M12 8V5M6 12H4M20 12h-2M9 16v2h6v-2" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M10.5 3.5h3l.5 2.1a7 7 0 0 1 1.5.9l2-.9 1.5 2.6-1.6 1.4c.1.5.1 1 .1 1.5s0 1-.1 1.5l1.6 1.4-1.5 2.6-2-.9a7 7 0 0 1-1.5.9l-.5 2.1h-3l-.5-2.1a7 7 0 0 1-1.5-.9l-2 .9-1.5-2.6 1.6-1.4A8 8 0 0 1 7 12c0-.5 0-1 .1-1.5L5.5 9.1 7 6.5l2 .9c.5-.4 1-.7 1.5-.9l.5-2.1Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="5.5" />
      <path d="m15.2 15.2 4.3 4.3M8.5 11h5M11 8.5v5" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 13.5V9.8a2.8 2.8 0 0 1 2.8-2.8h1.8A2.4 2.4 0 0 0 14 4.6V4" strokeLinecap="round" />
      <path d="M17 10.5v3.7a2.8 2.8 0 0 1-2.8 2.8h-1.8A2.4 2.4 0 0 0 10 19.4V20" strokeLinecap="round" />
      <rect x="4" y="11.5" width="4" height="4" rx="1.2" />
      <rect x="16" y="8.5" width="4" height="4" rx="1.2" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3c-2.4 2-4.6 4.8-4.6 8.1A4.6 4.6 0 0 0 12 15.7a4.6 4.6 0 0 0 4.6-4.6C16.6 7.8 14.4 5 12 3Z" />
      <path d="M5 17c1.9 2.5 4.3 4 7 4s5.1-1.5 7-4M9.3 12.8c.7.7 1.6 1.1 2.7 1.1s2-.4 2.7-1.1" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8.5 12 4l8 4.5-8 4.5L4 8.5Zm3 4.2 5 2.8 5-2.8M7 16.4l5 2.8 5-2.8" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
];

export default function Home() {
  const { t } = useLang();
  const h = t.home;
  const common = t.common;
  const caps = t.capabilities.areas;
  const projects = useProjects();
  const [stats, setStats] = useState({ projects: 0, useCases: 0, uniqueTags: 0 });

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, []);

  const metrics = [
    { key: "metric1Label", value: stats.projects },
    { key: "metric2Label", value: stats.useCases },
    { key: "metric3Label", value: stats.uniqueTags },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
        {/* Background Image with low transparency */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
          <LiquidEther
            colors={['#06b6d4', '#3b82f6', '#0e7490']}
            mouseForce={20}
            cursorSize={80}
            isViscous={false}
            viscous={30}
            iterationsViscous={16}
            iterationsPoisson={16}
            resolution={0.3}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-widest uppercase mb-8">
              {t.brand.fullName}
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none">
              {h.heroTitle}
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {h.heroSubtitle}
              </span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {h.heroDesc}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/projects"
                className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl transition-colors text-sm"
              >
                {h.ctaPrimary}
              </Link>
              <Link
                to="/contact"
                className="px-8 py-3.5 border border-gray-700 hover:border-cyan-500 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {h.ctaSecondary}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* Value proposition */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {h.valueTitle}
              </h2>
              <p className="mt-6 text-lg text-gray-400 leading-relaxed">{h.valueDesc}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Health Tech", "Mechatronics", "Embedded", "AI", "Prototyping"].map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="grid grid-cols-3 gap-4">
                {metrics.map(({ key, value, valueKey }) => (
                  <div
                    key={key}
                    className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 text-center"
                  >
                    <div className="text-3xl font-bold text-cyan-400">
                      {valueKey ? h[valueKey] : value}
                    </div>
                    <div className="mt-2 text-xs text-gray-400 leading-tight">{h[key]}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* TUBITAK ownership highlight */}
      <section className="py-20 bg-gray-900/30 border-y border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-900/20 via-gray-900/80 to-blue-900/20 p-8 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                    {h.tubitakChip}
                  </span>
                  <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {h.tubitakTitle}
                  </h2>
                  <p className="mt-4 text-gray-300 leading-relaxed">
                    {h.tubitakDesc}
                  </p>
                  <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                    {h.tubitakNote}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white p-6 flex flex-col items-center justify-center">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">
                    {h.tubitakStatLabel}
                  </div>
                  <img
                    src={partnerLogos[1].src}
                    alt="TUBITAK"
                    className="h-16 sm:h-20 w-auto object-contain transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title={h.capTitle} subtitle={h.capDesc} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {caps.map((cap, i) => (
              <FadeIn key={cap.id} delay={i * 0.08}>
                <GlowCard className="h-full">
                  <div className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                    {capIcons[i]}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{cap.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{cap.desc}</p>
                  <Link
                    to="/capabilities"
                    className="mt-4 inline-flex items-center text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    {common.learnMore} →
                  </Link>
                </GlowCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title={h.projTitle} subtitle={h.projDesc} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj, i) => (
              <FadeIn key={proj.id} delay={i * 0.1}>
                <Link to={`/projects/${proj.id}`}>
                  <GlowCard className="h-full cursor-pointer">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {proj.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{proj.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{proj.shortDesc}</p>
                    <div className="mt-4 text-xs text-gray-500">{proj.date}</div>
                  </GlowCard>
                </Link>
              </FadeIn>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-cyan-500 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t.projects.viewDetail} →
            </Link>
          </div>
        </div>
      </section>

      {/* Ecosystem / Collaboration */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{h.ecoTitle}</h2>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed">{h.ecoDesc}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {h.ecosystemPartners.map((p) => (
                <span
                  key={p}
                  className="px-4 py-2 rounded-full bg-gray-900/80 border border-gray-700/60 text-sm text-gray-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Strategic partners logos */}
      <section className="py-24 bg-gray-950 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title={h.strategicPartnersTitle}
            subtitle={h.strategicPartnersDesc}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {partnerLogos.map((logo, idx) => (
              <FadeIn key={`${logo.src}-${idx}`} delay={idx * 0.04}>
                <div className="group relative h-28 sm:h-32 rounded-2xl border border-gray-800/70 bg-gray-900/45 backdrop-blur flex items-center justify-center px-5 hover:border-white/80 hover:bg-white/95 hover:shadow-lg hover:shadow-white/20 transition-all duration-300">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                    className="max-h-16 sm:max-h-20 w-auto max-w-full object-contain opacity-90 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                  />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Consultancy teaser */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{h.consultTitle}</h2>
              <p className="mt-6 text-gray-400 leading-relaxed">{h.consultDesc}</p>
              <Link
                to="/consultancy"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
              >
                {h.consultCta}
              </Link>
            </FadeIn>
            <FadeIn delay={0.2}>
              <img src={imgConsult} alt="Consultancy" className="rounded-2xl border border-gray-800/60 object-cover w-full aspect-video mb-6" loading="lazy" />
              <div className="grid grid-cols-2 gap-4">
                {t.consultancy.services.slice(0, 4).map((s, i) => (
                  <div key={i} className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{s.desc}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Contact CTA band */}
      <section className="py-20 bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-cyan-900/20 border-y border-cyan-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="text-2xl sm:text-3xl font-bold text-white">{h.contactBand}</p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
            >
              {h.contactCta}
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
