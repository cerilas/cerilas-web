import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard } from "../components/ui";
import imgInnovation from "../assets/images/kaleidico-3V8xo5Gbusk-unsplash.jpg";
import imgSustain from "../assets/images/natalie-pedigo-wJK9eTiEZHY-unsplash.jpg";

export default function About() {
  const { t } = useLang();
  const a = t.about;

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">{a.title}</h1>
            <p className="mt-6 text-xl text-gray-400 leading-relaxed">{a.subtitle}</p>
          </FadeIn>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className="text-3xl font-bold text-white">{a.whoTitle}</h2>
              <p className="mt-6 text-gray-400 leading-relaxed text-lg">{a.whoText}</p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="grid grid-cols-1 gap-4">
                <GlowCard>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">{a.missionTitle}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{a.missionText}</p>
                </GlowCard>
                <GlowCard>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">{a.visionTitle}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{a.visionText}</p>
                </GlowCard>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Open Innovation */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn delay={0.2} className="order-2 lg:order-1">
              <img src={imgInnovation} alt="Open Innovation" className="aspect-video rounded-2xl border border-cyan-500/20 object-cover w-full" loading="lazy" />
            </FadeIn>
            <FadeIn className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-white">{a.innovationTitle}</h2>
              <p className="mt-6 text-gray-400 leading-relaxed">{a.innovationText}</p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className="text-3xl font-bold text-white">{a.sustainTitle}</h2>
              <p className="mt-6 text-gray-400 leading-relaxed">{a.sustainText}</p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <img src={imgSustain} alt="Sustainability" className="aspect-video rounded-2xl border border-green-500/20 object-cover w-full" loading="lazy" />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title={a.valuesTitle} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {a.values.map((v, i) => (
              <FadeIn key={v.title} delay={i * 0.08}>
                <GlowCard className="text-center h-full">
                  <div className="text-2xl mb-3">{"✦"}</div>
                  <h3 className="text-base font-semibold text-white mb-2">{v.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{v.desc}</p>
                </GlowCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
