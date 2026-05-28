import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../constants/defaults";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const loadSettings = async () => {
    try {
      const settingsJson = await invoke<string>("get_settings");
      setSettings(JSON.parse(settingsJson));
    } catch (err) {
      console.error("Failed to fetch settings from backend, falling back to localStorage:", err);
      const saved = localStorage.getItem("wisprtype_settings");
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse local settings:", e);
        }
      }
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSetting = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      saveSettings(settings);
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [settings]);

  const saveSettings = (updated: AppSettings) => {
    localStorage.setItem("wisprtype_settings", JSON.stringify(updated));
    
    // Check if running in Tauri environment
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      invoke("save_settings", { settingsStr: JSON.stringify(updated) })
        .catch((err) => {
          console.error("Failed to sync settings to backend:", err);
          console.log("Settings sync failed: " + err);
        });
    } else {
      console.log("Mock mode: Settings saved to local storage only.");
    }
  };

  return { settings, setSettings, updateSetting, loadSettings };
}
