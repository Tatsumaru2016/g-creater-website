import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, RotateCcw, Save, Search, X } from "lucide-react";
import {
  ADMIN_TABS,
  groupLabelForKey,
  keyBelongsToAdminTab,
  type AdminTabId,
} from "../i18n/adminTabs";
import {
  editorValueToFlat,
  flatValueToEditor,
} from "../i18n/flatten";
import { LOCALES, type Locale } from "../i18n/types";
import { useI18n } from "../i18n";

interface ContentAdminProps {
  open: boolean;
  onClose: () => void;
}

function CopyFieldEditor({
  fieldKey,
  effective,
  editorVal,
  isArray,
  isOverride,
  defaultLabel,
  onChange,
  onReset,
  resetLabel,
}: {
  fieldKey: string;
  effective: string;
  editorVal: string;
  isArray: boolean;
  isOverride: boolean;
  defaultLabel: string;
  onChange: (value: string) => void;
  onReset: () => void;
  resetLabel: string;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${
        isOverride
          ? "border-amber-500/30 bg-amber-500/[0.04]"
          : "border-white/8 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <code className="text-[9px] font-mono text-gray-500 break-all">{fieldKey}</code>
        {isOverride && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 text-[9px] font-mono text-gray-500 hover:text-cyan-400 flex items-center gap-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            {resetLabel}
          </button>
        )}
      </div>
      {isArray || editorVal.length > 72 ? (
        <textarea
          value={editorVal}
          rows={Math.min(8, Math.max(2, editorVal.split("\n").length))}
          onChange={(e) => onChange(editorValueToFlat(e.target.value, effective))}
          className="w-full text-[11px] font-mono bg-black/60 border border-white/10 rounded px-2 py-1.5 text-gray-100 focus:outline-none focus:border-cyan-500/40 resize-y min-h-[2.5rem]"
        />
      ) : (
        <input
          type="text"
          value={editorVal}
          onChange={(e) => onChange(editorValueToFlat(e.target.value, effective))}
          className="w-full text-[11px] font-mono bg-black/60 border border-white/10 rounded px-2 py-1.5 text-gray-100 focus:outline-none focus:border-cyan-500/40"
        />
      )}
      {isOverride && defaultLabel && (
        <p className="mt-1 text-[9px] font-mono text-gray-600 line-clamp-2">
          {defaultLabel}
        </p>
      )}
    </div>
  );
}

export function ContentAdmin({ open, onClose }: ContentAdminProps) {
  const {
    t,
    locale,
    setLocale,
    siteCopy,
    setSiteCopyField,
    resetSiteCopyLocale,
    resetSiteCopyField,
    saveSiteCopy,
    copyDirty,
    copySchema,
    defaultFlatForLocale,
  } = useI18n();

  const [editLocale, setEditLocale] = useState<Locale>(locale);
  const [activeTab, setActiveTab] = useState<AdminTabId>("common");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const defaults = useMemo(
    () => defaultFlatForLocale(editLocale),
    [defaultFlatForLocale, editLocale]
  );

  const tabbedGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const keys = Object.keys(copySchema).filter((key) => {
      if (!keyBelongsToAdminTab(key, activeTab)) return false;
      if (!q) return true;
      return (
        key.toLowerCase().includes(q) ||
        (defaults[key] ?? "").toLowerCase().includes(q) ||
        (siteCopy[editLocale][key] ?? "").toLowerCase().includes(q)
      );
    });

    const groups: Record<string, string[]> = {};
    for (const key of keys.sort()) {
      const group = groupLabelForKey(key);
      if (!groups[group]) groups[group] = [];
      groups[group].push(key);
    }
    return groups;
  }, [copySchema, query, defaults, siteCopy, editLocale, activeTab]);

  const fieldCount = useMemo(
    () => Object.values(tabbedGroups).reduce((n, keys) => n + keys.length, 0),
    [tabbedGroups]
  );

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const mode = await saveSiteCopy();
      setStatus(mode === "server" ? t("admin.savedServer") : t("admin.savedLocal"));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-stretch justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-admin-title"
    >
      <div className="w-full max-w-2xl h-full bg-[#0a0a0f] border-l border-cyan-500/20 shadow-[-20px_0_60px_rgba(0,245,255,0.08)] flex flex-col">
        <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
            <h2
              id="content-admin-title"
              className="text-sm font-mono font-bold text-white truncate"
            >
              {t("admin.title")}
            </h2>
            {copyDirty && (
              <span className="text-[9px] font-mono text-amber-400/90 shrink-0">
                {t("admin.unsaved")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/25"
            aria-label={t("admin.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="shrink-0 px-4 py-2 border-b border-white/5 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono border whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300 font-bold"
                    : "border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="flex gap-1">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setEditLocale(code)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                  editLocale === code
                    ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 text-gray-500 hover:text-gray-300"
                }`}
              >
                {t(`lang.names.${code}`)}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[10rem] relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.search")}
              className="w-full pl-8 pr-2 py-1.5 text-[11px] font-mono bg-black/50 border border-white/10 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <span className="text-[9px] font-mono text-gray-600 shrink-0">
            {fieldCount} {t("admin.fieldCount")}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          {fieldCount === 0 ? (
            <p className="text-[11px] font-mono text-gray-500 text-center py-8">
              {t("admin.noFields")}
            </p>
          ) : (
            Object.entries(tabbedGroups).map(([group, keys]) => (
              <section key={group}>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-cyan-500/80 mb-2">
                  {group}
                </h3>
                <div className="space-y-3">
                  {keys.map((key) => {
                    const schemaVal = copySchema[key] ?? defaults[key] ?? "";
                    const stored = siteCopy[editLocale][key];
                    const effective = stored ?? defaults[key] ?? schemaVal;
                    const isArray = effective.startsWith("[");
                    const editorVal = flatValueToEditor(effective);
                    const isOverride = key in siteCopy[editLocale];

                    return (
                      <CopyFieldEditor
                        key={key}
                        fieldKey={key}
                        effective={effective}
                        editorVal={editorVal}
                        isArray={isArray}
                        isOverride={isOverride}
                        defaultLabel={
                          isOverride && defaults[key]
                            ? `${t("admin.default")}: ${flatValueToEditor(defaults[key])}`
                            : ""
                        }
                        onChange={(value) => setSiteCopyField(editLocale, key, value)}
                        onReset={() => resetSiteCopyField(editLocale, key)}
                        resetLabel={t("admin.resetKey")}
                      />
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <footer className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-3 border-t border-white/10 bg-black/40">
          {status && (
            <span className="text-[10px] font-mono text-emerald-400 mr-auto">
              {status}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t("admin.resetLocaleConfirm"))) {
                resetSiteCopyLocale(editLocale);
                setStatus(null);
              }
            }}
            className="px-3 py-1.5 text-[10px] font-mono border border-white/15 rounded-lg text-gray-400 hover:text-white hover:border-white/30"
          >
            {t("admin.resetLocale")}
          </button>
          <button
            type="button"
            onClick={() => setLocale(editLocale)}
            className="px-3 py-1.5 text-[10px] font-mono border border-white/15 rounded-lg text-gray-400 hover:text-cyan-300"
          >
            {t("admin.previewLocale")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-mono font-bold border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? t("admin.saving") : t("admin.save")}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
