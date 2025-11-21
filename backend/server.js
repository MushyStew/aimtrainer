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
