import { useMemo, useState } from "react";
import { PublicThemeContext } from "./publicTheme";

const STORAGE_KEY = "cerilas-public-theme-v3";

function getStoredTheme() {
  if (typeof window === "undefined") return "light";
  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "light";
}

export function PublicThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme);
  const resolvedTheme = theme;

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme) => {
        const safeTheme = nextTheme === "dark" ? "dark" : "light";
        setTheme(safeTheme);
        window.localStorage.setItem(STORAGE_KEY, safeTheme);
      },
      toggleTheme: () => {
        const nextTheme = resolvedTheme === "light" ? "dark" : "light";
        setTheme(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      },
    }),
    [resolvedTheme, theme],
  );

  return <PublicThemeContext.Provider value={value}>{children}</PublicThemeContext.Provider>;
}
