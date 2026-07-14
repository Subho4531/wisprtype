'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Copy, Cpu, Sparkles } from 'lucide-react'

const SAMPLE_HISTORY = [
  {
    id: 1,
    timestamp: '09:42 AM',
    wordCount: 128,
    text: "Follow up with the design team about the onboarding flow — let's ship the simplified version by Friday and revisit the animation later.",
  },
  {
    id: 2,
    timestamp: '09:15 AM',
    wordCount: 64,
    text: 'Draft a quick reply to Sarah confirming the 3pm sync and asking her to loop in the backend engineer.',
  },
  {
    id: 3,
    timestamp: 'Yesterday',
    wordCount: 212,
    text: "Meeting notes: we're prioritizing offline transcription accuracy over new integrations this sprint.",
  },
]

const STATS = [
  { label: 'Total Transcriptions', value: '482' },
  { label: 'Recognition State', value: 'Nominal' },
  { label: 'Signal Gain', value: '68%' },
  { label: 'Processed Words', value: '94,210' },
]

const TIPS = [
  "Say “process the email” at the end to draft a full response.",
  'WisprType is 100% offline — your voice never leaves your device.',
  'Toggle recording instantly from any app with your global hotkey.',
]

const GLOBE_WORDS = [
  'dictate', 'offline', 'wisprtype', 'capture', 'refine', 'format',
  'voice', 'privacy', 'fluid', 'seamless', 'local', 'instant',
  'accurate', 'hotkey', 'minimal', 'natural',
]

function WordOrbit() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const spherePoints = useMemo(() => {
    const N = GLOBE_WORDS.length
    const radius = 78
    return GLOBE_WORDS.map((text, i) => {
      const phi = Math.acos(-1 + (2 * i) / N)
      const theta = Math.sqrt(N * Math.PI) * phi
      return {
        text,
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
      }
    })
  }, [])

  useEffect(() => {
    let frameId: number
    const tick = () => {
      setRotation((prev) => ({ x: prev.x + 0.0035, y: prev.y + 0.0055 }))
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div className="apv-globe">
      {spherePoints.map((pt, i) => {
        const y1 = pt.y * Math.cos(rotation.x) - pt.z * Math.sin(rotation.x)
        const z1 = pt.y * Math.sin(rotation.x) + pt.z * Math.cos(rotation.x)
        const x2 = pt.x * Math.cos(rotation.y) + z1 * Math.sin(rotation.y)
        const z2 = -pt.x * Math.sin(rotation.y) + z1 * Math.cos(rotation.y)

        const radius = 78
        const normZ = (z2 + radius) / (2 * radius)
        const scale = (0.55 + normZ * 0.75).toFixed(3)
        const opacity = (0.2 + normZ * 0.8).toFixed(3)

        return (
          <span
            key={i}
            className="apv-globe-word"
            style={{
              transform: `translate3d(${x2.toFixed(2)}px, ${y1.toFixed(2)}px, 0px) scale(${scale})`,
              color: `rgba(249, 115, 22, ${opacity})`,
              zIndex: Math.round(z2 + radius),
              textShadow: '0 0 8px rgba(249,115,22,0.3)',
            }}
          >
            {pt.text}
          </span>
        )
      })}
    </div>
  )
}

export default function AppPreview() {
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="apv-window">
      <div className="apv-titlebar">
        <div className="apv-dots">
          <span /><span /><span />
        </div>
        <span className="apv-titlebar-label">WisprType — Overview</span>
        <span />
      </div>

      <div className="apv-grid">
        <div className="apv-cell apv-welcome">
          <span className="apv-eyebrow">Overview</span>
          <h4 className="apv-welcome-title">Welcome back</h4>
          <p className="apv-welcome-copy">Everything is ready for your next voice capture.</p>
        </div>

        <div className="apv-cell apv-voice">
          <svg className="apv-sine" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0,40 C20,10 40,70 60,40 C80,10 100,70 120,40 C140,10 160,70 180,40 C200,10 220,70 240,40 C260,10 280,70 300,40 C320,10 340,70 360,40 C380,10 400,70 420,40"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            />
          </svg>
          <div className="apv-voice-top">
            <span className="apv-voice-label">Voice Capture</span>
            <span className="apv-voice-icon"><ArrowUpRight size={12} /></span>
          </div>
          <div className="apv-voice-bottom">
            <h4 className="apv-voice-title">Stop Capturing</h4>
            <div className="apv-voice-meta">
              <span>Current state: Recording</span>
              <span className="apv-bars" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} style={{ height: `${8 + ((i * 37) % 10)}px`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        </div>

        {STATS.map((stat) => (
          <div className="apv-cell apv-stat" key={stat.label}>
            <span className="apv-stat-label">{stat.label}</span>
            <span className="apv-stat-value">{stat.value}</span>
          </div>
        ))}

        <div className="apv-cell apv-recent">
          <span className="apv-cell-title">Recent Transcriptions</span>
          <div className="apv-recent-list">
            {SAMPLE_HISTORY.map((entry) => (
              <div className="apv-entry" key={entry.id}>
                <div className="apv-entry-top">
                  <span className="apv-entry-time">{entry.timestamp}</span>
                  <span className="apv-entry-right">
                    <span className="apv-entry-count">{entry.wordCount} words</span>
                    <span className="apv-entry-copy"><Copy size={10} /></span>
                  </span>
                </div>
                <p className="apv-entry-text">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="apv-cell apv-orbit">
          <span className="apv-cell-title">Word Orbit</span>
          <div className="apv-orbit-stage">
            <WordOrbit />
          </div>
          <div className="apv-badges">
            <span className="apv-badge"><Cpu size={9} /> Local ASR</span>
            <span className="apv-badge"><Sparkles size={9} /> Noise Gate</span>
          </div>
          <div className="apv-tip">
            <Sparkles size={12} className="apv-tip-icon" />
            <div className="apv-tip-text">
              <AnimatePresence mode="wait">
                <motion.span
                  key={tipIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {TIPS[tipIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .apv-window {
          width: 100%;
          max-width: 640px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: #09090b;
          box-shadow: 0 30px 90px rgba(0,0,0,0.5), 0 0 70px rgba(249,115,22,0.10);
          overflow: hidden;
          transform: perspective(1600px) rotateY(-7deg) rotateX(3deg);
          transition: transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .apv-window:hover {
          transform: perspective(1600px) rotateY(-2deg) rotateX(1deg);
        }
        .apv-titlebar {
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .apv-dots { display: flex; gap: 6px; }
        .apv-dots span {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.16);
        }
        .apv-titlebar-label {
          font-family: var(--font-heading);
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.35);
        }
        .apv-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-areas:
            "welcome welcome voice voice"
            "s1 s2 s3 s4"
            "recent recent recent orbit"
            "recent recent recent orbit";
          gap: 1px;
          background: #27272a;
        }
        .apv-cell {
          background: #18181b;
          padding: 14px;
          display: flex;
          flex-direction: column;
        }
        .apv-welcome { grid-area: welcome; justify-content: center; background: #0f0f11; }
        .apv-eyebrow {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(249,115,22,0.85);
          margin-bottom: 6px;
        }
        .apv-welcome-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 700;
          color: #f4f4f5;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }
        .apv-welcome-copy { font-size: 0.72rem; color: #71717a; line-height: 1.5; }
        .apv-voice {
          grid-area: voice;
          background: #09090b;
          position: relative;
          overflow: hidden;
        }
        .apv-sine { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.1; }
        .apv-voice-top {
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #27272a; padding-bottom: 10px; margin-bottom: 10px;
        }
        .apv-voice-label { font-size: 0.72rem; font-weight: 500; color: #fff; }
        .apv-voice-icon {
          width: 20px; height: 20px; border-radius: 50%; background: #27272a; color: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .apv-voice-bottom { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px; position: relative; z-index: 1; }
        .apv-voice-title { font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: #fff; }
        .apv-voice-meta { display: flex; align-items: center; gap: 8px; font-size: 0.68rem; color: #71717a; }
        .apv-bars { display: flex; align-items: flex-end; gap: 2px; }
        .apv-bars span {
          display: block; width: 3px; border-radius: 2px; background: #f97316;
          animation: apv-pulse 0.6s ease-in-out infinite alternate;
        }
        @keyframes apv-pulse { from { opacity: 0.5; } to { opacity: 1; } }
        .apv-stat { gap: 10px; }
        .apv-stat-label { font-size: 0.6rem; color: #71717a; font-weight: 500; }
        .apv-stat-value {
          font-family: var(--font-heading);
          font-size: 1.7rem; font-weight: 800; color: #f4f4f5;
          letter-spacing: -0.02em; font-variant-numeric: tabular-nums;
        }
        .apv-recent { grid-area: recent; }
        .apv-orbit { grid-area: orbit; align-items: center; text-align: center; }
        .apv-cell-title { font-size: 0.72rem; font-weight: 500; color: #f4f4f5; border-bottom: 1px solid #27272a; padding-bottom: 10px; margin-bottom: 10px; width: 100%; }
        .apv-recent-list { display: flex; flex-direction: column; gap: 8px; }
        .apv-entry { border: 1px solid #27272a; border-radius: 10px; padding: 10px; background: rgba(255,255,255,0.015); }
        .apv-entry-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .apv-entry-time { font-size: 0.6rem; color: #71717a; }
        .apv-entry-right { display: flex; align-items: center; gap: 6px; }
        .apv-entry-count { font-size: 0.58rem; background: #27272a; color: #d4d4d8; padding: 2px 7px; border-radius: 999px; font-weight: 500; }
        .apv-entry-copy { color: #71717a; width: 18px; height: 18px; border-radius: 6px; border: 1px solid #27272a; display: flex; align-items: center; justify-content: center; }
        .apv-entry-text { font-size: 0.68rem; color: #a1a1aa; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .apv-orbit-stage { flex-grow: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
        .apv-globe { position: relative; width: 190px; height: 190px; }
        .apv-globe-word {
          position: absolute; top: 50%; left: 50%; font-size: 8.5px; font-weight: 700;
          letter-spacing: -0.02em; white-space: nowrap; font-family: var(--font-heading);
        }
        .apv-badges { display: flex; gap: 6px; margin-top: 8px; }
        .apv-badge {
          display: inline-flex; align-items: center; gap: 3px; font-size: 0.55rem; font-weight: 600;
          padding: 3px 7px; border-radius: 999px; border: 1px solid #27272a; color: #a1a1aa;
        }
        .apv-tip {
          margin-top: 12px; padding-top: 12px; border-top: 1px solid #27272a;
          display: flex; align-items: flex-start; gap: 6px; text-align: left; width: 100%;
        }
        .apv-tip-icon { color: #f97316; flex-shrink: 0; margin-top: 1px; }
        .apv-tip-text { font-size: 0.62rem; color: #71717a; line-height: 1.4; position: relative; overflow: hidden; min-height: 2.2em; }

        @media (max-width: 900px) {
          .apv-window { max-width: 90%; transform: none; }
          .apv-window:hover { transform: none; }
        }
        @media (max-width: 560px) {
          .apv-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-areas:
              "welcome welcome"
              "voice voice"
              "s1 s2"
              "s3 s4"
              "recent recent"
              "orbit orbit";
          }
        }
      `}</style>
    </div>
  )
}
