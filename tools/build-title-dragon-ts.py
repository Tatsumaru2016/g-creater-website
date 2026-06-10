from PIL import Image
from pathlib import Path

T = "#00000000"
PAL = {
    "P0": "#382838",
    "P1": "#483878",
    "P2": "#584898",
    "P3": "#6868C8",
    "P4": "#7868E8",
    "PK": "#E87898",
    "PK2": "#C86888",
    "PK3": "#F8A8B8",
    "W0": "#582838",
    "W1": "#784858",
    "W2": "#883858",
    "H0": "#483868",
    "H1": "#7868D8",
    "M0": "#401818",
    "M1": "#F8F8F8",
    "E0": "#F8F8FF",
    "E1": "#302050",
}
PAL_RGB = {k: tuple(int(v[i : i + 2], 16) for i in (1, 3, 5)) for k, v in PAL.items()}
HEX = {**PAL, "T": T}


def nearest(rgb):
    r, g, b = rgb[:3]
    best = "P1"
    bd = 10**9
    for k, pr in PAL_RGB.items():
        d = (r - pr[0]) ** 2 + (g - pr[1]) ** 2 + (b - pr[2]) ** 2
        if d < bd:
            bd = d
            best = k
    return best


def load_grid(path, size=48):
    img = Image.open(path).convert("RGBA")
    if img.size != (size, size):
        img = img.resize((size, size), Image.NEAREST)
    grid = []
    for y in range(size):
        row = []
        for x in range(size):
            r, g, b, a = img.getpixel((x, y))
            row.append("T" if a < 100 else nearest((r, g, b)))
        grid.append(row)
    return grid


def wing_frame(grid):
    h = len(grid)
    w = len(grid[0])
    out = [r[:] for r in grid]
    for y in range(h - 1):
        for x in range(w // 2):
            if grid[y][x] in ("W0", "W1", "W2", "P0", "P1", "P2") and grid[y + 1][x] == "T":
                out[y][x] = "T"
                out[y + 1][x] = grid[y][x]
    return out


def emit_frame(grid, indent="    "):
    lines = []
    for row in grid:
        cells = ", ".join(f'"{HEX[c]}"' for c in row)
        lines.append(f"{indent}[{cells}],")
    return lines


grid0 = load_grid("public/title-dragon.png")
grid1 = wing_frame(grid0)
size = len(grid0)

out = Path("src/data/titleDragonSprites.ts")
mouth_pts = [
    (x, y)
    for y, row in enumerate(grid0)
    for x, c in enumerate(row)
    if c in ("M0", "E1", "M1") and y < size * 0.45 and x < size * 0.55
]
if mouth_pts:
    mx = sum(p[0] for p in mouth_pts) / len(mouth_pts)
    my = sum(p[1] for p in mouth_pts) / len(mouth_pts)
else:
    mx, my = size * 0.35, size * 0.12

out.write_text(
    "/** 参考PNG（竜王風）から生成したドット絵 — "
    + f"{size}×{size} */\n"
    + "export const TITLE_DRAGON_SIZE = "
    + str(size)
    + ";\n"
    + f"/** 口元（グリッド座標） */\n"
    + f"export const TITLE_DRAGON_MOUTH_X = {mx:.2f};\n"
    + f"export const TITLE_DRAGON_MOUTH_Y = {my:.2f};\n\n"
    + "export const TITLE_DRAGON_FRAMES: string[][][] = [\n"
    + "  [\n"
    + "\n".join(emit_frame(grid0, "    "))
    + "\n  ],\n  [\n"
    + "\n".join(emit_frame(grid1, "    "))
    + "\n  ],\n];\n",
    encoding="utf-8",
)
print("wrote", out, "size", size)
