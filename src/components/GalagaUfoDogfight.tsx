/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 戦闘機1機とUFO1機が画面内を徘徊。接近すると短いドッグファイト → 撃破後に再び徘徊。
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WANDERER_SPRITE_SCALE } from "../constants/characterSpriteScale";
import { homageFrames, type HomageId } from "../data/homageSprites";

function homageSpriteScale(_id: HomageId): number {
  return WANDERER_SPRITE_SCALE;
}
const SKY_Y_MIN = 10;
const SKY_Y_MAX = 42;
const SKY_X_MIN = 6;
const SKY_X_MAX = 94;

const ENGAGE_DIST = 22;
const CHASE_STANDOFF = 12;
const ARRIVE_DIST = 4;
const EXCHANGES_BEFORE_KILL = 3;
const UFO_RESPAWN_TICKS = 200;
const BOLT_TTL = 14;
const BOLT_TRAIL = 0.55;
const HIT_RADIUS = 2.5;

const ROAM_SPEED = { galaga: 0.32, ufo: 0.24 } as const;
const FIGHT_SPEED = { galaga: 0.42, ufo: 0.3 } as const;
/** 戦闘機の最大旋回率（rad / tick @ dt=1） */
const JET_TURN_RATE = 0.11;
const JET_BANK_FACTOR = 2.4;

type CraftKind = "galaga" | "ufo";
type EngagePhase = "roam" | "fight" | "recover";

interface Craft {
  id: string;
  kind: CraftKind;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  fireCooldown: number;
  weavePhase: number;
  frame: number;
  facingLeft: boolean;
  heading: number;
  bank: number;
  alive: boolean;
}

interface Engagement {
  id: string;
  galagaId: string;
  ufoId: string;
  phase: EngagePhase;
  shotsInFight: number;
  recoverTimer: number;
}

interface Bolt {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  from: CraftKind;
  ttl: number;
  engagementId: string;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

function randomSkyPoint() {
  return {
    x: SKY_X_MIN + Math.random() * (SKY_X_MAX - SKY_X_MIN),
    y: SKY_Y_MIN + Math.random() * (SKY_Y_MAX - SKY_Y_MIN),
  };
}

function makeInitialCrafts(): Craft[] {
  const mk = (
    id: string,
    kind: CraftKind,
    pos: { x: number; y: number }
  ): Craft => {
    const wander = randomSkyPoint();
    return {
      id,
      kind,
      ...pos,
      targetX: wander.x,
      targetY: wander.y,
      fireCooldown: 20 + Math.random() * 15,
      weavePhase: Math.random() * Math.PI * 2,
      frame: 0,
      facingLeft: kind === "ufo",
      heading: -Math.PI / 2,
      bank: 0,
      alive: true,
    };
  };
  return [
    mk("galaga-1", "galaga", { x: 22, y: 26 }),
    mk("ufo-1", "ufo", { x: 78, y: 24 }),
  ];
}

function makeEngagements(): Engagement[] {
  return [
    {
      id: "pair-1",
      galagaId: "galaga-1",
      ufoId: "ufo-1",
      phase: "roam",
      shotsInFight: 0,
      recoverTimer: 0,
    },
  ];
}

function craftSpeed(kind: CraftKind, fighting: boolean): number {
  const table = fighting ? FIGHT_SPEED : ROAM_SPEED;
  return table[kind];
}

function lerpAngle(current: number, target: number, maxDelta: number): number {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  if (Math.abs(delta) <= maxDelta) return target;
  return current + Math.sign(delta) * maxDelta;
}

function headingVelocity(heading: number, speed: number): { vx: number; vy: number } {
  const a = heading - Math.PI / 2;
  return { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
}

function HomagePixelSprite({
  homageId,
  frame,
  facingLeft,
  heading,
  bank = 0,
  scale = homageSpriteScale(homageId),
  opacity = 1,
}: {
  homageId: HomageId;
  frame: number;
  facingLeft?: boolean;
  heading?: number;
  bank?: number;
  scale?: number;
  opacity?: number;
}) {
  const frames = homageFrames(homageId);
  const pixels = frames[frame % frames.length] ?? frames[0];
  const rows = pixels.length;
  const cols = pixels[0]?.length ?? 0;
  const px = `${scale}px`;

  const transform =
    heading !== undefined
      ? `rotate(${heading}rad) skewX(${bank}rad)`
      : `scaleX(${facingLeft ? -1 : 1})`;

  return (
    <div
      className="inline-block select-none"
      style={{
        transform,
        imageRendering: "pixelated",
        opacity,
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

function chaseAimPoint(craft: Craft, chase: Craft): { x: number; y: number } {
  const cd = dist(craft.x, craft.y, chase.x, chase.y);
  if (cd < 0.01) return randomSkyPoint();

  const angle = Math.atan2(chase.y - craft.y, chase.x - craft.x);
  if (cd < CHASE_STANDOFF) {
    const strafe = craft.weavePhase * 0.9;
    return {
      x: craft.x + Math.cos(strafe) * 3.2,
      y: craft.y + Math.sin(strafe * 0.85) * 2.4,
    };
  }

  return {
    x: chase.x - Math.cos(angle) * CHASE_STANDOFF,
    y: chase.y - Math.sin(angle) * CHASE_STANDOFF,
  };
}

function pickWanderTarget(craft: Craft) {
  const p = randomSkyPoint();
  craft.targetX = p.x;
  craft.targetY = p.y;
}

function getEngagementForCraft(
  engagements: Engagement[],
  craftId: string
): Engagement | undefined {
  return engagements.find(
    (e) => e.galagaId === craftId || e.ufoId === craftId
  );
}

function tickSimulation(
  crafts: Craft[],
  bolts: Bolt[],
  engagements: Engagement[],
  boltSeq: { n: number },
  dt: number
): { crafts: Craft[]; bolts: Bolt[]; engagements: Engagement[] } {
  const byId = new Map(crafts.map((c) => [c.id, c]));
  const nextEngagements = engagements.map((e) => ({ ...e }));

  for (const eng of nextEngagements) {
    const galaga = byId.get(eng.galagaId);
    const ufo = byId.get(eng.ufoId);
    if (!galaga || !ufo) continue;

    if (eng.phase === "recover") {
      eng.recoverTimer = Math.max(0, eng.recoverTimer - dt);
      if (eng.recoverTimer <= 0) {
        const spawn = randomSkyPoint();
        ufo.x = spawn.x;
        ufo.y = spawn.y;
        ufo.targetX = spawn.x;
        ufo.targetY = spawn.y;
        ufo.alive = true;
        ufo.fireCooldown = 24;
        eng.phase = "roam";
        eng.shotsInFight = 0;
      }
      continue;
    }

    if (!ufo.alive) continue;

    const separation = dist(galaga.x, galaga.y, ufo.x, ufo.y);

    if (eng.phase === "roam" && separation < ENGAGE_DIST) {
      eng.phase = "fight";
      eng.shotsInFight = 0;
    } else if (eng.phase === "fight" && separation > ENGAGE_DIST * 1.65) {
      eng.phase = "roam";
      eng.shotsInFight = 0;
    }
  }

  const nextCrafts = crafts.map((craft) => {
    if (!craft.alive) return { ...craft };

    const eng = getEngagementForCraft(nextEngagements, craft.id);
    const partner =
      eng && craft.kind === "galaga"
        ? byId.get(eng.ufoId)
        : eng
          ? byId.get(eng.galagaId)
          : undefined;

    const fighting =
      eng?.phase === "fight" &&
      partner?.alive === true &&
      partner !== undefined;

    let targetX = craft.targetX;
    let targetY = craft.targetY;
    let fireCooldown = Math.max(0, craft.fireCooldown - dt);

    if (fighting && partner) {
      const aim = chaseAimPoint(craft, partner);
      targetX = aim.x;
      targetY = aim.y;
    } else if (eng?.phase !== "fight") {
      const toTarget = dist(craft.x, craft.y, targetX, targetY);
      if (toTarget < ARRIVE_DIST) {
        pickWanderTarget(craft);
        targetX = craft.targetX;
        targetY = craft.targetY;
      }
    }

    const weavePhase = craft.weavePhase + 0.08 * dt;
    const speed = craftSpeed(craft.kind, fighting) * dt;
    const d = dist(craft.x, craft.y, targetX, targetY);
    let x = craft.x;
    let y = craft.y;
    let heading = craft.heading;
    let bank = craft.bank;

    if (craft.kind === "galaga") {
      if (d > 0.08) {
        const desiredHeading =
          Math.atan2(targetY - craft.y, targetX - craft.x) + Math.PI / 2;
        const prevHeading = heading;
        heading = lerpAngle(
          heading,
          desiredHeading,
          JET_TURN_RATE * dt
        );
        const turnDelta = heading - prevHeading;
        bank = Math.max(-0.42, Math.min(0.42, turnDelta * JET_BANK_FACTOR));
        const vel = headingVelocity(heading, speed);
        x += vel.vx;
        y += vel.vy;
      } else {
        bank *= 0.88;
      }
    } else {
      if (d > 0.05) {
        const step = Math.min(d, speed);
        x += ((targetX - craft.x) / d) * step;
        y += ((targetY - craft.y) / d) * step * 0.85;
      }
      y += Math.sin(weavePhase) * (fighting ? 0.18 : 0.24) * dt;
      bank = 0;
    }

    x = Math.max(SKY_X_MIN, Math.min(SKY_X_MAX, x));
    y = Math.max(SKY_Y_MIN, Math.min(SKY_Y_MAX, y));

    const vx = x - craft.x;
    const vy = y - craft.y;
    const moved = Math.hypot(vx, vy) > 0.02;
    if (craft.kind === "galaga" && moved && d <= 0.08) {
      heading = Math.atan2(vy, vx) + Math.PI / 2;
    }
    const facingLeft =
      craft.kind === "ufo"
        ? moved
          ? vx < 0
          : craft.facingLeft
        : craft.facingLeft;
    const moving = d > 0.15;
    const frame = (craft.frame + (moving ? 1 : 0)) % 2;

    return {
      ...craft,
      x,
      y,
      targetX,
      targetY,
      fireCooldown,
      weavePhase,
      frame,
      facingLeft,
      heading,
      bank,
    };
  });

  const craftById = new Map(nextCrafts.map((c) => [c.id, c]));
  const newBolts: Bolt[] = [];

  for (const eng of nextEngagements) {
    if (eng.phase !== "fight") continue;

    const galaga = craftById.get(eng.galagaId);
    const ufo = craftById.get(eng.ufoId);
    if (!galaga?.alive || !ufo?.alive) continue;

    for (const craft of [galaga, ufo]) {
      if (craft.fireCooldown > 0) continue;
      const target = craft.kind === "galaga" ? ufo : galaga;
      const d = dist(craft.x, craft.y, target.x, target.y);
      if (d > 32 || d < 5) continue;

      const boltSpeed = craft.kind === "galaga" ? 1.05 : 0.75;
      let vx: number;
      let vy: number;
      if (craft.kind === "galaga") {
        ({ vx, vy } = headingVelocity(craft.heading, boltSpeed));
      } else {
        const dx = target.x - craft.x;
        const dy = target.y - craft.y;
        const mag = Math.max(0.01, Math.hypot(dx, dy));
        vx = (dx / mag) * boltSpeed;
        vy = (dy / mag) * boltSpeed;
      }

      newBolts.push({
        id: boltSeq.n++,
        x: craft.x,
        y: craft.y,
        vx,
        vy,
        from: craft.kind,
        ttl: BOLT_TTL,
        engagementId: eng.id,
      });

      eng.shotsInFight += 1;
      craft.fireCooldown =
        craft.kind === "galaga"
          ? 22 + Math.floor(Math.random() * 8)
          : 28 + Math.floor(Math.random() * 10);
    }
  }

  let movedBolts = [...bolts, ...newBolts]
    .map((b) => ({
      ...b,
      x: b.x + b.vx * dt,
      y: b.y + b.vy * dt,
      ttl: b.ttl - dt,
    }))
    .filter((b) => b.ttl > 0 && b.x > 2 && b.x < 98 && b.y > 6 && b.y < 52);

  movedBolts = movedBolts.filter((bolt) => {
    if (bolt.from !== "galaga") return true;

    const eng = nextEngagements.find((e) => e.id === bolt.engagementId);
    if (!eng || eng.phase !== "fight") return true;

    const ufo = craftById.get(eng.ufoId);
    if (!ufo?.alive) return true;

    if (dist(bolt.x, bolt.y, ufo.x, ufo.y) >= HIT_RADIUS) return true;

    if (eng.shotsInFight >= EXCHANGES_BEFORE_KILL) {
      ufo.alive = false;
      eng.phase = "recover";
      eng.recoverTimer = UFO_RESPAWN_TICKS;
      eng.shotsInFight = 0;
    }
    return false;
  });

  return {
    crafts: nextCrafts,
    bolts: movedBolts,
    engagements: nextEngagements,
  };
}

export function GalagaUfoDogfight() {
  const boltSeqRef = useRef({ n: 1 });
  const [game, setGame] = useState(() => ({
    crafts: makeInitialCrafts(),
    bolts: [] as Bolt[],
    engagements: makeEngagements(),
  }));

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;
      setGame((prev) =>
        tickSimulation(
          prev.crafts,
          prev.bolts,
          prev.engagements,
          boltSeqRef.current,
          dt
        )
      );
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { crafts, bolts } = game;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[47] overflow-hidden">
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
            stroke={b.from === "galaga" ? "#FF8040" : "#4ADE80"}
            strokeWidth="0.28"
            strokeLinecap="round"
            opacity={0.8}
            style={{
              filter:
                b.from === "galaga"
                  ? "drop-shadow(0 0 1px rgba(255,128,64,0.85))"
                  : "drop-shadow(0 0 1px rgba(176,176,176,0.85))",
            }}
          />
        ))}
      </svg>

      {crafts.map((craft) => {
        if (!craft.alive) return null;
        return (
          <div
            key={craft.id}
            className="absolute will-change-[left,top]"
            style={{
              left: `${craft.x}%`,
              top: `${craft.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="relative"
              style={{
                filter:
                  craft.kind === "galaga"
                    ? "drop-shadow(0 0 5px rgba(160,176,192,0.35))"
                    : "drop-shadow(0 0 6px rgba(0,200,200,0.45))",
              }}
            >
              <HomagePixelSprite
                homageId={craft.kind}
                frame={craft.frame}
                heading={craft.kind === "galaga" ? craft.heading : undefined}
                bank={craft.kind === "galaga" ? craft.bank : 0}
                facingLeft={craft.kind === "ufo" ? craft.facingLeft : undefined}
              />
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
