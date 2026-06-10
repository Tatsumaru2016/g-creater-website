import type { Locale } from "./types";
import { LOCALES } from "./types";
import type { FlatCopy } from "./flatten";

export const SITE_COPY_STORAGE_KEY = "gcreater-site-copy";

export type SiteCopyStore = Record<Locale, FlatCopy>;

export function emptySiteCopy(): SiteCopyStore {
  return { ja: {}, en: {}, zh: {}, ko: {} };
}

export function normalizeSiteCopy(raw: unknown): SiteCopyStore {
  const base = emptySiteCopy();
  if (!raw || typeof raw !== "object") return base;

  for (const locale of LOCALES) {
    const block = (raw as Record<string, unknown>)[locale];
    if (block && typeof block === "object" && !Array.isArray(block)) {
      const flat: FlatCopy = {};
      for (const [key, value] of Object.entries(block)) {
        if (typeof value === "string") flat[key] = value;
      }
      base[locale] = flat;
    }
  }
  return base;
}

export function readSiteCopyFromStorage(): SiteCopyStore | null {
  try {
    const raw = localStorage.getItem(SITE_COPY_STORAGE_KEY);
    if (!raw) return null;
    return normalizeSiteCopy(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeSiteCopyToStorage(copy: SiteCopyStore): void {
  localStorage.setItem(SITE_COPY_STORAGE_KEY, JSON.stringify(copy));
}

export async function fetchSiteCopyFromUrl(): Promise<SiteCopyStore | null> {
  try {
    const base =
      (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || "/";
    const url = `${base}site-copy.json?ts=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return normalizeSiteCopy(await res.json());
  } catch {
    return null;
  }
}

export async function fetchSiteCopyFromApi(): Promise<SiteCopyStore | null> {
  try {
    const res = await fetch("/api/site-copy", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { copy?: unknown };
    return normalizeSiteCopy(data.copy);
  } catch {
    return null;
  }
}

export async function saveSiteCopyToApi(copy: SiteCopyStore): Promise<boolean> {
  try {
    const res = await fetch("/api/site-copy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ copy }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function mergeSiteCopyStores(...stores: (SiteCopyStore | null)[]): SiteCopyStore {
  const out = emptySiteCopy();
  for (const store of stores) {
    if (!store) continue;
    for (const locale of LOCALES) {
      out[locale] = { ...out[locale], ...store[locale] };
    }
  }
  return out;
}
