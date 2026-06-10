import type { TranslationDict } from "./types";

export type FlatCopy = Record<string, string>;

export function flattenDict(obj: unknown, prefix = ""): FlatCopy {
  const out: FlatCopy = {};
  if (obj === null || obj === undefined) return out;

  if (Array.isArray(obj)) {
    if (prefix) out[prefix] = JSON.stringify(obj);
    return out;
  }

  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "string") {
        out[path] = value;
      } else if (Array.isArray(value)) {
        out[path] = JSON.stringify(value);
      } else if (value && typeof value === "object") {
        Object.assign(out, flattenDict(value, path));
      }
    }
  }

  return out;
}

function parseFlatValue(value: string): unknown {
  if (value.startsWith("[") || value.startsWith("{")) {
    try {
      return JSON.parse(value);
    } catch {
      /* plain string */
    }
  }
  return value;
}

export function unflattenDict(flat: FlatCopy): TranslationDict {
  const root: TranslationDict = {};

  for (const [path, raw] of Object.entries(flat)) {
    const parts = path.split(".");
    let cur: Record<string, unknown> = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const next = cur[part];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        cur[part] = {};
      }
      cur = cur[part] as Record<string, unknown>;
    }

    cur[parts[parts.length - 1]] = parseFlatValue(raw);
  }

  return root;
}

export function deepMergeDict(base: unknown, patch: unknown): unknown {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(patch)) return patch.slice();
  if (
    typeof patch === "object" &&
    typeof base === "object" &&
    base !== null &&
    !Array.isArray(base)
  ) {
    const result = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
      result[key] = deepMergeDict(
        (base as Record<string, unknown>)[key],
        value
      );
    }
    return result;
  }
  return patch;
}

export function mergeTranslationDict(
  base: TranslationDict,
  overrides: TranslationDict
): TranslationDict {
  return deepMergeDict(base, overrides) as TranslationDict;
}

export function flatValueToEditor(value: string): string {
  if (value.startsWith("[")) {
    try {
      const arr = JSON.parse(value) as unknown[];
      if (Array.isArray(arr) && arr.every((v) => typeof v === "string")) {
        return arr.join("\n");
      }
    } catch {
      /* fall through */
    }
  }
  return value;
}

export function editorValueToFlat(value: string, original: string): string {
  if (original.startsWith("[")) {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return JSON.stringify(lines);
  }
  return value;
}

export function groupFlatKeys(flat: FlatCopy): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const key of Object.keys(flat).sort()) {
    const group = key.split(".")[0] || "other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(key);
  }
  return groups;
}
