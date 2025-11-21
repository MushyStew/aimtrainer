# FPS Aim Trainer (3D, Web-Based)

A full 3D FPS aim trainer built using:

- React
- Three.js / React Three Fiber
- Node.js + Express backend
- Custom FPS controller
- Weapon viewmodel (overlaid like real games)
- Hitscan raycasting
- Moving targets with multiple behaviors
- Crosshair system + Settings panel
- Map saving API

## Install & Run

### Backend
cd backend
npm install
npm start
### Frontend
cd frontend
npm install
npm run dev
The frontend dev server proxies `/api/*` to the backend.

---

## Features

- WASD movement + mouse look
- Pointer lock FPS control
- Beam weapon with hit detection
- Targets:
  - Static
  - Strafing
  - Circular path movement
- Crosshair customization
- FOV / Sensitivity / FPS cap
- Stats overlay (accuracy, hits, shots)
- Gun viewmodel rendered on top of world

