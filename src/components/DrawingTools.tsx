/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trash, Columns, Sparkles, Wand2 } from 'lucide-react';
import { useI18n } from '../i18n';

const SYM_GRID_SIZE = 12;

const TOOL_IDS = ['pen', 'symmetry', 'shapes', 'eraser', 'transform', 'straight'] as const;
const TOOL_SHORTCUTS: Record<(typeof TOOL_IDS)[number], string> = {
  pen: 'P', symmetry: 'S', shapes: 'G', eraser: 'E', transform: 'T', straight: 'L',
};

export function DrawingTools() {
  const { t } = useI18n();
  const [symType, setSymType] = useState<'mirror' | 'quad' | 'none'>('quad');
  const [pixels, setPixels] = useState<string[]>(() => Array(SYM_GRID_SIZE * SYM_GRID_SIZE).fill('.'));
  const [activeColor, setActiveColor] = useState('#00F5FF');
  const [isDrawing, setIsDrawing] = useState(false);
  const [symmetryHoverId, setSymmetryHoverId] = useState<string | null>(null);

  // Auto-demonstration animation when idle
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      if (isDrawing) return;
      // Draw symmetrical dots
      tick++;
      const cycle = tick % 8;
      if (cycle === 0) {
        // Clear board periodically
        setPixels(Array(SYM_GRID_SIZE * SYM_GRID_SIZE).fill('.'));
      } else {
        // Draw randomized dot
        const cx = 2 + Math.floor(Math.random() * 4); // Keep in quadrant
        const cy = 2 + Math.floor(Math.random() * 4);
        drawSymmetryPixel(cy * SYM_GRID_SIZE + cx, '#FFE600');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [symType, isDrawing]);

  const drawSymmetryPixel = (idx: number, color: string) => {
    setPixels((prev) => {
      const next = [...prev];
      const row = Math.floor(idx / SYM_GRID_SIZE);
      const col = idx % SYM_GRID_SIZE;

      // Primary draw
      next[idx] = color;

      if (symType === 'mirror' || symType === 'quad') {
        // Mirror horizontally
        const mirrorCol = SYM_GRID_SIZE - 1 - col;
        const mirrorIdxH = row * SYM_GRID_SIZE + mirrorCol;
        next[mirrorIdxH] = color;
      }

      if (symType === 'quad') {
        // Mirror vertically
        const mirrorRow = SYM_GRID_SIZE - 1 - row;
        const mirrorIdxV = mirrorRow * SYM_GRID_SIZE + col;
        next[mirrorIdxV] = color;

        // Diagonal mirror
        const mirrorCol = SYM_GRID_SIZE - 1 - col;
        const mirrorIdxDiag = mirrorRow * SYM_GRID_SIZE + mirrorCol;
        next[mirrorIdxDiag] = color;
      }

      return next;
    });
  };

  const handleCellClick = (idx: number) => {
    const isEraser = pixels[idx] !== '.';
    const drawColor = isEraser ? '.' : activeColor;
    drawSymmetryPixel(idx, drawColor);
  };

  const clearCanvas = () => {
    setPixels(Array(SYM_GRID_SIZE * SYM_GRID_SIZE).fill('.'));
  };

  return (
    <div id="scene-drawing-tools" className="flex flex-col lg:flex-row gap-8 items-center max-w-6xl mx-auto px-4 md:px-8 py-4">
      
      {/* LEFT: Live Symmetrical Drawing Playground */}
      <div className="flex-1 w-full flex flex-col gap-4 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00F5FF]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div id="scene-panel-1" data-scene-panel className="bg-[#07070A]/95 border-2 border-white/10 rounded-2xl p-5 shadow-[0_0_40px_rgba(255,255,255,0.03)] backdrop-blur-md relative overflow-visible group">
          <div className="absolute top-0 right-0 p-3 flex gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#00F5FF]/30 text-[#00F5FF] bg-[#00F5FF]/10 animate-pulse">
              {t("drawing.liveMirror")}
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-mono text-white mb-1 flex items-center gap-2">
              <Columns className="w-4 h-4 text-cyan-400" /> {t("drawing.symmetryLab")}
            </h3>
            <p className="text-[11px] font-mono text-gray-400">
              {t("drawing.symmetryDesc")}
            </p>
          </div>

          {/* Interactive Symmetry Toggle */}
          <div className="flex gap-2 mb-4">
            {(['none', 'mirror', 'quad'] as const).map((type) => {
              const active = symType === type;
              return (
                <button
                  id={`btn-sym-${type}`}
                  key={type}
                  onClick={() => setSymType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-all ${
                    active 
                      ? 'border-[#00F5FF] text-[#00F5FF] bg-[#00F5FF]/10 shadow-[0_0_8px_rgba(0,245,255,0.2)]' 
                      : 'border-white/10 text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type === 'none' && t("drawing.symNone")}
                  {type === 'mirror' && t("drawing.symMirror")}
                  {type === 'quad' && t("drawing.symQuad")}
                </button>
              );
            })}
            <button
              id="btn-sym-clear"
              onClick={clearCanvas}
              className="px-3 py-1.5 rounded-lg text-xs font-mono border border-red-500/20 text-red-400 hover:bg-red-500/5 ml-auto cursor-pointer flex items-center gap-1.5"
            >
              <Trash className="w-3.5 h-3.5" /> {t("common.clear")}
            </button>
          </div>

          {/* Symmetrical Grid layout */}
          <div className="flex justify-center my-2 select-none">
            <div 
              className="grid aspect-square border-2 border-dashed border-white/5 bg-black/60 rounded-xl relative p-3"
              style={{
                gridTemplateColumns: `repeat(${SYM_GRID_SIZE}, minmax(0, 1fr))`,
                width: '100%',
                maxWidth: '280px',
              }}
              onMouseDown={() => setIsDrawing(true)}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
            >
              {/* Virtual Mirror guidelines overlay */}
              {(symType === 'mirror' || symType === 'quad') && (
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-400/30 border-r border-dashed border-cyan-400/40 pointer-events-none" />
              )}
              {symType === 'quad' && (
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-400/30 border-b border-dashed border-cyan-400/40 pointer-events-none" />
              )}
              
              {pixels.map((color, idx) => {
                const bg = color === '.' ? 'bg-transparent' : '';
                return (
                  <div
                    id={`sym-cell-${idx}`}
                    key={idx}
                    onMouseDown={() => handleCellClick(idx)}
                    onMouseEnter={() => {
                      if (isDrawing) handleCellClick(idx);
                      setSymmetryHoverId(idx.toString());
                    }}
                    onMouseLeave={() => setSymmetryHoverId(null)}
                    className={`w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] border border-white/[0.03] transition-colors duration-100 hover:bg-white/5 cursor-pointer ${bg}`}
                    style={{
                      backgroundColor: color !== '.' ? color : undefined,
                      boxShadow: color !== '.' ? `0 0 4px ${color}` : 'none'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Quick colors */}
          <div className="flex justify-center gap-2 mt-2">
            {['#00F5FF', '#FF00AA', '#39FF14', '#FFE600'].map((col) => (
              <button
                id={`sym-color-${col.replace('#', '')}`}
                key={col}
                onClick={() => setActiveColor(col)}
                className="w-5 h-5 rounded-full relative cursor-pointer hover:scale-110 active:scale-95 border border-white/10"
                style={{ backgroundColor: col }}
              >
                {activeColor === col && (
                  <span className="absolute inset-0.5 rounded-full border border-black" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Floating Holographic Tool Specs */}
      <div className="flex-1 w-full flex flex-col gap-3">
        <h2 className="text-xl md:text-2xl font-sans tracking-tight text-white font-bold flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-cyan-400 animate-pulse" /> {t("drawing.precisionEngine")}
        </h2>
        <p className="text-xs font-mono text-gray-400 leading-relaxed max-w-lg mb-2">
          {t("drawing.precisionDesc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOL_IDS.map((toolId) => (
            <div
              id={`tool-card-${toolId}`}
              key={toolId}
              className="bg-[#09090C] border border-white/[0.06] hover:border-[#00F5FF]/30 p-4 rounded-xl transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,245,255,0.05)] group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-sans font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {t(`drawing.tools.${toolId}.name`)}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-500 group-hover:border-cyan-500/20 group-hover:text-cyan-400 transition-all">
                    {TOOL_SHORTCUTS[toolId]}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-gray-500 leading-normal mb-1">
                  {t(`drawing.tools.${toolId}.desc`)}
                </p>
              </div>
              <div className="text-[9px] font-mono text-[#00F5FF]/80 mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> {t(`drawing.tools.${toolId}.spec`)}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
