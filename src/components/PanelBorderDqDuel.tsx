/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * パネル枠のいずれかの辺で DQ勇者 vs 魔王（変身前）の剣戟
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n";
import {
  buildDqDuelSpeechResolver,
  getDuelActSprites,
  initDuelActs,
  setDqDuelSpeechResolver,
  tickDuelActs,
  type BorderActSprite,
  type DqDuelSpeechDict,
  type DuelEdge,
  type PanelBounds,
} from "./sceneBorderActs";

const BORDER_INSET = 8;

interface PanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function rectToBounds(rect: PanelRect): PanelBounds {
  return {
    left: rect.left + BORDER_INSET,
    top: rect.top + BORDER_INSET,
    right: rect.left + rect.width - BORDER_INSET,
    bottom: rect.top + rect.height - BORDER_INSET,
  };
}

function isTransparent(color: string) {
  return color === "T" || color === "transparent" || color === "#00000000";
}

function HomagePixelSprite({
  act,
}: {
  act: BorderActSprite;
}) {
  const rows = act.pixels.length;
  const cols = act.pixels[0]?.length ?? 0;
  const scaleX = act.scaleX ?? 1;

  return (
    <div
      className="pointer-events-none fixed"
      style={{
        left: act.x,
        top: act.y,
        transform: `translate(calc(-50% + ${act.xOffset ?? 0}px), calc(-50% + ${act.yOffset ?? 0}px)) rotate(${act.rotation ?? 0}deg) scaleX(${(act.facingLeft ? -1 : 1) * scaleX})`,
        opacity: act.opacity,
        zIndex: 48,
        imageRendering: "pixelated",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${act.scale}px)`,
          gridTemplateRows: `repeat(${rows}, ${act.scale}px)`,
        }}
      >
        {act.pixels.flatMap((row, r) =>
          row.map((color, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                backgroundColor: isTransparent(color) ? "transparent" : color,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DuelSpeechBubble({
  text,
  x,
  y,
  tail,
  opacity,
}: {
  text: string;
  x: number;
  y: number;
  tail: "left" | "right";
  opacity: number;
}) {
  return (
    <div
      className="pointer-events-none fixed font-mono text-[9px] whitespace-nowrap select-none"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        opacity,
        zIndex: 49,
      }}
    >
      <div className="relative bg-[#0A0A0A]/95 border border-[#FFD700]/70 text-[#FFE566] px-2 py-0.5 rounded-md shadow-[0_0_8px_rgba(255,215,0,0.25)]">
        {text}
        <div
          className="absolute top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#FFD700]/70"
          style={{ left: tail === "left" ? "18%" : "72%" }}
        />
      </div>
    </div>
  );
}

export interface PanelBorderDqDuelProps {
  panelSelector: string;
  active: boolean;
  /** 決闘が走る枠の辺（シーンごとに変える） */
  duelEdge?: DuelEdge;
}

export function PanelBorderDqDuel({
  panelSelector,
  active,
  duelEdge = 0,
}: PanelBorderDqDuelProps) {
  const { dict, locale } = useI18n();
  const rectRef = useRef<PanelRect | null>(null);
  const duelRef = useRef(initDuelActs({ left: 0, top: 0, right: 1, bottom: 1 }, duelEdge));
  const [sprites, setSprites] = useState<BorderActSprite[]>([]);

  useEffect(() => {
    const speech = (dict as { dqDuel?: { speech: DqDuelSpeechDict } }).dqDuel?.speech;
    if (speech) {
      setDqDuelSpeechResolver(buildDqDuelSpeechResolver(speech));
    }
    return () => setDqDuelSpeechResolver(null);
  }, [dict]);

  useEffect(() => {
    duelRef.current = { ...duelRef.current, duelEdge };
  }, [duelEdge]);

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
        const bounds = rectToBounds(rectRef.current);
        if (
          Math.abs(bounds.right - bounds.left - (duelRef.current.bounds.right - duelRef.current.bounds.left)) >
            2 ||
          Math.abs(bounds.left - duelRef.current.bounds.left) > 2
        ) {
          duelRef.current = initDuelActs(bounds, duelEdge);
        } else {
          duelRef.current = { ...duelRef.current, bounds, duelEdge };
        }
      }

      duelRef.current = tickDuelActs(duelRef.current, dt);
      setSprites(getDuelActSprites(duelRef.current));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, panelSelector, duelEdge]);

  if (!active) return null;

  const rect = rectRef.current;
  if (!rect || rect.width < 80 || rect.height < 60) return null;

  return createPortal(
    <>
      {sprites.map((act) => {
        if (act.bubbleText) {
          return (
            <DuelSpeechBubble
              key={act.id}
              text={act.bubbleText}
              x={act.x}
              y={act.y + (act.yOffset ?? 0)}
              tail={act.bubbleTail ?? "left"}
              opacity={act.opacity}
            />
          );
        }
        if (act.pixels.length === 0) return null;
        return <HomagePixelSprite key={act.id} act={act} />;
      })}
    </>,
    document.body
  );
}
