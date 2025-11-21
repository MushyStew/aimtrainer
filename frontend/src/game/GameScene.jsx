import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useState, useRef } from "react";
import * as THREE from "three";

import Timer from "../ui/Timer.jsx";
import StatsOverlay from "../ui/StatsOverlay.jsx";
import Crosshair from "../ui/Crosshair.jsx";
import Target from "./Targets.jsx";
import PlayerController from "./PlayerController.jsx";
import WeaponViewmodel from "./WeaponViewmodel.jsx";

// ---------- FIRST MAP DEFINITION ----------
const initialTargets = [
  {
    id: "static1",
    type: "static",
    position: [0, 1.4, -6],
    hp: 1,
    maxHp: 1,
  },
  {
    id: "strafe1",
    type: "strafe",
    position: [-4, 1.6, -8],
    behavior: { axis: "x", amplitude: 2.5, speed: 1.5 },
    hp: 2,
    maxHp: 2,
  },
  {
    id: "path1",
    type: "path",
    position: [2, 1.8, -10],
    behavior: { radius: 3, speed: 1.0 },
    hp: 3,
    maxHp: 3,
  },
];

// ---------- SHOOTING CONTROLLER ----------
function ShootingController({ shotIdRef, targetRefs, onShot }) {
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const lastProcessed = useRef(0);

  useFrame(() => {
    if (shotIdRef.current === lastProcessed.current) return;
    lastProcessed.current = shotIdRef.current;

    const origin = camera.position.clone();
    const dir = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .normalize();

    raycaster.current.set(origin, dir);

    const objects = Object.values(targetRefs.current).filter(Boolean);
    const intersects = raycaster.current.intersectObjects(objects, false);

    let hitTargetId = null;
    let hitPoint = null;

    if (intersects.length > 0) {
      const first = intersects[0];
      hitTargetId = first.object.userData.targetId || null;
      hitPoint = first.point.clone();
    } else {
      hitPoint = origin.clone().add(dir.clone().multiplyScalar(50));
    }

    onShot({
      shotId: shotIdRef.current,
      hitTargetId,
      hitPoint,
      origin,
      direction: dir,
    });
  });

  return null;
}

// ---------- BEAM EFFECT ----------
function BeamEffect({ beam }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current || !beam) return;

    const age = (performance.now() - beam.createdAt) / 1000;
    const maxAge = 0.12;
    const visible = age < maxAge;
    ref.current.visible = visible;
    if (!visible) return;

    const start = beam.origin;
    const end = beam.end;
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();

    ref.current.position.copy(mid);
    ref.current.lookAt(end);
    ref.current.scale.set(1, 1, length);
  });

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
      <meshBasicMaterial color="#5fdfff" />
    </mesh>
  );
}

// ---------- MAIN GAME SCENE ----------
export default function GameScene() {
  const [running] = useState(true);
  const [stats, setStats] = useState({ shots: 0, hits: 0 });
  const [targets, setTargets] = useState(initialTargets);
  const [beam, setBeam] = useState(null);

  const shotIdRef = useRef(0);
  const targetRefs = useRef({});

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    setStats((s) => ({ ...s, shots: s.shots + 1 }));
    shotIdRef.current += 1;
  };

  const registerTargetRef = (id, mesh) => {
    if (!mesh) delete targetRefs.current[id];
    else targetRefs.current[id] = mesh;
  };

  const applyDamageToTarget = (id) => {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        const newHp = (t.hp ?? 1) - 1;
        if (newHp > 0) {
          return { ...t, hp: newHp };
        }

        return {
          ...t,
          id: t.id + "_" + Math.random().toString(36).slice(2, 6),
          hp: t.maxHp ?? 1,
          position: [
            (Math.random() - 0.5) * 10,
            1.2 + Math.random() * 1.0,
            -6 - Math.random() * 6,
          ],
        };
      })
    );
  };

  const handleShot = ({ hitTargetId, hitPoint, origin }) => {
    if (hitTargetId) {
      setStats((s) => ({ ...s, hits: s.hits + 1 }));
      applyDamageToTarget(hitTargetId);
    }

    setBeam({
      origin,
      end: hitPoint,
      createdAt: performance.now(),
    });
  };

  return (
    <>
      <Timer running={running} />
      <StatsOverlay stats={stats} />
      <Crosshair />

      <Canvas
        style={{ width: "100vw", height: "100vh", background: "#101014" }}
        camera={{ position: [0, 1.7, 6], fov: 90 }}
        onPointerDown={handlePointerDown}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 10, 5]} intensity={0.6} />

        <PlayerController />
        <WeaponViewmodel />

        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        <mesh position={[0, 2.5, -12]}>
          <boxGeometry args={[20, 5, 1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[10, 2.5, -2]} rotation-y={Math.PI / 2}>
          <boxGeometry args={[20, 5, 1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-10, 2.5, -2]} rotation-y={Math.PI / 2}>
          <boxGeometry args={[20, 5, 1]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        {targets.map((t) => (
          <Target key={t.id} data={t} registerRef={registerTargetRef} />
        ))}

        <BeamEffect beam={beam} />

        <ShootingController
          shotIdRef={shotIdRef}
          targetRefs={targetRefs}
          onShot={handleShot}
        />
      </Canvas>
    </>
  );
}
