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
import React from 'react';

function MapGeometry({ map }) {
  if (!map?.objects) return null;

  return (
    <>
      {map.objects.map((obj) => {
        if (obj.type !== 'polygon' || !obj.vertices || obj.vertices.length < 3) return null;

        // simple: draw them as flat extruded walls in XZ plane
        const shape = new THREE.Shape(
          obj.vertices.map(
            (v, idx) => (idx === 0 ? new THREE.MoveTo(v.x, v.y) : new THREE.LineTo(v.x, v.y))
          )
        );

        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false });

        return (
          <mesh key={obj.id} geometry={geometry} position={[0, 2.5, 0]}>
            <meshStandardMaterial color={obj.fill ? obj.fill : '#0af'} />
          </mesh>
        );
      })}
    </>
  );
}

// then inside your main scene:
function GameScene({ map }) {
  return (
    <>
      {/* your existing floor, player, targets, etc. */}
      <MapGeometry map={map} />
    </>
  );
}

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
