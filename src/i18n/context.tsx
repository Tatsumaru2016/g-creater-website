import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations } from "./locales";
import {
  flattenDict,
  mergeTranslationDict,
  unflattenDict,
  type FlatCopy,
} from "./flatten";
import {
  emptySiteCopy,
  fetchSiteCopyFromApi,
  fetchSiteCopyFromUrl,
  mergeSiteCopyStores,
  readSiteCopyFromStorage,
  saveSiteCopyToApi,
  writeSiteCopyToStorage,
  type SiteCopyStore,
} from "./siteCopy";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  type Locale,
  type TranslationDict,
} from "./types";

function getNested(dict: TranslationDict, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  let out = text;
  for (const [k, v] of Object.entries(params)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {
    /* ignore */
  }
  const lang = (navigator.language || DEFAULT_LOCALE).toLowerCase();
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("ko")) return "ko";
  return "en";
}

export type SaveSiteCopyResult = "server" | "local";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dict: TranslationDict;
  siteCopy: SiteCopyStore;
  setSiteCopyField: (locale: Locale, key: string, value: string) => void;
  resetSiteCopyLocale: (locale: Locale) => void;
  resetSiteCopyField: (locale: Locale, key: string) => void;
  saveSiteCopy: () => Promise<SaveSiteCopyResult>;
  copyDirty: boolean;
  copySchema: FlatCopy;
  defaultFlatForLocale: (locale: Locale) => FlatCopy;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const COPY_SCHEMA = flattenDict(translations.en);

function buildDict(locale: Locale, siteCopy: SiteCopyStore): TranslationDict {
  const overrides = unflattenDict(siteCopy[locale]);
  return mergeTranslationDict(translations[locale], overrides);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const [siteCopy, setSiteCopy] = useState<SiteCopyStore>(emptySiteCopy);
  const [copyDirty, setCopyDirty] = useState(false);
  const [copyLoaded, setCopyLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const merged = mergeSiteCopyStores(
        await fetchSiteCopyFromUrl(),
        readSiteCopyFromStorage(),
        await fetchSiteCopyFromApi()
      );
      if (!cancelled) {
        setSiteCopy(merged);
        setCopyLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dict = useMemo(
    () => (copyLoaded ? buildDict(locale, siteCopy) : translations[locale]),
    [locale, siteCopy, copyLoaded]
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const raw =
        getNested(dict, key) ??
        getNested(translations.en, key) ??
        key;
      return interpolate(raw, params);
    },
    [dict]
  );

  const setSiteCopyField = useCallback((loc: Locale, key: string, value: string) => {
    setSiteCopy((prev) => ({
      ...prev,
      [loc]: { ...prev[loc], [key]: value },
    }));
    setCopyDirty(true);
  }, []);

  const resetSiteCopyLocale = useCallback((loc: Locale) => {
    setSiteCopy((prev) => ({ ...prev, [loc]: {} }));
    setCopyDirty(true);
  }, []);

  const resetSiteCopyField = useCallback((loc: Locale, key: string) => {
    setSiteCopy((prev) => {
      const next = { ...prev[loc] };
      delete next[key];
      return { ...prev, [loc]: next };
    });
    setCopyDirty(true);
  }, []);

  const saveSiteCopy = useCallback(async (): Promise<SaveSiteCopyResult> => {
    writeSiteCopyToStorage(siteCopy);
    const serverOk = await saveSiteCopyToApi(siteCopy);
    setCopyDirty(false);
    return serverOk ? "server" : "local";
  }, [siteCopy]);

  const defaultFlatForLocale = useCallback(
    (loc: Locale) => flattenDict(translations[loc]),
    []
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    const title = getNested(dict, "meta.title");
    if (title) document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    const description = getNested(dict, "meta.description");
    if (desc && description) desc.setAttribute("content", description);
  }, [locale, dict]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dict,
      siteCopy,
      setSiteCopyField,
      resetSiteCopyLocale,
      resetSiteCopyField,
      saveSiteCopy,
      copyDirty,
      copySchema: COPY_SCHEMA,
      defaultFlatForLocale,
    }),
    [
      locale,
      setLocale,
      t,
      dict,
      siteCopy,
      setSiteCopyField,
      resetSiteCopyLocale,
      resetSiteCopyField,
      saveSiteCopy,
      copyDirty,
      defaultFlatForLocale,
    ]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label
      className={`flex items-center gap-1.5 text-[10px] font-mono text-gray-400 ${className}`}
    >
      <span className="sr-only">{t("lang.label")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="bg-black/60 border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[7.5rem]"
        aria-label={t("lang.label")}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {t(`lang.names.${code}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
