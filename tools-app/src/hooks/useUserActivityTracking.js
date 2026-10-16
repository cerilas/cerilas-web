import { useEffect } from 'react';

const SESSION_KEY = 'cerilas_activity_session';
const HEARTBEAT_MS = 60 * 1000;
const EXCLUDED_PREFIXES = ['/admin', '/reset-password'];
const ROUTE_EVENT = 'cerilas:routechange';

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 64);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Query strings are dropped on purpose: they can carry tokens (e.g. password reset links).
function currentPath() {
  const { pathname, hash } = window.location;
  const hashPath = hash.startsWith('#/') ? hash.split('?')[0] : '';
  return `${pathname}${hashPath}`.slice(0, 500) || '/';
}

let historyPatched = false;
function patchHistory() {
  if (historyPatched) return;
  historyPatched = true;
  for (const method of ['pushState', 'replaceState']) {
    const original = window.history[method];
    window.history[method] = function patched(...args) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event(ROUTE_EVENT));
      return result;
    };
  }
}

/**
 * Records page views and active time for the signed-in user (admin "Users" analytics).
 */
export default function useUserActivityTracking(token) {
  useEffect(() => {
    if (!token || typeof window === 'undefined') return undefined;
    patchHistory();

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const sessionId = getSessionId();
    let current = null;

    const sendDuration = (view) => {
      view.idPromise.then((id) => {
        if (!id) return;
        fetch(`/api/auth/activity/pageview/${id}/duration`, {
          method: 'POST',
          headers,
          keepalive: true,
          body: JSON.stringify({ durationMs: view.activeMs, title: document.title })
        }).catch(() => {});
      });
    };

    const accumulate = (view, keepRunning) => {
      if (view.visibleSince) {
        const now = Date.now();
        view.activeMs += now - view.visibleSince;
        view.visibleSince = keepRunning ? now : null;
      }
    };

    const start = (path) => {
      if (EXCLUDED_PREFIXES.some(prefix => path.startsWith(prefix))) {
        current = null;
        return;
      }
      const idPromise = fetch('/api/auth/activity/pageview', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          path,
          title: document.title,
          referrer: document.referrer || null,
          sessionId
        })
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => data?.id || null)
        .catch(() => null);
      current = {
        path,
        idPromise,
        activeMs: 0,
        visibleSince: document.visibilityState === 'visible' ? Date.now() : null
      };
    };

    const handleRouteChange = () => {
      const path = currentPath();
      if (current && current.path === path) return;
      if (current) {
        accumulate(current, false);
        sendDuration(current);
      }
      start(path);
    };

    const handleVisibility = () => {
      if (!current) return;
      if (document.visibilityState === 'hidden') {
        accumulate(current, false);
        sendDuration(current);
      } else if (!current.visibleSince) {
        current.visibleSince = Date.now();
      }
    };

    const handlePageHide = () => {
      if (!current) return;
      accumulate(current, false);
      sendDuration(current);
    };

    const heartbeat = window.setInterval(() => {
      if (current && current.visibleSince) {
        accumulate(current, true);
        sendDuration(current);
      }
    }, HEARTBEAT_MS);

    handleRouteChange();
    window.addEventListener(ROUTE_EVENT, handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener(ROUTE_EVENT, handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      if (current) {
        accumulate(current, false);
        sendDuration(current);
      }
    };
  }, [token]);
}
