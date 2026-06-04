export interface AppSettings {
  hotkey: string;
  launchOnStartup: boolean;
  startMinimized: boolean;
  pasteImmediately: boolean;
  microphoneDevice: string;
  gain: number;
  whisperModel: string;
  cloudProvider: "none" | "openai" | "gemini" | "openrouter" | "ollama";
  cloudModel: string;
  apiKey: string;
  hasCompletedOnboarding: boolean;
}

export interface TranscriptionEntry {
  id: string;
  timestamp: string;
  text: string;
  word_count: number;
}

export type OverlayState = 'Idle' | 'Recording' | 'Transcribing' | 'Formatting' | 'Pasting' | 'Error';
