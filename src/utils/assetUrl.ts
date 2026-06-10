/** public/ 配下のアセットを Vite base（GitHub Pages 含む）に合わせた URL で返す */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = path.replace(/^\//, "");
  return `${base}${normalized}`;
}
