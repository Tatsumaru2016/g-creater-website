/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * スライム5体の徘徊 + リンク追尾・剣攻撃
 */

import { useEffect, useRef, useState } from "react";
import {
  CharacterSpeechBubble,
  RenderPixelSprite,
} from "./Characters";
import { playSwordSlash } from "../audio/invaderAudio";
import { useI18n } from "../i18n";
import { WANDERER_SPRITE_SCALE } from "../constants/characterSpriteScale";
import {
  type BiteChar,
  measureBiteChars,
  refreshBiteCharPositions,
  restoreBiteTargets,
  updateBiteCharsFromSlimes,
} from "../utils/textBite";

const SLIME_COUNT = 5;
const SPRITE_SCALE = WANDERER_SPRITE_SCALE;
const SLIME_SPEED = 0.45;
const LINK_SPEED = 0.95;
/** スプライト中心間の最小距離（重なり防止） */
const SPRITE_BODY_RADIUS = 2.0;
const STANDOFF_GAP = 0.45;
const STANDOFF_DIST = SPRITE_BODY_RADIUS * 2 + STANDOFF_GAP;
/** 剣が届く距離の許容幅（この帯域で止まって攻撃） */
const SWORD_RANGE_TOLERANCE = 0.55;
const HIT_DURATION_TICKS = 22;
const VANISH_TICKS = 8;
const LINK_ATTACK_COOLDOWN = 12;
const DIALOGUE_TICKS = 22;

type SlimePhase = "wander" | "hit" | "vanish";
type LinkPhase = "chase" | "attack" | "cooldown";

interface Slime {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  phase: SlimePhase;
  dialogue?: string;
  phaseTicks: number;
  facing: "left" | "right";
  walkFrame: boolean;
  eatCooldown: number;
  munchTicks: number;
  munchPhase: number;
}

interface LinkHunter {
  x: number;
  y: number;
  phase: LinkPhase;
  facing: "left" | "right";
  targetId: string | null;
  attackProg: number;
  cooldown: number;
  walkFrame: boolean;
  dialogue?: string;
  dialogueTicks: number;
}

function randomWanderTarget() {
  return {
    x: 8 + Math.random() * 84,
    y: 42 + Math.random() * 48,
  };
}

function biteCharToPercent(ch: BiteChar): { x: number; y: number } {
  return {
    x: (ch.x / window.innerWidth) * 100,
    y: (ch.y / window.innerHeight) * 100,
  };
}

function pickSlimeTarget(
  x: number,
  y: number,
  biteChars: BiteChar[]
): { x: number; y: number } {
  const edible = biteChars.filter((ch) => ch.bites < 1 && ch.el.isConnected);
  if (edible.length > 0 && Math.random() < 0.42) {
    const ch = edible[Math.floor(Math.random() * edible.length)];
    return biteCharToPercent(ch);
  }
  return randomWanderTarget();
}

function spawnSlime(id: string): Slime {
  const pos = randomWanderTarget();
  return {
    id,
    x: pos.x,
    y: pos.y,
    targetX: pos.x,
    targetY: pos.y,
    phase: "wander",
    phaseTicks: 0,
    facing: Math.random() > 0.5 ? "right" : "left",
    walkFrame: false,
    eatCooldown: 0,
    munchTicks: 0,
    munchPhase: 0,
  };
}

function makeInitialSlimes(): Slime[] {
  return Array.from({ length: SLIME_COUNT }, (_, i) => spawnSlime(`slime-${i + 1}`));
}

function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

/** スライムから見てリンク側へ STANDOFF_DIST 離れた立ち位置 */
function standoffPoint(
  linkX: number,
  linkY: number,
  preyX: number,
  preyY: number
): { x: number; y: number } {
  const d = dist(linkX, linkY, preyX, preyY);
  if (d < 0.02) {
    return { x: linkX + STANDOFF_DIST, y: linkY };
  }
  const ux = (linkX - preyX) / d;
  const uy = (linkY - preyY) / d;
  return {
    x: preyX + ux * STANDOFF_DIST,
    y: preyY + uy * STANDOFF_DIST,
  };
}

function clampMinDistance(
  x: number,
  y: number,
  anchorX: number,
  anchorY: number,
  minDist: number
): { x: number; y: number } {
  const d = dist(x, y, anchorX, anchorY);
  if (d >= minDist || d < 0.02) return { x, y };
  const ux = (x - anchorX) / d;
  const uy = (y - anchorY) / d;
  return { x: anchorX + ux * minDist, y: anchorY + uy * minDist };
}

function inSwordRange(linkX: number, linkY: number, preyX: number, preyY: number) {
  const d = dist(linkX, linkY, preyX, preyY);
  return (
    d <= STANDOFF_DIST + SWORD_RANGE_TOLERANCE &&
    d >= STANDOFF_DIST - SWORD_RANGE_TOLERANCE
  );
}

function moveToward(
  x: number,
  y: number,
  tx: number,
  ty: number,
  speed: number
): { x: number; y: number; arrived: boolean } {
  const d = dist(x, y, tx, ty);
  if (d <= speed) return { x: tx, y: ty, arrived: true };
  return {
    x: x + ((tx - x) / d) * speed,
    y: y + ((ty - y) / d) * speed,
    arrived: false,
  };
}

function nearestWanderSlime(link: LinkHunter, slimes: Slime[]): Slime | null {
  let best: Slime | null = null;
  let bestD = Infinity;
  for (const s of slimes) {
    if (s.phase !== "wander") continue;
    const d = dist(link.x, link.y, s.x, s.y);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function tickSlimes(slimes: Slime[], biteChars: BiteChar[]): Slime[] {
  return slimes.map((s) => {
    let eatCooldown = Math.max(0, s.eatCooldown - 1);

    if (s.phase === "hit") {
      const phaseTicks = s.phaseTicks + 1;
      if (phaseTicks >= HIT_DURATION_TICKS) {
        return { ...s, phase: "vanish", phaseTicks: 0, munchTicks: 0 };
      }
      return { ...s, phaseTicks, eatCooldown, munchTicks: 0 };
    }

    if (s.phase === "vanish") {
      const phaseTicks = s.phaseTicks + 1;
      if (phaseTicks >= VANISH_TICKS) {
        const pos = randomWanderTarget();
        return {
          ...spawnSlime(s.id),
          x: pos.x,
          y: pos.y,
          targetX: pos.x,
          targetY: pos.y,
        };
      }
      return { ...s, phaseTicks, eatCooldown };
    }

    if (s.munchTicks > 0) {
      return {
        ...s,
        eatCooldown,
        munchPhase: s.munchPhase,
        walkFrame: !s.walkFrame,
      };
    }

    let { x, y, targetX, targetY, walkFrame } = s;
    const arrived = dist(x, y, targetX, targetY) < 0.15;

    if (arrived && Math.random() < 0.05) {
      const next = pickSlimeTarget(x, y, biteChars);
      return {
        ...s,
        targetX: next.x,
        targetY: next.y,
        facing: next.x >= x ? "right" : "left",
        walkFrame: !walkFrame,
        eatCooldown,
      };
    }

    if (!arrived) {
      const step = moveToward(x, y, targetX, targetY, SLIME_SPEED);
      x = step.x;
      y = step.y;
      walkFrame = step.arrived ? walkFrame : !walkFrame;
      return {
        ...s,
        x,
        y,
        facing: targetX >= x ? "right" : "left",
        walkFrame,
        eatCooldown,
      };
    }

    return { ...s, walkFrame, eatCooldown };
  });
}

function tickLink(
  link: LinkHunter,
  slimes: Slime[],
  pickDefeatedLine: () => string,
  pickBattleLine: () => string
): { link: LinkHunter; slimes: Slime[] } {
  let next = { ...link };
  let nextSlimes = slimes;

  if (next.dialogue) {
    next.dialogueTicks += 1;
    if (next.dialogueTicks >= DIALOGUE_TICKS) {
      next.dialogue = undefined;
      next.dialogueTicks = 0;
    }
  }

  if (next.phase === "cooldown") {
    next.cooldown -= 1;
    if (next.cooldown <= 0) {
      next.phase = "chase";
      next.attackProg = 0;
    }
    const prey = nearestWanderSlime(next, nextSlimes);
    next.targetId = prey?.id ?? null;
    return { link: next, slimes: nextSlimes };
  }

  if (next.phase === "attack") {
    next.attackProg = Math.min(1, next.attackProg + 0.22);
    if (next.attackProg >= 1) {
      const target = nextSlimes.find((s) => s.id === next.targetId);
      if (target && target.phase === "wander") {
        nextSlimes = nextSlimes.map((s) =>
          s.id === target.id
            ? {
                ...s,
                phase: "hit" as SlimePhase,
                phaseTicks: 0,
                dialogue: pickDefeatedLine(),
              }
            : s
        );
        next.dialogue = pickBattleLine();
        next.dialogueTicks = 0;
      }
      next.phase = "cooldown";
      next.cooldown = LINK_ATTACK_COOLDOWN;
      next.attackProg = 0;
      next.targetId = null;
    }
    return { link: next, slimes: nextSlimes };
  }

  const prey = nearestWanderSlime(next, nextSlimes);
  if (!prey) {
    next.targetId = null;
    return { link: next, slimes: nextSlimes };
  }

  next.targetId = prey.id;
  next.facing = prey.x >= next.x ? "right" : "left";

  if (inSwordRange(next.x, next.y, prey.x, prey.y)) {
    next.phase = "attack";
    next.attackProg = 0;
    playSwordSlash();
    return { link: next, slimes: nextSlimes };
  }

  const spot = standoffPoint(next.x, next.y, prey.x, prey.y);
  const step = moveToward(next.x, next.y, spot.x, spot.y, LINK_SPEED);
  const clamped = clampMinDistance(
    step.x,
    step.y,
    prey.x,
    prey.y,
    STANDOFF_DIST - SWORD_RANGE_TOLERANCE * 0.35
  );
  const moved = clamped.x !== next.x || clamped.y !== next.y;
  next.x = clamped.x;
  next.y = clamped.y;
  if (moved) {
    next.walkFrame = !next.walkFrame;
  }

  if (inSwordRange(next.x, next.y, prey.x, prey.y)) {
    next.phase = "attack";
    next.attackProg = 0;
    playSwordSlash();
  }

  return { link: next, slimes: nextSlimes };
}

export interface SlimeLinkHuntProps {
  defeatedLines: string[];
  linkLines: string[];
}

type SlashLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  prog: number;
};

export function SlimeLinkHunt({ defeatedLines, linkLines }: SlimeLinkHuntProps) {
  const { locale } = useI18n();
  const biteCharsRef = useRef<BiteChar[]>([]);

  const pickDefeatedRef = useRef(() => defeatedLines[0] ?? "…");
  pickDefeatedRef.current = () =>
    defeatedLines[Math.floor(Math.random() * defeatedLines.length)] ??
    defeatedLines[0] ??
    "…";

  const pickBattleRef = useRef(() => linkLines[0] ?? "…");
  pickBattleRef.current = () =>
    linkLines[Math.floor(Math.random() * linkLines.length)] ??
    linkLines[0] ??
    "…";

  const [game, setGame] = useState<{
    slimes: Slime[];
    link: LinkHunter;
    slash: SlashLine | null;
  }>(() => ({
    slimes: makeInitialSlimes(),
    link: {
      x: 50,
      y: 72,
      phase: "chase",
      facing: "right",
      targetId: null,
      attackProg: 0,
      cooldown: 0,
      walkFrame: false,
      dialogueTicks: 0,
    },
    slash: null,
  }));

  useEffect(() => {
    const resetWrap = () => {
      document.querySelectorAll("[data-wanderer-bite]").forEach((node) => {
        delete (node as HTMLElement).dataset.biteWrapped;
      });
    };
    resetWrap();
    biteCharsRef.current = measureBiteChars();
  }, [locale]);

  useEffect(() => {
    const syncBiteChars = () => {
      biteCharsRef.current = measureBiteChars();
    };
    syncBiteChars();

    const onResize = () => {
      refreshBiteCharPositions(biteCharsRef.current);
      if (biteCharsRef.current.length === 0) syncBiteChars();
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => {
      syncBiteChars();
    });
    document.querySelectorAll("[data-wanderer-bite]").forEach((el) => ro.observe(el));

    const id = setInterval(() => {
      refreshBiteCharPositions(biteCharsRef.current);
      if (biteCharsRef.current.length === 0) syncBiteChars();

      setGame((prev) => {
        let slimes = tickSlimes(prev.slimes, biteCharsRef.current);
        const { link, slimes: afterLink } = tickLink(
          prev.link,
          slimes,
          () => pickDefeatedRef.current(),
          () => pickBattleRef.current()
        );
        slimes = afterLink;

        updateBiteCharsFromSlimes(biteCharsRef.current, slimes);

        const target = link.targetId
          ? slimes.find((s) => s.id === link.targetId)
          : null;

        let slash: SlashLine | null = null;
        if (link.phase === "attack" && target) {
          slash = {
            x1: link.x,
            y1: link.y,
            x2: target.x,
            y2: target.y,
            prog: link.attackProg,
          };
        }

        return { slimes, link, slash };
      });
    }, 150);

    return () => {
      clearInterval(id);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      restoreBiteTargets();
    };
  }, []);

  const { slimes, link, slash } = game;

  const linkState =
    link.phase === "attack"
      ? "action"
      : link.phase === "chase" && link.walkFrame
        ? "walk"
        : "idle";

  return (
    <div className="absolute inset-0 pointer-events-none z-[48] overflow-hidden">
      {slash && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1={slash.x1}
            y1={slash.y1}
            x2={slash.x1 + (slash.x2 - slash.x1) * slash.prog}
            y2={slash.y1 + (slash.y2 - slash.y1) * slash.prog}
            stroke="#E8EEF8"
            strokeWidth="0.55"
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 2px rgba(0,245,255,0.9))",
            }}
          />
        </svg>
      )}

      {slimes.map((slime) => {
        if (slime.phase === "vanish") return null;
        const blink =
          slime.phase === "hit" && Math.floor(slime.phaseTicks / 2) % 2 === 1;
        const munching = slime.phase === "wander" && slime.munchTicks > 0;
        const munchSquash = munching
          ? slime.munchPhase % 2 === 0
            ? 1.14
            : 0.9
          : 1;
        const munchStretch = munching
          ? slime.munchPhase % 2 === 0
            ? 0.82
            : 1.12
          : 1;
        return (
          <div
            key={slime.id}
            id={`char-${slime.id}`}
            className="absolute ease-out"
            style={{
              left: `${slime.x}%`,
              top: `${slime.y}%`,
              transform: `translate(-50%, -50%) scale(${munchSquash}, ${munchStretch})`,
              opacity: blink ? 0.2 : 1,
              transition: munching ? "transform 0.1s ease-in-out" : "all 0.15s ease-out",
            }}
          >
            {slime.dialogue && <CharacterSpeechBubble text={slime.dialogue} />}
            <RenderPixelSprite
              type="slime"
              state={
                munching
                  ? "munch"
                  : slime.phase === "wander" && slime.walkFrame
                    ? "walk"
                    : "idle"
              }
              facing={slime.facing}
              scale={SPRITE_SCALE}
              munchPhase={slime.munchPhase}
            />
          </div>
        );
      })}

      <div
        id="char-link-hunter"
        className="absolute transition-all duration-150 ease-out"
        style={{
          left: `${link.x}%`,
          top: `${link.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative">
          {link.dialogue && <CharacterSpeechBubble text={link.dialogue} />}
          <div className="absolute inset-0 bg-emerald-500/15 blur-md rounded-full pointer-events-none" />
          <RenderPixelSprite
            type="link"
            state={linkState}
            facing={link.facing}
            scale={SPRITE_SCALE}
          />
        </div>
      </div>
    </div>
  );
}
