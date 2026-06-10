import type { Locale, TranslationDict } from "../types";
import en from "./en";
import ja from "./ja";
import ko from "./ko";
import zh from "./zh";

export const translations: Record<Locale, TranslationDict> = { ja, en, zh, ko };

export { en, ja, zh, ko };
