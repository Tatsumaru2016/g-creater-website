/** ヘッダー横のインベーダー＋アルカノイドを同時操作するグローバル入力 */

const pointerListeners = new Set<(clientX: number) => void>();
const frameListeners = new Set<(clientX: number) => void>();
const cursorFrameListeners = new Set<
  (clientX: number, clientY: number) => void
>();
const fireListeners = new Set<() => void>();
let installed = false;
let lastClientX: number | null = null;
let lastClientY: number | null = null;
let frameLoopActive = false;
let cursorInViewport = true;
let windowFocused = true;
let keyLeft = false;
let keyRight = false;
let lastFrameTime = 0;

/** ビューポート幅に対する秒速（左右カーソル移動） */
const KEYBOARD_CURSOR_VIEWPORTS_PER_SEC = 0.55;

function viewportRatioX(clientX: number): number {
  const vw = window.innerWidth || document.documentElement.clientWidth || 1;
  return Math.max(0, Math.min(1, clientX / vw));
}

function refreshFocusState() {
  if (typeof document === "undefined") return;
  windowFocused = !document.hidden && document.hasFocus();
}

function updateCursorInViewport(clientX: number, clientY: number) {
  const vw = window.innerWidth || document.documentElement.clientWidth || 1;
  const vh = window.innerHeight || document.documentElement.clientHeight || 1;
  cursorInViewport =
    clientX >= 0 && clientX <= vw && clientY >= 0 && clientY <= vh;
}

/** 画面内にカーソルがあるか、タブ／ウィンドウがフォーカス中 */
export function isMinigamePointerActive(): boolean {
  return cursorInViewport || windowFocused;
}

export function isMinigameKeyboardHeld(): boolean {
  return keyLeft || keyRight;
}

function applyKeyboardCursorStep(dt: number) {
  if (!keyLeft && !keyRight) return;
  refreshFocusState();
  if (!isMinigamePointerActive()) return;

  const vw = window.innerWidth || document.documentElement.clientWidth || 1;
  const x = lastClientX ?? vw * 0.5;
  const step = vw * KEYBOARD_CURSOR_VIEWPORTS_PER_SEC * dt;
  if (keyLeft && !keyRight) {
    lastClientX = Math.max(0, x - step);
  } else if (keyRight && !keyLeft) {
    lastClientX = Math.min(vw, x + step);
  }
}

function hasFrameSubscribers(): boolean {
  return frameListeners.size > 0 || cursorFrameListeners.size > 0;
}

function runFrameLoop() {
  if (!hasFrameSubscribers()) {
    frameLoopActive = false;
    lastFrameTime = 0;
    return;
  }
  frameLoopActive = true;
  requestAnimationFrame((now) => {
    if (!hasFrameSubscribers()) {
      frameLoopActive = false;
      lastFrameTime = 0;
      return;
    }

    if (document.hidden) {
      runFrameLoop();
      return;
    }

    const dt = lastFrameTime
      ? Math.min(0.05, (now - lastFrameTime) / 1000)
      : 1 / 60;
    lastFrameTime = now;

    applyKeyboardCursorStep(dt);

    if (lastClientX !== null && lastClientY !== null) {
      cursorFrameListeners.forEach((cb) =>
        cb(lastClientX as number, lastClientY as number)
      );
    }

    if (lastClientX !== null) {
      frameListeners.forEach((cb) => cb(lastClientX as number));
    }
    runFrameLoop();
  });
}

function ensureFrameLoop() {
  if (!frameLoopActive && hasFrameSubscribers()) {
    runFrameLoop();
  }
}

function emitPointer(clientX: number, clientY?: number) {
  if (clientY !== undefined) {
    lastClientY = clientY;
    updateCursorInViewport(clientX, clientY);
  }
  lastClientX = clientX;

  refreshFocusState();
  if (!isMinigamePointerActive()) return;

  pointerListeners.forEach((cb) => cb(clientX));
}

function installGlobalMinigameInput() {
  if (installed) return;
  installed = true;

  if (typeof window !== "undefined") {
    lastClientX = window.innerWidth * 0.5;
    lastClientY = window.innerHeight * 0.5;
    refreshFocusState();
    cursorInViewport = true;
  }

  const onPointer = (e: PointerEvent) => {
    emitPointer(e.clientX, e.clientY);
  };
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) emitPointer(t.clientX, t.clientY);
  };

  const captureOpts = { passive: true, capture: true } as const;

  window.addEventListener("pointermove", onPointer, captureOpts);
  window.addEventListener("pointerdown", onPointer, captureOpts);
  document.addEventListener("touchmove", onTouch, captureOpts);
  document.addEventListener("touchstart", onTouch, captureOpts);

  document.addEventListener(
    "mouseleave",
    () => {
      cursorInViewport = false;
    },
    captureOpts
  );
  document.addEventListener(
    "mouseenter",
    () => {
      cursorInViewport = true;
    },
    captureOpts
  );

  window.addEventListener("focus", refreshFocusState);
  window.addEventListener("blur", () => {
    windowFocused = false;
  });
  document.addEventListener("visibilitychange", refreshFocusState);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
      keyLeft = true;
      if (isMinigamePointerActive()) e.preventDefault();
    }
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
      keyRight = true;
      if (isMinigamePointerActive()) e.preventDefault();
    }
    if (e.key === " " && !e.repeat) {
      e.preventDefault();
      fireListeners.forEach((cb) => cb());
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
      keyLeft = false;
    }
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
      keyRight = false;
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  window.addEventListener("blur", () => {
    keyLeft = false;
    keyRight = false;
  });

  ensureFrameLoop();
}

/** App のカスタムカーソル等からも同じ座標を流す */
export function reportMinigameClientX(clientX: number, clientY?: number) {
  installGlobalMinigameInput();
  emitPointer(clientX, clientY);
}

export function getLastMinigameClientX(): number | null {
  installGlobalMinigameInput();
  return lastClientX;
}

export function getLastMinigameClientY(): number | null {
  installGlobalMinigameInput();
  return lastClientY;
}

export function subscribeHeaderMinigamePointer(
  cb: (clientX: number) => void
): () => void {
  installGlobalMinigameInput();
  pointerListeners.add(cb);
  if (lastClientX !== null) cb(lastClientX);
  return () => pointerListeners.delete(cb);
}

/** 表示リフレッシュごとに最新カーソル X を配信（ミニゲームのなめらか追従用） */
export function subscribeMinigamePointerFrame(
  cb: (clientX: number) => void
): () => void {
  installGlobalMinigameInput();
  frameListeners.add(cb);
  ensureFrameLoop();
  if (lastClientX !== null) cb(lastClientX);
  return () => {
    frameListeners.delete(cb);
    if (!hasFrameSubscribers()) frameLoopActive = false;
  };
}

/** カスタムカーソル用 — 1フレーム1回だけ最新座標を配信 */
export function subscribeCursorFrame(
  cb: (clientX: number, clientY: number) => void
): () => void {
  installGlobalMinigameInput();
  cursorFrameListeners.add(cb);
  ensureFrameLoop();
  if (lastClientX !== null && lastClientY !== null) {
    cb(lastClientX, lastClientY);
  }
  return () => {
    cursorFrameListeners.delete(cb);
    if (!hasFrameSubscribers()) frameLoopActive = false;
  };
}

export function subscribeHeaderMinigameFire(cb: () => void): () => void {
  installGlobalMinigameInput();
  fireListeners.add(cb);
  return () => fireListeners.delete(cb);
}

/** 画面幅に対するカーソル位置をアリーナ内の中心 X（px）へ */
export function arenaCenterXFromClient(
  clientX: number,
  arenaEl: HTMLElement | null
): number | null {
  if (!arenaEl) return null;
  const rect = arenaEl.getBoundingClientRect();
  if (rect.width <= 0) return null;
  return viewportRatioX(clientX) * rect.width;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/** アリーナ内の自機/パドル左端 X（px）。測定不能時は null */
export function entityLeftXFromClient(
  clientX: number | null,
  arenaEl: HTMLElement | null,
  entityW: number,
  arenaW: number
): number | null {
  if (clientX === null || !arenaEl || arenaW <= 0) return null;
  const ratio = viewportRatioX(clientX);
  return clamp(ratio * (arenaW - entityW), 0, arenaW - entityW);
}
