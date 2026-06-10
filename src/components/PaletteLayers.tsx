/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Sliders, Palette, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../i18n';

const PALETTE_COLORS = [
  ['#FF00AA', '#00F5FF', '#8B5CF6', '#F97316', '#FFE600', '#EC4899', '#3B82F6', '#0F172A'],
  ['#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#000000'],
  ['#0f380f', '#306230', '#8bac0f', '#9bbc0f', '#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#030712'],
];

export function PaletteLayers() {
  const { t } = useI18n();
  const [activePalette, setActivePalette] = useState(0);
  const [layers, setLayers] = useState([
    { id: 'l1', visible: true, locked: false, opacity: 90, blend: 'screen', color: '#00F5FF' },
    { id: 'l2', visible: true, locked: true, opacity: 100, blend: 'normal', color: '#FF00AA' },
    { id: 'l3', visible: true, locked: false, opacity: 50, blend: 'multiply', color: '#8B5CF6' }
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState('l1');

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const toggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const updateOpacity = (id: string, val: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity: val } : l));
  };

  const updateBlend = (id: string, blendMode: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, blend: blendMode } : l));
  };

  const currentColors = PALETTE_COLORS[activePalette];

  return (
    <div id="scene-palette-layers" className="flex flex-col lg:flex-row gap-8 items-center max-w-6xl mx-auto px-4 md:px-8 py-4 w-full">
      
      {/* LEFT: 3D Layer Stack Viewport */}
      <div className="flex-1 w-full flex flex-col gap-4 relative">
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div id="scene-panel-2" data-scene-panel className="bg-[#07070A]/95 border-2 border-white/10 rounded-2xl p-5 shadow-[0_0_40px_rgba(139,92,246,0.05)] backdrop-blur-md relative overflow-visible">
          
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-mono text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> {t("palette.decomposition")}
            </h3>
            <span className="text-[9px] font-mono text-[#8B5CF6] uppercase border border-[#8B5CF6]/30 px-1.5 py-0.5 rounded bg-[#8B5CF6]/5">
              {t("palette.holographic")}
            </span>
          </div>
          <p className="text-[11px] font-mono text-gray-400 mb-6 leading-relaxed">
            {t("palette.decompositionDesc")}
          </p>

          {/* Isometric Layer Stack visualizer */}
          <div className="h-64 relative flex items-center justify-center my-6 perspective-[1000px] select-none scale-[0.85] sm:scale-100">
            {layers.map((l, i) => {
              const depth = (layers.length - i - 1) * 35; // depth offset
              const selected = selectedLayerId === l.id;
              const opacityVal = l.visible ? l.opacity / 100 : 0;
              
              return (
                <div
                  id={`iso-layer-${l.id}`}
                  key={l.id}
                  onClick={() => setSelectedLayerId(l.id)}
                  className={`absolute w-44 h-44 rounded-xl border transition-all duration-500 cursor-pointer flex flex-col justify-between p-3 select-none ${
                    selected 
                      ? 'border-[#00F5FF] shadow-[0_0_30px_rgba(0,245,255,0.15)] bg-slate-900/60' 
                      : 'border-white/10 bg-transparent'
                  }`}
                  style={{
                    transform: `rotateX(55deg) rotateZ(-40deg) translateZ(${depth}px) translateY(${selected ? '-10px' : '0px'})`,
                    opacity: opacityVal * 0.9 + 0.1,
                    zIndex: layers.length - i,
                  }}
                >
                  {/* Layer Grid Lines simulation */}
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 rounded-xl pointer-events-none" />
                  <div 
                    className="absolute inset-0 opacity-10 rounded-xl"
                    style={{
                      backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 80%)',
                      backgroundSize: '12px 12px',
                    }}
                  />

                  {/* Corner bounds of layers */}
                  <div className="w-2 h-2 border-t border-l border-white/40" />
                  
                  {/* Layer Character or graphic symbol representation inside */}
                  <div className="self-center flex flex-col items-center gap-1">
                    <div 
                      className="w-10 h-10 rounded-lg blur-sm animate-pulse flex items-center justify-center"
                      style={{ 
                        backgroundColor: currentColors[i % currentColors.length],
                        boxShadow: `0 0 15px ${currentColors[i % currentColors.length]}`
                      }}
                    />
                    <span 
                      className="text-[9px] font-mono tracking-wider font-extrabold"
                      style={{ color: currentColors[i % currentColors.length] }}
                    >
                      {t(`palette.layers.${l.id}`).split(' ')[0]}
                    </span>
                  </div>

                  {/* Layer Label bottom inside */}
                  <div className="flex justify-between items-center bg-black/60 px-1 py-0.5 rounded text-[8px] font-mono text-gray-400">
                    <span>{t(`palette.layers.${l.id}`).slice(0, 15)}...</span>
                    <span>OP: {l.opacity}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Opacity and Blending adjustments for selected layer */}
          {(() => {
            const currentLayer = layers.find(l => l.id === selectedLayerId);
            if (!currentLayer) return null;
            return (
              <div className="bg-[#121217]/80 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center mt-4">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-mono text-gray-300 font-bold">
                      {t("palette.layerControl")} <span className="text-[#00F5FF]">{t(`palette.layers.${currentLayer.id}`)}</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {t("palette.mix")} {currentLayer.blend.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sliders className="w-3.5 h-3.5 text-[#00F5FF]/80" />
                    <input
                      id="layer-opacity-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={currentLayer.opacity}
                      onChange={(e) => updateOpacity(currentLayer.id, parseInt(e.target.value))}
                      className="flex-1 accent-[#00F5FF] bg-black/50 h-1.5 rounded-lg border border-white/10"
                    />
                    <span className="text-[10px] font-mono text-[#00F5FF] min-w-8 text-right">
                      {currentLayer.opacity}%
                    </span>
                  </div>
                </div>
                
                {/* Blending Mode selector */}
                <div className="w-full sm:w-auto">
                  <span className="text-[9px] font-mono text-gray-500 block mb-1">{t("palette.blendMode")}</span>
                  <div className="flex gap-1">
                    {['normal', 'multiply', 'screen'].map((blendMode) => (
                      <button
                        id={`btn-blend-${blendMode}`}
                        key={blendMode}
                        onClick={() => updateBlend(currentLayer.id, blendMode)}
                        className={`px-2 py-1 rounded text-[9px] font-mono border cursor-pointer ${
                          currentLayer.blend === blendMode
                            ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                            : 'border-white/10 text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {blendMode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* RIGHT: Palette Indexing Swatches */}
      <div className="flex-1 w-full flex flex-col gap-3">
        <h2 className="text-xl md:text-2xl font-sans tracking-tight text-white font-bold flex items-center gap-2">
          <Palette className="w-6 h-6 text-purple-400 animate-pulse" /> {t("palette.indexedColor")}
        </h2>
        <p className="text-xs font-mono text-gray-400 leading-relaxed max-w-lg mb-2">
          {t("palette.indexedDesc")}
        </p>

        <div className="flex flex-col gap-3">
          {PALETTE_COLORS.map((colors, idx) => {
            const active = activePalette === idx;
            return (
              <div
                id={`palette-card-${idx}`}
                key={idx}
                onClick={() => setActivePalette(idx)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col gap-3 ${
                  active 
                    ? 'border-purple-500 bg-purple-500/5 shadow-[0_4px_24px_rgba(139,92,246,0.1)]' 
                    : 'border-white/[0.05] bg-[#09090C] hover:border-white/10 hover:bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-sans font-bold ${active ? 'text-purple-300' : 'text-white'}`}>
                      {t(`palette.palettes.${idx}.name`)}
                    </span>
                    <span className="text-[8px] font-mono px-1 bg-white/5 text-gray-400 border border-white/10 rounded">
                      {t("common.colors")}
                    </span>
                  </div>
                  {active && (
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  )}
                </div>

                <p className="text-[10px] font-mono text-gray-500">
                  {t(`palette.palettes.${idx}.vibe`)}
                </p>

                <div className="flex gap-1.5">
                  {colors.map((color, cIdx) => (
                    <div 
                      key={cIdx} 
                      className="w-5 h-5 rounded border border-white/5 hover:scale-110 transition-transform shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
