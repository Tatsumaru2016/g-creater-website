export type ToolMode = "pen" | "eraser" | "bucket" | "picker" | "line" | "circle" | "rect";

export type SymmetryMode = "none" | "horizontal" | "vertical" | "radial" | "dual";

export interface PixelArtData {
  name: string;
  pixels: string[][]; // 2D array of colors (strings)
  palette: string[];
  explanation?: string;
}

export interface AnimationFrame {
  id: number;
  pixels: string[][];
  tag?: string; // e.g. "idle" | "walk" | "attack"
}

export interface CharacterAnimation {
  name: string;
  author: string;
  frames: AnimationFrame[];
  tags: string[]; // list of animations available
  currentTag: string;
}

export interface Layer {
  id: number;
  name: string;
  visible: boolean;
  opacity: number;
  pixels: string[][];
}

export interface AppLayerIndex {
  id: number;
  name: string;
  tagline: string;
  icon: string;
  color: string;
}
