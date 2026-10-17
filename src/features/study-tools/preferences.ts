"use client";

import { useSyncExternalStore } from "react";

/**
 * Per-device study comforts (ADR 0069): feedback sound and vibration. Off by default; stored only in this
 * browser (a missing or blocked storage simply means "off"), never sent to the server.
 */
export type StudyPreferences = Readonly<{ sound: boolean; haptics: boolean }>;

const KEY = "estudisc.study-preferences.v1";
const DEFAULTS: StudyPreferences = { sound: false, haptics: false };
const listeners = new Set<() => void>();
let cache: StudyPreferences | null = null;
let cacheRaw: string | null = null;

function read(): StudyPreferences {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { raw = null; }
  if (cache && raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<StudyPreferences>) : {};
    cache = { sound: parsed.sound === true, haptics: parsed.haptics === true };
  } catch {
    cache = DEFAULTS;
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) listener(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

export function getStudyPreferences(): StudyPreferences {
  return typeof window === "undefined" ? DEFAULTS : read();
}

export function setStudyPreference(name: keyof StudyPreferences, value: boolean) {
  const next = { ...read(), [name]: value };
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked: stays off after reload */ }
  cache = next; cacheRaw = JSON.stringify(next);
  for (const listener of listeners) listener();
}

export function useStudyPreferences(): StudyPreferences {
  return useSyncExternalStore(subscribe, read, () => DEFAULTS);
}
