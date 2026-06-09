import { homageFrames, PROP_SPRITES } from "../data/homageSprites";

export interface PanelBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface BorderActSprite {
  id: string;
  pixels: string[][];
  scale: number;
  x: number;
  y: number;
  yOffset?: number;
  facingLeft: boolean;
  opacity: number;
}

type DuelPhase =
  | "march"
  | "hero_jump_slash"
  | "dragon_dodge"
  | "dragon_magic"
  | "hero_evade"
  | "clash"
  | "recover";

type LinkPhase = "patrol" | "leap";

export interface BorderActsState {
  bounds: PanelBounds;
  heroOffset: number;
  dragonOffset: number;
  duelPhase: DuelPhase;
  duelPattern: number;
  duelTimer: number;
  heroYOffset: number;
  dragonDodgePx: number;
  magicBoltT: number | null;
  duelFlash: number;
  borderPatrolT: number;
  invaderFrame: number;
  blockBump: number;
  mushroom: { life: number; rise: number } | null;
  linkPhase: LinkPhase;
  linkT: number;
  linkProgress: number;
  linkCooldown: number;
  targetFlash: number;
  slashFrame: number;
}

const BLOCK_T = 0.52;
const DUEL_SPEED = 0.0042;
const INVADER_COUNT = 5;
const INVADER_SPACING = 0.21;
const BORDER_PATROL_SPEED = 0.0055;
const LEAP_START_T = 1.34;

const DUEL_DUR: Record<Exclude<DuelPhase, "march">, number> = {
  hero_jump_slash: 28,
  dragon_dodge: 22,
  dragon_magic: 32,
  hero_evade: 26,
  clash: 18,
  recover: 20,
};

function duelPhaseDuration(phase: DuelPhase): number {
  if (phase === "march") return 0;
  return DUEL_DUR[phase];
}

function nextDuelPhase(phase: DuelPhase, pattern: number): DuelPhase {
  const p = pattern % 3;
  if (phase === "march") {
    if (p === 0) return "hero_jump_slash";
    if (p === 1) return "dragon_magic";
    return "clash";
  }
  if (p === 0) {
    if (phase === "hero_jump_slash") return "dragon_dodge";
    if (phase === "dragon_dodge") return "dragon_magic";
    if (phase === "dragon_magic") return "recover";
  } else if (p === 1) {
    if (phase === "dragon_magic") return "hero_evade";
    if (phase === "hero_evade") return "dragon_dodge";
    if (phase === "dragon_dodge") return "recover";
  } else {
    if (phase === "clash") return "hero_jump_slash";
    if (phase === "hero_jump_slash") return "dragon_magic";
    if (phase === "dragon_magic") return "recover";
  }
  return "march";
}

export function borderPoint(
  progress: number,
  bounds: PanelBounds
): { x: number; y: number; facingLeft: boolean } {
  const { left, top, right, bottom } = bounds;
  const w = right - left;
  const h = bottom - top;
  const loop = ((progress % 4) + 4) % 4;
  const edge = Math.floor(loop);
  const t = loop - edge;

  switch (edge) {
    case 0:
      return { x: left + t * w, y: top, facingLeft: false };
    case 1:
      return { x: right, y: top + t * h, facingLeft: false };
    case 2:
      return { x: right - t * w, y: bottom, facingLeft: true };
    default:
      return { x: left, y: bottom - t * h, facingLeft: true };
  }
}

function bottomEdgeLocalT(progress: number) {
  const loop = ((progress % 4) + 4) % 4;
  if (loop < 2 || loop >= 3) return null;
  return loop - 2;
}

function targetPosition(bounds: PanelBounds) {
  const w = bounds.right - bounds.left;
  return {
    x: (bounds.left + bounds.right) / 2 + w * 0.14,
    y: bounds.bottom + 40,
  };
}

function tickDuel(s: BorderActsState, dt: number) {
  if (s.duelPhase === "march") {
    s.heroOffset = Math.max(0.04, s.heroOffset - DUEL_SPEED * dt);
    s.dragonOffset = Math.max(0.04, s.dragonOffset - DUEL_SPEED * dt);
    s.heroYOffset = 0;
    s.dragonDodgePx = 0;
    s.magicBoltT = null;
    if (s.heroOffset <= 0.05 && s.dragonOffset <= 0.05) {
      s.duelPhase = nextDuelPhase("march", s.duelPattern);
      s.duelTimer = 0;
    }
    return;
  }

  s.duelTimer += dt;
  const dur = duelPhaseDuration(s.duelPhase);
  const progress = dur > 0 ? Math.min(1, s.duelTimer / dur) : 1;

  switch (s.duelPhase) {
    case "hero_jump_slash":
      s.heroYOffset = -Math.sin(progress * Math.PI) * 34;
      if (progress < 0.55) {
        s.heroOffset = Math.max(0.02, s.heroOffset - 0.0018 * dt);
      }
      break;
    case "dragon_dodge":
      s.dragonDodgePx = Math.sin(progress * Math.PI) * 48;
      s.heroYOffset = -Math.sin(Math.max(0, 1 - progress * 1.4) * Math.PI) * 12;
      break;
    case "dragon_magic":
      s.magicBoltT = progress < 0.15 ? null : (progress - 0.15) / 0.85;
      if (s.magicBoltT !== null && s.magicBoltT > 0.88) {
        s.duelFlash = Math.max(s.duelFlash, 10);
      }
      break;
    case "hero_evade":
      s.heroYOffset = -Math.sin(progress * Math.PI) * 30;
      s.heroOffset = Math.min(0.18, s.heroOffset + 0.0022 * dt);
      s.magicBoltT = progress < 0.2 ? null : Math.min(1, (progress - 0.2) / 0.65);
      if (s.magicBoltT !== null && s.magicBoltT > 0.75 && progress < 0.85) {
        s.duelFlash = Math.max(s.duelFlash, 6);
      }
      break;
    case "clash":
      s.heroYOffset = Math.sin(progress * Math.PI * 4) * -3;
      s.dragonDodgePx = Math.sin(progress * Math.PI * 4) * 4;
      break;
    case "recover":
      s.heroYOffset *= 0.82;
      s.dragonDodgePx *= 0.82;
      s.magicBoltT = null;
      s.heroOffset = 0.04 + (s.heroOffset - 0.04) * 0.92;
      s.dragonOffset = 0.04 + (s.dragonOffset - 0.04) * 0.92;
      break;
  }

  if (s.duelFlash > 0) s.duelFlash -= dt * 0.9;

  if (s.duelTimer >= dur) {
    const next = nextDuelPhase(s.duelPhase, s.duelPattern);
    if (next === "march") {
      s.duelPattern = (s.duelPattern + 1) % 3;
      s.heroOffset = 0.22;
      s.dragonOffset = 0.22;
      s.heroYOffset = 0;
      s.dragonDodgePx = 0;
      s.magicBoltT = null;
    }
    s.duelPhase = next;
    s.duelTimer = 0;
  }
}

function duelHeroFrame(phase: DuelPhase, progress: number): number {
  switch (phase) {
    case "hero_jump_slash":
      return progress < 0.45 ? 2 : 3;
    case "hero_evade":
      return 2;
    case "clash":
      return 1;
    case "dragon_magic":
      return progress > 0.7 ? 0 : 1;
    default:
      return 0;
  }
}

function duelDragonFrame(phase: DuelPhase): number {
  switch (phase) {
    case "dragon_dodge":
      return 2;
    case "dragon_magic":
      return 3;
    case "clash":
      return 1;
    case "hero_jump_slash":
      return 0;
    case "hero_evade":
      return 3;
    default:
      return 0;
  }
}

export function initBorderActs(bounds: PanelBounds): BorderActsState {
  return {
    bounds,
    heroOffset: 0.22,
    dragonOffset: 0.22,
    duelPhase: "march",
    duelPattern: 0,
    duelTimer: 0,
    heroYOffset: 0,
    dragonDodgePx: 0,
    magicBoltT: null,
    duelFlash: 0,
    borderPatrolT: 0,
    invaderFrame: 0,
    blockBump: 0,
    mushroom: null,
    linkPhase: "patrol",
    linkT: 1.08,
    linkProgress: 0,
    linkCooldown: 70,
    targetFlash: 0,
    slashFrame: 0,
  };
}

export function tickBorderActs(
  state: BorderActsState,
  dt: number,
  advanceFrame: boolean
): BorderActsState {
  const s: BorderActsState = {
    ...state,
    bounds: { ...state.bounds },
    mushroom: state.mushroom ? { ...state.mushroom } : null,
  };

  tickDuel(s, dt);

  s.borderPatrolT = (s.borderPatrolT + BORDER_PATROL_SPEED * dt) % 4;
  if (advanceFrame) s.invaderFrame = (s.invaderFrame + 1) % 2;

  for (let i = 0; i < INVADER_COUNT; i++) {
    const t = (s.borderPatrolT + i * INVADER_SPACING) % 4;
    const local = bottomEdgeLocalT(t);
    if (local === null || s.mushroom) continue;
    if (Math.abs(local - BLOCK_T) < 0.035) {
      s.mushroom = { life: 130, rise: 0 };
      s.blockBump = 10;
      break;
    }
  }

  if (s.blockBump > 0) s.blockBump -= dt * 0.85;
  if (s.mushroom) {
    s.mushroom.rise = Math.min(22, s.mushroom.rise + 0.55 * dt);
    s.mushroom.life -= dt;
    if (s.mushroom.life <= 0) s.mushroom = null;
  }

  if (s.targetFlash > 0) s.targetFlash -= dt;
  if (s.linkCooldown > 0) s.linkCooldown -= dt;

  if (s.linkPhase === "patrol") {
    s.linkT += 0.0055 * dt;
    if (s.linkT > 1.72) s.linkT = 1.08;
    if (s.linkT >= LEAP_START_T && s.linkCooldown <= 0) {
      s.linkPhase = "leap";
      s.linkProgress = 0;
    }
  } else {
    s.linkProgress += 0.026 * dt;
    if (s.linkProgress >= 1) {
      s.linkPhase = "patrol";
      s.linkT = LEAP_START_T;
      s.linkCooldown = 150;
      s.linkProgress = 0;
    }
    if (advanceFrame && s.linkProgress > 0.42 && s.linkProgress < 0.74) {
      s.slashFrame = (s.slashFrame + 1) % 2;
      if (s.linkProgress > 0.48 && s.linkProgress < 0.66) {
        s.targetFlash = Math.max(s.targetFlash, 14);
      }
    }
  }

  return s;
}

export function getBorderActSprites(state: BorderActsState): BorderActSprite[] {
  const { bounds } = state;
  const heroes = homageFrames("dqhero");
  const dragons = homageFrames("dragon");
  const invaders = homageFrames("invader");
  const links = homageFrames("link");
  const sprites: BorderActSprite[] = [];
  const edgeLift = -11;
  const w = bounds.right - bounds.left;
  const innerTop = bounds.top + 30;

  const duelDur = duelPhaseDuration(state.duelPhase);
  const duelProgress = duelDur > 0 ? Math.min(1, state.duelTimer / duelDur) : 0;
  const heroFrame = duelHeroFrame(state.duelPhase, duelProgress);
  const dragonFrame = duelDragonFrame(state.duelPhase);

  const heroX = bounds.left + w * (0.38 - state.heroOffset);
  const dragonX = bounds.left + w * (0.62 + state.dragonOffset) + state.dragonDodgePx;
  const heroFlash =
    state.duelFlash > 0 && (state.duelPhase === "dragon_magic" || state.duelPhase === "hero_evade")
      ? 0.55 + Math.sin(state.duelFlash * 1.1) * 0.45
      : 1;

  sprites.push({
    id: "act-hero",
    pixels: heroes[heroFrame % heroes.length],
    scale: 2.5,
    x: heroX,
    y: innerTop,
    yOffset: state.heroYOffset,
    facingLeft: false,
    opacity: state.duelPhase === "march" ? 0.94 : heroFlash,
  });
  sprites.push({
    id: "act-dragon",
    pixels: dragons[dragonFrame % dragons.length],
    scale: 2.5,
    x: dragonX,
    y: innerTop + (state.duelPhase === "dragon_dodge" ? -6 : 0),
    facingLeft: true,
    opacity: state.duelPhase === "march" ? 0.94 : 1,
  });

  if (state.magicBoltT !== null) {
    const boltStartX = dragonX - 18;
    const boltStartY = innerTop + 4;
    const boltEndX = heroX + 14;
    const boltEndY = innerTop + state.heroYOffset + 8;
    const t = state.magicBoltT;
    sprites.push({
      id: "act-magic-bolt",
      pixels: PROP_SPRITES.magicBolt,
      scale: 2.5,
      x: boltStartX + (boltEndX - boltStartX) * t,
      y: boltStartY + (boltEndY - boltStartY) * t - Math.sin(t * Math.PI) * 10,
      facingLeft: true,
      opacity: 0.85 + Math.sin(t * Math.PI) * 0.15,
    });
  }

  const invFrame = state.invaderFrame % invaders.length;
  for (let i = 0; i < INVADER_COUNT; i++) {
    const t = (state.borderPatrolT + i * INVADER_SPACING) % 4;
    const pos = borderPoint(t, bounds);
    sprites.push({
      id: `act-invader-${i}`,
      pixels: invaders[invFrame],
      scale: 2.5,
      x: pos.x,
      y: pos.y,
      yOffset: edgeLift,
      facingLeft: pos.facingLeft,
      opacity: 0.93,
    });
  }

  const blockPos = borderPoint(2 + BLOCK_T, bounds);
  const blockLift = state.blockBump > 0 ? -4 : 0;
  sprites.push({
    id: "act-block",
    pixels: PROP_SPRITES.questionBlock,
    scale: 2.5,
    x: blockPos.x,
    y: blockPos.y,
    yOffset: edgeLift + blockLift,
    facingLeft: false,
    opacity: 1,
  });

  if (state.mushroom) {
    const fade = Math.min(1, state.mushroom.life / 35);
    sprites.push({
      id: "act-mushroom",
      pixels: PROP_SPRITES.mushroom,
      scale: 2.5,
      x: blockPos.x,
      y: blockPos.y,
      yOffset: edgeLift - state.mushroom.rise,
      facingLeft: false,
      opacity: fade,
    });
  }

  const target = targetPosition(bounds);
  const targetOpacity =
    state.targetFlash > 0 ? 0.45 + Math.sin(state.targetFlash * 0.9) * 0.55 : 0.88;
  sprites.push({
    id: "act-target",
    pixels: PROP_SPRITES.target,
    scale: 2.5,
    x: target.x,
    y: target.y,
    facingLeft: false,
    opacity: targetOpacity,
  });

  if (state.linkPhase === "leap") {
    const start = borderPoint(LEAP_START_T, bounds);
    const end = target;
    const t = state.linkProgress;
    let x: number;
    let y: number;
    let frame = 0;
    let facingLeft = false;

    if (t < 0.44) {
      const u = t / 0.44;
      x = start.x + (end.x - start.x) * u;
      y = start.y + (end.y - start.y) * u - Math.sin(u * Math.PI) * 52;
      facingLeft = end.x < start.x;
    } else if (t < 0.74) {
      x = end.x;
      y = end.y - 10;
      frame = state.slashFrame;
      facingLeft = end.x < start.x;
    } else {
      const u = (t - 0.74) / 0.26;
      x = end.x + (start.x - end.x) * u;
      y = end.y + (start.y - end.y) * u - Math.sin(u * Math.PI) * 42;
      facingLeft = start.x < end.x;
    }

    sprites.push({
      id: "act-link",
      pixels: links[frame % links.length],
      scale: 2.5,
      x,
      y,
      facingLeft,
      opacity: 0.97,
    });
  }

  return sprites;
}
