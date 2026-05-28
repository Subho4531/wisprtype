'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSoundEffects } from '../../hooks/useSoundEffects'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Download', href: '#download' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { playHoverSound, playClickSound } = useSoundEffects()

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          height: '64px',
          width: '90%',
          maxWidth: '1000px',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(18,18,18,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '999px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo + Wordmark */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <Image src="/icons/wisperflow.png" alt="WisprType Logo" width={36} height={36} style={{ borderRadius: '8px' }} />
            <span
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.4rem',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: '#FFFFFF',
              }}
            >
              Wispr
              <span
                style={{
                  background: 'linear-gradient(135deg, #FF4500, #FF8C00, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Type
              </span>
            </span>
          </Link>

          {/* Center Nav Links — Desktop */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
            }}
            className="header-desktop-nav"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  color: '#A0A0A0',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onClick={playClickSound}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF'
                  playHoverSound()
                }}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTA — Desktop */}
          <div className="header-desktop-cta" style={{ display: 'flex', alignItems: 'center' }}>
            <Link
              href="#download"
              style={{
                background: 'linear-gradient(135deg, #FF4500, #FF8C00)',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '0.6rem 1.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={playClickSound}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,69,0,0.4)'
                playHoverSound()
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Download for Windows
            </Link>
          </div>

          {/* Hamburger — Mobile */}
          <button
            className="header-mobile-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: '5px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <span style={{ width: '24px', height: '2px', background: '#FFFFFF', borderRadius: '2px', transition: 'transform 0.3s ease', transform: mobileOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <span style={{ width: '24px', height: '2px', background: '#FFFFFF', borderRadius: '2px', transition: 'opacity 0.3s ease', opacity: mobileOpen ? 0 : 1 }} />
            <span style={{ width: '24px', height: '2px', background: '#FFFFFF', borderRadius: '2px', transition: 'transform 0.3s ease', transform: mobileOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Panel */}
      <div
        className="header-mobile-panel"
        style={{
          position: 'fixed',
          top: '90px',
          left: '5%',
          right: '5%',
          zIndex: 99,
          background: 'rgba(18,18,18,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: mobileOpen ? '2rem' : '0 2rem',
          maxHeight: mobileOpen ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, padding 0.4s ease',
          display: 'none',
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                color: '#A0A0A0',
                fontSize: '1.1rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#A0A0A0')}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#download"
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'linear-gradient(135deg, #FF4500, #FF8C00)',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              textAlign: 'center',
              marginTop: '0.5rem',
            }}
          >
            Download for Windows
          </Link>
        </nav>
      </div>

      {/* Responsive styles via style tag */}
      <style>{`
        @media (min-width: 769px) {
          .header-mobile-hamburger { display: none !important; }
          .header-mobile-panel { display: none !important; }
          .header-desktop-nav { display: flex !important; }
          .header-desktop-cta { display: flex !important; }
        }
        @media (max-width: 768px) {
          .header-mobile-hamburger { display: flex !important; }
          .header-mobile-panel { display: block !important; }
          .header-desktop-nav { display: none !important; }
          .header-desktop-cta { display: none !important; }
        }
      `}</style>
    </>
  )
}
