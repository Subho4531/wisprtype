'use client'

import React, { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, Zap, Globe, Brain, Shield, Sparkles, Terminal, Cpu, Lock } from 'lucide-react'

interface SpotlightCardProps {
  children: React.ReactNode
  index: number
}

function SpotlightCard({ children, index }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, opacity: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setSpotlight(prev => ({ ...prev, opacity: 0 }))
  }, [])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        background: 'rgba(20, 20, 20, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2.5rem',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseOver={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(255, 69, 0, 0.3)'
        el.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.5)'
        el.style.transform = 'translateY(-5px)'
      }}
      onMouseOut={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(255, 255, 255, 0.08)'
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Mouse spotlight overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: spotlight.opacity,
        transition: 'opacity 0.3s',
        background: `radial-gradient(350px circle at ${spotlight.x}px ${spotlight.y}px, rgba(255, 69, 0, 0.06), transparent 60%)`,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </motion.div>
  )
}

const features = [
  {
    icon: <Mic size={28} />,
    color: '#FF4500',
    title: 'Flawless Dictation',
    description: 'On-device Whisper AI transcribes with near-perfect accuracy, even in noisy environments.',
  },
  {
    icon: <Zap size={28} />,
    color: '#FF8C00',
    title: '0ms Latency',
    description: 'Direct audio buffer streaming directly to the local model. Words appear as fast as you speak.',
  },
  {
    icon: <Terminal size={28} />,
    color: '#FFD700',
    title: 'Global Hotkey Hook',
    description: 'Instantly summon WisprType from anywhere. A deeply integrated OS-level hook ensures readiness the millisecond you need it.',
  },
  {
    icon: <Brain size={28} />,
    color: '#FF4500',
    title: 'AI Smart Formatting',
    description: 'Cloud AI (Gemini, GPT, Ollama) auto-punctuates, capitalizes, and formats your text.',
  },
  {
    icon: <Lock size={28} />,
    color: '#FF8C00',
    title: 'Air-Gapped Ready',
    description: '100% offline dictation using the ggml-tiny or ggml-base models. Your audio never leaves your machine.',
  },
  {
    icon: <Cpu size={28} />,
    color: '#FFD700',
    title: 'Rust & Tauri Core',
    description: 'Consumes under 50MB of RAM. Heavy lifting runs in highly optimized Rust for zero latency and minimal system impact.',
  },
]

export default function Features() {
  return (
    <section id="features" style={{ padding: '8rem 0', position: 'relative' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            Built for{' '}
            <span className="gradient-text">Professionals</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ maxWidth: '550px', margin: '0 auto', fontSize: '1.1rem' }}
          >
            Everything you need to dictate emails, documents, and code with absolute precision.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
        }}>
          {features.map((feature, index) => (
            <SpotlightCard key={index} index={index}>
              {/* Icon */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `rgba(${feature.color === '#FF4500' ? '255,69,0' : feature.color === '#FF8C00' ? '255,140,0' : '255,215,0'}, 0.1)`,
                color: feature.color,
                marginBottom: '1.5rem',
              }}>
                {feature.icon}
              </div>
              {/* Title */}
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                fontFamily: 'var(--font-heading)',
                marginBottom: '0.75rem',
              }}>
                {feature.title}
              </h3>
              {/* Description */}
              <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
                {feature.description}
              </p>
            </SpotlightCard>
          ))}
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          #features .container > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          #features .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
