import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";

import Timer from "../ui/Timer.jsx";
import StatsOverlay from "../ui/StatsOverlay.jsx";
import Crosshair from "../ui/Crosshair.jsx";
import Target from "./Targets.jsx";
import PlayerController from "./PlayerController.jsx";
import WeaponViewmodel from "./WeaponViewmodel.jsx";

// ---------- FIRST MAP DEFINITION (fallback targets) ----------
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
      // miss → ray 50 units forward
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

// ---------- MAP GEOMETRY (editor-made obstacles) ----------
function MapGeometry({ map }) {
  if (!map?.objects?.length) return null;

  return (
    <>
      {map.objects.map((obj) => {
        if (obj.type !== "polygon" || !obj.vertices || obj.vertices.length < 3) {
          return null;
        }

        // simple: approximate polygon by its bounding box in XZ plane
        const xs = obj.vertices.map((v) => v.x);
        const ys = obj.vertices.map((v) => v.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const width = Math.max(maxX - minX, 0.5);
        const depth = Math.max(maxY - minY, 0.5);
        const centerX = (minX + maxX) / 2;
        const centerZ = (minY + maxY) / 2;
        const height = 3;

        return (
          <mesh
            key={obj.id}
            position={[centerX, height / 2, centerZ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={obj.fill || "#444"} />
          </mesh>
        );
      })}
    </>
  );
}

// ---------- PATH-BASED ENEMY (driven by editor paths) ----------
function PathEnemy({ enemy, map, registerRef }) {
  const meshRef = useRef();
  const progressRef = useRef(enemy.t ?? 0);

  useEffect(() => {
    progressRef.current = enemy.t ?? 0;
  }, [enemy.t]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.userData.targetId = enemy.id;
    registerRef(enemy.id, mesh);
    return () => registerRef(enemy.id, null);
  }, [enemy.id, registerRef]);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const path = map?.paths?.find((p) => p.id === enemy.pathId);
    if (!path || !path.points || path.points.length < 2) return;

    const speed = enemy.speed || 1;
    const points = path.points;
    const segmentCount = points.length - 1;

    let t = progressRef.current + (speed * dt) / Math.max(segmentCount, 1);
    if (t > 1) {
      if (path.closed) {
        t = t % 1;
      } else {
        t = 0; // loop back
      }
    }
    progressRef.current = t;

    const scaled = t * segmentCount;
    const i = Math.min(Math.floor(scaled), segmentCount - 1);
    const localT = scaled - i;

    const a = points[i];
    const b = points[i + 1];

    // map.x -> world.x, map.y -> world.z, y fixed as height
    const x = a.x + (b.x - a.x) * localT;
    const z = a.y + (b.y - a.y) * localT;
    const y = 1.6;

    mesh.position.set(x, y, z);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color={enemy.color || "#ff5555"} />
    </mesh>
  );
}

// ---------- MAIN GAME SCENE ----------
export default function GameScene({ map }) {
  const [running] = useState(true);
  const [stats, setStats] = useState({ shots: 0, hits: 0 });
  const [targets, setTargets] = useState(initialTargets);
  const [beam, setBeam] = useState(null);

  // editor-driven path enemies
  const [pathEnemies, setPathEnemies] = useState([]);

  const shotIdRef = useRef(0);
  const targetRefs = useRef({});

  // Initialize path enemies whenever map changes
  useEffect(() => {
    if (!map?.paths?.length) {
      setPathEnemies([]);
      return;
    }
    const enemyTypes = map.enemyTypes || [];

    const created = map.paths.map((path, index) => {
      const enemyType =
        enemyTypes.find((t) => t.id === path.enemyTypeId) ||
        enemyTypes[0] || {
          id: "basic",
          color: "#ff5555",
          baseSpeed: 1,
          hp: 3,
        };

      return {
        id: `path-${path.id}-${index}`,
        pathId: path.id,
        enemyTypeId: enemyType.id,
        color: enemyType.color || "#ff5555",
        hp: enemyType.hp ?? 3,
        maxHp: enemyType.hp ?? 3,
        speed: (enemyType.baseSpeed || 1) * (path.speed || 1),
        t: 0,
      };
    });

    setPathEnemies(created);
  }, [map]);

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

        // respawn static target
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

  const applyDamageToPathEnemy = (id) => {
    setPathEnemies((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const newHp = (e.hp ?? 1) - 1;
        if (newHp > 0) {
          return { ...e, hp: newHp };
        }
        // respawn on same path, reset hp & progress
        return {
          ...e,
          hp: e.maxHp ?? 1,
          t: 0,
        };
      })
    );
  };

  const handleShot = ({ hitTargetId, hitPoint, origin }) => {
    if (hitTargetId) {
      setStats((s) => ({ ...s, hits: s.hits + 1 }));

      // Decide whether it's a normal target or a path enemy
      const isStaticTarget = targets.some((t) => t.id === hitTargetId);
      if (isStaticTarget) {
        applyDamageToTarget(hitTargetId);
      } else {
        applyDamageToPathEnemy(hitTargetId);
      }
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

        {/* Ground */}
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        {/* Existing walls */}
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

        {/* NEW: Map-based geometry from editor */}
        <MapGeometry map={map} />

        {/* Existing “hardcoded” targets */}
        {targets.map((t) => (
          <Target key={t.id} data={t} registerRef={registerTargetRef} />
        ))}

        {/* NEW: Enemies that follow editor paths */}
        {pathEnemies.map((enemy) => (
          <PathEnemy
            key={enemy.id}
            enemy={enemy}
            map={map}
            registerRef={registerTargetRef}
          />
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
