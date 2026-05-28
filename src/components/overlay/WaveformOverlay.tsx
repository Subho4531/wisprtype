import { useEffect, useRef } from "react";
import { OverlayState } from '../../types';

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
