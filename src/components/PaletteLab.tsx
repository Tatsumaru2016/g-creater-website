import React, { useState } from "react";
import { RETRO_PALETTES } from "../data";
import { Palette, Sparkles, RefreshCw, Layers, Sliders } from "lucide-react";

interface PaletteLabProps {
  pixels: string[][];
  setPixels: React.Dispatch<React.SetStateAction<string[][]>>;
  activeColor: string;
  setActiveColor: (color: string) => void;
  palette: string[];
  setPalette: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PaletteLab({
  pixels,
  setPixels,
  activeColor,
  setActiveColor,
  palette,
  setPalette,
}: PaletteLabProps) {
  const [customColor, setCustomColor] = useState("#00F0FF");
  const [moodKeyword, setMoodKeyword] = useState("Vaporwave Lounge");
  const [aiLoading, setAiLoading] = useState(false);

  // Set preset palette from our standard selections
  const handleSelectPreset = (colors: string[]) => {
    setPalette(colors);
    // Auto-select first non-transparent color
    const firstNonTrans = colors.find((c) => c !== "#00000000") || colors[0];
    setActiveColor(firstNonTrans);
  };

  // Convert existing drawing cells index to match the new palette dynamically!
  const handleIndexedRecolor = (recolorPalette: string[]) => {
    // Collect distinct colors in current artwork neglecting transparent values
    const distinctColorsInArtwork = Array.from(
      new Set(pixels.flat().filter((c) => c !== "#00000000"))
    );

    const presetNonTransColors = recolorPalette.filter((c) => c !== "#00000000");

    // Mapping previous colors to new colors based on array indices
    const colorMap: Record<string, string> = {};
    distinctColorsInArtwork.forEach((oldCol, idx) => {
      // Rotate maps if old colors exceed target palette capacity
      const targetCol = presetNonTransColors[idx % presetNonTransColors.length];
      colorMap[oldCol] = targetCol;
    });

    setPixels((prev) =>
      prev.map((row) =>
        row.map((cell) => {
          if (cell === "#00000000") return cell;
          return colorMap[cell] || cell;
        })
      )
    );

    setPalette(recolorPalette);
    const firstNonTrans = recolorPalette.find((c) => c !== "#00000000") || recolorPalette[0];
    setActiveColor(firstNonTrans);
  };

  // Extract color palette list from actual drawing coordinates
  const handleExtractFromArtwork = () => {
    const extractedColors = Array.from(new Set(pixels.flat()));
    // Keep transparent at first element index
    const sortedExtracted = [
      "#00000000",
      ...extractedColors.filter((c) => c !== "#00000000"),
    ].slice(0, 8); // restrict to standard 8 index slots

    // Pad extraction with black if too small
    while (sortedExtracted.length < 8) {
      sortedExtracted.push("#111111");
    }

    setPalette(sortedExtracted);
    const firstActive = sortedExtracted.find((c) => c !== "#00000000") || sortedExtracted[0];
    setActiveColor(firstActive);
  };

  // Generate optimized custom retro palette from prompt/keyword via server-side Gemini route
  const handleAIQueryPalette = async () => {
    try {
      setAiLoading(true);
      const response = await fetch("/api/gemini/palette-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: moodKeyword }),
      });
      const data = await response.json();
      if (data.palette && data.palette.length > 0) {
        // Ensure transparent exists at start of the palette array
        const fullPal = [
          "#00000000",
          ...data.palette.filter((c: string) => c !== "#00000000" && c !== "transparent"),
        ].slice(0, 8);

        while (fullPal.length < 8) fullPal.push("#FFFFFF");

        setPalette(fullPal);
        const activeItem = fullPal.find((c) => c !== "#00000000") || fullPal[0];
        setActiveColor(activeItem);
      }
    } catch (err) {
      console.error("AI Palette error: ", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Add customized color to the active palette slot
  const handleReplaceActiveColor = (newColor: string) => {
    setPalette((prev) => {
      const idx = prev.findIndex((c) => c === activeColor);
      if (idx !== -1 && idx !== 0) {
        // do not replace transparent at index 0
        const next = [...prev];
        next[idx] = newColor;
        // Also update all instances in pixels inside drawing grid!
        setPixels((cells) =>
          cells.map((row) => row.map((c) => (c === activeColor ? newColor : c)))
        );
        return next;
      }
      return prev;
    });
    setActiveColor(newColor);
  };

  return (
    <div id="palette_lab_container" data-scene-panel className="flex flex-col gap-5 w-full bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl backdrop-blur-md">
      {/* Module Title */}
      <div id="palette_lab_title_row" className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Palette & Color Laboratory
          </h2>
        </div>
        <span className="text-[10px] font-mono text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/30">
          INDEXED COLOR MODE: ACTIVED
        </span>
      </div>

      {/* Preset palette cards selectors */}
      <div id="presets_selector_grid" className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" /> Retro Presets Swatches
          </label>
          <div className="flex flex-col gap-1.5 h-[140px] overflow-y-auto pr-1">
            {RETRO_PALETTES.map((p) => {
              const colorsExTrans = p.colors.filter((c) => c !== "#00000000");
              return (
                <div
                  key={p.name}
                  id={`preset_palette_${p.name.replace(/\s+/g, '_')}`}
                  className="flex items-center justify-between p-2 rounded bg-neutral-950/40 hover:bg-neutral-950/80 border border-neutral-800/80 transition-all group"
                >
                  <span className="text-xs font-mono text-neutral-300 font-medium group-hover:text-white">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Tiny preview color blocks */}
                    <div className="flex -space-x-1">
                      {colorsExTrans.slice(0, 5).map((col, k) => (
                        <div
                          key={k}
                          className="w-4 h-4 rounded-full border border-neutral-900 shadow-sm"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                    {/* Action convert buttons */}
                    <button
                      id={`apply_recolor_${p.name.replace(/\s+/g, '_')}`}
                      onClick={() => handleIndexedRecolor(p.colors)}
                      title="Apply palette recolor to current art cells"
                      className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-neutral-950 border border-emerald-500/20 transition-all font-bold cursor-pointer"
                    >
                      APPLY
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Interactive Color Palette Customizer Slot */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-red-500" /> Active Layout Swatches
          </label>
          <div className="flex flex-col gap-2 p-3 bg-neutral-950/40 border border-neutral-800 rounded h-[140px] justify-between">
            {/* The actual color swatches grid */}
            <div id="active_colors_row" className="flex flex-wrap items-center gap-2">
              {palette.map((color, idx) => {
                const isActive = activeColor === color;
                const isTrans = color === "#00000000";

                return (
                  <button
                    key={`${color}-${idx}`}
                    id={`palette_color_${idx}`}
                    onClick={() => setActiveColor(color)}
                    className={`group relative w-8 h-8 rounded border transition-all duration-150 transform hover:scale-110 ${
                      isActive
                        ? "border-white ring-2 ring-emerald-400 scale-105"
                        : "border-neutral-800 hover:border-neutral-500"
                    }`}
                    style={{
                      backgroundColor: isTrans ? "transparent" : color,
                      backgroundImage: isTrans
                        ? "linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)"
                        : "none",
                      backgroundSize: "6px 6px",
                    }}
                    title={isTrans ? "Indices 0: Transparent background Color" : color}
                  >
                    <span className="absolute bottom-0 right-0 text-[7px] bg-black/60 text-white leading-none px-0.5 rounded-tl">
                      {idx}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Customizer manual injector & extraction */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded w-full">
                <input
                  type="color"
                  id="hex_color_input"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    handleReplaceActiveColor(e.target.value);
                  }}
                  className="w-5 h-5 bg-transparent border-0 rounded cursor-pointer p-0"
                />
                <input
                  type="text"
                  id="hex_text_input"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleReplaceActiveColor(customColor);
                  }}
                  className="bg-transparent text-xs font-mono text-white p-0 focus:outline-none w-16"
                  placeholder="#Hex"
                />
              </div>

              <button
                id="extract_palette_btn"
                onClick={handleExtractFromArtwork}
                className="px-2.5 py-1 text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 hover:text-white rounded whitespace-nowrap transition-all flex items-center gap-1"
                title="Extract distinct colors currently drawn inside the canvas"
              >
                <Layers className="w-3.5 h-3.5" /> EXTRACT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligent AI Prompt Palette Laboratory */}
      <div id="ai_palette_lab" className="mt-2 bg-gradient-to-r from-emerald-950/20 to-teal-950/20 border border-emerald-900/30 p-3.5 rounded-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> NEURAL MOOD PALETTE GENERATOR
          </span>
          <span className="text-[9px] text-neutral-400 font-mono text-right">
            POWERED BY GEMINI 3.5
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            id="ai_palette_prompt"
            value={moodKeyword}
            onChange={(e) => setMoodKeyword(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-all"
            placeholder="e.g. lava fire, cosmic void, gameboy, matrix..."
          />
          <button
            id="ai_palette_generate_btn"
            onClick={handleAIQueryPalette}
            disabled={aiLoading}
            className={`px-3 py-1.5 text-xs font-mono rounded bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-neutral-900 transition-all whitespace-nowrap ${
              aiLoading ? "opacity-50 cursor-wait" : ""
            }`}
          >
            {aiLoading ? "NEURAL ENGINE..." : "GEN PALETTE"}
          </button>
        </div>
        <p className="text-[10px] font-mono text-neutral-500 leading-normal">
          AI suggests a coherent palette of 6 hex slots instantly matched to your thematic game level or design mood. Always safe for immediate sprite swap convert!
        </p>
      </div>
    </div>
  );
}
