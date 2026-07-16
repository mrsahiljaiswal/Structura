/**
 * Purpose: Theme Switcher Component for Structura
 * Toggles class names on document element and stores choice in localStorage.
 */

import React, { useEffect, useState } from "react";
import { Sun, Moon, Eye, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark" | "high-contrast" | "system";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    // Initial theme load
    const savedTheme = localStorage.getItem("structura-theme") as ThemeMode | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("dark"); // Default theme
    }
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove("dark", "high-contrast");

    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "high-contrast") {
      root.classList.add("high-contrast");
    } else if (mode === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) root.classList.add("dark");
    }

    localStorage.setItem("structura-theme", mode);
  };

  const cycleTheme = () => {
    let nextTheme: ThemeMode = "dark";
    if (theme === "dark") nextTheme = "light";
    else if (theme === "light") nextTheme = "high-contrast";
    else if (theme === "high-contrast") nextTheme = "system";
    else nextTheme = "dark";

    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="rounded-xl relative text-zinc-400 hover:text-foreground"
      aria-label={`Cycle theme. Current: ${theme}`}
    >
      {theme === "light" && <Sun className="h-5 w-5" />}
      {theme === "dark" && <Moon className="h-5 w-5" />}
      {theme === "high-contrast" && <Eye className="h-5 w-5 text-indigo-400" />}
      {theme === "system" && <Monitor className="h-5 w-5" />}
    </Button>
  );
}
