import React, { useState } from "react";
import { Download, Copy, Code, Sparkles, Check, CheckSquare } from "lucide-react";

interface ExportPanelProps {
  frames: string[][][];
  palette: string[];
  gridSize: number;
}

export default function ExportPanel({ frames, palette, gridSize }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Generate and Download custom full spritesheet PNG dynamically!
  const handleDownloadSpritesheet = () => {
    try {
      setDownloading(true);
      const cellPixelSize = 16; // 16x16 render pixels per sprite cell
      const width = cellPixelSize * gridSize * frames.length;
      const height = cellPixelSize * gridSize;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Draw each frame side by side
      frames.forEach((frame, frameIdx) => {
        const offsetLeft = frameIdx * gridSize * cellPixelSize;

        frame.forEach((row, r) => {
          row.forEach((color, c) => {
            if (color !== "#00000000" && color !== "transparent") {
              ctx.fillStyle = color;
              ctx.fillRect(
                offsetLeft + c * cellPixelSize,
                r * cellPixelSize,
                cellPixelSize,
                cellPixelSize
              );
            }
          });
        });
      });

      // Trigger browser native download anchor
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "gcreater_spritesheet.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  // Compile JSON data mapping coordinates for unity / godot imports
  const getCompiledJSONString = (): string => {
    const data = {
      meta: {
        app: "G.creater Pixel Studio",
        version: "3.5",
        gridSize: gridSize,
        frameCount: frames.length,
        palette: palette.filter((c) => c !== "#00000000"),
      },
      animations: {
        defaultSequence: frames.map((frame, frameIdx) => ({
          frame: frameIdx,
          pixels: frame.map((row) =>
            row.map((color) => {
              // Return hex color string, or null for transparent vacancy
              return color === "#00000000" ? null : color;
            })
          ),
        })),
      },
    };
    return JSON.stringify(data, null, 2);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(getCompiledJSONString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="export_panel_widget" data-scene-panel className="flex flex-col gap-5 w-full bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl backdrop-blur-md">
      {/* Header */}
      <div id="export_panel_header" className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Quantized Export Engine
          </h2>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/30">
          ENGINE READY OUTPUT
        </span>
      </div>

      {/* Export download actions layout */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
          Native Compiled Targets
        </label>
        <div className="flex flex-col gap-2.5">
          {/* Spritesheet */}
          <button
            id="download_spritesheet_btn"
            onClick={handleDownloadSpritesheet}
            disabled={downloading}
            className="w-full py-2.5 rounded text-xs font-mono font-bold bg-gradient-to-r from-cyan-500/10 to-teal-500/10 hover:from-cyan-500/20 hover:to-teal-500/20 border border-cyan-500 text-cyan-400 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] cursor-pointer shadow-[0_4px_15px_rgba(0,240,255,0.05)]"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            {downloading ? "GENERATING COMPOSITED IMAGE..." : "DOWNLOAD ANIMATED SPRITESHEET (.PNG)"}
          </button>

          {/* Copy Coordinates */}
          <button
            id="copy_engine_json_btn"
            onClick={handleCopyJSON}
            className="w-full py-2.5 rounded text-xs font-mono font-bold bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">COPIED VECTOR MATRIX DATA!</span>
              </>
            ) : (
              <>
                <Code className="w-4 h-4 text-neutral-500" />
                <span>COPY GODOT/UNITY JSON METADATA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Copy Code Preview Box */}
      <div className="flex flex-col gap-1.5 mt-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500">
          <span>COORDINATES BUFFER PREVIEW:</span>
          <span>JSON FORMAT ({frames.length} FRAMES)</span>
        </div>
        <div className="bg-neutral-950/80 rounded border border-neutral-800 p-3 max-h-[140px] overflow-y-auto text-left">
          <pre className="text-[9px] font-mono text-neutral-400 whitespace-pre-wrap leading-relaxed">
            {getCompiledJSONString().slice(0, 900)}
            {"\n\n... [Remainder of frames matrix truncated for readability, copy to clipboard for full files]"}
          </pre>
        </div>
      </div>
    </div>
  );
}
