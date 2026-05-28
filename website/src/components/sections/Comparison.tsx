'use client'

import React from 'react'
import { motion } from 'framer-motion'
import ParallaxWrapper from '../effects/ParallaxWrapper'

export default function Comparison() {
  return (
    <section style={{ padding: '10rem 0', position: 'relative', overflow: 'hidden' }}>
      {/* Background Parallax Element */}
      <ParallaxWrapper offset={100} zIndex={-1}>
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,140,0,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </ParallaxWrapper>

      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            The Old Way vs <span className="gradient-text">WisprType</span>
          </motion.h2>
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
        }}>
          {/* Before */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ flex: '1 1 400px' }}
            className="glass-card"
          >
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#ff4444' }} />
              Manual Typing
            </h3>
            <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.8 }}>
              I am tying to write an email but i keepp making typos and my hands hurt from being on the keyboard all day. Let me fix that word. No, that's not right. Delete delete delete. Okay, let me start over...
            </div>
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Speed: ~40 WPM</span>
              <span>Errors: High</span>
            </div>
          </motion.div>

          {/* After */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ flex: '1 1 400px', borderColor: 'rgba(255, 69, 0, 0.5)', boxShadow: '0 0 50px rgba(255,69,0,0.25), inset 0 0 20px rgba(255,69,0,0.1)' }}
            className="glass-card"
          >
            <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textShadow: '0 0 15px rgba(255,69,0,0.6), 0 0 30px rgba(255,69,0,0.4)' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)' }} />
              WisprType Dictation
            </h3>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: '#fff', lineHeight: 1.6 }}>
              "I'm writing an email effortlessly. My hands are resting, the AI is handling the punctuation, and I can express my thoughts at the exact speed they occur to me."
            </div>
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', color: 'var(--highlight)', fontWeight: 600 }}>
              <span>Speed: ~150 WPM</span>
              <span>Errors: Near Zero</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
