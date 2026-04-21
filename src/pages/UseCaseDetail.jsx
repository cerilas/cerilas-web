import { Link, useParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { Badge, FadeIn, GlowCard } from '../components/ui';
import { useUseCase } from '../hooks/useUseCases';
import { useSeoMeta } from '../hooks/useSeoMeta';

export default function UseCaseDetail() {
  const { slug } = useParams();
  const { t } = useLang();
  const copy = t.useCases;
  const common = t.common;
  const { loading, useCase } = useUseCase(slug);

  useSeoMeta(
    useCase?.seoTitle || copy.seoFallbackTitle,
    useCase?.seoDescription || copy.seoPageDescription
  );

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!useCase) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-white">{copy.notFoundTitle}</h1>
          <p className="mt-3 text-gray-400">{copy.notFoundDescription}</p>
          <Link to="/use-cases" className="mt-6 inline-block text-cyan-400 hover:text-cyan-300">
            {copy.backToList}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 bg-gray-950 min-h-screen">
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link to="/use-cases" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors inline-block mb-8">
              {copy.backToList}
            </Link>
            <div className="flex flex-wrap gap-2 mb-6">
              {useCase.tags.map((value) => (
                <Badge key={value}>{value}</Badge>
              ))}
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight">{useCase.title}</h1>
            <p className="mt-6 text-xl text-gray-400 leading-relaxed max-w-4xl">{useCase.seoDescription}</p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-3xl overflow-hidden border border-cyan-500/20 bg-gray-900">
              {useCase.coverImageUrl ? (
                <img src={useCase.coverImageUrl} alt={useCase.title} className="w-full h-[320px] sm:h-[420px] object-cover" />
              ) : (
                <div className="h-[320px] sm:h-[420px] bg-gradient-to-br from-cyan-500/10 via-gray-900 to-gray-950 flex items-center justify-center text-gray-500 text-center px-6">
                  {copy.coverFallback}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <FadeIn>
            <GlowCard>
              <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">{copy.problem}</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{useCase.problem}</p>
            </GlowCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <GlowCard>
              <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">{copy.solution}</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{useCase.solution}</p>
            </GlowCard>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeIn delay={0.15}>
              <GlowCard className="h-full">
                <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">{copy.tags}</h2>
                <div className="flex flex-wrap gap-2">
                  {useCase.tags.map((value) => (
                    <Badge key={value}>{value}</Badge>
                  ))}
                </div>
              </GlowCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlowCard className="h-full">
                <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">{copy.keywords}</h2>
                <div className="flex flex-wrap gap-2">
                  {useCase.keywords.map((value) => (
                    <span key={value} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-200 border border-gray-700">
                      {value}
                    </span>
                  ))}
                </div>
              </GlowCard>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="text-xl font-semibold text-white mb-6">{common.projectCtaText}</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
            >
              {common.getInTouch}
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}