'use client'

import { useCallback, useRef, useEffect } from 'react'

export function useSoundEffects() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Only initialize AudioContext on user interaction to comply with browser policies
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
    }
    
    document.addEventListener('click', initAudio, { once: true })
    return () => {
      document.removeEventListener('click', initAudio)
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
      }
    }
  }, [])

  const playHoverSound = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    
    // Create a very short, high-frequency "tick"
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05)
    
    gainNode.gain.setValueAtTime(0.02, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }, [])

  const playClickSound = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    
    // Create a satisfying "pop" sound
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  }, [])

  const playTypeSound = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    
    // Mechanical keyboard click (mix of low thud and high sharp click)
    const time = ctx.currentTime

    // Low switch bottoming out thud
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'square'
    osc1.frequency.setValueAtTime(250 + Math.random() * 50, time)
    osc1.frequency.exponentialRampToValueAtTime(40, time + 0.05)
    gain1.gain.setValueAtTime(0.05, time)
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    // High pitch sharp click (keycap plastic sound)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2500
    osc2.type = 'sawtooth'
    osc2.frequency.setValueAtTime(2500 + Math.random() * 500, time)
    osc2.frequency.exponentialRampToValueAtTime(500, time + 0.02)
    gain2.gain.setValueAtTime(0.04, time)
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.02)
    osc2.connect(filter)
    filter.connect(gain2)
    gain2.connect(ctx.destination)
    
    osc1.start(time)
    osc1.stop(time + 0.05)
    osc2.start(time)
    osc2.stop(time + 0.02)
  }, [])

  return { playHoverSound, playClickSound, playTypeSound }
}
