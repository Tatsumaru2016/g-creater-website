import React from "react";
import { ToolMode, SymmetryMode } from "../types";
import { Pencil, Eraser, PaintBucket, Pipette, Compass, Check, HelpCircle, Shield, Split, Star } from "lucide-react";

interface DrawingToolsProps {
  tool: ToolMode;
  setTool: (t: ToolMode) => void;
  symmetry: SymmetryMode;
  setSymmetry: (s: SymmetryMode) => void;
}

export default function DrawingTools({
  tool,
  setTool,
  symmetry,
  setSymmetry,
}: DrawingToolsProps) {
  const toolsList: { id: ToolMode; label: string; icon: any; tooltip: string }[] = [
    {
      id: "pen",
      label: "Quantum Ink Pen",
      icon: Pencil,
      tooltip: "Core painting pen tool. Generates vibrant grid elements.",
    },
    {
      id: "eraser",
      label: "Molecular Eraser",
      icon: Eraser,
      tooltip: "Resets coordinates to transparent negative space.",
    },
    {
      id: "bucket",
      label: "Plasma Flood Bucket",
      icon: PaintBucket,
      tooltip: "BFS-flooded container expansion to paint continuous blocks.",
    },
    {
      id: "picker",
      label: "Chroma Pipette Picker",
      icon: Pipette,
      tooltip: "Instant hex color extractor from canvas cells.",
    },
  ];

  const symmetriesList: { id: SymmetryMode; label: string; icon: any; tooltip: string }[] = [
    {
      id: "none",
      label: "Single Axis",
      icon: Shield,
      tooltip: "Draw normally on single pixel offsets.",
    },
    {
      id: "horizontal",
      label: "Horizontal Mirror",
      icon: Split,
      tooltip: "Perfect horizontal reflection plane across grid center.",
    },
    {
      id: "vertical",
      label: "Vertical Mirror",
      icon: Star,
      tooltip: "Perfect vertical reflection plane across grid center.",
    },
    {
      id: "dual",
      label: "Dual Symmetrical Grid",
      icon: Compass,
      tooltip: "Both horizontal and vertical reflection active simultaneously.",
    },
    {
      id: "radial",
      label: "Radial Vortex Mirror",
      icon: Shield,
      tooltip: "Paints a beautiful 90-degree spiral rotation across all coordinates.",
    },
  ];

  return (
    <div id="drawing_tools_panel" className="flex flex-col gap-5 w-full bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl backdrop-blur-md">
      {/* Tools Section */}
      <div id="drawing_tools_section" className="flex flex-col gap-3">
        <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
          Primary Pixel Vector Nodes
        </label>
        <div className="grid grid-cols-2 gap-2">
          {toolsList.map((t) => {
            const Icon = t.icon;
            const isSel = tool === t.id;
            return (
              <button
                key={t.id}
                id={`tool_selector_${t.id}`}
                onClick={() => setTool(t.id)}
                title={t.tooltip}
                className={`flex items-center gap-2 p-2.5 rounded text-xs font-mono font-bold transition-all transform hover:scale-102 cursor-pointer ${
                  isSel
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                    : "bg-neutral-950/60 text-neutral-400 hover:text-white border border-neutral-800/80 hover:border-neutral-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? "text-cyan-400" : "text-neutral-500"}`} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Symmetries Section */}
      <div id="symmetry_tools_section" className="flex flex-col gap-3 pt-3 border-t border-neutral-800/80">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
            Symmetry Synthesis Engine
          </label>
          {symmetry !== "none" && (
            <span className="text-[8px] text-amber-500 font-mono bg-amber-950/30 px-1 border border-amber-900/30 rounded animate-pulse">
              ACTIVE
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 font-mono text-xs text-neutral-300">
          {symmetriesList.map((s) => {
            const Icon = s.icon;
            const isSel = symmetry === s.id;
            return (
              <button
                key={s.id}
                id={`symmetry_btn_${s.id}`}
                onClick={() => setSymmetry(s.id)}
                title={s.tooltip}
                className={`flex items-center justify-between p-2 rounded transition-all transform active:scale-98 cursor-pointer ${
                  isSel
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-neutral-950/40 text-neutral-400 hover:text-white border border-transparent hover:bg-neutral-950/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isSel ? "text-amber-400" : "text-neutral-500"}`} />
                  <span className="text-xs">{s.label}</span>
                </div>
                {isSel && <Check className="w-3.5 h-3.5 text-amber-500 font-bold" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
