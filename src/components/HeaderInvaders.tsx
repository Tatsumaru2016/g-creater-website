import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";
import {
  playInvaderSfx,
  playInvaderMarchNote,
  resumeAudioContext,
  setInvaderBgmTempo,
} from "../audio/invaderAudio";

const INVADER_FRAMES: string[][][] = [
  [
    [
      "#00000000", "#FF4466", "#FF4466", "#00000000", "#00000000", "#FF4466", "#FF4466", "#00000000",
      "#00000000", "#00000000", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#00000000", "#00000000",
      "#00000000", "#FF4466", "#FFFFFF", "#FF4466", "#FF4466", "#FFFFFF", "#FF4466", "#00000000",
      "#00000000", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#00000000",
      "#00000000", "#00000000", "#FF4466", "#00000000", "#00000000", "#FF4466", "#00000000", "#00000000",
      "#00000000", "#00000000", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#00000000", "#00000000",
    ],
    [
      "#00000000", "#00000000", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#00000000", "#00000000",
      "#00000000", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#00000000",
      "#00000000", "#FF4466", "#FFFFFF", "#FF4466", "#FF4466", "#FFFFFF", "#FF4466", "#00000000",
      "#00000000", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#00000000",
      "#00000000", "#FF4466", "#00000000", "#FF4466", "#FF4466", "#00000000", "#FF4466", "#00000000",
      "#00000000", "#FF4466", "#FF4466", "#00000000", "#00000000", "#FF4466", "#FF4466", "#00000000",
    ],
  ],
  [
    [
      "#00000000", "#00F0FF", "#00F0FF", "#00000000", "#00000000", "#00F0FF", "#00F0FF", "#00000000",
      "#00000000", "#00000000", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00000000", "#00000000",
      "#00000000", "#00F0FF", "#FFFFFF", "#00F0FF", "#00F0FF", "#FFFFFF", "#00F0FF", "#00000000",
      "#00000000", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00000000",
      "#00000000", "#00000000", "#00F0FF", "#00000000", "#00000000", "#00F0FF", "#00000000", "#00000000",
      "#00000000", "#00F0FF", "#00F0FF", "#00000000", "#00000000", "#00F0FF", "#00F0FF", "#00000000",
    ],
    [
      "#00000000", "#00000000", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00000000", "#00000000",
      "#00000000", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00000000",
      "#00000000", "#00F0FF", "#FFFFFF", "#00F0FF", "#00F0FF", "#FFFFFF", "#00F0FF", "#00000000",
      "#00000000", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00000000",
      "#00000000", "#00F0FF", "#00000000", "#00F0FF", "#00F0FF", "#00000000", "#00F0FF", "#00000000",
      "#00000000", "#00000000", "#00F0FF", "#00F0FF", "#00F0FF", "#00F0FF", "#00000000", "#00000000",
    ],
  ],
];

const PLAYER_PIXELS: string[] = [
  "#00000000", "#00000000", "#FFD700", "#FFD700", "#FFD700", "#00000000", "#00000000",
  "#00000000", "#FFD700", "#FFD700", "#FFD700", "#FFD700", "#FFD700", "#00000000",
  "#FFD700", "#FFD700", "#FFD700", "#FFFFFF", "#FFD700", "#FFD700", "#FFD700",
  "#00000000", "#FFD700", "#FFD700", "#FFD700", "#FFD700", "#FFD700", "#00000000",
];

const EXPLOSION_FRAMES = [
  ["#FFFFFF", "#FFAA00", "#FFFFFF", "#FFAA00", "#FFFFFF"],
  ["#FFAA00", "#FF4400", "#FFFF00", "#FF4400", "#FFAA00"],
  ["#FF4400", "#880000", "#FF6600", "#880000", "#FF4400"],
  ["#880000", "#00000000", "#440000", "#00000000", "#880000"],
];

const COLS = 7;
const ROWS = 2;
const SPRITE_W = 8;
const SPRITE_H = 6;
const PLAYER_W = 7;
const PLAYER_H = 4;
const PIXEL = 2;
const GAP_X = 4;
const GAP_Y = 3;
const STEP_X = 5;
const ROW_STEP_Y = SPRITE_H * PIXEL + GAP_Y;
const FORM_TOP = 4;
const MARCH_MS = 420;
const ANIM_MS = 210;
const BULLET_SPEED = 5;
const ENEMY_BULLET_SPEED = 3;
const BULLET_W = 2;
const BULLET_H = 6;
const FIRE_COOLDOWN_MS = 280;
const GAME_OVER_MS = 2500;
const STAGE_CLEAR_MS = 2200;
const ENEMY_FIRE_CHANCE = 0.22;
const EXPLOSION_MS = 45;
const PLAYER_SPEED = 4;
const ROW_POINTS = [30, 10];
const TOTAL_INVADERS = COLS * ROWS;
const UFO_W = 7;
const UFO_H = 3;
const UFO_POINTS = 300;
const UFO_SPEED = 2.8;
const UFO_TOP_Y = 16;
const UFO_SPAWN_CHANCE = 0.07;
const UFO_FIRE_COOLDOWN_MS = 750;
const UFO_BULLET_SPEED = 4.5;

const UFO_FRAMES: string[][] = [
  [
    "#00000000", "#39FF14", "#39FF14", "#39FF14", "#39FF14", "#39FF14", "#00000000",
    "#39FF14", "#39FF14", "#FFFFFF", "#39FF14", "#FFFFFF", "#39FF14", "#39FF14",
    "#00000000", "#39FF14", "#39FF14", "#39FF14", "#39FF14", "#39FF14", "#00000000",
  ],
  [
    "#00000000", "#39FF14", "#39FF14", "#39FF14", "#39FF14", "#39FF14", "#00000000",
    "#39FF14", "#FFFFFF", "#39FF14", "#39FF14", "#39FF14", "#FFFFFF", "#39FF14",
    "#00000000", "#39FF14", "#39FF14", "#39FF14", "#39FF14", "#39FF14", "#00000000",
  ],
];

interface InvaderCell {
  id: number;
  row: number;
  col: number;
  type: number;
  alive: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  fromUfo?: boolean;
  speed?: number;
}

interface UfoState {
  active: boolean;
  x: number;
  y: number;
  dir: 1 | -1;
  lastShot: number;
  frame: number;
}

function ufoWidth() {
  return UFO_W * PIXEL;
}

function ufoHeight() {
  return UFO_H * PIXEL;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  frame: number;
  born: number;
}

function buildFormation(): InvaderCell[] {
  const cells: InvaderCell[] = [];
  let id = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ id: id++, row, col, type: row % 2, alive: true });
    }
  }
  return cells;
}

function formationWidth(): number {
  return COLS * (SPRITE_W * PIXEL + GAP_X) - GAP_X;
}

function formationExtents(cells: InvaderCell[]): { left: number; right: number } {
  const invW = SPRITE_W * PIXEL;
  const stepX = invW + GAP_X;
  const alive = cells.filter((c) => c.alive);
  if (alive.length === 0) {
    return { left: 0, right: formationWidth() };
  }
  const minCol = Math.min(...alive.map((c) => c.col));
  const maxCol = Math.max(...alive.map((c) => c.col));
  return {
    left: minCol * stepX,
    right: maxCol * stepX + invW,
  };
}

function playerWidth(): number {
  return PLAYER_W * PIXEL;
}

function playerHeight(): number {
  return PLAYER_H * PIXEL;
}

function PixelGrid({ pixels, w, h }: { pixels: string[]; w: number; h: number }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${w}, ${PIXEL}px)`,
        gridTemplateRows: `repeat(${h}, ${PIXEL}px)`,
        imageRendering: "pixelated",
      }}
    >
      {pixels.map((color, i) => (
        <div
          key={i}
          style={{ backgroundColor: color === "#00000000" ? "transparent" : color }}
        />
      ))}
    </div>
  );
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function invadersHitPlayer(
  formX: number,
  formY: number,
  cells: InvaderCell[],
  playerX: number,
  playerY: number
): boolean {
  const invW = SPRITE_W * PIXEL;
  const invH = SPRITE_H * PIXEL;
  const pW = playerWidth();
  const pH = playerHeight();

  for (const cell of cells) {
    if (!cell.alive) continue;
    const ix = formX + cell.col * (invW + GAP_X);
    const iy = formY + cell.row * (invH + GAP_Y);
    if (rectsOverlap(ix, iy, invW, invH, playerX, playerY, pW, pH)) {
      return true;
    }
  }
  return false;
}

function ExplosionSprite({ x, y, frame }: { x: number; y: number; frame: number }) {
  const colors = EXPLOSION_FRAMES[Math.min(frame, EXPLOSION_FRAMES.length - 1)];
  const size = 5;
  const px = 3;
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x - (size * px) / 2, top: y - (size * px) / 2, imageRendering: "pixelated" }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${size}, ${px}px)`,
          gridTemplateRows: `repeat(${size}, ${px}px)`,
        }}
      >
        {colors.map((c, i) => (
          <div key={i} style={{ backgroundColor: c === "#00000000" ? "transparent" : c }} />
        ))}
      </div>
    </div>
  );
}

interface HeaderInvadersProps {
  sfxEnabled: boolean;
  bgmEnabled: boolean;
}

export default function HeaderInvaders({ sfxEnabled, bgmEnabled }: HeaderInvadersProps) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const bulletId = useRef(0);
  const explosionId = useRef(0);
  const canFireAt = useRef(0);
  const gameOverRef = useRef(false);
  const stageClearRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sfxRef = useRef(sfxEnabled);
  const bgmRef = useRef(bgmEnabled);
  const keysRef = useRef({ left: false, right: false });
  const arenaActiveRef = useRef(false);

  const gameRef = useRef({
    cells: buildFormation(),
    formX: 0,
    formY: FORM_TOP,
    dir: 1 as 1 | -1,
    playerX: 0,
    bullets: [] as Bullet[],
    enemyBullets: [] as Bullet[],
    explosions: [] as Explosion[],
    playerAlive: true,
    ufo: null as UfoState | null,
  });

  const [cells, setCells] = useState<InvaderCell[]>(buildFormation);
  const [formX, setFormX] = useState(0);
  const [formY, setFormY] = useState(FORM_TOP);
  const [animFrame, setAnimFrame] = useState(0);
  const [playerX, setPlayerX] = useState(0);
  const [playerAlive, setPlayerAlive] = useState(true);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [stageClear, setStageClear] = useState(false);
  const [score, setScore] = useState(0);
  const [ufo, setUfo] = useState<UfoState | null>(null);
  const ufoClock = useRef(0);

  const [hiScore, setHiScore] = useState(() => {
    try {
      return Number(sessionStorage.getItem("gcreater_invader_hi") || 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    sfxRef.current = sfxEnabled;
  }, [sfxEnabled]);

  useEffect(() => {
    bgmRef.current = bgmEnabled;
  }, [bgmEnabled]);

  const spawnExplosion = useCallback((x: number, y: number) => {
    const ex: Explosion = {
      id: explosionId.current++,
      x,
      y,
      frame: 0,
      born: performance.now(),
    };
    gameRef.current.explosions = [...gameRef.current.explosions, ex];
    setExplosions([...gameRef.current.explosions]);
  }, []);

  const addScore = useCallback((pts: number) => {
    setScore((s) => {
      const next = s + pts;
      setHiScore((hi) => {
        if (next > hi) {
          try {
            sessionStorage.setItem("gcreater_invader_hi", String(next));
          } catch {
            /* ignore */
          }
          return next;
        }
        return hi;
      });
      return next;
    });
  }, []);

  const resetGame = useCallback(() => {
    const fresh = buildFormation();
    gameRef.current = {
      cells: fresh,
      formX: 0,
      formY: FORM_TOP,
      dir: 1,
      playerX: gameRef.current.playerX,
      bullets: [],
      enemyBullets: [],
      explosions: [],
      playerAlive: true,
      ufo: null,
    };
    setCells(fresh);
    setFormX(0);
    setFormY(FORM_TOP);
    setBullets([]);
    setEnemyBullets([]);
    setExplosions([]);
    setPlayerAlive(true);
    setUfo(null);
    setInvaderBgmTempo(1);
  }, []);

  const triggerStageClear = useCallback(() => {
    if (stageClearRef.current || gameOverRef.current) return;
    stageClearRef.current = true;
    setStageClear(true);
    gameRef.current.bullets = [];
    gameRef.current.enemyBullets = [];
    gameRef.current.ufo = null;
    setBullets([]);
    setEnemyBullets([]);
    setUfo(null);
    addScore(100);
    if (sfxRef.current) playInvaderSfx("stageClear");

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      stageClearRef.current = false;
      setStageClear(false);
      resetGame();
      restartTimerRef.current = null;
    }, STAGE_CLEAR_MS);
  }, [addScore, resetGame]);

  const getPlayerY = useCallback((arenaH: number) => arenaH - playerHeight() - 1, []);

  const triggerGameOver = useCallback((ex: number, ey: number) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    gameRef.current.playerAlive = false;
    setPlayerAlive(false);
    gameRef.current.bullets = [];
    gameRef.current.enemyBullets = [];
    gameRef.current.ufo = null;
    setBullets([]);
    setEnemyBullets([]);
    setUfo(null);
    spawnExplosion(ex, ey);
    if (sfxRef.current) playInvaderSfx("playerExplosion");

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      gameOverRef.current = false;
      setGameOver(false);
      resetGame();
      restartTimerRef.current = null;
    }, GAME_OVER_MS);
  }, [resetGame, spawnExplosion]);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, []);

  const trySpawnUfo = useCallback(() => {
    if (gameRef.current.ufo?.active) return;
    if (Math.random() > UFO_SPAWN_CHANCE) return;
    const arena = arenaRef.current;
    if (!arena) return;

    const fromLeft = Math.random() > 0.5;
    const uw = ufoWidth();
    const next: UfoState = {
      active: true,
      x: fromLeft ? -uw * 0.5 : arena.clientWidth + uw * 0.5,
      y: UFO_TOP_Y,
      dir: fromLeft ? 1 : -1,
      lastShot: Date.now(),
      frame: 0,
    };
    gameRef.current.ufo = next;
    setUfo({ ...next });
    if (sfxRef.current) playInvaderSfx("ufoAppear");
  }, []);

  const tryUfoFire = useCallback((ufoState: UfoState) => {
    const maxBullets = 2;
    if (gameRef.current.enemyBullets.length >= maxBullets) return;
    const now = Date.now();
    if (now - ufoState.lastShot < UFO_FIRE_COOLDOWN_MS) return;

    const bx = ufoState.x + ufoWidth() / 2 - BULLET_W / 2;
    const by = ufoState.y + ufoHeight();
    const b: Bullet = {
      id: bulletId.current++,
      x: bx,
      y: by,
      fromUfo: true,
      speed: UFO_BULLET_SPEED,
    };
    gameRef.current.enemyBullets = [...gameRef.current.enemyBullets, b];
    setEnemyBullets([...gameRef.current.enemyBullets]);
    ufoState.lastShot = now;
    if (sfxRef.current) playInvaderSfx("enemyShoot");
  }, []);

  const tryEnemyFire = useCallback((formX: number, formY: number, currentCells: InvaderCell[]) => {
    if (gameRef.current.enemyBullets.length >= (gameRef.current.ufo?.active ? 2 : 1)) return;
    if (Math.random() > ENEMY_FIRE_CHANCE) return;

    const alive = currentCells.filter((c) => c.alive);
    if (alive.length === 0) return;

    const invW = SPRITE_W * PIXEL;
    const invH = SPRITE_H * PIXEL;
    const col = Math.floor(Math.random() * COLS);
    const inCol = alive.filter((c) => c.col === col);
    if (inCol.length === 0) return;

    const shooter = inCol.reduce((a, b) => (a.row > b.row ? a : b));
    const ix = formX + shooter.col * (invW + GAP_X) + invW / 2 - BULLET_W / 2;
    const iy = formY + shooter.row * (invH + GAP_Y) + invH;

    const b: Bullet = { id: bulletId.current++, x: ix, y: iy };
    gameRef.current.enemyBullets = [b];
    setEnemyBullets([b]);
    if (sfxRef.current) playInvaderSfx("enemyShoot");
  }, []);

  const fireBullet = useCallback(() => {
    if (gameOverRef.current || stageClearRef.current || !gameRef.current.playerAlive) return;
    const now = Date.now();
    if (now < canFireAt.current) return;
    if (gameRef.current.bullets.length > 0) return;

    const arena = arenaRef.current;
    if (!arena) return;

    const px = gameRef.current.playerX;
    const py = getPlayerY(arena.clientHeight);
    const b: Bullet = {
      id: bulletId.current++,
      x: px + playerWidth() / 2 - BULLET_W / 2,
      y: py - BULLET_H,
    };
    gameRef.current.bullets = [b];
    setBullets([b]);
    canFireAt.current = now + FIRE_COOLDOWN_MS;
    if (sfxRef.current) playInvaderSfx("shoot");
  }, [getPlayerY]);

  const movePlayerTo = useCallback((clientX: number) => {
    if (gameOverRef.current || stageClearRef.current || !gameRef.current.playerAlive) return;
    const arena = arenaRef.current;
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    const x = clientX - rect.left - playerWidth() / 2;
    const clamped = Math.max(0, Math.min(rect.width - playerWidth(), x));
    gameRef.current.playerX = clamped;
    setPlayerX(clamped);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    resumeAudioContext();
    arenaActiveRef.current = true;
    movePlayerTo(e.clientX);
  }, [movePlayerTo]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    resumeAudioContext();
    if (e.touches[0]) movePlayerTo(e.touches[0].clientX);
  }, [movePlayerTo]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    resumeAudioContext();
    if (e.touches[0]) movePlayerTo(e.touches[0].clientX);
    fireBullet();
  }, [movePlayerTo, fireBullet]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    resumeAudioContext();
    if (gameOverRef.current || stageClearRef.current) return;
    fireBullet();
  }, [fireBullet]);

  // Keyboard: ← → move, Space shoot
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!arenaActiveRef.current) return;
      if (e.key === "ArrowLeft") keysRef.current.left = true;
      if (e.key === "ArrowRight") keysRef.current.right = true;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        resumeAudioContext();
        fireBullet();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "ArrowRight") keysRef.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [fireBullet]);

  // Invader march
  useEffect(() => {
    let marchTimer: ReturnType<typeof setInterval>;

    const march = () => {
      if (gameOverRef.current || stageClearRef.current) return;
      const arena = arenaRef.current;
      if (!arena) return;

      const alive = gameRef.current.cells.filter((c) => c.alive);
      if (alive.length === 0) return;

      setInvaderBgmTempo(alive.length / TOTAL_INVADERS);

      const maxW = arena.clientWidth;
      const margin = 1;
      let { formX, formY, dir, playerX, cells: currentCells } = gameRef.current;
      const { left, right } = formationExtents(currentCells);
      const nextX = formX + dir * STEP_X;
      const hitRight = dir > 0 && nextX + right >= maxW - margin;
      const hitLeft = dir < 0 && nextX + left <= margin;

      if (hitRight || hitLeft) {
        dir = (dir * -1) as 1 | -1;
        formY += ROW_STEP_Y;
        formX += dir * STEP_X;
        if (dir > 0) {
          formX = Math.min(formX, maxW - margin - right);
        } else {
          formX = Math.max(formX, margin - left);
        }
      } else {
        formX = nextX;
      }

      gameRef.current.formX = formX;
      gameRef.current.formY = formY;
      gameRef.current.dir = dir;
      setFormX(formX);
      setFormY(formY);

      if (bgmRef.current) playInvaderMarchNote();
      trySpawnUfo();
      tryEnemyFire(formX, formY, currentCells);

      const py = getPlayerY(arena.clientHeight);
      if (invadersHitPlayer(formX, formY, currentCells, playerX, py)) {
        triggerGameOver(playerX + playerWidth() / 2, py + playerHeight() / 2);
      }
    };

    const rescheduleMarch = () => {
      const alive = gameRef.current.cells.filter((c) => c.alive).length;
      const ms = Math.max(200, MARCH_MS - (TOTAL_INVADERS - alive) * 18);
      clearInterval(marchTimer);
      marchTimer = setInterval(march, ms);
    };

    marchTimer = setInterval(march, MARCH_MS);
    const rescheduler = setInterval(rescheduleMarch, 800);
    return () => {
      clearInterval(marchTimer);
      clearInterval(rescheduler);
    };
  }, [getPlayerY, triggerGameOver, tryEnemyFire, trySpawnUfo]);

  useEffect(() => {
    const id = setInterval(() => setAnimFrame((f) => (f + 1) % 2), ANIM_MS);
    return () => clearInterval(id);
  }, []);

  // Game loop: bullets, explosions, collisions
  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const now = performance.now();
      const arena = arenaRef.current;

      if (gameRef.current.explosions.length > 0) {
        const nextEx = gameRef.current.explosions
          .map((ex) => ({
            ...ex,
            frame: Math.floor((now - ex.born) / EXPLOSION_MS),
          }))
          .filter((ex) => ex.frame < EXPLOSION_FRAMES.length);
        gameRef.current.explosions = nextEx;
        setExplosions([...nextEx]);
      }

      if (gameOverRef.current || stageClearRef.current || !arena) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Keyboard movement
      if (keysRef.current.left || keysRef.current.right) {
        const arenaW = arena.clientWidth;
        let px = gameRef.current.playerX;
        if (keysRef.current.left) px -= PLAYER_SPEED;
        if (keysRef.current.right) px += PLAYER_SPEED;
        px = Math.max(0, Math.min(arenaW - playerWidth(), px));
        gameRef.current.playerX = px;
        setPlayerX(px);
      }

      const { formX, formY, cells: currentCells, playerX: px } = gameRef.current;
      const py = getPlayerY(arena.clientHeight);
      const invW = SPRITE_W * PIXEL;
      const invH = SPRITE_H * PIXEL;
      const pW = playerWidth();
      const pH = playerHeight();

      // Player bullets up
      let nextPlayerBullets = gameRef.current.bullets
        .map((b) => ({ ...b, y: b.y - BULLET_SPEED }))
        .filter((b) => b.y + BULLET_H > 0);

      let killed = false;
      nextPlayerBullets = nextPlayerBullets.filter((b) => {
        const ufoState = gameRef.current.ufo;
        if (ufoState?.active) {
          const uw = ufoWidth();
          const uh = ufoHeight();
          if (rectsOverlap(b.x, b.y, BULLET_W, BULLET_H, ufoState.x, ufoState.y, uw, uh)) {
            spawnExplosion(ufoState.x + uw / 2, ufoState.y + uh / 2);
            addScore(UFO_POINTS);
            gameRef.current.ufo = null;
            setUfo(null);
            if (sfxRef.current) playInvaderSfx("explosion");
            return false;
          }
        }

        for (const cell of currentCells) {
          if (!cell.alive) continue;
          const ix = formX + cell.col * (invW + GAP_X);
          const iy = formY + cell.row * (invH + GAP_Y);
          if (rectsOverlap(b.x, b.y, BULLET_W, BULLET_H, ix, iy, invW, invH)) {
            cell.alive = false;
            killed = true;
            addScore(ROW_POINTS[cell.row] ?? 10);
            spawnExplosion(ix + invW / 2, iy + invH / 2);
            if (sfxRef.current) playInvaderSfx("explosion");
            return false;
          }
        }
        return true;
      });

      // UFO movement & shooting
      ufoClock.current += 1;
      const ufoState = gameRef.current.ufo;
      if (ufoState?.active) {
        let nx = ufoState.x + ufoState.dir * UFO_SPEED;
        const uw = ufoWidth();
        if (ufoState.dir > 0 && nx > arena.clientWidth + uw) {
          gameRef.current.ufo = null;
          setUfo(null);
        } else if (ufoState.dir < 0 && nx < -uw) {
          gameRef.current.ufo = null;
          setUfo(null);
        } else {
          const frame = ufoClock.current % 16 < 8 ? 0 : 1;
          const updated: UfoState = { ...ufoState, x: nx, frame };
          gameRef.current.ufo = updated;
          setUfo(updated);
          tryUfoFire(updated);
        }
      }

      if (killed) {
        const updatedCells = [...currentCells];
        gameRef.current.cells = updatedCells;
        setCells(updatedCells);
        if (updatedCells.every((c) => !c.alive)) {
          triggerStageClear();
          raf = requestAnimationFrame(tick);
          return;
        }
      }

      // Enemy bullets down
      let nextEnemyBullets = gameRef.current.enemyBullets
        .map((b) => ({ ...b, y: b.y + (b.speed ?? ENEMY_BULLET_SPEED) }))
        .filter((b) => b.y < arena.clientHeight);

      nextEnemyBullets = nextEnemyBullets.filter((b) => {
        if (
          gameRef.current.playerAlive &&
          rectsOverlap(b.x, b.y, BULLET_W, BULLET_H, px, py, pW, pH)
        ) {
          triggerGameOver(px + pW / 2, py + pH / 2);
          return false;
        }
        return true;
      });

      gameRef.current.bullets = nextPlayerBullets;
      gameRef.current.enemyBullets = nextEnemyBullets;
      setBullets([...nextPlayerBullets]);
      setEnemyBullets([...nextEnemyBullets]);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getPlayerY, addScore, spawnExplosion, triggerGameOver, triggerStageClear, tryUfoFire]);

  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const x = (arena.clientWidth - playerWidth()) / 2;
    gameRef.current.playerX = x;
    setPlayerX(x);
  }, []);

  const spriteFrame = animFrame;
  const arenaH = arenaRef.current?.clientHeight ?? 80;
  const playerY = getPlayerY(arenaH);

  const padScore = (n: number) => String(n).padStart(4, "0");

  return (
    <div
      ref={arenaRef}
      tabIndex={0}
      className="relative w-1/2 h-full overflow-hidden cursor-crosshair outline-none border border-neutral-700 bg-neutral-950/30"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        arenaActiveRef.current = true;
      }}
      onMouseLeave={() => {
        arenaActiveRef.current = false;
        keysRef.current.left = false;
        keysRef.current.right = false;
      }}
      onFocus={() => {
        arenaActiveRef.current = true;
      }}
      onBlur={() => {
        arenaActiveRef.current = false;
        keysRef.current.left = false;
        keysRef.current.right = false;
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onWheel={handleWheel}
      title="マウス/タッチで移動・クリックで射撃 (←→ Space)"
      aria-label="タイトルバーインベーダーゲーム"
    >
      <div className="absolute top-0.5 left-1.5 z-10 pointer-events-none flex gap-3 font-mono text-[7px] md:text-[8px] text-cyan-400/90 tracking-wider">
        <span>SCORE {padScore(score)}</span>
        <span className="text-neutral-500">HI {padScore(hiScore)}</span>
      </div>

      <div
        className="absolute pointer-events-none"
        style={{ left: formX, top: formY, imageRendering: "pixelated" }}
      >
        {cells.map((cell) => {
          if (!cell.alive) return null;
          const left = cell.col * (SPRITE_W * PIXEL + GAP_X);
          const top = cell.row * (SPRITE_H * PIXEL + GAP_Y);
          const frame = INVADER_FRAMES[cell.type][spriteFrame];
          return (
            <div key={cell.id} className="absolute" style={{ left, top }}>
              <PixelGrid pixels={frame} w={SPRITE_W} h={SPRITE_H} />
            </div>
          );
        })}
      </div>

      {bullets.map((b) => (
        <div
          key={b.id}
          className="absolute pointer-events-none bg-yellow-300"
          style={{
            left: b.x,
            top: b.y,
            width: BULLET_W,
            height: BULLET_H,
            imageRendering: "pixelated",
            boxShadow: "0 0 4px #FFFF00",
          }}
        />
      ))}

      {ufo?.active && (
        <div
          className="absolute pointer-events-none"
          style={{ left: ufo.x, top: ufo.y, imageRendering: "pixelated" }}
        >
          <PixelGrid pixels={UFO_FRAMES[ufo.frame]} w={UFO_W} h={UFO_H} />
        </div>
      )}

      {enemyBullets.map((b) => (
        <div
          key={b.id}
          className={`absolute pointer-events-none ${b.fromUfo ? "bg-orange-400" : "bg-red-400"}`}
          style={{
            left: b.x,
            top: b.y,
            width: BULLET_W,
            height: BULLET_H,
            imageRendering: "pixelated",
            boxShadow: b.fromUfo ? "0 0 4px #FF8800" : "0 0 4px #FF4444",
          }}
        />
      ))}

      {explosions.map((ex) => (
        <div key={ex.id}>
          <ExplosionSprite x={ex.x} y={ex.y} frame={ex.frame} />
        </div>
      ))}

      {playerAlive && (
        <div
          className="absolute pointer-events-none"
          style={{ left: playerX, top: playerY, imageRendering: "pixelated" }}
        >
          <PixelGrid pixels={PLAYER_PIXELS} w={PLAYER_W} h={PLAYER_H} />
        </div>
      )}

      {stageClear && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 pointer-events-none">
          <span className="font-mono text-[11px] md:text-sm font-bold tracking-[0.45em] text-cyan-400 animate-pulse">
            CLEAR
          </span>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 pointer-events-none">
          <span className="font-mono text-[10px] md:text-xs font-bold tracking-[0.35em] text-red-500 animate-pulse">
            GAME OVER
          </span>
        </div>
      )}

    </div>
  );
}
