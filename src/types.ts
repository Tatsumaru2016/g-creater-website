/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PixelCharacter {
  id: string;
  name: string;
  x: number; // percentage width of screen (0-100)
  y: number; // percentage height of screen (0-100)
  targetX: number;
  targetY: number;
  state: 'idle' | 'walk' | 'jump' | 'action' | 'victory';
  facing: 'left' | 'right';
  spriteType: 'mario' | 'link' | 'megaman' | 'sonic' | 'pacman' | 'ghost' | 'invader';
  dialogue?: string;
  speed: number;
  scale?: number;
}

export interface PixelFrame {
  id: string;
  name: string;
  pixels: string[]; // array of colors, size gridWidth * gridHeight
}

export interface PixelLayer {
  id: string;
  name: string;
  opacity: number; // 0 to 1
  visible: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
}

export interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  alpha: number;
}

export interface ToolConfig {
  id: string;
  name: string;
  iconName: string;
  shortcut: string;
  description: string;
}
