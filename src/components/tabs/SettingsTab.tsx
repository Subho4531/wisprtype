import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card } from "../cards/Card";
import { AppSettings } from "../../types";

interface SettingsTabProps {
  settings: AppSettings;
  updateSetting: (updates: Partial<AppSettings>) => void;
  micOptions: string[];
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  settings, 
  updateSetting, 
  micOptions
}) => {

  const [localHotkey, setLocalHotkey] = useState(settings.hotkey);
  
  useEffect(() => {
    setLocalHotkey(settings.hotkey);
  }, [settings.hotkey]);

  const handleHotkeyRecorder = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const keys = [];
    if (e.ctrlKey) keys.push('Control');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Command');
    

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      if (keyName.length === 1) keyName = keyName.toUpperCase();
      keys.push(keyName);

    }
    
    if (keys.length > 0) {
      const newHotkey = keys.join('+');
      setLocalHotkey(newHotkey);
      updateSetting({ hotkey: newHotkey });
    }
  };
  
  const handleHotkeyKeyUp = () => {
    // No-op since we now support modifier-only hotkeys natively via low-level hooks
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors p-4">
      {/* Audio Engine Configuration */}
      <Card title="Audio Hardware Interfaces">
        <div className="space-y-6 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Capture Device</label>
            <select 
              value={settings.microphoneDevice}
              onChange={(e) => updateSetting({ microphoneDevice: e.target.value })}
              className="w-full accent-black bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              {micOptions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Signal Gain ({settings.gain}%)</label>
            <input 
              type="range" min="0" max="100" 
              value={settings.gain}
              onChange={(e) => updateSetting({ gain: parseInt(e.target.value) })}
              className="w-full accent-black cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* AI Model Configuration */}
      <Card title="Neural Parameters">
        <div className="space-y-6 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Whisper Local Model</label>
            <select 
              value={settings.whisperModel}
              onChange={(e) => {
                const newModel = e.target.value;
                updateSetting({ whisperModel: newModel as any });
                invoke("download_model", { model: newModel }).catch(console.error);
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              <option value="tiny">Tiny (Offline, ~75MB)</option>
              <option value="base">Base (Offline, ~140MB) - Optimal</option>
              <option value="small">Small (Offline, ~460MB)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Cloud Provider</label>
            <select 
              value={settings.cloudProvider}
              onChange={(e) => {
                const provider = e.target.value as any;
                const updates: any = { cloudProvider: provider };
                if (provider === "openai") updates.cloudModel = "gpt-4o-mini";
                if (provider === "gemini") updates.cloudModel = "gemini-2.5-flash";
                if (provider === "openrouter") updates.cloudModel = "google/gemini-2.5-flash";
                if (provider === "ollama") updates.cloudModel = "llama3.2";
                if (provider === "groq") updates.cloudModel = "llama-3.1-8b-instant";
                updateSetting(updates);
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 p-2 rounded"
            >
              <option value="none">Raw Recognition (None)</option>
              <option value="ollama">Local AI (Ollama)</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter (Free Models)</option>
              <option value="groq">Groq Cloud</option>
            </select>
          </div>
          {settings.cloudProvider !== "none" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Formatting Model</label>
              <select 
                value={settings.cloudModel}
                onChange={(e) => updateSetting({ cloudModel: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
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
                {settings.cloudProvider === "groq" && (
                  <>
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                    <option value="llama3-70b-8192">Llama 3 70B</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Secure Credentials */}
      <Card title="Security & Authentication">
        <div className="space-y-6 mt-4 flex flex-col">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Cloud API Access Key</label>
            <input 
              type="password" 
              value={settings.apiKey}
              disabled={settings.cloudProvider === "none" || settings.cloudProvider === "ollama"}
              onChange={(e) => updateSetting({ apiKey: e.target.value })}
              placeholder="Enter API Credentials..."
              className="w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              style={{ opacity: (settings.cloudProvider === "none" || settings.cloudProvider === "ollama") ? 0.4 : 1 }}
            />
          </div>
        </div>
      </Card>

      {/* General App Preferences */}
      <Card title="System Integration">
        <div className="space-y-6 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Global Trigger Hotkey</label>
            <input 
              type="text" 
              value={localHotkey}
              readOnly
              onKeyDown={handleHotkeyRecorder}
              onKeyUp={handleHotkeyKeyUp}
              placeholder="Click and press keys..."
              className="w-full font-mono text-sm uppercase bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 cursor-pointer focus:bg-zinc-100"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Press your desired key combination. Ctrl+Win, Ctrl+Alt, etc. are supported.</p>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <span className="font-bold text-sm block text-black dark:text-white">Launch on OS Startup</span>
            </div>
            <div className="toggle-switch-wrapper">
              <input 
                type="checkbox" id="launchOnStartup" className="switch-input"
                checked={settings.launchOnStartup}
                onChange={(e) => updateSetting({ launchOnStartup: e.target.checked })}
              />
              <label htmlFor="launchOnStartup" className="switch-label">Toggle</label>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <span className="font-bold text-sm block text-black dark:text-white">Start Minimized</span>
            </div>
            <div className="toggle-switch-wrapper">
              <input 
                type="checkbox" id="startMinimized" className="switch-input"
                checked={settings.startMinimized}
                onChange={(e) => updateSetting({ startMinimized: e.target.checked })}
              />
              <label htmlFor="startMinimized" className="switch-label">Toggle</label>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <span className="font-bold text-sm block text-black dark:text-white">Instant Text Paste</span>
            </div>
            <div className="toggle-switch-wrapper">
              <input 
                type="checkbox" id="pasteImmediately" className="switch-input"
                checked={settings.pasteImmediately}
                onChange={(e) => updateSetting({ pasteImmediately: e.target.checked })}
              />
              <label htmlFor="pasteImmediately" className="switch-label">Toggle</label>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
};
