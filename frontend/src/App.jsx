// ------------------------------------------------------------
// Imports
// ------------------------------------------------------------
import React, { useState } from "react";

import NavBar from "./ui/NavBar.jsx";
import GameScene from "./game/GameScene.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import MapsScreen from "./screens/MapsScreen.jsx";

// NEW: map editor
import MapEditorView from "./components/MapEditorView.jsx";


// ------------------------------------------------------------
// Main App Component
// ------------------------------------------------------------
export default function App() {
  const [mode, setMode] = useState("play"); 
  // modes: "play", "settings", "maps", "editor"

  return (
    <>
      <NavBar mode={mode} setMode={setMode} />

      {/* GAMEPLAY */}
      {mode === "play" && <GameScene />}

      {/* SETTINGS SCREEN */}
      {mode === "settings" && <SettingsScreen />}

      {/* MAPS MENU SCREEN */}
      {mode === "maps" && <MapsScreen />}

      {/* MAP EDITOR SCREEN */}
      {mode === "editor" && (
        <MapEditorView
          onExit={() => {
            setMode("play"); // go back to game after saving
          }}
        />
      )}
    </>
  );
}
