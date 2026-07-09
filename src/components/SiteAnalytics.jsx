import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const VISITOR_KEY = 'cerilas_visitor_id';
const SESSION_KEY = 'cerilas_session_id';
const SESSION_START_KEY = 'cerilas_session_start';
const SESSION_ENGAGED_KEY = 'cerilas_session_engaged_seconds';
const ACTIVE_WINDOW_MS = 60 * 1000;

const randomId = (prefix) => {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = randomId('v');
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

const getSessionId = () => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = randomId('s');
    sessionStorage.setItem(SESSION_KEY, id);
    sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    sessionStorage.setItem(SESSION_ENGAGED_KEY, '0');
  }
  if (!sessionStorage.getItem(SESSION_START_KEY)) {
    sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
  }
  if (!sessionStorage.getItem(SESSION_ENGAGED_KEY)) {
    sessionStorage.setItem(SESSION_ENGAGED_KEY, '0');
  }
  return id;
};

const postEvent = (payload, useBeacon = false) => {
  const body = JSON.stringify(payload);
  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/event', blob);
    return;
  }

  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
};

export default function SiteAnalytics() {
  const location = useLocation();
  const lastPathRef = useRef('');
  const identityRef = useRef(null);

  const getIdentity = () => {
    if (!identityRef.current) {
      identityRef.current = {
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
      };
    }
    return identityRef.current;
  };

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const identity = getIdentity();
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    if (lastPathRef.current === fullPath) return;
    lastPathRef.current = fullPath;

    postEvent({
      ...identity,
      event_type: 'page_view',
      path: fullPath,
      page_title: document.title,
      referrer: document.referrer,
      metadata: {
        language: document.documentElement.lang,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    });
  }, [location]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const identity = getIdentity();

    const handleClick = (event) => {
      if (location.pathname.startsWith('/admin')) return;
      const target = event.target?.closest?.('a,button,[role="button"]');
      if (!target) return;

      const text = target.innerText || target.getAttribute('aria-label') || target.getAttribute('title') || '';
      postEvent({
        ...identity,
        event_type: 'click',
        path: `${location.pathname}${location.search}${location.hash}`,
        page_title: document.title,
        element_tag: target.tagName?.toLowerCase(),
        element_text: text.replace(/\s+/g, ' ').trim().slice(0, 240),
        element_href: target.href || target.getAttribute('href') || '',
      });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [location]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const identity = getIdentity();
    let lastActivityAt = Date.now();
    let lastTickAt = Date.now();

    const sendDuration = (useBeacon = false) => {
      const now = Date.now();
      const previousEngagedSeconds = Number(sessionStorage.getItem(SESSION_ENGAGED_KEY) || 0);
      const elapsedSeconds = Math.max(0, Math.min(30, Math.round((now - lastTickAt) / 1000)));
      const isRecentlyActive = document.visibilityState === 'visible' && now - lastActivityAt <= ACTIVE_WINDOW_MS;
      const duration = previousEngagedSeconds + (isRecentlyActive ? elapsedSeconds : 0);
      lastTickAt = now;
      sessionStorage.setItem(SESSION_ENGAGED_KEY, String(duration));

      if (!useBeacon && duration === previousEngagedSeconds && document.visibilityState !== 'visible') return;

      postEvent({
        ...identity,
        event_type: 'session_duration',
        path: `${location.pathname}${location.search}${location.hash}`,
        page_title: document.title,
        duration_seconds: duration,
      }, useBeacon);
    };

    const markActivity = () => {
      lastActivityAt = Date.now();
    };

    const interval = window.setInterval(() => sendDuration(false), 30000);
    const handlePageHide = () => sendDuration(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markActivity();
        lastTickAt = Date.now();
      } else {
        sendDuration(true);
      }
    };

    ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [location]);

  return null;
}
