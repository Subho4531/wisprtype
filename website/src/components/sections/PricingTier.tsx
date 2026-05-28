'use client'

import React from 'react'
import { motion } from 'framer-motion'
import StarBorder from '../effects/StarBorder'
import { CheckCircle2 } from 'lucide-react'

export default function PricingTier() {
  return (
    <section id="pricing" style={{ padding: '8rem 0', position: 'relative' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </motion.h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* Free For Always Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ width: '100%', maxWidth: '500px' }}
          >
            <StarBorder color="#FF4500">
              <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(255,69,0,0.1)', color: 'var(--primary)', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>FREE FOR ALWAYS</div>
                <h3 style={{ fontSize: '2.2rem' }}>Community Edition</h3>
                <div style={{ fontSize: '4rem', fontWeight: 800, margin: '1rem 0', color: '#fff' }}>$0<span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/forever</span></div>
                <p style={{ marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>100% free and open-source. No hidden fees.</p>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', width: '100%' }}>
                  {['Unlimited offline transcription', 'Local Whisper models (ggml)', 'Global hotkey hook', 'Basic formatting', 'Continuous Updates'].map((feature, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <CheckCircle2 size={20} color="var(--primary)" />
                      <span style={{ fontSize: '1.1rem' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div style={{ marginTop: 'auto', width: '100%' }}>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>Download Now</button>
                </div>
              </div>
            </StarBorder>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

