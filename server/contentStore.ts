import fs from "fs/promises";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "site-copy.json");
const PUBLIC_PATH = path.join(process.cwd(), "public", "site-copy.json");

export type ServerSiteCopy = Record<string, Record<string, string>>;

export async function readSiteCopy(): Promise<ServerSiteCopy> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as ServerSiteCopy;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return { ja: {}, en: {}, zh: {}, ko: {} };
  }
}

export async function writeSiteCopy(copy: ServerSiteCopy): Promise<void> {
  const payload = JSON.stringify(copy, null, 2);
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, payload, "utf8");
  await fs.mkdir(path.dirname(PUBLIC_PATH), { recursive: true });
  await fs.writeFile(PUBLIC_PATH, payload, "utf8");
}
