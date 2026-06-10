import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { readSiteCopy, writeSiteCopy } from "./server/contentStore.ts";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = Number(process.env.PORT) || 3000;

// Initialize Gemini SDK lazily, safety check
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Procedural Art Generator fallback in case of no API key
function generateProceduralPixelArt(prompt: string, size: number = 16): {
  pixels: string[][];
  palette: string[];
  name: string;
  explanation: string;
} {
  const cleanPrompt = prompt.toLowerCase();
  const pixels: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill("#00000000"));

  let palette = ["#FF00AA", "#00F0FF", "#39FF14", "#FFFF00", "#000000", "#FFFFFF"];
  let name = "Procedural Nexus Core";
  let explanation = "Generated procedurally because Gemini API is not yet active in secrets.";

  // Generates simple procedural shapes based on prompt keywords
  if (cleanPrompt.includes("sword") || cleanPrompt.includes("weapon") || cleanPrompt.includes("blade")) {
    name = "Chrono Blade";
    palette = ["#12061A", "#61128E", "#00F0FF", "#FFFFFF", "#FFD700", "#808080"];
    explanation = "A gorgeous neon cyber sword generated procedurally via binary matrix translation.";
    // Draw sword handle and blade
    for (let i = 0; i < size; i++) {
      const idx = size - 1 - i;
      if (i < 3) {
        // Handle
        pixels[idx][i] = "#61128E";
        pixels[idx - 1 >= 0 ? idx - 1 : 0][i] = "#12061A";
      } else if (i === 3) {
        // Guard
        pixels[idx][i] = "#FFD700";
        if (idx + 1 < size) pixels[idx + 1][i] = "#FFD700";
        if (i - 1 >= 0) pixels[idx][i - 1] = "#FFD700";
      } else if (i < size - 2) {
        // Blade
        pixels[idx][i] = "#00F0FF";
        if (idx - 1 >= 0) pixels[idx - 1][i] = "#FFFFFF";
        if (i - 1 >= 0) pixels[idx][i - 1] = "#00F0FF";
      } else {
        // Blade tip
        pixels[idx][i] = "#FFFFFF";
      }
    }
  } else if (cleanPrompt.includes("potion") || cleanPrompt.includes("bottle") || cleanPrompt.includes("elixir")) {
    name = "Cyber Mana Elixir";
    palette = ["#110022", "#FF00AA", "#FF88DD", "#FFFFFF", "#00F0FF", "#111111"];
    explanation = "A retro magical beaker containing condensed, light-emitting radioactive neon compound.";
    
    const mid = Math.floor(size / 2);
    // Draw potion bottle silhoutte
    for (let r = 2; r < size - 1; r++) {
      const width = r < Math.floor(size / 3) + 2 ? 3 : Math.floor(size / 1.5);
      const halfW = Math.floor(width / 2);
      for (let c = mid - halfW; c <= mid + halfW; c++) {
        // Bottleneck
        if (r < Math.floor(size / 3) + 2) {
          if (c === mid - halfW || c === mid + halfW) {
            pixels[r][c] = "#FFFFFF"; // Glass rim
          } else {
            pixels[r][c] = "#110022"; // Empty bottle neck
          }
        } else {
          // Bottom bottle body
          if (c === mid - halfW || c === mid + halfW || r === size - 2) {
            pixels[r][c] = "#FFFFFF"; // Glass boundary
          } else {
            // Fill level
            if (r > Math.floor(size / 2)) {
              pixels[r][c] = c % 2 === 0 ? "#FF00AA" : "#FF88DD"; // Shimmer liquid
            } else {
              pixels[r][c] = "#00000000";
            }
          }
        }
      }
    }
  } else if (cleanPrompt.includes("slime") || cleanPrompt.includes("monster") || cleanPrompt.includes("ghost")) {
    name = "Neon Blob Ooze";
    palette = ["#121A06", "#39FF14", "#1E820A", "#FFFFFF", "#111111", "#FF00AA"];
    explanation = "A playful, vibrating lime-gelatin lifeform with light-up sensory pixels.";
    const mid = Math.floor(size / 2);
    for (let r = Math.floor(size / 4); r < size - 2; r++) {
      const progress = (r - Math.floor(size / 4)) / (size * 0.7);
      const width = Math.floor(size * 0.4 + progress * size * 0.5);
      const halfW = Math.floor(width / 2);
      for (let c = mid - halfW; c <= mid + halfW; c++) {
        const isCore = Math.abs(mid - c) < halfW - 1 && r < size - 3;
        if (isCore) {
          // Inner body
          pixels[r][c] = "#39FF14";
          // Eyes
          if (r === Math.floor(size / 2) && (c === mid - 2 || c === mid + 2)) {
            pixels[r][c] = "#111111";
          }
          if (r === Math.floor(size / 2) - 1 && (c === mid - 2 || c === mid + 2)) {
            pixels[r][c] = "#FFFFFF"; // eye highlight
          }
          // Cheeks / blush
          if (r === Math.floor(size / 2) + 1 && (c === mid - 3 || c === mid + 3)) {
            pixels[r][c] = "#FF00AA";
          }
        } else {
          // Border
          pixels[r][c] = "#1E820A";
        }
      }
    }
  } else if (cleanPrompt.includes("heart") || cleanPrompt.includes("love") || cleanPrompt.includes("health")) {
    name = "8-Bit Vitality Emblem";
    palette = ["#FF00AA", "#FF0055", "#990022", "#FFFFFF", "#111111"];
    explanation = "A pulsing heart containing digital revitalizing metrics.";
    const mid = Math.floor(size / 2);
    for (let r = 2; r < size - 2; r++) {
      for (let c = 1; c < size - 1; c++) {
        // Mathematically render an 8-bit heart
        const dx = Math.abs(c - mid);
        const dy = r - Math.floor(size / 3);
        if (r < Math.floor(size / 2)) {
          // Double lobes
          if ((c > 1 && c < mid - 1) || (c > mid + 1 && c < size - 2)) {
            pixels[r][c] = "#FF00AA";
            if (c === 3 || c === size - 4) pixels[r][c] = "#FFFFFF"; // highlight
          }
        } else {
          // Bottom taper
          if (dx <= size / 2 - (r - Math.floor(size / 2)) - 1) {
            pixels[r][c] = "#FF00AA";
            if (dx === 0 && r === size - 3) pixels[r][c] = "#990022";
          }
        }
      }
    }
    // Add border
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (pixels[r][c] !== "#00000000" && pixels[r][c] !== "#FFFFFF") {
          // Check neighbors
          let touchesTransparent = false;
          const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size || pixels[nr][nc] === "#00000000") {
              touchesTransparent = true;
            }
          }
          if (touchesTransparent && pixels[r][c] !== "#FFFFFF") {
            pixels[r][c] = "#990022";
          }
        }
      }
    }
  } else {
    // Default abstract retro spacecraft
    name = "Pixel Voyager-9";
    palette = ["#00F0FF", "#39FF14", "#111111", "#FFFFFF", "#FF00AA", "#FFFF00"];
    explanation = "A sleek cybernetic space fighter created using horizontal procedural generator symmetry.";
    const mid = Math.floor(size / 2);
    for (let r = 2; r < size - 2; r++) {
      const wingWidth = r < size / 2 ? r - 1 : size - r - 2;
      for (let c = mid - wingWidth; c <= mid + wingWidth; c++) {
        const isCore = c === mid;
        if (isCore) {
          pixels[r][c] = "#FFFFFF";
        } else {
          pixels[r][c] = r % 2 === 0 ? "#00F0FF" : "#FF00AA";
        }
      }
    }
  }

  return { pixels, palette, name, explanation };
}

// Global API endpoints
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Lab - Generate Pixel Art from prompt
app.post("/api/gemini/generate-pixel", async (req, res) => {
  try {
    const { prompt, size = 16 } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt parameter." });
    }

    const client = getGeminiClient();
    if (!client) {
      // Use premium procedural generation fallback if API Key is not configured
      const fallback = generateProceduralPixelArt(prompt, size);
      return res.json({
        ...fallback,
        isDemoMode: true,
        message: "No GEMINI_API_KEY configured. Displaying beautiful procedural simulation.",
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a gorgeous, iconic, authentic 8-bit/16-bit retro micro pixel art design of: "${prompt}". 
Our grid is ${size}x${size}. Render a highly stylized iconic design. 
Create a beautifully selected color palette containing up to 6 custom hex colors (+ transparent background "#00000000").
Provide the pixels as a 2D array of grid coordinates containing exactly ${size} rows, and each row containing exactly ${size} color elements. 
Make sure to make appropriate use of transparent background ("#00000000") where the pixel design has negative space to avoid a blocky output.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["pixels", "palette", "name", "explanation"],
          properties: {
            name: { type: Type.STRING, description: "Descriptive name of the pixel artwork" },
            explanation: { type: Type.STRING, description: "Description or lore behind your creative design pattern" },
            palette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of distinct Hex colors used in the artwork, including transparent colors if applicable.",
            },
            pixels: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              description: `A 2D string grid of precisely ${size} by ${size} hex color strings (e.g. '#FF0055' or '#00000000' for transparent).`,
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({
      ...parsedData,
      isDemoMode: false,
    });
  } catch (error: any) {
    console.error("Gemini API error in /api/gemini/generate-pixel:", error);
    // Graceful fallback to avoid breaking the user interface
    const fallback = generateProceduralPixelArt(req.body.prompt || "spacecraft", req.body.size || 16);
    return res.json({
      ...fallback,
      isDemoMode: true,
      error: error.message || String(error),
      message: "An error occurred with Gemini. Displaying procedural fallback.",
    });
  }
});

// AI Color Palette Optimiser
app.post("/api/gemini/palette-optimize", async (req, res) => {
  try {
    const { keyword } = req.body;
    const client = getGeminiClient();

    if (!client) {
      // Return beautiful preconfigured retro theme palettes
      const presets: Record<string, string[]> = {
        cyberpunk: ["#0B0A14", "#00F0FF", "#FF00AA", "#39FF14", "#FFFF00", "#FFFFFF"],
        vaporwave: ["#140526", "#FF71CE", "#01CDFE", "#05FFA1", "#B967FF", "#FFFB96"],
        gameboy: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f", "#e6f8da", "#ffffff"],
        lava: ["#150000", "#FF4500", "#FF8C00", "#FFD700", "#FFFFFF", "#2B0000"],
        arctic: ["#0c1424", "#00d2ff", "#a1f1fc", "#ffffff", "#005a9c", "#41729f"],
      };

      const selected = presets[keyword?.toLowerCase()] || presets.cyberpunk;
      return res.json({
        palette: selected,
        title: `${keyword ? keyword.toUpperCase() : "RETRO"} LAB OPTIMIZED`,
        description: "Generated dynamically via live structural procedural colors.",
        isDemoMode: true,
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a gorgeous, high-fidelity retro color palette based on this mood/keyword: "${keyword || "cyberpunk lab"}". 
It should contain exactly 6 gorgeous custom retro hex color values that look coherent together.
Suggest a fantastic evocative retro title and description of this design mood.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["palette", "title", "description"],
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            palette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({
      ...parsedData,
      isDemoMode: false,
    });
  } catch (error: any) {
    console.error("Gemini API error in /api/gemini/palette-optimize:", error);
    return res.json({
      palette: ["#0B0A14", "#00F0FF", "#FF00AA", "#39FF14", "#FFFF00", "#FFFFFF"],
      title: "FALLBACK MATRIX",
      description: "Fallback system colors activated because of connection timeout.",
      isDemoMode: true,
    });
  }
});

app.get("/api/site-copy", async (_req, res) => {
  try {
    const copy = await readSiteCopy();
    return res.json({ copy });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

app.put("/api/site-copy", async (req, res) => {
  try {
    const token = process.env.ADMIN_TOKEN;
    if (token && req.headers["x-admin-token"] !== token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const copy = req.body?.copy;
    if (!copy || typeof copy !== "object") {
      return res.status(400).json({ error: "Missing copy payload" });
    }
    await writeSiteCopy(copy);
    return res.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Setup Vite Dev Server / Static Asset Handler Middleware
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[G.creater Server] Cyber-Vessel successfully floating on http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Critical error starting G.creater full-stack server:", err);
});
