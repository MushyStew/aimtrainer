import { useSettings } from "../state/settings";

export default function Crosshair() {
  const { settings } = useSettings();
  const { size, thickness, gap, color, outlineColor } = settings.crosshair;

  const baseStyle = {
    position: "absolute",
    pointerEvents: "none",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 150,
  };

  const line = {
    position: "absolute",
    backgroundColor: color,
    width: thickness,
  };

  const outline = {
    position: "absolute",
    backgroundColor: outlineColor,
    width: thickness + 2,
  };

  return (
    <div style={baseStyle}>
      {/* TOP OUTLINE */}
      <div
        style={{
          ...outline,
          height: size + 2,
          bottom: gap + size,
          left: -((thickness + 2) / 2),
        }}
      />
      {/* TOP FILL */}
      <div
        style={{
          ...line,
          height: size,
          bottom: gap + size,
          left: -(thickness / 2),
        }}
      />

      {/* BOTTOM OUTLINE */}
      <div
        style={{
          ...outline,
          height: size + 2,
          top: gap + size,
          left: -((thickness + 2) / 2),
        }}
      />
      {/* BOTTOM FILL */}
      <div
        style={{
          ...line,
          height: size,
          top: gap + size,
          left: -(thickness / 2),
        }}
      />

      {/* LEFT OUTLINE */}
      <div
        style={{
          ...outline,
          height: thickness + 2,
          width: size + 2,
          right: gap + size,
          top: -((thickness + 2) / 2),
        }}
      />
      {/* LEFT FILL */}
      <div
        style={{
          ...line,
          height: thickness,
          width: size,
          right: gap + size,
          top: -(thickness / 2),
        }}
      />

      {/* RIGHT OUTLINE */}
      <div
        style={{
          ...outline,
          height: thickness + 2,
          width: size + 2,
          left: gap + size,
          top: -((thickness + 2) / 2),
        }}
      />
      {/* RIGHT FILL */}
      <div
        style={{
          ...line,
          height: thickness,
          width: size,
          left: gap + size,
          top: -(thickness / 2),
        }}
      />
    </div>
  );
}
