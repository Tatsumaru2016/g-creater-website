import React, { useState, useEffect, useRef } from "react";
import { NAVIGATION_LAYERS, RETRO_PALETTES, PREMADE_GALLERY, CHARACTER_PRESETS, createEmptyGrid } from "./data";
import { ToolMode, SymmetryMode } from "./types";

// Extracted Sub-components
import PixelCanvas from "./components/PixelCanvas";
import PaletteLab from "./components/PaletteLab";
import AILab from "./components/AILab";
import AnimationTimeline from "./components/AnimationTimeline";
import DrawingTools from "./components/DrawingTools";
import ExportPanel from "./components/ExportPanel";
import Logo from "./components/Logo";
import SceneWanderers from "./components/SceneWanderers";
import HeaderInvaders from "./components/HeaderInvaders";

// Icons
import {
  Layers, Paintbrush, Palette, Clock, Play, Cpu, Download, Grid,
  ToggleLeft, ToggleRight, Sparkles, AlertTriangle, Volume2, VolumeX,
  ChevronDown, ChevronUp, Monitor, Zap, Heart, Disc, Info, Music, Music2
} from "lucide-react";
import {
  playAppTone,
  playInvaderSfx,
  setInvaderAudioOptions,
  startInvaderBgm,
  stopInvaderBgm,
  resumeAudioContext,
} from "./audio/invaderAudio";

export default function App() {
  // --- STATE ---
  const [activeLayer, setActiveLayer] = useState(0);
  const [gridSize, setGridSize] = useState(16);

  // Core Animation coordinate layers list: frames list [frameIdx][row][col]
  const [frames, setFrames] = useState<string[][][]>(() => {
    // Populate Initial Grid with Zelda Hero Link preset artwork for a spectacular landing gaze!
    const linkPreset = PREMADE_GALLERY[0];
    const initialGrid = createEmptyGrid(16, "#00000000");
    const pSize = linkPreset.pixels.length;

    // Center layout of Link preset on the 16x16 grid
    const offset = Math.floor((16 - pSize) / 2);
    for (let r = 0; r < pSize; r++) {
      for (let c = 0; c < pSize; c++) {
        const hex = linkPreset.pixels[r][c];
        initialGrid[r + offset][c + offset] = hex;
      }
    }
    return [initialGrid];
  });

  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);

  // Graphic Tools options
  const [activeColor, setActiveColor] = useState("#00F0FF");
  const [palette, setPalette] = useState<string[]>(RETRO_PALETTES[0].colors);
  const [tool, setTool] = useState<ToolMode>("pen");
  const [symmetry, setSymmetry] = useState<SymmetryMode>("none");

  // Visual Overlay states
  const [onionSkinPrev, setOnionSkinPrev] = useState(false);
  const [onionSkinNext, setOnionSkinNext] = useState(false);
  const [crtEffect, setCrtEffect] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);

  // UI responsive sizes states
  const [isMobile, setIsMobile] = useState(false);

  // Cooldown scroll lock ref
  const lastScrollTime = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    setInvaderAudioOptions({ sfx: sfxEnabled, bgm: bgmEnabled });
    if (bgmEnabled) startInvaderBgm();
    else stopInvaderBgm();
    return () => stopInvaderBgm();
  }, [sfxEnabled, bgmEnabled]);

  // --- SCROLL MATRIX TRANSITION HANDLERS ---
  const handleScrollToLayer = (idx: number) => {
    if (idx < 0 || idx > 7) return;
    setActiveLayer(idx);
    playAppTone("transition");
  };

  const handleWheelScroll = (e: WheelEvent) => {
    // Desktop scrolling cooldown check
    const now = Date.now();
    if (now - lastScrollTime.current < 900) return;

    if (Math.abs(e.deltaY) > 20) {
      const direction = e.deltaY > 0 ? 1 : -1;
      const target = activeLayer + direction;
      if (target >= 0 && target <= 7) {
        lastScrollTime.current = now;
        handleScrollToLayer(target);
      }
    }
  };

  // Touch swiping handlers
  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const now = Date.now();
    if (now - lastScrollTime.current < 900) return;

    if (Math.abs(deltaY) > 60) {
      const direction = deltaY > 0 ? 1 : -1;
      const target = activeLayer + direction;
      if (target >= 0 && target <= 7) {
        lastScrollTime.current = now;
        handleScrollToLayer(target);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("wheel", handleWheelScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("wheel", handleWheelScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeLayer]);

  // Load preset template directly from Community Wall into Canvas Core
  const handleLoadPremade = (art: typeof PREMADE_GALLERY[number]) => {
    const res = art.pixels.length;
    const nextGrid = createEmptyGrid(gridSize, "#00000000");

    // Re-scale appropriately
    const minS = Math.min(res, gridSize);
    for (let r = 0; r < minS; r++) {
      for (let c = 0; c < minS; c++) {
        nextGrid[r][c] = art.pixels[r][c];
      }
    }

    setFrames((prev) => {
      const next = [...prev];
      next[currentFrameIdx] = nextGrid;
      return next;
    });
    setPalette(art.palette);
    const nonTrans = art.palette.find((c) => c !== "#00000000") || art.palette[0];
    setActiveColor(nonTrans);

    playAppTone("success");
    // scroll back to Hero canvas screen
    setActiveLayer(0);
  };

  // --- COMPONENT MATRIX WRAPPER STATES ---
  const activeFramePixels = frames[currentFrameIdx] || createEmptyGrid(gridSize);
  const prevFramePixels = currentFrameIdx > 0 ? frames[currentFrameIdx - 1] : undefined;
  const nextFramePixels = currentFrameIdx < frames.length - 1 ? frames[currentFrameIdx + 1] : undefined;

  const updateActiveFramePixels = (newPixels: React.SetStateAction<string[][]>) => {
    setFrames((prev) => {
      const next = [...prev];
      if (typeof newPixels === "function") {
        next[currentFrameIdx] = (newPixels as any)(next[currentFrameIdx]);
      } else {
        next[currentFrameIdx] = newPixels;
      }
      return next;
    });
  };

  // Map icons helper
  const getLayerIcon = (name: string) => {
    switch (name) {
      case "Canvas": return <Layers className="w-4 h-4" />;
      case "Paintbrush": return <Paintbrush className="w-4 h-4" />;
      case "Palette": return <Palette className="w-4 h-4" />;
      case "Clock": return <Clock className="w-4 h-4" />;
      case "Play": return <Play className="w-4 h-4" />;
      case "Cpu": return <Cpu className="w-4 h-4" />;
      case "Download": return <Download className="w-4 h-4" />;
      case "Grid": return <Grid className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div
      id="gcreater_main_workspace"
      className={`relative w-full h-screen bg-[#060608] text-neutral-100 overflow-hidden font-sans select-none ${
        crtEffect ? "crt-ambient-shimmer" : ""
      }`}
    >
      {/* Dynamic Cyber Grid Starburst Background Canvas */}
      <div id="grid_space_dimmer" className="absolute inset-0 pointer-events-none opacity-[0.14] bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.15),transparent_75%)] z-0" />
      <div id="retro_tech_axis_grid" className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.7)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Floating Header */}
      <header id="spatial_global_header" className="absolute top-0 inset-x-0 h-20 bg-neutral-950/45 border-b border-neutral-700 backdrop-blur-md px-6 md:px-12 flex items-center z-50">
        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <Logo />
          <div className="flex flex-col">
            <h1 className="text-xs font-mono font-bold tracking-widest text-white leading-none">
              G.CREATER
            </h1>
            <span className="text-[7.5px] font-mono tracking-widest text-cyan-400 mt-1 leading-none uppercase">
              Header Invaders — Play Here
            </span>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-stretch min-w-0 h-full">
          <HeaderInvaders sfxEnabled={sfxEnabled} bgmEnabled={bgmEnabled} />
        </div>

        {/* Action controls & Audio Toggle */}
        <div id="global_options_row" className="relative z-10 flex items-center gap-2 shrink-0">
          <button
            id="sfx_toggle_btn"
            onClick={() => {
              resumeAudioContext();
              const next = !sfxEnabled;
              setSfxEnabled(next);
              setInvaderAudioOptions({ sfx: next });
              if (next) playInvaderSfx("uiClick");
            }}
            className={`p-1.5 rounded bg-neutral-950 border border-neutral-800 transition-all ${
              sfxEnabled ? "text-cyan-400" : "text-neutral-600"
            }`}
            title="効果音 ON/OFF"
          >
            {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="bgm_toggle_btn"
            onClick={() => {
              resumeAudioContext();
              const next = !bgmEnabled;
              setBgmEnabled(next);
              setInvaderAudioOptions({ bgm: next });
              if (next) startInvaderBgm();
              else stopInvaderBgm();
              if (sfxEnabled) playInvaderSfx("uiClick");
            }}
            className={`p-1.5 rounded bg-neutral-950 border border-neutral-800 transition-all ${
              bgmEnabled ? "text-amber-400" : "text-neutral-600"
            }`}
            title="BGM ON/OFF"
          >
            {bgmEnabled ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4 opacity-50" />}
          </button>

          <button
            id="crt_toggle_btn"
            onClick={() => {
              setCrtEffect(!crtEffect);
              playAppTone("click");
            }}
            className={`p-1.5 rounded bg-neutral-950 border border-neutral-800 transition-all ${
              crtEffect ? "text-magenta-500" : "text-neutral-600"
            }`}
            title="Toggle retro CRT scanlines and curved shimmers"
          >
            <Monitor className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </header>

      {/* Minimal Floating layer index orb Indicator (Right border) */}
      <div id="floating_layer_hud" className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2.5 bg-neutral-950/60 border border-neutral-900 px-2 py-4 rounded-full backdrop-blur-md z-40">
        <span className="text-[7px] font-mono text-neutral-500 font-bold mb-1">AXIS</span>
        {NAVIGATION_LAYERS.map((lay) => (
          <button
            key={lay.id}
            id={`hud_nav_dot_${lay.id}`}
            onClick={() => handleScrollToLayer(lay.id)}
            className={`relative group h-6 w-6 rounded-full flex items-center justify-center transition-all ${
              activeLayer === lay.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/80 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                : "text-neutral-500 hover:text-white hover:bg-neutral-900 border border-transparent"
            }`}
          >
            <span className="text-[8px] font-mono font-bold">{lay.id}</span>
            {/* Tooltip */}
            <span className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-neutral-950 border border-neutral-800 text-[9px] text-white font-mono px-2 py-1 rounded whitespace-nowrap transition-all duration-200 pointer-events-none">
              Layer #{lay.id}: {lay.name}
            </span>
          </button>
        ))}
      </div>

      {/* 3D PERSPECTIVE SPACIAL TUNNEL CONTAINER */}
      <div
        id="spacial_perspective_container"
        className="relative w-full h-full flex items-center justify-center"
        style={{
          perspective: isMobile ? "none" : "1200px",
          transformStyle: isMobile ? "flat" : "preserve-3d",
        }}
      >
        {/* Layer 0: Landing Hero with real-time painting grid */}
        <div
          id="scene_layer_0"
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out z-10 select-none"
          style={
            isMobile
              ? { display: activeLayer === 0 ? "flex" : "none" }
              : {
                  transform: `translateZ(${(0 - activeLayer) * 600}px) translateY(${(0 - activeLayer) * 150}px) rotateY(${(0 - activeLayer) * -12}deg)`,
                  opacity: activeLayer === 0 ? 1 : Math.max(0, 1 - Math.abs(0 - activeLayer) * 0.5),
                  filter: activeLayer === 0 ? "none" : `blur(${Math.abs(0 - activeLayer) * 5}px)`,
                  pointerEvents: activeLayer === 0 ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }
          }
        >
          <SceneWanderers layerId={0} active={activeLayer === 0} />
          <div className="relative z-[1] grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl w-full items-center">
            {/* Intro text */}
            <div data-wanderer-bite className="lg:col-span-5 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full w-fit">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[8.5px] font-mono text-cyan-400 tracking-wider">NEXT-GEN QUANTUM WORKSHOP</span>
              </div>
              <div className="flex items-center gap-4">
                <Logo />
                <h2 className="text-4xl md:text-5xl font-mono font-extrabold tracking-tighter text-white leading-tight uppercase">
                  G.CREATER
                </h2>
              </div>
              <p className="text-sm font-mono text-neutral-400 leading-relaxed max-w-md">
                A groundbreaking 3D-assisted pixel art editor and animation suite built for futuristic pixel designers. 
                <br /><span className="text-cyan-400 font-bold">Pixel by Pixel. Dimension by Dimension.</span>
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  id="go_to_drawing_lab_btn"
                  onClick={() => handleScrollToLayer(1)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-neutral-950 font-bold font-mono text-xs rounded shadow-lg hover:shadow-cyan-500/10 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  LOAD STUDIO LAB
                </button>
                <span className="text-[10px] text-neutral-500 font-mono tracking-widest pl-2 flex items-center gap-1 animate-pulse">
                  <ChevronDown className="w-3.5 h-3.5" /> SWIPE OR MOUSEWHEEL TO ADVANCE
                </span>
              </div>
            </div>

            {/* Core live grid */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <PixelCanvas
                pixels={activeFramePixels}
                setPixels={updateActiveFramePixels}
                activeColor={activeColor}
                palette={palette}
                tool={tool}
                symmetry={symmetry}
                gridSize={gridSize}
                setGridSize={setGridSize}
                onionSkinPrev={onionSkinPrev ? prevFramePixels : undefined}
                onionSkinNext={onionSkinNext ? nextFramePixels : undefined}
                onPixelClick={(r, c) => {
                  setActiveColor(activeFramePixels[r][c]);
                  playAppTone("click");
                }}
              />
            </div>
          </div>
        </div>

        {/* Layer 1: Drawing tools */}
        <div
          id="scene_layer_1"
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out z-10 select-none"
          style={
            isMobile
              ? { display: activeLayer === 1 ? "flex" : "none" }
              : {
                  transform: `translateZ(${(1 - activeLayer) * 600}px) translateY(${(1 - activeLayer) * 150}px) rotateY(${(1 - activeLayer) * -12}deg)`,
                  opacity: activeLayer === 1 ? 1 : Math.max(0, 1 - Math.abs(1 - activeLayer) * 0.5),
                  filter: activeLayer === 1 ? "none" : `blur(${Math.abs(1 - activeLayer) * 5}px)`,
                  pointerEvents: activeLayer === 1 ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }
          }
        >
          <SceneWanderers layerId={1} active={activeLayer === 1} />
          <div className="relative z-[1] max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div data-wanderer-bite className="lg:col-span-5 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full w-fit">
                <Paintbrush className="w-3 h-3 text-red-400" />
                <span className="text-[8.5px] font-mono text-red-400 tracking-wider">LABORATORY COMPILATIONS</span>
              </div>
              <h2 className="text-3xl font-mono font-bold tracking-tight text-white uppercase leading-none">
                Symmetry Guidance
              </h2>
              <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                Unlock double, radial, and spiral drawing mirrors instantly linked to coordinate vectors. Paints vertical and horizontal pixel strokes simultaneously to speed up character models, magical weapon creations, and tile sets.
              </p>
              <div className="p-3.5 bg-neutral-950 border border-neutral-900 rounded-lg flex flex-col gap-1.5 font-mono text-[10px] max-w-md">
                <div className="flex justify-between text-neutral-500">
                  <span>VORTEX SYMMETRY STATUS</span>
                  <span className="text-yellow-400 font-bold">{symmetry.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>ACTIVE DRAW BRUSH</span>
                  <span className="text-white font-bold">{tool.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 flex">
              <DrawingTools
                tool={tool}
                setTool={setTool}
                symmetry={symmetry}
                setSymmetry={setSymmetry}
              />
            </div>
          </div>
        </div>

        {/* Layer 2: Color and Palette Lab */}
        <div
          id="scene_layer_2"
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out z-10 select-none"
          style={
            isMobile
              ? { display: activeLayer === 2 ? "flex" : "none" }
              : {
                  transform: `translateZ(${(2 - activeLayer) * 600}px) translateY(${(2 - activeLayer) * 150}px) rotateY(${(2 - activeLayer) * -12}deg)`,
                  opacity: activeLayer === 2 ? 1 : Math.max(0, 1 - Math.abs(2 - activeLayer) * 0.5),
                  filter: activeLayer === 2 ? "none" : `blur(${Math.abs(2 - activeLayer) * 5}px)`,
                  pointerEvents: activeLayer === 2 ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }
          }
        >
          <SceneWanderers layerId={2} active={activeLayer === 2} />
          <div className="relative z-[1] max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div data-wanderer-bite className="lg:col-span-5 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full w-fit">
                <Palette className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-[8.5px] font-mono text-emerald-400 tracking-wider">QUANTIZED PALETTE SCHEMES</span>
              </div>
              <h2 className="text-3xl font-mono font-bold tracking-tight text-white uppercase leading-none">
                Color Compression
              </h2>
              <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                Indexed retro color mapping structures. Convert, extract, and auto-shade coordinate layouts dynamically to fit Retro NES, Gameboy Green, or Cyber Vaporwave themes without having to re-draw single pixels.
              </p>
              <div className="p-3.5 bg-neutral-950/60 border border-neutral-900 rounded-lg flex flex-col gap-2 max-w-md">
                <span className="text-[9px] font-mono text-neutral-500 font-bold">PALETTE COMPOSITION:</span>
                <div className="flex items-center gap-1">
                  {palette.map((c, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-neutral-900 shadow-sm"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 flex">
              <PaletteLab
                pixels={activeFramePixels}
                setPixels={updateActiveFramePixels}
                activeColor={activeColor}
                setActiveColor={setActiveColor}
                palette={palette}
                setPalette={setPalette}
              />
            </div>
          </div>
        </div>

        {/* Layer 3: Layers and 3D stack Timeline */}
        <div
          id="scene_layer_3"
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out z-10 select-none"
          style={
            isMobile
              ? { display: activeLayer === 3 ? "flex" : "none" }
              : {
                  transform: `translateZ(${(3 - activeLayer) * 600}px) translateY(${(3 - activeLayer) * 150}px) rotateY(${(3 - activeLayer) * -12}deg)`,
                  opacity: activeLayer === 3 ? 1 : Math.max(0, 1 - Math.abs(3 - activeLayer) * 0.5),
                  filter: activeLayer === 3 ? "none" : `blur(${Math.abs(3 - activeLayer) * 5}px)`,
                  pointerEvents: activeLayer === 3 ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }
          }
        >
          <SceneWanderers layerId={3} active={activeLayer === 3} />
          <div className="relative z-[1] max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div data-wanderer-bite className="lg:col-span-5 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full w-fit">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="text-[8.5px] font-mono text-amber-400 tracking-wider">CHRONO-COORDINATES FLOW</span>
              </div>
              <h2 className="text-3xl font-mono font-bold tracking-tight text-white uppercase leading-none">
                Layer Stacks
              </h2>
              <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                Stagger layers along 3D timelines. Activate transparent preview overlaps (Onion Skin Previous and Next) to paint walking behaviors, hovering elements, or combat behaviors seamlessly.
              </p>
              <div className="p-3 bg-neutral-950 border border-neutral-900 rounded font-mono text-[9px] text-neutral-500 max-w-md">
                💡 TIP: Press <span className="text-amber-400 font-bold">ONION PREV</span> above the stack to show translucent layouts of preceding frames while editing.
              </div>
            </div>
            <div className="lg:col-span-7 flex">
              <AnimationTimeline
                frames={frames}
                setFrames={setFrames}
                currentFrameIdx={currentFrameIdx}
                setCurrentFrameIdx={setCurrentFrameIdx}
                onionSkinPrev={onionSkinPrev}
                setOnionSkinPrev={setOnionSkinPrev}
                onionSkinNext={onionSkinNext}
                setOnionSkinNext={setOnionSkinNext}
                gridSize={gridSize}
              />
            </div>
          </div>
        </div>

        {/* Layer 4: Animation Studio Showcase */}
        <div
          id="scene_layer_4"
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out z-10 select-none"
          style={
            isMobile
              ? { display: activeLayer === 4 ? "flex" : "none" }
              : {
                  transform: `translateZ(${(4 - activeLayer) * 600}px) translateY(${(4 - activeLayer) * 150}px) rotateY(${(4 - activeLayer) * -12}deg)`,
                  opacity: activeLayer === 4 ? 1 : Math.max(0, 1 - Math.abs(4 - activeLayer) * 0.5),
                  filter: activeLayer === 4 ? "none" : `blur(${Math.abs(4 - activeLayer) * 5}px)`,
                  pointerEvents: activeLayer === 4 ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }
          }
        >
          <SceneWanderers layerId={4} active={activeLayer === 4} />
          <div className="relative z-[1] max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Explanations section */}
            <div data-wanderer-bite className="lg:col-span-5 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full w-fit">
                <Play className="w-3 h-3 text-red-500 animate-pulse" />
                <span className="text-[8.5px] font-mono text-red-400 tracking-wider">MOTION RENDER SCREEN</span>
              </div>
              <h2 className="text-3xl font-mono font-bold tracking-tight text-white uppercase leading-none">
                Animation Studio
              </h2>
              <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                Cycle walk templates or slash animations on a simulated retro screen console. Change frame rates or speed triggers, and verify frame timings easily.
              </p>
              <div className="p-3 px-4 rounded bg-neutral-950 border border-neutral-900 border-l-4 border-l-cyan-400 text-[10px] text-neutral-400 font-mono leading-relaxed max-w-md">
                <div className="text-[11px] font-bold text-white mb-1 uppercase tracking-wide">STUDIO ANALYTICS:</div>
                <div>RENDER TARGET: SPRITE CELL</div>
                <div>TOTAL FRAMES RECONSTRUCTED: {frames.length} slots</div>
              </div>
            </div>

            {/* Simulated floating CRT TV screen console playing walk cycle loop! */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div id="simulated_console_stage" data-scene-panel className="relative w-full max-w-[340px] aspect-square bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-md">
                <div className="absolute top-1.5 inset-x-0 flex justify-between px-3 text-[8.5px] font-mono text-neutral-600">
                  <span>CYBER MONITOR CHANNELS-09</span>
                  <span className="text-cyan-400 animate-pulse font-bold">● SIMULATOR PLAYING</span>
                </div>

                <div className="flex-1 w-full flex items-center justify-center p-6">
                  {/* The visual grid looping walking frames */}
                  <div
                    className="w-48 h-48 grid"
                    style={{
                      gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    }}
                  >
                    {(frames[currentFrameIdx] || createEmptyGrid(gridSize)).map((row, r) =>
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
                </div>

                <div className="w-full flex items-center justify-between border-t border-neutral-900 pt-2 text-[9px] font-mono text-neutral-500">
                  <span>RESOL: {gridSize}x{gridSize}px</span>
                  <span>INDEX FRAME: F{currentFrameIdx + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 5: AI Lab prompt suggestions generator */}
        <div
          id="scene_layer_5"
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out z-10 select-none"
          style={
            isMobile
              ? { display: activeLayer === 5 ? "flex" : "none" }
              : {
                  transform: `translateZ(${(5 - activeLayer) * 600}px) translateY(${(5 - activeLayer) * 150}px) rotateY(${(5 - activeLayer) * -12}deg)`,
                  opacity: activeLayer === 5 ? 1 : Math.max(0, 1 - Math.abs(5 - activeLayer) * 0.5),
                  filter: activeLayer === 5 ? "none" : `blur(${Math.abs(5 - activeLayer) * 5}px)`,
                  pointerEvents: activeLayer === 5 ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }
          }
        >
          <SceneWanderers layerId={5} active={activeLayer === 5} />
          <div className="relative z-[1] max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div data-wanderer-bite className="lg:col-span-5 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full w-fit">
                <Cpu className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="text-[8.5px] font-mono text-indigo-400 tracking-wider">NEURAL CO-PROCESSORS</span>
              </div>
              <h2 className="text-3xl font-mono font-bold tracking-tight text-white uppercase leading-none">
                AI Assistant Lab
              </h2>
              <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                Connect the Gemini 3.5 engine to automatically generate magical potion icons, spacecraft slimes, or cyber weapons from an English text command. Press auto-shade or outline to edit automatically on-screen.
              </p>
              <div className="p-3 bg-indigo-990/10 border border-indigo-900/30 rounded text-[9px] text-indigo-300 font-mono tracking-wide leading-relaxed max-w-md">
                ℹ️ CORE NOTE: Real Prompt-to-Pixel coordinates generation runs 100% server-side to hide API Keys and deliver premium cyber assets instantly!
              </div>
            </div>
            <div className="lg:col-span-7 flex">
              <AILab
                pixels={activeFramePixels}
                setPixels={updateActiveFramePixels}
                gridSize={gridSize}
                palette={palette}
                setPalette={setPalette}
              />
            </div>
          </div>
        </div>

        {/* Layer 6: Quantum Exporter panel */}
        <div
          id="scene_layer_6"
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out z-10 select-none"
          style={
            isMobile
              ? { display: activeLayer === 6 ? "flex" : "none" }
              : {
                  transform: `translateZ(${(6 - activeLayer) * 600}px) translateY(${(6 - activeLayer) * 150}px) rotateY(${(6 - activeLayer) * -12}deg)`,
                  opacity: activeLayer === 6 ? 1 : Math.max(0, 1 - Math.abs(6 - activeLayer) * 0.5),
                  filter: activeLayer === 6 ? "none" : `blur(${Math.abs(6 - activeLayer) * 5}px)`,
                  pointerEvents: activeLayer === 6 ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }
          }
        >
          <SceneWanderers layerId={6} active={activeLayer === 6} />
          <div className="relative z-[1] max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div data-wanderer-bite className="lg:col-span-5 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full w-fit">
                <Download className="w-3 h-3 text-cyan-400" />
                <span className="text-[8.5px] font-mono text-cyan-400 tracking-wider">COMPILED QUANTIZED OUTPUT</span>
              </div>
              <h2 className="text-3xl font-mono font-bold tracking-tight text-white uppercase leading-none">
                Export Options
              </h2>
              <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                Render frames side-by-side into a single high-contrast composited spritesheet, or copy engine JSON maps mapping index colors directly into Godot, Unity, or custom HTML5 retro canvases.
              </p>
              <div className="p-3 bg-neutral-950/80 border border-neutral-900 rounded font-mono text-[9px] text-neutral-500 max-w-md">
                Spritesheet downloads compile coordinates using an HTML5 memory canvas at 100% vector resolution!
              </div>
            </div>
            <div className="lg:col-span-7 flex">
              <ExportPanel
                frames={frames}
                palette={palette}
                gridSize={gridSize}
              />
            </div>
          </div>
        </div>

        {/* Layer 7: Community, template loaders and gallery */}
        <div
          id="scene_layer_7"
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out z-10 select-none"
          style={
            isMobile
              ? { display: activeLayer === 7 ? "flex" : "none" }
              : {
                  transform: `translateZ(${(7 - activeLayer) * 600}px) translateY(${(7 - activeLayer) * 150}px) rotateY(${(7 - activeLayer) * -12}deg)`,
                  opacity: activeLayer === 7 ? 1 : Math.max(0, 1 - Math.abs(7 - activeLayer) * 0.5),
                  filter: activeLayer === 7 ? "none" : `blur(${Math.abs(7 - activeLayer) * 5}px)`,
                  pointerEvents: activeLayer === 7 ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }
          }
        >
          <SceneWanderers layerId={7} active={activeLayer === 7} />
          <div className="relative z-[1] max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div data-wanderer-bite className="lg:col-span-5 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full w-fit">
                <Grid className="w-3 h-3 text-blue-400" />
                <span className="text-[8.5px] font-mono text-blue-400 tracking-wider">BLUEPRINT GALLERY CLONES</span>
              </div>
              <h2 className="text-3xl font-mono font-bold tracking-tight text-white uppercase leading-none">
                Community Lab
              </h2>
              <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                Click any of our classic user-submitted retro design templates to instantly load them right inside the live drawings editor! Build off existing foundations and customize weapon skins easily.
              </p>
              <div className="bg-neutral-950 text-neutral-500 rounded p-3 text-[9px] font-mono leading-relaxed border border-neutral-900 max-w-md">
                Clicking loading buttons instantly overwrites the active Hero canvas grid cells and color palette.
              </div>
            </div>

            <div data-scene-panel className="lg:col-span-7 flex flex-col gap-4 bg-neutral-900/40 border border-neutral-850 p-6 rounded-xl backdrop-blur-md w-full">
              <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 border-b border-neutral-800 pb-2 flex items-center gap-1">
                <Disc className="w-3.5 h-3.5 text-blue-400 animate-spin" /> LOADABLE RETRO BLUEPRINTS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PREMADE_GALLERY.map((p, idx) => {
                  return (
                    <div
                      key={idx}
                      id={`gallery_card_item_${idx}`}
                      className="p-3 bg-neutral-950/75 rounded-lg border border-neutral-800 flex flex-col items-center justify-between gap-3 group hover:border-blue-500/50 transition-all duration-300"
                    >
                      {/* Scaled Preview of template layout */}
                      <div
                        className="w-16 h-16 grid gap-0 border-neutral-850 p-1 bg-black/40 rounded"
                        style={{
                          gridTemplateRows: `repeat(${p.pixels.length}, minmax(0, 1fr))`,
                          gridTemplateColumns: `repeat(${p.pixels[0].length}, minmax(0, 1fr))`,
                        }}
                      >
                        {p.pixels.map((row, r) =>
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

                      <div className="flex flex-col items-center gap-1.5 w-full">
                        <span className="text-[10px] font-mono text-neutral-300 font-bold group-hover:text-white">
                          {p.name}
                        </span>
                        <button
                          id={`import_custom_preset_${p.name.replace(/\s+/g, '_')}`}
                          onClick={() => handleLoadPremade(p)}
                          className="w-full py-1 text-[9px] font-mono font-bold rounded bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-neutral-950 border border-blue-500/20 hover:border-transparent transition-all cursor-pointer"
                        >
                          LOAD ASSET
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Global bottom Layer Nav control for quick click glide */}
      <footer id="footer_stage_scrolling" className="absolute bottom-4 inset-x-0 h-14 flex items-center justify-between px-6 md:px-12 z-40 bg-transparent pointer-events-none">
        <div className="flex items-center gap-2 bg-neutral-950/80 border border-neutral-900 rounded-lg px-3 py-1.5 backdrop-blur-md pointer-events-auto">
          {/* Back Section */}
          <button
            id="global_back_section_btn"
            onClick={() => handleScrollToLayer(activeLayer - 1)}
            disabled={activeLayer === 0}
            className="p-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white rounded border border-neutral-800 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-neutral-500 font-bold tracking-widest pl-1">
            LAYER #{activeLayer}: <span className="text-cyan-400 uppercase">{NAVIGATION_LAYERS[activeLayer].name}</span>
          </span>
          {/* Adv Section */}
          <button
            id="global_forward_section_btn"
            onClick={() => handleScrollToLayer(activeLayer + 1)}
            disabled={activeLayer === 7}
            className="p-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white rounded border border-neutral-800 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] font-mono text-neutral-600 tracking-wider">
          G.creater Studio v3.5
        </div>
      </footer>
    </div>
  );
}
