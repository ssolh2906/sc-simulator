"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "sclab-pref-change";
// Fallback when storage is blocked (private mode, disabled site data).
const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Memory copy keeps the choice for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

/** A small persisted preference (code language, theme). Server render uses the fallback. */
export function useLocalPref<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  const set = useCallback((v: T) => write(key, v), [key]);
  return [value, set] as const;
}

export const LANGS = ["seurat", "scanpy"] as const;
export type Lang = (typeof LANGS)[number];
export const useLang = () => useLocalPref<Lang>("sclab-lang", "seurat", LANGS);

export const THEMES = ["system", "light", "dark"] as const;
export type ThemePref = (typeof THEMES)[number];
export const useThemePref = () => useLocalPref<ThemePref>("sclab-theme", "system", THEMES);
