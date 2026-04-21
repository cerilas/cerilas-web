import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useLang } from '../context/LanguageContext';

function mapUseCase(row, lang) {
  const locale = lang === 'en' ? 'en' : 'tr';
  return {
    id: row.id,
    slug: row.slug,
    title: row[`title_${locale}`],
    problem: row[`problem_${locale}`],
    solution: row[`solution_${locale}`],
    seoTitle: row[`seo_title_${locale}`] || row[`title_${locale}`],
    seoDescription: row[`seo_description_${locale}`] || row[`problem_${locale}`]?.slice(0, 160) || '',
    coverImageUrl: row.cover_image_url,
    tags: row[`tags_${locale}`] || [],
    keywords: row[`keywords_${locale}`] || [],
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useUseCases(params = {}) {
  const { lang } = useLang();
  const page = params.page || 1;
  const limit = params.limit || 12;
  const q = params.q || '';
  const tag = params.tag || '';
  const requestParams = useMemo(
    () => ({ page, limit, q, tag, locale: lang }),
    [lang, limit, page, q, tag]
  );
  const queryKey = useMemo(
    () => JSON.stringify({ page, limit, q, tag, lang }),
    [lang, limit, page, q, tag]
  );
  const [state, setState] = useState({ loadedKey: '', items: [], total: 0, totalPages: 1, page: 1, limit: 12 });

  useEffect(() => {
    let cancelled = false;

    api.getUseCases(requestParams)
      .then((data) => {
        if (cancelled) return;
        setState({
          loadedKey: queryKey,
          items: (data.items || []).map((item) => mapUseCase(item, lang)),
          total: data.total || 0,
          totalPages: data.totalPages || 1,
          page: data.page || 1,
          limit: data.limit || 12,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loadedKey: queryKey, items: [], total: 0, totalPages: 1, page: 1, limit: 12 });
      });

    return () => {
      cancelled = true;
    };
  }, [lang, queryKey, requestParams]);

  return { ...state, loading: state.loadedKey !== queryKey };
}

export function useUseCase(slug) {
  const { lang } = useLang();
  const [useCase, setUseCase] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    api.getUseCase(slug)
      .then((row) => {
        if (!cancelled) setUseCase(mapUseCase(row, lang));
      })
      .catch(() => {
        if (!cancelled) setUseCase(null);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  if (useCase === undefined) return { loading: true, useCase: null };
  if (useCase === null) return { loading: false, useCase: null };
  return { loading: false, useCase };
}