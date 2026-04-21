import { useEffect } from 'react';

function ensureMetaDescriptionTag() {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  return tag;
}

export function useSeoMeta(title, description = '') {
  useEffect(() => {
    const previousTitle = document.title;
    const metaTag = ensureMetaDescriptionTag();
    const previousDescription = metaTag.getAttribute('content') || '';

    document.title = title;
    metaTag.setAttribute('content', description);

    return () => {
      document.title = previousTitle;
      metaTag.setAttribute('content', previousDescription);
    };
  }, [title, description]);
}