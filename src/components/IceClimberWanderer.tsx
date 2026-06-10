/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * アイスクライマー：下部スクロール案内枠の上を狭く左右巡回。
 * ごくたまに立ち止まりハンマーでパネルが揺れる。
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playHammerThud, resumeAudioContext } from "../audio/invaderAudio";
import { useI18n } from "../i18n";
import { shakeScenePanel } from "../utils/panelShake";
import { WANDERER_SPRITE_SCALE } from "../constants/characterSpriteScale";
import { RenderPixelSprite } from "./Characters";

const SPRITE_SCALE = WANDERER_SPRITE_SCALE;
const CLIMBER_ROWS = 14;
const CLIMBER_COLS = 16;

/** 案内枠上端より足元を何 px 上に置く */
const FEET_ABOVE_HINT = 2;

const PATROL_SPEED = 2.1;
const ARRIVE_DIST = 3;
const WALK_FRAME_MS = 980;

const HAMMER_MIN_MS = 17_000;
const HAMMER_MAX_MS = 40_000;
const WINDUP_MS = 560;
const STRIKE_MS = 200;
const RECOVER_MS = 480;

const IDLE_CHANCE = 0.32;
const IDLE_MIN_MS = 650;
const IDLE_MAX_MS = 2_100;

type HammerPhase = "idle" | "windup" | "strike" | "recover";

interface ClimberAnchor {
  centerX: number;
  centerY: number;
  leftX: number;
  rightX: number;
}

function climberHeight(scale: number): number {
  return CLIMBER_ROWS * scale;
}

function climberWidth(scale: number): number {
  return CLIMBER_COLS * scale;
}

/** スクロール案内枠を基準に、狭い左右パトロール幅を算出 */
function measureClimberAnchor(hintBar: DOMRect, climberH: number): ClimberAnchor {
  const centerX = hintBar.left + hintBar.width / 2;
  const feetY = hintBar.top - FEET_ABOVE_HINT;
  const centerY = feetY - climberH * 0.5;

  const half = Math.max(
    Math.min(hintBar.width * 0.42, window.innerWidth * 0.12),
    Math.min(hintBar.width * 0.28, window.innerWidth * 0.06)
  );

  const climberW = climberWidth(SPRITE_SCALE);
  const minX = centerX - half + climberW * 0.15;
  const maxX = centerX + half - climberW * 0.15;

  return {
    centerX,
    centerY,
    leftX: Math.min(minX, maxX),
    rightX: Math.max(minX, maxX),
  };
}

function scheduleNextHammer(from: number) {
  return from + HAMMER_MIN_MS + Math.random() * (HAMMER_MAX_MS - HAMMER_MIN_MS);
}

function spriteState(
  hammer: HammerPhase,
  walkFrame: number,
  moving: boolean
): "idle" | "walk" | "walk2" | "jump" | "victory" {
  if (hammer === "windup") return "jump";
  if (hammer === "strike") return "victory";
  if (hammer === "recover") return "idle";
  if (!moving) return "idle";
  if (walkFrame === 1) return "walk";
  if (walkFrame === 2) return "walk2";
  return "idle";
}

type PatrolPhase = "moving" | "idle" | "at-end";

interface ClimberState {
  x: number;
  targetX: number;
  facingLeft: boolean;
  walkFrame: number;
  moving: boolean;
  hammer: HammerPhase;
  idleUntil: number;
  headingRight: boolean;
  patrolPhase: PatrolPhase;
}

function seedPatrol(s: ClimberState, anchor: ClimberAnchor, fromRight = true) {
  s.x = fromRight ? anchor.leftX : anchor.rightX;
  s.headingRight = fromRight;
  s.targetX = fromRight ? anchor.rightX : anchor.leftX;
  s.facingLeft = fromRight;
  s.walkFrame = 0;
  s.moving = false;
  s.idleUntil = 0;
  s.patrolPhase = "moving";
}

function flipPatrolTarget(s: ClimberState, anchor: ClimberAnchor) {
  s.headingRight = !s.headingRight;
  s.targetX = s.headingRight ? anchor.rightX : anchor.leftX;
  s.facingLeft = !s.headingRight;
}

export interface IceClimberWandererProps {
  globalSoundOn: boolean;
  scrollProgress: number;
}

export function IceClimberWanderer({
  globalSoundOn,
  scrollProgress,
}: IceClimberWandererProps) {
  const { t } = useI18n();
  const scrollRef = useRef(scrollProgress);
  const hammerRef = useRef<HammerPhase>("idle");
  const phaseUntilRef = useRef(0);
  const nextHammerRef = useRef(scheduleNextHammer(performance.now() + 7_500));
  const impactRef = useRef(false);
  const walkTimerRef = useRef(0);
  const anchorRef = useRef<ClimberAnchor | null>(null);

  const simRef = useRef<ClimberState>({
    x: 0,
    targetX: 0,
    facingLeft: false,
    walkFrame: 0,
    moving: false,
    hammer: "idle",
    idleUntil: 0,
    headingRight: true,
    patrolPhase: "moving",
  });

  const [, setFrame] = useState(0);

  scrollRef.current = scrollProgress;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const triggerImpact = () => {
      if (impactRef.current) return;
      impactRef.current = true;
      shakeScenePanel(scrollRef.current);
      if (globalSoundOn) {
        resumeAudioContext();
        playHammerThud();
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;

      const hintEl = document.getElementById("scroll-hint-bar");
      const climberH = climberHeight(SPRITE_SCALE);
      if (hintEl) {
        anchorRef.current = measureClimberAnchor(
          hintEl.getBoundingClientRect(),
          climberH
        );
      }

      const anchor = anchorRef.current;
      if (!anchor) {
        setFrame((f) => (f + 1) % 100000);
        raf = requestAnimationFrame(tick);
        return;
      }

      const s = simRef.current;
      if (s.x === 0 && s.targetX === 0) {
        seedPatrol(s, anchor, Math.random() > 0.5);
      }

      const hammer = hammerRef.current;
      s.moving = false;
      s.hammer = hammer;

      if (hammer === "idle") {
        if (now >= nextHammerRef.current) {
          hammerRef.current = "windup";
          s.hammer = "windup";
          s.walkFrame = 0;
          s.moving = false;
          s.idleUntil = 0;
          phaseUntilRef.current = now + WINDUP_MS;
          impactRef.current = false;
        } else {
          const dx = s.targetX - s.x;
          const d = Math.abs(dx);

          if (d < ARRIVE_DIST) {
            s.walkFrame = 0;
            if (s.patrolPhase === "moving") {
              s.patrolPhase = "at-end";
              if (Math.random() < IDLE_CHANCE) {
                s.patrolPhase = "idle";
                s.idleUntil =
                  now + IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
              } else {
                flipPatrolTarget(s, anchor);
                s.patrolPhase = "moving";
              }
            } else if (s.patrolPhase === "idle" && now >= s.idleUntil) {
              s.idleUntil = 0;
              flipPatrolTarget(s, anchor);
              s.patrolPhase = "moving";
            }
          } else {
            s.patrolPhase = "moving";
            s.moving = true;
            const step = PATROL_SPEED * dt;
            const move = Math.min(d, step);
            s.x += Math.sign(dx) * move;
            s.facingLeft = dx < 0;

            walkTimerRef.current += dt * 16.67;
            if (walkTimerRef.current >= WALK_FRAME_MS) {
              walkTimerRef.current = 0;
              s.walkFrame = (s.walkFrame + 1) % 3;
            }
          }
        }
      } else if (now >= phaseUntilRef.current) {
        if (hammer === "windup") {
          hammerRef.current = "strike";
          s.hammer = "strike";
          phaseUntilRef.current = now + STRIKE_MS;
          triggerImpact();
        } else if (hammer === "strike") {
          hammerRef.current = "recover";
          s.hammer = "recover";
          phaseUntilRef.current = now + RECOVER_MS;
        } else {
          hammerRef.current = "idle";
          s.hammer = "idle";
          s.walkFrame = 0;
          nextHammerRef.current = scheduleNextHammer(now);
          impactRef.current = false;
        }
      }

      s.x = Math.max(anchor.leftX, Math.min(anchor.rightX, s.x));

      setFrame((f) => (f + 1) % 100000);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [globalSoundOn]);

  const hintEl =
    typeof document !== "undefined"
      ? document.getElementById("scroll-hint-bar")
      : null;
  if (!hintEl) return null;

  const climberH = climberHeight(SPRITE_SCALE);
  const anchor =
    anchorRef.current ??
    measureClimberAnchor(hintEl.getBoundingClientRect(), climberH);

  const s = simRef.current;
  const yBump =
    s.hammer === "strike"
      ? 3
      : s.hammer === "windup"
        ? -3
        : s.moving && s.walkFrame === 2
          ? -1
          : 0;

  return createPortal(
    <div
      className="pointer-events-none"
      aria-label={t("iceClimber.ariaLabel")}
      title={t("iceClimber.controlHint")}
    >
      <div
        className="will-change-[left,top]"
        style={{
          position: "fixed",
          left: s.x,
          top: anchor.centerY + yBump,
          transform: "translate(-50%, -50%)",
          zIndex: 48,
          filter: "drop-shadow(0 0 5px rgba(255,51,153,0.32))",
        }}
      >
        <RenderPixelSprite
          type="iceClimber"
          state={spriteState(s.hammer, s.walkFrame, s.moving)}
          facing={s.facingLeft ? "left" : "right"}
          scale={SPRITE_SCALE}
        />
      </div>
    </div>,
    document.body
  );
}
