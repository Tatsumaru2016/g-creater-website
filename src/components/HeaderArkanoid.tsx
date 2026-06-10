import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  playArkanoidSfx,
  resumeAudioContext,
  setArkanoidGameSoundEnabled,
} from "../audio/invaderAudio";
import { useI18n } from "../i18n";
import { MinigameSoundToggle } from "./MinigameSoundToggle";
import {
  arenaCenterXFromClient,
  subscribeHeaderMinigameFire,
  subscribeMinigamePointerFrame,
} from "../utils/headerMinigameInput";

const ARENA_H = 68;
/** インベーダーと同じ枠幅（親 147px） */
const ARENA_W_DEFAULT = 147;
const HUD_H = 11;
const PLAY_H = ARENA_H - HUD_H;

const PADDLE_W = 14;
const PADDLE_H = 2;
const BALL_R = 1.4;
const BALL_SPEED = 128;
const PADDLE_Y = PLAY_H - 5;

const BRICK_ROWS = 4;
const BRICK_COLS = 12;
const BRICK_TOP = 3;
const BRICK_H = 2;
const BRICK_GAP = 1;

/** ボール落下のミスは3回まで（4回目でゲームオーバー） */
const MAX_MISSES = 3;
const START_LIVES = MAX_MISSES;
const STAGE_CLEAR_DELAY_MS = 980;
const GAME_OVER_DELAY_MS = 1300;

const BRICK_ROW_COLORS = ["#00F5FF", "#39ff14", "#FFD43B", "#FF4466"] as const;

type Phase = "playing" | "game-clear" | "game-over";

type SimState = {
  w: number;
  paddleX: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  ballLaunched: boolean;
  bricks: boolean[][];
  pointerX: number | null;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function makeBricks(): boolean[][] {
  return Array.from({ length: BRICK_ROWS }, () => Array(BRICK_COLS).fill(true));
}

function brickMetrics(w: number) {
  const gap = BRICK_GAP;
  const bw = (w - gap * (BRICK_COLS + 1)) / BRICK_COLS;
  return { bw, gap };
}

function brickRect(w: number, row: number, col: number) {
  const { bw, gap } = brickMetrics(w);
  return {
    x: gap + col * (bw + gap),
    y: BRICK_TOP + row * (BRICK_H + gap),
    w: bw,
    h: BRICK_H,
  };
}

function aliveBrickCount(bricks: boolean[][]): number {
  let n = 0;
  for (const row of bricks) {
    for (const cell of row) {
      if (cell) n++;
    }
  }
  return n;
}

function circleRectHit(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const nearX = clamp(cx, rx, rx + rw);
  const nearY = clamp(cy, ry, ry + rh);
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy <= r * r;
}

function freshSim(w: number): SimState {
  const paddleX = (w - PADDLE_W) / 2;
  return {
    w,
    paddleX,
    ballX: paddleX + PADDLE_W / 2,
    ballY: PADDLE_Y - BALL_R - 1,
    ballVx: 0,
    ballVy: 0,
    ballLaunched: false,
    bricks: makeBricks(),
    pointerX: null,
  };
}

interface HeaderArkanoidProps {
  globalSoundOn: boolean;
}

export default function HeaderArkanoid({ globalSoundOn }: HeaderArkanoidProps) {
  const { t } = useI18n();
  const [localSoundOn, setLocalSoundOn] = useState(true);
  const sfxEnabled = globalSoundOn && localSoundOn;
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [arenaW, setArenaW] = useState(ARENA_W_DEFAULT);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [phase, setPhase] = useState<Phase>("playing");

  const phaseRef = useRef<Phase>("playing");
  const scoreRef = useRef(0);
  const livesRef = useRef(START_LIVES);
  const simRef = useRef<SimState>(freshSim(ARENA_W_DEFAULT));
  const rafRef = useRef<number | null>(null);
  const prevTsRef = useRef(0);
  const restartTimerRef = useRef<number | null>(null);
  const launchBallRef = useRef<() => void>(() => {});

  const resetRound = useCallback((fullReset: boolean) => {
    const w = simRef.current.w || arenaW;
    simRef.current = freshSim(w);
    prevTsRef.current = 0;
    if (fullReset) {
      scoreRef.current = 0;
      livesRef.current = START_LIVES;
      setScore(0);
      setLives(START_LIVES);
    } else {
      const sim = simRef.current;
      sim.paddleX = (w - PADDLE_W) / 2;
      sim.ballX = sim.paddleX + PADDLE_W / 2;
      sim.ballY = PADDLE_Y - BALL_R - 1;
      sim.ballVx = 0;
      sim.ballVy = 0;
      sim.ballLaunched = false;
    }
    phaseRef.current = "playing";
    setPhase("playing");
  }, [arenaW]);

  const scheduleStageClear = useCallback(() => {
    phaseRef.current = "game-clear";
    setPhase("game-clear");
    playArkanoidSfx("clear");
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
    }
    restartTimerRef.current = window.setTimeout(() => {
      resetRound(true);
    }, STAGE_CLEAR_DELAY_MS);
  }, [resetRound]);

  const scheduleGameOver = useCallback(() => {
    phaseRef.current = "game-over";
    setPhase("game-over");
    playArkanoidSfx("gameOver");
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
    }
    restartTimerRef.current = window.setTimeout(() => {
      resetRound(true);
    }, GAME_OVER_DELAY_MS);
  }, [resetRound]);

  const loseBall = useCallback(() => {
    const sim = simRef.current;
    if (!sim.ballLaunched || phaseRef.current !== "playing") return;

    sim.ballLaunched = false;
    sim.ballVx = 0;
    sim.ballVy = 0;

    livesRef.current -= 1;
    setLives(livesRef.current);
    playArkanoidSfx("loseLife");

    if (livesRef.current <= 0) {
      scheduleGameOver();
      return;
    }

    sim.paddleX = clamp(sim.paddleX, 0, sim.w - PADDLE_W);
    sim.ballX = sim.paddleX + PADDLE_W / 2;
    sim.ballY = PADDLE_Y - BALL_R - 1;
  }, [scheduleGameOver]);

  const launchBall = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const sim = simRef.current;
    if (sim.ballLaunched) return;
    sim.ballLaunched = true;
    const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
    sim.ballVx = Math.sin(angle) * BALL_SPEED;
    sim.ballVy = -Math.cos(angle) * BALL_SPEED;
    playArkanoidSfx("launch");
  }, []);

  launchBallRef.current = launchBall;

  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || ARENA_W_DEFAULT;
      setArenaW(w);
      simRef.current.w = w;
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    resetRound(true);
  }, [resetRound]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return subscribeHeaderMinigameFire(() => {
      launchBallRef.current();
    });
  }, []);

  useEffect(() => {
    return subscribeMinigamePointerFrame((clientX) => {
      const center = arenaCenterXFromClient(clientX, arenaRef.current);
      if (center !== null) {
        simRef.current.pointerX = center;
      }
    });
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;

    const tick = (ts: number) => {
      if (phaseRef.current !== "playing") return;

      const sim = simRef.current;
      const w = sim.w || arenaW;
      const dt = prevTsRef.current ? Math.min(0.032, (ts - prevTsRef.current) / 1000) : 0;
      prevTsRef.current = ts;

      let paddleX = sim.paddleX;
      if (sim.pointerX !== null) {
        paddleX = clamp(sim.pointerX - PADDLE_W / 2, 0, w - PADDLE_W);
      }
      sim.paddleX = paddleX;

      if (!sim.ballLaunched) {
        sim.ballX = sim.paddleX + PADDLE_W / 2;
        sim.ballY = PADDLE_Y - BALL_R - 1;
      } else {
        const prevX = sim.ballX;
        const prevY = sim.ballY;
        sim.ballX += sim.ballVx * dt;
        sim.ballY += sim.ballVy * dt;

        if (sim.ballX - BALL_R <= 0) {
          sim.ballX = BALL_R;
          sim.ballVx = Math.abs(sim.ballVx);
        } else if (sim.ballX + BALL_R >= w) {
          sim.ballX = w - BALL_R;
          sim.ballVx = -Math.abs(sim.ballVx);
        }

        if (sim.ballY - BALL_R <= 0) {
          sim.ballY = BALL_R;
          sim.ballVy = Math.abs(sim.ballVy);
        }

        if (
          sim.ballVy > 0 &&
          circleRectHit(sim.ballX, sim.ballY, BALL_R, sim.paddleX, PADDLE_Y, PADDLE_W, PADDLE_H)
        ) {
          sim.ballY = PADDLE_Y - BALL_R;
          const hit = clamp((sim.ballX - sim.paddleX) / PADDLE_W - 0.5, -0.5, 0.5);
          const speed = Math.max(BALL_SPEED, Math.hypot(sim.ballVx, sim.ballVy));
          const angle = hit * 1.35;
          sim.ballVx = Math.sin(angle) * speed;
          sim.ballVy = -Math.abs(Math.cos(angle) * speed);
          playArkanoidSfx("paddle");
        }

        for (let row = 0; row < BRICK_ROWS; row++) {
          for (let col = 0; col < BRICK_COLS; col++) {
            if (!sim.bricks[row][col]) continue;
            const br = brickRect(w, row, col);
            if (!circleRectHit(sim.ballX, sim.ballY, BALL_R, br.x, br.y, br.w, br.h)) continue;

            sim.bricks[row][col] = false;
            scoreRef.current += 10;
            setScore(scoreRef.current);
            playArkanoidSfx("brick");

            const overlapL = sim.ballX + BALL_R - br.x;
            const overlapR = br.x + br.w - (sim.ballX - BALL_R);
            const overlapT = sim.ballY + BALL_R - br.y;
            const overlapB = br.y + br.h - (sim.ballY - BALL_R);
            const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
            if (minOverlap === overlapL || minOverlap === overlapR) {
              sim.ballVx = -sim.ballVx;
              sim.ballX = prevX;
            } else {
              sim.ballVy = -sim.ballVy;
              sim.ballY = prevY;
            }
          }
        }

        if (sim.ballLaunched && sim.ballY - BALL_R > PLAY_H) {
          loseBall();
        }

        if (aliveBrickCount(sim.bricks) === 0) {
          scheduleStageClear();
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const cw = w;
        const ch = PLAY_H;
        if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
          canvas.width = cw * dpr;
          canvas.height = ch * dpr;
          canvas.style.width = `${cw}px`;
          canvas.style.height = `${ch}px`;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, cw, ch);

          for (let row = 0; row < BRICK_ROWS; row++) {
            for (let col = 0; col < BRICK_COLS; col++) {
              if (!sim.bricks[row][col]) continue;
              const br = brickRect(w, row, col);
              const color = BRICK_ROW_COLORS[row] ?? "#00F5FF";
              ctx.fillStyle = color;
              ctx.shadowColor = color;
              ctx.shadowBlur = 4;
              ctx.fillRect(br.x, br.y, br.w, br.h);
            }
          }
          ctx.shadowBlur = 0;

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(255,255,255,0.85)";
          ctx.shadowBlur = 5;
          ctx.fillRect(sim.paddleX, PADDLE_Y, PADDLE_W, PADDLE_H);
          ctx.shadowBlur = 0;

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#00F5FF";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(sim.ballX, sim.ballY, BALL_R, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [arenaW, loseBall, phase, scheduleStageClear]);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setArkanoidGameSoundEnabled(localSoundOn);
  }, [localSoundOn]);

  const padScore = (n: number) => String(n).padStart(4, "0");

  return (
    <div
      ref={arenaRef}
      tabIndex={0}
      onMouseDown={() => {
        if (sfxEnabled) resumeAudioContext();
      }}
      onWheel={(e) => e.stopPropagation()}
      title={t("arkanoid.controlHint")}
      aria-label={t("arkanoid.ariaLabel")}
      className="relative w-full h-full overflow-hidden cursor-crosshair outline-none border border-cyan-500/30 bg-black/80 rounded-md shadow-[0_0_12px_rgba(0,245,255,0.12)] select-none"
    >
      <div className="absolute inset-x-0 top-0 h-[11px] border-b border-cyan-500/20 bg-black/50 text-[6px] font-mono tracking-wide text-cyan-300/90 flex items-center justify-between px-1 pointer-events-none z-10">
        <span>{t("arkanoid.score", { count: padScore(score) })}</span>
        <span className="text-neutral-500 truncate max-w-[42%] text-center">
          {phase === "playing" && "ARKANOID"}
          {phase === "game-clear" && t("arkanoid.clear")}
          {phase === "game-over" && t("arkanoid.gameOver")}
        </span>
        <span className="flex items-center gap-0.5 pointer-events-auto">
          <MinigameSoundToggle
            on={localSoundOn}
            onToggle={() => setLocalSoundOn((v) => !v)}
            labelOn={t("arkanoid.soundOn")}
            labelOff={t("arkanoid.soundOff")}
          />
          <span className="pointer-events-none">♥{lives}</span>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute left-0 right-0 block"
        style={{ top: HUD_H, width: "100%", height: PLAY_H }}
      />

      {phase === "game-clear" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 pointer-events-none">
          <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-cyan-400 animate-pulse">
            {t("arkanoid.clear")}
          </span>
        </div>
      )}

      {phase === "game-over" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 pointer-events-none">
          <span className="font-mono text-[8px] font-bold tracking-[0.15em] text-red-500 animate-pulse">
            {t("arkanoid.gameOver")}
          </span>
        </div>
      )}
    </div>
  );
}
