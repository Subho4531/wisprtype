'use client'

import React, { useEffect, useRef } from 'react'
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

export default function Hero() {
  const auroraRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Subtle mouse parallax on aurora
    const handleMouse = (e: MouseEvent) => {
      if (!auroraRef.current) return
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      auroraRef.current.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
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
        transition: 'transform 0.3s ease-out',
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 69, 0, 0.12)',
          filter: 'blur(100px)',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 140, 0, 0.08)',
          filter: 'blur(100px)',
          animation: 'float 10s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '40%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(255, 215, 0, 0.06)',
          filter: 'blur(100px)',
          animation: 'float 12s ease-in-out infinite',
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
          <HeroScene />
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
        }
      `}</style>
    </section>
  )
}
