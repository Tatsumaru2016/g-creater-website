import { useEffect, useRef, useState } from "react";
import { homageFrames, type HomageId } from "../data/homageSprites";
import {
  getBorderActSprites,
  initBorderActs,
  tickBorderActs,
  type BorderActSprite,
  type BorderActsState,
} from "./sceneBorderActs";

type MoveMode = "free" | "border" | "hop" | "orbit" | "zigzag" | "dash" | "slash";

interface PanelBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface ContainerLayout {
  width: number;
  height: number;
  bounds: PanelBounds;
}

interface WandererSeed {
  frames: string[][][];
  scale: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  opacity?: number;
  mode?: MoveMode;
  borderProgress?: number;
  borderSpeed?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  isPacman?: boolean;
}

interface WandererState extends WandererSeed {
  id: number;
  frameIdx: number;
  facingLeft: boolean;
  vx: number;
  vy: number;
  mode: MoveMode;
  borderProgress: number;
  borderSpeed: number;
  bounds: PanelBounds;
  hopPhase: number;
  orbitAngle: number;
  orbitCx: number;
  orbitCy: number;
  orbitRadiusPx: number;
  orbitSpeed: number;
  zigzagFlip: number;
  dashCooldown: number;
  dashBurstLeft: number;
  slashTimer: number;
  slashActive: boolean;
  renderYOffset: number;
  isPacman: boolean;
  chompTimer: number;
}

interface ChaseState {
  chaserId: number;
  targetId: number;
  elapsedMs: number;
  chaserVx: number;
  chaserVy: number;
  targetVx: number;
  targetVy: number;
}

interface BiteChar {
  el: HTMLElement;
  x: number;
  y: number;
  eaten: boolean;
}

const BITE_RADIUS = 34;
const RESTORE_RADIUS = 50;
const CHASE_SPEED = 2.4;
const PACMAN_CHASE_SPEED = 3.3;
const FLEE_SPEED = 1.35;
const CHASE_DURATION_MS = 3200;
const CHASE_COOLDOWN_MS = 1200;
const CHOMP_FRAME_MS = 55;

function sceneTransitionMs(scene: HTMLElement): number {
  const durations = getComputedStyle(scene)
    .transitionDuration.split(",")
    .map((value) => parseFloat(value) || 0);
  return Math.max(0, ...durations) * 1000;
}

function measureLayout(container: HTMLElement): ContainerLayout | null {
  const scene = container.parentElement;
  if (!scene) return null;

  const panel = scene.querySelector("[data-scene-panel]") as HTMLElement | null;
  const rootRect = container.getBoundingClientRect();
  if (!panel || rootRect.width < 1 || rootRect.height < 1) return null;

  const pr = panel.getBoundingClientRect();
  return {
    width: rootRect.width,
    height: rootRect.height,
    bounds: {
      left: pr.left - rootRect.left,
      top: pr.top - rootRect.top,
      right: pr.right - rootRect.left,
      bottom: pr.bottom - rootRect.top,
    },
  };
}

function wrapTextNodeChars(el: HTMLElement) {
  if (el.dataset.biteWrapped === "1") return;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const value = node.textContent ?? "";
      return value.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent ?? "";
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const span = document.createElement("span");
      span.dataset.biteChar = "1";
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.style.display = "inline-block";
      span.style.transition = "opacity 0.12s ease, transform 0.12s ease";
      span.style.transformOrigin = "center bottom";
      frag.appendChild(span);
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  });

  el.dataset.biteWrapped = "1";
}

function prepareBiteTargets(scene: HTMLElement) {
  scene.querySelectorAll("[data-wanderer-bite]").forEach((root) => {
    root.querySelectorAll("h2, p").forEach((el) => wrapTextNodeChars(el as HTMLElement));
  });
}

function restoreBiteTargets(scene: HTMLElement) {
  scene.querySelectorAll("[data-bite-char]").forEach((el) => {
    const span = el as HTMLElement;
    span.style.opacity = "1";
    span.style.transform = "scale(1)";
  });
}

function measureBiteChars(container: HTMLElement, scene: HTMLElement): BiteChar[] {
  prepareBiteTargets(scene);
  const rootRect = container.getBoundingClientRect();
  const chars: BiteChar[] = [];

  scene.querySelectorAll("[data-bite-char]").forEach((node) => {
    const el = node as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.width < 0.5 && rect.height < 0.5) return;
    chars.push({
      el,
      x: rect.left + rect.width / 2 - rootRect.left,
      y: rect.top + rect.height / 2 - rootRect.top,
      eaten: false,
    });
  });

  return chars;
}

function updateBiteChars(chars: BiteChar[], sprites: WandererState[]) {
  if (chars.length === 0 || sprites.length === 0) return;

  for (const ch of chars) {
    let nearest = Infinity;
    for (const s of sprites) {
      const spriteR = (s.frames[s.frameIdx]?.length ?? 8) * s.scale * 0.45;
      const d = Math.hypot(s.x - ch.x, s.y - ch.y) - spriteR;
      nearest = Math.min(nearest, d);
    }

    if (nearest < BITE_RADIUS) {
      ch.eaten = true;
    } else if (nearest > RESTORE_RADIUS) {
      ch.eaten = false;
    }

    ch.el.style.opacity = ch.eaten ? "0" : "1";
    ch.el.style.transform = ch.eaten ? "scale(0.2) translateY(4px)" : "scale(1)";
  }
}

function h(id: HomageId): string[][][] {
  return homageFrames(id);
}

function borderSeed(
  partial: Pick<WandererSeed, "frames" | "scale"> &
    Partial<Pick<WandererSeed, "opacity" | "borderProgress" | "borderSpeed">>
): WandererSeed {
  return { ...partial, mode: "border", x: 0, y: 0 };
}

function hopSeed(
  partial: Pick<WandererSeed, "frames" | "scale" | "x" | "y"> &
    Partial<Pick<WandererSeed, "vx" | "vy" | "opacity">>
): WandererSeed {
  return { ...partial, mode: "hop", vx: partial.vx ?? 0.04, vy: partial.vy ?? 0.012 };
}

function orbitSeed(
  partial: Pick<WandererSeed, "frames" | "scale"> &
    Partial<Pick<WandererSeed, "x" | "opacity" | "orbitRadius" | "orbitSpeed">>
): WandererSeed {
  return {
    ...partial,
    mode: "orbit",
    x: partial.x ?? 50,
    y: 50,
    orbitRadius: partial.orbitRadius ?? 11,
    orbitSpeed: partial.orbitSpeed ?? 0.017,
  };
}

function zigzagSeed(
  partial: Pick<WandererSeed, "frames" | "scale" | "x" | "y"> &
    Partial<Pick<WandererSeed, "vx" | "vy" | "opacity">>
): WandererSeed {
  return { ...partial, mode: "zigzag", vx: partial.vx ?? 0.048, vy: partial.vy ?? 0.032 };
}

function dashSeed(
  partial: Pick<WandererSeed, "frames" | "scale" | "x" | "y"> &
    Partial<Pick<WandererSeed, "vx" | "vy" | "opacity">>
): WandererSeed {
  return { ...partial, mode: "dash", vx: partial.vx ?? -0.055, vy: partial.vy ?? 0.018 };
}

function slashSeed(
  partial: Pick<WandererSeed, "frames" | "scale" | "x" | "y"> &
    Partial<Pick<WandererSeed, "vx" | "vy" | "opacity">>
): WandererSeed {
  return { ...partial, mode: "slash", vx: partial.vx ?? 0.028, vy: partial.vy ?? 0.02 };
}

function pacmanSeed(
  partial: Pick<WandererSeed, "x" | "y"> &
    Partial<Pick<WandererSeed, "vx" | "vy" | "opacity">>
): WandererSeed {
  return {
    frames: h("pacman"),
    scale: 2.8,
    isPacman: true,
    vx: partial.vx ?? 0.032,
    vy: partial.vy ?? 0.018,
    opacity: partial.opacity ?? 0.97,
    ...partial,
  };
}

const SCENE_SEEDS: Record<number, WandererSeed[]> = {
  0: [
    { frames: h("mario"), scale: 3, x: 12, y: 68, vx: 0.045, vy: 0.018 },
    { frames: h("yoshi"), scale: 2.5, x: 82, y: 72, vx: -0.038, vy: 0.022, opacity: 0.85 },
    borderSeed({ frames: h("invader"), scale: 2.5, borderProgress: 0.2, borderSpeed: 0.011, opacity: 0.92 }),
    hopSeed({ frames: h("mario"), scale: 2.5, x: 38, y: 42, vx: 0.05, vy: 0.014, opacity: 0.88 }),
    orbitSeed({ frames: h("invader"), scale: 2.5, x: 20, orbitRadius: 13, orbitSpeed: 0.019, opacity: 0.75 }),
    dashSeed({ frames: h("link"), scale: 2.5, x: 72, y: 30, vx: -0.058, vy: 0.02, opacity: 0.9 }),
    slashSeed({ frames: h("dqhero"), scale: 2.5, x: 55, y: 55, vx: 0.03, vy: 0.02, opacity: 0.88 }),
    pacmanSeed({ x: 48, y: 45, vx: 0.038, vy: 0.015 }),
  ],
  1: [
    { frames: h("link"), scale: 3, x: 18, y: 55, vx: 0.05, vy: 0.02 },
    borderSeed({ frames: h("invader"), scale: 2.5, borderProgress: 1.5, borderSpeed: 0.01, opacity: 0.88 }),
    { frames: h("yoshi"), scale: 3, x: 50, y: 78, vx: 0.035, vy: -0.028, opacity: 0.8 },
    zigzagSeed({ frames: h("mario"), scale: 2.5, x: 65, y: 38, vx: -0.042, vy: 0.035, opacity: 0.9 }),
    slashSeed({ frames: h("link"), scale: 2.5, x: 28, y: 28, vx: 0.03, vy: 0.018, opacity: 0.92 }),
    orbitSeed({ frames: h("invader"), scale: 2.5, x: 65, orbitRadius: 10, orbitSpeed: 0.022, opacity: 0.78 }),
    dashSeed({ frames: h("dqhero"), scale: 2.5, x: 40, y: 65, vx: 0.05, vy: -0.02, opacity: 0.86 }),
    pacmanSeed({ x: 72, y: 48, vx: -0.03, vy: 0.022 }),
  ],
  2: [
    { frames: h("dqhero"), scale: 3, x: 15, y: 62, vx: 0.04, vy: 0.025 },
    borderSeed({ frames: h("invader"), scale: 2.5, borderProgress: 2.8, borderSpeed: 0.012, opacity: 0.9 }),
    { frames: h("invader"), scale: 2.5, x: 55, y: 25, vx: 0.025, vy: 0.04, opacity: 0.8 },
    hopSeed({ frames: h("yoshi"), scale: 2.5, x: 80, y: 48, vx: -0.046, vy: 0.01, opacity: 0.88 }),
    dashSeed({ frames: h("mario"), scale: 2.5, x: 32, y: 75, vx: 0.06, vy: -0.015, opacity: 0.9 }),
    slashSeed({ frames: h("link"), scale: 2.5, x: 48, y: 55, vx: -0.025, vy: 0.022, opacity: 0.88 }),
    orbitSeed({ frames: h("yoshi"), scale: 2, x: 70, orbitRadius: 9, orbitSpeed: 0.02, opacity: 0.72 }),
    pacmanSeed({ x: 35, y: 38, vx: 0.04, vy: 0.02 }),
  ],
  3: [
    { frames: h("mario"), scale: 3, x: 20, y: 70, vx: 0.055, vy: 0.012 },
    borderSeed({ frames: h("invader"), scale: 2.5, borderProgress: 0.6, borderSpeed: 0.009, opacity: 0.9 }),
    { frames: h("link"), scale: 2.5, x: 45, y: 80, vx: 0.03, vy: -0.025, opacity: 0.85 },
    orbitSeed({ frames: h("dqhero"), scale: 2.5, x: 40, orbitRadius: 15, orbitSpeed: 0.014, opacity: 0.82 }),
    zigzagSeed({ frames: h("yoshi"), scale: 2.5, x: 75, y: 32, vx: -0.05, vy: 0.038, opacity: 0.88 }),
    hopSeed({ frames: h("mario"), scale: 2.5, x: 58, y: 52, vx: 0.038, vy: 0.016, opacity: 0.9 }),
    dashSeed({ frames: h("invader"), scale: 2, x: 25, y: 35, vx: 0.048, vy: 0.022, opacity: 0.8 }),
    pacmanSeed({ x: 62, y: 42, vx: -0.035, vy: 0.018 }),
  ],
  4: [
    borderSeed({ frames: h("invader"), scale: 2.5, borderProgress: 3.2, borderSpeed: 0.013, opacity: 0.9 }),
    slashSeed({ frames: h("link"), scale: 3, x: 78, y: 55, vx: -0.05, vy: 0.02, opacity: 0.92 }),
    { frames: h("mario"), scale: 3, x: 25, y: 60, vx: 0.07, vy: 0.01 },
    dashSeed({ frames: h("dqhero"), scale: 2.5, x: 52, y: 38, vx: 0.052, vy: 0.025, opacity: 0.88 }),
    hopSeed({ frames: h("yoshi"), scale: 2.5, x: 15, y: 35, vx: 0.044, vy: 0.02, opacity: 0.9 }),
    orbitSeed({ frames: h("invader"), scale: 2.5, x: 88, orbitRadius: 8, orbitSpeed: 0.024, opacity: 0.8 }),
    zigzagSeed({ frames: h("link"), scale: 2.5, x: 60, y: 72, vx: -0.04, vy: -0.02, opacity: 0.86 }),
    pacmanSeed({ x: 42, y: 55, vx: 0.036, vy: -0.016 }),
  ],
  5: [
    { frames: h("yoshi"), scale: 3, x: 14, y: 50, vx: 0.048, vy: 0.028 },
    borderSeed({ frames: h("invader"), scale: 2.5, borderProgress: 1.1, borderSpeed: 0.01, opacity: 0.9 }),
    { frames: h("dqhero"), scale: 2.5, x: 60, y: 22, vx: -0.032, vy: 0.038, opacity: 0.88 },
    orbitSeed({ frames: h("mario"), scale: 2.5, x: 80, orbitRadius: 12, orbitSpeed: 0.02, opacity: 0.85 }),
    zigzagSeed({ frames: h("invader"), scale: 2, x: 40, y: 68, vx: 0.04, vy: -0.03, opacity: 0.82 }),
    dashSeed({ frames: h("mario"), scale: 2.5, x: 85, y: 45, vx: -0.06, vy: 0.012, opacity: 0.9 }),
    hopSeed({ frames: h("yoshi"), scale: 2.5, x: 30, y: 40, vx: 0.042, vy: 0.018, opacity: 0.88 }),
    pacmanSeed({ x: 78, y: 62, vx: -0.04, vy: 0.02 }),
  ],
  6: [
    { frames: h("invader"), scale: 3, x: 22, y: 58, vx: 0.042, vy: 0.02 },
    borderSeed({ frames: h("invader"), scale: 2.5, borderProgress: 2.1, borderSpeed: 0.011, opacity: 0.9 }),
    { frames: h("mario"), scale: 3, x: 48, y: 28, vx: 0.03, vy: 0.04, opacity: 0.9 },
    slashSeed({ frames: h("link"), scale: 2.5, x: 70, y: 65, vx: -0.028, vy: -0.02, opacity: 0.92 }),
    hopSeed({ frames: h("yoshi"), scale: 2.5, x: 12, y: 42, vx: 0.05, vy: 0.015, opacity: 0.88 }),
    orbitSeed({ frames: h("invader"), scale: 2.5, x: 55, orbitRadius: 11, orbitSpeed: 0.018, opacity: 0.8 }),
    dashSeed({ frames: h("dqhero"), scale: 2.5, x: 82, y: 50, vx: -0.05, vy: 0.02, opacity: 0.86 }),
    pacmanSeed({ x: 28, y: 52, vx: 0.042, vy: 0.014 }),
  ],
  7: [
    { frames: h("mario"), scale: 3, x: 16, y: 65, vx: 0.05, vy: 0.018 },
    borderSeed({ frames: h("invader"), scale: 2.5, borderProgress: 0.9, borderSpeed: 0.012, opacity: 0.92 }),
    { frames: h("link"), scale: 3, x: 68, y: 58, vx: -0.045, vy: 0.025, opacity: 0.9 },
    { frames: h("dqhero"), scale: 2.5, x: 42, y: 72, vx: 0.035, vy: -0.02, opacity: 0.88 },
    zigzagSeed({ frames: h("yoshi"), scale: 2.5, x: 30, y: 32, vx: 0.045, vy: 0.04, opacity: 0.9 }),
    dashSeed({ frames: h("mario"), scale: 2.5, x: 88, y: 38, vx: -0.055, vy: 0.022, opacity: 0.92 }),
    hopSeed({ frames: h("yoshi"), scale: 2.5, x: 55, y: 48, vx: -0.04, vy: 0.018, opacity: 0.9 }),
    orbitSeed({ frames: h("link"), scale: 2, x: 15, orbitRadius: 14, orbitSpeed: 0.016, opacity: 0.78 }),
    pacmanSeed({ x: 58, y: 40, vx: -0.032, vy: 0.024 }),
  ],
};

function positionOnBorder(
  progress: number,
  bounds: PanelBounds
): { x: number; y: number; facingLeft: boolean } {
  const { left, top, right, bottom } = bounds;
  const w = right - left;
  const h = bottom - top;
  const loop = ((progress % 4) + 4) % 4;
  const edge = Math.floor(loop);
  const t = loop - edge;

  switch (edge) {
    case 0:
      return { x: left + t * w, y: top, facingLeft: false };
    case 1:
      return { x: right, y: top + t * h, facingLeft: false };
    case 2:
      return { x: right - t * w, y: bottom, facingLeft: true };
    default:
      return { x: left, y: bottom - t * h, facingLeft: true };
  }
}

function orbitCenter(bounds: PanelBounds): { cx: number; cy: number } {
  return { cx: (bounds.left + bounds.right) / 2, cy: (bounds.top + bounds.bottom) / 2 };
}

function orbitPosition(cx: number, cy: number, angle: number, radius: number) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
    facingLeft: Math.cos(angle) < 0,
  };
}

function defaultActionState(
  s: WandererSeed,
  width: number,
  height: number,
  bounds: PanelBounds
) {
  const { cx, cy } = orbitCenter(bounds);
  const orbitRadiusPx = ((s.orbitRadius ?? 11) / 100) * Math.min(width, height);
  const orbitAngle = (s.x / 100) * Math.PI * 2;

  return {
    hopPhase: Math.random() * Math.PI * 2,
    orbitAngle,
    orbitCx: cx,
    orbitCy: cy,
    orbitRadiusPx,
    orbitSpeed: s.orbitSpeed ?? 0.017,
    zigzagFlip: 35 + Math.random() * 30,
    dashCooldown: 25 + Math.random() * 35,
    dashBurstLeft: 0,
    slashTimer: Math.random() * 80,
    slashActive: false,
    renderYOffset: 0,
    isPacman: false,
    chompTimer: 0,
  };
}

function bounceInArena(
  x: number,
  y: number,
  vx: number,
  vy: number,
  width: number,
  height: number
) {
  const minX = width * 0.08;
  const maxX = width * 0.92;
  const minY = height * 0.12;
  const maxY = height * 0.88;
  let nx = x;
  let ny = y;
  let nvx = vx;
  let nvy = vy;
  let facingLeft = vx < 0;

  if (nx <= minX || nx >= maxX) {
    nvx = -nvx;
    nx = Math.max(minX, Math.min(maxX, nx));
    facingLeft = nvx < 0;
  }
  if (ny <= minY || ny >= maxY) {
    nvy = -nvy;
    ny = Math.max(minY, Math.min(maxY, ny));
  }

  return { x: nx, y: ny, vx: nvx, vy: nvy, facingLeft };
}

function seedToState(seeds: WandererSeed[], layout: ContainerLayout): WandererState[] {
  const { width, height, bounds } = layout;

  return seeds.map((s, i) => {
    const mode = s.mode ?? "free";
    const borderProgress = s.borderProgress ?? 0;
    const borderPos = mode === "border" ? positionOnBorder(borderProgress, bounds) : null;
    const action = defaultActionState(s, width, height, bounds);
    const orbitPos =
      mode === "orbit"
        ? orbitPosition(action.orbitCx, action.orbitCy, action.orbitAngle, action.orbitRadiusPx)
        : null;

    return {
      ...s,
      id: i,
      mode,
      vx: (s.vx ?? 0) * (width / 100),
      vy: (s.vy ?? 0) * (height / 100),
      borderProgress,
      borderSpeed: s.borderSpeed ?? 0.01,
      bounds,
      frameIdx: 0,
      x: borderPos?.x ?? orbitPos?.x ?? (s.x / 100) * width,
      y: borderPos?.y ?? orbitPos?.y ?? (s.y / 100) * height,
      facingLeft: borderPos?.facingLeft ?? orbitPos?.facingLeft ?? (s.vx ?? 0) < 0,
      opacity: s.opacity ?? 0.85,
      isPacman: s.isPacman ?? false,
      ...action,
      chompTimer: 0,
    };
  });
}

function applyPanelBounds(sprites: WandererState[], bounds: PanelBounds): WandererState[] {
  const { cx, cy } = orbitCenter(bounds);
  return sprites.map((s) => {
    if (s.mode === "border") {
      const pos = positionOnBorder(s.borderProgress, bounds);
      return { ...s, bounds, x: pos.x, y: pos.y, facingLeft: pos.facingLeft };
    }
    if (s.mode === "orbit") {
      const pos = orbitPosition(cx, cy, s.orbitAngle, s.orbitRadiusPx);
      return { ...s, bounds, orbitCx: cx, orbitCy: cy, x: pos.x, y: pos.y, facingLeft: pos.facingLeft };
    }
    return { ...s, bounds };
  });
}

function updateSpriteMove(
  s: WandererState,
  dt: number,
  width: number,
  height: number,
  bounds: PanelBounds | null,
  canMoveBorder: boolean,
  advanceFrame: boolean
): WandererState {
  let {
    x,
    y,
    vx,
    vy,
    frameIdx,
    facingLeft,
    borderProgress,
    hopPhase,
    orbitAngle,
    orbitCx,
    orbitCy,
    orbitRadiusPx,
    orbitSpeed,
    zigzagFlip,
    dashCooldown,
    dashBurstLeft,
    slashTimer,
    slashActive,
    renderYOffset,
  } = s;

  if (s.mode === "border") {
    if (!canMoveBorder || !bounds) return s;
    borderProgress += s.borderSpeed * dt;
    const pos = positionOnBorder(borderProgress, bounds);
    x = pos.x;
    y = pos.y;
    facingLeft = pos.facingLeft;
  } else if (s.mode === "hop") {
    hopPhase += dt * 0.15;
    renderYOffset = -Math.abs(Math.sin(hopPhase)) * 22;
    x += vx * dt;
    y += vy * dt;
    const bounced = bounceInArena(x, y, vx, vy, width, height);
    ({ x, y, vx, vy, facingLeft } = bounced);
  } else if (s.mode === "orbit") {
    orbitAngle += orbitSpeed * dt;
    const pos = orbitPosition(orbitCx, orbitCy, orbitAngle, orbitRadiusPx);
    x = pos.x;
    y = pos.y;
    facingLeft = pos.facingLeft;
  } else if (s.mode === "zigzag") {
    zigzagFlip -= dt;
    if (zigzagFlip <= 0) {
      vy = -vy;
      zigzagFlip = 48 + Math.random() * 24;
    }
    x += vx * dt;
    y += vy * dt;
    const bounced = bounceInArena(x, y, vx, vy, width, height);
    ({ x, y, vx, vy, facingLeft } = bounced);
  } else if (s.mode === "dash") {
    dashCooldown -= dt;
    if (dashBurstLeft > 0) {
      dashBurstLeft -= dt;
      x += vx * dt;
      y += vy * dt;
    } else {
      x += vx * 0.4 * dt;
      y += vy * 0.4 * dt;
      if (dashCooldown <= 0) {
        const speed = Math.hypot(vx, vy) || 1;
        vx = (vx / speed) * Math.max(speed, width * 0.00045);
        vy = (vy / speed) * Math.max(speed, height * 0.00035);
        dashBurstLeft = 26;
        dashCooldown = 95;
      }
    }
    const bounced = bounceInArena(x, y, vx, vy, width, height);
    ({ x, y, vx, vy, facingLeft } = bounced);
  } else if (s.mode === "slash") {
    slashTimer += dt;
    if (slashActive) {
      if (slashTimer >= 38) {
        slashActive = false;
        slashTimer = 0;
      } else if (advanceFrame && s.frames.length > 1) {
        frameIdx = (frameIdx + 1) % s.frames.length;
      }
    } else {
      x += vx * 0.5 * dt;
      y += vy * 0.5 * dt;
      const bounced = bounceInArena(x, y, vx, vy, width, height);
      ({ x, y, vx, vy, facingLeft } = bounced);
      if (slashTimer >= 100) {
        slashActive = true;
        slashTimer = 0;
        frameIdx = 0;
      } else if (advanceFrame && s.frames.length > 1) {
        frameIdx = 0;
      }
    }
  } else if (width > 0 && height > 0) {
    x += vx * dt;
    y += vy * dt;
    const bounced = bounceInArena(x, y, vx, vy, width, height);
    ({ x, y, vx, vy, facingLeft } = bounced);
  }

  if (advanceFrame && s.frames.length > 1 && s.mode !== "slash" && s.mode !== "border") {
    frameIdx = (frameIdx + 1) % s.frames.length;
  }

  return {
    ...s,
    x,
    y,
    vx,
    vy,
    frameIdx,
    facingLeft,
    borderProgress,
    hopPhase,
    orbitAngle,
    orbitCx,
    orbitCy,
    orbitRadiusPx,
    orbitSpeed,
    zigzagFlip,
    dashCooldown,
    dashBurstLeft,
    slashTimer,
    slashActive,
    renderYOffset,
  };
}

function randomRoamPoint(width: number, height: number): { x: number; y: number } {
  return {
    x: width * (0.12 + Math.random() * 0.76),
    y: height * (0.14 + Math.random() * 0.72),
  };
}

function tryStartChase(sprites: WandererState[]): ChaseState | null {
  const pacman = sprites.find((s) => s.isPacman && s.mode !== "border");
  if (!pacman) return null;

  let nearest: WandererState | null = null;
  let nearestDist = Infinity;
  for (const s of sprites) {
    if (s.id === pacman.id || s.mode === "border") continue;
    const dist = Math.hypot(s.x - pacman.x, s.y - pacman.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = s;
    }
  }
  if (!nearest) return null;

  return {
    chaserId: pacman.id,
    targetId: nearest.id,
    elapsedMs: 0,
    chaserVx: pacman.vx,
    chaserVy: pacman.vy,
    targetVx: nearest.vx,
    targetVy: nearest.vy,
  };
}

function applyChase(
  sprites: WandererState[],
  chase: ChaseState,
  dt: number,
  width: number,
  height: number
): { sprites: WandererState[]; chase: ChaseState | null } {
  const chaserIdx = sprites.findIndex((s) => s.id === chase.chaserId);
  const targetIdx = sprites.findIndex((s) => s.id === chase.targetId);
  if (chaserIdx < 0 || targetIdx < 0) {
    return { sprites, chase: null };
  }

  const next = sprites.map((s) => ({ ...s }));
  const chaser = next[chaserIdx];
  const target = next[targetIdx];
  const elapsedMs = chase.elapsedMs + dt * 16.67;

  if (elapsedMs >= CHASE_DURATION_MS) {
    const spot = randomRoamPoint(width, height);
    target.x = spot.x;
    target.y = spot.y;
    target.vx = chase.targetVx;
    target.vy = chase.targetVy;
    chaser.vx = chase.chaserVx;
    chaser.vy = chase.chaserVy;
    chaser.facingLeft = chase.chaserVx < 0;
    return { sprites: next, chase: null };
  }

  const dx = target.x - chaser.x;
  const dy = target.y - chaser.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const chaseSpeed = chaser.isPacman ? PACMAN_CHASE_SPEED : CHASE_SPEED;

  chaser.x += nx * chaseSpeed * dt;
  chaser.y += ny * chaseSpeed * dt;
  chaser.facingLeft = dx < 0;

  if (chaser.isPacman && chaser.frames.length > 1) {
    chaser.chompTimer += dt * 16.67;
    if (chaser.chompTimer >= CHOMP_FRAME_MS) {
      chaser.frameIdx = (chaser.frameIdx + 1) % chaser.frames.length;
      chaser.chompTimer = 0;
    }
  }

  target.x -= nx * FLEE_SPEED * dt;
  target.y -= ny * FLEE_SPEED * dt;
  target.facingLeft = dx < 0;

  const minX = width * 0.08;
  const maxX = width * 0.92;
  const minY = height * 0.12;
  const maxY = height * 0.88;
  for (const s of [chaser, target]) {
    s.x = Math.max(minX, Math.min(maxX, s.x));
    s.y = Math.max(minY, Math.min(maxY, s.y));
  }

  return {
    sprites: next,
    chase: { ...chase, elapsedMs },
  };
}

function PixelSprite({
  pixels,
  scale,
  x,
  y,
  yOffset,
  facingLeft,
  opacity,
}: {
  pixels: string[][];
  scale: number;
  x: number;
  y: number;
  yOffset: number;
  facingLeft: boolean;
  opacity: number;
}) {
  const size = pixels.length;
  const px = `${scale}px`;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, calc(-50% + ${yOffset}px)) scaleX(${facingLeft ? -1 : 1})`,
        opacity,
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateRows: `repeat(${size}, ${px})`,
          gridTemplateColumns: `repeat(${size}, ${px})`,
          imageRendering: "pixelated",
        }}
      >
        {pixels.map((row, r) =>
          row.map((color, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                backgroundColor: color === "#00000000" ? "transparent" : color,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SceneWanderersProps {
  layerId: number;
  active: boolean;
}

export default function SceneWanderers({ layerId, active }: SceneWanderersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const borderReadyRef = useRef(false);
  const panelBoundsRef = useRef<PanelBounds | null>(null);
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const biteCharsRef = useRef<BiteChar[]>([]);
  const spritesRef = useRef<WandererState[]>([]);
  const chaseRef = useRef<ChaseState | null>(null);
  const chaseCooldownRef = useRef(0);
  const borderActsRef = useRef<BorderActsState | null>(null);
  const [sprites, setSprites] = useState<WandererState[]>([]);
  const [borderActs, setBorderActs] = useState<BorderActSprite[]>([]);
  const [borderReady, setBorderReady] = useState(false);
  const frameClock = useRef(0);

  useEffect(() => {
    borderReadyRef.current = borderReady;
  }, [borderReady]);

  const remeasureBiteChars = () => {
    const container = containerRef.current;
    const scene = container?.parentElement;
    if (!container || !scene) return;
    biteCharsRef.current = measureBiteChars(container, scene);
  };

  useEffect(() => {
    if (!active) {
      const scene = containerRef.current?.parentElement;
      if (scene) restoreBiteTargets(scene);
      borderReadyRef.current = false;
      panelBoundsRef.current = null;
      containerSizeRef.current = { width: 0, height: 0 };
      biteCharsRef.current = [];
      spritesRef.current = [];
      chaseRef.current = null;
      chaseCooldownRef.current = 0;
      borderActsRef.current = null;
      setBorderReady(false);
      setSprites([]);
      setBorderActs([]);
      return;
    }

    const seeds = SCENE_SEEDS[layerId] ?? [];
    borderReadyRef.current = false;
    panelBoundsRef.current = null;
    setBorderReady(false);
    setSprites([]);
    setBorderActs([]);
    borderActsRef.current = null;

    let cancelled = false;
    let pollId = 0;
    let settleId = 0;
    let raf2 = 0;

    const applyLayout = (layout: ContainerLayout, initial: boolean) => {
      if (cancelled) return;
      panelBoundsRef.current = layout.bounds;
      containerSizeRef.current = { width: layout.width, height: layout.height };
      borderActsRef.current = initBorderActs(layout.bounds);
      setBorderActs(getBorderActSprites(borderActsRef.current));
      if (initial) {
        const next = seedToState(seeds, layout);
        spritesRef.current = next;
        setSprites(next);
        borderReadyRef.current = true;
        setBorderReady(true);
        remeasureBiteChars();
      } else {
        setSprites((prev) => {
          const next = applyPanelBounds(prev, layout.bounds);
          spritesRef.current = next;
          return next;
        });
        remeasureBiteChars();
      }
    };

    const measure = (initial: boolean) => {
      const container = containerRef.current;
      if (!container) return;
      const layout = measureLayout(container);
      if (layout) applyLayout(layout, initial);
    };

    const container = containerRef.current;
    const scene = container?.parentElement;
    if (!container || !scene) return;

    const finishInitial = () => measure(true);

    const transitionMs = sceneTransitionMs(scene);
    let raf1 = 0;

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== scene) return;
      if (event.propertyName === "transform" || event.propertyName === "opacity") {
        finishInitial();
      }
    };

    if (transitionMs > 0) {
      scene.addEventListener("transitionend", onTransitionEnd);
      pollId = window.setInterval(() => {
        if (!borderReadyRef.current) finishInitial();
      }, 80);
      settleId = window.setTimeout(() => {
        if (!borderReadyRef.current) finishInitial();
      }, transitionMs + 120);
    } else {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(finishInitial);
      });
    }

    const onResize = () => {
      const root = containerRef.current;
      if (!root) return;
      const layout = measureLayout(root);
      if (!layout) return;
      applyLayout(layout, !borderReadyRef.current);
    };

    const panel = scene.querySelector("[data-scene-panel]");
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    ro.observe(scene);
    if (panel) ro.observe(panel);
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      restoreBiteTargets(scene);
      if (transitionMs > 0) {
        scene.removeEventListener("transitionend", onTransitionEnd);
        window.clearInterval(pollId);
        window.clearTimeout(settleId);
      } else {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      }
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [layerId, active]);

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2);
      last = now;
      frameClock.current += dt;

      const advanceFrame = frameClock.current >= 8;
      if (advanceFrame) frameClock.current = 0;

      const bounds = panelBoundsRef.current;
      const canMoveBorder = borderReadyRef.current && bounds !== null;
      const { width, height } = containerSizeRef.current;

      if (chaseCooldownRef.current > 0) {
        chaseCooldownRef.current = Math.max(0, chaseCooldownRef.current - dt * 16.67);
      }

      let chase = chaseRef.current;
      if (!chase && chaseCooldownRef.current <= 0 && width > 0 && height > 0) {
        chase = tryStartChase(spritesRef.current);
        chaseRef.current = chase;
      }

      const chasingIds = chase ? new Set([chase.chaserId, chase.targetId]) : new Set<number>();

      let nextSprites = spritesRef.current.map((s) => {
        if (chasingIds.has(s.id)) return s;
        if (width <= 0 || height <= 0) return s;
        return updateSpriteMove(s, dt, width, height, bounds, canMoveBorder, advanceFrame);
      });

      if (chase && width > 0 && height > 0) {
        const chased = applyChase(nextSprites, chase, dt, width, height);
        nextSprites = chased.sprites;
        if (chase && !chased.chase) {
          chaseCooldownRef.current = CHASE_COOLDOWN_MS;
        }
        chaseRef.current = chased.chase;
      }

      if (advanceFrame) {
        nextSprites = nextSprites.map((s) => {
          if (!chasingIds.has(s.id) || s.frames.length <= 1) return s;
          if (chase && s.id === chase.chaserId && s.isPacman) return s;
          return { ...s, frameIdx: (s.frameIdx + 1) % s.frames.length };
        });
      }

      spritesRef.current = nextSprites;
      updateBiteChars(biteCharsRef.current, nextSprites);
      setSprites(nextSprites);

      if (borderReadyRef.current && borderActsRef.current && bounds) {
        borderActsRef.current.bounds = bounds;
        borderActsRef.current = tickBorderActs(borderActsRef.current, dt, advanceFrame);
        setBorderActs(getBorderActSprites(borderActsRef.current));
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, layerId]);

  if (!active) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {sprites.map((s) => {
        const hidden = s.mode === "border" && !borderReady;
        return (
          <div key={s.id}>
            <PixelSprite
              pixels={s.frames[s.frameIdx]}
              scale={s.scale}
              x={s.x}
              y={s.y}
              yOffset={s.renderYOffset}
              facingLeft={s.facingLeft}
              opacity={hidden ? 0 : (s.opacity ?? 0.85)}
            />
          </div>
        );
      })}
      {borderReady &&
        borderActs.map((act) => (
          <div key={act.id} className="relative z-[1]">
            <PixelSprite
              pixels={act.pixels}
              scale={act.scale}
              x={act.x}
              y={act.y}
              yOffset={act.yOffset}
              facingLeft={act.facingLeft}
              opacity={act.opacity}
            />
          </div>
        ))}
    </div>
  );
}
