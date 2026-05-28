import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { Minus, ArrowUpRight, Copy, Inbox } from "lucide-react";
import { Card } from "../cards/Card";
import { StatCard } from "../cards/StatCard";
import { TranscriptionEntry, OverlayState, AppSettings } from "../../types";
import { useToast } from "../../hooks/useToast";

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
      <Card colSpan="lg:col-span-2" className="flex items-center justify-between bg-zinc-900 dark:bg-zinc-950 text-white hover:bg-zinc-800 dark:hover:bg-zinc-900" title="Voice Capture">
        <div className="flex flex-col justify-center h-full gap-2">
          <h3 className="text-xl font-semibold">
            {appState === "Recording" ? "Stop Capturing" : "Start Transcribing"}
          </h3>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">
            {appState === "Idle" ? "Click to toggle your microphone and start recording." : `Current state: ${appState}`}
          </p>
        </div>
        <button 
          onClick={handleToggleRecording} 
          className="h-12 w-12 bg-white dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center hover:scale-105 transition-transform shrink-0"
        >
          {appState === "Recording" ? <Minus className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
        </button>
      </Card>

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
