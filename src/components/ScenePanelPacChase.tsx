/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * パネル枠を走査光のように周回 — パックマン(パクパク)とオバケ(目左右)の追いかけっこ
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WANDERER_SPRITE_SCALE } from "../constants/characterSpriteScale";
import { RenderPixelSprite } from "./Characters";

const SPRITE_SCALE = WANDERER_SPRITE_SCALE;
const PAC_SPEED = 0.0052;
/** パックマンより遅れて同じ枠線上を周回（0〜4 = 1周） */
const GHOST_LAG = 0.14;
const BORDER_INSET = 8;
const CHOMP_MS = 90;
const GHOST_EYE_MS = 220;
const SCAN_TRAIL_LAG = 0.09;

interface PanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function wrapProgress(p: number): number {
  return ((p % 4) + 4) % 4;
}

function panelBorderPoint(
  progress: number,
  rect: PanelRect
): { x: number; y: number; facingLeft: boolean; rotateDeg: number } {
  const loop = wrapProgress(progress);
  const edge = Math.floor(loop);
  const t = loop - edge;
  const innerW = Math.max(1, rect.width - BORDER_INSET * 2);
  const innerH = Math.max(1, rect.height - BORDER_INSET * 2);
  const left = rect.left + BORDER_INSET;
  const top = rect.top + BORDER_INSET;

  switch (edge) {
    case 0:
      return { x: left + t * innerW, y: top, facingLeft: false, rotateDeg: 0 };
    case 1:
      return {
        x: left + innerW,
        y: top + t * innerH,
        facingLeft: false,
        rotateDeg: 90,
      };
    case 2:
      return {
        x: left + innerW - t * innerW,
        y: top + innerH,
        facingLeft: true,
        rotateDeg: 180,
      };
    default:
      return {
        x: left,
        y: top + innerH - t * innerH,
        facingLeft: true,
        rotateDeg: -90,
      };
  }
}

export interface ScenePanelPacChaseProps {
  panelSelector: string;
  active: boolean;
}

export function ScenePanelPacChase({
  panelSelector,
  active,
}: ScenePanelPacChaseProps) {
  const rectRef = useRef<PanelRect | null>(null);
  const simRef = useRef({
    pacProgress: 0,
    chompFrame: 0,
    chompTimer: 0,
    ghostEyeLeft: true,
    ghostEyeTimer: 0,
  });
  const [, setFrame] = useState(0);

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;

      const el = document.querySelector(panelSelector) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        rectRef.current = {
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
        };
      }

      const s = simRef.current;
      s.pacProgress = wrapProgress(s.pacProgress + PAC_SPEED * dt);

      s.chompTimer += dt * 16.67;
      if (s.chompTimer >= CHOMP_MS) {
        s.chompTimer = 0;
        s.chompFrame = (s.chompFrame + 1) % 3;
      }

      s.ghostEyeTimer += dt * 16.67;
      if (s.ghostEyeTimer >= GHOST_EYE_MS) {
        s.ghostEyeTimer = 0;
        s.ghostEyeLeft = !s.ghostEyeLeft;
      }

      setFrame((f) => (f + 1) % 100000);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, panelSelector]);

  if (!active) return null;

  const rect = rectRef.current;
  if (!rect || rect.width < 60 || rect.height < 40) return null;

  const s = simRef.current;
  const pacPos = panelBorderPoint(s.pacProgress, rect);
  const ghostPos = panelBorderPoint(
    wrapProgress(s.pacProgress - GHOST_LAG),
    rect
  );
  const trailPos = panelBorderPoint(
    wrapProgress(s.pacProgress - SCAN_TRAIL_LAG),
    rect
  );

  const pacChompStates = ["idle", "jump", "walk"] as const;
  const pacState = pacChompStates[s.chompFrame];
  const ghostState = s.ghostEyeLeft ? "idle" : "walk";

  return createPortal(
    <>
      <div
        className="pointer-events-none"
        style={{
          position: "fixed",
          left: trailPos.x,
          top: trailPos.y,
          width: 28,
          height: 28,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255,230,0,0.55) 0%, rgba(0,245,255,0.15) 45%, transparent 72%)",
          filter: "blur(3px)",
          opacity: 0.85,
          zIndex: 44,
        }}
      />
      <div
        className="pointer-events-none"
        style={{
          position: "fixed",
          left: ghostPos.x,
          top: ghostPos.y,
          transform: `translate(-50%, -50%) rotate(${ghostPos.rotateDeg}deg)`,
          zIndex: 45,
          opacity: 0.92,
        }}
      >
        <RenderPixelSprite
          type="ghost"
          state={ghostState}
          facing="right"
          scale={SPRITE_SCALE}
        />
      </div>
      <div
        className="pointer-events-none"
        style={{
          position: "fixed",
          left: pacPos.x,
          top: pacPos.y,
          transform: `translate(-50%, -50%) rotate(${pacPos.rotateDeg}deg)`,
          zIndex: 46,
          filter: "drop-shadow(0 0 6px rgba(255,230,0,0.75))",
        }}
      >
        <RenderPixelSprite
          type="pacman"
          state={pacState}
          facing="right"
          scale={SPRITE_SCALE}
        />
      </div>
    </>,
    document.body
  );
}
