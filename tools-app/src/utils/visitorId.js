/**
 * Visitor ID Manager for Cerilas Tools.
 * Generates and preserves a persistent unique cookie (cerilas_vid) for each unique visitor.
 * Also synchronizes with localStorage for cross-session resilience.
 */

const COOKIE_NAME = 'cerilas_vid';
const COOKIE_DAYS = 365;

export function getOrCreateVisitorId() {
  if (typeof window === 'undefined') return null;

  // 1. Check existing cookie
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
  if (match && match[2]) {
    const id = match[2];
    // Sync localStorage
    try {
      localStorage.setItem(COOKIE_NAME, id);
    } catch (e) {}
    return id;
  }

  // 2. Check localStorage fallback
  try {
    const stored = localStorage.getItem(COOKIE_NAME);
    if (stored) {
      setCookie(COOKIE_NAME, stored, COOKIE_DAYS);
      return stored;
    }
  } catch (e) {}

  // 3. Generate new unique visitor ID
  const newId = 'vid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
  setCookie(COOKIE_NAME, newId, COOKIE_DAYS);
  try {
    localStorage.setItem(COOKIE_NAME, newId);
  } catch (e) {}

  return newId;
}

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = '; expires=' + date.toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}
