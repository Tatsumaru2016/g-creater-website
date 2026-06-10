const PANEL_BY_SCENE = [
  "main-pixel-editor",
  "scene-panel-1",
  "scene-panel-2",
  "scene-panel-3",
  "scene-panel-4",
] as const;

/** アクティブシーンのパネルを一瞬揺らす */
export function shakeScenePanel(sceneIndex: number) {
  const idx = Math.min(4, Math.max(0, Math.round(sceneIndex)));
  const el = document.getElementById(PANEL_BY_SCENE[idx]);
  if (!el) return;

  el.classList.remove("panel-hammer-shake");
  void el.offsetWidth;
  el.classList.add("panel-hammer-shake");

  const cleanup = () => el.classList.remove("panel-hammer-shake");
  el.addEventListener("animationend", cleanup, { once: true });
  window.setTimeout(cleanup, 480);
}
