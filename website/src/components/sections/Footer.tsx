'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const productLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Download', href: '#download' },
  { label: 'Changelog', href: '#' },
]

const legalLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
]

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        style={{
          color: '#A0A0A0',
          fontSize: '0.9rem',
          textDecoration: 'none',
          transition: 'color 0.2s ease',
        }}
        onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
        onMouseOut={(e) => (e.currentTarget.style.color = '#A0A0A0')}
      >
        {label}
      </Link>
    </li>
  )
}

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(10,10,10,0.8)',
        padding: '5rem 0 2rem 0',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
        }}
      >
        {/* 3-Column Layout */}
        <div
          style={{
            display: 'flex',
            gap: '4rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Col 1: Branding */}
          <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Image
                src="/icons/wisperflow.png"
                alt="WisprType Logo"
                width={32}
                height={32}
                style={{ borderRadius: '6px' }}
              />
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.25rem',
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
            </div>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#A0A0A0',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              The ultimate voice typing experience for Windows.
            </p>
          </div>

          {/* Col 2: Product */}
          <div style={{ flex: '0 0 auto' }}>
            <h4
              style={{
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                fontFamily: 'Outfit, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Product
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
              }}
            >
              {productLinks.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div style={{ flex: '0 0 auto' }}>
            <h4
              style={{
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                fontFamily: 'Outfit, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Legal
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
              }}
            >
              {legalLinks.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '2rem',
            marginTop: '3rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: '#A0A0A0', margin: 0 }}>
            © 2026 WisprType. All rights reserved.
          </p>
          <p style={{ fontSize: '0.8rem', color: '#A0A0A0', margin: 0 }}>
            Made with ❤️ and Rust
          </p>
        </div>
      </div>
    </footer>
  )
}
