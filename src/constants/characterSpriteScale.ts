/**
 * Link (Characters.tsx 16×14 @ 2.5) — reference footprint for decorative site characters.
 * Mini-game headers and logos use their own scales.
 */
export const CHARACTER_SPRITE_COLS = 16;
export const CHARACTER_SPRITE_ROWS = 14;
export const CHARACTER_BASE_SCALE = 2.5;

export const CHARACTER_DISPLAY_WIDTH =
  CHARACTER_SPRITE_COLS * CHARACTER_BASE_SCALE;
export const CHARACTER_DISPLAY_HEIGHT =
  CHARACTER_SPRITE_ROWS * CHARACTER_BASE_SCALE;

/** Uniform scale so a sprite's pixel height matches Link's 35px footprint. */
export function characterScaleForRows(rows: number): number {
  return CHARACTER_DISPLAY_HEIGHT / rows;
}

/** 16×14 roaming sprites (link, slime, mario, pacman, ice climber, …). */
export const WANDERER_SPRITE_SCALE = CHARACTER_BASE_SCALE;

/** 8-row props (? block, mushroom) — same 35px height as 14-row wanderers. */
export const HOMAGE_8ROW_SCALE = characterScaleForRows(8);

/** SceneTitleMarioAct — バッジ上マリオ専用（徘徊キャラの Link 基準とは別） */
export const MARIO_SMALL_SCALE = 1.62;
export const MARIO_BIG_SCALE = 2.7;
