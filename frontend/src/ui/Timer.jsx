import { useEffect, useState } from "react";

export default function Timer({ running }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!running) return;

    let last = performance.now();
    let id;

    const update = () => {
      const now = performance.now();
      setTime((t) => t + (now - last) / 1000);
      last = now;
      id = requestAnimationFrame(update);
    };

    id = requestAnimationFrame(update);

    return () => cancelAnimationFrame(id);
  }, [running]);

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        width: "100%",
        textAlign: "center",
        color: "white",
        fontSize: "32px",
        textShadow: "0 0 10px black",
        zIndex: 120
      }}
    >
      {time.toFixed(1)}s
    </div>
  );
}
