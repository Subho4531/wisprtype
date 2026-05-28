'use client'

import React from 'react'
import { motion } from 'framer-motion'
import ParallaxWrapper from '../effects/ParallaxWrapper'

const reviews = [
  { name: 'Alex M.', role: 'Software Engineer', text: '"I can literally dictate code structure while pacing around my room. The local Whisper model is insanely accurate."' },
  { name: 'Sarah T.', role: 'Content Writer', text: '"WisprType completely changed my workflow. No more wrist pain from typing all day. It just works, instantly."' },
  { name: 'David K.', role: 'Project Manager', text: '"The fact that it runs 100% offline means I can use it for confidential company emails without any privacy concerns."' },
  { name: 'Elena V.', role: 'Translator', text: '"Switching between English and Spanish on the fly without changing settings is pure magic. Highly recommend."' },
]

export default function Testimonials() {
  return (
    <section style={{ padding: '8rem 0', position: 'relative', overflow: 'hidden' }}>
      <ParallaxWrapper offset={-80} zIndex={-1}>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,215,0,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </ParallaxWrapper>

      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Wall of <span className="gradient-text">Love</span>
        </motion.h2>
      </div>

      {/* Marquee Container */}
      <div style={{ position: 'relative', display: 'flex', overflow: 'hidden', userSelect: 'none', gap: '2rem' }}>
        {/* Left/Right Fade Gradients */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '150px', background: 'linear-gradient(to right, var(--bg), transparent)', zIndex: 10 }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '150px', background: 'linear-gradient(to left, var(--bg), transparent)', zIndex: 10 }} />
        
        {/* Scrolling Content (Duplicated for infinite scroll) */}
        {[1, 2].map((i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '2rem',
            animation: 'marquee 40s linear infinite',
            minWidth: 'max-content'
          }}>
            {reviews.map((review, j) => (
              <div key={j} className="glass-card" style={{ width: '400px', flexShrink: 0 }}>
                <p style={{ fontSize: '1.1rem', color: '#fff', fontStyle: 'italic', marginBottom: '2rem' }}>
                  {review.text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{review.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
