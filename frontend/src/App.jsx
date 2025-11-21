import { useState } from "react";
import NavBar from "./ui/NavBar.jsx";
import GameScene from "./game/GameScene.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import MapsScreen from "./screens/MapsScreen.jsx";

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
