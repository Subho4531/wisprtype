import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

// Interface for settings object
interface AppSettings {
  hotkey: string;
  launchOnStartup: boolean;
  pasteImmediately: boolean;
  microphoneDevice: string;
  gain: number;
  whisperModel: string;
  formattingEngine: "none" | "local" | "cloud";
  apiKey: string;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  hotkey: "Ctrl + Shift + Space",
  launchOnStartup: true,
  pasteImmediately: true,
  microphoneDevice: "Default System Microphone",
  gain: 75,
  whisperModel: "base",
  formattingEngine: "cloud",
  apiKey: "••••••••••••••••••••••••",
  systemPrompt: "Fix spelling, grammar, punctuation, and format nicely as professional text. Keep the tone natural.",
};

function App() {
  const [windowLabel, setWindowLabel] = useState<string>("main");
  const [appState, setAppState] = useState<string>("Idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"general" | "audio" | "model">("general");

  // Timer state for overlay recording state
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingTimerRef = useRef<any>(null);

  // Micro audio wave animation states
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioAnimationRef = useRef<number | null>(null);

  // Check window label on startup
  useEffect(() => {
    try {
      const appWindow = getCurrentWindow();
      const label = appWindow.label;
      setWindowLabel(label);
      document.documentElement.className = `window-${label}`;
    } catch (e) {
      console.error("Tauri environment not detected, running in web mock mode:", e);
      setWindowLabel("main"); // Fallback to settings main window
      document.documentElement.className = "window-main";
    }
  }, []);

  // Sync state from Tauri Core
  useEffect(() => {
    // 1. Fetch current initial state
    invoke<string>("get_state")
      .then((stateJson) => {
        try {
          const parsed = JSON.parse(stateJson);
          setAppState(parsed);
        } catch {
          setAppState(stateJson.replace(/"/g, ''));
        }
      })
      .catch((err) => console.error("Failed to fetch initial state:", err));

    // 2. Listen to state changes
    const unlisten = listen<{ state: string; message?: string }>("state-changed", (event) => {
      const newState = event.payload.state;
      setAppState(newState);
      setStatusMessage(event.payload.message || "");
    });

    // 3. Listen to model download progress
    const unlistenDownload = listen<{ progress: number; message: string }>("download-progress", (event) => {
      setStatusMessage(event.payload.message);
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenDownload.then((fn) => fn());
    };
  }, []);

  // Load settings from Tauri Core on startup
  useEffect(() => {
    invoke<string>("get_settings")
      .then((settingsJson) => {
        try {
          setSettings(JSON.parse(settingsJson));
        } catch (e) {
          console.error("Failed to parse settings from backend:", e);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch settings from backend, falling back to localStorage:", err);
        const saved = localStorage.getItem("wisprtype_settings");
        if (saved) {
          try {
            setSettings(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse local settings:", e);
          }
        }
      });
  }, []);

  // Timer logic for Recording state in Overlay Toast
  useEffect(() => {
    if (appState === "Recording") {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [appState]);

  // Audio level visualizer micro-animation when recording or testing mic
  useEffect(() => {
    if (appState === "Recording") {
      const animateAudio = () => {
        // Generate nice-looking dynamic speech level bar updates
        const level = Math.random() * 40 + Math.sin(Date.now() / 200) * 20 + 30;
        setAudioLevel(Math.max(10, Math.min(100, level)));
        audioAnimationRef.current = requestAnimationFrame(animateAudio);
      };
      audioAnimationRef.current = requestAnimationFrame(animateAudio);
    } else {
      if (audioAnimationRef.current) {
        cancelAnimationFrame(audioAnimationRef.current);
        audioAnimationRef.current = null;
      }
      setAudioLevel(0);
    }

    return () => {
      if (audioAnimationRef.current) {
        cancelAnimationFrame(audioAnimationRef.current);
      }
    };
  }, [appState]);

  const saveSettings = (updated: AppSettings) => {
    setSettings(updated);
    localStorage.setItem("wisprtype_settings", JSON.stringify(updated));
    
    // Synchronize to Rust backend for global hotkey registration
    invoke("save_settings", { settingsStr: JSON.stringify(updated) })
      .then(() => {
        alert("Settings saved and synced successfully!");
      })
      .catch((err) => {
        console.error("Failed to sync settings to backend:", err);
        alert("Settings saved locally, but failed to sync to backend: " + err);
      });
  };

  const handleToggleRecording = () => {
    invoke("toggle_recording").catch((err) =>
      console.error("Failed to toggle recording:", err)
    );
  };

  const formatTimer = (seconds: number) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  /* ==========================================================================
     RENDER: OVERLAY STATUS PILL
     ========================================================================== */
  if (windowLabel === "overlay") {
    const stateClass = appState.toLowerCase();
    
    // Dynamic titles and details
    let titleText = "Wisprtype";
    let detailText = "Processing...";
    let iconSvg = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );

    switch (appState) {
      case "Recording":
        titleText = "Listening...";
        detailText = `Speak now • ${formatTimer(recordingSeconds)}`;
        iconSvg = (
          <>
            <div className="pulse-ring"></div>
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: "var(--color-recording)" }}>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </>
        );
        break;
      case "Transcribing":
        titleText = "Transcribing...";
        detailText = "Converting voice to text offline";
        iconSvg = <div className="spinner"></div>;
        break;
      case "Formatting":
        titleText = "AI Refining...";
        detailText = "Polishing with language model";
        iconSvg = (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-formatting)" }}>
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.32 11.32l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        );
        break;
      case "Pasting":
        titleText = "Pasting...";
        detailText = "Injecting text into window";
        iconSvg = (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: "var(--color-success)" }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
        break;
      case "Error":
        titleText = "Error Occurred";
        detailText = statusMessage || "Failed to process speech";
        iconSvg = (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--color-error)" }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" />
          </svg>
        );
        break;
    }

    return (
      <div className={`app-container overlay-window ${stateClass}`}>
        <div className="overlay-content">
          <div className={`state-icon-container ${stateClass}`}>
            {iconSvg}
          </div>
          <div className="overlay-details">
            <div className="overlay-title">{titleText}</div>
            <div className="overlay-status">{detailText}</div>
          </div>
        </div>
        <div className="overlay-progress-track">
          {appState !== "Error" && <div className="overlay-progress-fill"></div>}
        </div>
      </div>
    );
  }

  /* ==========================================================================
     RENDER: SETTINGS WINDOW PANEL (MAIN)
     ========================================================================== */
  return (
    <div className="app-container">
      {/* Dynamic ambient gradients */}
      <div className="ambient-glow"></div>
      <div className="ambient-glow-2"></div>
      
      <div className="settings-window">
        {/* Sidebar Nav */}
        <aside className="sidebar">
          <div>
            <div className="brand-section">
              <div className="brand-logo">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm6 10c0 3.3-2.7 6-6 6s-6-2.7-6-6H4c0 4.1 3.1 7.4 7 7.9V22h2v-2.1c3.9-.5 7-3.8 7-7.9h-2z" />
                </svg>
              </div>
              <span className="brand-name">Wisprtype V1</span>
            </div>
            
            <nav className="nav-links">
              <button 
                className={`nav-btn ${activeTab === "general" ? "active" : ""}`}
                onClick={() => setActiveTab("general")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                General Settings
              </button>
              
              <button 
                className={`nav-btn ${activeTab === "audio" ? "active" : ""}`}
                onClick={() => setActiveTab("audio")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8"/>
                </svg>
                Microphone & Gain
              </button>
              
              <button 
                className={`nav-btn ${activeTab === "model" ? "active" : ""}`}
                onClick={() => setActiveTab("model")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                AI Model & Format
              </button>
            </nav>
          </div>
          
          <div className="sidebar-footer">
            <div className="status-badge">
              <span className={`status-indicator ${appState === "Recording" ? "recording" : ""}`}></span>
              <span>System: {appState === "Idle" ? "Ready" : appState}</span>
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="content-panel">
          {activeTab === "general" && (
            <section>
              <div className="section-header">
                <h2>General Preferences</h2>
                <p>Configure how Wisprtype captures and injects your audio</p>
              </div>

              {/* Status Interaction Card */}
              <div className="toggle-group" style={{ background: "rgba(var(--color-primary-rgb), 0.04)", borderColor: "var(--border-glass-active)", marginBottom: "32px" }}>
                <div className="toggle-info">
                  <span className="toggle-title" style={{ fontWeight: 600, color: "#fff" }}>Interactive Voice Trigger</span>
                  <span className="toggle-desc">Directly toggle capture state to test hotkey pipelines</span>
                </div>
                <button 
                  onClick={handleToggleRecording} 
                  className="btn-primary" 
                  style={{ 
                    marginTop: 0, 
                    alignSelf: "center",
                    background: appState === "Recording" ? "linear-gradient(135deg, var(--color-recording), #ff8a8a)" : undefined,
                    boxShadow: appState === "Recording" ? "0 4px 15px rgba(var(--color-recording-rgb), 0.3)" : undefined
                  }}
                >
                  {appState === "Recording" ? "Stop Capturing" : "Trigger Voice Capture"}
                </button>
              </div>

              <div className="form-group">
                <label>Global Activation Shortcut</label>
                <input 
                  type="text" 
                  value={settings.hotkey} 
                  onChange={(e) => setSettings({ ...settings, hotkey: e.target.value })}
                  placeholder="Press hotkey combination..."
                />
              </div>

              <div className="toggle-group">
                <div className="toggle-info">
                  <span className="toggle-title">Launch on Startup</span>
                  <span className="toggle-desc">Automatically launch Wisprtype when you boot your system</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings.launchOnStartup}
                    onChange={(e) => setSettings({ ...settings, launchOnStartup: e.target.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-info">
                  <span className="toggle-title">Instant Injection</span>
                  <span className="toggle-desc">Simulate keystrokes to paste text immediately at the active cursor</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings.pasteImmediately}
                    onChange={(e) => setSettings({ ...settings, pasteImmediately: e.target.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </section>
          )}

          {activeTab === "audio" && (
            <section>
              <div className="section-header">
                <h2>Microphone Configuration</h2>
                <p>Adjust audio devices, hardware levels, and volume parameters</p>
              </div>

              <div className="form-group">
                <label>Input Audio Device</label>
                <select 
                  value={settings.microphoneDevice}
                  onChange={(e) => setSettings({ ...settings, microphoneDevice: e.target.value })}
                >
                  <option>Default System Microphone</option>
                  <option>Hardware High-Definition Audio Device</option>
                  <option>Virtual Audio Cable (Line-1)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Microphone Hardware Gain ({settings.gain}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.gain}
                  className="gain-slider"
                  onChange={(e) => setSettings({ ...settings, gain: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group" style={{ marginTop: "16px" }}>
                <label>Input Audio Level Indicator</label>
                <div className="level-meter-container">
                  <div className="level-meter-bar">
                    <div 
                      className="level-meter-fill" 
                      style={{ 
                        width: `${appState === "Recording" ? audioLevel : 0}%`,
                        background: appState === "Recording" ? undefined : "rgba(255,255,255,0.15)"
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "flex-end" }}>
                    {appState === "Recording" ? "Active signal detected" : "Microphone idle"}
                  </span>
                </div>
              </div>
            </section>
          )}

          {activeTab === "model" && (
            <section>
              <div className="section-header">
                <h2>AI Models & Text Formatting</h2>
                <p>Configure offline translation models and language refining layers</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Whisper-rs Model Size</label>
                  <select 
                    value={settings.whisperModel}
                    onChange={(e) => setSettings({ ...settings, whisperModel: e.target.value })}
                  >
                    <option value="tiny">Tiny (Offline, ~75MB) - Extremely Fast</option>
                    <option value="base">Base (Offline, ~140MB) - Balanced (Recommended)</option>
                    <option value="small">Small (Offline, ~460MB) - High Precision</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Formatting Pipeline Layer</label>
                  <select 
                    value={settings.formattingEngine}
                    onChange={(e) => setSettings({ ...settings, formattingEngine: e.target.value as any })}
                  >
                    <option value="none">None (Raw Whisper Output)</option>
                    <option value="local">Local LLM (Ollama - Offline)</option>
                    <option value="cloud">Cloud LLM Refiner (Secure API)</option>
                  </select>
                </div>
              </div>

              {settings.formattingEngine === "cloud" && (
                <div className="form-group">
                  <label>Secure Cloud API Key</label>
                  <input 
                    type="password" 
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder="Enter OpenAI / Anthropic / Gemini Key..."
                  />
                </div>
              )}

              {settings.formattingEngine !== "none" && (
                <div className="form-group">
                  <label>AI Prompting Refinement Rules</label>
                  <textarea 
                    value={settings.systemPrompt}
                    onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                    placeholder="Provide system formatting rules..."
                  />
                </div>
              )}
            </section>
          )}

          {/* Save Button */}
          <button className="btn-primary" onClick={() => saveSettings(settings)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Settings
          </button>
        </main>
      </div>
    </div>
  );
}

export default App;
