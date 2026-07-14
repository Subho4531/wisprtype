'use client'

import React from 'react'
import { motion } from 'framer-motion'
import WaveformCanvas from '../effects/WaveformCanvas'

export default function AppShowcase() {
  return (
    <section
      style={{
        padding: '8rem 0',
        background: 'radial-gradient(ellipse at center, rgba(255,69,0,0.06) 0%, transparent 60%)',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          textAlign: 'center',
        }}
      >
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '1rem',
            letterSpacing: '-1px',
          }}
        >
          Always One Hotkey Away
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          style={{
            fontSize: '1.15rem',
            color: '#A0A0A0',
            marginBottom: '3rem',
            maxWidth: '550px',
            margin: '0 auto 3rem auto',
            lineHeight: 1.6,
          }}
        >
          A minimal floating overlay tracks your voice in real time — no
          window to switch to, no app to alt-tab into.
        </motion.p>

        {/* Waveform Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          style={{
            maxWidth: '700px',
            height: '200px',
            margin: '0 auto',
            borderRadius: '9999px',
            background: 'rgba(20,20,20,0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <WaveformCanvas />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          style={{
            fontSize: '0.95rem',
            color: '#A0A0A0',
            marginTop: '2.5rem',
            maxWidth: '600px',
            margin: '2.5rem auto 0 auto',
            lineHeight: 1.7,
          }}
        >
          It appears the instant you start speaking, tracks your input level
          live, and disappears the moment your text lands.
        </motion.p>
      </div>
    </section>
  )
}
