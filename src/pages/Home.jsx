import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, useScroll, useTransform } from "framer-motion";
import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard, Badge } from "../components/ui";
import { useProjects } from "../hooks/useProjects";
import { api } from "../lib/api";
import imgConsult from "../assets/images/ux-indonesia-ywwuOBJy60c-unsplash.jpg";
import capBg from "../assets/images/albert-stoynov-b_GcLCaKt94-unsplash.jpg";
import imgContactCta from "../assets/images/nicolas-thomas-CBydtQDjaJc-unsplash.jpg";
import imgRdLab from "../assets/images/generated/cerilas-rd-lab.webp";
import imgEmbeddedLab from "../assets/images/generated/cerilas-embedded-lab.webp";
import imgCollaborationLab from "../assets/images/generated/cerilas-collaboration-lab.webp";

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

const sponsorLogoModules = import.meta.glob("../Sponsor-Logo/*.{png,jpg,jpeg,svg,webp}", {
  eager: true,
  import: "default",
});

const sponsorLogos = Object.entries(sponsorLogoModules)
  .map(([path, src]) => {
    const fileName = path.split("/").pop() || "";
    const cleanName = fileName
      .replace(/\.(png|jpe?g|svg|webp)$/i, "")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      src,
      alt: cleanName,
    };
  })
  .sort((a, b) => a.alt.localeCompare(b.alt, "tr"));


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
  const { t, localizedPath } = useLang();
  const h = t.home;
  const common = t.common;
  const caps = t.capabilities.areas;
  const projects = useProjects();
  const [stats, setStats] = useState({ projects: 0, useCases: 0, uniqueTags: 0 });
  const [activeCapability, setActiveCapability] = useState(0);

  const capsRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: capsRef,
    offset: ["start end", "end start"]
  });
  const capBgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

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
      <section className="public-home-hero relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
        <img
          src={imgRdLab}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
          aria-hidden="true"
        />
        <div className="light-photo-wash-x absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-gray-950/25" />
        <div className="light-photo-wash-y absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/25" />
        <div className="absolute inset-y-0 left-0 w-2/3 bg-[radial-gradient(circle_at_25%_50%,rgba(6,182,212,.09),transparent_52%)]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-40 sm:pb-44">
          <Motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid lg:grid-cols-[.92fr_1.08fr] items-center gap-12 lg:gap-16"
          >
            <div className="text-center lg:text-left">
              <h1 className="public-hero-title text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[0.98]">
                {h.heroTitle}
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {h.heroSubtitle}
                </span>
              </h1>
              <p className="mt-7 text-base sm:text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {h.heroDesc}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to={localizedPath("/projects")}
                  className="public-primary-button px-7 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-gray-950 font-semibold rounded-xl transition-colors text-sm"
                >
                  {h.ctaPrimary}
                </Link>
                <Link
                  to={localizedPath("/contact")}
                  className="public-secondary-button px-7 py-3.5 border border-gray-700/80 bg-gray-950/25 hover:border-cyan-500 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors text-sm backdrop-blur"
                >
                  {h.ctaSecondary}
                </Link>
              </div>
            </div>
            <div className="hidden lg:block" aria-hidden="true" />
          </Motion.div>
        </div>

        {/* Scroll indicator */}
        <Motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Motion.div>

        <div className="absolute inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
              <div className="text-[9px] sm:text-[10px] font-normal uppercase tracking-[0.12em] text-gray-400 whitespace-nowrap">
                CERİLAS supported / funded by
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {sponsorLogos.map((logo) => (
                  <img
                    key={logo.alt}
                    src={logo.src}
                    alt={logo.alt}
                    className="h-7 sm:h-8 max-w-[120px] object-contain"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* R&D system overview */}
      <section className="public-home-overview py-24 bg-gray-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-5">
              <div className="public-feature-card relative min-h-[410px] overflow-hidden rounded-3xl border border-gray-800/70 bg-gradient-to-br from-gray-900 via-gray-950 to-cyan-950/30 p-7 sm:p-10">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="relative">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                    <div className="max-w-xl">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">{h.valueTitle}</span>
                      <h2 className="mt-3 max-w-[36rem] text-balance text-3xl sm:text-4xl font-bold text-white leading-[1.15]">
                        {h.capDesc}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:max-w-[220px] sm:justify-end">
                      {["Health Tech", "Robotics", "Embedded", "AI"].map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-14">
                    <div className="absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-cyan-400/15 via-cyan-400/70 to-cyan-400/15 sm:block" />
                    <div className="relative grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4">
                      {caps.slice(0, 4).map((cap, i) => (
                        <div key={cap.id}>
                          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gray-950 text-cyan-300 shadow-[0_0_24px_rgba(6,182,212,.12)]">
                            {capIcons[i]}
                          </div>
                          <div className="mt-4 text-[10px] font-bold tracking-[0.2em] text-gray-600">0{i + 1}</div>
                          <h3 className="mt-1 max-w-[9rem] text-sm font-semibold leading-snug text-gray-100">{cap.title}</h3>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="grid grid-cols-3 gap-3">
                {metrics.map(({ key, value, valueKey }) => (
                  <div
                    key={key}
                      className="public-metric-card rounded-2xl border border-gray-800/70 bg-gray-900/70 px-3 py-5 text-center"
                  >
                      <div className="text-2xl sm:text-3xl font-bold text-cyan-300">
                      {valueKey ? h[valueKey] : value}
                    </div>
                      <div className="mt-2 text-[10px] text-gray-500 leading-tight">{h[key]}</div>
                  </div>
                ))}
              </div>

                <div className="public-grant-card group relative flex min-h-[225px] flex-col justify-between overflow-hidden rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-6">
                  <div className="absolute -bottom-16 -right-12 h-44 w-44 rounded-full bg-cyan-400/10 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-4">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                      {h.tubitakChip}
                    </span>
                    <div className="rounded-xl bg-white p-2.5">
                      <img
                        src={partnerLogos[1]?.src}
                        alt="TUBITAK"
                        className="h-8 w-auto object-contain"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <h3 className="text-xl font-bold text-white">{h.tubitakTitle}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-400">{h.tubitakDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Capabilities */}
      <section ref={capsRef} className="public-home-capabilities relative py-24 bg-gray-900/30 overflow-hidden">
        {/* Parallax Background */}
        <Motion.div
          className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `url(${capBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            y: capBgY
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title={h.capTitle} />
          <FadeIn>
            <div className="public-capabilities-frame overflow-hidden rounded-3xl border border-gray-800/70 bg-gray-950/65 backdrop-blur">
              <div className="grid lg:grid-cols-[.72fr_1.28fr]">
                <div className="border-b border-gray-800/70 p-3 lg:border-b-0 lg:border-r">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    {caps.map((cap, i) => (
                      <button
                        key={cap.id}
                        type="button"
                        onClick={() => setActiveCapability(i)}
                        className={`group flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                          activeCapability === i
                            ? "public-capability-active bg-cyan-400 text-gray-950 shadow-[0_12px_40px_rgba(6,182,212,.16)]"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className={`shrink-0 ${activeCapability === i ? "text-gray-950" : "text-cyan-400"}`}>
                          {capIcons[i]}
                        </span>
                        <span className="text-xs font-semibold leading-tight sm:text-sm">{cap.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative min-h-[390px] p-7 sm:p-10 lg:p-12">
                  <img
                    src={imgEmbeddedLab}
                    alt=""
                    aria-hidden="true"
                    className="public-photo-image absolute inset-0 h-full w-full object-cover object-center opacity-55"
                  />
                  <div className="light-photo-wash-x absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/92 to-gray-950/30" />
                  <div className="light-photo-wash-y absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/30" />
                  <Motion.div
                    key={caps[activeCapability].id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative flex h-full flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                          {capIcons[activeCapability]}
                        </div>
                        <span className="text-6xl font-black text-white/[0.035] sm:text-8xl">
                          0{activeCapability + 1}
                        </span>
                      </div>
                      <h3 className="mt-8 text-3xl font-bold text-white">{caps[activeCapability].title}</h3>
                      <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-300">
                        {caps[activeCapability].desc}
                      </p>
                    </div>
                    <Link
                      to={localizedPath("/capabilities")}
                      className="mt-9 inline-flex w-fit items-center gap-2 text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
                    >
                      {common.learnMore}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </Motion.div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Projects */}
      <section className="public-home-projects py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title={h.projTitle} subtitle={h.projDesc} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.slice(0, 3).map((proj, i) => (
              <FadeIn key={proj.id} delay={i * 0.1}>
                <Link to={localizedPath(`/projects/${proj.id}`)}>
                  <GlowCard className="public-photo-card h-full min-h-[360px] cursor-pointer p-0 overflow-hidden">
                    {proj.imageUrl && (
                      <img 
                        src={proj.imageUrl} 
                        alt={proj.title} 
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy" 
                      />
                    )}
                    <div className="light-photo-card-overlay absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/65 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {proj.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{proj.title}</h3>
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                        <span>{proj.date}</span>
                        <span className="text-cyan-300">↗</span>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </FadeIn>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to={localizedPath("/projects")}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-cyan-500 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t.projects.viewDetail} →
            </Link>
          </div>
        </div>
      </section>

      {/* Ecosystem / Collaboration */}
      <section className="public-home-ecosystem py-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="public-photo-card group relative min-h-[540px] overflow-hidden rounded-3xl border border-gray-800/70">
              <img
                src={imgCollaborationLab}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-[58%_center] transition-transform duration-700 group-hover:scale-[1.015]"
              />
              <div className="light-photo-wash-x absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-gray-950/10" />
              <div className="light-photo-wash-y absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/20" />

              <div className="relative flex min-h-[540px] max-w-xl flex-col justify-center p-7 sm:p-12">
                <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl">{h.ecoTitle}</h2>
                <p className="mt-6 max-w-lg text-sm leading-relaxed text-gray-300 sm:text-base">{h.ecoDesc}</p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {h.ecosystemPartners.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-white/15 bg-gray-950/65 px-3.5 py-2 text-xs font-medium text-gray-200 backdrop-blur-md"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Strategic partners logos */}
      <section className="public-home-partners py-24 bg-gray-950 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title={h.strategicPartnersTitle}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {partnerLogos.map((logo, idx) => (
              <FadeIn key={`${logo.src}-${idx}`} delay={idx * 0.04}>
                <div className="public-logo-card group relative h-28 sm:h-32 rounded-2xl border border-gray-800/70 bg-gray-900/45 backdrop-blur flex items-center justify-center px-5 hover:border-white/80 hover:bg-white/95 hover:shadow-lg hover:shadow-white/20 transition-all duration-300">
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
      <section className="public-home-consultancy py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="public-photo-card group relative min-h-[490px] overflow-hidden rounded-3xl border border-gray-800/70">
              <img src={imgConsult} alt="Consultancy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" />
              <div className="light-photo-wash-x absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/20" />
              <div className="relative flex min-h-[490px] max-w-2xl flex-col justify-center p-7 sm:p-12">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">KNOW-HOW → IMPACT</span>
                <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-white">{h.consultTitle}</h2>
                <div className="mt-7 flex flex-wrap gap-2">
                  {t.consultancy.services.slice(0, 4).map((s, i) => (
                    <span key={i} className="rounded-full border border-white/15 bg-gray-950/60 px-3.5 py-2 text-xs font-medium text-gray-200 backdrop-blur">
                      {s.title}
                    </span>
                  ))}
                </div>
                <Link
                  to={localizedPath("/consultancy")}
                  className="public-primary-button mt-9 inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-gray-950 transition-colors hover:bg-cyan-300"
                >
                  {h.consultCta} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Contact CTA band */}
      <section className="public-contact-band relative overflow-hidden py-24 border-y border-cyan-500/10">
        <img
          src={imgContactCta}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="contact-photo-overlay absolute inset-0" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="text-2xl sm:text-3xl font-bold text-white">{h.contactBand}</p>
            <Link
              to={localizedPath("/contact")}
              className="public-primary-button mt-8 inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
            >
              {h.contactCta}
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
