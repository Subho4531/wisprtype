const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'subho', 'OneDrive', 'Documents', 'wisprtype', 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports at the top
const imports = `import { AppSettings, TranscriptionEntry, OverlayState } from './types';
import { WaveformOverlay } from './components/overlay/WaveformOverlay';
import { Card } from './components/cards/Card';
import { StatCard } from './components/cards/StatCard';
`;
content = content.replace(/(import .* from "lucide-react";)/, `$1\n${imports}`);

// 2. Remove interfaces (but keep DEFAULT_SETTINGS in place for now)
content = content.replace(/\/\/ --- Interface for settings object ---[\s\S]*?export interface TranscriptionEntry \{[\s\S]*?\}/, '');

// 3. Remove OverlayState, ArchitectCard, Metric, WaveformOverlay components
content = content.replace(/\/\/ --- Custom Architect Layout Components ---[\s\S]*?\/\/ ============================================================/g, '// ============================================================');
content = content.replace(/\/\/ ============================================================[\s\S]*?\/\/ --- Main App Logic ---/g, '// --- Main App Logic ---');

// 4. Replace ArchitectCard with Card
content = content.replace(/<ArchitectCard/g, '<Card');
content = content.replace(/<\/ArchitectCard>/g, '</Card>');
// Remove code prop
content = content.replace(/ code="[^"]*"/g, '');

// 5. Replace Metric with StatCard
content = content.replace(/<Metric/g, '<StatCard');
// Remove trend prop
content = content.replace(/ trend="[^"]*"/g, '');

// 6. Update "Mission Control" banner
const oldBanner = `<Card colSpan="lg:col-span-2" className="flex flex-col justify-center bg-zinc-50" title="Wisprtype Mission Control">
                  <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2">
                    Mission Control
                  </h1>
                  <p className="font-mono text-xs text-zinc-500 max-w-md leading-relaxed">
                    SECTOR 01 // REAL-TIME COGNITIVE VOICE PIPELINE
                    <br />
                    All modules validated. Model discovery offline, direct key ingestion ready.
                  </p>
                </Card>`;

const newBanner = `<Card colSpan="lg:col-span-2" className="flex flex-col justify-center bg-zinc-50" title="System Status">
                  <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2">
                    Welcome Back
                  </h1>
                  <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
                    Ready to transcribe. All modules validated.
                  </p>
                </Card>`;
content = content.replace(oldBanner, newBanner);

// 7. Update Sub-processes to Microphone Level
const oldSubProc = `<Card title="Tauri Sub-processes" className="h-[400px] flex flex-col justify-between" colSpan="col-span-1" rowSpan="row-span-2">
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
                      <span>{appState === "Recording" ? \`\${audioLevel.toFixed(0)}%\` : "0%"}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100">
                      <div className="h-full bg-orange-500 transition-all duration-75" style={{ width: \`\${appState === "Recording" ? audioLevel : 0}%\` }} />
                    </div>
                  </div>
                </Card>`;

const newSubProc = `<Card title="Microphone Level" className="h-[400px] flex flex-col justify-between" colSpan="col-span-1" rowSpan="row-span-2">
                  <div className="flex-grow flex items-center justify-center text-zinc-400 text-sm">
                    {appState === "Recording" ? "Recording active..." : "Mic idle"}
                  </div>
                  <div className="mt-8 pt-4 border-t border-zinc-200">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span>Microphone Level</span>
                      <span>{appState === "Recording" ? \`\${audioLevel.toFixed(0)}%\` : "0%"}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-75" style={{ width: \`\${appState === "Recording" ? audioLevel : 0}%\` }} />
                    </div>
                  </div>
                </Card>`;
content = content.replace(oldSubProc, newSubProc);

// 8. Replace alert() with console.log()
content = content.replace(/alert\(/g, 'console.log(');

// 9. Remove Search icon div
const searchDiv = `<div className="w-8 h-8 rounded-none border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-100 cursor-pointer ml-2 transition-colors">
            <Search className="w-4 h-4" />
          </div>`;
content = content.replace(searchDiv, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Refactoring done.");
