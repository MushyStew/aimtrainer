import { promises as fs } from "fs";

const FILE = "./maps.json";

export async function loadMaps() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveMaps(maps) {
  await fs.writeFile(FILE, JSON.stringify(maps, null, 2), "utf-8");
}
