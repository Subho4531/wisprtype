'use client'

import React from 'react'

const techItems = [
  'Whisper AI',
  'Tauri Framework',
  'Rust',
  'React',
  'OpenRouter',
  'Gemini AI',
  'OpenAI',
  'Ollama',
  'tokio',
  'serde',
  'hyper',
  'cpal',
  'whisper-rs',
  'Framer Motion',
  'Next.js (Turbopack)',
  'Web Audio API'
]

export default function TechStrip() {
  const track = (
    <div style={{ display: 'flex', gap: '1rem', paddingRight: '1rem' }}>
      {techItems.map((item, i) => (
        <span
          key={`item-${i}`}
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '9999px',
            padding: '0.6rem 1.5rem',
            fontSize: '0.9rem',
            color: '#A0A0A0',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {item}
        </span>
      ))}
    </div>
  )

  const renderRow = (direction: 'left' | 'right', speed: string) => {
    return (
      <div
        style={{
          display: 'flex',
          width: 'max-content',
          animation: direction === 'left'
            ? `marquee-left ${speed} linear infinite`
            : `marquee-right ${speed} linear infinite`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running'
        }}
      >
        {track}
        {track}
      </div>
    )
  }

  return (
    <section
      style={{
        background: 'rgba(10,10,10,0.4)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '3rem 0',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <p
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: '#A0A0A0',
          marginBottom: '2.5rem',
          fontWeight: 600,
        }}
      >
        Built with cutting-edge technology
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ overflow: 'hidden' }}>
          {renderRow('left', '40s')}
        </div>
        <div style={{ overflow: 'hidden', marginLeft: '-50px' }}>
          {renderRow('right', '45s')}
        </div>
      </div>

      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  )
}
