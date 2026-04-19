import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard, Badge } from "../components/ui";

const capabilityIcons = {
  health: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeLinejoin="round" />
      <path d="M9 10h6M12 7v6" strokeLinecap="round" />
    </svg>
  ),
  mechatronics: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 13.5V9.8a2.8 2.8 0 0 1 2.8-2.8h1.8A2.4 2.4 0 0 0 14 4.6V4" strokeLinecap="round" />
      <path d="M17 10.5v3.7a2.8 2.8 0 0 1-2.8 2.8h-1.8A2.4 2.4 0 0 0 10 19.4V20" strokeLinecap="round" />
      <rect x="4" y="11.5" width="4" height="4" rx="1.2" />
      <rect x="16" y="8.5" width="4" height="4" rx="1.2" />
    </svg>
  ),
  embedded: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5 4 4M18.5 5.5 20 4M5.5 18.5 4 20M18.5 18.5 20 20" strokeLinecap="round" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="8" width="10" height="8" rx="2" />
      <path d="M9 12h.01M15 12h.01M12 8V5M6 12H4M20 12h-2M9 16v2h6v-2" strokeLinecap="round" />
    </svg>
  ),
  software: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 4l-4 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  prototyping: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3M22 2l-5 5M15 7l-1.5 1.5M17 9l-1.5 1.5M6.5 12.5l5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  consultancy: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8.5 12 4l8 4.5-8 4.5L4 8.5Zm3 4.2 5 2.8 5-2.8M7 16.4l5 2.8 5-2.8" strokeLinejoin="round" />
    </svg>
  ),
};

export default function Capabilities() {
  const { t } = useLang();
  const c = t.capabilities;
  const common = t.common;

  return (
    <div className="pt-16">
      {/* Header */}
      <section className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">{c.title}</h1>
            <p className="mt-6 text-xl text-gray-400 leading-relaxed">{c.subtitle}</p>
          </FadeIn>
        </div>
      </section>

      {/* Capability areas */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {c.areas.map((area, i) => (
            <FadeIn key={area.id} delay={i * 0.05}>
              <GlowCard className="overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: title + desc */}
                  <div className="lg:col-span-1">
                    <div className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                      {capabilityIcons[area.id]}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{area.title}</h2>
                    <p className="mt-3 text-gray-400 leading-relaxed text-sm">{area.desc}</p>
                    <div className="mt-4 text-xs text-gray-500">
                      <span className="text-gray-400 font-medium">{common.forLabel}: </span>
                      {area.audience}
                    </div>
                  </div>

                  {/* Middle: use cases */}
                  <div>
                    <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">
                      {common.useCases}
                    </h3>
                    <ul className="space-y-2">
                      {area.useCases.map((uc) => (
                        <li key={uc} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="text-cyan-500 mt-0.5">›</span>
                          {uc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: technologies */}
                  <div>
                    <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">
                      {common.technologies}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {area.technologies.map((tech) => (
                        <Badge key={tech}>{tech}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowCard>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
