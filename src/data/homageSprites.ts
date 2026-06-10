/** 名作ゲーム風オマージュ・オリジナルドット絵（非公式パロディ） */
export type HomageId =
  | "mario"
  | "invader"
  | "link"
  | "dqhero"
  | "yoshi"
  | "goomba"
  | "dragon"
  | "maou"
  | "pacman"
  | "ghost"
  | "slime"
  | "draky"
  | "galaga"
  | "ufo"
  | "guncore"
  | "greengrunt";

export interface HomageSprite {
  id: HomageId;
  label: string;
  frames: string[][][];
}

const T = "#00000000";
const K = "#000000";

/** DQ風16×14 — Link（Characters.tsx）と同じキャンバス・表示高さ */
function dqGrid(rows: string[], palette: Record<string, string>): string[][] {
  const padded = [...rows];
  while (padded.length < 14) padded.push("................");
  return padded.slice(0, 14).map((row) =>
    [...row.padEnd(16, ".").slice(0, 16)].map((ch) => palette[ch] ?? T)
  );
}

/** DQ風勇者 — Link と同型16×14・青鎧（オリジナル） */
const DQ_HERO_PAL = {
  ".": T,
  B: "#2060E0",
  D: "#1040B0",
  W: "#FFFFFF",
  S: "#FFCCAA",
  K: "#202020",
  C: "#B8C8D8",
  R: "#C82828",
  Y: "#F8D030",
  b: "#3D2817",
};

/** 魔王 — Link と同型16×14・角と紫ローブ（オリジナル） */
const DQ_MAOU_PAL = {
  ".": T,
  K: "#180820",
  W: "#F0E8E0",
  S: "#E8B888",
  Y: "#F0C020",
  R: "#E04050",
  P: "#8830B0",
  p: "#502070",
  H: "#C8A0FF",
  b: "#2A1030",
};

function dqFrames(
  frames: string[][],
  palette: Record<string, string>
): string[][][] {
  return frames.map((rows) => dqGrid(rows, palette));
}

/** 16×14 wanderer canvas (Characters.tsx と同型) */
function wandererFrames(
  frames: string[][],
  palette: Record<string, string>
): string[][][] {
  return dqFrames(frames, palette);
}

const SMB_PAL = {
  ".": T,
  R: "#E52521",
  b: "#3D2817",
  S: "#FFCC99",
  K: "#000000",
  B: "#2244CC",
  Y: "#FFD700",
};

const HYLIAN_PAL = {
  ".": T,
  G: "#2E8B57",
  g: "#3CB371",
  Y: "#FFD700",
  b: "#3D2817",
  S: "#FFCC99",
  K: "#1A1A1A",
  B: "#3D2817",
  R: "#C62828",
};

const GOOMBA_PAL = {
  ".": T,
  b: "#8B4513",
  S: "#FFCC99",
  K: "#000000",
  D: "#3D2817",
};

const INVADER_PAL = {
  ".": T,
  P: "#FF4466",
  K: "#FFFFFF",
};

const SLIME_HOM_PAL = {
  ".": T,
  G: "#00F0FF",
  D: "#0088DD",
  W: "#FFFFFF",
  K: "#000000",
  m: "#FF66CC",
};

const YOSHI_PAL = {
  ".": T,
  G: "#56C456",
  L: "#90EE90",
  S: "#FFFFFF",
  K: "#000000",
  R: "#E52521",
  D: "#3D2817",
};

const DRAGON_PAL = {
  ".": T,
  P: "#8B008B",
  V: "#9932CC",
  R: "#FF4444",
  Y: "#FFFF00",
  I: "#4B0082",
  C: "#C0C0C0",
  W: "#FFFFFF",
  O: "#FF6600",
};

const DRAKY_PAL = {
  ".": T,
  P: "#9932CC",
  I: "#4B0082",
  W: "#FFFFFF",
  K: "#000000",
  R: "#FF4444",
};

const PAC_HOM_PAL = {
  ".": T,
  p: "#FFFF00",
};

/** パックマン風赤オバケ（ブリンキー） */
const GHOST_HOM_PAL = {
  ".": T,
  R: "#E02020",
  W: "#FFFFFF",
  B: "#2121DE",
};

/** ギャラクシアン風プレイヤー機 — 赤・青・白（トップビュー） */
const GALAGA_PAL = {
  ".": T,
  R: "#E82828",
  B: "#2858D8",
  W: "#FFFFFF",
};

/** 勇者 — Link 同型の横顔・目鼻が読める人型（4コマ） */
const DQ_HERO_FRAMES = dqFrames(
  [
    [
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "..BbYYYYYBBB....",
      ".bBYSSYSSYbBb...",
      ".bBSSYSSYSSBb...",
      "..BSKKSSKKSS....",
      "...BBBBBBBB.....",
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "....BBRRBB......",
      "...BBB..BBB.....",
      "..BBB....BBB....",
      "..CCC....CCC....",
      ".bbbB....Bbbb...",
    ],
    [
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "..BbYYYYYBBB....",
      ".bBYSSYSSYbBb...",
      ".bBSSYSSYSSBb...",
      "..BSKKSSKKSS....",
      "...BBBBBBBB.....",
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "....BBRRBB......",
      "...BBR..RBB.....",
      "....BB..BB......",
      "..bbb.....bbb...",
      ".bbbB....Bbbb...",
    ],
    [
      ".....BBBBBB.....",
      "....BBBBBBBB....",
      "...BbYYYYYBBB...",
      "....bBSSYSSYb...",
      "....bBSSYSSYb...",
      ".....BSKKSSKK...",
      ".....BBBBBBB....",
      "......BBBBBB....",
      ".....BBBBBBBB...",
      "......BBRRBB....",
      "......BBBB......",
      ".....bbb..bbb...",
      "..bbb......bbb..",
      "................",
    ],
    [
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "..BbYYYYYBBB....",
      ".bBYSSYSSYbBb...",
      ".bBSSYSSYSSBb...",
      "..BSKKSSKKSS....",
      "...BBBBBBBB.....",
      "....BBBBBB.RR...",
      "...BBBBBRRRRR...",
      "....BBRRRRRRR...",
      "...BBB....BBB...",
      "..BBB....BBB....",
      "..CCC....CCC....",
      ".bbbB....Bbbb...",
    ],
  ],
  DQ_HERO_PAL
);

/** クラシック銀メタリック円盤型 UFO */
const UFO_SAUCER_PAL = {
  ".": T,
  L: "#F4F8FC",
  S: "#C4CCD8",
  M: "#98A4B4",
  D: "#687888",
  K: "#404858",
  G: "#A8D8F0",
  g: "#78B8D8",
  W: "#FFFFFF",
  l: "#60E878",
};

const UFO_GALAGA_FRAMES = dqFrames(
  [
    [
      "................",
      "......LL........",
      ".....LGGGL......",
      "....LGGGGGL.....",
      "...LSSMMMMSSL...",
      "..SSMMMMMMMMSS..",
      ".MMDDDDDDDDDMM.",
      "..SSSSSSSSSSSS..",
      "...ll......ll...",
      "....K......K....",
      ".....k....k.....",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      "......LL........",
      ".....LGGGL......",
      "....LGWGGGL.....",
      "...LSSMMMMSSL...",
      "..SSMMMMMMMMSS..",
      ".MMDDDDDDDDDMM.",
      "..SSSSSSSSSSSS..",
      "....ll....ll....",
      ".....K....K.....",
      "......kkkk......",
      "................",
      "................",
      "................",
    ],
  ],
  UFO_SAUCER_PAL
);

/** RX-78風ガンダム — Link 同型16×14・横顔（3コマ） */
const GUNCORE_PAL = {
  ".": T,
  W: "#E8ECF8",
  B: "#2A6AD8",
  D: "#1A48B0",
  R: "#E02830",
  K: "#181818",
  Y: "#F0C020",
  G: "#787878",
  P: "#FF66AA",
  L: "#FFE0F8",
  b: "#3D2817",
};

const GUNCORE_FRAMES = dqFrames(
  [
    [
      ".....YK..YK.....",
      "...KWBWWWWBWK...",
      "..BWWWWWWWWWBB...",
      ".BWWBBBBWWWBB.....",
      ".BWWRWWRRWWWB....",
      "..BWWWWWWWWWBB...",
      "..BDWWWWWWWDB....",
      "..BWW....WWBB....",
      "..BWW....WWBB....",
      ".KKW......WKK....",
      ".KKK......KKK....",
      "bbG........Gbbb..",
      ".bb..........bb..",
      "...bb......bb....",
    ],
    [
      ".....YK..YK.....",
      "...KWBWWWWBWK...",
      "..BWWWWWWWWWBB...",
      ".BWWBBBBWWWBB.....",
      ".BWWRWWRRWWWB....",
      "..BWWWWWWWWWBB...",
      "..BDWWWWWWWDB....",
      "..BWW....WWBB....",
      "...BWW...WWBB....",
      "..BWW.....WKK....",
      ".KKW......KKK....",
      ".KKK.....KKK.....",
      "bbG......Gbbb....",
      ".bb.........bb...",
    ],
    [
      ".....YK..YK.....",
      "...KWBWWWWBWK...",
      "..BWWWWWWWWWBB...",
      ".BWWBBBBWWWBB.....",
      ".BWWRWWRRWWWB....",
      "..BWWWWWWWWWBB...",
      "..BDWWWWWWWDB....",
      "..BWW....WWBB....",
      "..BWW....PPPPP...",
      "..KKW...PPPLLL...",
      ".KKK....PPPLLL...",
      "bbG........Gbbb..",
      ".bb..........bb..",
      "...bb......bb....",
    ],
  ],
  GUNCORE_PAL
);

/** シャア専用ザク — Link 同型16×14・横顔（2コマ） */
const GREENGRUNT_PAL = {
  ".": T,
  R: "#C83838",
  r: "#902828",
  L: "#E85050",
  D: "#601818",
  K: "#281818",
  P: "#FF4088",
  M: "#686868",
  Y: "#F0C020",
  W: "#E8E8E8",
  G: "#505050",
  b: "#301010",
};

const GREENGRUNT_FRAMES = dqFrames(
  [
    [
      ".....Y...Y......",
      "....KRRRRRRK....",
      "...KRPWWPRRK....",
      "..KRRRRRRRRRK...",
      "..YRRRRRRRRRY...",
      ".DRRRRRRRRRRD...",
      "..DRRRMRRRRD....",
      "..DRR....RRD....",
      "..DRR....RRD....",
      ".KKR......RKK...",
      ".KKK......KKK...",
      "bbG........Gbbb..",
      ".bb..........bb..",
      "...bb......bb....",
    ],
    [
      ".....Y...Y......",
      "....KRRRRRRK....",
      "...KRPWWPRRK....",
      "..KRRRRRRRRRK...",
      "..YRRRRRRRRRY...",
      ".DRRRRRRRRRRD...",
      "..DRRRMRRRRD....",
      "..DRR....RRD....",
      "...DRR...RRD....",
      "..DRR.....RKK...",
      ".KKR......KKK...",
      "bbG......Gbbb....",
      ".bb.........bb...",
      "...bb.....bbb...",
    ],
  ],
  GREENGRUNT_PAL
);

/** 魔王 — 角付き・Link 同型の横顔が読める人型（4コマ） */
const DQ_MAOU_FRAMES = dqFrames(
  [
    [
      "...pYY..YYp.....",
      "..pPPHHHPPp.....",
      "..pPbSSSSbp.....",
      ".pbYSSYSSYbP....",
      ".pSSYSSYSSp.....",
      "..PSRKSSKRSP....",
      "..WWPPPPPPWW....",
      "..PPPPPPPPPP....",
      "..PPPPPPPPPP....",
      "...PP....PP.....",
      "...PK....KP.....",
      "..ppK....Kpp....",
      ".KKK.....KKK....",
      "...bb....bb.....",
    ],
    [
      "...pYY..YYp.....",
      "..pPPHHHPPp.....",
      "..pPbSSSSbp.....",
      ".pbYSSYSSYbP....",
      ".pSSYSSYSSp.....",
      "..PSRKSSKRSP....",
      "..WWPPPPPPWW....",
      "..PPPPPPPPPP....",
      "..PPPPPPPPPP....",
      "...PP....PP.....",
      "...PP....PP.....",
      "....pp...pp.....",
      "..ppK....Kpp....",
      ".KKKK....KKKK...",
    ],
    [
      "...pYY..YYp.....",
      "..pPPHHHPPp.....",
      "..pPSSSSSSp.....",
      "..pbYSSYSSYb....",
      "..pSSYSSYSSp....",
      "...SKKSSKKSS....",
      "..WWPPPPPPWW....",
      "..PPPPPPPPPP....",
      "..PPPPPPPPPP....",
      "...PP....PP.....",
      "...PK....KP.....",
      "..ppK....Kpp....",
      ".KKKK....KKKK...",
      "...bb....bb.....",
    ],
    [
      "...pYY..YYp.....",
      "..pPPHHHPPp.....",
      "..pPbSSSSbp.....",
      ".pbYSSYSSYbP....",
      ".pSSYSSYSSp.....",
      "..PSRKSSKRSP....",
      "..WWPPPPPPWW....",
      "..PPPPPPPPPP....",
      "..PPPPHHHHRR....",
      "...PPPHHHRRRR...",
      "....PPHHRRRRR...",
      "...PP....PP.....",
      "..ppK....Kpp....",
      ".KKKK....KKKK...",
    ],
  ],
  DQ_MAOU_PAL
);

const MARIO_WANDERER_FRAMES = wandererFrames(
  [
    [
      "....RRRRR.......",
      "...RRRRRRRRR....",
      "...bbbSSbS......",
      "..bbSbSSbSSS....",
      "..bbSbbSSbSKS...",
      "..bbSSb...S.....",
      "....SSSSSSS.....",
      "...RRBRRBRR.....",
      "..RRRBRRBRRR....",
      "RRRRRBBBBRRRRR..",
      "SS..RBYYBR..SS..",
      "....BBBBBB......",
      "...BBB..BBB.....",
      "..bbb....bbb....",
    ],
    [
      "....RRRRR.......",
      "...RRRRRRRRR....",
      "...bbbSSbS......",
      "..bbSbSSbSSS....",
      "..bbSbbSSbSKS...",
      "....SSb...S.....",
      "....SSSSSSS.....",
      "...RRBRRBR......",
      "..RRRBRRBRRR....",
      ".RRRRBBBBRRRR...",
      "SS..RBYYBR.bSS..",
      "....BBBBBB.bb...",
      "...BBB..BBB.....",
      "..bbb.....bbb...",
    ],
    [
      "....RRRRR.......",
      "...RRRRRRRRR....",
      "...bbbSSbS......",
      "..bbSbSSbSSS....",
      "..bbSbbSSbSKS...",
      "....SSb...S.....",
      "....SSSSSSS.....",
      "...RRBRRBR......",
      "..RRRBRRBRRR....",
      "RRRRRBBBBRRRRR..",
      ".SS.RBYYBR..SS..",
      "....BBBBBB......",
      "...BBB..BBB.....",
      ".bbb.....bbb....",
    ],
  ],
  SMB_PAL
);

const LINK_WANDERER_FRAMES = wandererFrames(
  [
    [
      "....GGGGGG......",
      "...GGGGGGGGG....",
      "..GGYYYYYGGGG...",
      ".bBYSSYSSYBBb...",
      ".bBSSYSSYSSBb...",
      "..BSKKSSKKSS....",
      "...SSSSSSSS.....",
      "....GGGGGG......",
      "...GGGGGGGG.....",
      "....GGRRGG......",
      "...GGRRRRGG.....",
      "..GGRR..RRGG....",
      "..bGb....bGb....",
      ".bbbB....Bbbb...",
    ],
    [
      "....GGGGGG......",
      "...GGGGGGGGG....",
      "..GGYYYYYGGGG...",
      ".bBYSSYSSYBBb...",
      ".bBSSYSSYSSBb...",
      "..BSKKSSKKSS....",
      "...SSSSSSSS.....",
      "....GGGGGG......",
      "...GGGGGGGG.....",
      "....GGRRGG......",
      "...GGRRRGG......",
      "....GR..RGG.....",
      "...bGb...bGb....",
      "..bbb.....bbb...",
    ],
  ],
  HYLIAN_PAL
);

const GOOMBA_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      "................",
      ".....bbbb.......",
      "....bbbbbb......",
      "...bbbbbbbb.....",
      "..bbSKbbKSbb....",
      "..bbbbbbbbbb....",
      "..bbbbbbbbbb....",
      "...bbbbbbbb.....",
      "....bb....bb....",
      "...bbb....bbb...",
      "..bbb......bbb..",
      "................",
      "................",
    ],
    [
      "................",
      "................",
      ".....bbbb.......",
      "....bbbbbb......",
      "...bbbbbbbb.....",
      "..bbSKbbKSbb....",
      "..bbbbbbbbbb....",
      "..bbbbbbbbbb....",
      "...bbbbbbbb.....",
      "....bb....bb....",
      "...bbb....bbb...",
      "..bbb......bbb..",
      "................",
      "................",
    ],
  ],
  GOOMBA_PAL
);

const INVADER_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      ".....PP...PP....",
      "......PPPP......",
      ".....PPPPPP.....",
      "....PPKPPKPP....",
      "...PPPPPPPPPP...",
      "...PKPPPPPPKP...",
      "....PP.PP.PP....",
      ".....P.....P....",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      ".....PP...PP....",
      "......PPPP......",
      ".....PPPPPP.....",
      "....PPKPPKPP....",
      "...PPPPPPPPPP...",
      "...PKPPPPPPKP...",
      "....P.PP.PP.P...",
      "...P..P...P..P..",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
  ],
  INVADER_PAL
);

const SLIME_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      "................",
      "....GGGGGG......",
      "...GGGGGGGGG....",
      "..GGGGGGGGGGG...",
      ".GGGWWKKWWGGGG..",
      ".GGGGGGGGGGGGGG.",
      ".GGGGGGGGGGGGGG.",
      "..GGGGGGGGGGGG..",
      "...GGGGGGGGG....",
      "....GGG..GGG....",
      ".....GG....GG...",
      "................",
      "................",
    ],
    [
      "................",
      "................",
      "..GGGGGGGGGGGG..",
      ".GGGGGGGGGGGGGG.",
      ".GGGWWKKWWGGGGG.",
      "GGGGGGGGGGGGGGGG",
      ".GGGGGGGGGGGGGG.",
      "..GGGGGGGGGGGG..",
      "...GGGG..GGGG...",
      "....GG....GG....",
      "................",
      "................",
      "................",
      "................",
    ],
  ],
  SLIME_HOM_PAL
);

const YOSHI_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      "....GGGGGG......",
      "...GGGGGGGGL....",
      "..GGGGSSKGGGL...",
      "..GGGGGGGLLL....",
      "..GGGRRGGGGG....",
      "...GGGGGGGG.....",
      "....GGGGGG......",
      "...GGG..GGG.....",
      "..DDD....DDD....",
      "..DDD....DDD....",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      "....GGGGGG......",
      "...GGGGGGGGL....",
      "..GGGGSSKGGGL...",
      "..GGGGGGGLLL....",
      "..GGGRRGGGGG....",
      "...GGGGGGGG.....",
      "....GGGGGG......",
      "...GGG..GGG.....",
      "....DDD..DDD....",
      "..DDD.....DDD...",
      "................",
      "................",
      "................",
    ],
  ],
  YOSHI_PAL
);

const DRAGON_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      "....PPPPPP......",
      "...PVRRRRVP.....",
      "..PVRYYYRVP.....",
      ".PVPVVRRVVP.....",
      ".PVIVVVIVVP.....",
      "..PVPPPPVP......",
      "...PI....IP.....",
      "..PI......IP....",
      "..I........I....",
      "................",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      ".P....PPPPP.....",
      "..PVORRRRVP.....",
      "..PVRYWYRVP.....",
      ".PVPVVRRVVP.....",
      ".PVIVVVIVVP.....",
      "..PVPPPPVP......",
      "...PI....IP.....",
      "..PI......IP....",
      "..I........I....",
      "................",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      ".....PPPPPP.....",
      "....PVRRRRVP....",
      "...PVRYYYRVP....",
      "..PVPVVRRVVP....",
      "..PVIVVVIVVP....",
      "...PVPPPPVP.....",
      "....PI....IP....",
      "...PI......IP...",
      "...I........I...",
      "................",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      "....PPPPPP......",
      "...PVRRCCVP.....",
      "..PVRYWWYRVP....",
      ".PVPVVRRVVP.....",
      ".PVIVVVIVVP.....",
      "..PVPPPPVP......",
      "...PI....IP.....",
      "..PI......IP....",
      "..I........I....",
      "................",
      "................",
      "................",
      "................",
    ],
  ],
  DRAGON_PAL
);

const DRAKY_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      "....P....P......",
      "...PWI..IWP.....",
      "..PWIKKKIWP.....",
      "...PWWIWIWP.....",
      "....PWPPWP......",
      ".....PRRP.......",
      "......PP........",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      "......II........",
      "..P..PWWWP......",
      ".PWIKKKKIWP.....",
      "..PWIIWIWP......",
      "...PWPPWP.......",
      "....PRRP........",
      ".....PP.........",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
  ],
  DRAKY_PAL
);

const PAC_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      "......ppppp.....",
      "....ppppppppp...",
      "...ppppppppppp..",
      "...ppppppppppp..",
      "..ppppppppppppp.",
      "..ppppppppppppp.",
      "..ppppppppppppp.",
      "..ppppppppppppp.",
      "..ppppppppppppp.",
      "...ppppppppppp..",
      "...ppppppppppp..",
      "....ppppppppp...",
      "......ppppp.....",
    ],
    [
      "................",
      "......ppppp.....",
      "....ppppppppp...",
      "...ppppppppppp..",
      "...ppppppppppp..",
      "..pppppppppp....",
      "..pppppppp......",
      "..ppppppp.......",
      "..pppppppp......",
      "..pppppppppp....",
      "...ppppppppppp..",
      "...ppppppppppp..",
      "....ppppppppp...",
      "......ppppp.....",
    ],
    [
      "................",
      "......ppppp.....",
      "....ppppppppp...",
      "...ppppppppp....",
      "...pppppppp.....",
      "..pppppppp......",
      "..ppppppp.......",
      "..ppppppp.......",
      "..ppppppp.......",
      "..pppppppp......",
      "...pppppppp.....",
      "...ppppppppp....",
      "....ppppppppp...",
      "......ppppp.....",
    ],
  ],
  PAC_HOM_PAL
);

const GHOST_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      ".....RRRRR......",
      "....RRRRRRRR....",
      "...RRRRRRRRRR...",
      "..RRRRRRRRRRRR..",
      ".RRRRRRRRRRRRR..",
      ".RRRRRRRRRRRRR..",
      ".RRWWRRRRWWRRR..",
      ".RRWWBBRRWWBBRR.",
      ".RRRRRRRRRRRRR..",
      ".RRRRRRRRRRRRR..",
      "..RRRRRRRRRRRR..",
      "..R.R....R.R....",
      "................",
    ],
    [
      "................",
      ".....RRRRR......",
      "....RRRRRRRR....",
      "...RRRRRRRRRR...",
      "..RRRRRRRRRRRR..",
      ".RRRRRRRRRRRRR..",
      ".RRRRRRRRRRRRR..",
      ".RRWWRRRRWWRRR..",
      ".RRWWBBRRWWBBRR.",
      ".RRRRRRRRRRRRR..",
      ".RRRRRRRRRRRRR..",
      "..RRRRRRRRRRRR..",
      "...RR....RR.....",
      "................",
    ],
  ],
  GHOST_HOM_PAL
);

const GALAGA_WANDERER_FRAMES = wandererFrames(
  [
    [
      "................",
      "................",
      "......RRR.......",
      ".......B........",
      ".....RBWRB......",
      "....RBWWWBWR....",
      "...RBBWWWWBBR...",
      "....RBWWWBWR....",
      ".....RBWRB......",
      ".......B........",
      ".......R........",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      "................",
      "......RRR.......",
      ".......B........",
      ".....RBWRB......",
      "....RBWBWBWR....",
      "...RBBWWWWBBR...",
      "....RBWBWBWR....",
      ".....RBWRB......",
      ".......B........",
      "......RRR.......",
      "................",
      "................",
      "................",
    ],
  ],
  GALAGA_PAL
);

export const HOMAGE_SPRITES: Record<HomageId, HomageSprite> = {
  mario: {
    id: "mario",
    label: "Plumber Hero",
    /** 16×14 — border runner (Link footprint @ 2.5) */
    frames: MARIO_WANDERER_FRAMES,
  },

  invader: {
    id: "invader",
    label: "Space Critter",
    frames: INVADER_WANDERER_FRAMES,
  },

  link: {
    id: "link",
    label: "Elf Swordsman",
    frames: LINK_WANDERER_FRAMES,
  },

  dqhero: {
    id: "dqhero",
    label: "Dragon Quest Hero",
    /** DQ1風・16×14（徘徊キャラと同じ 2.5 倍率） */
    frames: DQ_HERO_FRAMES,
  },

  maou: {
    id: "maou",
    label: "Demon King",
    /** DQ1魔王（人型）風・16×14 */
    frames: DQ_MAOU_FRAMES,
  },

  dragon: {
    id: "dragon",
    label: "Demon Dragon",
    frames: DRAGON_WANDERER_FRAMES,
  },

  ghost: {
    id: "ghost",
    label: "Blinky",
    /** 16×14 赤オバケ（ブリンキー風） */
    frames: GHOST_WANDERER_FRAMES,
  },

  pacman: {
    id: "pacman",
    label: "Chomp Hero",
    /** 16×14 正円・口開閉 3 段階 */
    frames: PAC_WANDERER_FRAMES,
  },

  slime: {
    id: "slime",
    label: "Blue Slime",
    frames: SLIME_WANDERER_FRAMES,
  },

  draky: {
    id: "draky",
    label: "Bat Fiend",
    frames: DRAKY_WANDERER_FRAMES,
  },

  goomba: {
    id: "goomba",
    label: "Goomba Foe",
    frames: GOOMBA_WANDERER_FRAMES,
  },

  galaga: {
    id: "galaga",
    label: "Galaxian Fighter",
    /** ギャラクシアン風・赤青白・16×14 機首上向き */
    frames: GALAGA_WANDERER_FRAMES,
  },

  yoshi: {
    id: "yoshi",
    label: "Dino Buddy",
    frames: YOSHI_WANDERER_FRAMES,
  },

  ufo: {
    id: "ufo",
    label: "Silver Flying Saucer",
    /** 銀メタリック円盤・2コマ点滅 */
    frames: UFO_GALAGA_FRAMES,
  },

  /** RX-78風ガンダム・16×14（Link 基準 @ 2.5） */
  guncore: {
    id: "guncore",
    label: "RX Gundam",
    frames: GUNCORE_FRAMES,
  },

  /** シャア専用ザク・16×14（Link 基準 @ 2.5） */
  greengrunt: {
    id: "greengrunt",
    label: "Char's Zaku",
    frames: GREENGRUNT_FRAMES,
  },
};

export function homageFrames(id: HomageId): string[][][] {
  return HOMAGE_SPRITES[id].frames;
}

export const HOMAGE_IDS: HomageId[] = [
  "mario",
  "invader",
  "link",
  "dqhero",
  "yoshi",
  "goomba",
  "dragon",
  "maou",
  "pacman",
  "ghost",
  "slime",
  "draky",
  "galaga",
  "ufo",
  "guncore",
  "greengrunt",
];

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
  swordSpark: [
    [T, T, T, "#FFFFFF", T, T],
    [T, T, "#E8E8E8", "#FFFFFF", "#C0C0C0", T],
    [T, "#C0C0C0", "#FFFFFF", "#FFFFAA", "#FFFFFF", "#C0C0C0"],
    [T, T, "#E8E8E8", "#FFFFFF", "#C0C0C0", T],
    [T, T, T, "#FFFFFF", T, T],
  ] as string[][],
  /** キャラから横に伸ばす細い剣（左端＝柄・1px厚の刃） */
  swordStick: [
    ["#5C4033", "#6B5345", "#A8A8A8", "#D8D8D8", "#FFFFFF", "#F4F4FF", "#C8C8C8", "#909090"],
  ] as string[][],
  /** 右向き：口元はスプライト中心より右 */
  fireBreath: [
    [T, T, T, "#FF6600", "#FFAA00", "#FFCC00", "#FFAA00", T, T, T],
    [T, T, "#FF4400", "#FFCC00", "#FFFF66", "#FFFFAA", "#FF6600", "#FF4400", T, T],
    [T, "#FF4400", "#FFCC00", "#FFFF66", "#FFFFAA", "#FFFF66", "#FFAA00", "#FF6600", T, T],
    [T, T, "#FF4400", "#FFCC00", "#FFFF66", "#FFFFAA", "#FF6600", "#FF4400", T, T],
    [T, T, T, "#FF6600", "#FFAA00", "#FFCC00", "#FFAA00", T, T, T],
  ] as string[][],
};
