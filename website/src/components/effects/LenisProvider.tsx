'use client'

import { ReactLenis } from 'lenis/react'
import LanguageParallax from './LanguageParallax'

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true }}>
      <LanguageParallax />
      {children as any}
    </ReactLenis>
  )
}

