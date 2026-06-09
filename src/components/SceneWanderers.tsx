import { useEffect, useRef, useState } from "react";
import { CHARACTER_PRESETS, PREMADE_GALLERY } from "../data";

interface WandererSeed {
  frames: string[][][];
  scale: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity?: number;
}

interface WandererState extends WandererSeed {
  id: number;
  frameIdx: number;
  facingLeft: boolean;
}

function toFrames(pixels: string[][]): string[][][] {
  return [pixels];
}

function charFrames(presetIdx: number, tag?: string): string[][][] {
  const preset = CHARACTER_PRESETS[presetIdx];
  const filtered = tag
    ? preset.frames.filter((f) => f.tag === tag).map((f) => f.pixels)
    : preset.frames.map((f) => f.pixels);
  return filtered.length > 0 ? filtered : [preset.frames[0].pixels];
}

const SCENE_SEEDS: Record<number, WandererSeed[]> = {
  0: [
    { frames: toFrames(PREMADE_GALLERY[0].pixels), scale: 3, x: 12, y: 68, vx: 0.045, vy: 0.018 },
    { frames: charFrames(1, "Idling"), scale: 3, x: 82, y: 72, vx: -0.038, vy: 0.022, opacity: 0.75 },
    { frames: charFrames(0, "Idle Anim"), scale: 2.5, x: 88, y: 28, vx: -0.03, vy: 0.035, opacity: 0.55 },
  ],
  1: [
    { frames: charFrames(0, "Idle Anim"), scale: 3, x: 18, y: 55, vx: 0.05, vy: 0.02 },
    { frames: charFrames(0, "Run Cycle"), scale: 2.5, x: 75, y: 65, vx: -0.06, vy: 0.015 },
    { frames: toFrames(PREMADE_GALLERY[2].pixels), scale: 3, x: 50, y: 78, vx: 0.035, vy: -0.028, opacity: 0.6 },
  ],
  2: [
    { frames: toFrames(PREMADE_GALLERY[1].pixels), scale: 3, x: 15, y: 62, vx: 0.04, vy: 0.025 },
    { frames: charFrames(1, "Idling"), scale: 3, x: 80, y: 58, vx: -0.042, vy: 0.03 },
    { frames: charFrames(1, "Jumping"), scale: 2.5, x: 55, y: 25, vx: 0.025, vy: 0.04, opacity: 0.65 },
  ],
  3: [
    { frames: charFrames(0, "Run Cycle"), scale: 3, x: 20, y: 70, vx: 0.055, vy: 0.012 },
    { frames: toFrames(PREMADE_GALLERY[0].pixels), scale: 3, x: 70, y: 30, vx: -0.04, vy: 0.035 },
    { frames: charFrames(1, "Idling"), scale: 2.5, x: 45, y: 80, vx: 0.03, vy: -0.025, opacity: 0.7 },
  ],
  4: [
    { frames: charFrames(0, "Run Cycle"), scale: 3, x: 25, y: 60, vx: 0.07, vy: 0.01 },
    { frames: charFrames(0, "Saber Slash"), scale: 3, x: 78, y: 55, vx: -0.05, vy: 0.02 },
    { frames: charFrames(1, "Jumping"), scale: 3, x: 50, y: 75, vx: 0.04, vy: -0.035 },
  ],
  5: [
    { frames: charFrames(1, "Jumping"), scale: 3, x: 14, y: 50, vx: 0.048, vy: 0.028 },
    { frames: toFrames(PREMADE_GALLERY[1].pixels), scale: 3, x: 85, y: 65, vx: -0.04, vy: 0.022 },
    { frames: charFrames(0, "Idle Anim"), scale: 2.5, x: 60, y: 22, vx: -0.032, vy: 0.038, opacity: 0.6 },
  ],
  6: [
    { frames: toFrames(PREMADE_GALLERY[2].pixels), scale: 3, x: 22, y: 58, vx: 0.042, vy: 0.02 },
    { frames: charFrames(0, "Saber Slash"), scale: 2.5, x: 72, y: 68, vx: -0.055, vy: 0.015 },
    { frames: charFrames(1, "Idling"), scale: 3, x: 48, y: 28, vx: 0.03, vy: 0.04, opacity: 0.65 },
  ],
  7: [
    { frames: toFrames(PREMADE_GALLERY[0].pixels), scale: 3, x: 16, y: 65, vx: 0.05, vy: 0.018 },
    { frames: toFrames(PREMADE_GALLERY[1].pixels), scale: 3, x: 42, y: 72, vx: 0.035, vy: -0.02 },
    { frames: toFrames(PREMADE_GALLERY[2].pixels), scale: 3, x: 68, y: 58, vx: -0.045, vy: 0.025 },
    { frames: charFrames(1, "Idling"), scale: 2.5, x: 88, y: 35, vx: -0.03, vy: 0.032, opacity: 0.7 },
  ],
};

function seedToState(seeds: WandererSeed[]): WandererState[] {
  return seeds.map((s, i) => ({
    ...s,
    id: i,
    frameIdx: 0,
    facingLeft: s.vx < 0,
    opacity: s.opacity ?? 0.85,
  }));
}

function PixelSprite({
  pixels,
  scale,
  x,
  y,
  facingLeft,
  opacity,
}: {
  pixels: string[][];
  scale: number;
  x: number;
  y: number;
  facingLeft: boolean;
  opacity: number;
}) {
  const size = pixels.length;
  const px = `${scale}px`;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scaleX(${facingLeft ? -1 : 1})`,
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
  const [sprites, setSprites] = useState<WandererState[]>(() =>
    seedToState(SCENE_SEEDS[layerId] ?? [])
  );
  const frameClock = useRef(0);

  useEffect(() => {
    setSprites(seedToState(SCENE_SEEDS[layerId] ?? []));
  }, [layerId]);

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

      setSprites((prev) =>
        prev.map((s) => {
          let { x, y, vx, vy, frameIdx, facingLeft } = s;
          x += vx * dt;
          y += vy * dt;

          if (x <= 8 || x >= 92) {
            vx = -vx;
            x = Math.max(8, Math.min(92, x));
            facingLeft = vx < 0;
          }
          if (y <= 12 || y >= 88) {
            vy = -vy;
            y = Math.max(12, Math.min(88, y));
          }

          if (advanceFrame && s.frames.length > 1) {
            frameIdx = (frameIdx + 1) % s.frames.length;
          }

          return { ...s, x, y, vx, vy, frameIdx, facingLeft };
        })
      );

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, layerId]);

  if (!active || sprites.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {sprites.map((s) => (
        <PixelSprite
          key={s.id}
          pixels={s.frames[s.frameIdx]}
          scale={s.scale}
          x={s.x}
          y={s.y}
          facingLeft={s.facingLeft}
          opacity={s.opacity ?? 0.85}
        />
      ))}
    </div>
  );
}
