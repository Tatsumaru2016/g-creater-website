import React, { useState } from "react";
import { Sparkles, BrainCircuit, Wand2, Hammer, Flame, Copy, HelpCircle } from "lucide-react";

interface AILabProps {
  pixels: string[][];
  setPixels: React.Dispatch<React.SetStateAction<string[][]>>;
  gridSize: number;
  palette: string[];
  setPalette: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function AILab({
  pixels,
  setPixels,
  gridSize,
  palette,
  setPalette,
}: AILabProps) {
  const [prompt, setPrompt] = useState("Cybernetic Plasma Sword");
  const [aiArtSize, setAiArtSize] = useState<number>(16);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    name: string;
    explanation: string;
    palette: string[];
    isDemoMode: boolean;
  } | null>(null);

  // Client-Side AI Assistance Algo: Outline Shader Helper
  const handleApplyOuterOutline = () => {
    // Collect non-empty cells
    const outlineColor = "#000000"; // standard sprite outline black
    setPixels((prev) => {
      const next = prev.map((row) => [...row]);
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (prev[r][c] === "#00000000") {
            // Check neighbors for colored pixels
            const neighbors = [
              [r - 1, c],
              [r + 1, c],
              [r, c - 1],
              [r, c + 1],
            ];
            const touchesGraphic = neighbors.some(([nr, nc]) => {
              return (
                nr >= 0 &&
                nr < gridSize &&
                nc >= 0 &&
                nc < gridSize &&
                prev[nr][nc] !== "#00000000" &&
                prev[nr][nc] !== outlineColor
              );
            });
            if (touchesGraphic) {
              next[r][c] = outlineColor;
            }
          }
        }
      }
      return next;
    });

    // Ensure Outline color is added to current Swatches if not present
    if (!palette.includes(outlineColor)) {
      setPalette((p) => {
        const next = [...p];
        if (next.length < 8) next.push(outlineColor);
        else next[next.length - 1] = outlineColor;
        return next;
      });
    }
  };

  // Client-Side AI Assistance Algo: Edge Shadow Auto-Shader
  const handleAutoShade = () => {
    setPixels((prev) => {
      const next = prev.map((row) => [...row]);
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const currentVal = prev[r][c];
          if (currentVal !== "#00000000" && currentVal !== "#000000") {
            // Bottom-right edge cells receive shadow shading
            const hasRightNeighborColored =
              c + 1 < gridSize ? prev[r][c + 1] !== "#00000000" : false;
            const hasBottomNeighborColored =
              r + 1 < gridSize ? prev[r + 1][c] !== "#00000000" : false;

            if (!hasRightNeighborColored || !hasBottomNeighborColored) {
              // Convert current color to minor dark value
              next[r][c] = adjustColorBrightness(currentVal, -15);
            }

            // Top-left corners receive lighting/highlights
            const hasLeftNeighborCoord = c - 1 >= 0 ? prev[r][c - 1] === "#00000000" : true;
            const hasTopNeighborCoord = r - 1 >= 0 ? prev[r - 1][c] === "#00000000" : true;

            if (hasLeftNeighborCoord && hasTopNeighborCoord) {
              next[r][c] = adjustColorBrightness(currentVal, 15);
            }
          }
        }
      }
      return next;
    });
  };

  // Helper function to darken/lighten Hex colors dynamically
  const adjustColorBrightness = (hex: string, percent: number): string => {
    if (!hex.startsWith("#")) return hex;
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.min(255, Math.max(0, Math.round(r + (255 * percent) / 100)));
    g = Math.min(255, Math.max(0, Math.round(g + (255 * percent) / 100)));
    b = Math.min(255, Math.max(0, Math.round(b + (255 * percent) / 100)));

    const rs = r.toString(16).padStart(2, "0");
    const gs = g.toString(16).padStart(2, "0");
    const bs = b.toString(16).padStart(2, "0");

    return `#${rs}${gs}${bs}`;
  };

  // Fully active Prompt-to-Pixel integration calling server-side Gemini route
  const handlePromptGenerate = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gemini/generate-pixel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: aiArtSize }),
      });
      const data = await res.json();

      if (data.pixels && data.pixels.length > 0) {
        // Safe check rows sizing match
        const alignedPixels = data.pixels.map((row: string[]) => {
          if (row.length < aiArtSize) {
            return [...row, ...Array(aiArtSize - row.length).fill("#00000000")];
          }
          return row.slice(0, aiArtSize);
        });

        setPixels(alignedPixels);
        if (data.palette && data.palette.length > 0) {
          const filledPalette = [
            "#00000000",
            ...data.palette.filter((c: string) => c !== "#00000000" && c !== "transparent"),
          ].slice(0, 8);
          setPalette(filledPalette);
        }

        setAiResponse({
          name: data.name || "AI Generated Artwork",
          explanation: data.explanation || "Coherent rendering produced by Neural WebGL Studio.",
          palette: data.palette || [],
          isDemoMode: !!data.isDemoMode,
        });
      }
    } catch (err) {
      console.error("AI Art Generate API error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai_lab_panel" data-scene-panel className="flex flex-col gap-5 w-full bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl backdrop-blur-md">
      {/* Header */}
      <div id="ai_lab_header" className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-400 rotate-animation" />
          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Neural AI Assistance Lab
          </h2>
        </div>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-990/20 px-2 py-0.5 rounded border border-indigo-500/30">
          GEMINI CORE 3.5 ACTIVE
        </span>
      </div>

      {/* Local quick helpers shaders */}
      <div id="local_ai_assist_section" className="flex flex-col gap-2.5">
        <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1">
          <Wand2 className="w-3.5 h-3.5 text-indigo-400" /> Co-Processor Local Macros
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="local_assisted_outline_btn"
            onClick={handleApplyOuterOutline}
            className="flex items-center justify-center gap-1.5 p-2 px-3 text-xs font-mono font-bold rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all transform active:scale-95 cursor-pointer"
            title="Auto-generates classic heavy black pixel outline overlay wrapping empty edges"
          >
            <Hammer className="w-3.5 h-3.5 text-amber-500" /> OUTLINE SPRITE
          </button>
          <button
            id="local_assisted_shade_btn"
            onClick={handleAutoShade}
            className="flex items-center justify-center gap-1.5 p-2 px-3 text-xs font-mono font-bold rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all transform active:scale-95 cursor-pointer"
            title="Slices bottom right coordinates with minor shading and top left corners with highlight colors"
          >
            <Flame className="w-3.5 h-3.5 text-red-500" /> AUTO-SHADE ART
          </button>
        </div>
      </div>

      {/* Neural Prompt generator core workspace */}
      <div id="prompt_neural_art" className="flex flex-col gap-3.5 pt-3 border-t border-neutral-800/80">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest flex items-center justify-between">
            <span>Instant Prompt-To-Pixel generator</span>
            <span className="text-cyan-400 uppercase text-[9px] font-bold">Size: {aiArtSize}x{aiArtSize}</span>
          </label>
          <div className="flex items-center gap-2">
            {[16, 32].map((sz) => (
              <button
                key={sz}
                id={`ai_preset_res_${sz}`}
                type="button"
                onClick={() => setAiArtSize(sz)}
                className={`px-2 py-0.5 text-[9px] font-mono rounded border ${
                  aiArtSize === sz
                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                    : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white"
                }`}
              >
                Grid: {sz}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            id="ai_pixel_prompt_textarea"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
            placeholder="Describe your retro asset, e.g. '8-bit fiery molten lava shield glowing'..."
          />
          <button
            id="ai_canvas_generate_submit_btn"
            onClick={handlePromptGenerate}
            disabled={loading}
            className={`w-full py-2.5 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all outline-none ${
              loading
                ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-wait"
                : "bg-indigo-500/20 border border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-neutral-950 cursor-pointer"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {loading ? "QUANTUM RASTERING INTEGRATION CHANNELS..." : "TRANSLATE PROMPT INTO PIXELS"}
          </button>
        </div>

        {/* AI response feedback panel */}
        {aiResponse && (
          <div id="ai_neural_data_response" className="p-3 bg-neutral-950/60 border border-indigo-900/40 rounded flex flex-col gap-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <span className="text-xs font-mono text-indigo-400 font-bold uppercase">
                {aiResponse.name}
              </span>
              {aiResponse.isDemoMode && (
                <span className="text-[7.5px] font-mono text-amber-500 border border-amber-500/30 px-1 bg-amber-500/10 rounded">
                  FALLBACK ACTIVE
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-neutral-400 leading-normal">
              {aiResponse.explanation}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[8px] font-mono text-neutral-600 uppercase pr-1">SCHEMES:</span>
              <div className="flex gap-0.5">
                {aiResponse.palette.slice(0, 6).map((col, x) => (
                  <div
                    key={x}
                    className="w-2.5 h-2.5 rounded-full border border-neutral-900"
                    style={{ backgroundColor: col }}
                    title={col}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
