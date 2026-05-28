import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { Minus, ArrowUpRight, Copy, Inbox } from "lucide-react";
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 mb-24 transition-colors">
      {/* Mission Control Header Card */}
      <Card colSpan="lg:col-span-2" className="flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900" title="Overview">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
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
        <SineWave active={appState === "Recording"} />
        <div className="flex items-start justify-between mb-6 border-b border-zinc-800 pb-4 w-full">
          <div>
            <h3 className="text-base font-medium tracking-tight text-white">Voice Capture</h3>
          </div>
          <div className="h-8 w-8 bg-white dark:bg-zinc-800 text-black dark:text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            {appState === "Recording" ? <Minus className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
        </div>
        
        <div className="relative z-10 w-full h-full flex flex-col justify-center gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            {appState === "Recording" ? "Stop Capturing" : "Start Transcribing"}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">
              {appState === "Idle" ? "Click anywhere in this card to toggle your microphone." : `Current state: ${appState}`}
            </p>
            {appState === "Recording" && (
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

      {/* Recent History Mini-View */}
      <Card colSpan="lg:col-span-3" rowSpan="row-span-2" title="Recent Transcriptions" className="min-h-[400px]">
        <div className="mt-4 flex flex-col gap-4 overflow-y-auto max-h-[320px] pr-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
              <Inbox className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" strokeWidth={1.5} />
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">No transcriptions yet</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Trigger voice capture to begin.</p>
            </div>
          ) : (
            history.slice(0, 3).map((entry) => (
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
        {history.length > 3 && (
          <button 
            onClick={() => setActiveTab("history")}
            className="mt-4 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors w-full text-left"
          >
            View full history &rarr;
          </button>
        )}
      </Card>

      {/* Side Node Status Module */}
      <Card title="Microphone Level" className="h-[400px] flex flex-col justify-between" colSpan="col-span-1" rowSpan="row-span-2">
        <div className="flex-grow flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
          {appState === "Recording" ? "Recording active..." : "Mic idle"}
        </div>
        <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between text-xs font-bold mb-2 text-zinc-900 dark:text-zinc-100">
            <span>Microphone Level</span>
            <span>{appState === "Recording" ? `${audioLevel.toFixed(0)}%` : "0%"}</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 transition-all duration-75" style={{ width: `${appState === "Recording" ? audioLevel : 0}%` }} />
          </div>
        </div>
      </Card>
    </div>
  );
};
