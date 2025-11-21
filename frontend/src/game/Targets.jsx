import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

export default function Target({ data, registerRef }) {
  const ref = useRef();
  const t = useRef(0);
  const basePos = useRef(data.position);

  useEffect(() => {
    basePos.current = data.position;
  }, [data.position]);

  useEffect(() => {
    if (ref.current) {
      ref.current.userData.targetId = data.id;
      registerRef(data.id, ref.current);
    }
    return () => registerRef(data.id, null);
  }, [data.id, registerRef]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    t.current += delta;

    let [x, y, z] = basePos.current;

    if (data.type === "strafe") {
      const axis = data.behavior?.axis || "x";
      const amp = data.behavior?.amplitude ?? 2;
      const speed = data.behavior?.speed ?? 1.5;
      const offset = Math.sin(t.current * speed) * amp;

      if (axis === "x") x += offset;
      else if (axis === "z") z += offset;
      else if (axis === "y") y += offset;
    }

    if (data.type === "path") {
      const radius = data.behavior?.radius ?? 3;
      const speed = data.behavior?.speed ?? 1;
      x = basePos.current[0] + Math.cos(t.current * speed) * radius;
      z = basePos.current[2] + Math.sin(t.current * speed) * radius;
    }

    ref.current.position.set(x, y, z);

    const hp = data.hp ?? 1;
    const maxHp = data.maxHp ?? 1;
    const scale = 0.8 + (hp / maxHp) * 0.7;
    ref.current.scale.set(scale, scale, scale);
  });

  const color =
    data.type === "static"
      ? "#ff4f4f"
      : data.type === "strafe"
      ? "#ffb347"
      : "#5fdfff";

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.4, 24, 24]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
