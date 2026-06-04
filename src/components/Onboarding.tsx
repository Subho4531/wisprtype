import React, { useState } from 'react';
import { AppSettings } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { Mic, Keyboard, Rocket, ArrowRight, Check, Brain } from 'lucide-react';

interface OnboardingProps {
  settings: AppSettings;
  updateSetting: (updates: Partial<AppSettings>) => void;
  micOptions: string[];
}

export const Onboarding: React.FC<OnboardingProps> = ({ settings, updateSetting, micOptions }) => {
  const [step, setStep] = useState(0);
  const [localHotkey, setLocalHotkey] = useState(settings.hotkey);

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

  const finishOnboarding = async () => {
    // Initiate background download for base model just in case it's not downloaded
    invoke("download_model", { model: settings.whisperModel }).catch(console.error);
    
    // Mark as completed
    updateSetting({ hasCompletedOnboarding: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10" />
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white dark:border-zinc-950 transition-colors ${step >= i ? 'bg-orange-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}
            >
              {step > i ? <Check className="w-5 h-5" /> : i + 1}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 min-h-[320px] flex flex-col relative" style={{ borderRadius: 0 }}>
          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-orange-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-orange-500" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-orange-500" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-orange-500" />

          {step === 0 && (
            <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6" style={{ borderRadius: 0 }}>
                <Rocket className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-black dark:text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Welcome to WisprType</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Experience lightning-fast, highly accurate voice dictation globally across your OS. Let's configure your setup to get the best results.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6" style={{ borderRadius: 0 }}>
                <Mic className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Microphone Setup</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                Select the primary microphone you will use for dictation.
              </p>
              
              <div className="space-y-4">
                <select 
                  value={settings.microphoneDevice}
                  onChange={(e) => updateSetting({ microphoneDevice: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 p-3 outline-none focus:border-orange-500 transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  {micOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Input Gain ({settings.gain}%)</span>
                  <input 
                    type="range" min="0" max="100" 
                    value={settings.gain}
                    onChange={(e) => updateSetting({ gain: parseInt(e.target.value) })}
                    className="flex-1 accent-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6" style={{ borderRadius: 0 }}>
                <Keyboard className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Global Hotkey</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                Set a global shortcut to start/stop recording anywhere on your computer.
              </p>
              
              <input 
                type="text" 
                value={localHotkey}
                readOnly
                onKeyDown={handleHotkeyRecorder}
                placeholder="Click and press keys..."
                className="w-full font-mono text-center text-lg py-4 bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 cursor-pointer focus:border-orange-500 transition-colors outline-none"
                style={{ borderRadius: 0 }}
              />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3 text-center uppercase tracking-widest">Press your desired key combination</p>
            </div>
          )}
          
          {step === 3 && (
            <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6" style={{ borderRadius: 0 }}>
                <Brain className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AI Models</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                Choose the neural engines that will transcribe and format your voice.
              </p>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Whisper Local Model</label>
                  <select 
                    value={settings.whisperModel}
                    onChange={(e) => updateSetting({ whisperModel: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 p-2.5 outline-none focus:border-orange-500 transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    <option value="tiny">Tiny (~75MB) - Fastest</option>
                    <option value="base">Base (~140MB) - Optimal</option>
                    <option value="small">Small (~460MB) - High Precision</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cloud Formatting Provider</label>
                  <select 
                    value={settings.cloudProvider}
                    onChange={(e) => {
                      const provider = e.target.value as any;
                      const updates: any = { cloudProvider: provider };
                      if (provider === "openai") updates.cloudModel = "gpt-4o-mini";
                      if (provider === "gemini") updates.cloudModel = "gemini-2.5-flash";
                      if (provider === "openrouter") updates.cloudModel = "google/gemini-2.5-flash";
                      if (provider === "ollama") updates.cloudModel = "llama3.2";
                      updateSetting(updates);
                    }}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 p-2.5 outline-none focus:border-orange-500 transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    <option value="none">Raw Recognition (None)</option>
                    <option value="ollama">Local AI (Ollama)</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter (Free Models)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-end">
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              style={{ borderRadius: 0 }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={finishOnboarding}
              className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3 font-bold hover:bg-orange-600 transition-colors"
              style={{ borderRadius: 0 }}
            >
              Finish Setup <Check className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
