import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrCreateVisitorId } from '../utils/visitorId';
import { getConversionCount, getConversionLabel } from '../utils/toolMetrics';

/**
 * Shared analytics and real-time conversion stats hook for all tools.
 * Automatically tracks unique views using persistent visitor cookies,
 * fetches & synchronizes live DB stats, and records tool-specific conversion actions.
 */
export function useToolAnalytics(toolSlug, initialMeta = null) {
  const hasTrackedView = useRef(false);
  const [stats, setStats] = useState(initialMeta || null);

  // Keep stats in sync if initialMeta changes
  useEffect(() => {
    if (initialMeta) {
      setStats((prev) => ({
        ...initialMeta,
        ...prev
      }));
    }
  }, [initialMeta]);

  // Listen to global stats update events
  useEffect(() => {
    const handleStatsUpdated = (e) => {
      const detail = e.detail;
      if (detail?.slug === toolSlug && detail?.stats) {
        setStats((prev) => ({
          ...prev,
          ...detail.stats
        }));
      }
    };

    window.addEventListener('tool_stats_updated', handleStatsUpdated);
    window.addEventListener('cerilas:tool-stats-updated', handleStatsUpdated);
    return () => {
      window.removeEventListener('tool_stats_updated', handleStatsUpdated);
      window.removeEventListener('cerilas:tool-stats-updated', handleStatsUpdated);
    };
  }, [toolSlug]);

  const trackAction = useCallback(async (eventType, metadata = {}) => {
    if (!toolSlug) return null;
    try {
      const visitorId = getOrCreateVisitorId();
      const isWebDriver = typeof navigator !== 'undefined' ? Boolean(navigator.webdriver) : false;
      const res = await fetch(`/api/tools/${toolSlug}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventType, 
          visitorId,
          metadata: {
            ...metadata,
            isWebDriver
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats((prev) => ({
            ...prev,
            ...data.stats
          }));
          window.dispatchEvent(new CustomEvent('tool_stats_updated', {
            detail: { slug: toolSlug, eventType, stats: data.stats }
          }));
          window.dispatchEvent(new CustomEvent('cerilas:tool-stats-updated', {
            detail: { slug: toolSlug, eventType, stats: data.stats }
          }));
        }
        return data.stats;
      }
    } catch (err) {
      console.warn(`[Analytics] Failed to track ${eventType}:`, err);
    }
    return null;
  }, [toolSlug]);

  // Track unique view once per session/mount
  useEffect(() => {
    if (!toolSlug || hasTrackedView.current) return;

    hasTrackedView.current = true;
    trackAction('view', { timestamp: new Date().toISOString() });
  }, [toolSlug, trackAction]);

  const visitorCount = stats?.unique_visitors_count || 0;
  const conversionCount = getConversionCount({ slug: toolSlug, ...stats });

  return { 
    stats,
    visitorCount,
    conversionCount,
    getConversionLabel: (lang = 'en') => getConversionLabel(toolSlug, conversionCount, lang),
    trackAction,
    trackUse: (meta) => trackAction('use', meta),
    trackDownload: (meta) => trackAction('download', meta),
    trackCopy: (meta) => trackAction('copy', meta)
  };
}
