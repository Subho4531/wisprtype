import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

import { useSettings } from "./hooks/useSettings";
import { useHistory } from "./hooks/useHistory";
import { useTheme } from "./hooks/useTheme";
import { ToastProvider } from "./hooks/useToast";
import { WaveformOverlay } from "./components/overlay/WaveformOverlay";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { HistoryTab } from "./components/tabs/HistoryTab";
import { AnalyticsTab } from "./components/tabs/AnalyticsTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { OverlayState } from "./types";
import { cn } from "./lib/utils";
import { playFeedbackSound } from "./lib/audio";
import "./App.css";

function App() {
  const [windowLabel, setWindowLabel] = useState<string>("main");
  const [appState, setAppState] = useState<OverlayState>("Idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const shouldReduceMotion = useReducedMotion();

  const { settings, updateSetting } = useSettings();
  const { history, loadHistory } = useHistory();
  const { isDark, toggleTheme } = useTheme();

  // Mock mic options for UI (To be replaced with real backend data in Phase 3)
  const micOptions = [
    "Default System Microphone",
    "Hardware High-Definition Audio Device",
    "Virtual Audio Cable (Line-1)",
  ];

  useEffect(() => {
    setWindowLabel(getCurrentWindow().label);
  }, []);

  useEffect(() => {
    invoke<string>("get_state")
      .then((stateJson) => {
        try {
          const parsed = JSON.parse(stateJson);
          setAppState(parsed as OverlayState);
        } catch {
          setAppState(stateJson.replace(/"/g, '') as OverlayState);
        }
      })
      .catch((err) => console.error("Failed to fetch initial state:", err));

    const unlistenState = listen<{ state: string; message?: string }>("state-changed", (event) => {
      const newState = event.payload.state;
      setAppState((prev) => {
        if (prev !== "Idle" && newState === "Idle") {
          setTimeout(loadHistory, 500); 
        }
        
        // Play feedback sounds when starting or stopping recording (only in main window to prevent echo)
        if (getCurrentWindow().label === "main") {
          if (prev !== "Recording" && newState === "Recording") {
            playFeedbackSound('start');
          } else if (prev === "Recording" && newState !== "Recording") {
            playFeedbackSound('stop');
          }
        }
        
        return newState as OverlayState;
      });
      setStatusMessage(event.payload.message || "");
    });

    const unlistenVol = listen<number>("volume-level", (event) => {
      setAudioLevel(event.payload);
    });

    const unlistenTick = listen<number>("timer-tick", (event) => {
      setRecordingSeconds(event.payload);
    });

    const unlistenModelProgress = listen<{ model: string; progress: number; status: string }>('model-download-progress', (event) => {
      const { model, progress, status } = event.payload;
      if (status === 'complete') {
        setStatusMessage(`Model ${model} ready!`);
      } else if (status === 'downloading') {
        setStatusMessage(`Downloading ${model}: ${progress}%`);
      } else if (status === 'error') {
        setStatusMessage(`Failed to download ${model}`);
      }
    });

    const unlistenFormatError = listen<{ error: string }>('format-error', (event) => {
      setStatusMessage(`Formatting failed: ${event.payload.error}`);
    });

    return () => {
      unlistenState.then((fn) => fn());
      unlistenVol.then((fn) => fn());
      unlistenTick.then((fn) => fn());
      unlistenModelProgress.then((fn) => fn());
      unlistenFormatError.then((fn) => fn());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (windowLabel === "overlay") {
    return (
      <WaveformOverlay
        appState={appState}
        audioLevel={audioLevel}
        recordingSeconds={recordingSeconds}
        statusMessage={statusMessage}
      />
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/Wisprtype.png" alt="WisprType Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <span
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                }}
                className="font-black text-black dark:text-white"
              >
                Wispr
                <span
                  style={{
                    background: 'linear-gradient(135deg, #FF4500, #FF8C00, #FFD700)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Type
                </span>
              </span>
              <p className="text-[10px] font-mono text-zinc-400 font-bold tracking-widest mt-1 uppercase">V 1.0</p>
            </div>
          </div>

          <div className="hidden md:flex items-center divide-x divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300" role="tablist">
            {[
              { id: "overview", label: "overview" },
              { id: "history", label: "history" },
              { id: "analytics", label: "analytics" },
              { id: "settings", label: "preferences" }
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors",
                  activeTab === tab.id ? "bg-black dark:bg-white text-white dark:text-black" : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 dark:text-zinc-500">
              <span className={cn(
                "h-2 w-2 rounded-full bg-emerald-500 animate-pulse",
                appState === "Recording" ? "bg-red-500" : ""
              )}></span>
              {appState === "Idle" ? "SYSTEM_READY" : `SYSTEM_${appState.toUpperCase()}`}
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="bg-orange-500/10 dark:bg-orange-500/20 border-b border-orange-500/20 px-6 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-3 transition-all shadow-sm">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
            {statusMessage}
          </div>
        )}

        {/* Main Tab Content */}
        <main className="p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`panel-${activeTab}`}
              role="tabpanel"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && (
                <OverviewTab history={history} appState={appState} audioLevel={audioLevel} settings={settings} setActiveTab={setActiveTab} />
              )}
              {activeTab === "history" && (
                <HistoryTab history={history} loadHistory={loadHistory} />
              )}
              {activeTab === "analytics" && (
                <AnalyticsTab history={history} />
              )}
              {activeTab === "settings" && (
                <SettingsTab settings={settings} updateSetting={updateSetting} micOptions={micOptions} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
