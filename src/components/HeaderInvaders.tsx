import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  playInvaderSfx,
  resumeAudioContext,
  setInvaderBgmTempo,
  setInvaderGameSoundEnabled,
} from "../audio/invaderAudio";
import { useI18n } from "../i18n";
import { MinigameSoundToggle } from "./MinigameSoundToggle";
import {
  entityLeftXFromClient,
  subscribeHeaderMinigameFire,
  subscribeMinigamePointerFrame,
} from "../utils/headerMinigameInput";
import { homageFrames } from "../data/homageSprites";

type InvaderCell = 0 | 1;
type InvaderFrame = InvaderCell[][];

type InvaderUnit = {
  id: number;
  col: number;
  row: number;
  alive: boolean;
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  vy: number;
  fromEnemy: boolean;
  moveY?: number;
};

type UfoState = {
  active: boolean;
  x: number;
  y: number;
  dir: -1 | 1;
  nextSpawnAt: number;
};

type Explosion = {
  id: number;
  x: number;
  y: number;
  ttl: number;
};

const ARENA_H = 68;
/** 親コンテナ基準（220px の 2/3） */
const ARENA_W_DEFAULT = 147;
const HUD_H = 11;
const PLAY_H = ARENA_H - HUD_H;

const PIXEL = 1;
const SCALE = 1;
const COLS = 7;
const ROWS = 2;
const INVADER_SPACING_X = 13;
const INVADER_SPACING_Y = 8;
const FORM_TOP = 2;
const FORM_SIDE_PADDING = 3;
const MARCH_STEP = 6;

const PLAYER_Y = PLAY_H - 6;

const BULLET_W = 1;
const BULLET_H = 4;
const PLAYER_BULLET_SPEED = -340;
const ENEMY_BULLET_SPEED = 145;
const ENEMY_SHOOT_EVERY_MS = 620;
const PLAYER_FIRE_COOLDOWN_MS = 190;

const START_LIVES = 3;
const STAGE_CLEAR_DELAY_MS = 980;
const GAME_OVER_DELAY_MS = 1300;

const UFO_Y = 3;
const UFO_SPEED = 72;

const INVADER_FRAME_A: InvaderFrame = [
  [0, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1],
  [1, 0, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1],
  [0, 1, 0, 0, 1, 0],
];

const INVADER_FRAME_B: InvaderFrame = [
  [0, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [0, 0, 1, 1, 0, 0],
];

const PLAYER_FRAME: InvaderFrame = [
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 0, 1, 0, 0],
];

const INVADER_FRAMES = [INVADER_FRAME_A, INVADER_FRAME_B] as const;

const UFO_FRAMES = homageFrames("ufo");
const UFO_TRANSPARENT = "#00000000";

/** 1段目=水色、2段目=赤（クラシック風） */
const INVADER_ROW_COLORS: Record<number, string> = {
  0: "#00F5FF",
  1: "#FF4466",
};

function invaderColor(row: number): string {
  return INVADER_ROW_COLORS[row] ?? "#00F5FF";
}

function spriteSize(frame: InvaderFrame) {
  return {
    w: frame[0].length * PIXEL * SCALE,
    h: frame.length * PIXEL * SCALE,
  };
}

const { w: INVADER_W, h: INVADER_H } = spriteSize(INVADER_FRAME_A);
const { w: PLAYER_W, h: PLAYER_H } = spriteSize(PLAYER_FRAME);
const UFO_W = UFO_FRAMES[0][0]?.length ?? 16;
const UFO_H = UFO_FRAMES[0].length;

const FORMATION_W = (COLS - 1) * INVADER_SPACING_X + INVADER_W;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function makeInvaders(): InvaderUnit[] {
  const out: InvaderUnit[] = [];
  let id = 1;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      out.push({ id: id++, row, col, alive: true });
    }
  }
  return out;
}

function rectHit(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/** 高速弾のすり抜け防止（移動経路をサンプリング） */
function bulletIntersects(
  bx: number,
  by: number,
  bw: number,
  bh: number,
  moveY: number,
  tx: number,
  ty: number,
  tw: number,
  th: number
): boolean {
  if (rectHit(bx, by, bw, bh, tx, ty, tw, th)) return true;
  if (moveY === 0) return false;
  const steps = Math.max(2, Math.ceil(Math.abs(moveY)));
  const prevY = by - moveY;
  for (let i = 0; i <= steps; i++) {
    const y = prevY + (moveY * i) / steps;
    if (rectHit(bx, y, bw, bh, tx, ty, tw, th)) return true;
  }
  return false;
}

function aliveInvaderCount(invaders: InvaderUnit[]): number {
  return invaders.reduce((n, i) => n + (i.alive ? 1 : 0), 0);
}

function lowestAliveInvaderRow(invaders: InvaderUnit[]): number {
  let row = 0;
  for (const inv of invaders) {
    if (inv.alive) row = Math.max(row, inv.row);
  }
  return row;
}

/** 最下段のインベーダーがプレイヤー列に届く formY の上限 */
function invasionLimitFormY(invaders: InvaderUnit[]): number {
  const row = lowestAliveInvaderRow(invaders);
  return PLAYER_Y - row * INVADER_SPACING_Y - INVADER_H;
}

function invadersReachedInvasionLine(
  invaders: InvaderUnit[],
  formY: number
): boolean {
  for (const inv of invaders) {
    if (!inv.alive) continue;
    if (formY + inv.row * INVADER_SPACING_Y + INVADER_H >= PLAYER_Y) {
      return true;
    }
  }
  return false;
}

function randomEnemyShooter(invaders: InvaderUnit[]): InvaderUnit | null {
  const alive = invaders.filter((v) => v.alive);
  if (!alive.length) return null;

  const byCol = new Map<number, InvaderUnit>();
  for (const inv of alive) {
    const existing = byCol.get(inv.col);
    if (!existing || inv.row > existing.row) {
      byCol.set(inv.col, inv);
    }
  }
  const shooters = [...byCol.values()];
  return shooters[Math.floor(Math.random() * shooters.length)] ?? null;
}

function spritePixels(frame: InvaderFrame, color: string) {
  return frame.flatMap((row, y) =>
    row.map((cell, x) => {
      if (!cell) return null;
      return (
        <span
          key={`${x}-${y}`}
          className="absolute"
          style={{
            left: x * PIXEL * SCALE,
            top: y * PIXEL * SCALE,
            width: PIXEL * SCALE,
            height: PIXEL * SCALE,
            backgroundColor: color,
            boxShadow: `0 0 2px ${color}`,
          }}
        />
      );
    })
  );
}

function spriteRgbPixels(grid: string[][]) {
  return grid.flatMap((row, y) =>
    row.map((color, x) => {
      if (!color || color === UFO_TRANSPARENT) return null;
      return (
        <span
          key={`${x}-${y}`}
          className="absolute"
          style={{
            left: x * PIXEL * SCALE,
            top: y * PIXEL * SCALE,
            width: PIXEL * SCALE,
            height: PIXEL * SCALE,
            backgroundColor: color,
            imageRendering: "pixelated",
            boxShadow: `0 0 2px ${color}88`,
          }}
        />
      );
    })
  );
}

interface HeaderInvadersProps {
  globalSoundOn: boolean;
}

export default function HeaderInvaders({ globalSoundOn }: HeaderInvadersProps) {
  const { t } = useI18n();
  const [localSoundOn, setLocalSoundOn] = useState(true);
  const sfxEnabled = globalSoundOn && localSoundOn;
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [arenaW, setArenaW] = useState(ARENA_W_DEFAULT);
  const restartTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevTsRef = useRef(0);
  const bulletSeqRef = useRef(1);
  const explosionSeqRef = useRef(1);
  /** 画面上のプレイヤー弾は常に1発まで */
  const playerBulletLiveRef = useRef(false);
  const phaseRef = useRef<"playing" | "game-clear" | "game-over">("playing");
  const formXRef = useRef(FORM_SIDE_PADDING);
  const formYRef = useRef(FORM_TOP);
  const formDirRef = useRef<-1 | 1>(1);
  const bulletsRef = useRef<Bullet[]>([]);
  const invadersRef = useRef<InvaderUnit[]>(makeInvaders());
  const ufoRef = useRef<UfoState>({
    active: false,
    x: -UFO_W,
    y: UFO_Y,
    dir: 1,
    nextSpawnAt: performance.now() + 2200,
  });
  const playerXRef = useRef(0);
  const playerElRef = useRef<HTMLDivElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [phase, setPhase] = useState<"playing" | "game-clear" | "game-over">("playing");

  const applyPlayerLeft = useCallback((px: number) => {
    playerXRef.current = px;
    const el = playerElRef.current;
    if (el) {
      el.style.transform = `translate3d(${px}px, 0, 0)`;
    }
  }, []);
  const [invaders, setInvaders] = useState<InvaderUnit[]>(() => makeInvaders());
  const [formX, setFormX] = useState(FORM_SIDE_PADDING);
  const [formY, setFormY] = useState(FORM_TOP);
  const [formDir, setFormDir] = useState<-1 | 1>(1);
  const [marchFrame, setMarchFrame] = useState(0);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [ufo, setUfo] = useState<UfoState>({
    active: false,
    x: -UFO_W,
    y: UFO_Y,
    dir: 1,
    nextSpawnAt: performance.now() + 2200,
  });
  const [explosions, setExplosions] = useState<Explosion[]>([]);

  const tryFirePlayerRef = useRef<() => void>(() => {});
  const playerFireCooldownRef = useRef(0);
  const enemyFireTimerRef = useRef(0);
  const marchTimerRef = useRef(0);

  const resetRound = useCallback((resetScore: boolean) => {
    if (resetScore) {
      setScore(0);
      setLives(START_LIVES);
    }
    phaseRef.current = "playing";
    setPhase("playing");
    const px = arenaW / 2 - PLAYER_W / 2;
    applyPlayerLeft(px);
    const freshInvaders = makeInvaders();
    invadersRef.current = freshInvaders;
    setInvaders(freshInvaders);
    formXRef.current = FORM_SIDE_PADDING;
    formYRef.current = FORM_TOP;
    formDirRef.current = 1;
    setFormX(FORM_SIDE_PADDING);
    setFormY(FORM_TOP);
    setFormDir(1);
    setMarchFrame(0);
    bulletsRef.current = [];
    setBullets([]);
    playerBulletLiveRef.current = false;
    setExplosions([]);
    const freshUfo: UfoState = {
      active: false,
      x: -UFO_W,
      y: UFO_Y,
      dir: 1,
      nextSpawnAt: performance.now() + 2200,
    };
    ufoRef.current = freshUfo;
    setUfo(freshUfo);
    playerFireCooldownRef.current = 0;
    enemyFireTimerRef.current = 0;
    marchTimerRef.current = 0;
  }, [arenaW, applyPlayerLeft]);

  useEffect(() => {
    return subscribeMinigamePointerFrame((clientX) => {
      if (phaseRef.current !== "playing") return;
      const w = arenaRef.current?.clientWidth ?? arenaW;
      const px = entityLeftXFromClient(
        clientX,
        arenaRef.current,
        PLAYER_W,
        w
      );
      if (px === null) return;
      applyPlayerLeft(px);
    });
  }, [arenaW, applyPlayerLeft]);

  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const measure = () => setArenaW(el.clientWidth || ARENA_W_DEFAULT);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    resetRound(true);
  }, [resetRound]);

  const tryFirePlayer = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (playerBulletLiveRef.current) return;
    if (bulletsRef.current.some((b) => !b.fromEnemy)) return;
    if (playerFireCooldownRef.current > 0) return;
    playerFireCooldownRef.current = PLAYER_FIRE_COOLDOWN_MS;
    playerBulletLiveRef.current = true;
    const id = bulletSeqRef.current++;
    const nextBullets: Bullet[] = [
      ...bulletsRef.current,
      {
        id,
        x: playerXRef.current + PLAYER_W / 2 - BULLET_W / 2,
        y: PLAYER_Y - BULLET_H,
        vy: PLAYER_BULLET_SPEED,
        fromEnemy: false,
      },
    ];
    bulletsRef.current = nextBullets;
    setBullets(nextBullets);
    playInvaderSfx("shoot");
  }, []);

  tryFirePlayerRef.current = tryFirePlayer;

  useEffect(() => {
    return subscribeHeaderMinigameFire(() => {
      tryFirePlayerRef.current();
    });
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;

    const scheduleGameOver = () => {
      phaseRef.current = "game-over";
      setPhase("game-over");
      bulletsRef.current = [];
      setBullets([]);
      playerBulletLiveRef.current = false;
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
      }
      restartTimerRef.current = window.setTimeout(
        () => resetRound(true),
        GAME_OVER_DELAY_MS
      );
    };

    const scheduleStageClear = () => {
      phaseRef.current = "game-clear";
      setPhase("game-clear");
      playInvaderSfx("stageClear");
      bulletsRef.current = [];
      setBullets([]);
      playerBulletLiveRef.current = false;
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
      }
      restartTimerRef.current = window.setTimeout(
        () => resetRound(true),
        STAGE_CLEAR_DELAY_MS
      );
    };

    const tick = (ts: number) => {
      if (phaseRef.current !== "playing") {
        return;
      }

      const prev = prevTsRef.current || ts;
      const dt = Math.min(33, ts - prev);
      prevTsRef.current = ts;

      if (playerFireCooldownRef.current > 0) playerFireCooldownRef.current -= dt;
      if (enemyFireTimerRef.current > 0) enemyFireTimerRef.current -= dt;
      if (marchTimerRef.current > 0) marchTimerRef.current -= dt;

      const aliveN = aliveInvaderCount(invadersRef.current);
      if (marchTimerRef.current <= 0 && aliveN > 0) {
        const aliveRatio = Math.max(0.15, aliveN / (COLS * ROWS));
        const interval = 520 * aliveRatio;
        marchTimerRef.current = interval;
        setInvaderBgmTempo(aliveRatio);

        const minX = FORM_SIDE_PADDING;
        const maxX = arenaW - FORM_SIDE_PADDING - FORMATION_W;
        const nextX = formXRef.current + formDirRef.current * MARCH_STEP;
        let reachedInvasion = false;

        if (nextX < minX || nextX > maxX) {
          formXRef.current = nextX < minX ? minX : maxX;
          formDirRef.current = (formDirRef.current === 1 ? -1 : 1) as -1 | 1;
          const invasionLimit = invasionLimitFormY(invadersRef.current);
          const nextFormY = Math.min(
            formYRef.current + INVADER_SPACING_Y,
            invasionLimit
          );
          formYRef.current = nextFormY;
          reachedInvasion = invadersReachedInvasionLine(
            invadersRef.current,
            formYRef.current
          );
          setFormX(formXRef.current);
          setFormDir(formDirRef.current);
          setFormY(formYRef.current);
        } else {
          formXRef.current = nextX;
          setFormX(nextX);
        }

        setMarchFrame((f) => (f + 1) % INVADER_FRAMES.length);
        playInvaderSfx("march");

        if (reachedInvasion) {
          playInvaderSfx("playerExplosion");
          scheduleGameOver();
          return;
        }
      }

      if (enemyFireTimerRef.current <= 0 && aliveN > 0) {
        enemyFireTimerRef.current = ENEMY_SHOOT_EVERY_MS + Math.random() * 360;
        const shooter = randomEnemyShooter(invadersRef.current);
        if (shooter) {
          const sx =
            formXRef.current +
            shooter.col * INVADER_SPACING_X +
            INVADER_W / 2 -
            BULLET_W / 2;
          const sy = formYRef.current + shooter.row * INVADER_SPACING_Y + INVADER_H;
          bulletsRef.current = [
            ...bulletsRef.current,
            {
              id: bulletSeqRef.current++,
              x: sx,
              y: sy,
              vy: ENEMY_BULLET_SPEED,
              fromEnemy: true,
            },
          ];
          playInvaderSfx("enemyShoot");
        }
      }

      const movedBullets = bulletsRef.current
        .map((b) => {
          const moveY = b.vy * (dt / 1000);
          return { ...b, y: b.y + moveY, moveY };
        })
        .filter((b) => b.y > -20 && b.y < PLAY_H + 20);

      const toRemove = new Set<number>();
      let hitPlayer = false;
      const newExplosions: Explosion[] = [];
      let scoreDelta = 0;

      for (const b of movedBullets) {
        if (toRemove.has(b.id)) continue;
        const moveY = b.moveY ?? 0;

        if (!b.fromEnemy) {
          let consumed = false;
          for (const inv of invadersRef.current) {
            if (!inv.alive) continue;
            const ix = formXRef.current + inv.col * INVADER_SPACING_X;
            const iy = formYRef.current + inv.row * INVADER_SPACING_Y;
            if (
              bulletIntersects(
                b.x,
                b.y,
                BULLET_W,
                BULLET_H,
                moveY,
                ix,
                iy,
                INVADER_W,
                INVADER_H
              )
            ) {
              inv.alive = false;
              toRemove.add(b.id);
              consumed = true;
              scoreDelta += 10;
              newExplosions.push({
                id: explosionSeqRef.current++,
                x: ix + INVADER_W / 2,
                y: iy + INVADER_H / 2,
                ttl: 220,
              });
              playInvaderSfx("explosion");
              break;
            }
          }

          if (!consumed && ufoRef.current.active) {
            const u = ufoRef.current;
            if (
              bulletIntersects(
                b.x,
                b.y,
                BULLET_W,
                BULLET_H,
                moveY,
                u.x,
                u.y,
                UFO_W,
                UFO_H
              )
            ) {
              toRemove.add(b.id);
              scoreDelta += 100;
              ufoRef.current = {
                ...u,
                active: false,
                nextSpawnAt: ts + 7500,
              };
              newExplosions.push({
                id: explosionSeqRef.current++,
                x: u.x + UFO_W / 2,
                y: u.y + UFO_H / 2,
                ttl: 340,
              });
              playInvaderSfx("explosion");
            }
          }
        } else if (
          bulletIntersects(
            b.x,
            b.y,
            BULLET_W,
            BULLET_H,
            moveY,
            playerXRef.current,
            PLAYER_Y,
            PLAYER_W,
            PLAYER_H
          )
        ) {
          toRemove.add(b.id);
          hitPlayer = true;
        }
      }

      const nextBullets = movedBullets
        .filter((b) => !toRemove.has(b.id))
        .map(({ moveY: _moveY, ...b }) => b);
      bulletsRef.current = nextBullets;
      playerBulletLiveRef.current = nextBullets.some((bullet) => !bullet.fromEnemy);
      setBullets(nextBullets);

      if (scoreDelta > 0) {
        setScore((s) => s + scoreDelta);
      }
      if (newExplosions.length > 0) {
        setExplosions((prev) => [...prev, ...newExplosions]);
      }
      setInvaders([...invadersRef.current]);

      let ufoNext = ufoRef.current;
      if (!ufoNext.active && ts >= ufoNext.nextSpawnAt) {
        playInvaderSfx("ufoAppear");
        ufoNext = {
          active: true,
          x: ufoNext.dir === 1 ? -UFO_W : arenaW + UFO_W,
          y: UFO_Y,
          dir: (Math.random() > 0.5 ? 1 : -1) as -1 | 1,
          nextSpawnAt: ts + 7000 + Math.random() * 5000,
        };
      } else if (ufoNext.active) {
        const nextX = ufoNext.x + ufoNext.dir * UFO_SPEED * (dt / 1000);
        const offLeft = nextX < -UFO_W - 4;
        const offRight = nextX > arenaW + UFO_W + 4;
        if (offLeft || offRight) {
          ufoNext = {
            active: false,
            x: ufoNext.dir === 1 ? -UFO_W : arenaW + UFO_W,
            y: UFO_Y,
            dir: (Math.random() > 0.5 ? 1 : -1) as -1 | 1,
            nextSpawnAt: ts + 6000 + Math.random() * 5000,
          };
        } else {
          ufoNext = { ...ufoNext, x: nextX };
        }
      }
      ufoRef.current = ufoNext;
      setUfo(ufoNext);

      setExplosions((prev) =>
        prev.map((e) => ({ ...e, ttl: e.ttl - dt })).filter((e) => e.ttl > 0)
      );

      if (hitPlayer) {
        playInvaderSfx("playerExplosion");
        bulletsRef.current = [];
        setBullets([]);
        playerBulletLiveRef.current = false;
        setLives((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            scheduleGameOver();
          }
          return Math.max(0, next);
        });
      }

      if (
        invadersReachedInvasionLine(
          invadersRef.current,
          formYRef.current
        )
      ) {
        playInvaderSfx("playerExplosion");
        scheduleGameOver();
      } else if (aliveInvaderCount(invadersRef.current) === 0) {
        scheduleStageClear();
      }

      if (phaseRef.current === "playing") {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [arenaW, phase, resetRound, applyPlayerLeft]);

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
    setInvaderGameSoundEnabled(localSoundOn);
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
      title={t("invaders.controlHint")}
      aria-label={t("invaders.ariaLabel")}
      className="relative w-full h-full overflow-hidden cursor-crosshair outline-none border border-cyan-500/30 bg-black/80 rounded-md shadow-[0_0_12px_rgba(0,245,255,0.12)] select-none"
    >
      <div className="absolute inset-x-0 top-0 h-[11px] border-b border-cyan-500/20 bg-black/50 text-[6px] font-mono tracking-wide text-cyan-300/90 flex items-center justify-between px-1 pointer-events-none z-10">
        <span>{t("invaders.score", { count: padScore(score) })}</span>
        <span className="text-neutral-500 truncate max-w-[42%] text-center">
          {phase === "playing" && "PLAY"}
          {phase === "game-clear" && t("invaders.clear")}
          {phase === "game-over" && t("invaders.gameOver")}
        </span>
        <span className="flex items-center gap-0.5 pointer-events-auto">
          <MinigameSoundToggle
            on={localSoundOn}
            onToggle={() => setLocalSoundOn((v) => !v)}
            labelOn={t("invaders.soundOn")}
            labelOff={t("invaders.soundOff")}
          />
          <span className="pointer-events-none">♥{lives}</span>
        </span>
      </div>

      <div className="absolute left-0 right-0" style={{ top: HUD_H, bottom: 0 }}>
          {invaders
            .filter((i) => i.alive)
            .map((inv) => {
              const x = formX + inv.col * INVADER_SPACING_X;
              const y = formY + inv.row * INVADER_SPACING_Y;
              const frame = INVADER_FRAMES[marchFrame % INVADER_FRAMES.length];

              return (
                <div
                  key={inv.id}
                  className="absolute"
                  style={{ left: x, top: y, width: INVADER_W, height: INVADER_H }}
                >
                  {spritePixels(frame, invaderColor(inv.row))}
                </div>
              );
            })}

          {ufo.active && (
            <div
              className="absolute"
              style={{ left: ufo.x, top: ufo.y, width: UFO_W, height: UFO_H }}
            >
              {spriteRgbPixels(
                UFO_FRAMES[Math.floor(performance.now() / 320) % UFO_FRAMES.length]
              )}
            </div>
          )}

          {bullets.map((b) => (
            <span
              key={b.id}
              className="absolute"
              style={{
                left: b.x,
                top: b.y,
                width: BULLET_W,
                height: BULLET_H,
                backgroundColor: b.fromEnemy ? "#f97316" : "#39ff14",
                boxShadow: `0 0 4px ${b.fromEnemy ? "#f97316" : "#39ff14"}`,
              }}
            />
          ))}

          {explosions.map((ex) => (
            <span
              key={ex.id}
              className="absolute rounded-full"
              style={{
                left: ex.x - 5,
                top: ex.y - 5,
                width: 10,
                height: 10,
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,102,0,0.9) 40%, rgba(255,0,128,0.2) 100%)",
                boxShadow: "0 0 8px rgba(255,120,0,0.8)",
                opacity: clamp(ex.ttl / 340, 0.1, 1),
                transform: `scale(${0.65 + (340 - ex.ttl) / 280})`,
              }}
            />
          ))}

          <div
            ref={playerElRef}
            className="absolute left-0 will-change-transform"
            style={{
              top: PLAYER_Y,
              width: PLAYER_W,
              height: PLAYER_H,
            }}
          >
            {spritePixels(PLAYER_FRAME, "#39ff14")}
          </div>

          {phase === "game-clear" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 pointer-events-none">
              <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-cyan-400 animate-pulse">
                {t("invaders.clear")}
              </span>
            </div>
          )}

          {phase === "game-over" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 pointer-events-none">
              <span className="font-mono text-[8px] font-bold tracking-[0.15em] text-red-500 animate-pulse">
                {t("invaders.gameOver")}
              </span>
            </div>
          )}
        </div>
    </div>
  );
}
