/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Guncore（ガンダム）vs Greengrunt（シャア専用ザク）— 画面下部帯で接近・射撃・回避を繰り返す。
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CharacterSpeechBubble } from "./Characters";
import { WANDERER_SPRITE_SCALE } from "../constants/characterSpriteScale";
import { homageFrames, type HomageId } from "../data/homageSprites";
import { useI18n } from "../i18n";

const SPRITE_SCALE = WANDERER_SPRITE_SCALE;
/** 下部バンドの高さ（vh）— 調整ノブ */
const BAND_HEIGHT_VH = 30;

const X_MIN = 8;
const X_MAX = 92;
const Y_MIN = 12;
const Y_MAX = 88;

const ENGAGE_DIST = 28;
const CHASE_STANDOFF = 14;
const ARRIVE_DIST = 4;
const BOLT_TTL = 16;
const BOLT_TRAIL = 0.6;
const DODGE_RADIUS = 3.2;
const DODGE_BURST_TICKS = 14;
const SLASH_DURATION = 22;
const SLASH_RANGE = 14;
const SLASH_CHANCE = 0.014;
const DIALOGUE_TICKS = 85;
const SPEECH_COOLDOWN = 58;

const ROAM_SPEED = { guncore: 0.22, greengrunt: 0.2 } as const;
const FIGHT_SPEED = { guncore: 0.32, greengrunt: 0.28 } as const;
const DODGE_SPEED = 0.55;

type MechKind = "guncore" | "greengrunt";
type DuelPhase = "roam" | "fight";

interface Mech {
  kind: MechKind;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  fireCooldown: number;
  weavePhase: number;
  frame: number;
  facingLeft: boolean;
  dodgeBurst: number;
  dodgeVx: number;
  dodgeVy: number;
  slashTicks: number;
  dialogue?: string;
  dialogueTicks: number;
  speechCooldown: number;
}

interface Bolt {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  from: MechKind;
  ttl: number;
}

interface DuelState {
  guncore: Mech;
  greengrunt: Mech;
  phase: DuelPhase;
  bolts: Bolt[];
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(bx - ax, by - ay);
}

function randomBandPoint() {
  return {
    x: X_MIN + Math.random() * (X_MAX - X_MIN),
    y: Y_MIN + Math.random() * (Y_MAX - Y_MIN),
  };
}

function makeInitialState(): DuelState {
  const gPos = { x: 22, y: 52 };
  const zPos = { x: 78, y: 48 };
  const mk = (
    kind: MechKind,
    pos: { x: number; y: number },
    facingLeft: boolean
  ): Mech => {
    const wander = randomBandPoint();
    return {
      kind,
      ...pos,
      targetX: wander.x,
      targetY: wander.y,
      fireCooldown: 18 + Math.random() * 12,
      weavePhase: Math.random() * Math.PI * 2,
      frame: 0,
      facingLeft,
      dodgeBurst: 0,
      dodgeVx: 0,
      dodgeVy: 0,
      slashTicks: 0,
      dialogueTicks: 0,
      speechCooldown: 20 + Math.random() * 30,
    };
  };
  return {
    guncore: mk("guncore", gPos, false),
    greengrunt: mk("greengrunt", zPos, true),
    phase: "roam",
    bolts: [],
  };
}

function mechSpeed(kind: MechKind, fighting: boolean, dodging: boolean): number {
  if (dodging) return DODGE_SPEED;
  const table = fighting ? FIGHT_SPEED : ROAM_SPEED;
  return table[kind];
}

function HomagePixelSprite({
  homageId,
  frame,
  facingLeft,
  scale = SPRITE_SCALE,
}: {
  homageId: HomageId;
  frame: number;
  facingLeft?: boolean;
  scale?: number;
}) {
  const frames = homageFrames(homageId);
  const pixels = frames[frame % frames.length] ?? frames[0];
  const rows = pixels.length;
  const cols = pixels[0]?.length ?? 0;
  const px = `${scale}px`;

  return (
    <div
      className="inline-block select-none"
      style={{
        transform: `scaleX(${facingLeft ? -1 : 1})`,
        imageRendering: "pixelated",
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateRows: `repeat(${rows}, ${px})`,
          gridTemplateColumns: `repeat(${cols}, ${px})`,
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

function chaseAimPoint(self: Mech, foe: Mech): { x: number; y: number } {
  const cd = dist(self.x, self.y, foe.x, foe.y);
  if (cd < 0.01) return randomBandPoint();

  const angle = Math.atan2(foe.y - self.y, foe.x - self.x);
  if (cd < CHASE_STANDOFF) {
    const strafe = self.weavePhase * 0.85;
    return {
      x: self.x + Math.cos(strafe) * 4,
      y: self.y + Math.sin(strafe * 0.9) * 3,
    };
  }

  return {
    x: foe.x - Math.cos(angle) * CHASE_STANDOFF,
    y: foe.y - Math.sin(angle) * CHASE_STANDOFF,
  };
}

function clampBand(x: number, y: number) {
  return {
    x: Math.max(X_MIN, Math.min(X_MAX, x)),
    y: Math.max(Y_MIN, Math.min(Y_MAX, y)),
  };
}

function pickLine(lines: string[]): string | undefined {
  if (lines.length === 0) return undefined;
  return lines[Math.floor(Math.random() * lines.length)];
}

function tickDialogue(mech: Mech, dt: number): Mech {
  let { dialogue, dialogueTicks, speechCooldown } = mech;
  speechCooldown = Math.max(0, speechCooldown - dt);
  if (dialogue) {
    dialogueTicks -= dt;
    if (dialogueTicks <= 0) {
      dialogue = undefined;
      dialogueTicks = 0;
    }
  }
  return { ...mech, dialogue, dialogueTicks, speechCooldown };
}

function trySpeak(
  mech: Mech,
  lines: string[],
  opts?: { force?: boolean }
): Mech {
  const force = opts?.force ?? false;
  if (lines.length === 0) return mech;
  if (!force && mech.speechCooldown > 0) return mech;
  const line = pickLine(lines);
  if (!line) return mech;
  return {
    ...mech,
    dialogue: line,
    dialogueTicks: DIALOGUE_TICKS,
    speechCooldown: SPEECH_COOLDOWN,
  };
}

function tickMech(
  mech: Mech,
  foe: Mech,
  fighting: boolean,
  dt: number
): Mech {
  let dodgeBurst = Math.max(0, mech.dodgeBurst - dt);
  let dodgeVx = mech.dodgeVx;
  let dodgeVy = mech.dodgeVy;
  let fireCooldown = Math.max(0, mech.fireCooldown - dt);

  let targetX = mech.targetX;
  let targetY = mech.targetY;

  if (dodgeBurst > 0) {
    targetX = mech.x + dodgeVx * 8;
    targetY = mech.y + dodgeVy * 8;
  } else if (fighting) {
    const aim = chaseAimPoint(mech, foe);
    targetX = aim.x;
    targetY = aim.y;
  } else {
    const toTarget = dist(mech.x, mech.y, targetX, targetY);
    if (toTarget < ARRIVE_DIST) {
      const p = randomBandPoint();
      targetX = p.x;
      targetY = p.y;
    }
  }

  const dodging = dodgeBurst > 0;
  const weavePhase = mech.weavePhase + 0.07 * dt;
  const speed = mechSpeed(mech.kind, fighting, dodging) * dt;
  const d = dist(mech.x, mech.y, targetX, targetY);

  let x = mech.x;
  let y = mech.y;
  if (d > 0.05) {
    const step = Math.min(d, speed);
    x += ((targetX - mech.x) / d) * step;
    y += ((targetY - mech.y) / d) * step * 0.88;
  }
  if (!dodging) {
    y += Math.sin(weavePhase) * (fighting ? 0.22 : 0.18) * dt;
  }

  const clamped = clampBand(x, y);
  x = clamped.x;
  y = clamped.y;

  const vx = x - mech.x;
  const moved = Math.hypot(vx, y - mech.y) > 0.02;
  const facingLeft = moved ? vx < 0 : mech.facingLeft;
  const frame = (mech.frame + (moved ? 1 : 0)) % 2;

  return {
    ...mech,
    x,
    y,
    targetX: dodging ? mech.targetX : targetX,
    targetY: dodging ? mech.targetY : targetY,
    fireCooldown,
    weavePhase,
    frame,
    facingLeft,
    dodgeBurst,
    dodgeVx,
    dodgeVy,
  };
}

function tickSimulation(
  state: DuelState,
  boltSeq: { n: number },
  dt: number,
  lines: { gundam: string[]; zaku: string[] }
): DuelState {
  const separation = dist(
    state.guncore.x,
    state.guncore.y,
    state.greengrunt.x,
    state.greengrunt.y
  );

  let phase = state.phase;
  const wasFighting = state.phase === "fight";
  if (phase === "roam" && separation < ENGAGE_DIST) {
    phase = "fight";
  } else if (phase === "fight" && separation > ENGAGE_DIST * 1.55) {
    phase = "roam";
  }

  const fighting = phase === "fight";
  let guncore = tickMech(state.guncore, state.greengrunt, fighting, dt);
  let greengrunt = tickMech(state.greengrunt, state.guncore, fighting, dt);
  guncore = tickDialogue(guncore, dt);
  greengrunt = tickDialogue(greengrunt, dt);

  if (fighting && !wasFighting) {
    guncore = trySpeak(guncore, lines.gundam, { force: true });
    greengrunt = trySpeak(greengrunt, lines.zaku, { force: true });
  }

  if (guncore.slashTicks > 0) {
    guncore = { ...guncore, slashTicks: Math.max(0, guncore.slashTicks - dt) };
  } else if (
    fighting &&
    separation < SLASH_RANGE &&
    Math.random() < SLASH_CHANCE * dt
  ) {
    guncore = trySpeak(
      { ...guncore, slashTicks: SLASH_DURATION, fireCooldown: 28 },
      lines.gundam
    );
  }

  if (guncore.slashTicks > 14 && greengrunt.dodgeBurst <= 0) {
    const dx = greengrunt.x - guncore.x;
    const dy = greengrunt.y - guncore.y;
    const mag = Math.max(0.01, Math.hypot(dx, dy));
    greengrunt = trySpeak(
      {
        ...greengrunt,
        dodgeBurst: DODGE_BURST_TICKS,
        dodgeVx: (dx / mag) * 0.6,
        dodgeVy: (dy / mag) * 0.6,
      },
      lines.zaku
    );
  }

  const newBolts: Bolt[] = [];
  if (fighting) {
    for (const mech of [guncore, greengrunt]) {
      if (mech.kind === "guncore" && mech.slashTicks > 0) continue;
      if (mech.fireCooldown > 0) continue;
      const target = mech.kind === "guncore" ? greengrunt : guncore;
      const d = dist(mech.x, mech.y, target.x, target.y);
      if (d > 36 || d < 6) continue;

      const dx = target.x - mech.x;
      const dy = target.y - mech.y;
      const mag = Math.max(0.01, Math.hypot(dx, dy));
      const boltSpeed = mech.kind === "guncore" ? 0.88 : 0.72;

      newBolts.push({
        id: boltSeq.n++,
        x: mech.x,
        y: mech.y,
        vx: (dx / mag) * boltSpeed,
        vy: (dy / mag) * boltSpeed,
        from: mech.kind,
        ttl: BOLT_TTL,
      });

      mech.fireCooldown =
        mech.kind === "guncore"
          ? 24 + Math.floor(Math.random() * 10)
          : 30 + Math.floor(Math.random() * 12);

      if (mech.kind === "guncore") {
        guncore = trySpeak(guncore, lines.gundam);
      } else {
        greengrunt = trySpeak(greengrunt, lines.zaku);
      }
    }
  }

  let bolts = [...state.bolts, ...newBolts]
    .map((b) => ({
      ...b,
      x: b.x + b.vx * dt,
      y: b.y + b.vy * dt,
      ttl: b.ttl - dt,
    }))
    .filter(
      (b) =>
        b.ttl > 0 && b.x > 2 && b.x < 98 && b.y > 4 && b.y < 96
    );

  const mechs: Mech[] = [guncore, greengrunt];
  for (const bolt of bolts) {
    const targetKind: MechKind =
      bolt.from === "guncore" ? "greengrunt" : "guncore";
    const idx = targetKind === "guncore" ? 0 : 1;
    const target = mechs[idx];
    if (target.dodgeBurst > 0) continue;
    if (dist(bolt.x, bolt.y, target.x, target.y) >= DODGE_RADIUS) continue;

    const perpX = -bolt.vy;
    const perpY = bolt.vx;
    const pm = Math.max(0.01, Math.hypot(perpX, perpY));
    const dodgeDir = Math.random() < 0.5 ? 1 : -1;
    const dodged = {
      ...target,
      dodgeBurst: DODGE_BURST_TICKS,
      dodgeVx: (perpX / pm) * dodgeDir,
      dodgeVy: (perpY / pm) * dodgeDir,
    };
    const spoke =
      Math.random() < 0.35
        ? trySpeak(
            dodged,
            targetKind === "guncore" ? lines.gundam : lines.zaku
          )
        : dodged;
    if (targetKind === "guncore") guncore = spoke;
    else greengrunt = spoke;
    mechs[idx] = spoke;
  }

  bolts = bolts.filter((bolt) => {
    const target = bolt.from === "guncore" ? greengrunt : guncore;
    return dist(bolt.x, bolt.y, target.x, target.y) >= 1.4;
  });

  return { guncore, greengrunt, phase, bolts };
}

const DEFAULT_GUNDAM_LINES = [
  "ガンダムではないと勝てない！",
  "見えない、見える！",
  "敵はまだ…やってないのか…",
  "ファーストコンタクト！",
  "赤い彗星だ！",
  "追うぞ、シャア！",
];

const DEFAULT_ZAKU_LINES = [
  "三倍速で戻ってきたぞ！",
  "甘いな、アムロ！",
  "私をシャアと呼ぶのだ！",
  "赤い彗星だ！",
  "見せてやる、ザクで何ができるかを！",
  "再会するとは奇遇だな！",
];

export function GundamZakuDuel() {
  const { t, dict } = useI18n();
  const boltSeqRef = useRef({ n: 1 });
  const linesRef = useRef({ gundam: DEFAULT_GUNDAM_LINES, zaku: DEFAULT_ZAKU_LINES });
  const mechaDict = dict.mechaDuel as {
    gundamLines?: string[];
    zakuLines?: string[];
  };
  linesRef.current = {
    gundam: mechaDict.gundamLines ?? DEFAULT_GUNDAM_LINES,
    zaku: mechaDict.zakuLines ?? DEFAULT_ZAKU_LINES,
  };
  const [game, setGame] = useState<DuelState>(makeInitialState);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;
      setGame((prev) =>
        tickSimulation(prev, boltSeqRef.current, dt, linesRef.current)
      );
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { guncore, greengrunt, bolts } = game;
  const mechs: Mech[] = [guncore, greengrunt];

  return createPortal(
    <div
      className="fixed left-0 right-0 bottom-0 pointer-events-none z-[52] overflow-hidden"
      style={{ height: `${BAND_HEIGHT_VH}vh` }}
      aria-label={t("mechaDuel.ariaLabel")}
      title={t("mechaDuel.controlHint")}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {bolts.map((b) => (
          <line
            key={b.id}
            x1={b.x}
            y1={b.y}
            x2={b.x - b.vx * BOLT_TRAIL}
            y2={b.y - b.vy * BOLT_TRAIL}
            stroke={b.from === "guncore" ? "#F472B6" : "#4ADE80"}
            strokeWidth={b.from === "guncore" ? "0.42" : "0.3"}
            strokeLinecap="round"
            opacity={b.from === "guncore" ? 0.92 : 0.78}
            style={{
              filter:
                b.from === "guncore"
                  ? "drop-shadow(0 0 1.5px rgba(244,114,182,0.9))"
                  : "drop-shadow(0 0 1px rgba(74,222,128,0.75))",
            }}
          />
        ))}
        {guncore.slashTicks > 0 && (
          <>
            <line
              x1={guncore.x}
              y1={guncore.y}
              x2={greengrunt.x}
              y2={greengrunt.y}
              stroke="#FFE0F8"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity={Math.min(1, guncore.slashTicks / 10)}
              style={{
                filter: "drop-shadow(0 0 3px rgba(255,102,170,0.95))",
              }}
            />
            <line
              x1={guncore.x}
              y1={guncore.y}
              x2={greengrunt.x}
              y2={greengrunt.y}
              stroke="#FF66AA"
              strokeWidth="0.45"
              strokeLinecap="round"
              opacity={Math.min(0.85, guncore.slashTicks / 12)}
            />
          </>
        )}
      </svg>

      {mechs.map((mech) => (
        <div
          key={mech.kind}
          className="absolute will-change-[left,top]"
          style={{
            left: `${mech.x}%`,
            top: `${mech.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="relative"
            style={{
              filter:
                mech.kind === "guncore"
                  ? "drop-shadow(0 0 6px rgba(42,106,216,0.35))"
                  : "drop-shadow(0 0 6px rgba(58,152,64,0.4))",
              opacity: mech.dodgeBurst > 0 ? 0.82 : 1,
            }}
          >
            {mech.dialogue && <CharacterSpeechBubble text={mech.dialogue} />}
            <HomagePixelSprite
              homageId={mech.kind}
              frame={
                mech.kind === "guncore" && mech.slashTicks > 0 ? 2 : mech.frame
              }
              facingLeft={mech.facingLeft}
            />
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
