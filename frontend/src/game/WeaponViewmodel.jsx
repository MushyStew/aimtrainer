import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function WeaponViewmodel() {
  const { camera, scene, gl } = useThree();

  useEffect(() => {
    const viewmodelScene = new THREE.Scene();
    const weapon = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.2, 0.6),
      new THREE.MeshBasicMaterial({ color: "#555", depthTest: false })
    );
    weapon.add(body);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.6, 12),
      new THREE.MeshBasicMaterial({ color: "#777", depthTest: false })
    );
    barrel.position.z = -0.35;
    weapon.add(barrel);

    weapon.position.set(0.35, -0.25, -0.7);
    weapon.renderOrder = 10000;
    viewmodelScene.add(weapon);

    const renderer = gl;
    const oldLoop = renderer.setAnimationLoop;

    renderer.autoClear = false;

    const renderFn = () => {
      renderer.clear();
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(viewmodelScene, camera);
    };

    renderer.setAnimationLoop(renderFn);

    return () => {
      renderer.setAnimationLoop(oldLoop);
    };
  }, [camera, scene, gl]);

  return null;
}
