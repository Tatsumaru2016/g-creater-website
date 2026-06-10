import {
  CHARACTER_SPRITE_ROWS,
  HOMAGE_8ROW_SCALE,
  WANDERER_SPRITE_SCALE,
} from "../constants/characterSpriteScale";
import { homageFrames, PROP_SPRITES } from "../data/homageSprites";
import { assetUrl } from "../utils/assetUrl";

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
  xOffset?: number;
  facingLeft: boolean;
  opacity: number;
  bubbleText?: string;
  bubbleTail?: "left" | "right";
  flipY?: boolean;
  /** flipY 時の固定辺（top=ライン直下に垂れる） */
  flipYAnchor?: "top" | "bottom";
  scaleY?: number;
  /** 剣など：根元固定で横方向に伸ばす（飛翔しない） */
  scaleX?: number;
  rotation?: number;
  /** 提供ドット絵PNGをそのまま表示 */
  imageSrc?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface TitleOvalAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** ボタン列の上端（リンクの移動レール） */
export interface LinkButtonRail {
  y: number;
  left: number;
  right: number;
}

export type MarioLane = "bottom" | "left" | "text";

export interface MarioTextAnchor {
  x: number;
  y: number;
}

type DuelPhase =
  | "march"
  | "hero_sword_rush"
  | "hero_jump_slash"
  | "hero_finisher"
  | "dragon_dodge"
  | "dragon_sword"
  | "clash"
  | "recover";

export interface DqDuelSpeechBand {
  hero?: string;
  maou?: string;
}

export interface DqDuelSpeechPhase {
  p0: DqDuelSpeechBand;
  p1?: DqDuelSpeechBand;
  p2?: DqDuelSpeechBand;
}

export interface DqDuelSpeechDict {
  heroSwordRush: DqDuelSpeechPhase;
  heroJumpSlash: DqDuelSpeechPhase;
  dragonDodge: DqDuelSpeechPhase;
  dragonSword: DqDuelSpeechPhase;
  heroFinisher: DqDuelSpeechPhase;
  clash: DqDuelSpeechPhase;
  recover: DqDuelSpeechBand;
}

export type DqDuelSpeechResolver = (
  phase: DuelPhase,
  progress: number
) => { hero?: string; maou?: string };

let dqDuelSpeechResolver: DqDuelSpeechResolver | null = null;

export function setDqDuelSpeechResolver(resolver: DqDuelSpeechResolver | null): void {
  dqDuelSpeechResolver = resolver;
}

function bandAtProgress(
  phase: DqDuelSpeechPhase | DqDuelSpeechBand,
  progress: number,
  thresholds: [number, number]
): DqDuelSpeechBand {
  if (!("p0" in phase)) return phase;
  if (progress < thresholds[0]) return phase.p0;
  if (phase.p1 && progress < thresholds[1]) return phase.p1;
  return phase.p2 ?? phase.p1 ?? phase.p0;
}

export function buildDqDuelSpeechResolver(speech: DqDuelSpeechDict): DqDuelSpeechResolver {
  return (phase, progress) => {
    switch (phase) {
      case "hero_sword_rush":
        return bandAtProgress(speech.heroSwordRush, progress, [0.3, 0.6]);
      case "hero_jump_slash":
        return bandAtProgress(speech.heroJumpSlash, progress, [0.3, 0.65]);
      case "dragon_dodge":
        return bandAtProgress(speech.dragonDodge, progress, [0.45, 1]);
      case "dragon_sword":
        return bandAtProgress(speech.dragonSword, progress, [0.3, 0.65]);
      case "hero_finisher":
        return bandAtProgress(speech.heroFinisher, progress, [0.4, 1]);
      case "clash":
        return bandAtProgress(speech.clash, progress, [0.45, 1]);
      case "recover":
        return speech.recover;
      default:
        return {};
    }
  };
}

/** 0=上 1=右 2=下 3=左 — パネル枠のいずれかの辺 */
export type DuelEdge = 0 | 1 | 2 | 3;

const DUEL_EDGE_ROTATION: Record<DuelEdge, number> = {
  0: 0,
  1: 90,
  2: 180,
  3: -90,
};

type LinkPhase = "patrol" | "leap";
type MarioPhase = "approach" | "jump" | "leave";

export interface BorderActsState {
  bounds: PanelBounds;
  heroOffset: number;
  dragonOffset: number;
  duelPhase: DuelPhase;
  duelPattern: number;
  duelTimer: number;
  heroYOffset: number;
  dragonDodgePx: number;
  dragonSlashT: number | null;
  heroSlashT: number | null;
  dragonHitFlash: number;
  duelFlash: number;
  blockBump: number;
  mushroom: { life: number; rise: number } | null;
  marioT: number;
  goombaT: number;
  marioDir: 1 | -1;
  marioPhase: MarioPhase;
  marioJumpProg: number;
  runnerHop: number;
  linkPhase: LinkPhase;
  /** 0〜1：ボタンレール上の水平位置（レールなし時は右辺パトロール） */
  linkPatrolU: number;
  linkPatrolDir: 1 | -1;
  linkProgress: number;
  linkCooldown: number;
  linkTargetX: number | null;
  linkTargetY: number | null;
  linkLeapStartX: number;
  linkLeapStartY: number;
  linkButtonRail: LinkButtonRail | null;
  linkWalkFrame: number;
  slashFrame: number;
  /** 上辺を剣で突進する追加オフセット */
  heroRushT: number;
  /** 被弾で上辺に沿ってわずかに跳ねる（px・上方向） */
  heroKnockUp: number;
  dragonKnockUp: number;
  /** 被弾で中央からわずか後退（上辺パラメータ） */
  heroHitRetreat: number;
  dragonHitRetreat: number;
  /** 上辺は決闘専用。マリオは下辺→左辺→見出し上の順で配置 */
  marioLane: MarioLane;
  marioTextAnchor: MarioTextAnchor | null;
  /** ヘッダー枠下端（シーン座標・UFO等の基準ライン） */
  titleFrameBottom: number;
  /** シーン全体の幅 */
  sceneWidth: number;
  titleOvalAnchor: TitleOvalAnchor | null;
  /** 勇者 vs 魔王の決闘が走る枠の辺 */
  duelEdge: DuelEdge;
}

/** 8-row props (? block, mushroom) — same 35px height as 14-row wanderers */
const PROP_SCALE = HOMAGE_8ROW_SCALE;
const RUNNER_SCALE = WANDERER_SPRITE_SCALE;
const RUNNER_ROWS = CHARACTER_SPRITE_ROWS;
const RUNNER_PX = RUNNER_SCALE * RUNNER_ROWS;
/** マリオ頭頂と?ブロック底面のすき間（px） */
const BLOCK_GAP_ABOVE_MARIO = 4;
const MARIO_JUMP_HEIGHT = RUNNER_PX + BLOCK_GAP_ABOVE_MARIO + 6;
const HERO_LEAP_HEIGHT = 52;
const HERO_LEAP_RUSH = 0.22;
/** 中央決闘の固定オフセット（端へ戻らない） */
const DUEL_CENTER_OFFSET = 0.22;
/** 上辺スナップからの反動（上方向px・枠外へはみ出さない） */
const DUEL_HIT_KNOCK_UP_MAX = 7;
const DUEL_HIT_RETREAT_MAX = 0.05;
/** @deprecated linkPatrolU ベースの LEAP_START_U を使用 */
export const LEAP_START_T = 1.34;
export const LEAP_START_U = 0.85;
const LINK_SCALE = WANDERER_SPRITE_SCALE;
const LINK_ROWS = CHARACTER_SPRITE_ROWS;
/** ボタン上端に足元を合わせる */
const LINK_PLATFORM_SNAP = -(LINK_SCALE * LINK_ROWS) / 2;
const DUEL_SCALE = WANDERER_SPRITE_SCALE;
const DUEL_SPRITE_ROWS = CHARACTER_SPRITE_ROWS;
/** 枠線の外側へ足元を何 px 出す（パネル内にはみ出さない） */
const DUEL_FEET_OUTSIDE = 3;
/** 足元より下の透明行ぶん、さらに枠外へ押し出す（行数）— 14行スプライト基準 */
const DUEL_SPRITE_PAD_ROWS = 0;
/** 上辺の外枠に足元をぴったり合わせる */
const TOP_EDGE_SNAP = -(DUEL_SCALE * DUEL_SPRITE_ROWS) / 2;
const DUEL_EDGE_SPAN = 0.22;
const DUEL_EDGE_MIN = 0.02;
const HERO_EDGE_LEAD = 0.02;
const DRAGON_EDGE_LEAD = 0.98;
const DUEL_INWARD_SPAN = 0.38;
const MARIO_TEXT_RUN_SPAN = 120;
/** 枠線のすぐ上（内側）に足元をぴったり合わせる（+で下へ） */
const MARIO_BORDER_SNAP = -RUNNER_PX / 2 + 3;
/** 左辺は枠のすぐ右（内側）に配置 */
const MARIO_LEFT_INSET = RUNNER_PX / 2;
const TITLE_LOGO_SRC = assetUrl("logo.png");
const TITLE_LOGO_W = 38;
const TITLE_LOGO_H = 41;
/** 透過PNGを原寸のまま表示 */
const TITLE_LOGO_SCALE = 1;

function getMarioRange(lane: MarioLane): { min: number; max: number; block: number } {
  switch (lane) {
    case "left":
      return { min: 3.12, max: 3.88, block: 3.5 };
    case "text":
      return { min: 0.08, max: 0.92, block: 0.5 };
    default:
      return { min: 2.12, max: 2.88, block: 2.5 };
  }
}

/** 上辺=決闘・右辺=リンクのため、マリオは下辺→左辺→見出し上を割り当て */
export function resolveMarioLane(
  bounds: PanelBounds,
  hasTextHeading: boolean
): MarioLane {
  const w = bounds.right - bounds.left;
  const h = bounds.bottom - bounds.top;
  if (w >= 150) return "bottom";
  if (h >= 110) return "left";
  if (hasTextHeading) return "text";
  return "bottom";
}

export function syncTitleFrameBottom(
  state: BorderActsState,
  bottomY: number,
  sceneWidth: number
): BorderActsState {
  return { ...state, titleFrameBottom: bottomY, sceneWidth };
}

export function syncTitleOvalAnchor(
  state: BorderActsState,
  anchor: TitleOvalAnchor | null
): BorderActsState {
  return { ...state, titleOvalAnchor: anchor };
}

export function syncMarioLane(
  state: BorderActsState,
  bounds: PanelBounds,
  textAnchor: MarioTextAnchor | null
): BorderActsState {
  const lane = resolveMarioLane(bounds, textAnchor !== null);
  if (lane === state.marioLane) {
    return {
      ...state,
      bounds,
      marioTextAnchor: lane === "text" ? textAnchor : null,
    };
  }
  const { min } = getMarioRange(lane);
  return {
    ...state,
    bounds,
    marioLane: lane,
    marioTextAnchor: lane === "text" ? textAnchor : null,
    marioT: min,
    goombaT: min - 0.06,
    marioDir: 1,
    marioPhase: "approach",
    marioJumpProg: 0,
    mushroom: null,
    blockBump: 0,
  };
}

const DUEL_DUR: Record<Exclude<DuelPhase, "march">, number> = {
  hero_sword_rush: 62,
  hero_jump_slash: 76,
  hero_finisher: 54,
  dragon_dodge: 44,
  dragon_sword: 72,
  clash: 42,
  recover: 40,
};

function duelPhaseDuration(phase: DuelPhase): number {
  if (phase === "march") return 0;
  return DUEL_DUR[phase];
}

function nextDuelPhase(phase: DuelPhase, pattern: number): DuelPhase {
  const p = pattern % 3;
  if (phase === "recover") return "hero_sword_rush";
  if (p === 0) {
    if (phase === "hero_sword_rush") return "hero_jump_slash";
    if (phase === "hero_jump_slash") return "dragon_dodge";
    if (phase === "dragon_dodge") return "hero_finisher";
    if (phase === "hero_finisher") return "recover";
  } else if (p === 1) {
    if (phase === "hero_sword_rush") return "hero_jump_slash";
    if (phase === "hero_jump_slash") return "dragon_sword";
    if (phase === "dragon_sword") return "hero_finisher";
    if (phase === "hero_finisher") return "recover";
  } else {
    if (phase === "hero_sword_rush") return "clash";
    if (phase === "clash") return "hero_jump_slash";
    if (phase === "hero_jump_slash") return "hero_finisher";
    if (phase === "hero_finisher") return "recover";
  }
  return "hero_sword_rush";
}

function applyDragonHit(s: BorderActsState, knockUp: number, retreat = 0.011) {
  s.dragonKnockUp = Math.min(DUEL_HIT_KNOCK_UP_MAX, s.dragonKnockUp + knockUp);
  s.dragonHitRetreat = Math.min(DUEL_HIT_RETREAT_MAX, s.dragonHitRetreat + retreat);
}

function applyHeroHit(s: BorderActsState, knockUp: number, retreat = 0.011) {
  s.heroKnockUp = Math.min(DUEL_HIT_KNOCK_UP_MAX, s.heroKnockUp + knockUp);
  s.heroHitRetreat = Math.min(DUEL_HIT_RETREAT_MAX, s.heroHitRetreat + retreat);
}

function decayDuelHits(s: BorderActsState, dt: number) {
  s.heroKnockUp = Math.max(0, s.heroKnockUp - 0.32 * dt);
  s.dragonKnockUp = Math.max(0, s.dragonKnockUp - 0.32 * dt);
  s.heroHitRetreat = Math.max(0, s.heroHitRetreat - 0.0014 * dt);
  s.dragonHitRetreat = Math.max(0, s.dragonHitRetreat - 0.0014 * dt);
}

function duelTopEdgeYOffset(snap: number, knockUp: number, animOffset: number): number {
  return snap - knockUp + animOffset;
}

function borderPointOnEdge(edge: DuelEdge, u: number, bounds: PanelBounds) {
  return borderPoint(edge + u, bounds);
}

function duelAlongEdgeT(state: BorderActsState): { heroU: number; dragonU: number } {
  return {
    heroU: HERO_EDGE_LEAD + DUEL_INWARD_SPAN + state.heroRushT - state.heroHitRetreat,
    dragonU: DRAGON_EDGE_LEAD - DUEL_INWARD_SPAN + state.dragonHitRetreat,
  };
}

function applyDodgeAlongEdge(
  edge: DuelEdge,
  x: number,
  y: number,
  dodgePx: number
): { x: number; y: number } {
  switch (edge) {
    case 0:
      return { x: x + dodgePx, y };
    case 1:
      return { x, y: y + dodgePx };
    case 2:
      return { x: x - dodgePx, y };
    default:
      return { x, y: y - dodgePx };
  }
}

function duelSpriteHalf(scale: number): number {
  return (scale * DUEL_SPRITE_ROWS) / 2;
}

function duelBorderOutset(scale: number): number {
  return DUEL_FEET_OUTSIDE + scale * DUEL_SPRITE_PAD_ROWS;
}

/** 枠線の外側に足元を揃え、アニメでパネル内へ入らない */
function duelSnapOffset(
  edge: DuelEdge,
  knockUp: number,
  animOffset: number,
  scale: number
): { xOffset: number; yOffset: number } {
  const half = duelSpriteHalf(scale);
  const out = duelBorderOutset(scale);
  const knock = Math.max(0, knockUp);

  switch (edge) {
    case 0:
      return {
        xOffset: 0,
        yOffset: -half - out - knock + Math.min(0, animOffset),
      };
    case 1:
      return {
        xOffset: half + out + knock + Math.max(0, animOffset),
        yOffset: Math.min(0, animOffset),
      };
    case 2:
      return {
        xOffset: 0,
        yOffset: half + out + knock - Math.min(0, animOffset),
      };
    default:
      return {
        xOffset: -half - out - knock + Math.min(0, animOffset),
        yOffset: Math.min(0, animOffset),
      };
  }
}

function faceToward(
  from: { x: number; y: number },
  to: { x: number; y: number },
  edge: DuelEdge
): boolean {
  if (edge === 0 || edge === 2) return to.x < from.x;
  return to.y < from.y;
}

function bubbleOutset(edge: DuelEdge, dist: number): { dx: number; dy: number } {
  switch (edge) {
    case 0:
      return { dx: 0, dy: -dist };
    case 1:
      return { dx: -dist, dy: 0 };
    case 2:
      return { dx: 0, dy: dist };
    default:
      return { dx: dist, dy: 0 };
  }
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

function hasLinkButtonRail(rail: LinkButtonRail | null): rail is LinkButtonRail {
  return rail != null && rail.right > rail.left + 12;
}

function linkLeapStartU(state: BorderActsState): number {
  return hasLinkButtonRail(state.linkButtonRail) ? LEAP_START_U : 0.406;
}

export function linkPatrolPoint(state: BorderActsState): {
  x: number;
  y: number;
  yOffset: number;
  facingLeft: boolean;
} {
  const rail = state.linkButtonRail;
  if (hasLinkButtonRail(rail)) {
    const x = rail.left + state.linkPatrolU * (rail.right - rail.left);
    return {
      x,
      y: rail.y,
      yOffset: LINK_PLATFORM_SNAP,
      facingLeft: state.linkPatrolDir < 0,
    };
  }

  const t = 1.08 + state.linkPatrolU * 0.64;
  const pt = borderPoint(t, state.bounds);
  return {
    x: pt.x,
    y: pt.y,
    yOffset: LINK_PLATFORM_SNAP,
    facingLeft: pt.facingLeft,
  };
}

export function getLinkLeapAnchor(state: BorderActsState): { x: number; y: number } {
  const saved = { ...state, linkPatrolU: linkLeapStartU(state) };
  const pt = linkPatrolPoint(saved);
  return { x: pt.x, y: pt.y + pt.yOffset };
}

export function syncLinkButtonRail(
  state: BorderActsState,
  rail: LinkButtonRail | null
): BorderActsState {
  const hadRail = hasLinkButtonRail(state.linkButtonRail);
  const hasRail = hasLinkButtonRail(rail);
  if (!hadRail && hasRail) {
    return { ...state, linkButtonRail: rail, linkPatrolU: 0.05, linkPatrolDir: 1 };
  }
  return { ...state, linkButtonRail: rail };
}

function topEdgePoint(localT: number, bounds: PanelBounds) {
  return borderPoint(localT, bounds);
}

function marioActorPlacement(
  state: BorderActsState,
  t: number,
  verticalJump: number,
  horizontalJump: number
): { x: number; y: number; yOffset: number; xOffset: number } {
  const lane = state.marioLane;
  const textAnchor = state.marioTextAnchor;

  if (lane === "text" && textAnchor) {
    const { min, max } = getMarioRange("text");
    const u = (t - min) / Math.max(0.001, max - min);
    const bottomY = borderPoint(2.5, state.bounds).y;
    return {
      x: textAnchor.x - MARIO_TEXT_RUN_SPAN / 2 + u * MARIO_TEXT_RUN_SPAN,
      y: bottomY,
      yOffset: MARIO_BORDER_SNAP + verticalJump,
      xOffset: horizontalJump,
    };
  }

  const pt = borderPoint(t, state.bounds);
  if (lane === "left") {
    return {
      x: pt.x,
      y: pt.y,
      yOffset: MARIO_BORDER_SNAP + verticalJump * 0.5,
      xOffset: MARIO_LEFT_INSET + horizontalJump,
    };
  }

  return {
    x: pt.x,
    y: pt.y,
    yOffset: MARIO_BORDER_SNAP + verticalJump,
    xOffset: horizontalJump,
  };
}

/** 上辺中央で決闘（端へ戻らず、被弾時のみわずか後退） */
function duelTopEdgeT(state: BorderActsState): { heroT: number; dragonT: number } {
  return {
    heroT: HERO_EDGE_LEAD + DUEL_INWARD_SPAN + state.heroRushT - state.heroHitRetreat,
    dragonT: DRAGON_EDGE_LEAD - DUEL_INWARD_SPAN + state.dragonHitRetreat,
  };
}

function tickMarioRunners(s: BorderActsState, dt: number) {
  const { min, max, block } = getMarioRange(s.marioLane);
  s.runnerHop += 0.2 * dt;
  const runSpeed = 0.0048 * dt;

  switch (s.marioPhase) {
    case "approach":
      s.marioDir = 1;
      s.marioT = Math.min(block, s.marioT + runSpeed);
      if (s.marioT >= block - 0.001) {
        s.marioT = block;
        s.marioPhase = "jump";
        s.marioJumpProg = 0;
      }
      break;
    case "jump":
      s.marioT = block;
      s.marioJumpProg = Math.min(1, s.marioJumpProg + 0.032 * dt);
      if (s.marioJumpProg > 0.38 && s.marioJumpProg < 0.58 && !s.mushroom) {
        s.mushroom = { life: 140, rise: 0 };
        s.blockBump = 14;
      }
      if (s.marioJumpProg >= 1) {
        s.marioPhase = "leave";
        s.marioJumpProg = 0;
      }
      break;
    case "leave":
      s.marioDir = 1;
      s.marioT = Math.min(max, s.marioT + runSpeed);
      if (s.marioT >= max - 0.001) {
        s.marioT = min;
        s.marioPhase = "approach";
        s.mushroom = null;
      }
      break;
  }

  const lag = 0.12;
  s.goombaT = s.marioT - lag * s.marioDir;
  if (s.goombaT < min) s.goombaT = min;
  if (s.goombaT > max) s.goombaT = max;
}

interface LinkLeapPose {
  x: number;
  y: number;
  yOffset?: number;
  frame: number;
  facingLeft: boolean;
  inSlashWindow: boolean;
  swordExtendT: number;
}

function linkLeapEnd(state: BorderActsState): { x: number; y: number } | null {
  if (state.linkTargetX == null || state.linkTargetY == null) return null;
  return { x: state.linkTargetX, y: state.linkTargetY };
}

function computeLinkPatrolPose(state: BorderActsState): LinkLeapPose | null {
  if (state.linkPhase !== "patrol") return null;
  const pt = linkPatrolPoint(state);
  return {
    x: pt.x,
    y: pt.y,
    yOffset: pt.yOffset,
    frame: state.linkWalkFrame % 2,
    facingLeft: pt.facingLeft,
    inSlashWindow: false,
    swordExtendT: 0,
  };
}

function linkDownSwordExtend(t: number): number {
  const wave = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
  return 0.2 + wave * 0.78;
}

function computeLinkLeapPose(state: BorderActsState): LinkLeapPose | null {
  const end = linkLeapEnd(state);
  if (!end || state.linkPhase !== "leap") return null;

  const start = { x: state.linkLeapStartX, y: state.linkLeapStartY };
  const t = state.linkProgress;
  let x: number;
  let y: number;
  let yOffset = 0;
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
    frame = 0;
    facingLeft = end.x < start.x;
  } else {
    const u = (t - 0.74) / 0.26;
    x = end.x + (start.x - end.x) * u;
    y = end.y + (start.y - end.y) * u - Math.sin(u * Math.PI) * 42;
    y = Math.min(y, start.y);
    facingLeft = start.x < end.x;
  }

  return {
    x,
    y,
    yOffset,
    frame,
    facingLeft,
    inSlashWindow: t > 0.48 && t < 0.66,
    swordExtendT: t >= 0.42 && t < 0.74 ? (t - 0.42) / 0.32 : 0,
  };
}

export function getLinkWorldPos(
  state: BorderActsState
): { x: number; y: number; inSlashWindow: boolean } | null {
  const pose = computeLinkLeapPose(state);
  if (!pose) return null;
  return { x: pose.x, y: pose.y, inSlashWindow: pose.inSlashWindow };
}

function tickDuel(s: BorderActsState, dt: number) {
  decayDuelHits(s, dt);
  s.heroOffset = DUEL_CENTER_OFFSET;
  s.dragonOffset = DUEL_CENTER_OFFSET;

  s.duelTimer += dt;
  const dur = duelPhaseDuration(s.duelPhase);
  const progress = dur > 0 ? Math.min(1, s.duelTimer / dur) : 1;

  s.heroSlashT = null;
  s.dragonSlashT = null;

  switch (s.duelPhase) {
    case "hero_sword_rush":
      s.heroRushT = Math.min(0.16, progress * 0.18);
      s.heroYOffset = Math.sin(progress * Math.PI * 3) * -3;
      if (progress > 0.22 && progress < 0.38) {
        const hit = Math.sin(((progress - 0.22) / 0.16) * Math.PI);
        s.heroSlashT = (progress - 0.22) / 0.16;
        applyDragonHit(s, hit * 4.5, hit * 0.009);
        s.dragonHitFlash = Math.max(s.dragonHitFlash, 11);
        s.duelFlash = Math.max(s.duelFlash, 10);
      } else if (progress > 0.58 && progress < 0.76) {
        const hit = Math.sin(((progress - 0.58) / 0.18) * Math.PI);
        s.heroSlashT = (progress - 0.58) / 0.18;
        applyDragonHit(s, hit * 6, hit * 0.012);
        s.dragonHitFlash = Math.max(s.dragonHitFlash, 14);
        s.duelFlash = Math.max(s.duelFlash, 12);
      } else {
        s.dragonDodgePx *= 0.9;
      }
      break;
    case "hero_jump_slash": {
      if (progress < 0.28) {
        const wind = progress / 0.28;
        s.heroYOffset = Math.sin(wind * Math.PI) * 6;
        s.heroRushT = wind * 0.022;
      } else if (progress < 0.82) {
        const leap = (progress - 0.28) / 0.54;
        s.heroYOffset = -Math.sin(leap * Math.PI) * HERO_LEAP_HEIGHT;
        s.heroRushT = Math.min(HERO_LEAP_RUSH, 0.02 + leap * HERO_LEAP_RUSH);
        if (leap > 0.38 && leap < 0.78) {
          const hit = (leap - 0.38) / 0.4;
          s.heroSlashT = hit;
          const knock = Math.sin(hit * Math.PI);
          applyDragonHit(s, knock * 7, knock * 0.014);
          s.dragonHitFlash = Math.max(s.dragonHitFlash, 20);
          s.duelFlash = Math.max(s.duelFlash, 16);
        }
      } else {
        const land = (progress - 0.82) / 0.18;
        s.heroYOffset = -Math.sin((1 - land) * Math.PI) * 18;
        s.heroRushT = HERO_LEAP_RUSH * (1 - land * 0.35);
      }
      break;
    }
    case "hero_finisher":
      s.heroRushT = Math.min(0.16, 0.08 + progress * 0.12);
      s.heroYOffset = -Math.sin(progress * Math.PI) * 12;
      s.heroSlashT = progress < 0.72 ? progress / 0.72 : null;
      if (progress > 0.2) {
        const hit = Math.min(1, (progress - 0.2) / 0.55);
        applyDragonHit(s, hit * 0.35, hit * 0.0008);
      }
      if (progress > 0.28 && progress < 0.58) {
        s.dragonHitFlash = Math.max(s.dragonHitFlash, 18);
        s.duelFlash = Math.max(s.duelFlash, 15);
      }
      break;
    case "dragon_dodge":
      s.dragonDodgePx = 14 + Math.sin(progress * Math.PI) * 22;
      s.heroYOffset = -Math.sin(Math.max(0, 1 - progress * 1.2) * Math.PI) * 14;
      if (progress < 0.35) {
        s.heroRushT = Math.min(0.14, progress * 0.2);
      }
      break;
    case "dragon_sword":
      s.heroYOffset =
        progress > 0.48 ? -Math.sin(((progress - 0.48) / 0.52) * Math.PI) * 20 : 0;
      s.dragonSlashT = progress < 0.32 ? null : Math.min(1, (progress - 0.32) / 0.48);
      if (s.dragonSlashT !== null && s.dragonSlashT > 0.76 && s.dragonSlashT < 0.9) {
        applyHeroHit(s, 0.5 * dt, 0.00085 * dt);
        s.duelFlash = Math.max(s.duelFlash, 6);
      }
      break;
    case "clash":
      s.heroRushT = Math.min(0.14, progress * 0.16);
      s.heroYOffset = Math.sin(progress * Math.PI * 4) * -5;
      if (progress > 0.2) {
        const hit = (progress - 0.2) / 0.8;
        s.heroSlashT = hit;
        applyDragonHit(s, Math.sin(hit * Math.PI) * 3.5, Math.sin(hit * Math.PI) * 0.008);
        s.dragonHitFlash = Math.max(s.dragonHitFlash, 12);
      }
      break;
    case "recover":
      s.heroYOffset *= 0.84;
      s.heroRushT *= 0.84;
      s.dragonDodgePx *= 0.8;
      s.dragonSlashT = null;
      s.heroSlashT = null;
      break;
  }

  if (s.duelFlash > 0) s.duelFlash -= dt * 0.65;
  if (s.dragonHitFlash > 0) s.dragonHitFlash -= dt * 0.8;

  if (s.duelTimer >= dur) {
    const next = nextDuelPhase(s.duelPhase, s.duelPattern);
    if (s.duelPhase === "recover") {
      s.duelPattern = (s.duelPattern + 1) % 3;
      s.heroYOffset = 0;
      s.heroRushT = 0;
      s.dragonDodgePx = 0;
      s.dragonSlashT = null;
      s.heroSlashT = null;
      s.dragonHitFlash = 0;
    }
    s.duelPhase = next;
    s.duelTimer = 0;
  }
}

function duelHeroFrame(phase: DuelPhase, progress: number, state: BorderActsState): number {
  switch (phase) {
    case "march":
      return state.heroOffset < DUEL_EDGE_SPAN * 0.55 ? 1 : 0;
    case "hero_sword_rush":
      if (progress < 0.22) return 1;
      if (progress < 0.48) return 3;
      if (progress < 0.58) return 1;
      if (progress < 0.82) return 3;
      return 1;
    case "hero_jump_slash":
      if (progress < 0.26) return 1;
      if (progress < 0.58) return 2;
      return 3;
    case "hero_finisher":
      return 3;
    case "clash":
      return progress > 0.35 ? 3 : 1;
    case "dragon_sword":
      return progress > 0.52 ? 2 : progress > 0.28 ? 1 : 0;
    default:
      return 0;
  }
}

function duelMaouFrame(phase: DuelPhase, progress: number): number {
  switch (phase) {
    case "hero_sword_rush":
      return progress > 0.2 ? 1 : 0;
    case "hero_jump_slash":
      return progress > 0.45 && progress < 0.88 ? 2 : progress > 0.35 ? 1 : 0;
    case "hero_finisher":
      return progress > 0.3 ? 2 : 1;
    case "dragon_dodge":
      return 2;
    case "dragon_sword":
      return progress < 0.28 ? 1 : 3;
    case "clash":
      return progress > 0.4 ? 2 : 1;
    default:
      return 0;
  }
}

export function initBorderActs(bounds: PanelBounds): BorderActsState {
  return {
    bounds,
    heroOffset: DUEL_CENTER_OFFSET,
    dragonOffset: DUEL_CENTER_OFFSET,
    duelPhase: "hero_sword_rush",
    duelPattern: 0,
    duelTimer: 0,
    heroYOffset: 0,
    dragonDodgePx: 0,
    dragonSlashT: null,
    heroSlashT: null,
    dragonHitFlash: 0,
    duelFlash: 0,
    blockBump: 0,
    mushroom: null,
    marioT: getMarioRange("bottom").min,
    goombaT: getMarioRange("bottom").min - 0.06,
    marioLane: "bottom",
    marioTextAnchor: null,
    marioDir: 1,
    marioPhase: "approach",
    marioJumpProg: 0,
    runnerHop: 0,
    linkPhase: "patrol",
    linkPatrolU: 0.05,
    linkPatrolDir: 1,
    linkProgress: 0,
    linkCooldown: 70,
    linkTargetX: null,
    linkTargetY: null,
    linkLeapStartX: 0,
    linkLeapStartY: 0,
    linkButtonRail: null,
    linkWalkFrame: 0,
    slashFrame: 0,
    heroRushT: 0,
    heroKnockUp: 0,
    dragonKnockUp: 0,
    heroHitRetreat: 0,
    dragonHitRetreat: 0,
    titleFrameBottom: bounds.top + 12,
    sceneWidth: 0,
    titleOvalAnchor: null,
    duelEdge: 0,
  };
}

export function initDuelActs(bounds: PanelBounds, edge: DuelEdge = 0): BorderActsState {
  return { ...initBorderActs(bounds), duelEdge: edge };
}

export function tickDuelActs(state: BorderActsState, dt: number): BorderActsState {
  const s: BorderActsState = { ...state, bounds: { ...state.bounds } };
  tickDuel(s, dt);
  return s;
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
  tickMarioRunners(s, dt);

  if (s.blockBump > 0) s.blockBump -= dt * 0.85;
  if (s.mushroom) {
    s.mushroom.rise = Math.min(22, s.mushroom.rise + 0.55 * dt);
    s.mushroom.life -= dt;
    if (s.mushroom.life <= 0) s.mushroom = null;
  }

  if (s.linkCooldown > 0) s.linkCooldown -= dt;

  if (s.linkPhase === "patrol") {
    if (hasLinkButtonRail(s.linkButtonRail)) {
      s.linkPatrolU += 0.0036 * dt * s.linkPatrolDir;
      if (s.linkPatrolU <= 0) {
        s.linkPatrolU = 0;
        s.linkPatrolDir = 1;
      } else if (s.linkPatrolU >= 1) {
        s.linkPatrolU = 1;
        s.linkPatrolDir = -1;
      }
      if (advanceFrame) s.linkWalkFrame = (s.linkWalkFrame + 1) % 2;
    } else {
      s.linkPatrolU += 0.0055 * dt * 0.125;
      if (s.linkPatrolU > 1) s.linkPatrolU = 0;
      if (advanceFrame) s.linkWalkFrame = (s.linkWalkFrame + 1) % 2;
    }

    const leapU = linkLeapStartU(s);
    const readyToLeap = hasLinkButtonRail(s.linkButtonRail)
      ? s.linkPatrolU >= leapU && s.linkPatrolDir > 0
      : s.linkPatrolU >= leapU;

    if (
      readyToLeap &&
      s.linkCooldown <= 0 &&
      s.linkTargetX != null &&
      s.linkTargetY != null
    ) {
      const pt = linkPatrolPoint(s);
      s.linkLeapStartX = pt.x;
      s.linkLeapStartY = pt.y + pt.yOffset;
      s.linkPhase = "leap";
      s.linkProgress = 0;
    }
  } else {
    s.linkProgress += 0.026 * dt;
    if (s.linkProgress >= 1) {
      s.linkPhase = "patrol";
      s.linkPatrolU = linkLeapStartU(s);
      s.linkPatrolDir = 1;
      s.linkCooldown = 150;
      s.linkProgress = 0;
      s.linkTargetX = null;
      s.linkTargetY = null;
    }
    if (advanceFrame && s.linkProgress > 0.42 && s.linkProgress < 0.74) {
      s.slashFrame = (s.slashFrame + 1) % 2;
    }
  }

  return s;
}

function duelSpeech(
  phase: DuelPhase,
  progress: number
): { hero?: string; maou?: string } {
  if (dqDuelSpeechResolver) {
    return dqDuelSpeechResolver(phase, progress);
  }
  return {};
}

/** 剣の伸び量（0〜1の進行 → 根元から少し伸びて戻る） */
function duelSwordExtend(t: number): number {
  const wave = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
  return 0.16 + wave * 0.42;
}

function pushAttachedSword(
  sprites: BorderActSprite[],
  id: string,
  anchorX: number,
  anchorY: number,
  extendT: number,
  facingLeft: boolean
) {
  const wave = Math.sin(Math.min(1, Math.max(0, extendT)) * Math.PI);
  sprites.push({
    id,
    pixels: PROP_SPRITES.swordStick,
    scale: DUEL_SCALE * 0.9,
    x: anchorX,
    y: anchorY,
    facingLeft,
    opacity: 0.88 + wave * 0.12,
    scaleX: duelSwordExtend(extendT),
  });
}

function pushLinkDownSword(
  sprites: BorderActSprite[],
  anchorX: number,
  anchorY: number,
  extendT: number
) {
  if (extendT <= 0) return;
  const wave = Math.sin(Math.min(1, Math.max(0, extendT)) * Math.PI);
  sprites.push({
    id: "act-link-slash",
    pixels: PROP_SPRITES.swordStick,
    scale: LINK_SCALE * 0.88,
    x: anchorX,
    y: anchorY + LINK_SCALE * 1.6,
    yOffset: 0,
    facingLeft: false,
    rotation: 90,
    scaleX: linkDownSwordExtend(extendT),
    opacity: 0.9 + wave * 0.08,
  });
}

function pushDuelBubble(
  sprites: BorderActSprite[],
  id: string,
  text: string,
  x: number,
  y: number,
  yOffset: number,
  tail: "left" | "right"
) {
  sprites.push({
    id,
    pixels: [],
    scale: 1,
    x,
    y,
    yOffset,
    facingLeft: false,
    opacity: 1,
    bubbleText: text,
    bubbleTail: tail,
  });
}

/** 勇者 vs 魔王（変身前）— パネル枠の指定辺で決闘 */
export function getDuelActSprites(state: BorderActsState): BorderActSprite[] {
  const { bounds } = state;
  const edge = state.duelEdge ?? 0;
  const heroes = homageFrames("dqhero");
  const maous = homageFrames("maou");
  const sprites: BorderActSprite[] = [];

  const duelDur = duelPhaseDuration(state.duelPhase);
  const duelProgress = duelDur > 0 ? Math.min(1, state.duelTimer / duelDur) : 0;
  const heroFrame = duelHeroFrame(state.duelPhase, duelProgress, state);
  const maouFrame = duelMaouFrame(state.duelPhase, duelProgress);

  const { heroU, dragonU } = duelAlongEdgeT(state);
  const heroPos = borderPointOnEdge(edge, heroU, bounds);
  const dragonBase = borderPointOnEdge(edge, dragonU, bounds);
  const dodged = applyDodgeAlongEdge(
    edge,
    dragonBase.x,
    dragonBase.y,
    state.dragonDodgePx
  );
  const maouX = dodged.x;
  const maouY = dodged.y;

  const heroFlash =
    state.duelFlash > 0 && state.duelPhase === "dragon_sword"
      ? 0.72 + Math.sin(state.duelFlash * 1.1) * 0.28
      : 1;
  const maouFlash =
    state.dragonHitFlash > 0
      ? 0.4 + Math.sin(state.dragonHitFlash * 1.35) * 0.6
      : 1;
  const snapHeroToBorder =
    state.duelPhase === "hero_sword_rush" || state.duelPhase === "recover";
  const maouAnimOffset = state.duelPhase === "dragon_dodge" ? -6 : 0;

  const heroSnap = duelSnapOffset(
    edge,
    state.heroKnockUp,
    snapHeroToBorder ? 0 : state.heroYOffset,
    DUEL_SCALE
  );
  const maouSnap = duelSnapOffset(
    edge,
    state.dragonKnockUp,
    maouAnimOffset,
    DUEL_SCALE
  );
  const rotation = DUEL_EDGE_ROTATION[edge];

  sprites.push({
    id: "act-hero",
    pixels: heroes[heroFrame % heroes.length],
    scale: DUEL_SCALE,
    x: heroPos.x,
    y: heroPos.y,
    xOffset: heroSnap.xOffset,
    yOffset: heroSnap.yOffset,
    facingLeft: faceToward(
      { x: heroPos.x, y: heroPos.y },
      { x: maouX, y: maouY },
      edge
    ),
    rotation,
    opacity: heroFlash,
  });
  sprites.push({
    id: "act-maou",
    pixels: maous[maouFrame % maous.length],
    scale: DUEL_SCALE,
    x: maouX,
    y: maouY,
    xOffset: maouSnap.xOffset,
    yOffset: maouSnap.yOffset,
    facingLeft: faceToward({ x: maouX, y: maouY }, { x: heroPos.x, y: heroPos.y }, edge),
    rotation,
    opacity: maouFlash,
  });

  const speech = duelSpeech(state.duelPhase, duelProgress);
  const heroBubble = bubbleOutset(edge, 42);
  const maouBubble = bubbleOutset(edge, 42);
  if (speech.hero) {
    pushDuelBubble(
      sprites,
      "act-hero-bubble",
      speech.hero,
      heroPos.x + heroSnap.xOffset + heroBubble.dx,
      heroPos.y + heroSnap.yOffset + heroBubble.dy,
      0,
      "left"
    );
  }
  if (speech.maou) {
    pushDuelBubble(
      sprites,
      "act-maou-bubble",
      speech.maou,
      maouX + maouSnap.xOffset + maouBubble.dx,
      maouY + maouSnap.yOffset + maouBubble.dy,
      0,
      "right"
    );
  }

  const heroWorldX = heroPos.x + heroSnap.xOffset;
  const heroWorldY = heroPos.y + heroSnap.yOffset;
  const maouWorldX = maouX + maouSnap.xOffset;
  const maouWorldY = maouY + maouSnap.yOffset;

  if (state.heroSlashT !== null) {
    pushAttachedSword(
      sprites,
      "act-hero-slash",
      heroWorldX + (edge === 1 || edge === 3 ? 0 : 10),
      heroWorldY + (edge === 1 || edge === 3 ? 10 : 4),
      state.heroSlashT,
      faceToward({ x: heroPos.x, y: heroPos.y }, { x: maouX, y: maouY }, edge)
    );
  }

  if (state.dragonSlashT !== null) {
    pushAttachedSword(
      sprites,
      "act-maou-slash",
      maouWorldX + (edge === 1 || edge === 3 ? 0 : -10),
      maouWorldY + (edge === 1 || edge === 3 ? -10 : 4),
      state.dragonSlashT,
      faceToward({ x: maouX, y: maouY }, { x: heroPos.x, y: heroPos.y }, edge)
    );
  }

  return sprites;
}

export function getBorderActSprites(state: BorderActsState): BorderActSprite[] {
  const { bounds } = state;
  const marios = homageFrames("mario");
  const goombas = homageFrames("goomba");
  const links = homageFrames("link");
  const sprites: BorderActSprite[] = [];

  const { block } = getMarioRange(state.marioLane);
  const blockBumpLift = state.blockBump > 0 ? -5 : 0;
  const blockBase = marioActorPlacement(state, block, 0, 0);
  const blockAboveOffset = -(RUNNER_PX + BLOCK_GAP_ABOVE_MARIO + RUNNER_PX / 2);
  sprites.push({
    id: "act-block",
    pixels: PROP_SPRITES.questionBlock,
    scale: PROP_SCALE,
    x: blockBase.x,
    y: blockBase.y,
    yOffset: (blockBase.yOffset ?? 0) + blockAboveOffset + blockBumpLift,
    xOffset: blockBase.xOffset,
    facingLeft: false,
    opacity: 1,
  });

  const runFrame = Math.floor(state.runnerHop / Math.PI) % 3;
  const runBounce = Math.sin(state.runnerHop) * -5;
  const jumpWave =
    state.marioPhase === "jump" ? Math.sin(state.marioJumpProg * Math.PI) : 0;
  const goombaJumpProg = Math.max(0, state.marioJumpProg - 0.15);
  const goombaJumpWave =
    state.marioPhase === "jump" ? Math.sin(goombaJumpProg * Math.PI) : 0;

  let marioVertJump = runBounce;
  let marioHorizJump = 0;
  let goombaVertJump = runBounce * 0.65;
  let goombaHorizJump = 0;
  if (state.marioPhase === "jump") {
    if (state.marioLane === "left") {
      marioHorizJump = jumpWave * MARIO_JUMP_HEIGHT;
      goombaHorizJump = goombaJumpWave * 8;
      marioVertJump = 0;
      goombaVertJump = 0;
    } else {
      marioVertJump = -jumpWave * MARIO_JUMP_HEIGHT;
      goombaVertJump = -goombaJumpWave * 8;
    }
  }

  const marioPos = marioActorPlacement(state, state.marioT, marioVertJump, marioHorizJump);
  const goombaPos = marioActorPlacement(state, state.goombaT, goombaVertJump, goombaHorizJump);
  sprites.push({
    id: "act-mario",
    pixels: marios[runFrame % marios.length],
    scale: RUNNER_SCALE,
    x: marioPos.x,
    y: marioPos.y,
    yOffset: marioPos.yOffset,
    xOffset: marioPos.xOffset,
    facingLeft: state.marioDir < 0,
    opacity: 0.96,
  });
  sprites.push({
    id: "act-goomba",
    pixels: goombas[runFrame % goombas.length],
    scale: RUNNER_SCALE,
    x: goombaPos.x,
    y: goombaPos.y,
    yOffset: goombaPos.yOffset,
    xOffset: goombaPos.xOffset,
    facingLeft: state.marioDir < 0,
    opacity: 0.94,
  });

  if (state.mushroom) {
    const fade = Math.min(1, state.mushroom.life / 35);
    sprites.push({
      id: "act-mushroom",
      pixels: PROP_SPRITES.mushroom,
      scale: PROP_SCALE,
      x: blockBase.x,
      y: blockBase.y,
      yOffset: (blockBase.yOffset ?? 0) + blockAboveOffset - state.mushroom.rise,
      xOffset: blockBase.xOffset,
      facingLeft: false,
      opacity: fade,
    });
  }

  const linkPose = computeLinkLeapPose(state) ?? computeLinkPatrolPose(state);
  if (linkPose) {
    sprites.push({
      id: "act-link",
      pixels: links[linkPose.frame % links.length],
      scale: LINK_SCALE,
      x: linkPose.x,
      y: linkPose.y,
      yOffset: linkPose.yOffset ?? 0,
      facingLeft: linkPose.facingLeft,
      opacity: 0.97,
    });
    if (linkPose.swordExtendT > 0) {
      pushLinkDownSword(
        sprites,
        linkPose.x,
        linkPose.y + (linkPose.yOffset ?? 0),
        linkPose.swordExtendT
      );
    }
  }

  const oval = state.titleOvalAnchor;
  if (oval) {
    const logoPxH = TITLE_LOGO_H * TITLE_LOGO_SCALE;
    sprites.push({
      id: "act-title-logo",
      pixels: [],
      imageSrc: TITLE_LOGO_SRC,
      imageWidth: TITLE_LOGO_W,
      imageHeight: TITLE_LOGO_H,
      scale: TITLE_LOGO_SCALE,
      x: oval.x,
      y: oval.y - logoPxH / 2,
      facingLeft: false,
      opacity: 1,
    });
  }

  return [...sprites, ...getDuelActSprites(state)];
}
