import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TranscriptionEntry } from "../types";

export function useHistory() {
  const [history, setHistory] = useState<TranscriptionEntry[]>([]);

  const loadHistory = async () => {
    try {
      const historyStr = await invoke<string>("get_history");
      const parsed = JSON.parse(historyStr);
      setHistory(parsed);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  return { history, setHistory, loadHistory };
}
