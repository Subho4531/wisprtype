'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle2 } from 'lucide-react'

export default function FeedbackSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setStatus('submitting')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      if (res.ok) {
        setStatus('success')
        setName('')
        setEmail('')
        setMessage('')
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch (err) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <section style={{ padding: '6rem 0', background: 'rgba(20,20,20,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>We'd Love Your <span className="gradient-text">Feedback</span></h2>
          <p style={{ color: 'var(--text-secondary)' }}>Help us improve WisprType. Let us know what features you want or any issues you've faced.</p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit} 
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#111', padding: '2.5rem', borderRadius: '16px', border: '1px solid #222' }}
        >
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', outline: 'none' }}
                placeholder="John Doe"
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', outline: 'none' }}
                placeholder="john@example.com"
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>Message *</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', minHeight: '120px', resize: 'vertical', outline: 'none' }}
              placeholder="I really love the app! Would be great to have..."
            />
          </div>

          <button 
            type="submit" 
            disabled={status === 'submitting' || status === 'success'}
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: status === 'submitting' ? 0.7 : 1 }}
          >
            {status === 'submitting' ? 'Sending...' : status === 'success' ? <><CheckCircle2 size={18} /> Sent!</> : <><Send size={18} /> Send Feedback</>}
          </button>
          
          {status === 'error' && (
            <p style={{ color: '#ff4444', textAlign: 'center', margin: 0, fontSize: '0.9rem' }}>Failed to send feedback. Please try again.</p>
          )}
        </motion.form>
      </div>
    </section>
  )
}
