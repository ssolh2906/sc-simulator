"use client";

import { useSyncExternalStore } from "react";

/** Tokens canvas charts need as concrete colors (SVG charts use var() directly). */
const TOKENS = [
  "--bg", "--surface", "--surface-2", "--ink", "--ink-2", "--muted", "--line", "--accent", "--accent-soft",
  "--healthy", "--nonvent", "--ards", "--up", "--down", "--good", "--warn", "--seq0", "--seq1",
  "--ct-cd4t", "--ct-cd8t", "--ct-gdt", "--ct-nk", "--ct-b", "--ct-pb", "--ct-cd14", "--ct-cd16",
  "--ct-pdc", "--ct-cdc", "--ct-neut", "--ct-junk",
] as const;

export type ThemeColors = Record<(typeof TOKENS)[number], string> & { fontMono: string; fontSans: string };

function compute(): ThemeColors {
  const cs = getComputedStyle(document.documentElement);
  const out = Object.fromEntries(TOKENS.map((t) => [t, cs.getPropertyValue(t).trim() || "#888"])) as ThemeColors;
  out.fontMono = cs.getPropertyValue("--font-plex-mono").trim() || "ui-monospace, monospace";
  out.fontSans = cs.getPropertyValue("--font-plex-sans").trim() || "system-ui, sans-serif";
  return out;
}

const SERVER = Object.fromEntries(TOKENS.map((t) => [t, "#888"])) as ThemeColors;
SERVER.fontMono = "monospace";
SERVER.fontSans = "sans-serif";

// One shared watcher for every chart: theme attribute, OS scheme, and font loading.
let snapshot: ThemeColors | null = null;
const listeners = new Set<() => void>();
let stop: (() => void) | null = null;

function refresh() {
  snapshot = compute();
  listeners.forEach((l) => l());
}

function start() {
  // The theme may have changed while no chart was mounted.
  snapshot = compute();
  const mo = new MutationObserver(refresh);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", refresh);
  document.fonts?.ready.then(refresh);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", refresh);
  };
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  stop ??= start();
  return () => {
    listeners.delete(cb);
    if (!listeners.size && stop) {
      stop();
      stop = null;
    }
  };
}

export function useThemeColors(): ThemeColors {
  return useSyncExternalStore(
    subscribe,
    () => (snapshot ??= compute()),
    () => SERVER,
  );
}
