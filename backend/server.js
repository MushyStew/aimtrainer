import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { loadMaps, saveMaps } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

let maps = await loadMaps();

app.get("/api/maps", (req, res) => {
  const search = (req.query.search || "").toLowerCase();
  let result = maps;
  if (search) {
    result = maps.filter(m => m.name.toLowerCase().includes(search));
  }
  res.json(result.slice(0, 50));
});

app.get("/api/maps/:id", (req, res) => {
  const map = maps.find(m => m.id === req.params.id);
  if (!map) return res.status(404).json({ error: "Map not found" });
  res.json(map);
});

app.post("/api/maps", async (req, res) => {
  const { name, targets } = req.body;
  if (!name || !Array.isArray(targets)) {
    return res.status(400).json({ error: "Invalid map data" });
  }

  const newMap = {
    id: nanoid(),
    name,
    targets,
    createdAt: new Date().toISOString()
  };

  maps.push(newMap);
  await saveMaps(maps);

  res.status(201).json(newMap);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
