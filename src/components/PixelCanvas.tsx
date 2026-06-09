import React, { useState, useRef, useEffect } from "react";
import { ToolMode, SymmetryMode } from "../types";
import { Grid, Eye, EyeOff, Trash2, ShieldAlert, Divide } from "lucide-react";

interface PixelCanvasProps {
  pixels: string[][];
  setPixels: React.Dispatch<React.SetStateAction<string[][]>>;
  activeColor: string;
  palette: string[];
  tool: ToolMode;
  symmetry: SymmetryMode;
  gridSize: number;
  setGridSize: (size: number) => void;
  onionSkinPrev?: string[][];
  onionSkinNext?: string[][];
  onPixelClick?: (r: number, c: number) => void;
}

export default function PixelCanvas({
  pixels,
  setPixels,
  activeColor,
  palette,
  tool,
  symmetry,
  gridSize,
  setGridSize,
  onionSkinPrev,
  onionSkinNext,
  onPixelClick,
}: PixelCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Resize canvas safely while keeping existing art centered if possible
  const handleResizeGrid = (newSize: number) => {
    const nextGrid = Array(newSize)
      .fill(null)
      .map(() => Array(newSize).fill("#00000000"));

    const minSize = Math.min(gridSize, newSize);
    const offsetSource = Math.floor((gridSize - minSize) / 2);
    const offsetTarget = Math.floor((newSize - minSize) / 2);

    for (let r = 0; r < minSize; r++) {
      for (let c = 0; c < minSize; c++) {
        const sourceR = r + offsetSource;
        const sourceC = c + offsetSource;
        const targetR = r + offsetTarget;
        const targetC = c + offsetTarget;
        if (
          sourceR < gridSize &&
          sourceC < gridSize &&
          targetR < newSize &&
          targetC < newSize
        ) {
          nextGrid[targetR][targetC] = pixels[sourceR][sourceC];
        }
      }
    }
    setGridSize(newSize);
    setPixels(nextGrid);
  };

  // Standard BFS Flood Fill Bucket
  const floodFill = (startR: number, startC: number, targetCol: string, replaceCol: string) => {
    if (targetCol === replaceCol) return;
    const grid = pixels.map((row) => [...row]);
    const queue: [number, number][] = [[startR, startC]];

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;
      if (grid[r][c] !== targetCol) continue;

      grid[r][c] = replaceCol;

      queue.push([r + 1, c]);
      queue.push([r - 1, c]);
      queue.push([r, c + 1]);
      queue.push([r, c - 1]);
    }
    setPixels(grid);
  };

  // Calculate Symmetrical points to update
  const getSymmetricPoints = (r: number, c: number): { r: number; c: number }[] => {
    const points = [{ r, c }];
    const mid = (gridSize - 1) / 2;

    if (symmetry === "horizontal" || symmetry === "dual") {
      const mirroredC = Math.round(2 * mid - c);
      if (mirroredC >= 0 && mirroredC < gridSize) {
        points.push({ r, c: mirroredC });
      }
    }

    if (symmetry === "vertical" || symmetry === "dual") {
      const mirroredR = Math.round(2 * mid - r);
      if (mirroredR >= 0 && mirroredR < gridSize) {
        points.push({ r: mirroredR, c });
      }
    }

    if (symmetry === "dual") {
      const mirroredR = Math.round(2 * mid - r);
      const mirroredC = Math.round(2 * mid - c);
      if (mirroredR >= 0 && mirroredR < gridSize && mirroredC >= 0 && mirroredC < gridSize) {
        points.push({ r: mirroredR, c: mirroredC });
      }
    }

    if (symmetry === "radial") {
      // 90, 180, 270 degree rotations around core center
      const pts = [
        { r: c, c: gridSize - 1 - r },
        { r: gridSize - 1 - r, c: gridSize - 1 - c },
        { r: gridSize - 1 - c, c: r },
      ];
      pts.forEach((p) => {
        if (p.r >= 0 && p.r < gridSize && p.c >= 0 && p.c < gridSize) {
          points.push(p);
        }
      });
    }

    return points;
  };

  // Perform draw operation on targeted cell
  const drawCell = (r: number, c: number) => {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return;

    if (tool === "picker") {
      const pickedColor = pixels[r][c];
      if (onPixelClick) onPixelClick(r, c);
      return;
    }

    const valueToApply = tool === "eraser" ? "#00000000" : activeColor;

    if (tool === "bucket") {
      const targetColor = pixels[r][c];
      floodFill(r, c, targetColor, valueToApply);
      return;
    }

    // Pen Tool Drawing with Symmetry options
    setPixels((prev) => {
      const next = prev.map((row) => [...row]);
      const targetCells = getSymmetricPoints(r, c);
      targetCells.forEach(({ r: tr, c: tc }) => {
        next[tr][tc] = valueToApply;
      });
      return next;
    });
  };

  const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    drawCell(r, c);
  };

  const handleMouseEnterCell = (r: number, c: number) => {
    setHoveredCell({ r, c });
    if (isDrawing) {
      drawCell(r, c);
    }
  };

  const handleMouseLeaveCanvas = () => {
    setHoveredCell(null);
    setIsDrawing(false);
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      setIsDrawing(false);
    };
    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, []);

  const handleClearCanvas = () => {
    if (confirm("Reset current screen? This resets active frame progress.")) {
      setPixels(
        Array(gridSize)
          .fill(null)
          .map(() => Array(gridSize).fill("#00000000"))
      );
    }
  };

  return (
    <div id="pixel_canvas_editor_wrapper" className="relative select-none flex flex-col items-center gap-4 w-full">
      {/* Canvas Toolbars controls */}
      <div id="canvas_top_toolbar" className="flex flex-wrap items-center justify-between w-full gap-2 px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg">
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-neutral-400 mr-2">GRID RESOLUTION:</span>
          {[8, 16, 32].map((sz) => (
            <button
              key={sz}
              id={`grid_size_btn_${sz}`}
              onClick={() => handleResizeGrid(sz)}
              className={`px-2 py-1 font-mono text-xs rounded transition-all duration-150 ${
                gridSize === sz
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  : "bg-neutral-800 text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              {sz}x{sz}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggles */}
          <button
            id="toggle_grid_btn"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Pixel Gridlines"
            className={`p-1.5 rounded border transition-all ${
              showGrid
                ? "bg-neutral-800 border-cyan-500/30 text-cyan-400"
                : "bg-transparent border-neutral-800 text-neutral-500"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            id="clear_canvas_btn"
            onClick={handleClearCanvas}
            title="Trash Core Canvas Grid"
            className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-900/30 text-red-400 hover:text-red-200 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Pixel Art Core interactive screen */}
      <div
        id="pixel_canvas_drawing_stage"
        data-scene-panel
        ref={canvasRef}
        onMouseLeave={handleMouseLeaveCanvas}
        className="relative aspect-square w-full max-w-[420px] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center justify-center p-2 group"
        style={{ cursor: tool === "picker" ? "copy" : "crosshair" }}
      >
        {/* Subtle retro scanline CRT effect */}
        <div id="scanline_overlay" className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 z-10" />

        {/* Outer CRT curvature shadow */}
        <div id="crt_glow_shadow" className="absolute inset-0 pointer-events-none rounded-xl inset-shadow-xs shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] z-10" />

        {/* Live Grid Canvas Layout */}
        <div
          id="pixel_cells"
          className="grid w-full h-full p-1"
          style={{
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {pixels.map((row, r) =>
            row.map((cellColor, c) => {
              // Extract layers colors for onion skin effect
              const hasOnionPrev = onionSkinPrev && onionSkinPrev[r]?.[c] !== "#00000000";
              const onionPrevCol = onionSkinPrev?.[r]?.[c];
              const hasOnionNext = onionSkinNext && onionSkinNext[r]?.[c] !== "#00000000";
              const onionNextCol = onionSkinNext?.[r]?.[c];

              // Base style
              const isCellTransparent = cellColor === "#00000000";

              return (
                <div
                  key={`${r}-${c}`}
                  id={`pixel_cell_${r}_${c}`}
                  onMouseDown={(e) => handleMouseDown(r, c, e)}
                  onMouseEnter={() => handleMouseEnterCell(r, c)}
                  className={`relative aspect-square transition-all duration-75 select-none ${
                    showGrid ? "border-[0.5px] border-neutral-900/40" : ""
                  }`}
                  style={{
                    backgroundColor: isCellTransparent ? "transparent" : cellColor,
                    // Checkered transparent pattern behind vacant artwork cells
                    backgroundImage: isCellTransparent
                      ? "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)"
                      : "none",
                    backgroundSize: "8px 8px",
                    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                  }}
                >
                  {/* Onion skins rendering */}
                  {isCellTransparent && hasOnionPrev && (
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{ backgroundColor: onionPrevCol }}
                    />
                  )}
                  {isCellTransparent && !hasOnionPrev && hasOnionNext && (
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{ backgroundColor: onionNextCol }}
                    />
                  )}

                  {/* Symmetry mirror line previews overlays inside the cells */}
                  {hoveredCell && hoveredCell.r === r && hoveredCell.c === c && (
                    <div className="absolute inset-0 bg-white/20 border border-white/60 pointer-events-none z-20" />
                  )}

                  {/* Symmetrical shadow highlights to preview mirror effect */}
                  {isDrawing && hoveredCell && (
                    getSymmetricPoints(hoveredCell.r, hoveredCell.c).some(
                      (p) => p.r === r && p.c === c
                    ) && (
                      <div className="absolute inset-0 bg-amber-400/35 border border-amber-300 pointer-events-none z-20 animate-pulse" />
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dynamic Grid Position Coordinates overlay HUD */}
      <div id="position_hud" className="flex items-center gap-4 text-[10px] font-mono tracking-widest text-neutral-500 select-none bg-neutral-900/30 px-3 py-1.5 rounded-full border border-neutral-800/50">
        <span className="flex items-center gap-1">
          <span className="text-cyan-400 font-bold">X:</span>{" "}
          <span className="text-neutral-300">{hoveredCell ? hoveredCell.c + 1 : "--"}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-magenta-400 font-bold text-red-400">Y:</span>{" "}
          <span className="text-neutral-300">{hoveredCell ? hoveredCell.r + 1 : "--"}</span>
        </span>
        <span className="text-neutral-600">|</span>
        <span className="text-neutral-400">
          ACTIVE CELL COLOR:{" "}
          <span
            className="inline-block w-2.5 h-2.5 rounded border border-neutral-700 ml-1 translate-y-[1px]"
            style={{ backgroundColor: activeColor }}
          />{" "}
          <span className="uppercase">{activeColor}</span>
        </span>
      </div>
    </div>
  );
}
