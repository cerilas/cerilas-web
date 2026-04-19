import { useLang } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import { SectionTitle, FadeIn, GlowCard } from "../components/ui";
import imgTeam from "../assets/images/vlad-hilitanu-1FI2QAYPa-Y-unsplash.jpg";

export default function Careers() {
  const { t } = useLang();
  const c = t.careers;
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

      {/* Why & Culture */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <FadeIn>
              <h2 className="text-2xl font-bold text-white mb-6">{c.whyTitle}</h2>
              <ul className="space-y-3">
                {c.whyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-400">
                    <span className="text-cyan-400 mt-0.5 text-lg">✓</span>
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.2}>
              <h2 className="text-2xl font-bold text-white mb-6">{c.cultureTitle}</h2>
              <p className="text-gray-400 leading-relaxed mb-6">{c.cultureText}</p>
              <img src={imgTeam} alt="Team" className="rounded-2xl border border-gray-800/60 object-cover w-full aspect-video" loading="lazy" />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title={c.openTitle} subtitle={c.openDesc} center={false} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.positions.map((pos, i) => (
              <FadeIn key={pos.title} delay={i * 0.08}>
                <GlowCard>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{pos.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-400">
                        <span>{pos.type}</span>
                        <span className="text-gray-600">·</span>
                        <span>{pos.location}</span>
                      </div>
                    </div>
                    <Link
                      to={`/careers/apply?position=${encodeURIComponent(pos.title)}`}
                      className="shrink-0 px-4 py-2 text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors"
                    >
                      {common.applyShort}
                    </Link>
                  </div>
                </GlowCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="py-20 border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white">{c.applyTitle}</h2>
            <p className="mt-3 text-gray-400">{c.applyDesc}</p>
            <Link
              to="/careers/apply"
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
            >
              {c.applyButton}
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
