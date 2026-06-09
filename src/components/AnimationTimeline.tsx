import React, { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Play, Pause, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

interface AnimationTimelineProps {
  frames: string[][][];
  setFrames: React.Dispatch<React.SetStateAction<string[][][]>>;
  currentFrameIdx: number;
  setCurrentFrameIdx: React.Dispatch<React.SetStateAction<number>>;
  onionSkinPrev: boolean;
  setOnionSkinPrev: (active: boolean) => void;
  onionSkinNext: boolean;
  setOnionSkinNext: (active: boolean) => void;
  gridSize: number;
}

export default function AnimationTimeline({
  frames,
  setFrames,
  currentFrameIdx,
  setCurrentFrameIdx,
  onionSkinPrev,
  setOnionSkinPrev,
  onionSkinNext,
  setOnionSkinNext,
  gridSize,
}: AnimationTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(6);

  // Playback timer controls
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && frames.length > 1) {
      timer = setInterval(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % frames.length);
      }, 1000 / fps);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, frames.length, fps]);

  // Add empty frame
  const handleAddFrame = () => {
    const emptyGrid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("#00000000"));

    setFrames((prev) => [...prev, emptyGrid]);
    setCurrentFrameIdx(frames.length); // switch to new frame
  };

  // Duplicate current frame
  const handleDuplicateFrame = () => {
    const activeClone = frames[currentFrameIdx].map((row) => [...row]);
    setFrames((prev) => {
      const next = [...prev];
      next.splice(currentFrameIdx + 1, 0, activeClone);
      return next;
    });
    setCurrentFrameIdx(currentFrameIdx + 1);
  };

  // Delete active frame
  const handleDeleteFrame = () => {
    if (frames.length === 1) return; // keep at least 1 frame slot
    setFrames((prev) => {
      const next = prev.filter((_, idx) => idx !== currentFrameIdx);
      return next;
    });
    setCurrentFrameIdx(currentFrameIdx > 0 ? currentFrameIdx - 1 : 0);
  };

  return (
    <div id="timeline_widget_panel" data-scene-panel className="flex flex-col gap-5 w-full bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl backdrop-blur-md">
      {/* Title */}
      <div id="timeline_widget_header" className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Animation Timeline Studio
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Onion Toggles */}
          <button
            id="onion_prev_toggle_btn"
            onClick={() => setOnionSkinPrev(!onionSkinPrev)}
            className={`px-2 py-0.5 text-[9px] font-mono rounded border transition-all ${
              onionSkinPrev
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                : "bg-transparent border-neutral-800 text-neutral-500"
            }`}
            title="Shows ghost rendering of PREVIOUS frame coordinates layer transparently"
          >
            ONION PREV
          </button>
          <button
            id="onion_next_toggle_btn"
            onClick={() => setOnionSkinNext(!onionSkinNext)}
            className={`px-2 py-0.5 text-[9px] font-mono rounded border transition-all ${
              onionSkinNext
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                : "bg-transparent border-neutral-800 text-neutral-500"
            }`}
            title="Shows ghost rendering of NEXT frame coordinates layer transparently"
          >
            ONION NEXT
          </button>
        </div>
      </div>

      {/* 3D Stack Frames Isometric Timeline Highway */}
      <div id="timeline_isometric_highway_wrapper" className="flex flex-col gap-3">
        <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
          3D Layers Stack Timeline perspective
        </label>
        {/* Isometric projection space */}
        <div className="relative h-[110px] w-full bg-neutral-950/80 border border-neutral-800 rounded-lg overflow-x-auto overflow-y-hidden py-4 px-6 flex items-center justify-start gap-5 scrollbar-thin scrollbar-thumb-neutral-800">
          {frames.map((grid, index) => {
            const isActive = index === currentFrameIdx;
            return (
              <div
                key={index}
                id={`timeline_frame_card_${index}`}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrameIdx(index);
                }}
                className={`flex-none cursor-pointer relative w-[44px] h-[44px] rounded-lg border flex items-center justify-center transition-all duration-300 transform ${
                  isActive
                    ? "border-amber-400 ring-2 ring-amber-500/30 scale-110 -translate-y-1 shadow-[0_10px_20px_rgba(245,158,11,0.2)] bg-neutral-900"
                    : "border-neutral-800 hover:border-neutral-500 hover:-translate-y-0.5 bg-neutral-950"
                }`}
                style={{
                  perspective: "200px",
                }}
              >
                {/* 3D Slanted Layer Visual */}
                <div
                  className="w-[28px] h-[28px] grid border-neutral-800 pointer-events-none transform transition-all"
                  style={{
                    transform: "rotateY(-20deg) rotateX(15deg)",
                    gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  }}
                >
                  {grid.map((row, r) =>
                    row.map((color, c) => (
                      <div
                        key={`${r}-${c}`}
                        style={{
                          backgroundColor: color === "#00000000" ? "transparent" : color,
                        }}
                      />
                    ))
                  )}
                </div>

                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-neutral-500 font-bold">
                  F{index + 1}
                </span>

                {isActive && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] bg-amber-500 text-neutral-950 px-1 py-0.2 rounded font-mono font-bold leading-normal">
                    ACTIVE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Frame Studio playback settings */}
      <div id="timeline_studio_actions" className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
          <button
            id="play_animation_btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1 rounded cursor-pointer ${
              isPlaying ? "text-red-400 font-bold" : "text-emerald-400"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className="text-neutral-500 font-mono text-xs">|</span>
          <span className="text-xs font-mono text-neutral-300">
            {currentFrameIdx + 1} / {frames.length}
          </span>
        </div>

        {/* Speed adjustment slider */}
        <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1 border border-neutral-800 rounded min-w-[130px]">
          <span className="text-[10px] font-mono text-neutral-400">FPS:</span>
          <input
            type="range"
            id="fps_speed_slider"
            min={1}
            max={20}
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value))}
            className="w-16 accent-amber-500 cursor-pointer h-1 rounded"
          />
          <span className="text-[11px] font-mono text-amber-500 w-3 text-right">{fps}</span>
        </div>

        {/* Manage buttons */}
        <div className="flex items-center gap-1.5">
          <button
            id="add_new_frame_btn"
            onClick={handleAddFrame}
            className="h-8 w-8 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Create blank frame"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            id="duplicate_frame_btn"
            onClick={handleDuplicateFrame}
            className="h-8 w-8 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Duplicate frame layers"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            id="delete_active_frame_btn"
            onClick={handleDeleteFrame}
            disabled={frames.length === 1}
            className="h-8 w-8 rounded bg-red-950/20 hover:bg-red-950 text-red-500 border border-red-900/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:text-neutral-600 disabled:border-transparent flex items-center justify-center transition-all cursor-pointer"
            title="Trash active frame target"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
