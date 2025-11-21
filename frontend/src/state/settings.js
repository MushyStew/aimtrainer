import { create } from "zustand";

const defaultSettings = {
  sensitivity: 1,
  fov: 90,
  resolutionScale: 1.0,
  fpsCap: 240,
  crosshair: {
    color: "#ffffff",
    size: 12,
    thickness: 2,
    gap: 4,
  },
};

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem("aimtrainer_settings")) || defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export const useSettings = create((set) => ({
  settings: loadLocal(),

  setSetting: (key, value) =>
    set((state) => {
      const updated = { ...state.settings, [key]: value };
      localStorage.setItem("aimtrainer_settings", JSON.stringify(updated));
      return { settings: updated };
    }),

  setCrosshair: (key, value) =>
    set((state) => {
      const updatedCross = { ...state.settings.crosshair, [key]: value };
      const updated = { ...state.settings, crosshair: updatedCross };
      localStorage.setItem("aimtrainer_settings", JSON.stringify(updated));
      crosshair: {
      color: "#ffffff",
      outlineColor: "#000000",
      size: 12,
      thickness: 2,
      gap: 4,  
    },

      return { settings: updated };
    }),
}));
