import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard, Badge } from "../components/ui";

const capabilityIcons = {
  ai: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="8" width="10" height="8" rx="2" />
      <path d="M9 12h.01M15 12h.01M12 8V5M6 12H4M20 12h-2M9 16v2h6v-2" strokeLinecap="round" />
    </svg>
  ),
  rpa: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M10.5 3.5h3l.5 2.1a7 7 0 0 1 1.5.9l2-.9 1.5 2.6-1.6 1.4c.1.5.1 1 .1 1.5s0 1-.1 1.5l1.6 1.4-1.5 2.6-2-.9a7 7 0 0 1-1.5.9l-.5 2.1h-3l-.5-2.1a7 7 0 0 1-1.5-.9l-2 .9-1.5-2.6 1.6-1.4A8 8 0 0 1 7 12c0-.5 0-1 .1-1.5L5.5 9.1 7 6.5l2 .9c.5-.4 1-.7 1.5-.9l.5-2.1Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  ),
  data: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="5.5" />
      <path d="m15.2 15.2 4.3 4.3M8.5 11h5M11 8.5v5" strokeLinecap="round" />
    </svg>
  ),
  robotics: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 13.5V9.8a2.8 2.8 0 0 1 2.8-2.8h1.8A2.4 2.4 0 0 0 14 4.6V4" strokeLinecap="round" />
      <path d="M17 10.5v3.7a2.8 2.8 0 0 1-2.8 2.8h-1.8A2.4 2.4 0 0 0 10 19.4V20" strokeLinecap="round" />
      <rect x="4" y="11.5" width="4" height="4" rx="1.2" />
      <rect x="16" y="8.5" width="4" height="4" rx="1.2" />
    </svg>
  ),
  upcycling: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3c-2.4 2-4.6 4.8-4.6 8.1A4.6 4.6 0 0 0 12 15.7a4.6 4.6 0 0 0 4.6-4.6C16.6 7.8 14.4 5 12 3Z" />
      <path d="M5 17c1.9 2.5 4.3 4 7 4s5.1-1.5 7-4M9.3 12.8c.7.7 1.6 1.1 2.7 1.1s2-.4 2.7-1.1" strokeLinecap="round" />
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
