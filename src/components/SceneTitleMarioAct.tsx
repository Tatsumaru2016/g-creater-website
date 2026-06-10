/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 各シーン共通：?ブロック（バッジ上）→ マリオはブロック真下で走りジャンプして押す →
 * キノコ出現 → 走り出しでキノコが落下 → マリオ点滅・巨大化
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playMarioBlockHit, playMarioPowerUp } from "../audio/invaderAudio";
import { RenderPixelSprite } from "./Characters";

const T = "#00000000";

/** サイズ統一前のバッジ上マリオ */
const BIG_MARIO_SCALE = 2.7;
const SMALL_MARIO_SCALE = 1.62;
const SMALL_MARIO_H = 14 * SMALL_MARIO_SCALE;
/** ちびマリオの高さ（21px）に合わせた 1 タイル分 */
const BLOCK_PIXEL = SMALL_MARIO_H / 16;
const PROP_PIXEL = SMALL_MARIO_H / 10;

/** SMB1 パレット風 ?ブロック：上面ハイライト・側面影・四隅リベット・白「?」黒縁 */
const QB = {
  out: "#883800",
  side: "#B85800",
  top: "#F8A838",
  rivet: "#502000",
  goldHi: "#FCF078",
  gold: "#F8D800",
  goldSh: "#C88800",
  ink: "#201008",
  paper: "#FCFCFC",
} as const;

const QUESTION_BLOCK: string[][] = [
  [T, QB.out, QB.top, QB.top, QB.top, QB.top, QB.top, QB.top, QB.top, QB.top, QB.top, QB.top, QB.top, QB.top, QB.out, T],
  [QB.out, QB.rivet, QB.top, QB.goldHi, QB.goldHi, QB.goldHi, QB.goldHi, QB.goldHi, QB.goldHi, QB.goldHi, QB.goldHi, QB.goldHi, QB.goldHi, QB.rivet, QB.out, T],
  [QB.side, QB.top, QB.rivet, QB.goldHi, QB.gold, QB.gold, QB.gold, QB.gold, QB.gold, QB.gold, QB.gold, QB.gold, QB.gold, QB.rivet, QB.top, QB.side],
  [QB.side, QB.goldHi, QB.gold, QB.ink, QB.ink, QB.ink, QB.ink, QB.ink, QB.gold, QB.gold, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.ink, QB.paper, QB.paper, QB.paper, QB.paper, QB.ink, QB.gold, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.ink, QB.paper, QB.paper, QB.paper, QB.paper, QB.paper, QB.ink, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.gold, QB.ink, QB.paper, QB.paper, QB.ink, QB.gold, QB.gold, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.gold, QB.gold, QB.ink, QB.ink, QB.ink, QB.gold, QB.gold, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.gold, QB.gold, QB.gold, QB.ink, QB.ink, QB.gold, QB.gold, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.gold, QB.gold, QB.gold, QB.ink, QB.paper, QB.gold, QB.gold, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.gold, QB.gold, QB.ink, QB.ink, QB.gold, QB.gold, QB.gold, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.gold, QB.gold, QB.gold, QB.ink, QB.gold, QB.gold, QB.gold, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.side, QB.goldHi, QB.gold, QB.gold, QB.ink, QB.paper, QB.paper, QB.paper, QB.paper, QB.ink, QB.gold, QB.gold, QB.goldHi, QB.side, QB.out, T],
  [QB.out, QB.side, QB.goldHi, QB.rivet, QB.goldSh, QB.goldSh, QB.goldSh, QB.goldSh, QB.goldSh, QB.goldSh, QB.goldSh, QB.rivet, QB.goldHi, QB.side, QB.out, T],
  [T, QB.out, QB.out, QB.side, QB.side, QB.side, QB.side, QB.side, QB.side, QB.side, QB.side, QB.out, QB.out, T, T, T],
  [T, T, QB.out, QB.out, QB.out, QB.out, QB.out, QB.out, QB.out, QB.out, QB.out, QB.out, T, T, T, T],
];

/** スーパーキノコ：赤い笠・白斑点・目付き茎 */
const MUSHROOM: string[][] = [
  [T, T, T, "#E32828", "#E32828", "#E32828", "#E32828", "#E32828", T, T],
  [T, T, "#E32828", "#FFFFFF", "#E32828", "#E32828", "#E32828", "#FFFFFF", "#E32828", T],
  [T, "#E32828", "#E32828", "#E32828", "#E32828", "#E32828", "#E32828", "#E32828", "#E32828", T],
  [T, "#B81818", "#B81818", "#B81818", "#B81818", "#B81818", "#B81818", "#B81818", "#B81818", T],
  [T, T, "#FFDBA8", "#281800", "#FFDBA8", "#FFDBA8", "#281800", "#FFDBA8", T, T],
  [T, T, "#FFDBA8", "#FFDBA8", "#FFDBA8", "#FFDBA8", "#FFDBA8", "#FFDBA8", T, T],
  [T, T, T, "#FFDBA8", "#FFDBA8", "#FFDBA8", "#FFDBA8", T, T, T],
  [T, T, T, T, "#D49860", "#D49860", "#D49860", T, T, T],
  [T, T, T, T, T, "#D49860", T, T, T, T],
  [T, T, T, T, T, T, T, T, T, T],
];

const BLOCK_GAP = 8;
/** バッジ上端と ?ブロック下端のあいだ（px） */
const BADGE_BLOCK_GAP = 14;
/** バッジよりさらに上へ押し上げるオフセット（px） */
const BLOCK_ABOVE_BADGE = 28;
/** 頭とブロック底の重なり（px） */
const HEAD_BLOCK_OVERLAP = 4;
/** 巨大化点滅の長さ（tick） */
const POWER_FLASH_TICKS = 28;
/** バッジ上端より足元を何 px 上に置く（枠内にはみ出さない） */
const MARIO_FEET_ABOVE_BADGE = 5;
/** パネル枠上端より足元を最低何 px 上に保つ */
const PANEL_TOP_MARGIN = 8;
/** 接近開始：走行面より下 */
const APPROACH_FROM_BELOW = 8;
const RUN_GROUND_SPEED = 2.6;
/** ブロック高さ程度までせり出し */
const MUSHROOM_RISE_MAX = 20;
/** ?ブロック中心をこれだけ過ぎたらキノコが落下 */
const MARIO_PASS_BLOCK_DIST = 12;
const MUSHROOM_FALL_SPEED = 2.5;
const MUSHROOM_CATCH_DIST = 18;
/** 巨大化後、この時間経過で最初からやり直し */
const POWERED_HOLD_TICKS = 130;

type Phase =
  | "approach"
  | "runToBlock"
  | "jump"
  | "popRun"
  | "flash"
  | "poweredHold";

interface BadgeAnchor {
  centerX: number;
  blockY: number;
  blockBottom: number;
  /** ?ブロック真下の走行面（中心Y） */
  groundY: number;
  jumpH: number;
  /** 頭がブロック底に届くときのマリオ中心Y（これより上へは行かない） */
  minCenterYAtBlock: number;
  badgeTop: number;
  badgeBottom: number;
  badgeLeft: number;
  badgeRight: number;
  /** シーンパネル（#main-pixel-editor 等）の上端 */
  panelTop: number | null;
}

interface SimState {
  phase: Phase;
  marioX: number;
  marioY: number;
  approachProg: number;
  jumpProg: number;
  blockBump: number;
  mushroomRise: number;
  mushroomX: number;
  mushroomY: number;
  mushFalling: boolean;
  holdTimer: number;
  flashTimer: number;
  runnerHop: number;
  mushroomActive: boolean;
  poweredUp: boolean;
}

function marioScaleFor(s: SimState): number {
  return s.poweredUp || s.phase === "poweredHold"
    ? BIG_MARIO_SCALE
    : SMALL_MARIO_SCALE;
}

function mushroomSizePx(): number {
  return MUSHROOM.length * PROP_PIXEL;
}

/** マリオ足元にキノコが乗る高さ */
function mushroomGroundY(standY: number, marioH: number): number {
  const mushH = mushroomSizePx();
  return standY + marioH * 0.5 - mushH * 0.5;
}

/** マリオとキノコの当たり判定（中心基準 AABB） */
function marioMushroomOverlap(
  marioX: number,
  marioY: number,
  marioW: number,
  marioH: number,
  mushX: number,
  mushY: number
): boolean {
  const mushSize = mushroomSizePx();
  const halfMW = marioW * 0.5;
  const halfMH = marioH * 0.5;
  const halfMush = mushSize * 0.5;
  return (
    Math.abs(marioX - mushX) < halfMW + halfMush &&
    Math.abs(marioY - mushY) < halfMH + halfMush
  );
}

function mushroomEmergeY(
  blockY: number,
  blockH: number,
  rise: number
): number {
  const blockTop = blockY - blockH * 0.5;
  return blockTop - rise - mushroomSizePx() * 0.5;
}

function marioHeight(scale: number): number {
  return 14 * scale;
}

function marioWidth(scale: number): number {
  return 16 * scale;
}

/** バッジ横幅内（マリオ中心がはみ出さない範囲） */
function badgeRunBounds(anchor: BadgeAnchor, marioW: number) {
  const minX = anchor.badgeLeft + marioW * 0.5;
  const maxX = anchor.badgeRight - marioW * 0.5;
  return { minX, maxX: Math.max(minX, maxX) };
}

function clampMarioX(
  x: number,
  anchor: BadgeAnchor,
  marioW: number
): number {
  const { minX, maxX } = badgeRunBounds(anchor, marioW);
  return Math.max(minX, Math.min(maxX, x));
}

function blockSizePx(): number {
  return QUESTION_BLOCK.length * BLOCK_PIXEL;
}

function jumpHeight(marioH: number): number {
  return marioH + BLOCK_GAP + 24;
}

/** ブロック底を頭で叩ける最高位置（中心Y・画面座標） */
function marioMinCenterYAtBlock(blockBottom: number, marioH: number): number {
  return blockBottom - HEAD_BLOCK_OVERLAP + marioH * 0.5;
}

/** ジャンプ弧をブロック下面で頭打ち（上方向は貫通しない） */
function clampMarioJumpY(
  desiredCenterY: number,
  minCenterYAtBlock: number,
  floorCenterY: number
): { y: number; hitBlockCeiling: boolean } {
  const hitBlockCeiling = desiredCenterY < minCenterYAtBlock;
  const y = Math.max(
    Math.min(desiredCenterY, floorCenterY),
    minCenterYAtBlock
  );
  return { y, hitBlockCeiling };
}

function panelIdForScene(sceneIndex: number): string {
  return sceneIndex === 0 ? "main-pixel-editor" : `scene-panel-${sceneIndex}`;
}

function feetClearance(marioH: number): number {
  const smallH = marioHeight(SMALL_MARIO_SCALE);
  const extra = Math.max(0, marioH - smallH) * 0.4;
  return MARIO_FEET_ABOVE_BADGE + extra;
}

function maxMarioCenterAbovePanel(panelTop: number, marioH: number): number {
  return panelTop - PANEL_TOP_MARGIN - marioH * 0.5;
}

function groundCenterY(
  badgeTop: number,
  marioH: number,
  panelTop: number | null
): number {
  let y = badgeTop - feetClearance(marioH) - marioH * 0.5;
  if (panelTop != null) {
    y = Math.min(y, maxMarioCenterAbovePanel(panelTop, marioH));
  }
  return y;
}

/** 巨大化後：ちびマリオの足元を保ったまま中心Y（パネル枠クランプ込み） */
function bigMarioStandY(anchor: BadgeAnchor): number {
  const smallH = marioHeight(SMALL_MARIO_SCALE);
  const bigH = marioHeight(BIG_MARIO_SCALE);
  const feetY = anchor.groundY + smallH * 0.5;
  const centerY = feetY - bigH * 0.5;
  return clampMarioCenterAbovePanel(centerY, bigH, anchor.panelTop);
}

function clampMarioCenterAbovePanel(
  centerY: number,
  marioH: number,
  panelTop: number | null
): number {
  if (panelTop == null) return centerY;
  return Math.min(centerY, maxMarioCenterAbovePanel(panelTop, marioH));
}

/** ?ブロック真下を走行面にし、縦ジャンプで底面を叩く */
function measureBadgeAnchor(
  badge: DOMRect,
  marioH: number,
  panelTop: number | null
): BadgeAnchor {
  const blockH = blockSizePx();
  const centerX = badge.left + badge.width / 2;
  const badgeBottom = badge.bottom;

  const blockY =
    badge.top - blockH * 0.5 - BADGE_BLOCK_GAP - BLOCK_ABOVE_BADGE;
  const blockBottom = blockY + blockH * 0.5;

  const groundY = groundCenterY(badge.top, marioH, panelTop);
  const minCenterYAtBlock = marioMinCenterYAtBlock(blockBottom, marioH);
  const riseToBlock = groundY - minCenterYAtBlock;
  const jumpH = Math.max(jumpHeight(marioH), riseToBlock);

  return {
    centerX,
    blockY,
    blockBottom,
    groundY,
    jumpH,
    minCenterYAtBlock,
    badgeTop: badge.top,
    badgeBottom,
    badgeLeft: badge.left,
    badgeRight: badge.right,
    panelTop,
  };
}

function approachStartY(anchor: BadgeAnchor): number {
  return anchor.groundY + APPROACH_FROM_BELOW;
}

/** バッジ左端ライン上（走行可能範囲の左端） */
function leftLineX(anchor: BadgeAnchor, marioW: number): number {
  return badgeRunBounds(anchor, marioW).minX;
}

function seedMarioAtLeftLine(
  s: SimState,
  anchor: BadgeAnchor,
  marioW: number
) {
  s.marioX = leftLineX(anchor, marioW);
  s.marioY = approachStartY(anchor);
}

function initCycle(s: SimState, sceneEnter = false) {
  s.phase = "approach";
  s.approachProg = 0;
  s.jumpProg = 0;
  s.blockBump = 0;
  s.mushroomRise = 0;
  s.mushroomX = 0;
  s.mushroomY = 0;
  s.mushFalling = false;
  s.holdTimer = 0;
  s.flashTimer = 0;
  s.runnerHop = 0;
  s.mushroomActive = false;
  s.poweredUp = false;
  s.marioX = 0;
  s.marioY = 0;
  void sceneEnter;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function PixelSprite({
  pixels,
  x,
  y,
  scale,
  facingLeft,
  opacity,
  yBump = 0,
}: {
  pixels: string[][];
  x: number;
  y: number;
  scale: number;
  facingLeft: boolean;
  opacity: number;
  yBump?: number;
}) {
  const size = pixels.length;
  const px = `${scale}px`;

  return (
    <div
      className="pointer-events-none"
      style={{
        position: "fixed",
        left: x,
        top: y + yBump,
        transform: `translate(-50%, -50%) scaleX(${facingLeft ? -1 : 1})`,
        opacity,
        imageRendering: "pixelated",
        zIndex: 52,
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateRows: `repeat(${size}, ${px})`,
          gridTemplateColumns: `repeat(${size}, ${px})`,
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

export interface SceneTitleMarioActProps {
  scrollProgress: number;
}

export function SceneTitleMarioAct({ scrollProgress }: SceneTitleMarioActProps) {
  const sceneIndex = Math.min(4, Math.max(0, Math.round(scrollProgress)));
  const visible = Math.abs(scrollProgress - sceneIndex) < 0.55;

  const simRef = useRef<SimState>({
    phase: "approach",
    marioX: 0,
    marioY: 0,
    approachProg: 0,
    jumpProg: 0,
    blockBump: 0,
    mushroomRise: 0,
    mushroomX: 0,
    mushroomY: 0,
    mushFalling: false,
    holdTimer: 0,
    flashTimer: 0,
    runnerHop: 0,
    mushroomActive: false,
    poweredUp: false,
  });
  const anchorRef = useRef<BadgeAnchor | null>(null);
  const sceneRef = useRef(sceneIndex);
  const [, setFrame] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const sceneChanged = sceneRef.current !== sceneIndex;
    if (sceneChanged) {
      sceneRef.current = sceneIndex;
      initCycle(simRef.current, true);
    } else if (simRef.current.phase === "approach" && simRef.current.approachProg === 0) {
      initCycle(simRef.current, true);
    }

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      if (!visible) return;

      const dt = Math.min(3, (now - last) / 16.67);
      last = now;

      const badgeEl = document.getElementById(`scene-badge-${sceneIndex}`);
      const panelEl = document.getElementById(panelIdForScene(sceneIndex));
      const panelTop = panelEl ? panelEl.getBoundingClientRect().top : null;
      const smallH = marioHeight(SMALL_MARIO_SCALE);
      if (badgeEl) {
        anchorRef.current = measureBadgeAnchor(
          badgeEl.getBoundingClientRect(),
          smallH,
          panelTop
        );
      }

      const s = simRef.current;
      const anchor = anchorRef.current;
      if (!anchor) {
        raf = requestAnimationFrame(tick);
        return;
      }

      s.runnerHop += 0.2 * dt;

      if (s.blockBump > 0) s.blockBump -= dt * 0.85;

      const smallW = marioWidth(SMALL_MARIO_SCALE);
      const leftX = leftLineX(anchor, smallW);
      const startY = approachStartY(anchor);

      if (s.phase === "approach" && s.approachProg === 0) {
        seedMarioAtLeftLine(s, anchor, smallW);
      }

      switch (s.phase) {
        case "approach":
          s.approachProg = Math.min(1, s.approachProg + 0.028 * dt);
          {
            const t = easeOutCubic(s.approachProg);
            s.marioX = leftX;
            s.marioY = lerp(startY, anchor.groundY, t);
          }
          if (s.approachProg >= 1) {
            s.marioX = leftX;
            s.marioY = anchor.groundY;
            s.phase = "runToBlock";
          }
          break;
        case "runToBlock": {
          s.marioY = anchor.groundY;
          s.marioX = clampMarioX(
            s.marioX + RUN_GROUND_SPEED * dt,
            anchor,
            smallW
          );
          const blockCenterX = clampMarioX(anchor.centerX, anchor, smallW);
          if (s.marioX >= blockCenterX - 0.5) {
            s.marioX = blockCenterX;
            s.marioY = anchor.groundY;
            s.phase = "jump";
            s.jumpProg = 0;
          }
          break;
        }
        case "jump": {
          s.jumpProg = Math.min(1, s.jumpProg + 0.038 * dt);
          const wave = Math.sin(s.jumpProg * Math.PI);
          const blockH = blockSizePx();
          const ascending = s.jumpProg <= 0.5;
          s.marioX = clampMarioX(anchor.centerX, anchor, smallW);
          const desiredY = anchor.groundY - wave * anchor.jumpH;
          const { y: jumpY, hitBlockCeiling } = clampMarioJumpY(
            desiredY,
            anchor.minCenterYAtBlock,
            anchor.groundY
          );
          s.marioY = jumpY;

          if (hitBlockCeiling && ascending && !s.mushroomActive) {
            s.mushroomActive = true;
            s.mushroomRise = 0;
            s.mushFalling = false;
            s.blockBump = 18;
            s.mushroomX = anchor.centerX;
            s.mushroomY = mushroomEmergeY(anchor.blockY, blockH, 0);
            playMarioBlockHit();
          }

          if (s.mushroomActive) {
            s.mushroomRise = Math.min(
              MUSHROOM_RISE_MAX,
              s.mushroomRise + 1.2 * dt
            );
            s.mushroomY = mushroomEmergeY(
              anchor.blockY,
              blockH,
              s.mushroomRise
            );
          }

          if (s.jumpProg >= 1) {
            s.marioY = anchor.groundY;
            s.phase = "popRun";
          }
          break;
        }
        case "popRun": {
          const blockH = blockSizePx();
          const mushGround = mushroomGroundY(anchor.groundY, smallH);

          s.marioY = anchor.groundY;
          s.marioX = clampMarioX(
            s.marioX + RUN_GROUND_SPEED * dt,
            anchor,
            smallW
          );
          if (s.mushroomActive) {
            if (!s.mushFalling) {
              s.mushroomRise = Math.min(
                MUSHROOM_RISE_MAX,
                s.mushroomRise + 1.1 * dt
              );
              s.mushroomX = anchor.centerX;
              s.mushroomY = mushroomEmergeY(
                anchor.blockY,
                blockH,
                s.mushroomRise
              );

              if (
                s.marioX > anchor.centerX + MARIO_PASS_BLOCK_DIST &&
                s.mushroomRise >= MUSHROOM_RISE_MAX * 0.85
              ) {
                s.mushFalling = true;
              }
            } else {
              const dx = s.marioX - s.mushroomX;
              const dy = mushGround - s.mushroomY;
              const d = Math.hypot(dx, dy);
              if (
                marioMushroomOverlap(
                  s.marioX,
                  s.marioY,
                  smallW,
                  smallH,
                  s.mushroomX,
                  s.mushroomY
                )
              ) {
                s.poweredUp = true;
                playMarioPowerUp();
                s.marioY = bigMarioStandY(anchor);
                s.marioX = clampMarioX(
                  s.marioX,
                  anchor,
                  marioWidth(BIG_MARIO_SCALE)
                );
                s.mushroomActive = false;
                s.phase = "flash";
                s.flashTimer = 0;
              } else if (d > 0.5) {
                const step = MUSHROOM_FALL_SPEED * dt;
                s.mushroomX += (dx / d) * step;
                s.mushroomY += (dy / d) * step + 0.35 * dt;
              }
            }
          }
          break;
        }
        case "flash": {
          const bigW = marioWidth(BIG_MARIO_SCALE);
          s.marioY = bigMarioStandY(anchor);
          s.marioX = clampMarioX(s.marioX, anchor, bigW);
          s.flashTimer += dt;
          if (s.flashTimer >= POWER_FLASH_TICKS) {
            s.phase = "poweredHold";
            s.holdTimer = 0;
          }
          break;
        }
        case "poweredHold": {
          const bigW = marioWidth(BIG_MARIO_SCALE);
          s.marioY = bigMarioStandY(anchor);
          s.marioX = clampMarioX(s.marioX, anchor, bigW);
          s.holdTimer += dt;
          if (s.holdTimer >= POWERED_HOLD_TICKS) {
            initCycle(s, true);
          }
          break;
        }
      }

      setFrame((f) => (f + 1) % 100000);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sceneIndex, visible]);

  useEffect(() => {
    if (!visible) {
      sceneRef.current = sceneIndex;
    }
  }, [visible, sceneIndex]);

  if (!visible) return null;

  const badgeEl =
    typeof document !== "undefined"
      ? document.getElementById(`scene-badge-${sceneIndex}`)
      : null;
  if (!badgeEl) return null;

  const anchor =
    anchorRef.current ??
    measureBadgeAnchor(
      badgeEl.getBoundingClientRect(),
      marioHeight(SMALL_MARIO_SCALE),
      document.getElementById(panelIdForScene(sceneIndex))?.getBoundingClientRect()
        .top ?? null
    );

  const s = simRef.current;
  const smallW = marioWidth(SMALL_MARIO_SCALE);
  const displayPos =
    s.phase === "approach" && s.approachProg === 0 && s.marioX === 0
      ? { x: leftLineX(anchor, smallW), y: approachStartY(anchor) }
      : { x: s.marioX, y: s.marioY };
  const marioScale = marioScaleFor(s);
  const blockBumpLift = s.blockBump > 0 ? -7 : 0;
  const blockX = anchor.centerX;
  const blockY = anchor.blockY + blockBumpLift;

  const showMushroom =
    s.mushroomActive &&
    (s.phase === "jump" || s.phase === "popRun");

  const isRunning =
    s.phase === "approach" ||
    s.phase === "runToBlock" ||
    s.phase === "popRun";
  const runFrame = Math.floor(s.runnerHop / Math.PI) % 2;
  const marioState =
    s.phase === "jump"
      ? "jump"
      : isRunning
        ? runFrame === 0
          ? "walk"
          : "walk2"
        : s.phase === "poweredHold"
          ? "victory"
          : "idle";
  const runBounce = isRunning ? Math.sin(s.runnerHop) * -4 : 0;

  const marioOpacity =
    s.phase === "flash"
      ? 0.25 + Math.abs(Math.sin(s.flashTimer * 0.55)) * 0.75
      : 0.96;

  return createPortal(
    <>
      <PixelSprite
        pixels={QUESTION_BLOCK}
        x={blockX}
        y={blockY}
        scale={BLOCK_PIXEL}
        facingLeft={false}
        opacity={1}
      />
      {showMushroom && (
        <PixelSprite
          pixels={MUSHROOM}
          x={s.mushroomX}
          y={s.mushroomY}
          scale={PROP_PIXEL}
          facingLeft={false}
          opacity={1}
        />
      )}
      <div
        className="pointer-events-none"
        style={{
          position: "fixed",
          left: displayPos.x,
          top: displayPos.y + runBounce,
          transform: "translate(-50%, -50%)",
          opacity: marioOpacity,
          zIndex: 52,
          transition: s.phase === "flash" ? "opacity 0.08s linear" : undefined,
        }}
      >
        <RenderPixelSprite
          type="mario"
          state={marioState}
          facing="right"
          scale={marioScale}
        />
      </div>
    </>,
    document.body
  );
}
