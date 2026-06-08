'use client'

import React from 'react'

const characters = [
  { char: 'A', lang: 'English' },
  { char: 'あ', lang: 'Japanese' },
  { char: 'अ', lang: 'Hindi' },
  { char: '字', lang: 'Chinese' },
  { char: 'Ω', lang: 'Greek' },
  { char: 'ش', lang: 'Arabic' },
  { char: 'Ж', lang: 'Russian' },
  { char: '한', lang: 'Korean' },
  { char: 'É', lang: 'French' },
  { char: 'ß', lang: 'German' },
  { char: 'ç', lang: 'Portuguese' },
  { char: 'ñ', lang: 'Spanish' },
]

export default function LanguageParallax() {
  return (
    <div
      aria-hidden="true"
      className="lang-parallax-field"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {characters.map((item, index) => {
        const left = `${(index * 13) % 90 + 5}%`
        const top = `${(index * 27) % 90 + 5}%`
        const size = `${(index % 3) * 2 + 3}rem`
        const opacity = (index % 5 + 1) * 0.04
        const rotation = `${(index % 2 === 0 ? 1 : -1) * (index * 5)}deg`

        return (
          <div
            key={item.lang}
            className="lang-parallax-char"
            style={{
              position: 'absolute',
              left,
              top,
              fontSize: size,
              opacity,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              transform: `rotate(${rotation}) translateZ(0)`,
              userSelect: 'none',
            }}
          >
            {item.char}
          </div>
        )
      })}
      <style>{`
        @media (max-width: 900px), (prefers-reduced-motion: reduce) {
          .lang-parallax-field {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
