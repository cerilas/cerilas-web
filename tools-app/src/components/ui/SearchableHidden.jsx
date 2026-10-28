import React, { useEffect, useRef, useState } from 'react';

/**
 * Feature-detects browser support for `hidden="until-found"` (`onbeforematch`).
 * Returns true during SSR so pre-rendered HTML carries `hidden="until-found"`,
 * and falls back to expanded visibility on unsupported browsers (e.g. Safari)
 * so content remains searchable via Find-in-Page and accessible.
 */
export function useSupportsUntilFound() {
  const [supported, setSupported] = useState(() => {
    if (typeof HTMLElement === 'undefined') return true;
    return 'onbeforematch' in HTMLElement.prototype;
  });

  useEffect(() => {
    if (typeof HTMLElement !== 'undefined') {
      setSupported('onbeforematch' in HTMLElement.prototype);
    }
  }, []);

  return supported;
}

/**
 * Wraps collapsible accordion/disclosure content so it stays in the DOM for
 * search engine indexing, Find-in-Page (`Ctrl+F`), and URL fragment deep links.
 * Padding, borders, and backgrounds remain on the nested child element to avoid
 * visual remnants while hidden.
 */
export default function SearchableHidden({ isOpen, onReveal, id, children }) {
  const wrapperRef = useRef(null);
  const supportsUntilFound = useSupportsUntilFound();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !supportsUntilFound) return undefined;
    const handleBeforeMatch = () => {
      if (onReveal) onReveal();
    };
    el.addEventListener('beforematch', handleBeforeMatch);
    return () => el.removeEventListener('beforematch', handleBeforeMatch);
  }, [onReveal, supportsUntilFound]);

  const effectivelyOpen = Boolean(isOpen) || !supportsUntilFound;

  return (
    <div
      ref={wrapperRef}
      id={id}
      {...(!effectivelyOpen ? { hidden: 'until-found' } : {})}
    >
      {children}
    </div>
  );
}
