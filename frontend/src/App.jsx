import { useState } from "react";
import NavBar from "./ui/NavBar.jsx";
import GameScene from "./game/GameScene.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import MapsScreen from "./screens/MapsScreen.jsx";
import React, { useState, useMemo } from 'react';
import MapEditorView from './components/MapEditorView';
import { createEmptyMap } from './state/mapEditorState';
// import your existing game here:
import Game from './Game'; // <- adjust if your file is named differently

const MAP_STORAGE_KEY = 'aimtrainer-user-map';

function loadMapFromStorage() {
  const saved = localStorage.getItem(MAP_STORAGE_KEY);
  if (!saved) return createEmptyMap();
  try {
    return JSON.parse(saved);
  } catch {
    return createEmptyMap();
  }
}

export default function App() {
  const [mode, setMode] = useState('play'); // 'play' | 'editor'
  const [mapVersion, setMapVersion] = useState(0);

  const mapData = useMemo(() => {
    // re-read map whenever mapVersion changes
    return loadMapFromStorage();
  }, [mapVersion]);

  if (mode === 'editor') {
    return (
      <MapEditorView
        onExit={() => {
          // bump version so play mode picks up fresh map
          setMapVersion((v) => v + 1);
          setMode('play');
        }}
      />
    );
  }

  // PLAY MODE
  return (
    <>
      {/* your existing game root, but now receives mapData */}
      <Game map={mapData} />

      {/* small overlay to enter editor */}
      <div
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <button onClick={() => setMode('editor')}>Open Map Editor</button>
      </div>
    </>
  );
}

export default function App() {
  const [mode, setMode] = useState("play");

  return (
    <>
      <NavBar mode={mode} setMode={setMode} />

      {mode === "play" && <GameScene />}
      {mode === "settings" && <SettingsScreen />}
      {mode === "maps" && <MapsScreen />}
    </>
  );
}
