'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, ChevronRight, Globe, Zap, Shield } from 'lucide-react'
import dynamic from 'next/dynamic'

const HeroScene = dynamic(() => import('../3d/ThreeCanvas'), { ssr: false })

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 }
  }
}

const stats = [
  { icon: <Globe size={16} />, label: '50+ Languages' },
  { icon: <Zap size={16} />, label: '99% Accuracy' },
  { icon: <Shield size={16} />, label: '100% Offline' },
]

function HeroSceneFallback() {
  return (
    <div className="hero-scene-fallback" aria-hidden="true">
      <div className="hero-fallback-window">
        <div className="hero-fallback-titlebar">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-fallback-body">
          <div className="hero-fallback-line hero-fallback-line-wide" />
          <div className="hero-fallback-line" />
          <div className="hero-fallback-line hero-fallback-line-short" />
          <div className="hero-fallback-output">
            <span>Voice captured locally</span>
            <strong>Ready</strong>
          </div>
        </div>
        <div className="hero-fallback-mic">
          <span />
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const auroraRef = useRef<HTMLDivElement>(null)
  const [showHeroScene, setShowHeroScene] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const desktopViewport = window.matchMedia('(min-width: 901px)')

    if (reducedMotion.matches || !desktopViewport.matches) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      setShowHeroScene(true)
    }, 800)

    return () => window.clearTimeout(loadTimer)
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(pointer: fine)')

    if (reducedMotion.matches || !finePointer.matches) {
      return
    }

    let animationFrame = 0
    let targetX = 0
    let targetY = 0

    const updateAurora = () => {
      animationFrame = 0
      if (!auroraRef.current) return
      auroraRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
    }

    const handleMouse = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 16
      targetY = (e.clientY / window.innerHeight - 0.5) * 16

      if (!animationFrame) {
        animationFrame = requestAnimationFrame(updateAurora)
      }
    }

    window.addEventListener('mousemove', handleMouse)
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'visible',
      paddingTop: '72px',
      zIndex: 10,
    }}>
      {/* Aurora Background */}

      <div ref={auroraRef} style={{
        position: 'absolute',
        inset: '-20%',
        zIndex: 0,
        transition: 'transform 120ms ease-out',
        willChange: 'transform',
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255, 69, 0, 0.16) 0%, rgba(255, 69, 0, 0.08) 42%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
          willChange: 'transform',
        }} />
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255, 140, 0, 0.12) 0%, rgba(255, 140, 0, 0.06) 42%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse',
          willChange: 'transform',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '40%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 42%, transparent 70%)',
          animation: 'float 12s ease-in-out infinite',
          willChange: 'transform',
        }} />
      </div>

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4rem',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Left Content — 55% */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ flex: '0 0 55%', maxWidth: '55%' }}
        >
          {/* Badge */}
          <motion.div variants={itemVariants} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            background: 'rgba(255, 69, 0, 0.08)',
            border: '1px solid rgba(255, 69, 0, 0.2)',
            color: '#FF8C00',
            fontWeight: 600,
            fontSize: '0.85rem',
            marginBottom: '2rem',
          }}>
            <span style={{ fontSize: '1rem' }}>✨</span>
            Now Available for Windows
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} style={{ marginBottom: '1.5rem' }}>
            Your Voice,{' '}
            <br />
            <span className="gradient-text">Perfectly Typed.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={itemVariants} style={{
            fontSize: '1.2rem',
            maxWidth: '520px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}>
            WisprType uses on-device Whisper AI to transcribe your voice
            instantly — in 50+ languages. Speak naturally, type effortlessly.
          </motion.p>

          {/* CTA Group */}
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '3rem',
            flexWrap: 'wrap',
          }}>
            <a href="#download" className="btn-primary" style={{
              animation: 'pulse-glow 3s ease-in-out infinite',
            }}>
              <Download size={20} />
              Download for Windows
            </a>
            <a href="#how-it-works" className="btn-secondary">
              See How It Works
              <ChevronRight size={18} />
            </a>
          </motion.div>

          {/* Stats Row */}
          <motion.div variants={itemVariants} style={{
            display: 'flex',
            gap: '2rem',
          }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}>
                <span style={{ color: 'var(--primary)', display: 'flex' }}>{stat.icon}</span>
                {stat.label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side — 3D Scene */}
        <motion.div
          className="hero-scene-wrapper"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {showHeroScene ? <HeroScene /> : <HeroSceneFallback />}
        </motion.div>
      </div>

      {/* Bottom gradient fade into next section */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '15vh',
        background: 'linear-gradient(to top, var(--bg), transparent)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* Responsive overrides */}
      <style>{`
        .hero-scene-wrapper {
           position: absolute;
           right: -25%;
           width: 80%;
           height: 140%;
           top: -20%;
           z-index: 100;
        }
        .hero-scene-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .hero-fallback-window {
          position: relative;
          width: min(560px, 68%);
          min-width: 320px;
          aspect-ratio: 16 / 10;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(26,26,26,0.96), rgba(12,12,12,0.94));
          box-shadow: 0 28px 80px rgba(0,0,0,0.42), 0 0 60px rgba(255,69,0,0.12);
          overflow: hidden;
          transform: rotateY(-12deg) rotateX(6deg);
        }
        .hero-fallback-titlebar {
          height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 18px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }
        .hero-fallback-titlebar span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }
        .hero-fallback-body {
          padding: 34px;
        }
        .hero-fallback-line {
          height: 16px;
          width: 72%;
          margin-bottom: 18px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
        }
        .hero-fallback-line-wide {
          width: 88%;
        }
        .hero-fallback-line-short {
          width: 48%;
        }
        .hero-fallback-output {
          margin-top: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          border-radius: 999px;
          border: 1px solid rgba(255,69,0,0.24);
          background: rgba(255,69,0,0.08);
          color: rgba(255,255,255,0.78);
          font-size: 0.95rem;
        }
        .hero-fallback-output strong {
          color: #FFD700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .hero-fallback-mic {
          position: absolute;
          left: 50%;
          bottom: -34px;
          width: 76px;
          height: 76px;
          transform: translateX(-50%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 35% 30%, #FB923C, #C2410C);
          box-shadow: 0 0 38px rgba(249,115,22,0.38);
        }
        .hero-fallback-mic span {
          width: 20px;
          height: 32px;
          border: 2px solid rgba(255,255,255,0.9);
          border-radius: 999px;
        }
        @media (max-width: 900px) {
          .container {
            flex-direction: column !important;
            text-align: center;
          }
          .container > div:first-child {
            flex: 1 1 100% !important;
            max-width: 100% !important;
          }
          .hero-scene-wrapper {
            position: relative !important;
            right: auto !important;
            top: auto !important;
            width: 100% !important;
            height: 500px !important;
          }
          .hero-fallback-window {
            width: min(520px, 92%);
            transform: none;
          }
        }
      `}</style>
    </section>
  )
}
