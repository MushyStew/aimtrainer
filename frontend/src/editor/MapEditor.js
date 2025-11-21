// frontend/src/editor/MapEditor.js

import { createEmptyMap } from '../state/mapEditorState.js';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class MapEditor {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.map = options.initialMap || createEmptyMap();

    // tools: 'select', 'vertex', 'path'
    this.tool = 'select';

    // Object editing
    this.selectedObjectId = null;
    this.selectedVertex = null; // { objectId, vertexIndex }
    this.draggingVertex = false;
    this.draggingObject = false;
    this.dragOffset = { x: 0, y: 0 };

    // Path editing
    this.selectedPathId = null;
    this.draggingPathPoint = null; // { pathId, pointIndex }

    // Editor config for new polygons
    this.newPolygonSides = 4;
    this.newPolygonRadius = 50;

    // Camera (spectator-style)
    this.camera = this.map.camera || { x: 0, y: 0, zoom: 1 };
    this.keys = new Set();

    this.lastFrameTime = performance.now();

    this._bindEvents();
    this._resizeCanvas();
    requestAnimationFrame(this._loop.bind(this));
  }

  // ---------- Public API ----------

  setTool(tool) {
    this.tool = tool;
    this.selectedVertex = null;
    this.draggingVertex = false;
    this.draggingObject = false;
    this.draggingPathPoint = null;
  }

  setNewPolygonParams({ sides, radius }) {
    if (sides >= 3) this.newPolygonSides = sides;
    if (radius > 1) this.newPolygonRadius = radius;
  }

  setSelectedEnemyType(enemyTypeId) {
    this.selectedEnemyTypeId = enemyTypeId;
  }

  createNewPath(enemyTypeId) {
    const id = makeId();
    const path = {
      id,
      enemyTypeId: enemyTypeId || this.map.enemyTypes[0]?.id || 'basic',
      points: [],
      closed: false,
      speed: 1.0,
      spawnInterval: 1.5,
    };
    this.map.paths.push(path);
    this.selectedPathId = id;
    return path;
  }

  exportMap() {
    // Ensure camera in map
    this.map.camera = { ...this.camera };
    return JSON.parse(JSON.stringify(this.map));
  }

  loadMap(map) {
    this.map = JSON.parse(JSON.stringify(map));
    this.camera = this.map.camera || { x: 0, y: 0, zoom: 1 };
  }

  // ---------- Internal helpers ----------

  _bindEvents() {
    window.addEventListener('resize', () => this._resizeCanvas());

    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));
    window.addEventListener('mouseup', () => this._onMouseUp());

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      this.camera.zoom = Math.max(0.2, Math.min(5, this.camera.zoom * factor));
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      // Use right-click in path mode to delete a point
      if (this.tool === 'path') {
        e.preventDefault();
      }
    });
  }

  _resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  worldToScreen(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: (x - this.camera.x) * this.camera.zoom + cx,
      y: (y - this.camera.y) * this.camera.zoom + cy,
    };
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: (sx - cx) / this.camera.zoom + this.camera.x,
      y: (sy - cy) / this.camera.zoom + this.camera.y,
    };
  }

  _loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    this._updateCamera(dt);
    this._render();

    requestAnimationFrame(this._loop.bind(this));
  }

  _updateCamera(dt) {
    const speed = 400 / this.camera.zoom; // move faster when zoomed out
    if (this.keys.has('KeyW')) this.camera.y -= speed * dt;
    if (this.keys.has('KeyS')) this.camera.y += speed * dt;
    if (this.keys.has('KeyA')) this.camera.x -= speed * dt;
    if (this.keys.has('KeyD')) this.camera.x += speed * dt;

    // Interpret Space / Shift like "fly up / down" → here used as zoom
    if (this.keys.has('Space')) this.camera.zoom = Math.min(5, this.camera.zoom * (1 + 1.5 * dt));
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) {
      this.camera.zoom = Math.max(0.2, this.camera.zoom * (1 - 1.5 * dt));
    }
  }

  _render() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // background grid
    this._drawGrid();

    // paths behind objects
    this._drawPaths();

    // objects
    this._drawObjects();
  }

  _drawGrid() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const spacing = 50 * this.camera.zoom;

    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    const cx = w / 2 - this.camera.x * this.camera.zoom;
    const cy = h / 2 - this.camera.y * this.camera.zoom;

    // vertical lines
    for (let x = cx % spacing; x < w; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // horizontal lines
    for (let y = cy % spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawObjects() {
    const ctx = this.ctx;
    for (const obj of this.map.objects) {
      if (obj.type !== 'polygon') continue;
      if (!obj.vertices || obj.vertices.length < 3) continue;

      ctx.save();

      ctx.beginPath();
      obj.vertices.forEach((v, i) => {
        const s = this.worldToScreen(v.x, v.y);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();

      ctx.fillStyle = obj.fill || 'rgba(0, 150, 255, 0.2)';
      ctx.strokeStyle = obj.stroke || '#00aaff';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Draw vertices
      const isSelected = obj.id === this.selectedObjectId;
      obj.vertices.forEach((v, i) => {
        const s = this.worldToScreen(v.x, v.y);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = (isSelected && this.selectedVertex && this.selectedVertex.vertexIndex === i)
          ? '#ffdd00'
          : '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    }
  }

  _drawPaths() {
    const ctx = this.ctx;
    for (const path of this.map.paths) {
      if (!path.points || path.points.length === 0) continue;

      const enemyType = this.map.enemyTypes.find((t) => t.id === path.enemyTypeId);
      const color = enemyType?.color || '#ff5555';

      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;

      ctx.beginPath();
      path.points.forEach((p, i) => {
        const s = this.worldToScreen(p.x, p.y);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      if (path.closed && path.points.length > 1) {
        const first = this.worldToScreen(path.points[0].x, path.points[0].y);
        ctx.lineTo(first.x, first.y);
      }
      ctx.stroke();

      // draw waypoints
      path.points.forEach((p, i) => {
        const s = this.worldToScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fillStyle =
          path.id === this.selectedPathId &&
          this.draggingPathPoint &&
          this.draggingPathPoint.pointIndex === i
            ? '#ffff00'
            : color;
        ctx.fill();
      });

      ctx.restore();
    }
  }

  // ---------- Mouse / keyboard handling ----------

  _onKeyDown(e) {
    this.keys.add(e.code);

    // Quick tool switching: 1=select, 2=vertex, 3=path
    if (e.code === 'Digit1') this.setTool('select');
    if (e.code === 'Digit2') this.setTool('vertex');
    if (e.code === 'Digit3') this.setTool('path');
  }

  _onKeyUp(e) {
    this.keys.delete(e.code);
  }

  _onMouseDown(e) {
    const worldPos = this.screenToWorld(e.clientX, e.clientY);

    if (e.button === 2 && this.tool === 'path') {
      // right click → delete nearest path point (if any)
      this._deleteNearestPathPoint(worldPos);
      return;
    }

    if (e.button !== 0) return; // left only

    if (this.tool === 'select' || this.tool === 'vertex') {
      // 1) try vertex
      const hitVertex = this._hitTestVertex(worldPos, 10 / this.camera.zoom);
      if (hitVertex) {
        this.selectedObjectId = hitVertex.objectId;
        this.selectedVertex = { ...hitVertex };
        this.draggingVertex = true;
        return;
      }

      // 2) try object body
      const hitObj = this._hitTestObject(worldPos);
      if (hitObj) {
        this.selectedObjectId = hitObj.id;
        this.draggingObject = true;
        this.dragOffset.x = worldPos.x - hitObj.center.x;
        this.dragOffset.y = worldPos.y - hitObj.center.y;
        return;
      }

      // 3) if in select mode and no hit → create new polygon
      if (this.tool === 'select') {
        const obj = this._createPolygon(worldPos.x, worldPos.y, this.newPolygonRadius, this.newPolygonSides);
        this.selectedObjectId = obj.id;
      }
    } else if (this.tool === 'path') {
      // left click in path mode → add or drag path point
      const hit = this._hitTestPathPoint(worldPos, 10 / this.camera.zoom);
      if (hit) {
        this.selectedPathId = hit.pathId;
        this.draggingPathPoint = { ...hit };
      } else {
        // add point to current path, or create new path if none
        let path = this.map.paths.find((p) => p.id === this.selectedPathId);
        if (!path) {
          path = this.createNewPath(this.selectedEnemyTypeId);
        }
        path.points.push({ x: worldPos.x, y: worldPos.y });
        this.draggingPathPoint = {
          pathId: path.id,
          pointIndex: path.points.length - 1,
        };
      }
    }
  }

  _onMouseMove(e) {
    const worldPos = this.screenToWorld(e.clientX, e.clientY);

    if (this.draggingVertex && this.selectedVertex) {
      const obj = this.map.objects.find((o) => o.id === this.selectedVertex.objectId);
      if (!obj) return;
      const v = obj.vertices[this.selectedVertex.vertexIndex];
      if (!v) return;
      v.x = worldPos.x;
      v.y = worldPos.y;
    } else if (this.draggingObject && this.selectedObjectId) {
      const obj = this.map.objects.find((o) => o.id === this.selectedObjectId);
      if (!obj || !obj.vertices) return;
      const center = this._computeObjectCenter(obj);
      const dx = worldPos.x - this.dragOffset.x - center.x;
      const dy = worldPos.y - this.dragOffset.y - center.y;
      obj.vertices.forEach((v) => {
        v.x += dx;
        v.y += dy;
      });
    } else if (this.draggingPathPoint) {
      const path = this.map.paths.find((p) => p.id === this.draggingPathPoint.pathId);
      if (!path) return;
      const p = path.points[this.draggingPathPoint.pointIndex];
      if (!p) return;
      p.x = worldPos.x;
      p.y = worldPos.y;
    }
  }

  _onMouseUp() {
    this.draggingVertex = false;
    this.draggingObject = false;
    this.draggingPathPoint = null;
  }

  _hitTestVertex(pos, radius) {
    const r2 = radius * radius;
    for (const obj of this.map.objects) {
      if (obj.type !== 'polygon' || !obj.vertices) continue;
      for (let i = 0; i < obj.vertices.length; i++) {
        const v = obj.vertices[i];
        const dx = v.x - pos.x;
        const dy = v.y - pos.y;
        if (dx * dx + dy * dy <= r2) {
          return { objectId: obj.id, vertexIndex: i };
        }
      }
    }
    return null;
  }

  _hitTestObject(pos) {
    for (const obj of this.map.objects) {
      if (obj.type !== 'polygon' || !obj.vertices) continue;
      if (this._pointInPolygon(pos, obj.vertices)) {
        return {
          id: obj.id,
          center: this._computeObjectCenter(obj),
        };
      }
    }
    return null;
  }

  _pointInPolygon(p, vertices) {
    // classic ray-casting
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      const intersect =
        yi > p.y !== yj > p.y &&
        p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  _computeObjectCenter(obj) {
    let sx = 0;
    let sy = 0;
    for (const v of obj.vertices) {
      sx += v.x;
      sy += v.y;
    }
    return { x: sx / obj.vertices.length, y: sy / obj.vertices.length };
  }

  _createPolygon(cx, cy, radius, sides) {
    const id = makeId();
    const vertices = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      vertices.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    }
    const obj = {
      id,
      type: 'polygon',
      vertices,
      fill: 'rgba(0, 150, 255, 0.2)',
      stroke: '#00aaff',
      enemyBlocking: true,
    };
    this.map.objects.push(obj);
    return obj;
  }

  _hitTestPathPoint(pos, radius) {
    const r2 = radius * radius;
    for (const path of this.map.paths) {
      if (!path.points) continue;
      for (let i = 0; i < path.points.length; i++) {
        const p = path.points[i];
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        if (dx * dx + dy * dy <= r2) {
          return { pathId: path.id, pointIndex: i };
        }
      }
    }
    return null;
  }

  _deleteNearestPathPoint(pos) {
    const radius = 15 / this.camera.zoom;
    const hit = this._hitTestPathPoint(pos, radius);
    if (!hit) return;

    const path = this.map.paths.find((p) => p.id === hit.pathId);
    if (!path) return;

    path.points.splice(hit.pointIndex, 1);
    if (path.points.length === 0) {
      this.map.paths = this.map.paths.filter((p) => p.id !== path.id);
      if (this.selectedPathId === path.id) this.selectedPathId = null;
    }
  }
}
