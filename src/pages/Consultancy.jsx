import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard } from "../components/ui";
import imgConsultancy from "../assets/images/marvin-meyer-SYTO3xs06fU-unsplash.jpg";

export default function Consultancy() {
  const { t } = useLang();
  const c = t.consultancy;

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

      {/* Approach */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-3xl font-bold text-white mb-6">{c.approachTitle}</h2>
            <p className="text-gray-400 leading-relaxed text-lg">{c.approachText}</p>
          </FadeIn>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {c.services.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.08}>
                <GlowCard className="h-full">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold mb-4">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </GlowCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-cyan-900/20 border-y border-cyan-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <img src={imgConsultancy} alt="Consultancy" className="rounded-2xl border border-cyan-500/20 object-cover w-full aspect-video" loading="lazy" />
            </FadeIn>
            <FadeIn delay={0.2}>
              <h2 className="text-3xl font-bold text-white">{c.ctaTitle}</h2>
              <p className="mt-4 text-gray-400">{c.ctaText}</p>
              <Link
                to="/contact"
                className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
              >
                {c.ctaButton}
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
