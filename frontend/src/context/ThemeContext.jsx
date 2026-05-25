import { createContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "ticketor.theme";

export const ThemeContext = createContext(null);

function resolveInitialTheme() {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => {
    return {
      theme,
      isLightMode: theme === "light",
      isDarkMode: theme === "dark",
      setTheme,
      toggleTheme() {
        setTheme((currentTheme) =>
          currentTheme === "dark" ? "light" : "dark"
        );
      },
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
