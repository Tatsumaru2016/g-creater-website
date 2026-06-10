/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, FastForward, Sliders, Eye, Zap, ArrowRight } from 'lucide-react';
import { RenderPixelSprite } from './Characters';
import { useI18n } from '../i18n';

const TIMELINE_FRAMES = [
  { id: 1, charState: 'idle', duration: '100ms' },
  { id: 2, charState: 'walk', duration: '100ms' },
  { id: 3, charState: 'jump', duration: '100ms' },
  { id: 4, charState: 'jump', duration: '100ms' },
  { id: 5, charState: 'walk', duration: '100ms' },
  { id: 6, charState: 'action', duration: '100ms' },
  { id: 7, charState: 'action', duration: '100ms' },
  { id: 8, charState: 'idle', duration: '100ms' },
];

export function AnimationTimeline() {
  const { t } = useI18n();
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(12);
  const [enableOnionSkin, setEnableOnionSkin] = useState(true);
  const [onionOpacity, setOnionOpacity] = useState(35);
  const [selectedCharacter, setSelectedCharacter] = useState<'sonic' | 'mario' | 'link' | 'megaman'>('sonic');

  // Multi-frame playback logic
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 1000 / fps;
    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev % 8) + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, fps]);

  const activeFrameData = TIMELINE_FRAMES[currentFrame - 1];

  return (
    <div id="scene-animation-timeline" className="flex flex-col lg:flex-row gap-8 items-center max-w-6xl mx-auto px-4 md:px-8 py-4 w-full">
      
      {/* LEFT: Cinematic Canvas demonstrating Orion skinning */}
      <div className="flex-1 w-full flex flex-col gap-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div id="scene-panel-3" data-scene-panel className="bg-[#07070A]/95 border-2 border-white/10 rounded-2xl p-5 shadow-[0_0_40px_rgba(57,255,20,0.05)] backdrop-blur-md relative overflow-visible">
          
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-mono text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> {t("timeline.renderTerminal")}
            </h3>
            <span className="text-[9px] font-mono text-[#39FF14] uppercase border border-[#39FF14]/30 px-1.5 py-0.5 rounded bg-[#39FF14]/5 animate-pulse">
              {t("timeline.onionOnline")}
            </span>
          </div>
          <p className="text-[11px] font-mono text-gray-400 mb-6 col-span-2">
            {t("timeline.onionDesc")}
          </p>

          {/* Active rendering viewport */}
          <div className="h-56 bg-gradient-to-b from-[#0A0A0E] to-[#121217] rounded-xl border border-white/5 relative flex items-center justify-center p-6 mb-4 overflow-hidden select-none">
            {/* Perspective laser grid lines on floor of stage */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40 [mask-image:radial-gradient(ellipse_at_center,_white,_transparent)]" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent shadow-[0_0_8px_cyan]" />

            {/* Onion Skins trailing (Behind) */}
            {enableOnionSkin && (() => {
              const prevIdx = ((currentFrame - 2 + 8) % 8) + 1;
              const prevFrameData = TIMELINE_FRAMES[prevIdx - 1];
              return (
                <div 
                  className="absolute transition-all duration-300 pointer-events-none"
                  style={{
                    opacity: onionOpacity / 200,
                    transform: 'translateX(-90px) scale(0.9)',
                    filter: 'hue-rotate(90deg) brightness(1.2)'
                  }}
                >
                  <RenderPixelSprite
                    type={selectedCharacter}
                    state={prevFrameData.charState as any}
                    facing="right"
                    scale={4}
                  />
                  <div className="text-[8px] font-mono text-[#00F5FF] text-center mt-2 bg-black/60 rounded px-1">F_0{prevFrameData.id}</div>
                </div>
              );
            })()}

            {/* Active Character Sprite at Center */}
            <div className="relative z-10 flex flex-col items-center animate-pulse duration-1000">
              <RenderPixelSprite
                type={selectedCharacter}
                state={activeFrameData.charState as any}
                facing="right"
                scale={5.5}
              />
              <div className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-3 shadow-[0_0_8px_rgba(57,255,20,0.15)] flex items-center gap-1">
                <span>{t("timeline.frameLabel", { n: currentFrame })}</span>
                <span className="text-gray-500 text-[8px] uppercase">({t(`timeline.frames.${currentFrame}.tag`)})</span>
              </div>
            </div>

            {/* Onion Skins forward (Front) */}
            {enableOnionSkin && (() => {
              const nextIdx = (currentFrame % 8) + 1;
              const nextFrameData = TIMELINE_FRAMES[nextIdx - 1];
              return (
                <div 
                  className="absolute transition-all duration-300 pointer-events-none"
                  style={{
                    opacity: onionOpacity / 100,
                    transform: 'translateX(90px) scale(0.95)',
                    filter: 'hue-rotate(-90deg) brightness(1.2)'
                  }}
                >
                  <RenderPixelSprite
                    type={selectedCharacter}
                    state={nextFrameData.charState as any}
                    facing="right"
                    scale={4}
                  />
                  <div className="text-[8px] font-mono text-[#FF00AA] text-center mt-2 bg-black/60 rounded px-1">F_0{nextFrameData.id}</div>
                </div>
              );
            })()}
          </div>

          {/* Scrubber & Selection panel */}
          <div className="flex flex-wrap items-center gap-4 justify-between bg-black/40 border border-white/5 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-gray-500">{t("timeline.characterSprite")}</span>
              <div className="flex gap-1">
                {(['sonic', 'mario', 'link', 'megaman'] as const).map((char) => (
                  <button
                    id={`btn-time-char-${char}`}
                    key={char}
                    onClick={() => setSelectedCharacter(char)}
                    className={`px-2 py-1 text-[9px] font-mono uppercase rounded border cursor-pointer ${
                      selectedCharacter === char
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            {/* Play/Pause controls */}
            <div className="flex items-center gap-1">
              <button
                id="timeline-btn-play"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded border cursor-pointer ${
                  isPlaying 
                    ? 'border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]' 
                    : 'border-white/15 text-gray-400 hover:border-white/30'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                id="timeline-btn-step"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrame((prev) => (prev % 8) + 1);
                }}
                className="p-1.5 rounded border border-white/15 text-gray-400 hover:border-white/30 cursor-pointer"
                title={t("timeline.nextFrame")}
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: 3D Timeline stretches like a highway */}
      <div className="flex-1 w-full flex flex-col gap-3 justify-end">
        <h2 className="text-xl md:text-2xl font-sans tracking-tight text-white font-bold flex items-center gap-2">
          <FastForward className="w-6 h-6 text-emerald-400" /> {t("timeline.highway")}
        </h2>
        <p className="text-xs font-mono text-gray-400 leading-relaxed max-w-lg mb-2">
          {t("timeline.highwayDesc")}
        </p>

        {/* 3D Angled frames highway */}
        <div className="flex flex-col gap-1.5 relative select-none">
          {TIMELINE_FRAMES.map((f) => {
            const active = currentFrame === f.id;
            return (
              <div
                id={`timeline-highway-${f.id}`}
                key={f.id}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrame(f.id);
                }}
                className={`py-2 px-4 rounded-lg border cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(57,255,20,0.15)] font-bold'
                    : 'border-white/[0.05] bg-[#09090C] hover:border-white/15 hover:bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-mono px-1 rounded-full ${active ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                    0{f.id}
                  </span>
                  <span className={`text-xs font-mono ${active ? 'text-emerald-400 text-[13px]' : 'text-gray-400'}`}>
                    {t(`timeline.frames.${f.id}.name`)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-mono text-gray-500 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                    {t(`timeline.frames.${f.id}.tag`)}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    {f.duration}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 ${active ? 'text-emerald-400 translate-x-0.5' : 'text-gray-600'} transition-transform`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Sliders - Framestep and Onion Skin controls */}
        <div className="bg-[#121217] border border-white/5 p-4 rounded-xl flex flex-col gap-3 mt-2">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 w-full">
              <span className="text-[9px] font-mono text-gray-500 block mb-1">{t("timeline.fpsControl")}</span>
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <input
                  id="fps-timing-slider"
                  type="range"
                  min="1"
                  max="24"
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="flex-1 accent-emerald-400 bg-black/50 h-1 rounded-lg"
                />
                <span className="text-[10px] font-mono text-emerald-400 w-12 text-right">
                  {fps} FPS
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-gray-500 block">{t("timeline.onionLayer")}</span>
                <span className="text-[10px] font-mono text-gray-400">{enableOnionSkin ? t("timeline.onionShowing") : t("timeline.onionDisabled")}</span>
              </div>
              <button
                id="btn-onion-toggle"
                onClick={() => setEnableOnionSkin(!enableOnionSkin)}
                className={`py-1.5 px-3 rounded-lg text-xs font-mono border cursor-pointer flex items-center gap-1.5 ${
                  enableOnionSkin 
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(57,255,20,0.1)]' 
                    : 'border-white/10 text-gray-500 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> {t("common.toggle")}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
