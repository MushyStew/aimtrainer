import { useSettings } from "../state/settings.js";

const Slider = ({ label, value, min, max, step, onChange }) => (
  <div style={{ marginBottom: "18px" }}>
    <div style={{ marginBottom: "5px", fontSize: "14px" }}>
      <b>{label}</b>: {value}
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  </div>
);

export default function SettingsPanel() {
  const { settings, setSetting, setCrosshair } = useSettings();

  return (
    <div className="panel">
      <h1>Settings</h1>

      <Slider
        label="Sensitivity"
        value={settings.sensitivity}
        min={0.1}
        max={5}
        step={0.1}
        onChange={(v) => setSetting("sensitivity", v)}
      />

      <Slider
        label="FOV"
        value={settings.fov}
        min={60}
        max={120}
        step={1}
        onChange={(v) => setSetting("fov", v)}
      />

      <Slider
        label="Resolution Scale"
        value={settings.resolutionScale}
        min={0.5}
        max={1.0}
        step={0.01}
        onChange={(v) => setSetting("resolutionScale", v)}
      />

      <Slider
        label="FPS Cap"
        value={settings.fpsCap}
        min={30}
        max={240}
        step={1}
        onChange={(v) => setSetting("fpsCap", v)}
      />

      <h2 style={{ marginTop: "25px", fontSize: "20px" }}>Crosshair</h2>

      <div style={{ marginBottom: "12px" }}>
        <div>Color:</div>
        <input
          type="color"
          value={settings.crosshair.color}
          onChange={(e) => setCrosshair("color", e.target.value)}
        />
      </div>

      <Slider
        label="Crosshair Size"
        value={settings.crosshair.size}
        min={4}
        max={40}
        step={1}
        onChange={(v) => setCrosshair("size", v)}
      />

      <Slider
        label="Thickness"
        value={settings.crosshair.thickness}
        min={1}
        max={10}
        step={1}
        onChange={(v) => setCrosshair("thickness", v)}
      />

      <Slider
        label="Gap"
        value={settings.crosshair.gap}
        min={0}
        max={20}
        step={1}
        onChange={(v) => setCrosshair("gap", v)}
      />
    </div>
  );
}
