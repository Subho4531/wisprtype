'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Mic, Cpu, Type } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Mic,
    title: 'Speak',
    description: 'Press your hotkey and talk naturally. WisprType listens.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Process',
    description: 'Whisper AI transcribes locally. Cloud AI formats and refines.',
  },
  {
    number: '03',
    icon: Type,
    title: 'Type',
    description: 'Polished text appears instantly in any application.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: '8rem 0',
        background: '#121212',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
        }}
      >
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            textAlign: 'center',
            fontSize: '3rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '1rem',
            letterSpacing: '-1px',
          }}
        >
          How It Works
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          style={{
            textAlign: 'center',
            fontSize: '1.1rem',
            color: '#A0A0A0',
            marginBottom: '4rem',
            maxWidth: '600px',
            margin: '0 auto 4rem auto',
          }}
        >
          Three simple steps to transform your voice into polished text.
        </motion.p>

        {/* Steps Row */}
        <div className="hiw-steps-row" style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
                style={{
                  position: 'relative',
                  background: 'rgba(20,20,20,0.6)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  flex: '1 1 0',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Step Number */}
                <span
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1.5rem',
                    fontSize: '4rem',
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.05)',
                    lineHeight: 1,
                    fontFamily: 'Outfit, sans-serif',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                >
                  {step.number}
                </span>

                {/* Animated AI Layer Background for Process Step */}
                {index === 1 && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '200%',
                      height: '200%',
                      background: 'radial-gradient(circle at center, rgba(255,69,0,0.1) 0%, transparent 50%)',
                      transform: 'translate(-50%, -50%)',
                      animation: 'pulseCore 3s ease-in-out infinite alternate'
                    }} />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,140,0,0.1) 25%, transparent 50%)',
                      }}
                    />
                  </div>
                )}

                {/* Icon */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: index === 1 ? 'linear-gradient(135deg, rgba(255,69,0,0.3), rgba(255,215,0,0.2))' : 'linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,140,0,0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: index === 1 ? '0 0 20px rgba(255,69,0,0.3)' : 'none',
                    animation: index === 1 ? 'float 3s ease-in-out infinite' : 'none',
                  }}
                >
                  <step.icon size={28} color={index === 1 ? '#FFD700' : '#FF4500'} strokeWidth={index === 1 ? 2.5 : 2} />
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '0.75rem',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: '#A0A0A0',
                    lineHeight: 1.6,
                    margin: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {step.description}
                </p>
              </motion.div>

              {/* Connecting Line — only between cards, desktop only */}
              {index < steps.length - 1 && (
                <div
                  className="hiw-connector"
                  style={{
                    height: '2px',
                    flexGrow: 1,
                    minWidth: '2rem',
                    maxWidth: '4rem',
                    background: 'rgba(255, 69, 0, 0.1)',
                    borderRadius: '1px',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: 'linear',
                      delay: index * 0.5,
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, #FF4500, #FFD700, transparent)',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hiw-steps-row {
            flex-direction: column !important;
            gap: 1.5rem !important;
          }
          .hiw-connector {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
