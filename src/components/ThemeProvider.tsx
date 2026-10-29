import { useEffect } from "react";
import { COLOR_THEMES, usePreferences } from "@/store/preferences";

function resolveAuto(): "light" | "dark" {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorTheme, themeMode } = usePreferences();

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const mode = themeMode === "auto" ? resolveAuto() : themeMode;
      root.classList.toggle("dark", mode === "dark");
    };
    apply();
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    const t = COLOR_THEMES[colorTheme];
    root.style.setProperty("--primary", t.primary);
    root.style.setProperty("--accent", t.accent);
  }, [colorTheme]);

  return <>{children}</>;
}
