// frontend/src/state/mapEditorState.js

export function createEmptyMap() {
  return {
    // Polygonal obstacles/objects
    objects: [
      // {
      //   id: 'obj-1',
      //   type: 'polygon',
      //   vertices: [{ x, y }, ...],
      //   fill: 'rgba(0, 150, 255, 0.2)',
      //   stroke: '#00aaff',
      //   enemyBlocking: true,
      // }
    ],

    // Enemy movement paths
    paths: [
      // {
      //   id: 'path-1',
      //   enemyTypeId: 'basic',
      //   points: [{ x, y }, ...],
      //   closed: false,
      //   speed: 1.0,             // relative movement speed along this path
      //   spawnInterval: 1.5,     // seconds between spawns on this path
      // }
    ],

    // Different “types” of enemies that can use paths
    enemyTypes: [
      {
        id: 'basic',
        name: 'Basic',
        color: '#ff5555',
        baseSpeed: 1,
        hp: 100,
      },
      {
        id: 'fast',
        name: 'Fast',
        color: '#ffaa00',
        baseSpeed: 2,
        hp: 60,
      },
      {
        id: 'tank',
        name: 'Tank',
        color: '#55ff55',
        baseSpeed: 0.6,
        hp: 250,
      },
    ],

    // Editor camera (spectator-style)
    camera: {
      x: 0,
      y: 0,
      zoom: 1, // 1 = default; you can zoom via mouse wheel, Space / Shift
    },
  };
}
