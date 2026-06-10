/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CHARACTER_BASE_SCALE,
  WANDERER_SPRITE_SCALE,
} from '../constants/characterSpriteScale';
import { PixelCharacter } from '../types';

// Let's define the color palette map for sprites
const COLOR_MAP: Record<string, string> = {
  '.': 'transparent',
  'R': '#EF4444', // Red
  'G': '#22C55E', // Green
  'B': '#3B82F6', // Blue
  'Y': '#EAB308', // Yellow
  'p': '#FFFF00', // Pac-Man yellow
  'S': '#FED7AA', // Skin
  'K': '#1A1A1A', // Dark body/outline
  'W': '#FFFFFF', // White
  'O': '#F97316', // Orange
  'D': '#1D4ED8', // Dark Blue
  'M': '#FF00AA', // Arcade ghost pink (Pac-Man homage)
  'C': '#06B6D4', // Cyan
  'P': '#A855F7', // Purple
  'b': '#78350F', // Brown
  'u': '#5C3317', // Dark brown (ice climber boots)
  'n': '#FF3399', // Ice climber pink parka
  'l': '#FF66AA', // Pink parka highlight
  't': '#FFAD60', // Tan skin (ice climber)
  'g': '#1B5E20', // Dark green belt
  'm': '#FF88BB', // Cheek blush
  'h': '#8B5A2B', // Mallet handle (wood)
  'H': '#C07030', // Mallet head (wood)
  'r': '#E09040', // Mallet highlight
};

// 12x12 or 16x16 frames for classic retro characters
export const SPRITE_FRAMES: Record<string, Record<string, string[]>> = {
  mario: {
    idle: [
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
    walk: [
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
    walk2: [
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
    jump: [
      "....RRRRR.......",
      "...RRRRRRRRR....",
      "...bbbSSbS......",
      "..bbSbSSbSSS....",
      "..bbSbbSSbSKS...",
      "....SSb...S.....",
      "....SSSSSSS.....",
      "...RRRBRRBR.....",
      "....RRBBBRRR....",
      "...RRRBYYBRRR...",
      "...R..BBBB..R...",
      "......BBB.......",
      ".....bbb........",
      "....bbb.........",
    ],
    victory: [
      "......RRRRR.....",
      ".....RRRRRRRRR..",
      ".....bbbSSbS....",
      "....bbSbSSbSSS..",
      "....bbSbbSSbSKS.",
      "....bbSSb...S...",
      "......SSSSSSS...",
      ".....RRBRRBRR...",
      "..Y.RRRBRRBRRR..",
      "..YRRRRBBBBRRRR.",
      "...Y..RBYYBR..S.",
      "......BBBBBB....",
      ".....BBB..BBB...",
      "....bbb....bbb..",
    ]
  },
  link: {
    idle: [
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
    walk: [
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
    jump: [
      "....GGGGGG......",
      "...GGGGGGGGG....",
      "..GGYYYYYGGGG...",
      ".bBYSSYSSYBBb...",
      ".bBSSYSSYSSBb...",
      "..BSKKSSKKSS....",
      "...SSSSSSSS.....",
      "....GGGGGG.Y....",
      "....GGRRGG.Y....",
      "....GGRRGG.Y....",
      "...GGRRRRGGb....",
      "..GGRR..RRGG....",
      "..bG......bG....",
      ".bbb......bbb...",
    ],
    victory: [
      "....GGGGGG......",
      "...GGGGGGGGG....",
      "..GGYYYYYGGGG...",
      ".bBYSSYSSYBBb...",
      ".bBSSYSSYSSBb...",
      "..BSKKSSKKSS....",
      "...SSSSSSSS.YY..",
      "....GGGGGG..YY..",
      "..Y.GGRRGG..bb..",
      "..YGGGGGGGG.bb..",
      "..YY.GGRRGG..B..",
      ".....GGRRGG.....",
      ".....bG..bG.....",
      "....bbb..bbb....",
    ]
  },
  sonic: {
    idle: [
      "....DDDDD.......",
      "...DDDDDDDDD....",
      "..DDWWSWWSDD....",
      ".DDWKSWKSWSDD...",
      ".DDWKSWKSWSDD...",
      "..DDKSSSKSSD....",
      "...WWSSSWW......",
      "....DDDDDD......",
      "...DDWWDWDD.....",
      "..DDDWWDWDD.....",
      ".DDWWDWWWWDD....",
      "....WWSSWW......",
      "...RRR..RRR.....",
      "..RRRR..RRRR....",
    ],
    walk: [
      "....DDDDD.......",
      "...DDDDDDDDD....",
      "..DDWWSWWSDD....",
      ".DDWKSWKSWSDD...",
      "..DDKSSSKSSD....",
      "...WWSSSWW......",
      "....DDDDDDD.....",
      "...DDWWDWDD.....",
      "..DDDWWDWDD.....",
      "....WWDWWWW.....",
      "....WW..WWDD....",
      "...RR....RRR....",
      "..RRR.....RR....",
      "................",
    ],
    jump: [
      ".....DDDD.......",
      "...DDDDDDDD.....",
      "..DDDDDDDDDD....",
      ".DDDDDDDDDDDD...",
      ".DDWWDDWWDDDD...",
      ".DDWWDDWWDDDD...",
      "..DDDDDDDDDD....",
      "...DDDDDDDD.....",
      "....DDDDDD......",
      ".....DDDD.......",
      "......DD........",
      ".....RRR........",
      "....RRR.........",
      "................",
    ],
    victory: [
      "....DDDDD.......",
      "...DDDDDDDDD....",
      "..DDWWSWWSDD.Y..",
      ".DDWKSWKSWSDD.Y.",
      ".DDWKSWKSWSDDDY.",
      "..DDKSSSKSSDDYY.",
      "...WWSSSWW..YY..",
      "....DDDDDD..b...",
      "...DDWWDWDD.b...",
      "..DDDWWDWDD.RR..",
      ".DDWWDWWWWDD....",
      "....WWSSWW......",
      "...RRR..RRR.....",
      "..RRRR..RRRR....",
    ]
  },
  megaman: {
    idle: [
      "....CCCCC.......",
      "...CCCCCCCCC....",
      "..CCWWKWWKCC....",
      "..CCKSSKSSCC....",
      "..CCKSSKSSCC....",
      "..CCKSSSKSSCC...",
      "....SSSSSSC.....",
      "....CCCCCC......",
      "...CCCCCCCCC....",
      "..CCCCCCCCC.....",
      "..CCCCCCCCCC....",
      "....CCCCCC......",
      "...DDD..DDD.....",
      "..DDDD..DDDD....",
    ],
    walk: [
      "....CCCCC.......",
      "...CCCCCCCCC....",
      "..CCWWKWWKCC....",
      "..CCKSSKSSCC....",
      "..CCKSSSKSSCC...",
      "....SSSSSSC.....",
      "....CCCCCC......",
      "...CCCCCCCCC....",
      "...CCCCCCCCC....",
      "....CCCCCCC.....",
      "....CCC.CCC.....",
      "....DDD.DDD.....",
      "...DDD...DDD....",
      "..DDDD..DDDD....",
    ],
    jump: [
      "....CCCCC.......",
      "...CCCCCCCCC....",
      "..CCWWKWWKCC....",
      "..CCKSSKSSCC....",
      "..CCKSSSKSSCC...",
      "....SSSSSSC.....",
      "....CCCCCC......",
      "...CCCCCCCCC...",
      "..CCCCCCCCC.....",
      "..CC.CCCC.CC....",
      "..D..CCCC..D....",
      ".....DDD........",
      "....DDD.........",
      "...DDDD.........",
    ],
    victory: [
      "....CCCCC.......",
      "...CCCCCCCCC....",
      "..CCWWKWWKCC.C..",
      "..CCKSSKSSCC.C..",
      "..CCKSSSKSSCCC..",
      "....SSSSSSCCCC..",
      "....CCCCCC.CCC..",
      "...CCCCCCCCC....",
      "..CCCCCCCCC.....",
      "..CCCCCCCCCC....",
      "....CCCCCC......",
      "...DDD..DDD.....",
      "..DDDD..DDDD....",
      "................",
    ]
  },
  pacman: {
    /** 正円・中心から右へ扇形に口が開く（回転で向き転換） */
    idle: [
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
    /** 口半開き */
    jump: [
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
    /** 口大開き */
    walk: [
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
    victory: [
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
  },
  ghost: {
    /** パックマン風赤オバケ — 白目・青瞳（右向き）・裾ギザギザ */
    idle: [
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
    walk: [
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
    jump: [
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
    victory: [
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
  },
  invader: {
    idle: [
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
    walk: [
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
    jump: [
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
    victory: [
      "................",
      "....PP.....PP...",
      ".....PP...PP....",
      ".....PPPPPP.....",
      "....PPKPPKPP....",
      "...PPPPPPPPPP...",
      "...PKPPPPPPKP...",
      "....PP.PP.PP....",
      ".....PP...PP....",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
  },
  slime: {
    idle: [
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
    walk: [
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
    jump: [
      "................",
      ".....GGGGGG.....",
      "...GGGGGGGGGG...",
      "..GGGGGGGGGGGG..",
      ".GGGWWKKWWGGGGG.",
      ".GGGGGGGGGGGGGG.",
      ".GGGGGGGGGGGGGG.",
      "..GGGGGGGGGGGG..",
      "...GGGGGGGGG....",
      "....GGG..GGG....",
      "................",
      "................",
      "................",
      "................",
    ],
    victory: [
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
      "................",
    ],
    munch: [
      "................",
      "................",
      ".GGGGGGGGGGGGGG.",
      "GGGGGGGGGGGGGGGG",
      "GGGWWWWKKWWWWGGG",
      "GGGGGGGGGGGGGGGG",
      ".GGGGGGGGGGGGGG.",
      "..GGGG....GGGG..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
    munch2: [
      "................",
      "................",
      "....GGGGGG......",
      "...GGGGGGGGG....",
      "..GGGGGGGGGGG...",
      ".GGGWWKKWWGGGG..",
      ".GGGGGGGGGGGGGG.",
      ".GGGGGGGGGGGGGG.",
      "..GGGGGGGGGGGG..",
      "...GGG....GGG...",
      "....GG....GG....",
      "................",
      "................",
      "................",
    ],
  },
  /** アイスクライマー — Link 同型横顔・ピンクパーカ・木槌（16×14） */
  iceClimber: {
    idle: [
      "................",
      "....Ynnnnn......",
      "...nWWWWWWn.....",
      "..nnYYYYYnnn....",
      ".bnYSSYSSYSSnb..",
      ".bnSSYSSYSSnb...",
      "..nSKKSSKKnn....",
      "...nnnnnnnn.....",
      "....nnnnnn......",
      "...nnnggnnn.....",
      "....nnnnnn......",
      "...nnnHHhnnn....",
      "..nnn..hhhnn....",
      "..uu.....uuu....",
      ".bbb.....bbb....",
    ],
    walk: [
      "................",
      "....Ynnnnn......",
      "...nWWWWWWn.....",
      "..nnYYYYYnnn....",
      ".bnYSSYSSYSSnb..",
      ".bnSSYSSYSSnb...",
      "..nSKKSSKKnn....",
      "...nnnnnnnn.....",
      "....nnnnnn......",
      "...nnnggnnn.....",
      "....nnnnnn......",
      "...nnnHHhnnn....",
      "....nn..hhhnn...",
      "...uu....uuu....",
      "..bbb.....bbb...",
    ],
    walk2: [
      "................",
      "....Ynnnnn......",
      "...nWWWWWWn.....",
      "..nnYYYYYnnn....",
      ".bnYSSYSSYSSnb..",
      ".bnSSYSSYSSnb...",
      "..nSKKSSKKnn....",
      "...nnnnnnnn.....",
      "....nnnnnn......",
      "...nnnggnnn.....",
      "....nnnnnn......",
      "...nnnHHhnnn....",
      "..nnn..hhhnn....",
      "..uu.....uuu....",
      ".bbb.....bbb....",
    ],
    jump: [
      "....HHrrHH......",
      "...hhhhHHhhh....",
      "..hhHWWWWWhh....",
      "...nWWWWWWn.....",
      "..nnYYYYYnnn....",
      ".bnYSSYSSYSSnb..",
      ".bnSSYSSYSSnb...",
      "..nSKKSSKKnn....",
      "...nnnnnnnn.....",
      "....nnnnnn......",
      "...nnn..nnn.....",
      "..nnn....nnn....",
      "..uu.....uuu....",
      ".bbb.....bbb....",
    ],
    victory: [
      "....Ynnnnn......",
      "...nWWWWWWn.....",
      "..nnYYYYYnnn....",
      ".bnYSSYSSYSSnb..",
      ".bnSSYSSYSSnb...",
      "..nSKKSSKKnn....",
      "...nnnnnnnn.....",
      "....nnnnnn......",
      "....nnHHHHHH....",
      "...nnnHHHHHHh...",
      "..nnn..hhhhhh...",
      "..uu.....uuu....",
      ".bbb.....bbb....",
      "................",
    ],
  },
};

export interface CharacterMovementOptions {
  dialogues: string[];
  hopLine?: string;
}

interface SpriteProps {
  type: 'mario' | 'link' | 'megaman' | 'sonic' | 'pacman' | 'ghost' | 'invader' | 'slime' | 'iceClimber';
  state: 'idle' | 'walk' | 'walk2' | 'jump' | 'victory' | 'action' | 'munch';
  facing: 'left' | 'right';
  scale?: number;
  munchPhase?: number;
}

export function CharacterSpeechBubble({ text }: { text: string }) {
  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0A0A0A]/95 border-2 border-[#00F5FF]/80 text-[#00F5FF] text-[10px] py-1 px-2 rounded-lg font-mono whitespace-nowrap shadow-[0px_4px_12px_rgba(0,245,255,0.3)] animate-bounce z-50 text-center select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      <span className="text-[8px] text-gray-500 mr-1">✦</span>
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-[#00F5FF]" />
    </div>
  );
}

/** ヘッダー：キャラ表示 ON/OFF 用ミニスライム */
export function SlimeToggleIcon({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center overflow-hidden pointer-events-none"
      style={{
        opacity: active ? 1 : 0.35,
        filter: active ? undefined : "grayscale(0.9)",
        imageRendering: "pixelated",
      }}
    >
      <RenderPixelSprite type="slime" state="idle" facing="right" scale={1} />
    </span>
  );
}

export function RenderPixelSprite({
  type,
  state,
  facing,
  scale = CHARACTER_BASE_SCALE,
  munchPhase = 0,
}: SpriteProps) {
  const frames = SPRITE_FRAMES[type];
  const activeState =
    state === "action"
      ? "victory"
      : state === "munch"
        ? munchPhase % 2 === 1 && frames?.munch2
          ? "munch2"
          : "munch"
        : state;
  const framePixels = frames?.[activeState] || frames?.["idle"] || [];

  return (
    <div 
      className="inline-block cursor-pointer select-none relative"
      style={{
        width: `${16 * scale}px`,
        height: `${14 * scale}px`,
        transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        imageRendering: 'pixelated',
      }}
    >
      <svg 
        viewBox="0 0 16 14" 
        width="100%" 
        height="100%"
        shapeRendering="crispEdges"
      >
        {framePixels.map((row, rIdx) => {
          return (
            <React.Fragment key={rIdx}>
              {row.split('').map((char, cIdx) => {
                const color = COLOR_MAP[char] || 'transparent';
                if (color === 'transparent') return null;
                return (
                  <rect 
                    key={cIdx} 
                    x={cIdx} 
                    y={rIdx} 
                    width="1.05" 
                    height="1.05" 
                    fill={color} 
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}

interface CharactersViewProps {
  characters: PixelCharacter[];
  onTriggerAction: (id: string) => void;
}

export function RoamingCharacters({ characters, onTriggerAction }: CharactersViewProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {characters.map((char) => {
        return (
          <div
            key={char.id}
            id={`char-${char.id}`}
            className="absolute transition-all duration-300 ease-out pointer-events-auto"
            style={{
              left: `${char.x}%`,
              top: `${char.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => onTriggerAction(char.id)}
          >
            {char.dialogue && <CharacterSpeechBubble text={char.dialogue} />}
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full group-hover:bg-cyan-500/40 transition-colors pointer-events-none" />
              <RenderPixelSprite
                type={char.spriteType}
                state={char.state}
                facing={char.facing}
                scale={char.scale || WANDERER_SPRITE_SCALE}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function generateInitialCharacters(): PixelCharacter[] {
  return [];
}

// Logic to move characters randomly
export function updateCharacterMovement(
  chars: PixelCharacter[],
  options?: CharacterMovementOptions
): PixelCharacter[] {
  const dialogues = options?.dialogues ?? [];
  const hopLine = options?.hopLine ?? "Boing!";

  return chars.map((char) => {
    let nextState = char.state;
    let nextFacing = char.facing;
    let nextX = char.x;
    let nextY = char.y;
    let nextDialogue = char.dialogue;

    // Tick down dialogue or remove it
    if (nextDialogue && Math.random() < 0.05) {
      nextDialogue = undefined;
    }

    // Occassionally change targets or jump
    const isStationary = char.x === char.targetX && char.y === char.targetY;

    if (isStationary) {
      if (Math.random() < 0.03) {
        // Find new target within safe boundaries
        const rx = 10 + Math.random() * 80;
        const ry = 60 + Math.random() * 30; // Roam mostly in lower areas of the screen
        
        return {
          ...char,
          targetX: rx,
          targetY: ry,
          state: 'walk',
          facing: rx > char.x ? 'right' : 'left',
          dialogue:
            dialogues.length > 0 && Math.random() < 0.15
              ? dialogues[Math.floor(Math.random() * dialogues.length)]
              : char.dialogue,
        };
      } else if (Math.random() < 0.01) {
        // Flap / jump in place
        return {
          ...char,
          state: 'jump',
          dialogue: char.dialogue || (Math.random() < 0.2 ? hopLine : undefined),
        };
      } else {
        return {
          ...char,
          state: 'idle',
          dialogue: nextDialogue,
        };
      }
    } else {
      // Move towards target
      const dx = char.targetX - char.x;
      const dy = char.targetY - char.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < char.speed) {
        nextX = char.targetX;
        nextY = char.targetY;
        nextState = 'idle';
      } else {
        nextX += (dx / dist) * char.speed;
        nextY += (dy / dist) * char.speed;
        nextState = 'walk';
        nextFacing = dx > 0 ? 'right' : 'left';
      }
    }

    return {
      ...char,
      x: nextX,
      y: nextY,
      state: nextState,
      facing: nextFacing,
      dialogue: nextDialogue,
    };
  });
}
