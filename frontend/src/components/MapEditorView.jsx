// frontend/src/components/MapEditorView.jsx
import React, { useEffect, useRef } from 'react';
import { MapEditor } from '../editor/MapEditor';
import { createEmptyMap } from '../state/mapEditorState';

const MAP_STORAGE_KEY = 'aimtrainer-user-map';

export default function MapEditorView({ onExit }) {
  const canvasRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let initialMap = createEmptyMap();
    const saved = localStorage.getItem(MAP_STORAGE_KEY);
    if (saved) {
      try {
        initialMap = JSON.parse(saved);
      } catch {
        // ignore bad JSON, fall back to empty map
      }
    }

    const editor = new MapEditor(canvas, { initialMap });
    editorRef.current = editor;

    return () => {
      // If MapEditor needs cleanup later, do it here
    };
  }, []);

  const handleSave = () => {
    if (!editorRef.current) return;
    const mapData = editorRef.current.exportMap();
    localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(mapData));
    // keep map editor open, just save silently
  };

  const handleSaveAndExit = () => {
    handleSave();
    if (onExit) onExit();
  };

  const handleReset = () => {
    if (!editorRef.current) return;
    const blank = createEmptyMap();
    editorRef.current.loadMap(blank);
    localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(blank));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <button onClick={handleSave}>Save</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleSaveAndExit}>Back to Game</button>
        <small style={{ color: '#fff', maxWidth: 220 }}>
          Controls: WASD move, Space/Shift zoom, mouse wheel zoom, 1=Select, 2=Vertex, 3=Path, Left click to add/move, Right click (in Path mode) to delete points.
        </small>
      </div>
    </div>
  );
}
