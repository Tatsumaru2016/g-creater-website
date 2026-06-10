export const LOCALES = ["ja", "en", "zh", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";
export const LOCALE_STORAGE_KEY = "gcreater-locale";

export type TranslationDict = Record<string, unknown>;
