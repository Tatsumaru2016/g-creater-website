/** 名作ゲーム風オマージュ・オリジナルドット絵（非公式パロディ） */
export type HomageId = "mario" | "invader" | "link" | "dqhero" | "yoshi" | "dragon" | "pacman";

export interface HomageSprite {
  id: HomageId;
  label: string;
  frames: string[][][];
}

const T = "#00000000";

export const HOMAGE_SPRITES: Record<HomageId, HomageSprite> = {
  mario: {
    id: "mario",
    label: "Plumber Hero",
    frames: [
      [
        [T, "#E52521", "#E52521", "#E52521", "#E52521", T, T, T],
        [T, "#E52521", "#FFCC99", "#FFCC99", "#E52521", T, T, T],
        ["#E52521", "#E52521", "#FFCC99", "#FFFFFF", "#FFCC99", "#E52521", T, T],
        [T, "#FFCC99", "#3D2817", "#3D2817", "#FFCC99", T, T, T],
        [T, "#2244CC", "#2244CC", "#E52521", "#2244CC", T, T, T],
        [T, "#2244CC", "#2244CC", "#2244CC", "#2244CC", T, T, T],
        [T, "#3D2817", "#2244CC", T, "#2244CC", "#3D2817", T, T],
        [T, "#3D2817", T, T, T, "#3D2817", T, T],
      ],
      [
        [T, "#E52521", "#E52521", "#E52521", "#E52521", T, T, T],
        [T, "#E52521", "#FFCC99", "#FFCC99", "#E52521", T, T, T],
        ["#E52521", "#E52521", "#FFCC99", "#FFFFFF", "#FFCC99", "#E52521", T, T],
        [T, "#FFCC99", "#3D2817", "#3D2817", "#FFCC99", T, T, T],
        [T, "#2244CC", "#2244CC", "#E52521", "#2244CC", T, T, T],
        [T, "#2244CC", "#2244CC", "#2244CC", "#2244CC", T, T, T],
        [T, T, "#2244CC", "#2244CC", T, T, T, T],
        [T, "#3D2817", "#3D2817", T, "#3D2817", "#3D2817", T, T],
      ],
    ],
  },

  invader: {
    id: "invader",
    label: "Space Critter",
    frames: [
      [
        [T, "#FF4466", "#FF4466", T, T, "#FF4466", "#FF4466", T],
        [T, T, "#FF4466", "#FF4466", "#FF4466", "#FF4466", T, T],
        [T, "#FF4466", "#FFFFFF", "#FF4466", "#FF4466", "#FFFFFF", "#FF4466", T],
        [T, "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", T],
        [T, T, "#FF4466", T, T, "#FF4466", T, T],
        [T, "#FF4466", T, T, T, T, "#FF4466", T],
      ],
      [
        [T, T, "#FF4466", "#FF4466", "#FF4466", "#FF4466", T, T],
        [T, "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", T],
        [T, "#FF4466", "#FFFFFF", "#FF4466", "#FF4466", "#FFFFFF", "#FF4466", T],
        [T, "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", "#FF4466", T],
        [T, "#FF4466", T, "#FF4466", "#FF4466", T, "#FF4466", T],
        [T, T, "#FF4466", T, T, "#FF4466", T, T],
      ],
    ],
  },

  link: {
    id: "link",
    label: "Elf Swordsman",
    frames: [
      [
        [T, T, "#2E8B57", "#2E8B57", "#2E8B57", T, T, T],
        [T, "#2E8B57", "#3CB371", "#FFD700", "#FFD700", "#3CB371", T, T],
        [T, "#3CB371", "#FFCC99", "#FFFFFF", "#FFCC99", "#3CB371", T, T],
        [T, T, "#FFCC99", "#3D2817", "#FFCC99", T, T, T],
        [T, "#3CB371", "#3CB371", "#3CB371", "#3CB371", "#3CB371", T, T],
        [T, "#8B4513", "#3CB371", "#3CB371", "#3CB371", "#C0C0C0", T, T],
        [T, T, "#3CB371", T, "#3CB371", T, T, T],
        [T, "#3D2817", T, T, T, "#3D2817", T, T],
      ],
      [
        [T, T, "#2E8B57", "#2E8B57", "#2E8B57", T, T, T],
        [T, "#2E8B57", "#3CB371", "#FFD700", "#FFD700", "#3CB371", T, T],
        [T, "#3CB371", "#FFCC99", "#FFFFFF", "#FFCC99", "#3CB371", T, T],
        [T, T, "#FFCC99", "#3D2817", "#FFCC99", T, T, T],
        [T, "#3CB371", "#3CB371", "#3CB371", "#3CB371", "#3CB371", T, T],
        [T, "#C0C0C0", "#3CB371", "#3CB371", "#3CB371", "#8B4513", T, T],
        [T, T, "#3CB371", "#3CB371", T, T, T, T],
        [T, "#3D2817", T, T, "#3D2817", T, T, T],
      ],
    ],
  },

  dqhero: {
    id: "dqhero",
    label: "Dragon Quest Hero",
    frames: [
      [
        [T, T, "#FFD700", "#FFD700", "#FFD700", T, T, T],
        [T, "#FFD700", "#FFD700", "#FFCC99", "#FFD700", "#FFD700", T, T],
        [T, "#3366CC", "#FFCC99", "#FFFFFF", "#FFCC99", "#3366CC", T, T],
        [T, "#3366CC", "#3366CC", "#3366CC", "#3366CC", "#3366CC", T, T],
        [T, "#C0C0C0", "#3366CC", "#3366CC", "#3366CC", "#C0C0C0", T, T],
        [T, "#C0C0C0", "#3366CC", "#E52521", "#3366CC", "#C0C0C0", T, T],
        [T, T, "#3366CC", T, "#3366CC", T, T, T],
        [T, "#3D2817", T, T, T, "#3D2817", T, T],
      ],
      [
        [T, T, "#FFD700", "#FFD700", "#FFD700", T, T, T],
        [T, "#FFD700", "#FFD700", "#FFCC99", "#FFD700", "#FFD700", T, T],
        [T, "#3366CC", "#FFCC99", "#FFFFFF", "#FFCC99", "#3366CC", T, T],
        [T, "#3366CC", "#3366CC", "#3366CC", "#3366CC", "#3366CC", T, T],
        [T, "#C0C0C0", "#3366CC", "#3366CC", "#3366CC", "#3366CC", T, T],
        [T, "#C0C0C0", "#3366CC", "#3366CC", "#E52521", "#C0C0C0", T, T],
        [T, T, "#3366CC", "#3366CC", T, T, T, T],
        [T, "#3D2817", "#3D2817", T, "#3D2817", "#3D2817", T, T],
      ],
      [
        [T, T, T, "#FFD700", "#FFD700", "#FFD700", T, T],
        [T, T, "#FFD700", "#FFCC99", "#FFD700", "#FFD700", T, T],
        [T, "#3366CC", "#FFCC99", "#FFFFFF", "#FFCC99", "#3366CC", T, T],
        [T, "#3366CC", "#3366CC", "#3366CC", "#3366CC", "#3366CC", T, T],
        [T, "#C0C0C0", "#3366CC", "#E52521", "#3366CC", "#C0C0C0", T, T],
        [T, T, "#3366CC", "#3366CC", "#3366CC", T, T, T],
        [T, T, "#3366CC", T, "#3366CC", T, T, T],
        [T, "#3D2817", T, T, T, "#3D2817", T, T],
      ],
      [
        [T, T, "#FFD700", "#FFD700", "#FFD700", T, T, T],
        [T, "#FFD700", "#FFD700", "#FFCC99", "#FFD700", "#FFD700", T, T],
        [T, "#3366CC", "#FFCC99", "#FFFFFF", "#FFCC99", "#E52521", T, T],
        [T, "#3366CC", "#3366CC", "#3366CC", "#E52521", "#E52521", T, T],
        [T, "#C0C0C0", "#3366CC", "#E52521", "#E52521", "#C0C0C0", T, T],
        [T, "#C0C0C0", "#3366CC", "#3366CC", "#3366CC", "#C0C0C0", T, T],
        [T, T, "#3366CC", T, "#3366CC", T, T, T],
        [T, "#3D2817", T, T, T, "#3D2817", T, T],
      ],
    ],
  },

  dragon: {
    id: "dragon",
    label: "Demon Dragon",
    frames: [
      [
        [T, T, "#8B008B", "#8B008B", "#8B008B", T, T, T],
        [T, "#8B008B", "#9932CC", "#FF4444", "#9932CC", "#8B008B", T, T],
        [T, "#9932CC", "#FF4444", "#FFFF00", "#FF4444", "#9932CC", T, T],
        ["#8B008B", "#9932CC", "#9932CC", "#FF4444", "#9932CC", "#8B008B", T, T],
        [T, "#9932CC", "#4B0082", "#9932CC", "#4B0082", "#9932CC", T, T],
        [T, T, "#9932CC", "#9932CC", "#9932CC", T, T, T],
        [T, T, "#4B0082", T, "#4B0082", T, T, T],
        [T, "#4B0082", T, T, T, "#4B0082", T, T],
      ],
      [
        [T, "#8B008B", T, "#8B008B", "#8B008B", T, T, T],
        [T, "#9932CC", "#FF6600", "#FF4444", "#FF6600", "#9932CC", T, T],
        [T, "#9932CC", "#FF4444", "#FFFFFF", "#FF4444", "#9932CC", T, T],
        ["#8B008B", "#9932CC", "#FF4444", "#FF4444", "#9932CC", "#8B008B", T, T],
        [T, "#9932CC", "#4B0082", "#9932CC", "#4B0082", "#9932CC", T, T],
        [T, T, "#9932CC", "#9932CC", "#9932CC", T, T, T],
        [T, T, "#4B0082", T, "#4B0082", T, T, T],
        [T, "#4B0082", T, T, T, "#4B0082", T, T],
      ],
      [
        [T, T, T, "#8B008B", "#8B008B", "#8B008B", T, T],
        [T, T, "#8B008B", "#9932CC", "#FF4444", "#9932CC", T, T],
        [T, T, "#9932CC", "#FF4444", "#FFFF00", "#9932CC", T, T],
        [T, "#8B008B", "#9932CC", "#9932CC", "#FF4444", "#9932CC", T, T],
        [T, T, "#9932CC", "#4B0082", "#9932CC", "#4B0082", T, T],
        [T, T, T, "#9932CC", "#9932CC", T, T, T],
        [T, T, "#4B0082", T, T, "#4B0082", T, T],
        [T, T, "#4B0082", T, T, T, T, T],
      ],
      [
        [T, "#FF6600", T, "#8B008B", "#8B008B", T, "#FF6600", T],
        [T, "#9932CC", "#FF6600", "#FF4444", "#FF6600", "#9932CC", T, T],
        [T, "#9932CC", "#FF4444", "#FFFFFF", "#FF4444", "#9932CC", T, T],
        ["#8B008B", "#9932CC", "#FF4444", "#FF4444", "#9932CC", "#8B008B", T, T],
        [T, "#9932CC", "#4B0082", "#9932CC", "#4B0082", "#9932CC", T, T],
        [T, T, "#9932CC", "#9932CC", "#9932CC", T, T, T],
        [T, T, "#4B0082", T, "#4B0082", T, T, T],
        [T, "#4B0082", T, T, T, "#4B0082", T, T],
      ],
    ],
  },

  pacman: {
    id: "pacman",
    label: "Chomp Hero",
    frames: [
      [
        [T, T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        [T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T],
        ["#FFFF00", "#FFFF00", "#000000", "#FFFF00", T, T, T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T, T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T, T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T, T],
        [T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        [T, T, "#FFFF00", "#FFFF00", T, T, T, T],
      ],
      [
        [T, T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        [T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T],
        ["#FFFF00", "#FFFF00", "#000000", "#FFFF00", "#FFFF00", T, T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T, T],
        [T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        [T, T, "#FFFF00", "#FFFF00", T, T, T, T],
      ],
      [
        [T, T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        [T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T],
        ["#FFFF00", "#FFFF00", "#000000", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T, T],
        [T, "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", T, T],
        [T, T, "#FFFF00", "#FFFF00", T, T, T, T],
      ],
    ],
  },

  yoshi: {
    id: "yoshi",
    label: "Dino Buddy",
    frames: [
      [
        [T, T, T, "#56C456", "#56C456", T, T, T],
        [T, T, "#56C456", "#56C456", "#56C456", "#90EE90", T, T],
        [T, "#56C456", "#56C456", "#FFFFFF", "#000000", "#90EE90", T, T],
        [T, "#56C456", "#56C456", "#56C456", "#90EE90", "#90EE90", T, T],
        [T, "#56C456", "#E52521", "#90EE90", "#90EE90", "#56C456", T, T],
        [T, T, "#56C456", "#56C456", "#56C456", T, T, T],
        [T, "#3D2817", "#56C456", T, "#56C456", "#3D2817", T, T],
        [T, "#3D2817", T, T, T, "#3D2817", T, T],
      ],
      [
        [T, T, T, "#56C456", "#56C456", T, T, T],
        [T, T, "#56C456", "#56C456", "#56C456", "#90EE90", T, T],
        [T, "#56C456", "#56C456", "#FFFFFF", "#000000", "#90EE90", T, T],
        [T, "#56C456", "#56C456", "#56C456", "#90EE90", "#90EE90", T, T],
        [T, "#56C456", "#E52521", "#90EE90", "#90EE90", "#56C456", T, T],
        [T, T, "#56C456", "#56C456", "#56C456", T, T, T],
        [T, T, "#56C456", "#56C456", T, T, T, T],
        [T, "#3D2817", "#3D2817", T, "#3D2817", "#3D2817", T, T],
      ],
    ],
  },
};

export function homageFrames(id: HomageId): string[][][] {
  return HOMAGE_SPRITES[id].frames;
}

export const HOMAGE_IDS: HomageId[] = ["mario", "invader", "link", "dqhero", "yoshi", "dragon", "pacman"];

/** 枠演出用プロップ */
export const PROP_SPRITES = {
  questionBlock: [
    [T, "#C87800", "#C87800", "#C87800", "#C87800", "#C87800", T, T],
    ["#C87800", "#FFD700", "#FFD700", "#FFFFFF", "#FFD700", "#C87800", T, T],
    ["#C87800", "#FFD700", "#000000", "#FFD700", "#000000", "#C87800", T, T],
    ["#C87800", "#FFD700", "#FFD700", "#FFD700", "#FFD700", "#C87800", T, T],
    ["#C87800", "#FFD700", "#FFD700", "#FFFFFF", "#FFD700", "#C87800", T, T],
    ["#C87800", "#FFD700", "#FFD700", "#FFD700", "#FFD700", "#C87800", T, T],
    [T, "#8B5A00", "#8B5A00", "#8B5A00", "#8B5A00", "#8B5A00", T, T],
    [T, T, T, T, T, T, T, T],
  ] as string[][],
  mushroom: [
    [T, T, "#E52521", "#E52521", "#E52521", T, T, T],
    [T, "#E52521", "#FFFFFF", "#E52521", "#FFFFFF", "#E52521", T, T],
    [T, "#E52521", "#E52521", "#E52521", "#E52521", "#E52521", T, T],
    [T, T, "#FFCC99", "#FFCC99", "#FFCC99", T, T, T],
    [T, T, "#FFCC99", "#FFCC99", "#FFCC99", T, T, T],
    [T, T, T, T, T, T, T, T],
  ] as string[][],
  target: [
    [T, T, "#E52521", "#E52521", "#E52521", T, T, T],
    [T, "#E52521", "#FFFFFF", "#E52521", "#FFFFFF", "#E52521", T, T],
    [T, "#E52521", "#E52521", "#FFFFFF", "#E52521", "#E52521", T, T],
    [T, "#E52521", "#FFFFFF", "#E52521", "#FFFFFF", "#E52521", T, T],
    [T, T, "#E52521", "#E52521", "#E52521", T, T, T],
    [T, T, T, T, T, T, T, T],
  ] as string[][],
  magicBolt: [
    [T, T, "#FF6600", "#FF6600", T, T],
    [T, "#FF6600", "#FFFF00", "#FF4444", "#FF6600", T],
    [T, "#9932CC", "#FF4444", "#FFFFFF", "#FF4444", T],
    [T, T, "#FF6600", "#FF6600", T, T],
  ] as string[][],
};
