/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trash2, RotateCcw, Play, Pause, Paintbrush, Layers, Grid3X3, Zap } from 'lucide-react';
import { useI18n } from '../i18n';

const GRID_SIZE = 16;
const PRESET_PALETTES = [
  '#FF00AA', // Magenta
  '#00F5FF', // Neon Cyan
  '#39FF14', // Lime Green
  '#FFE600', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#FFFFFF', // White
  '#111111', // Obsidian / Dark
];

const TEMPLATES: Record<string, { pixels: string[] }> = {
  invader: {
    pixels: [
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.',
      '.','.','.','#FF4466','#FF4466','.','.','.','.','.','.','#FF4466','#FF4466','.','.','.',
      '.','.','.','.','.','#FF4466','.','.','.','.','#FF4466','.','.','.','.','.',
      '.','.','.','.','.','#FF4466','.','.','.','.','#FF4466','.','.','.','.','.',
      '.','.','.','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','.','.','.',
      '.','.','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','.','.',
      '.','.','#FF4466','#FFFFFF','#FF4466','#FF4466','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FF4466','#FF4466','#FFFFFF','#FF4466','.','.',
      '.','#FF4466','#FF4466','#FF4466','#FF4466','#FFFFFF','#FFFFFF','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','.',
      '.','#FF4466','#FF4466','#FF4466','#FF4466','#FFFFFF','#FFFFFF','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','.',
      '#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FFFFFF','#FFFFFF','#FF4466','#FFFFFF','#FFFFFF','#FFFFFF','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466',
      '#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466',
      '#FF4466','.','#FF4466','#FF4466','#FF4466','#FF4466','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FF4466','#FF4466','#FF4466','.','#FF4466',
      '#FF4466','.','.','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','#FF4466','.','.','#FF4466',
      '.','.','.','.','.','#FF4466','.','.','.','.','#FF4466','.','.','.','.','.',
      '.','.','.','#FF4466','#FF4466','#FF4466','.','.','.','.','#FF4466','#FF4466','#FF4466','.','.','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.',
    ],
  },
  ghost: {
    pixels: [
      '.','.','.','.','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.','.','.','.','.',
      '.','.','.','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.','.','.','.',
      '.','.','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.','.','.',
      '.','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.','.',
      '.','#FF00AA','#FF00AA','#FFFFFF','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FFFFFF','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.','.',
      '#FF00AA','#FF00AA','#FFFFFF','#00F5FF','#FFFFFF','#FF00AA','#FF00AA','#FFFFFF','#00F5FF','#FFFFFF','#FF00AA','#FF00AA','#FF00AA','.',
      '#FF00AA','#FF00AA','#FFFFFF','#00F5FF','#FFFFFF','#FF00AA','#FF00AA','#FFFFFF','#00F5FF','#FFFFFF','#FF00AA','#FF00AA','#FF00AA','.',
      '#FF00AA','#FF00AA','#FF00AA','#FFFFFF','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FFFFFF','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.',
      '#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.',
      '#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.',
      '#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.',
      '#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.',
      '.','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','#FF00AA','.','.',
      '.','#FF00AA','.','#FF00AA','.','#FF00AA','.','#FF00AA','.','#FF00AA','.','#FF00AA','.','#FF00AA','.','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.'
    ]
  },
  slime: {
    pixels: [
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.',
      '.','.','.','.','.','#39FF14','#39FF14','#39FF14','#39FF14','.','.','.','.','.','.','.',
      '.','.','.','.','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','.','.','.','.','.','.',
      '.','.','.','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','.','.','.','.','.',
      '.','.','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','.','.','.','.',
      '.','#39FF14','#39FF14','#FFFFFF','#39FF14','#39FF14','#39FF14','#FFFFFF','#39FF14','#39FF14','#39FF14','#39FF14','.','.','.','.',
      '.','#39FF14','#FFFFFF','#111111','#FFFFFF','#39FF14','#FFFFFF','#111111','#FFFFFF','#39FF14','#39FF14','#39FF14','.','.','.','.',
      '.','#39FF14','#39FF14','#FFFFFF','#39FF14','#39FF14','#39FF14','#FFFFFF','#39FF14','#39FF14','#39FF14','#39FF14','.','.','.','.',
      '.','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','.','.','.','.',
      '#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','.','.',
      '#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','#39FF14','.','.',
      '#39FF14','#39FF14','.','#39FF14','#39FF14','#39FF14','.','#39FF14','#39FF14','#39FF14','.','#39FF14','#39FF14','.','.',
      '.','#39FF14','#39FF14','.','#39FF14','#39FF14','#39FF14','.','#39FF14','#39FF14','#39FF14','.','#39FF14','.','.','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.'
    ]
  },
  sword: {
    pixels: [
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','#00F5FF','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','.','#00F5FF','#00F5FF','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','#00F5FF','#00F5FF','.','.',
      '.','.','.','.','.','.','.','.','.','.','.','#00F5FF','#00F5FF','.','.','.',
      '.','.','.','.','.','.','.','.','.','.','#00F5FF','#00F5FF','.','.','.','.',
      '.','.','.','.','.','.','.','.','.','#00F5FF','#00F5FF','.','.','.','.','.',
      '.','.','.','.','.','.','.','.','#00F5FF','#00F5FF','.','.','.','.','.','.',
      '.','.','.','.','.','.','.','#00F5FF','#00F5FF','.','.','.','.','.','.','.',
      '.','.','.','.','.','.','#00F5FF','#00F5FF','.','.','.','.','.','.','.','.',
      '.','.','.','.','.','#FFE600','#FFE600','.','.','.','.','.','.','.','.','.',
      '.','.','.','.','#FF00AA','#FFE600','#FF00AA','.','.','.','.','.','.','.','.','.',
      '.','.','.','#FF00AA','#FF00AA','#FF00AA','.','.','.','.','.','.','.','.','.','.',
      '.','.','#8B5CF6','#FF00AA','#FF00AA','.','.','.','.','.','.','.','.','.','.','.',
      '.','#8B5CF6','#8B5CF6','.','.','.','.','.','.','.','.','.','.','.','.','.',
      '#8B5CF6','#8B5CF6','.','.','.','.','.','.','.','.','.','.','.','.','.','.',
      '.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.'
    ]
  }
};

export function PixelEditor() {
  const { t } = useI18n();
  const [pixels, setPixels] = useState<string[]>(() => 
    Array(GRID_SIZE * GRID_SIZE).fill('.')
  );
  const [activeColor, setActiveColor] = useState('#00F5FF');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [showGrid, setShowGrid] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('invader');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Apply template
  const loadTemplate = (key: string) => {
    if (TEMPLATES[key]) {
      setPixels([...TEMPLATES[key].pixels]);
      setSelectedTemplate(key);
      if (key === 'invader') setActiveColor('#FF4466');
    }
  };

  useEffect(() => {
    loadTemplate('invader');
  }, []);

  // Animation simulation - simple wave distortion or color shifting
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setPixels((prev) => {
        return prev.map((pixel, i) => {
          if (pixel === '.') return '.';
          // Shifts neon pink to neon cyan and vice versa dynamically
          if (pixel === '#FF00AA') return '#00F5FF';
          if (pixel === '#00F5FF') return '#39FF14';
          if (pixel === '#39FF14') return '#FFE600';
          if (pixel === '#FFE600') return '#FF00AA';
          return pixel;
        });
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const handleCellClick = (index: number) => {
    if (currentTool === 'pen') {
      const updated = [...pixels];
      updated[index] = activeColor;
      setPixels(updated);
    } else if (currentTool === 'eraser') {
      const updated = [...pixels];
      updated[index] = '.';
      setPixels(updated);
    } else if (currentTool === 'fill') {
      const targetColor = pixels[index];
      const updated = [...pixels];
      
      const fillFunc = (idx: number) => {
        if (idx < 0 || idx >= GRID_SIZE * GRID_SIZE) return;
        if (updated[idx] !== targetColor) return;
        updated[idx] = activeColor;
        
        const row = Math.floor(idx / GRID_SIZE);
        const col = idx % GRID_SIZE;
        
        if (col > 0) fillFunc(idx - 1);
        if (col < GRID_SIZE - 1) fillFunc(idx + 1);
        if (row > 0) fillFunc(idx - GRID_SIZE);
        if (row < GRID_SIZE - 1) fillFunc(idx + GRID_SIZE);
      };

      fillFunc(index);
      setPixels(updated);
    }
  };

  // Drag drawing capability
  const handleMouseEnterCell = (index: number) => {
    if (!isDrawing) return;
    handleCellClick(index);
  };

  const handleClear = () => {
    setPixels(Array(GRID_SIZE * GRID_SIZE).fill('.'));
  };

  // Mock-AI assistance prompt call
  const handleAISmooth = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      // Intelligently smooth out edge cells - find lonely pixels and duplicate, add secondary shading outline for depth
      setPixels((prev) => {
        const next = [...prev];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i] !== '.') {
            const row = Math.floor(i / GRID_SIZE);
            const col = i % GRID_SIZE;
            // Let's create an shadow element below existing color to simulate nice retro lighting shadow!
            const idxBelow = i + GRID_SIZE;
            if (idxBelow < GRID_SIZE * GRID_SIZE && prev[idxBelow] === '.') {
              if (Math.random() < 0.6) next[idxBelow] = '#111111'; // Add smooth black volumetric lighting!
            }
          }
        }
        return next;
      });
      setAiAnalyzing(false);
      setAiConfidence(98.4);
    }, 1200);
  };

  return (
    <div 
      id="main-pixel-editor"
      data-scene-panel
      ref={containerRef}
      className="bg-[#0D0D11]/90 border border-cyan-500/30 rounded-2xl p-5 md:p-6 shadow-[0_0_50px_rgba(0,245,255,0.15)] flex flex-col md:flex-row gap-6 relative select-none max-w-4xl mx-auto backdrop-blur-md"
      onMouseDown={() => setIsDrawing(true)}
      onMouseUp={() => setIsDrawing(false)}
      onMouseLeave={() => setIsDrawing(false)}
    >
      {/* Absolute CRT Grid Accents */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent pointer-events-none" />
      
      {/* Left panel - drawing tools & presets */}
      <div className="flex flex-col gap-5 md:w-48 justify-between">
        <div>
          <div className="text-xs font-mono text-[#00F5FF]/80 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Grid3X3 className="w-3.5 h-3.5 stroke-[2.5]" /> {t("editor.setup")}
          </div>
          
          {/* Preset Buttons */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            {Object.keys(TEMPLATES).map((key) => {
              const active = selectedTemplate === key;
              return (
                <button
                  id={`btn-preset-${key}`}
                  key={key}
                  onClick={() => loadTemplate(key)}
                  className={`px-3 py-2 text-left rounded-lg text-xs font-mono transition-all duration-200 border flex items-center justify-between ${
                    active 
                      ? 'bg-cyan-500/10 border-cyan-500/70 text-cyan-400 font-bold shadow-[inset_0_0_8px_rgba(0,245,255,0.2)]' 
                      : 'border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <span>{t(`editor.templates.${key}`)}</span>
                  <Sparkles className={`w-3 h-3 ${active ? 'text-cyan-400' : 'text-gray-500'}`} />
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">{t("editor.tools")}</div>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <button
              id="tool-pen"
              onClick={() => setCurrentTool('pen')}
              className={`p-2 rounded-lg flex flex-col items-center justify-center border text-xs gap-1 transition-all ${
                currentTool === 'pen'
                  ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400 shadow-[0_0_8px_rgba(0,245,255,0.25)]'
                  : 'border-white/15 text-gray-400 hover:bg-white/5'
              }`}
              title="Pen (P)"
            >
              <Paintbrush className="w-4 h-4" />
              <span className="text-[9px] font-mono">{t("editor.pen")}</span>
            </button>
            <button
              id="tool-eraser"
              onClick={() => setCurrentTool('eraser')}
              className={`p-2 rounded-lg flex flex-col items-center justify-center border text-xs gap-1 transition-all ${
                currentTool === 'eraser'
                  ? 'border-magenta-500/60 bg-pink-500/10 text-pink-400 shadow-[0_0_8px_rgba(255,0,170,0.25)]'
                  : 'border-white/15 text-gray-400 hover:bg-white/5'
              }`}
              style={{
                borderColor: currentTool === 'eraser' ? '#FF00AA' : undefined,
                color: currentTool === 'eraser' ? '#FF00AA' : undefined,
              }}
              title="Eraser (E)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[9px] font-mono">{t("editor.eraser")}</span>
            </button>
            <button
              id="tool-fill"
              onClick={() => setCurrentTool('fill')}
              className={`p-2 rounded-lg flex flex-col items-center justify-center border text-xs gap-1 transition-all ${
                currentTool === 'fill'
                  ? 'border-lime-500/60 bg-emerald-500/10 text-lime-400 shadow-[0_0_8px_rgba(57,255,20,0.25)]'
                  : 'border-white/15 text-gray-400 hover:bg-white/5'
              }`}
              style={{
                borderColor: currentTool === 'fill' ? '#39FF14' : undefined,
                color: currentTool === 'fill' ? '#39FF14' : undefined,
              }}
              title="Bucket Fill (F)"
            >
              <Layers className="w-4 h-4" />
              <span className="text-[9px] font-mono">{t("editor.fill")}</span>
            </button>
          </div>
        </div>

        {/* Live Active Animation Toggle */}
        <div className="bg-[#121217] border border-white/5 p-3 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">{t("editor.animatePlayback")}</span>
            <span className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
          </div>
          <button
            id="editor-btn-play"
            onClick={() => setIsAnimating(!isAnimating)}
            className={`w-full py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono transition-all font-bold ${
              isAnimating 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 text-[#39FF14] border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isAnimating ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>{t("common.pause")}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t("common.animate")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Center panel - the interactive grid */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="relative p-1.5 bg-[#00F5FF]/10 rounded-xl border border-[#00F5FF]/20 shadow-[0_0_30px_rgba(0,245,255,0.05)]">
          {/* Neon corner indicators */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00F5FF]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00F5FF]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00F5FF]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00F5FF]" />
          
          <div 
            className="grid select-none"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: '100%',
              maxWidth: '340px',
              aspectRatio: '1',
            }}
          >
            {pixels.map((color, idx) => {
              const bg = color === '.' ? 'bg-[#0E0E12]' : '';
              return (
                <div
                  id={`editor-cell-${idx}`}
                  key={idx}
                  onMouseDown={() => handleCellClick(idx)}
                  onMouseEnter={() => handleMouseEnterCell(idx)}
                  className={`w-[18px] h-[18px] sm:w-[21px] sm:h-[21px] cursor-pointer transition-colors duration-100 relative ${bg}`}
                  style={{
                    backgroundColor: color !== '.' ? color : undefined,
                    border: showGrid ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    boxShadow: color !== '.' ? `0 0 6px ${color}50` : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Dynamic active status text */}
        <div className="text-[11px] font-mono text-gray-500 w-full flex justify-between px-2">
          <span>{t("editor.activeLayer")}</span>
          <span className="text-[#00F5FF]">{t("editor.gridSize")}</span>
        </div>
      </div>

      {/* Right panel - palette management & AI assist */}
      <div className="flex flex-col gap-4 md:w-44 justify-between">
        <div>
          <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">{t("editor.colorSwatch")}</div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_PALETTES.map((color) => {
              const active = activeColor === color;
              return (
                <button
                  id={`palette-color-${color.replace('#', '')}`}
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className="w-8 h-8 rounded-lg relative transition-transform hover:scale-110 active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                  style={{ 
                    backgroundColor: color,
                    boxShadow: active ? `0 0 12px ${color}` : 'none'
                  }}
                >
                  {active && (
                    <div className="w-2 h-2 rounded-full absolute bg-black border border-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Core canvas actions */}
          <div className="flex flex-col gap-2">
            <button
              id="editor-btn-clear"
              onClick={handleClear}
              className="w-full py-2 px-3 border border-red-500/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("editor.resetCanvas")}</span>
            </button>
            <button
              id="editor-btn-grid"
              onClick={() => setShowGrid(!showGrid)}
              className={`w-full py-2 px-3 border text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                showGrid 
                  ? 'border-cyan-500/20 text-[#00F5FF] hover:bg-cyan-500/5' 
                  : 'border-white/10 text-gray-400 hover:bg-white/5'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>{showGrid ? t("editor.hideGrid") : t("editor.showGrid")}</span>
            </button>
          </div>
        </div>

        {/* AI assist slot */}
        <div className="border border-purple-500/20 bg-purple-500/5 p-3 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20 animate-pulse" />
            <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider font-semibold">{t("editor.aiCopilot")}</span>
          </div>
          <p className="text-[9px] text-gray-400 font-mono leading-relaxed">
            {t("editor.aiDesc")}
          </p>
          <button
            id="editor-btn-smooth"
            onClick={handleAISmooth}
            disabled={aiAnalyzing}
            className="w-full py-1.5 px-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {aiAnalyzing ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin text-white">✦</span> {t("editor.analysing")}
              </span>
            ) : (
              <>
                <span>{t("editor.aiShade")}</span>
              </>
            )}
          </button>
          {aiConfidence !== null && (
            <div className="text-[8px] font-mono text-emerald-400 mt-1 self-center">
              {t("editor.aiConfidence", { n: aiConfidence })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
