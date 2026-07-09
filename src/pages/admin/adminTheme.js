import { useCallback, useEffect, useMemo, useState } from 'react';

export const ADMIN_THEME_STORAGE_KEY = 'admin_theme_preference';

export const adminThemeOptions = [
  { value: 'auto', label: 'Oto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
const themeClasses = ['admin-theme-light', 'admin-theme-dark'];
const ADMIN_THEME_STYLE_ID = 'admin-theme-runtime-overrides';

const lightThemeRuntimeCss = `
  [data-admin-theme="light"] { color: #0f172a !important; color-scheme: light; --admin-chart-accent: #2563eb; --admin-chart-secondary: #16a34a; --admin-chart-axis: #94a3b8; --admin-chart-grid: rgb(203 213 225 / 0.82); --admin-chart-cursor: #94a3b8; --admin-chart-active-dot-stroke: #ffffff; --admin-chart-tooltip-bg: #ffffff; --admin-chart-tooltip-border: rgb(226 232 240 / 0.95); --admin-chart-tooltip-text: #0f172a; --admin-chart-tooltip-muted: #64748b; --admin-chart-tooltip-shadow: 0 16px 34px rgb(15 23 42 / 0.10); }
  [data-admin-theme="light"], [data-admin-theme="light"] body { background: #f8fafc !important; }
  [data-admin-theme="light"] .bg-gray-950, [data-admin-theme="light"].bg-gray-950, [data-admin-theme="light"] .bg-gray-950\\/80, [data-admin-theme="light"] .bg-gray-950\\/95 { background-color: #f8fafc !important; }
  [data-admin-theme="light"] .bg-gray-900, [data-admin-theme="light"].bg-gray-900, [data-admin-theme="light"] .bg-gray-900\\/30, [data-admin-theme="light"] .bg-gray-900\\/45, [data-admin-theme="light"] .bg-gray-900\\/50, [data-admin-theme="light"] .bg-gray-900\\/60, [data-admin-theme="light"] .bg-gray-900\\/80 { background-color: #ffffff !important; }
  [data-admin-theme="light"] .bg-gray-800, [data-admin-theme="light"].bg-gray-800, [data-admin-theme="light"] .bg-gray-800\\/30, [data-admin-theme="light"] .bg-gray-800\\/50, [data-admin-theme="light"] .bg-gray-800\\/60, [data-admin-theme="light"] .bg-gray-800\\/80 { background-color: #f1f5f9 !important; }
  [data-admin-theme="light"] .bg-gray-700, [data-admin-theme="light"].bg-gray-700 { background-color: #e2e8f0 !important; }
  [data-admin-theme="light"] .border-gray-800, [data-admin-theme="light"].border-gray-800, [data-admin-theme="light"] .border-gray-700, [data-admin-theme="light"].border-gray-700, [data-admin-theme="light"] .border-gray-600, [data-admin-theme="light"].border-gray-600 { border-color: rgb(226 232 240 / 0.58) !important; }
  [data-admin-theme="light"] .border-gray-800\\/50, [data-admin-theme="light"] .border-gray-800\\/60, [data-admin-theme="light"] .border-gray-800\\/70, [data-admin-theme="light"] .border-gray-700\\/50 { border-color: rgb(226 232 240 / 0.34) !important; }
  [data-admin-theme="light"] .text-white, [data-admin-theme="light"].text-white, [data-admin-theme="light"] .text-gray-100, [data-admin-theme="light"].text-gray-100, [data-admin-theme="light"] .text-gray-200, [data-admin-theme="light"].text-gray-200 { color: #0f172a !important; }
  [data-admin-theme="light"] .text-gray-300, [data-admin-theme="light"].text-gray-300 { color: #334155 !important; }
  [data-admin-theme="light"] .text-gray-400, [data-admin-theme="light"].text-gray-400, [data-admin-theme="light"] .text-gray-500, [data-admin-theme="light"].text-gray-500 { color: #475569 !important; }
  [data-admin-theme="light"] .text-gray-600, [data-admin-theme="light"].text-gray-600 { color: #64748b !important; }
  [data-admin-theme="light"] .bg-cyan-400, [data-admin-theme="light"] .bg-cyan-500, [data-admin-theme="light"] .bg-cyan-600 { background-color: #2563eb !important; color: #ffffff !important; }
  [data-admin-theme="light"] .hover\\:bg-cyan-300:hover, [data-admin-theme="light"] .hover\\:bg-cyan-400:hover, [data-admin-theme="light"] .hover\\:bg-cyan-500:hover { background-color: #1d4ed8 !important; color: #ffffff !important; }
  [data-admin-theme="light"] .admin-brand-panel { background-color: #111827 !important; border-color: #1f2937 !important; color: #f9fafb !important; box-shadow: none !important; }
  [data-admin-theme="light"] .admin-brand-panel .text-gray-400 { color: #9ca3af !important; }
  [data-admin-theme="light"] .admin-brand-panel .hover\\:text-white:hover { color: #ffffff !important; }
  [data-admin-theme="light"] .admin-brand-panel .theme-switcher { background-color: rgb(3 7 18 / 0.72) !important; border-color: #374151 !important; box-shadow: none !important; }
  [data-admin-theme="light"] .admin-brand-panel .theme-switcher-compact { color: #9ca3af !important; }
  [data-admin-theme="light"] .admin-brand-panel .theme-switcher-compact:hover { background-color: rgb(255 255 255 / 0.08) !important; color: #ffffff !important; }
  [data-admin-theme="light"] .admin-brand-panel .theme-option { color: #9ca3af !important; }
  [data-admin-theme="light"] .admin-brand-panel .theme-option:hover { background-color: rgb(255 255 255 / 0.08) !important; color: #ffffff !important; }
  [data-admin-theme="light"] .admin-brand-panel .theme-option-active { background-color: #2563eb !important; color: #ffffff !important; box-shadow: none !important; }
  [data-admin-theme="light"] .theme-switcher { background-color: #f1f5f9 !important; border: 1px solid rgb(226 232 240 / 0.75) !important; box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.75), 0 1px 2px rgb(15 23 42 / 0.04) !important; }
  [data-admin-theme="light"] .theme-switcher-compact { color: #475569 !important; }
  [data-admin-theme="light"] .theme-switcher-compact:hover { background-color: #e2e8f0 !important; color: #2563eb !important; }
  [data-admin-theme="light"] .theme-option { color: #64748b !important; }
  [data-admin-theme="light"] .theme-option:hover { background-color: #ffffff !important; color: #1e293b !important; }
  [data-admin-theme="light"] .theme-option-active { background-color: #ffffff !important; color: #2563eb !important; box-shadow: 0 1px 2px rgb(15 23 42 / 0.08), 0 0 0 1px rgb(37 99 235 / 0.10) !important; }
  [data-admin-theme="light"] .bg-blue-500, [data-admin-theme="light"] .bg-blue-600, [data-admin-theme="light"] .bg-purple-500, [data-admin-theme="light"] .bg-purple-600, [data-admin-theme="light"] .bg-red-500, [data-admin-theme="light"] .bg-red-600, [data-admin-theme="light"] .bg-green-500, [data-admin-theme="light"] .bg-green-600, [data-admin-theme="light"] .bg-orange-500, [data-admin-theme="light"] .bg-orange-600 { color: #ffffff !important; }
  [data-admin-theme="light"] .bg-cyan-500\\/10, [data-admin-theme="light"] .bg-cyan-500\\/20, [data-admin-theme="light"] .bg-cyan-600\\/20, [data-admin-theme="light"] .bg-cyan-900\\/50 { color: #1d4ed8 !important; background-color: rgb(37 99 235 / 0.09) !important; }
  [data-admin-theme="light"] .text-cyan-200, [data-admin-theme="light"] .text-cyan-300, [data-admin-theme="light"] .text-cyan-400, [data-admin-theme="light"] .text-cyan-500 { color: #2563eb !important; }
  [data-admin-theme="light"] .border-cyan-300, [data-admin-theme="light"] .border-cyan-400\\/30, [data-admin-theme="light"] .border-cyan-500, [data-admin-theme="light"] .border-cyan-500\\/20, [data-admin-theme="light"] .border-cyan-500\\/30, [data-admin-theme="light"] .border-cyan-500\\/40, [data-admin-theme="light"] .border-cyan-800 { border-color: rgb(37 99 235 / 0.24) !important; }
  [data-admin-theme="light"] .bg-red-500\\/10, [data-admin-theme="light"] .bg-red-400\\/10 { color: #dc2626 !important; background-color: rgb(239 68 68 / 0.10) !important; }
  [data-admin-theme="light"] .bg-green-500\\/10, [data-admin-theme="light"] .bg-green-500\\/15 { color: #15803d !important; background-color: rgb(34 197 94 / 0.10) !important; }
  [data-admin-theme="light"] .bg-purple-500\\/10, [data-admin-theme="light"] .bg-purple-500\\/20 { color: #7e22ce !important; background-color: rgb(168 85 247 / 0.10) !important; }
  [data-admin-theme="light"] .bg-orange-500\\/10 { color: #c2410c !important; background-color: rgb(249 115 22 / 0.10) !important; }
  [data-admin-theme="light"] .opportunity-note, [data-admin-theme="light"] .text-amber-200\\/80, [data-admin-theme="light"] .text-amber-400, [data-admin-theme="light"] .text-amber-500, [data-admin-theme="light"] .text-yellow-300, [data-admin-theme="light"] .text-yellow-400, [data-admin-theme="light"] .text-yellow-500 { color: #92400e !important; }
  [data-admin-theme="light"] .bg-amber-500\\/10, [data-admin-theme="light"] .bg-amber-500\\/20, [data-admin-theme="light"] .bg-yellow-500\\/10, [data-admin-theme="light"] .bg-yellow-500\\/20 { color: #92400e !important; background-color: rgb(245 158 11 / 0.12) !important; }
  [data-admin-theme="light"] .placeholder-gray-500::placeholder { color: #64748b !important; }
  [data-admin-theme="light"] .font-black { font-weight: 650 !important; }
  [data-admin-theme="light"] .font-bold { font-weight: 600 !important; }
  [data-admin-theme="light"] .font-semibold { font-weight: 520 !important; }
  [data-admin-theme="light"] .font-medium { font-weight: 450 !important; }
  [data-admin-theme="light"] .bg-gray-900.border, [data-admin-theme="light"] .bg-gray-800.border, [data-admin-theme="light"] .bg-gray-950\\/80.border { box-shadow: 0 1px 2px rgb(15 23 42 / 0.035), 0 12px 28px rgb(15 23 42 / 0.025) !important; }
  [data-admin-theme="light"] .pomodoro-panel { border-color: rgb(226 232 240 / 0.42) !important; box-shadow: 0 1px 2px rgb(15 23 42 / 0.035) !important; }
  [data-admin-theme="light"] .pomodoro-panel .border-gray-800, [data-admin-theme="light"] .pomodoro-panel .border-gray-700, [data-admin-theme="light"] .pomodoro-panel .border-gray-700\\/50 { border-color: rgb(226 232 240 / 0.34) !important; }
  [data-admin-theme="light"] .pomodoro-hover-tooltip { background-color: #ffffff !important; border-color: rgb(226 232 240 / 0.95) !important; color: #0f172a !important; box-shadow: 0 16px 34px rgb(15 23 42 / 0.10) !important; }
  [data-admin-theme="light"] .pomodoro-hover-tooltip-arrow { background-color: #ffffff !important; border-color: rgb(226 232 240 / 0.95) !important; }
  [data-admin-theme="light"] .pomodoro-range-switcher { background-color: #f8fafc !important; border-color: rgb(226 232 240 / 0.78) !important; box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.86), 0 1px 2px rgb(15 23 42 / 0.035) !important; }
  [data-admin-theme="light"] .pomodoro-range-option { color: #64748b !important; }
  [data-admin-theme="light"] .pomodoro-range-option:hover { background-color: #ffffff !important; color: #1e293b !important; }
  [data-admin-theme="light"] .pomodoro-range-option-active { color: #ffffff !important; box-shadow: none !important; }
  [data-admin-theme="light"] .pomodoro-range-active-bg { background: #2563eb !important; box-shadow: 0 1px 2px rgb(37 99 235 / 0.20) !important; }
  [data-admin-theme="light"] input.bg-gray-800, [data-admin-theme="light"] textarea.bg-gray-800, [data-admin-theme="light"] select.bg-gray-800, [data-admin-theme="light"] input.bg-gray-950\\/80, [data-admin-theme="light"] textarea.bg-gray-950\\/80, [data-admin-theme="light"] select.bg-gray-950\\/80 { background-color: #ffffff !important; color: #0f172a !important; }
`;

function syncRuntimeThemeStyle(resolvedTheme) {
  const existingStyle = document.getElementById(ADMIN_THEME_STYLE_ID);
  if (resolvedTheme !== 'light') {
    existingStyle?.remove();
    return;
  }

  const style = existingStyle || document.createElement('style');
  style.id = ADMIN_THEME_STYLE_ID;
  style.textContent = lightThemeRuntimeCss;
  if (!existingStyle) document.head.appendChild(style);
}

function applyAdminTheme(resolvedTheme) {
  document.documentElement.classList.remove(...themeClasses);
  document.body.classList.remove(...themeClasses);
  document.documentElement.classList.add(`admin-theme-${resolvedTheme}`);
  document.body.classList.add(`admin-theme-${resolvedTheme}`);
  document.documentElement.dataset.adminTheme = resolvedTheme;
  document.body.dataset.adminTheme = resolvedTheme;
  syncRuntimeThemeStyle(resolvedTheme);
}

function clearAdminTheme() {
  document.documentElement.classList.remove(...themeClasses);
  document.body.classList.remove(...themeClasses);
  delete document.documentElement.dataset.adminTheme;
  delete document.body.dataset.adminTheme;
  syncRuntimeThemeStyle('dark');
}

export function setAdminThemePreference(nextTheme) {
  const safeTheme = adminThemeOptions.some((option) => option.value === nextTheme) ? nextTheme : 'auto';
  localStorage.setItem(ADMIN_THEME_STORAGE_KEY, safeTheme);
  applyAdminTheme(getResolvedAdminTheme(safeTheme));
  return safeTheme;
}

export function getResolvedAdminTheme(theme) {
  if (theme === 'auto') {
    return prefersDark() ? 'dark' : 'light';
  }
  return theme === 'light' ? 'light' : 'dark';
}

export function useAdminTheme() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    return adminThemeOptions.some((option) => option.value === savedTheme) ? savedTheme : 'auto';
  });
  const [systemTheme, setSystemTheme] = useState(() => (prefersDark() ? 'dark' : 'light'));

  useEffect(() => {
    const resolved = getResolvedAdminTheme(theme);

    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
    applyAdminTheme(resolved);

    if (theme !== 'auto') {
      return clearAdminTheme;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const nextSystemTheme = mediaQuery.matches ? 'dark' : 'light';
      setSystemTheme(nextSystemTheme);
      applyAdminTheme(nextSystemTheme);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearAdminTheme();
    };
  }, [theme]);

  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') return systemTheme;
    return theme === 'light' ? 'light' : 'dark';
  }, [systemTheme, theme]);

  const updateTheme = useCallback((nextTheme) => {
    const safeTheme = setAdminThemePreference(nextTheme);
    setTheme(safeTheme);
  }, []);

  return { theme, setTheme: updateTheme, resolvedTheme };
}
