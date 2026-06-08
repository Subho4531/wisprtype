'use client'

import React, { useEffect, useState } from 'react'
import { ReactLenis } from 'lenis/react'
import LanguageParallax from './LanguageParallax'

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const [enableSmoothScroll, setEnableSmoothScroll] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarsePointer = window.matchMedia('(pointer: coarse)')

    const updateSmoothScroll = () => {
      setEnableSmoothScroll(!reducedMotion.matches && !coarsePointer.matches)
    }

    updateSmoothScroll()
    reducedMotion.addEventListener('change', updateSmoothScroll)
    coarsePointer.addEventListener('change', updateSmoothScroll)

    return () => {
      reducedMotion.removeEventListener('change', updateSmoothScroll)
      coarsePointer.removeEventListener('change', updateSmoothScroll)
    }
  }, [])

  return (
    <>
      <LanguageParallax />
      {enableSmoothScroll ? (
        <ReactLenis
          root
          options={{
            lerp: 0.16,
            duration: 0.8,
            smoothWheel: true,
            syncTouch: false,
            wheelMultiplier: 1.08,
          }}
        >
          {children}
        </ReactLenis>
      ) : (
        children
      )}
    </>
  )
}
