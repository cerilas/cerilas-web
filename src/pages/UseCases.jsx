import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { Badge, FadeIn, GlowCard } from '../components/ui';
import { useUseCases } from '../hooks/useUseCases';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { api } from '../lib/api';

function buildNextParams(searchParams, updates) {
  const next = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === '' || value == null) next.delete(key);
    else next.set(key, String(value));
  });
  return next;
}

export default function UseCases() {
  const { t, lang } = useLang();
  const copy = t.useCases;
  const common = t.common;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '');
  const [allTags, setAllTags] = useState([]);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const page = Number(searchParams.get('page') || 1);
  const q = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';

  const { loading, items, totalPages, total } = useUseCases({ page, limit: 12, q, tag });

  useEffect(() => {
    api.getUseCaseTags({ locale: lang })
      .then((data) => setAllTags(data.tags || []))
      .catch((err) => console.error('Failed to load tags:', err));
  }, [lang]);

  useSeoMeta(copy.seoPageTitle, copy.seoPageDescription);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchParams(buildNextParams(searchParams, { q: searchDraft.trim(), page: 1 }));
  };

  return (
    <div className="pt-16 bg-gray-950 min-h-screen">
      <section className="py-24 relative overflow-hidden border-b border-gray-800/60">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">{copy.title}</h1>
            <p className="mt-6 text-xl text-gray-400 leading-relaxed">{copy.subtitle}</p>
            <form onSubmit={handleSearchSubmit} className="mt-10 max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl transition-colors"
              >
                {common.search}
              </button>
            </form>
            {allTags.length > 0 && (
              <div className="mt-10">
                <div className="relative">
                  <div
                    className={`flex flex-wrap justify-center gap-2 transition-all duration-500 overflow-hidden ${
                      isTagsExpanded ? 'max-h-[1000px]' : 'max-h-[128px]'
                    }`}
                    style={
                      !isTagsExpanded && allTags.length > 12
                        ? {
                            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                          }
                        : {}
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setSearchParams(buildNextParams(searchParams, { tag: '', page: 1 }))}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        !tag
                          ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                          : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                      }`}
                    >
                      {common.allTags}
                    </button>
                    {allTags.map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setSearchParams(buildNextParams(searchParams, { tag: value, page: 1 }))}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          tag === value
                            ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                            : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                {!isTagsExpanded && allTags.length > 12 && (
                  <button
                    type="button"
                    onClick={() => setIsTagsExpanded(true)}
                    className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    + {common.showAllTags || 'Show all tags'}
                  </button>
                )}
                {isTagsExpanded && (
                  <button
                    type="button"
                    onClick={() => setIsTagsExpanded(false)}
                    className="mt-4 text-xs text-gray-500 hover:text-gray-400 font-medium transition-colors"
                  >
                    {common.showLess || 'Show less'}
                  </button>
                )}
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 text-sm text-gray-500">
            <span>{copy.resultCount.replace('{count}', String(total))}</span>
            {tag && <span>{copy.activeTag.replace('{tag}', tag)}</span>}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg mb-2">{common.noResults}</p>
              <p className="text-sm">{copy.noResultsDescription}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item, index) => (
                  <FadeIn key={item.id} delay={index * 0.05}>
                    <Link to={`/use-cases/${item.slug}`} className="block h-full">
                      <GlowCard className="h-full overflow-hidden flex flex-col p-0">
                        <div className="aspect-[16/10] bg-gray-900 border-b border-gray-800 overflow-hidden">
                          {item.coverImageUrl ? (
                            <img
                              src={item.coverImageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500/10 via-gray-900 to-gray-950 flex items-center justify-center text-sm text-gray-500 px-6 text-center">
                              {copy.coverFallback}
                            </div>
                          )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {item.tags.slice(0, 3).map((value) => (
                              <Badge key={value}>{value}</Badge>
                            ))}
                          </div>
                          <h2 className="text-xl font-bold text-white leading-tight line-clamp-2 min-h-14">{item.title}</h2>
                          <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-3 flex-1">{item.seoDescription}</p>
                          <div className="mt-4 flex items-center justify-end text-sm">
                            <span className="text-cyan-400 font-medium">{common.readMore} →</span>
                          </div>
                        </div>
                      </GlowCard>
                    </Link>
                  </FadeIn>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setSearchParams(buildNextParams(searchParams, { page: page - 1 }))}
                    className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-500"
                  >
                    {copy.previous}
                  </button>
                  <span className="text-sm text-gray-500">{copy.pageLabel.replace('{page}', String(page)).replace('{totalPages}', String(totalPages))}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setSearchParams(buildNextParams(searchParams, { page: page + 1 }))}
                    className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-500"
                  >
                    {copy.next}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}