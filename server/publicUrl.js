import process from 'node:process';

export const DEFAULT_PUBLIC_URL = 'https://cerilas.com';

export const normalizePublicUrl = (value) => {
  const candidate = String(value || DEFAULT_PUBLIC_URL).trim();

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return DEFAULT_PUBLIC_URL;
    if (url.hostname.toLowerCase() === 'www.cerilas.com') {
      url.hostname = 'cerilas.com';
    }
    return url.origin;
  } catch {
    return DEFAULT_PUBLIC_URL;
  }
};

export const getPublicUrl = () => normalizePublicUrl(process.env.PUBLIC_URL);

export const getDocumentShareUrl = (token) => (
  `${getPublicUrl()}/shared/document/${encodeURIComponent(String(token || ''))}`
);
