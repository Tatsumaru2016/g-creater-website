export type AdminTabId =
  | "common"
  | "scene0"
  | "scene1"
  | "scene2"
  | "scene3"
  | "scene4";

export interface AdminTabDef {
  id: AdminTabId;
  labelKey: string;
  prefixes: string[];
}

/** 管理画面タブ: 共通 + シーン1〜5（scenes.0〜4 + 各ツール文言） */
export const ADMIN_TABS: AdminTabDef[] = [
  {
    id: "common",
    labelKey: "admin.tabs.common",
    prefixes: [
      "meta.",
      "lang.",
      "common.",
      "header.",
      "footer.",
      "nav.",
      "characters.",
      "invaders.",
      "arkanoid.",
      "iceClimber.",
      "mechaDuel.",
      "dqDuel.",
    ],
  },
  {
    id: "scene0",
    labelKey: "admin.tabs.scene0",
    prefixes: ["scenes.0.", "editor."],
  },
  {
    id: "scene1",
    labelKey: "admin.tabs.scene1",
    prefixes: ["scenes.1.", "drawing."],
  },
  {
    id: "scene2",
    labelKey: "admin.tabs.scene2",
    prefixes: ["scenes.2.", "palette."],
  },
  {
    id: "scene3",
    labelKey: "admin.tabs.scene3",
    prefixes: ["scenes.3.", "timeline."],
  },
  {
    id: "scene4",
    labelKey: "admin.tabs.scene4",
    prefixes: ["scenes.4.", "export."],
  },
];

const SCENE_TOOL_PREFIXES = new Set(
  ADMIN_TABS.filter((t) => t.id !== "common").flatMap((t) => t.prefixes)
);

export function keyBelongsToAdminTab(key: string, tabId: AdminTabId): boolean {
  const tab = ADMIN_TABS.find((t) => t.id === tabId);
  if (!tab) return false;

  if (tabId === "common") {
    if (SCENE_TOOL_PREFIXES.some((p) => key.startsWith(p))) return false;
    if (key.startsWith("scenes.")) return false;
    return true;
  }

  return tab.prefixes.some((p) => key.startsWith(p));
}

export function groupLabelForKey(key: string): string {
  if (key.startsWith("scenes.")) {
    const parts = key.split(".");
    return parts.length >= 2 ? `scenes.${parts[1]}` : "scenes";
  }
  return key.split(".")[0] ?? "other";
}
