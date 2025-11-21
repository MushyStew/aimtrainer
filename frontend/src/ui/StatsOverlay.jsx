export default function StatsOverlay({ stats }) {
  const accuracy =
    stats.shots > 0 ? ((stats.hits / stats.shots) * 100).toFixed(1) : "0.0";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        left: 10,
        color: "white",
        fontSize: "14px",
        background: "rgba(0,0,0,0.6)",
        padding: "8px 12px",
        borderRadius: "8px",
        zIndex: 120,
      }}
    >
      <div>Shots: {stats.shots}</div>
      <div>Hits: {stats.hits}</div>
      <div>Accuracy: {accuracy}%</div>
    </div>
  );
}
