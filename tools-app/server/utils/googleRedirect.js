const CALLBACK_PATH = '/api/auth/google/callback';

const isLocalHost = (host) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(String(host || '').trim());

function firstHeaderValue(value) {
  return String(value || '').split(',')[0].trim();
}

export function getRequestOrigin(req) {
  const proto = firstHeaderValue(req.get('x-forwarded-proto')) || req.protocol || 'https';
  const host = firstHeaderValue(req.get('x-forwarded-host')) || req.get('host');
  return host ? `${proto}://${host}` : null;
}

/**
 * Google must send users back to the host they started on. A localhost
 * GOOGLE_REDIRECT_URI copied from a dev .env would strand production users,
 * so it is only honoured for requests that also come from localhost.
 */
export function resolveGoogleRedirectUri(req) {
  const configured = process.env.GOOGLE_REDIRECT_URI;
  if (!req) return configured;

  const requestHost = firstHeaderValue(req.get('x-forwarded-host')) || req.get('host');
  if (configured) {
    try {
      const configuredHost = new URL(configured).host;
      if (!isLocalHost(configuredHost) || isLocalHost(requestHost)) return configured;
    } catch {
      // Malformed value: fall through to the request origin.
    }
  }

  const origin = getRequestOrigin(req);
  return origin ? `${origin}${CALLBACK_PATH}` : configured;
}
