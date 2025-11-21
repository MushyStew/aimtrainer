// pseudo-file: frontend/src/game/enemyPaths.js

export function createPathSpawners(map, enemyFactory, gameLoop) {
  const spawners = [];

  for (const path of map.paths || []) {
    const enemyType = (map.enemyTypes || []).find((t) => t.id === path.enemyTypeId) 
      || { baseSpeed: 1, hp: 100, id: 'unknown' };

    spawners.push(makeSpawner(path, enemyType, enemyFactory, gameLoop));
  }

  return spawners;
}

function makeSpawner(path, enemyType, enemyFactory, gameLoop) {
  let timeSinceLastSpawn = 0;

  function update(dt) {
    timeSinceLastSpawn += dt;
    if (timeSinceLastSpawn >= (path.spawnInterval || 1.5)) {
      timeSinceLastSpawn = 0;
      spawnEnemyOnPath(path, enemyType, enemyFactory);
    }
  }

  gameLoop.subscribe(update);

  return {
    dispose() {
      gameLoop.unsubscribe(update);
    },
  };
}

function spawnEnemyOnPath(path, enemyType, enemyFactory) {
  if (!path.points || path.points.length < 2) return;

  enemyFactory({
    typeId: enemyType.id,
    hp: enemyType.hp,
    speed: enemyType.baseSpeed * (path.speed || 1),
    pathPoints: path.points.slice(),
    closed: !!path.closed,
  });
}
