"use client";

import { useEffect } from "react";
import { THEMES, useThemePref } from "@/hooks/useLocalPref";

const LABEL = { system: "Auto", light: "Light", dark: "Dark" } as const;

/** Auto follows the OS; Light/Dark set data-theme on <html>. */
export function ThemeToggle() {
  const [theme, setTheme] = useThemePref();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span>Theme</span>
      <div role="group" aria-label="Color theme" className="inline-flex rounded-full border border-line bg-surface-2 p-0.5">
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={theme === t}
            onClick={() => setTheme(t)}
            className="cursor-pointer rounded-full px-2.5 py-0.5 font-mono text-[11.5px] text-ink-2 aria-pressed:bg-accent aria-pressed:text-accent-ink"
          >
            {LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Runs before first paint so a saved theme never flashes. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("sclab-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
