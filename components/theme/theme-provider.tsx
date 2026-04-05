"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { THEME_STORAGE_KEY, type StoredTheme, type Theme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: StoredTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(storedTheme: string | null) {
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : getSystemTheme();
}

function getAppliedTheme() {
  const root = document.documentElement;

  if (root.classList.contains("dark")) {
    return "dark";
  }

  if (root.classList.contains("light")) {
    return "light";
  }

  return resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return getAppliedTheme();
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      const nextTheme = resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY));

      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    syncTheme();

    const onMediaChange = () => {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (!storedTheme || storedTheme === "system") {
        syncTheme();
      }
    };

    mediaQuery.addEventListener("change", onMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", onMediaChange);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme(nextTheme) {
        const resolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme;

        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        setThemeState(resolvedTheme);
        applyTheme(resolvedTheme);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
