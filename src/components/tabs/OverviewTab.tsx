import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Minus, ArrowUpRight, Copy, Inbox, Sparkles, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../cards/Card";
import { StatCard } from "../cards/StatCard";
import { TranscriptionEntry, OverlayState, AppSettings } from "../../types";
import { useToast } from "../../hooks/useToast";

const SineWave: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  return (
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 80" preserveAspectRatio="none">
      <style>{`
        @keyframes wave-shift { from { transform: translateX(0); } to { transform: translateX(-200px); } }
        .wave-path { animation: wave-shift 1.5s linear infinite; }
      `}</style>
      <path
        className="wave-path"
        d="M0,40 C20,10 40,70 60,40 C80,10 100,70 120,40 C140,10 160,70 180,40 C200,10 220,70 240,40 C260,10 280,70 300,40 C320,10 340,70 360,40 C380,10 400,70 420,40 C440,10 460,70 480,40 C500,10 520,70 540,40 C560,10 580,70 600,40"
        fill="none"
        stroke="white"
        strokeWidth="3"
      />
    </svg>
  );
};

const DICTATION_TIPS = [
  "Tip: Say 'process the email' at the end to automatically draft an email response.",
  "Tip: Say 'process the caption' at the end to formulate a creative caption.",
  "Tip: Wisprtype is 100% offline-first. Your voice data is stored locally.",
  "Tip: Toggle recording instantly from any application using your global hotkey.",
  "Tip: Speak clearly and let the AI refiner take care of punctuation and grammar."
];

const STOP_WORDS = new Set([
  "the", "and", "a", "an", "of", "to", "in", "is", "that", "it", "you", "was", "for", "on", "are", 
  "as", "with", "his", "they", "i", "at", "be", "this", "have", "from", "or", "one", "had", "by", 
  "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", 
  "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", 
  "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "him", 
  "into", "has", "look", "two", "more", "write", "go", "see", "number", "no", "way", "could", 
  "people", "my", "than", "first", "water", "been", "call", "who", "oil", "its", "now", "find"
]);

const FALLBACK_WORDS = ["dictate", "offline", "wisprtype", "capture", "refine", "format", "voice", "speech", "ai", "keyboard", "smart", "privacy", "minimal", "speed", "fluid"];

const WordGlobe: React.FC<{ history: TranscriptionEntry[]; active: boolean; level: number }> = ({ history, active, level }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Extract words from the latest 15 transcription entries
  const words = React.useMemo(() => {
    const counts: Record<string, number> = {};
    history.slice(0, 15).forEach((entry) => {
      entry.text.split(/\s+/).forEach((w) => {
        const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (clean.length > 2 && !STOP_WORDS.has(clean)) {
          counts[clean] = (counts[clean] || 0) + 1;
        }
      });
    });

    let items = Object.entries(counts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 18);

    if (items.length < 8) {
      // Backfill with fallback words
      const currentTexts = new Set(items.map((i) => i.text));
      FALLBACK_WORDS.forEach((fw) => {
        if (items.length < 18 && !currentTexts.has(fw)) {
          items.push({ text: fw, count: 1 });
        }
      });
    }
    return items;
  }, [history]);

  // Compute 3D positions on Fibonacci Sphere
  const spherePoints = React.useMemo(() => {
    const N = words.length;
    return words.map((word, i) => {
      const phi = Math.acos(-1 + (2 * i) / N);
      const theta = Math.sqrt(N * Math.PI) * phi;
      const radius = 100; // Sphere radius in px
      
      return {
        text: word.text,
        count: word.count,
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
      };
    });
  }, [words]);

  // Animation loop to rotate the sphere
  useEffect(() => {
    let frameId: number;
    const speedMultiplier = active ? 1 + (level / 100) * 2.5 : 1;
    const tick = () => {
      setRotation((prev) => ({
        x: prev.x + 0.003 * speedMultiplier,
        y: prev.y + 0.005 * speedMultiplier,
      }));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, level]);

  return (
    <div ref={containerRef} className="relative w-64 h-64 flex items-center justify-center pointer-events-none">
      {spherePoints.map((pt, i) => {
        // Project coordinates with X and Y rotations
        const rx = rotation.x;
        const ry = rotation.y;

        // Rotate around X-axis
        const y1 = pt.y * Math.cos(rx) - pt.z * Math.sin(rx);
        const z1 = pt.y * Math.sin(rx) + pt.z * Math.cos(rx);

        // Rotate around Y-axis
        const x2 = pt.x * Math.cos(ry) + z1 * Math.sin(ry);
        const z2 = -pt.x * Math.sin(ry) + z1 * Math.cos(ry);

        // Map Z coordinate to depth effects (Scale & Opacity)
        const radius = 100;
        const normZ = (z2 + radius) / (2 * radius); // 0 to 1
        const scale = 0.55 + normZ * 0.75;
        const opacity = 0.15 + normZ * 0.85;

        // Visual distinction when capturing audio
        const fontColor = active
          ? `rgba(249, 115, 22, ${opacity})` // Orange theme when recording
          : `rgba(${113 - normZ * 40}, ${113 - normZ * 40}, ${122 - normZ * 30}, ${opacity})`; // Cool grey scaling

        return (
          <span
            key={i}
            className="absolute text-[10px] font-bold tracking-tight select-none pointer-events-none whitespace-nowrap transition-colors duration-200"
            style={{
              transform: `translate3d(${x2}px, ${y1}px, 0px) scale(${scale})`,
              color: fontColor,
              zIndex: Math.round(z2 + radius),
              textShadow: active ? "0 0 8px rgba(249,115,22,0.3)" : "none",
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            {pt.text}
          </span>
        );
      })}
    </div>
  );
};

interface OverviewTabProps {
  history: TranscriptionEntry[];
  appState: OverlayState;
  audioLevel: number;
  settings: AppSettings;
  setActiveTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  history,
  appState,
  audioLevel,
  settings,
  setActiveTab,
}) => {
  const { toast } = useToast();
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DICTATION_TIPS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleRecording = () => {
    invoke("toggle_recording").catch((err) =>
      console.error("Failed to toggle recording:", err)
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast("Failed to copy text", "error");
    }
  };

  const isActive = appState === "Recording";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors">
      {/* Mission Control Header Card */}
      <Card colSpan="lg:col-span-2" className="flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900" title="Overview">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100 animate-fade-in" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
          Everything is ready for your next voice capture. Trigger the microphone to start transcribing your ideas instantly.
        </p>
      </Card>

      {/* Test Voice Trigger Card */}
      <button 
        onClick={handleToggleRecording}
        className="lg:col-span-2 relative bg-zinc-900 dark:bg-zinc-950 p-6 group transition-colors duration-300 hover:bg-zinc-800 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between text-left focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <SineWave active={isActive} />
        <div className="flex items-start justify-between mb-6 border-b border-zinc-800 pb-4 w-full">
          <div>
            <h3 className="text-base font-medium tracking-tight text-white">Voice Capture</h3>
          </div>
          <div className="h-8 w-8 bg-white dark:bg-zinc-800 text-black dark:text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            {isActive ? <Minus className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
        </div>
        
        <div className="relative z-10 w-full h-full flex flex-col justify-center gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            {isActive ? "Stop Capturing" : "Start Transcribing"}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">
              {appState === "Idle" ? "Click anywhere in this card to toggle your microphone." : `Current state: ${appState}`}
            </p>
            {isActive && (
              <div className="flex items-center gap-0.5 ml-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i}
                    className="w-1 bg-orange-500 rounded-full animate-pulse"
                    style={{ 
                      height: `${12 + Math.random() * 8}px`,
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '0.6s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Metrics Row */}
      <StatCard label="Total Transcriptions" value={history.length} />
      <StatCard label="Recognition State" value={appState === "Idle" ? "Nominal" : appState} />
      <StatCard label="Hardware Signal Gain" value={`${settings.gain}%`} />
      <StatCard label="Processed Words" value={history.reduce((acc, entry) => acc + entry.word_count, 0)} />

      <Card colSpan="col-span-1 md:col-span-2 lg:col-span-3" rowSpan="row-span-2" title="Recent Transcriptions" className="h-[550px] flex flex-col">
        <div className="mt-2 flex-grow overflow-y-auto pr-2 flex flex-col gap-4 min-h-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
              <Inbox className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" strokeWidth={1.5} />
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">No transcriptions yet</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Trigger voice capture to begin.</p>
            </div>
          ) : (
            history.slice(0, 10).map((entry) => (
              <div key={entry.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 shadow-sm transition-colors group">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{entry.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-zinc-600 dark:text-zinc-300 font-medium rounded-full">{entry.word_count} words</span>
                    <button onClick={() => copyToClipboard(entry.text)} className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-lg shadow-sm transition-colors" title="Copy Text">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed">{entry.text}</p>
              </div>
            ))
          )}
        </div>
        {history.length > 10 && (
          <button 
            onClick={() => setActiveTab("history")}
            className="mt-4 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors w-full text-left"
          >
            View full history &rarr;
          </button>
        )}
      </Card>

      {/* Side Node Status Module */}
      <Card title="Word Orbit" className="h-[550px] flex flex-col justify-between" colSpan="col-span-1 md:col-span-2 lg:col-span-1" rowSpan="row-span-2">
        {/* Dynamic visualizer word globe space */}
        <div className="flex-grow flex flex-col items-center justify-center relative p-2 select-none overflow-hidden">
          <WordGlobe history={history} active={isActive} level={audioLevel} />

          {/* System Environment Badges */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-4">
            <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400">
              <Cpu className="w-2.5 h-2.5" />
              Local ASR
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400">
              <Sparkles className="w-2.5 h-2.5" />
              Noise Gate
            </span>
          </div>
        </div>

        {/* Input Meter & Tip Rotator */}
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
          
          {/* Micro Tip Card */}
          <div className="min-h-[46px] bg-zinc-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 relative overflow-hidden w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {DICTATION_TIPS[tipIndex]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
