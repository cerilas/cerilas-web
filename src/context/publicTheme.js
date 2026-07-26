import { createContext, useContext } from "react";

export const PublicThemeContext = createContext(null);

export function usePublicTheme() {
  const context = useContext(PublicThemeContext);

  if (!context) {
    throw new Error("usePublicTheme must be used within PublicThemeProvider");
  }

  return context;
}
