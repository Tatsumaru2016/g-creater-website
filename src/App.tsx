/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Background3D } from './components/Background3D';
import {
  RoamingCharacters,
  generateInitialCharacters,
  updateCharacterMovement,
} from './components/Characters';
import { SlimeLinkHunt } from './components/SlimeLinkHunt';
import { GalagaUfoDogfight } from './components/GalagaUfoDogfight';
import { PixelEditor } from './components/PixelEditor';
import { DrawingTools } from './components/DrawingTools';
import { PaletteLayers } from './components/PaletteLayers';
import { AnimationTimeline } from './components/AnimationTimeline';
import { ExportAI } from './components/ExportAI';
import { SceneTitleMarioAct } from './components/SceneTitleMarioAct';
import { ScenePanelPacChase } from './components/ScenePanelPacChase';
import { PanelBorderDqDuel } from './components/PanelBorderDqDuel';
import HeaderInvaders from './components/HeaderInvaders';
import HeaderArkanoid from './components/HeaderArkanoid';
import { IceClimberWanderer } from './components/IceClimberWanderer';
import { GundamZakuDuel } from './components/GundamZakuDuel';
import { setInvaderSoundEnabled } from './audio/invaderAudio';
import { PixelCharacter } from './types';
const SCENE_PANEL_SELECTORS = [
  '#main-pixel-editor',
  '#scene-panel-1',
  '#scene-panel-2',
  '#scene-panel-3',
  '#scene-panel-4',
] as const;
const SCENE_DUEL_EDGES = [0, 1, 2, 3, 0] as const;

function sceneNear(progress: number, index: number): boolean {
  return Math.abs(progress - index) < 1.15;
}

function nearestScene(progress: number): number {
  return Math.max(0, Math.min(4, Math.round(progress)));
}
import { LanguageSelector, useI18n } from './i18n';
import { ContentAdmin } from './components/ContentAdmin';
import { 
  Compass, 
  Sparkles, 
  Users,
  UserX,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

const SCENE_IDS = [0, 1, 2, 3, 4] as const;
const CHARACTERS_VISIBLE_KEY = 'gcreater-characters-visible';

function readCharactersVisible(): boolean {
  try {
    const stored = localStorage.getItem(CHARACTERS_VISIBLE_KEY);
    if (stored === '0') return false;
    if (stored === '1') return true;
  } catch {
    /* ignore */
  }
  return true;
}

export default function App() {
  const { t, dict } = useI18n();
  const characterDialogues = (dict.characters as { dialogues: string[] }).dialogues;
  const characterHopLine = (dict.characters as { hop?: string }).hop ?? "Boing!";
  const slimeDefeatedLines =
    (dict.characters as { slimeDefeated?: string[] }).slimeDefeated ?? [
      "やられた…！",
    ];
  const linkBattleLines =
    (dict.characters as { linkBattle?: string[] }).linkBattle ?? [
      "やぁっ！",
    ];
  const [scrollIndex, setScrollIndex] = useState(0);
  const [scrollProgressSnap, setScrollProgressSnap] = useState(0);
  const scrollProgressRef = useRef(0);
  const sceneShellRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Character system
  const [characters, setCharacters] = useState<PixelCharacter[]>([]);

  // UI state
  const [isMuted, setIsMuted] = useState(true);
  const [charactersVisible, setCharactersVisible] = useState(readCharactersVisible);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [contentAdminOpen, setContentAdminOpen] = useState(false);

  // References for mobile swipes
  const touchStartY = useRef<number | null>(null);
  const isScrollingRef = useRef(false);

  // Initialize digital roamers on startup
  useEffect(() => {
    setCharacters(generateInitialCharacters());
  }, []);

  // Frame tick to move characters smoothly and slowly
  useEffect(() => {
    if (!charactersVisible) return;
    const handle = setInterval(() => {
      setCharacters((prev) =>
        updateCharacterMovement(prev, {
          dialogues: characterDialogues,
          hopLine: characterHopLine,
        })
      );
    }, 150);

    return () => clearInterval(handle);
  }, [charactersVisible, characterDialogues, characterHopLine]);

  const applySceneTransforms = (progress: number) => {
    sceneShellRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = Math.abs(progress - i);
      el.style.transform = `translateZ(${(i - progress) * 750}px) translateY(${(i - progress) * -110}px) rotateX(${(i - progress) * -3}deg)`;
      el.style.opacity = String(Math.max(0, 1 - dist));
      el.style.visibility = dist > 1.2 ? 'hidden' : 'visible';
      el.style.zIndex = String(Math.round(10 - dist * 2));
      el.style.pointerEvents = dist < 0.65 ? 'auto' : 'none';
    });
  };

  useLayoutEffect(() => {
    applySceneTransforms(scrollProgressRef.current);
  }, []);

  // 3D スクロールは DOM 直更新（React 再描画を抑制）
  useEffect(() => {
    let animId: number | null = null;
    let lastSnapAt = 0;
    const lerpSpeed = 0.085;

    const tick = () => {
      let keepGoing = false;
      const prev = scrollProgressRef.current;
      const diff = scrollIndex - prev;
      if (Math.abs(diff) >= 0.001) {
        scrollProgressRef.current = prev + diff * lerpSpeed;
        keepGoing = true;
      } else {
        scrollProgressRef.current = scrollIndex;
      }

      applySceneTransforms(scrollProgressRef.current);

      const now = performance.now();
      if (now - lastSnapAt > 120) {
        setScrollProgressSnap(scrollProgressRef.current);
        lastSnapAt = now;
      }

      animId = keepGoing ? requestAnimationFrame(tick) : null;
    };

    animId = requestAnimationFrame(tick);
    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, [scrollIndex]);

  // Throttled Scroll Engine - Prevents fast jumps between different tabs
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrollingRef.current) return;

      const threshold = 35;
      if (Math.abs(e.deltaY) > threshold) {
        isScrollingRef.current = true;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 600); // cooldown

        if (e.deltaY > 0) {
          setScrollIndex((prev) => Math.min(4, prev + 1));
        } else {
          setScrollIndex((prev) => Math.max(0, prev - 1));
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Support responsive swipe mechanics for smartphone screens
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY.current - touchEndY;

      const swipeThreshold = 50;
      if (Math.abs(diffY) > swipeThreshold) {
        if (diffY > 0) {
          // swipe up -> scroll down
          setScrollIndex((prev) => Math.min(4, prev + 1));
        } else {
          // swipe down -> scroll up
          setScrollIndex((prev) => Math.max(0, prev - 1));
        }
      }
      touchStartY.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Action callback when character is clicked!
  const handleCharacterAction = (id: string) => {
    // Generate lovely pixel dialogue
    setCharacters((prev) => 
      prev.map((char) => {
        if (char.id === id) {
          // Play classic sound or change states
          return {
            ...char,
            state: 'jump',
            dialogue: characterDialogues[Math.floor(Math.random() * characterDialogues.length)]
          };
        }
        return char;
      })
    );
  };

  useEffect(() => {
    setInvaderSoundEnabled(!isMuted);
  }, [isMuted]);

  const toggleSound = () => {
    setIsMuted((prev) => !prev);
  };

  const toggleCharactersVisible = () => {
    setCharactersVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CHARACTERS_VISIBLE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="relative min-h-screen bg-[#07070A] text-white selection:bg-[#00F5FF]/30 select-none overflow-hidden font-sans">
      
      {/* 3D Cosmic starry Canvas background */}
      <Background3D scrollIndex={scrollIndex} scrollProgress={scrollProgressSnap} />

      {/* Grid Phosphor Scanline Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.45)_95%)] pointer-events-none z-10" />

      {/* TOP GLOWING STATUS BAR HEADER */}
      <header id="spatial_global_header" className="fixed top-0 inset-x-0 h-16 border-b border-white/[0.05] bg-black/60 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4 min-w-0">
          <div id="header-brand-logo" className="relative group cursor-pointer shrink-0 flex items-center gap-1.5">
            <img
              src="/g-creater-logo.png"
              alt=""
              width={38}
              height={41}
              draggable={false}
              className="block select-none shrink-0"
              style={{ width: 38, height: 41, imageRendering: "pixelated" }}
            />
            <span data-wanderer-bite className="brand-pixel-text select-none pt-0.5">
              <span className="text-[#5CE1FF]">G</span>
              <span className="text-[#FF3333]">.</span>
              <span className="text-white">creater</span>
              <span className="text-[#FF3333]">.</span>
            </span>
            <div className="absolute top-full left-0 bg-black/90 border border-[#00F5FF] text-[8px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-[60]">
              {t("header.version")}
            </div>
          </div>
          <span className="hidden sm:inline text-[9px] font-mono px-2 py-0.5 rounded border border-white/10 text-gray-400 bg-white/5 uppercase shrink-0">
            {t("header.edition")}
          </span>
        </div>

        {/* Global Action items */}
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button
            id="g-btn-content-admin"
            type="button"
            onClick={() => setContentAdminOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-[10px] font-mono rounded-lg transition-all cursor-pointer"
            title={t("admin.open")}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("admin.open")}</span>
          </button>
          <button
            id="g-btn-characters"
            onClick={toggleCharactersVisible}
            className={`p-2 border rounded-lg transition-all cursor-pointer ${
              charactersVisible
                ? 'border-[#FF6AD5]/30 hover:border-[#FF6AD5]/60 bg-[#FF6AD5]/5 text-[#FF6AD5] hover:bg-[#FF6AD5]/10'
                : 'border-white/10 hover:border-white/25 bg-white/5 text-gray-500 hover:text-gray-300'
            }`}
            title={
              charactersVisible ? t('header.hideCharacters') : t('header.showCharacters')
            }
            aria-pressed={charactersVisible}
            aria-label={
              charactersVisible ? t('header.hideCharacters') : t('header.showCharacters')
            }
          >
            {charactersVisible ? <Users className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
          </button>
          <button
            id="g-btn-mute"
            onClick={toggleSound}
            className="p-2 border border-white/10 rounded-lg hover:border-[#00F5FF]/30 hover:bg-white/5 transition-all text-gray-400 hover:text-[#00F5FF] cursor-pointer"
            title={isMuted ? t("header.unmute") : t("header.mute")}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
          </button>

          {/* Quick specs overlay launcher */}
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#39FF14]/30 hover:border-[#39FF14]/80 bg-[#39FF14]/5 hover:bg-[#39FF14]/15 text-[#39FF14] text-[10px] font-mono rounded-lg transition-transform active:scale-95 shadow-[0_0_8px_rgba(57,255,20,0.1)] font-bold decoration-transparent"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("header.aiStudio")}</span>
          </a>
        </div>
      </header>

      <ContentAdmin open={contentAdminOpen} onClose={() => setContentAdminOpen(false)} />

      {/* タイトル下部・左：ミニインベーダー + アルカノイド */}
      <div
        className="fixed top-[3.65rem] left-4 sm:left-6 z-[55] flex flex-wrap gap-2 pointer-events-auto max-w-[calc(100vw-2rem)]"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5 shrink-0 w-[min(147px,calc((50vw-2.5rem)*2/3))]">
          <div id="header-mini-invaders" className="h-[68px]">
            <HeaderInvaders soundEnabled={!isMuted} />
          </div>
          <p className="text-[7px] leading-tight font-mono text-cyan-400/75 text-center tracking-tight pointer-events-none select-none px-0.5">
            {t("invaders.controlsLabel")}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 shrink-0 w-[min(147px,calc((50vw-2.5rem)*2/3))]">
          <div id="header-mini-arkanoid" className="h-[68px]">
            <HeaderArkanoid />
          </div>
          <p className="text-[7px] leading-tight font-mono text-cyan-400/75 text-center tracking-tight pointer-events-none select-none px-0.5">
            {t("arkanoid.controlsLabel")}
          </p>
        </div>
      </div>

      {/* CORE 3D CAROUSEL CORRIDOR */}
      <main className="relative z-20 h-screen w-full flex items-center justify-center perspective-[1200px] overflow-hidden select-none">
        
        {/* Dynamic Scene Containers */}
        <div 
          className="w-full max-w-6xl h-full flex items-center justify-center relative translate-y-4"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* SCENE 1: Hero canvas */}
          <div 
            ref={(el) => { sceneShellRefs.current[0] = el; }}
            className="absolute inset-0 flex flex-col justify-center items-center px-4 will-change-transform"
          >
            <div id="scene-title-hero" data-wanderer-bite className="text-center mb-5 max-w-2xl relative">
              <span id="scene-badge-0" className="relative z-[53] text-[10px] font-mono uppercase bg-cyan-500/10 border border-[#00F5FF]/30 text-[#00F5FF] px-2.5 py-0.5 rounded-full tracking-widest inline-block mb-3 animate-pulse">
                {t("scenes.0.badge")}
              </span>
              <h1 className="relative z-[53] text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 font-sans bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 uppercase">
                {t("scenes.0.title")}<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-lime-400 shadow-glow">
                  {t("scenes.0.titleAccent")}
                </span>
              </h1>
              <p className="relative z-[53] text-xs font-mono text-gray-400 max-w-lg mx-auto">
                {t("scenes.0.subtitle")}
              </p>
            </div>

            {sceneNear(scrollProgressSnap, 0) && <PixelEditor />}
          </div>

          {/* SCENE 2: Symmetry Tools */}
          <div 
            ref={(el) => { sceneShellRefs.current[1] = el; }}
            className="absolute inset-0 flex flex-col justify-center items-center px-4 will-change-transform"
          >
            <div data-wanderer-bite className="text-center mb-4 max-w-2xl">
              <span id="scene-badge-1" className="text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded-full tracking-widest inline-block mb-2">
                {t("scenes.1.badge")}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1 uppercase font-sans">
                {t("scenes.1.sectionTitle")}
              </h2>
            </div>

            {sceneNear(scrollProgressSnap, 1) && <DrawingTools />}
          </div>

          {/* SCENE 3: Palette & Layers */}
          <div 
            ref={(el) => { sceneShellRefs.current[2] = el; }}
            className="absolute inset-0 flex flex-col justify-center items-center px-4 will-change-transform"
          >
            <div data-wanderer-bite className="text-center mb-4 max-w-2xl">
              <span id="scene-badge-2" className="text-[10px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full tracking-widest inline-block mb-2">
                {t("scenes.2.badge")}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1 uppercase font-sans">
                {t("scenes.2.sectionTitle")}
              </h2>
            </div>

            {sceneNear(scrollProgressSnap, 2) && <PaletteLayers />}
          </div>

          {/* SCENE 4: Timeline */}
          <div 
            ref={(el) => { sceneShellRefs.current[3] = el; }}
            className="absolute inset-0 flex flex-col justify-center items-center px-4 will-change-transform"
          >
            <div data-wanderer-bite className="text-center mb-4 max-w-2xl">
              <span id="scene-badge-3" className="text-[10px] font-mono uppercase bg-pink-500/10 border border-pink-500/30 text-pink-300 px-2.5 py-0.5 rounded-full tracking-widest inline-block mb-2">
                {t("scenes.3.badge")}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1 uppercase font-sans">
                {t("scenes.3.sectionTitle")}
              </h2>
            </div>

            {sceneNear(scrollProgressSnap, 3) && <AnimationTimeline />}
          </div>

          {/* SCENE 5: Export & Neural Studio */}
          <div 
            ref={(el) => { sceneShellRefs.current[4] = el; }}
            className="absolute inset-0 flex flex-col justify-center items-center px-4 will-change-transform"
          >
            <div data-wanderer-bite className="text-center mb-4 max-w-2xl">
              <span id="scene-badge-4" className="text-[10px] font-mono uppercase bg-cyan-500/10 border border-[#00F5FF]/30 text-cyan-400 px-2.5 py-0.5 rounded-full tracking-widest inline-block mb-2">
                {t("scenes.4.badge")}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1 uppercase font-sans">
                {t("scenes.4.sectionTitle")}
              </h2>
            </div>

            {sceneNear(scrollProgressSnap, 4) && <ExportAI />}
          </div>

        </div>

        {charactersVisible && (
          <>
            <RoamingCharacters
              characters={characters}
              onTriggerAction={handleCharacterAction}
            />

            {sceneNear(scrollProgressSnap, nearestScene(scrollProgressSnap)) && (
              <>
                <SlimeLinkHunt
                  defeatedLines={slimeDefeatedLines}
                  linkLines={linkBattleLines}
                />
                <GalagaUfoDogfight />
              </>
            )}

            <IceClimberWanderer soundEnabled={!isMuted} scrollProgress={scrollProgressSnap} />

            <GundamZakuDuel />

            <SceneTitleMarioAct scrollProgress={scrollProgressSnap} />

            <ScenePanelPacChase
              panelSelector={SCENE_PANEL_SELECTORS[nearestScene(scrollProgressSnap)]}
              active={Math.abs(scrollProgressSnap - nearestScene(scrollProgressSnap)) < 0.55}
            />

            <PanelBorderDqDuel
              panelSelector={SCENE_PANEL_SELECTORS[nearestScene(scrollProgressSnap)]}
              active={Math.abs(scrollProgressSnap - nearestScene(scrollProgressSnap)) < 0.55}
              duelEdge={SCENE_DUEL_EDGES[nearestScene(scrollProgressSnap)]}
            />
          </>
        )}

      </main>

      {/* FLOATING DEPTH INDICATOR HUD */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-50">
        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest [writing-mode:vertical-lr]">
          {t("nav.depthAxis")}
        </span>
        <div className="w-[1px] h-12 bg-white/10" />

        {SCENE_IDS.map((sceneId) => {
          const active = scrollIndex === sceneId;
          const sid = String(sceneId);
          return (
            <button
              id={`hud-dot-scene-${sceneId}`}
              key={sceneId}
              onClick={() => setScrollIndex(sceneId)}
              className="group relative flex items-center justify-center cursor-pointer p-1"
            >
              <div 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 flex items-center justify-center border-2 ${
                  active 
                    ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_12px_rgba(0,245,255,0.8)] scale-110' 
                    : 'border-white/25 bg-transparent hover:border-white'
                }`}
              />
              
              {/* Hover Tooltip display scene parameters */}
              <div className="absolute right-full mr-4 bg-[#0A0A0E]/95 border border-white/10 p-2.5 rounded-lg text-left hidden group-hover:block w-48 shadow-xl pointer-events-none transition-opacity duration-200">
                <span className="text-[8px] font-mono text-cyan-400 font-black block mb-0.5">
                  {t("nav.sceneLabel", { n: sceneId + 1, tag: t(`scenes.${sid}.hudTag`) })}
                </span>
                <span className="text-xs font-sans font-bold text-white block mb-0.5">
                  {t(`scenes.${sid}.hudName`)}
                </span>
                <span className="text-[9px] font-mono text-gray-400 leading-normal block">
                  {t(`scenes.${sid}.hudDesc`)}
                </span>
              </div>
            </button>
          );
        })}

        <div className="w-[1px] h-12 bg-white/10" />
        <span className="text-[10px] font-mono text-cyan-400 font-extrabold bg-cyan-500/15 border border-cyan-500/20 px-1 py-0.5 rounded shadow-[0_0_6px_rgba(0,245,255,0.25)] select-none">
          {t("nav.zDepth", { n: scrollIndex + 1 })}
        </span>
      </nav>

      {/* FOOTER METRICS AND CONTEXT CARDS */}
      <footer className="fixed bottom-0 inset-x-0 h-10 border-t border-white/[0.05] bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-40 text-[9px] font-mono text-gray-500">
        <div>
          <span>{t("footer.renderer")}</span>
          <span className="hidden sm:inline text-gray-600 ml-4">{t("footer.coreTemp")}</span>
        </div>

        {/* Dynamic scrolling status instructions */}
        <div
          id="scroll-hint-bar"
          className="flex items-center gap-1.5 text-cyan-400 animate-pulse font-black"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("nav.scrollDesktop")}</span>
          <span className="inline sm:hidden">{t("nav.scrollMobile")}</span>
        </div>

        <div>
          <span>{t("footer.locTime")}</span>
        </div>
      </footer>

      {/* Side Chevron Scroll Assistants */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        <button
          id="btn-scroll-up"
          disabled={scrollIndex === 0}
          onClick={() => setScrollIndex(prev => Math.max(0, prev - 1))}
          className="p-2 border border-white/10 rounded-lg hover:border-[#00F5FF]/40 hover:bg-white/5 transition-all text-gray-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title={t("nav.scrollUp")}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          id="btn-scroll-down"
          disabled={scrollIndex === 4}
          onClick={() => setScrollIndex(prev => Math.min(4, prev + 1))}
          className="p-2 border border-white/10 rounded-lg hover:border-[#00F5FF]/40 hover:bg-white/5 transition-all text-gray-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title={t("nav.scrollDown")}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
