import React, { useCallback, useRef, useState } from 'react';
import PlannerDialog from './PlannerDialog';

/**
 * Promise-based replacement for window.confirm / window.alert.
 * `ask({ title, message, confirmLabel, tone })` resolves to true or false;
 * `notify({ title, message, tone })` shows a single-button dialog.
 */
export function usePlannerDialog() {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const open = useCallback((options) => new Promise((resolve) => {
    resolverRef.current?.(false);
    resolverRef.current = resolve;
    setDialog(options);
  }), []);

  const close = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  const ask = useCallback((options) => open({ tone: 'warning', confirmLabel: 'Continue', cancelLabel: 'Cancel', ...options }), [open]);
  const notify = useCallback((options) => open({ tone: 'error', confirmLabel: 'OK', ...options, alertOnly: true }), [open]);

  const element = <PlannerDialog dialog={dialog} onClose={close} />;
  return { ask, notify, dialogElement: element };
}
