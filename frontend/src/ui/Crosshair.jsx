import { useSettings } from "../state/settings.js";

export default function Crosshair() {
  const { settings } = useSettings();
  const { size, thickness, gap, color } = settings.crosshair;

  const containerStyle = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 150,
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 0,
    height: 0,
  };

  const lineStyle = {
    position: "absolute",
    background: color,
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          ...lineStyle,
          width: thickness,
          height: size,
          bottom: gap + size,
          left: -thickness / 2,
        }}
      />
      <div
        style={{
          ...lineStyle,
          width: thickness,
          height: size,
          top: gap,
          left: -thickness / 2,
        }}
      />
      <div
        style={{
          ...lineStyle,
          width: size,
          height: thickness,
          right: gap + size,
          top: -thickness / 2,
        }}
      />
      <div
        style={{
          ...lineStyle,
          width: size,
          height: thickness,
          left: gap,
          top: -thickness / 2,
        }}
      />
    </div>
  );
}
