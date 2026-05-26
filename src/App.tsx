import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Hexagon,
  Search,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "./lib/utils";
import "./App.css";

// --- Interface for settings object ---
interface AppSettings {
  hotkey: string;
  launchOnStartup: boolean;
  pasteImmediately: boolean;
  microphoneDevice: string;
  gain: number;
  whisperModel: string;
  cloudProvider: "none" | "openai" | "gemini" | "openrouter" | "ollama";
  cloudModel: string;
  apiKey: string;
}

export interface TranscriptionEntry {
  id: string;
  timestamp: string;
  text: string;
  word_count: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  hotkey: "Ctrl + Shift + Space",
  launchOnStartup: true,
  pasteImmediately: true,
  microphoneDevice: "Default System Microphone",
  gain: 75,
  whisperModel: "base",
  cloudProvider: "openrouter",
  cloudModel: "google/gemini-2.5-flash",
  apiKey: "••••••••••••••••••••••••",
};


// --- Custom Architect Layout Components ---

interface ArchitectCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  code?: string;
  colSpan?: string;
  rowSpan?: string;
}

export function ArchitectCard({
  children,
  className,
  title,
  code,
  colSpan = "col-span-1",
  rowSpan = "row-span-1"
}: ArchitectCardProps) {
  return (
    <div className={cn(
      "relative bg-white dark:bg-zinc-900 p-6 group transition-colors duration-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between",
      colSpan,
      rowSpan,
      className
    )}>
      {/* Decorative Crosshairs */}
      <div className="absolute -top-[5px] -left-[5px] text-zinc-300 dark:text-zinc-700 pointer-events-none font-sans font-bold text-xs transition-colors duration-300">+</div>
      <div className="absolute -top-[5px] -right-[5px] text-zinc-300 dark:text-zinc-700 pointer-events-none font-sans font-bold text-xs transition-colors duration-300">+</div>
      <div className="absolute -bottom-[5px] -left-[5px] text-zinc-300 dark:text-zinc-700 pointer-events-none font-sans font-bold text-xs transition-colors duration-300">+</div>
      <div className="absolute -bottom-[5px] -right-[5px] text-zinc-300 dark:text-zinc-700 pointer-events-none font-sans font-bold text-xs transition-colors duration-300">+</div>

      {/* Header */}
      {(title || code) && (
        <div className="flex items-start justify-between mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4 transition-colors duration-300">
          <div>
            {code && <span className="block text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mb-1">{code}</span>}
            {title && <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">{title}</h3>}
          </div>
          <div className="h-2 w-2 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export function Metric({ label, value, trend, code }: { label: string; value: number | string; trend: string; code: string }) {
  return (
    <ArchitectCard code={code} title={label} className="min-h-[192px]" colSpan="col-span-1" rowSpan="row-span-1">
      <div className="flex items-baseline gap-2 mt-4">
        <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors duration-300">{value}</span>
      </div>
      <div className="flex items-center gap-2 mt-8">
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 transition-colors duration-300",
          trend.startsWith("+") || trend === "100%" || trend === "Optimal" || trend === "Total" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
        )}>
          {trend.startsWith("+") ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend}
        </div>
        <span className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500 transition-colors duration-300">vs Prev. Period</span>
      </div>
    </ArchitectCard>
  );
}

// ============================================================
// WAVEFORM OVERLAY COMPONENT
// Faithful adaptation of the reference neon waveform visualizer.
// Mini, no text — just the waveform on a transparent background.
// ============================================================

type OverlayState = "Idle" | "Recording" | "Transcribing" | "Formatting" | "Pasting" | "Error";

interface WaveformOverlayProps {
  appState: OverlayState;
  audioLevel: number;   // 0–100
  recordingSeconds: number;
  statusMessage: string;
}

export function WaveformOverlay({ appState, audioLevel }: WaveformOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const ampBufferRef = useRef<Float32Array | null>(null);
  const weightsRef = useRef({ recording: 0, processing: 0, pasting: 0, error: 0, idle: 0 });


  const isRecording   = appState === "Recording";
  const isTranscribing = appState === "Transcribing";
  const isFormatting  = appState === "Formatting";
  const isProcessing  = isTranscribing || isFormatting;
  const isPasting     = appState === "Pasting";
  const isError       = appState === "Error";
  const isActive      = isRecording || isProcessing || isPasting || isError;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;
    const ctx = canvas.getContext("2d")!;

    const NUM_BARS = 32;
    const MIN_H_PX = 2;

    // Initialise amplitude buffer for exponential smoothing
    if (!ampBufferRef.current || ampBufferRef.current.length !== NUM_BARS) {
      ampBufferRef.current = new Float32Array(NUM_BARS).fill(0.25);
    }
    const ampBuffer = ampBufferRef.current;

    // ── Noise helper: layered sines approximating organic noise ──
    function smoothNoise(x: number, t: number, seed: number): number {
      const a = Math.sin(x * 1.3 + t * 0.7 + seed * 2.1) * 0.40;
      const b = Math.sin(x * 2.7 + t * 0.4 + seed * 3.7) * 0.25;
      const c = Math.sin(x * 5.1 + t * 1.1 + seed * 1.3) * 0.15;
      const d = Math.sin(x * 9.3 + t * 0.2 + seed * 4.9) * 0.10;
      const e = Math.sin(x * 17.7 + t * 1.8 + seed * 0.9) * 0.06;
      const f = Math.sin(x * 33.1 + t * 0.9 + seed * 7.3) * 0.04;
      return a + b + c + d + e + f;
    }

    // ── Amplitude model ──
    function getAmplitude(xNorm: number, t: number): number {
      const lf1 = Math.sin(xNorm * Math.PI * 1.8 + t * 0.18) * 0.55;
      const lf2 = Math.sin(xNorm * Math.PI * 0.9 + t * 0.11 + 1.2) * 0.35;
      const lf3 = Math.sin(xNorm * Math.PI * 2.6 + t * 0.22 + 2.4) * 0.20;
      const mf1 = Math.sin(xNorm * Math.PI * 5.5 + t * 0.55 + 0.8) * 0.14;
      const mf2 = Math.sin(xNorm * Math.PI * 8.3 + t * 0.38 + 3.1) * 0.09;
      const mf3 = Math.sin(xNorm * Math.PI * 13.1 + t * 0.72 + 1.7) * 0.05;
      const noise = smoothNoise(xNorm * 4.0, t * 0.25, 1.41) * 0.18;
      const breath = 0.88 + Math.sin(t * 0.31) * 0.07 + Math.sin(t * 0.17) * 0.05;
      const raw = lf1 + lf2 + lf3 + mf1 + mf2 + mf3 + noise;
      const normalised = (raw / 1.56 + 1.0) * 0.5;
      return Math.pow(Math.max(0, normalised), 1.3) * breath;
    }

    // ── Color palette per state ──
    // Returns [topR, topG, topB, midR, midG, midB, botR, botG, botB]
    function getBarColors(): { top: string; mid: string; core: string } {
      if (isRecording) {
        // Pink/magenta → white → blue (matching reference)
        const r1 = 255, g1 = 45, b1 = 122;     // top: hot pink
        const rM = 255, gM = 255, bM = 255;     // middle: white hot
        const r2 = 102, g2 = 170, b2 = 255;     // bottom: soft blue
        return {
          top: `${r1},${g1},${b1}`,
          mid: `${rM},${gM},${bM}`,
          core: `${r2},${g2},${b2}`,
        };
      } else if (isTranscribing) {
        // Blue → white → cyan
        return {
          top: "50,130,255",
          mid: "220,240,255",
          core: "80,200,255",
        };
      } else if (isFormatting) {
        // Green → white → teal
        return {
          top: "40,200,130",
          mid: "220,255,240",
          core: "60,220,180",
        };
      } else if (isPasting) {
        // Emerald burst
        return {
          top: "16,185,129",
          mid: "200,255,230",
          core: "16,200,140",
        };
      } else {
        // Error: red
        return {
          top: "239,68,68",
          mid: "255,200,200",
          core: "255,100,80",
        };
      }
    }

    // ── Draw a single neon bar (multi-layer glow) ──
    function drawBar(x: number, cy: number, h: number, intensity: number, colors: ReturnType<typeof getBarColors>) {
      if (h < 0.5) return;
      const barW = 1.5;

      // Outer soft glow — wide, very transparent
      const outerSpread = h * 1.6 + 4;
      const gOuter = ctx.createLinearGradient(x, cy - outerSpread, x, cy + outerSpread);
      const a0 = 0.0;
      const aEdge = 0.10 * intensity;
      const aMid = 0.18 * intensity;
      gOuter.addColorStop(0.00, `rgba(${colors.top},${a0})`);
      gOuter.addColorStop(0.15, `rgba(${colors.top},${aEdge})`);
      gOuter.addColorStop(0.40, `rgba(${colors.top},${aMid})`);
      gOuter.addColorStop(0.50, `rgba(${colors.mid},${0.22 * intensity})`);
      gOuter.addColorStop(0.60, `rgba(${colors.core},${aMid})`);
      gOuter.addColorStop(0.85, `rgba(${colors.core},${aEdge})`);
      gOuter.addColorStop(1.00, `rgba(${colors.core},${a0})`);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = gOuter;
      ctx.fillRect(x - barW * 3, cy - outerSpread, barW * 6, outerSpread * 2);

      // Mid glow — medium spread
      const midSpread = h * 1.0 + 2;
      const gMid = ctx.createLinearGradient(x, cy - midSpread, x, cy + midSpread);
      gMid.addColorStop(0.00, `rgba(${colors.top},0)`);
      gMid.addColorStop(0.10, `rgba(${colors.top},${0.30 * intensity})`);
      gMid.addColorStop(0.35, `rgba(${colors.top},${0.45 * intensity})`);
      gMid.addColorStop(0.50, `rgba(${colors.mid},${0.55 * intensity})`);
      gMid.addColorStop(0.65, `rgba(${colors.core},${0.45 * intensity})`);
      gMid.addColorStop(0.90, `rgba(${colors.core},${0.30 * intensity})`);
      gMid.addColorStop(1.00, `rgba(${colors.core},0)`);
      ctx.fillStyle = gMid;
      ctx.fillRect(x - barW * 1.8, cy - midSpread, barW * 3.6, midSpread * 2);

      // Core bar — tight, bright, white-hot center
      const coreSpread = h;
      const gCore = ctx.createLinearGradient(x, cy - coreSpread, x, cy + coreSpread);
      gCore.addColorStop(0.00, `rgba(${colors.top},0)`);
      gCore.addColorStop(0.08, `rgba(${colors.top},${0.70 * intensity})`);
      gCore.addColorStop(0.30, `rgba(${colors.top},${0.88 * intensity})`);
      gCore.addColorStop(0.50, `rgba(${colors.mid},${intensity})`);
      gCore.addColorStop(0.70, `rgba(${colors.core},${0.88 * intensity})`);
      gCore.addColorStop(0.92, `rgba(${colors.core},${0.70 * intensity})`);
      gCore.addColorStop(1.00, `rgba(${colors.core},0)`);
      ctx.fillStyle = gCore;
      ctx.beginPath();
      // Fully round edges for the sharp core bar
      ctx.roundRect(x - barW * 0.7, cy - coreSpread, barW * 1.4, coreSpread * 2, barW * 0.7);
      ctx.fill();

      // Centre horizontal spine — ultra-bright 1px at axis
      const gSpine = ctx.createLinearGradient(x - 2.5, cy, x + 2.5, cy);
      gSpine.addColorStop(0, `rgba(${colors.mid},0)`);
      gSpine.addColorStop(0.5, `rgba(${colors.mid},${0.9 * intensity})`);
      gSpine.addColorStop(1, `rgba(${colors.mid},0)`);
      ctx.fillStyle = gSpine;
      ctx.fillRect(x - 2.5, cy - 0.6, 5, 1.2);
    }

    let startTime: number | null = null;

    const render = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const t = (timestamp - startTime) * 0.001; // seconds

      const W = canvas.width;
      const H = canvas.height;

      // Clear to fully transparent black
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);

      const cy = H * 0.5;
      const maxH = H * 0.28; // Smaller/tiny waveform
      const barGap = W / NUM_BARS;

      // Microphone level affects speed and amplitude directly
      const micLevel = audioLevel / 100;
      const timeScale = isRecording ? (0.8 + micLevel * 0.8) : (isProcessing ? 0.5 : 1.0);
      const ampScale = isRecording ? (0.1 + micLevel * 3.5) : 0.8; // Highly sensitive to raw audio
      
      // We no longer need fast reactivity for transitions, because we blend weights smoothly
      const smoothK = isRecording ? (0.4 + micLevel * 0.2) : 0.15;

      const colors = getBarColors();
      
      // Update state weights for buttery smooth transitions
      const w = weightsRef.current;
      w.recording += ((isRecording ? 1 : 0) - w.recording) * 0.08;
      w.processing += ((isProcessing ? 1 : 0) - w.processing) * 0.08;
      w.pasting += ((isPasting ? 1 : 0) - w.pasting) * 0.08;
      w.error += ((isError ? 1 : 0) - w.error) * 0.08;
      const isIdle = !isRecording && !isProcessing && !isPasting && !isError;
      w.idle += ((isIdle ? 1 : 0) - w.idle) * 0.08;

      for (let i = 0; i < NUM_BARS; i++) {
        const xNorm = i / (NUM_BARS - 1);
        let blendedAmp = 0;

        // 1. Recording
        if (w.recording > 0.001) {
          const centerEnvelope = Math.pow(Math.sin(xNorm * Math.PI), 1.8);
          blendedAmp += getAmplitude(xNorm, t * timeScale) * centerEnvelope * w.recording;
        }

        // 2. Processing (Hourglass with left-to-right waves)
        if (w.processing > 0.001) {
          const hourglassMult = 0.15 + 0.85 * Math.abs(Math.cos(xNorm * Math.PI));
          const wave1 = Math.sin(xNorm * Math.PI * 6 - t * 6);
          const wave2 = Math.sin(xNorm * Math.PI * 10 - t * 10);
          const travelingWave = Math.max(0, (wave1 * 0.7 + wave2 * 0.3) * 0.5 + 0.5);
          const processAmp = hourglassMult * travelingWave * 1.5;
          blendedAmp += processAmp * w.processing;
        }

        // 3. Pasting
        if (w.pasting > 0.001) {
          const burstPhase = Math.max(0, Math.sin(t * 4));
          blendedAmp += getAmplitude(xNorm, t) * burstPhase * w.pasting;
        }

        // 4. Error
        if (w.error > 0.001) {
          const jitter = 0.4 + 0.6 * Math.abs(Math.sin(t * 10 + i * 0.5));
          blendedAmp += getAmplitude(xNorm, t) * jitter * w.error;
        }

        // 5. Idle
        if (w.idle > 0.001) {
          blendedAmp += getAmplitude(xNorm, t * 0.5) * 0.3 * w.idle;
        }

        // Exponential smoothing on the final blended amplitude
        ampBuffer[i] += (blendedAmp * ampScale - ampBuffer[i]) * smoothK;
        const amp = ampBuffer[i];
        const h = Math.max(MIN_H_PX, amp * maxH);
        const intensity = Math.min(1.0, 0.6 + amp * 0.8);
        const x = barGap * (i + 0.5);

        drawBar(x, cy, h, intensity, colors);
      }
      ctx.globalCompositeOperation = "source-over";
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, audioLevel]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(16px) saturate(180%)",
      WebkitBackdropFilter: "blur(16px) saturate(180%)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "9999px",
      overflow: "hidden",
      margin: 0,
      padding: "0 10px", // Inner padding to keep bars away from the pill edges
    }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}

// --- Main App Logic ---

function App() {
  const [windowLabel, setWindowLabel] = useState<string>("main");
  const [appState, setAppState] = useState<string>("Idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [history, setHistory] = useState<TranscriptionEntry[]>([]);

  // Timer state for overlay recording state
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingTimerRef = useRef<any>(null);

  // Micro audio wave animation states
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Check window label on startup
  useEffect(() => {
    try {
      const appWindow = getCurrentWindow();
      const label = appWindow.label;
      setWindowLabel(label);
      document.documentElement.className = `window-${label}`;
    } catch (e) {
      console.error("Tauri environment not detected, running in web mock mode:", e);
      setWindowLabel("main");
      document.documentElement.className = "window-main";
    }
  }, []);

  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadHistory = async () => {
    try {
      const historyStr = await invoke<string>("get_history");
      const parsed = JSON.parse(historyStr);
      setHistory(parsed);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  // Sync state from Tauri Core
  useEffect(() => {
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

    loadHistory();

    const unlisten = listen<{ state: string; message?: string }>("state-changed", (event) => {
      const newState = event.payload.state;
      setAppState((prev) => {
        if (prev !== "Idle" && newState === "Idle") {
          // Finished a pipeline cycle, refresh history
          setTimeout(loadHistory, 500); // Give backend a moment to write to disk
        }
        return newState;
      });
      setStatusMessage(event.payload.message || "");
    });

    const unlistenDownload = listen<{ progress: number; message: string }>("download-progress", (event) => {
      setStatusMessage(event.payload.message);
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenDownload.then((fn) => fn());
    };
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await invoke("delete_history_entry", { id });
      await loadHistory();
    } catch (e) {
      console.error("Failed to delete entry:", e);
    }
  };

  // Load settings from Tauri Core on startup
  useEffect(() => {
    const hasCompletedSetup = localStorage.getItem("wisprtype_setup_complete");
    if (!hasCompletedSetup) {
      setShowOnboarding(true);
    }

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

  // Audio level listener from backend
  useEffect(() => {
    const unlisten = listen<number>("volume-level", (event) => {
      setAudioLevel(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const saveSettings = (updated: AppSettings) => {
    localStorage.setItem("wisprtype_settings", JSON.stringify(updated));
    
    // Check if running in Tauri environment
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      invoke("save_settings", { settingsStr: JSON.stringify(updated) })
        .catch((err) => {
          console.error("Failed to sync settings to backend:", err);
          alert("Settings sync failed: " + err);
        });
    } else {
      console.log("Mock mode: Settings saved to local storage only.");
    }
  };

  const handleHotkeyRecorder = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const keys = [];
    
    // Tauri Shortcut parser expects modifiers in specific order usually: CmdOrCtrl+Alt+Shift+Key
    // But most importantly, it needs the main key at the end.
    if (e.ctrlKey) keys.push('Control');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Command');
    
    // Add the main key if it's not a modifier
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      if (keyName.length === 1) keyName = keyName.toUpperCase();
      keys.push(keyName);
      
      // Set the hotkey string with + separator and no spaces for maximum compatibility
      setSettings({ ...settings, hotkey: keys.join('+') });
    }
  };

  const handleToggleRecording = () => {
    invoke("toggle_recording").catch((err) =>
      console.error("Failed to toggle recording:", err)
    );
  };


  /* ==========================================================================
     RENDER: OVERLAY STATUS PILL (windowLabel === "overlay")
     ========================================================================== */
  if (windowLabel === "overlay") {
    return (
      <WaveformOverlay
        appState={appState as any}
        audioLevel={audioLevel}
        recordingSeconds={recordingSeconds}
        statusMessage={statusMessage}
      />
    );
  }

  /* ==========================================================================
     RENDER: MAIN SETTINGS DASHBOARD (windowLabel === "main")
     ========================================================================== */

  if (showOnboarding) {
    return (
      <div className="fixed inset-0 bg-zinc-900 z-[100] flex items-center justify-center p-6 text-zinc-100 selection:bg-orange-500 font-sans">
        <ArchitectCard className="max-w-xl w-full min-h-[500px] !bg-zinc-950 !border-zinc-800" code="SETUP-01" title="Initial Configuration">
          <div className="flex flex-col gap-6 mt-4">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-2">Welcome to Wisprtype V1</h2>
              <p className="text-sm font-mono text-zinc-400">Please configure your cognitive text formatting engine to continue. You can always change this later in Preferences.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cloud Provider</label>
              <select 
                value={settings.cloudProvider}
                onChange={(e) => setSettings({ ...settings, cloudProvider: e.target.value as any })}
                className="w-full bg-zinc-900 border-zinc-800 text-white"
              >
                <option value="none">Raw Recognition (None)</option>
                <option value="ollama">Local AI (Ollama)</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter (Free Models)</option>
              </select>
            </div>

            {(settings.cloudProvider !== "none" && settings.cloudProvider !== "ollama") && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">API Access Key</label>
                <input 
                  type="password" 
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="Enter API Credentials..."
                  className="w-full bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            )}

            <button 
              className="bg-white text-black hover:bg-zinc-200 transition-colors uppercase font-mono font-bold text-xs p-4 mt-8"
              onClick={() => {
                if (settings.cloudProvider !== "none" && settings.cloudProvider !== "ollama" && !settings.apiKey.trim()) {
                  alert("Please enter your API Key, or select 'Raw Recognition' to skip.");
                  return;
                }
                localStorage.setItem("wisprtype_setup_complete", "true");
                saveSettings(settings);
                setShowOnboarding(false);
              }}
            >
              Initialize System
            </button>
          </div>
        </ArchitectCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-200 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-orange-500 selection:text-white transition-colors duration-300">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 h-16 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black transition-colors duration-300">
            <Hexagon className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tighter text-black dark:text-white">
            WISPRTYPE<span className="text-zinc-400 dark:text-zinc-500">.V1</span>
          </span>
        </div>

        <div className="hidden md:flex items-center divide-x divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
          {[
            { id: "overview", label: "overview" },
            { id: "history", label: "history" },
            { id: "analytics", label: "analytics" },
            { id: "settings", label: "preferences" }
          ].map((tab) => (
            <button
              key={tab.id}
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
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 dark:text-zinc-500">
            <span className={cn(
              "h-2 w-2 rounded-full bg-emerald-500 animate-pulse",
              appState === "Recording" ? "bg-red-500" : ""
            )}></span>
            {appState === "Idle" ? "SYSTEM_READY" : `SYSTEM_${appState.toUpperCase()}`}
          </div>
          
          <div className="w-8 h-8 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-pointer ml-2">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Grid Dashboard System */}
      <main className="p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* --- VIEW 1: OVERVIEW (MISSION CONTROL) --- */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 border border-zinc-200 mb-24">
                {/* Mission Control Header Card */}
                <ArchitectCard colSpan="lg:col-span-2" className="flex flex-col justify-center bg-zinc-50" title="Wisprtype Mission Control" code="MCR-01">
                  <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2">
                    Mission Control
                  </h1>
                  <p className="font-mono text-xs text-zinc-500 max-w-md leading-relaxed">
                    SECTOR 01 // REAL-TIME COGNITIVE VOICE PIPELINE
                    <br />
                    All modules validated. Model discovery offline, direct key ingestion ready. Trigger manual capture to test.
                  </p>
                </ArchitectCard>

                {/* Test Voice Trigger Card */}
                <ArchitectCard colSpan="lg:col-span-2" className="flex items-center justify-between bg-zinc-900 text-white hover:bg-zinc-800" title="Voice Pipeline Ingest" code="GEN-01">
                  <div className="flex flex-col justify-center h-full gap-2">
                    <h3 className="text-xl font-bold uppercase">
                      {appState === "Recording" ? "Stop Capturing" : "Trigger Voice Capture"}
                    </h3>
                    <p className="text-zinc-400 text-xs font-mono">
                      {appState === "Idle" ? "Click arrow to toggle active voice intake stream" : `State: ${appState}`}
                    </p>
                  </div>
                  <button 
                    onClick={handleToggleRecording} 
                    className="h-12 w-12 bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                  >
                    {appState === "Recording" ? <Minus className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </button>
                </ArchitectCard>

                {/* Metrics Row */}
                <Metric label="Total Transcriptions" value={history.length} trend="+1" code="SYS-NOD" />
                <Metric label="Recognition State" value={appState === "Idle" ? "Nominal" : appState} trend="0ms" code="STT-042" />
                <Metric label="Hardware Signal Gain" value={`${settings.gain}%`} trend="Optimal" code="AUD-102" />
                <Metric label="Processed Words" value={history.reduce((acc, entry) => acc + entry.word_count, 0)} trend="Total" code="TXT-220" />

                {/* Recent History Mini-View */}
                <ArchitectCard colSpan="lg:col-span-3" rowSpan="row-span-2" title="Recent Intakes" code="REC-HIST" className="min-h-[400px]">
                  <div className="mt-4 flex flex-col gap-4 overflow-y-auto max-h-[320px] pr-2">
                    {history.length === 0 ? (
                      <div className="text-zinc-400 text-sm font-mono mt-4">No recent transcriptions. Trigger voice capture to begin.</div>
                    ) : (
                      history.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="border border-zinc-200 p-4 bg-zinc-50 hover:bg-white transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono text-zinc-400 font-bold">{entry.timestamp}</span>
                            <div className="flex gap-2">
                              <span className="text-[10px] bg-zinc-200 px-2 py-0.5 text-zinc-600 font-bold">{entry.word_count} WORDS</span>
                              <button onClick={() => copyToClipboard(entry.text)} className="text-zinc-400 hover:text-black transition-colors" title="Copy Text">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-800 line-clamp-3 leading-relaxed">{entry.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  {history.length > 3 && (
                    <button 
                      onClick={() => setActiveTab("history")}
                      className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors w-full text-left"
                    >
                      + VIEW FULL HISTORY
                    </button>
                  )}
                </ArchitectCard>

                {/* Side Node Status Module */}
                <ArchitectCard title="Tauri Sub-processes" code="SYS-OP" className="h-[400px] flex flex-col justify-between" colSpan="col-span-1" rowSpan="row-span-2">
                  <div className="space-y-6 flex-grow">
                    {[
                      { label: "Cpal-Audio-Driver", status: "Active", metric: "16kHz" },
                      { label: "Whisper-rs-Engine", status: "Loaded", metric: "ggml-base" },
                      { label: "Llama-cpp-Refiner", status: "Standby", metric: "Offline" },
                      { label: "Enigo-Key-Injector", status: "Active", metric: "keystroke" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <div>
                          <div className="font-bold text-sm">{s.label}</div>
                          <div className="text-[10px] font-mono text-zinc-400">{s.status.toUpperCase()}</div>
                        </div>
                        <div className="font-mono text-xs font-bold text-zinc-900">{s.metric}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-4 border-t border-zinc-200">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span>SYSTEM VOLTAGE LEVEL</span>
                      <span>{appState === "Recording" ? `${audioLevel.toFixed(0)}%` : "0%"}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100">
                      <div className="h-full bg-orange-500 transition-all duration-75" style={{ width: `${appState === "Recording" ? audioLevel : 0}%` }} />
                    </div>
                  </div>
                </ArchitectCard>
              </div>
            )}

            {/* --- VIEW 2: FULL HISTORY --- */}
            {activeTab === "history" && (
              <div className="grid grid-cols-1 gap-px bg-zinc-200 border border-zinc-200 mb-24">
                <ArchitectCard title="Transcription Archive" code="ARCHIVE-FULL" className="min-h-[600px]">
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-2">
                      <span className="text-xs font-bold text-zinc-500 uppercase">
                        {history.length} Record(s) Found
                      </span>
                      {history.length > 0 && (
                        <button 
                          onClick={async () => {
                            if(window.confirm("Clear entire history?")) {
                              await invoke("clear_history");
                              loadHistory();
                            }
                          }} 
                          className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear All
                        </button>
                      )}
                    </div>
                    {history.length === 0 ? (
                      <div className="text-zinc-400 text-sm font-mono text-center py-20">Archive empty.</div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {history.map((entry) => (
                          <div key={entry.id} className="border border-zinc-200 p-4 bg-zinc-50 hover:bg-white transition-colors group flex flex-col justify-between h-48">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-mono text-zinc-400 font-bold">{entry.timestamp}</span>
                                <span className="text-[10px] bg-zinc-200 px-2 py-0.5 text-zinc-600 font-bold">{entry.word_count} WORDS</span>
                              </div>
                              <p className="text-sm text-zinc-800 line-clamp-3 leading-relaxed">{entry.text}</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100">
                              <button onClick={() => deleteEntry(entry.id)} className="p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-transparent hover:border-red-200" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => copyToClipboard(entry.text)} className="p-2 flex items-center gap-2 bg-black text-white hover:bg-zinc-800 transition-colors text-xs font-bold uppercase" title="Copy Text">
                                <Copy className="w-4 h-4" /> Copy
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ArchitectCard>
              </div>
            )}

            {/* --- VIEW 3: ANALYTICS (MOST SPOKEN WORDS) --- */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-1 gap-px bg-zinc-200 border border-zinc-200 mb-24">
                <ArchitectCard title="Cognitive Linguistics Analytics" code="ANL-WORDS" className="min-h-[600px]">
                  <div className="mt-4">
                    <p className="text-xs font-mono text-zinc-500 mb-8">
                      Frequency analysis of recognized phonetic structures across all recorded sessions.
                    </p>
                    {history.length === 0 ? (
                      <div className="text-zinc-400 text-sm font-mono text-center py-20">Insufficient data for linguistic analysis.</div>
                    ) : (
                      (() => {
                        const stopWords = new Set(["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me"]);
                        const wordCounts: Record<string, number> = {};
                        history.forEach(entry => {
                          const words = entry.text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
                          words.forEach(w => {
                            if (w.length > 2 && !stopWords.has(w)) {
                              wordCounts[w] = (wordCounts[w] || 0) + 1;
                            }
                          });
                        });
                        const sortedWords = Object.entries(wordCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 20)
                          .map(([name, val]) => ({ name, val }));

                        return (
                          <div className="h-full min-h-[400px] w-full">
                            <ResponsiveContainer width="100%" height={400}>
                              <BarChart data={sortedWords} layout="vertical" margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 'bold' }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#18181b', fontSize: 12, fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: 0, border: '1px solid #e4e4e7', boxShadow: 'none' }} />
                                <Bar dataKey="val" fill="#18181b" radius={[0, 4, 4, 0]} barSize={20} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </ArchitectCard>
              </div>
            )}

            {/* --- VIEW 4: CONSOLIDATED SETTINGS --- */}
            {activeTab === "settings" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mb-24">
                
                {/* Audio Engine Configuration */}
                <ArchitectCard title="Audio Hardware Interfaces" code="CFG-AUDIO" className="min-h-[300px]">
                  <div className="space-y-6 mt-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Capture Device</label>
                      <select 
                        value={settings.microphoneDevice}
                        onChange={(e) => setSettings({ ...settings, microphoneDevice: e.target.value })}
                        className="w-full accent-black bg-zinc-50 border-zinc-200"
                      >
                        <option>Default System Microphone</option>
                        <option>Hardware High-Definition Audio Device</option>
                        <option>Virtual Audio Cable (Line-1)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Signal Gain ({settings.gain}%)</label>
                      <input 
                        type="range" min="0" max="100" 
                        value={settings.gain}
                        onChange={(e) => setSettings({ ...settings, gain: parseInt(e.target.value) })}
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-2 pt-4">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Real-Time Input Level</label>
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 transition-colors duration-300">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-75" 
                          style={{ width: `${audioLevel}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </ArchitectCard>

                {/* AI Model Configuration */}
                <ArchitectCard title="Neural Parameters" code="CFG-AI" className="min-h-[300px]">
                  <div className="space-y-6 mt-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Whisper Local Model</label>
                      <select 
                        value={settings.whisperModel}
                        onChange={(e) => {
                          const newModel = e.target.value;
                          setSettings({ ...settings, whisperModel: newModel });
                          invoke("download_model", { model: newModel }).catch(console.error);
                        }}
                        className="w-full bg-zinc-50 border-zinc-200"
                      >
                        <option value="tiny">Tiny (Offline, ~75MB)</option>
                        <option value="base">Base (Offline, ~140MB) - Optimal</option>
                        <option value="small">Small (Offline, ~460MB)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cloud Provider</label>
                      <select 
                        value={settings.cloudProvider}
                        onChange={(e) => setSettings({ ...settings, cloudProvider: e.target.value as any })}
                        className="w-full bg-zinc-50 border-zinc-200"
                      >
                        <option value="none">Raw Recognition (None)</option>
                        <option value="ollama">Local AI (Ollama)</option>
                        <option value="openai">OpenAI</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="openrouter">OpenRouter (Free Models)</option>
                      </select>
                    </div>
                    {settings.cloudProvider !== "none" && (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Formatting Model</label>
                        <select 
                          value={settings.cloudModel}
                          onChange={(e) => setSettings({ ...settings, cloudModel: e.target.value })}
                          className="w-full bg-zinc-50 border-zinc-200"
                        >
                          {settings.cloudProvider === "openai" && (
                            <>
                              <option value="gpt-4o-mini">GPT-4o-Mini (Fastest)</option>
                              <option value="gpt-4o">GPT-4o (High Precision)</option>
                            </>
                          )}
                          {settings.cloudProvider === "gemini" && (
                            <>
                              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                              <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B (Fastest)</option>
                            </>
                          )}
                          {settings.cloudProvider === "openrouter" && (
                            <>
                              <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (Free)</option>
                              <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B (Free)</option>
                            </>
                          )}
                          {settings.cloudProvider === "ollama" && (
                            <>
                              <option value="llama3.2">Llama 3.2 (Local)</option>
                              <option value="qwen2.5">Qwen 2.5 (Local)</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                  </div>
                </ArchitectCard>

                {/* Secure Credentials */}
                <ArchitectCard title="Security & Authentication" code="CFG-SEC" className="min-h-[300px]">
                  <div className="space-y-6 mt-4 flex flex-col h-full">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cloud API Access Key</label>
                      <input 
                        type="password" 
                        value={settings.apiKey}
                        disabled={settings.cloudProvider === "none" || settings.cloudProvider === "ollama"}
                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                        placeholder="Enter API Credentials..."
                        className="w-full bg-zinc-50 border-zinc-200"
                        style={{ opacity: (settings.cloudProvider === "none" || settings.cloudProvider === "ollama") ? 0.4 : 1 }}
                      />
                    </div>
                  </div>
                </ArchitectCard>

                {/* General App Preferences */}
                <ArchitectCard title="System Integration" code="CFG-SYS" className="min-h-[300px] flex flex-col justify-between">
                  <div className="space-y-6 mt-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Global Trigger Hotkey</label>
                      <input 
                        type="text" 
                        value={settings.hotkey}
                        readOnly
                        onKeyDown={handleHotkeyRecorder}
                        placeholder="Click and press keys..."
                        className="w-full font-mono text-sm uppercase bg-zinc-50 border-zinc-200 cursor-pointer focus:bg-zinc-100"
                      />
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                      <div>
                        <span className="font-bold text-sm block">Launch on OS Startup</span>
                      </div>
                      <div className="toggle-switch-wrapper">
                        <input 
                          type="checkbox" id="launchOnStartup" className="switch-input"
                          checked={settings.launchOnStartup}
                          onChange={(e) => setSettings({ ...settings, launchOnStartup: e.target.checked })}
                        />
                        <label htmlFor="launchOnStartup" className="switch-label">Toggle</label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                      <div>
                        <span className="font-bold text-sm block">Instant Text Paste</span>
                      </div>
                      <div className="toggle-switch-wrapper">
                        <input 
                          type="checkbox" id="pasteImmediately" className="switch-input"
                          checked={settings.pasteImmediately}
                          onChange={(e) => setSettings({ ...settings, pasteImmediately: e.target.checked })}
                        />
                        <label htmlFor="pasteImmediately" className="switch-label">Toggle</label>
                      </div>
                    </div>
                  </div>
                </ArchitectCard>

              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
