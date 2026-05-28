'use client'

import React from 'react'
import { motion } from 'framer-motion'
import TiltedCard from '../effects/TiltedCard'
import { Cpu, Zap, Lock, Terminal } from 'lucide-react'

export default function BentoFeatures() {
  return (
    <section style={{ padding: '8rem 0', position: 'relative' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}
          >
            Engineering <span className="gradient-text">Marvels</span>
          </motion.h2>
          <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem' }}>
            Built from the ground up in Rust for zero latency and absolute minimal system impact.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '1.5rem',
          gridAutoRows: 'minmax(250px, auto)'
        }}>
          
          {/* Card 1: Wide */}
          <TiltedCard className="bento-span-8">
            <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Terminal size={32} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
              <h3>Global Hotkey Hook</h3>
              <p>Instantly summon WisprType from anywhere. A deeply integrated OS-level hook ensures the transcription engine is ready the millisecond you need it, overlaying your active window seamlessly.</p>
            </div>
          </TiltedCard>

          {/* Card 2: Square */}
          <TiltedCard className="bento-span-4">
            <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255,69,0,0.1), rgba(20,20,20,0.8))' }}>
              <Zap size={32} color="var(--highlight)" style={{ marginBottom: '1.5rem' }} />
              <h3>0ms Latency</h3>
              <p>Direct audio buffer streaming directly to the local model. No round trips.</p>
            </div>
          </TiltedCard>

          {/* Card 3: Square */}
          <TiltedCard className="bento-span-4">
            <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Lock size={32} color="var(--text-primary)" style={{ marginBottom: '1.5rem' }} />
              <h3>Air-Gapped Ready</h3>
              <p>Use the ggml-tiny or ggml-base models for 100% offline dictation.</p>
            </div>
          </TiltedCard>

          {/* Card 4: Wide */}
          <TiltedCard className="bento-span-8">
            <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Cpu size={32} color="var(--secondary)" style={{ marginBottom: '1.5rem' }} />
              <h3>Rust & Tauri Core</h3>
              <p>Consumes under 50MB of RAM when idle. The UI is built with React, but the heavy lifting (audio drivers, inference, keystroke injection) runs in highly optimized Rust.</p>
            </div>
          </TiltedCard>

        </div>
      </div>
      <style>{`
        .bento-span-8 { grid-column: span 8; }
        .bento-span-4 { grid-column: span 4; }
        @media (max-width: 900px) {
          .bento-span-8, .bento-span-4 { grid-column: span 12; }
        }
      `}</style>
    </section>
  )
}
