import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useSettings } from "../state/settings.js";

export default function PlayerController() {
  const { camera, gl } = useThree();
  const { settings } = useSettings();

  const yaw = useRef(0);
  const pitch = useRef(0);
  const keys = useRef({});
  const speed = 6;

  useEffect(() => {
    camera.position.set(0, 1.7, 6);
    camera.lookAt(0, 1.5, 0);

    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    const handleMouseMove = (e) => {
      if (document.pointerLockElement !== gl.domElement) return;

      const sens = 0.002 * settings.sensitivity;
      yaw.current -= e.movementX * sens;
      pitch.current -= e.movementY * sens;

      const limit = Math.PI / 2 - 0.1;
      pitch.current = Math.max(-limit, Math.min(limit, pitch.current));
    };

    const requestLock = () => {
      gl.domElement.requestPointerLock();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("click", requestLock);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("click", requestLock);
    };
  }, [camera, gl, settings.sensitivity]);

  useFrame((_, delta) => {
    camera.fov = settings.fov;
    camera.updateProjectionMatrix();

    camera.rotation.set(pitch.current, yaw.current, 0);

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);

    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    let move = new THREE.Vector3();
    if (keys.current["KeyW"]) move.add(forward);
    if (keys.current["KeyS"]) move.sub(forward);
    if (keys.current["KeyA"]) move.sub(right);
    if (keys.current["KeyD"]) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      camera.position.add(move);

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -9, 9);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -11, 7);
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.2, 3);
    }
  });

  return null;
}
