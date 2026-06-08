'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Download, ExternalLink } from 'lucide-react'
import { WINDOWS_DOWNLOAD_PATH, type LatestRelease } from '@/lib/githubRelease'

type DownloadCTAProps = {
  release: LatestRelease | null
}

function formatPublishedDate(value: string) {
  if (!value) {
    return 'Latest build'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Latest build'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default function DownloadCTA({ release }: DownloadCTAProps) {
  const downloadLabel = release ? 'Download Latest for Windows' : 'Download for Windows'
  const releaseDetails = release
    ? `${release.version} · ${release.assetSize} · Published ${formatPublishedDate(release.publishedAt)}`
    : 'The latest Windows build will be served here as soon as it is published.'

  return (
    <section
      id="download"
      style={{
        padding: '10rem 0',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(255,69,0,0.12) 0%, transparent 70%)',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 2rem',
        }}
      >
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '1.5rem',
            fontFamily: '"Bitcount Grid Single", var(--font-heading), sans-serif',
            letterSpacing: '-1.5px',
            lineHeight: 1.15,
          }}
        >
          Ready to Type at the <br/> {' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #FF4500, #FFD700)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Speed of Thought
          </span>
          ?
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          style={{
            fontSize: '1.2rem',
            color: '#A0A0A0',
            marginBottom: '3rem',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto 3rem auto',
          }}
        >
          Download the free installer and transform how you work on Windows.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        >
          <a
            href={WINDOWS_DOWNLOAD_PATH}
            aria-label={downloadLabel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'linear-gradient(135deg, #FF4500, #FF8C00)',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '1.25rem 3rem',
              fontSize: '1.2rem',
              fontWeight: 700,
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 40px rgba(255,69,0,0.4)',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)'
              e.currentTarget.style.boxShadow = '0 14px 50px rgba(255,69,0,0.55)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,69,0,0.4)'
            }}
          >
            <Download size={22} strokeWidth={2.5} />
            {downloadLabel}
          </a>
        </motion.div>

        {release ? (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            style={{
              fontSize: '0.9rem',
              color: '#D6D6D6',
              marginTop: '1.25rem',
              wordBreak: 'break-word',
            }}
          >
            {release.assetName}
            {' · '}
            <a
              href={release.releaseUrl}
              style={{
                color: '#FF8C00',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                textDecoration: 'none',
              }}
            >
              Release notes
              <ExternalLink size={14} strokeWidth={2.25} />
            </a>
          </motion.p>
        ) : null}

        {/* System Requirements */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          style={{
            fontSize: '0.85rem',
            color: '#A0A0A0',
            marginTop: '2rem',
          }}
        >
          Windows 10 (20H2) or Windows 11 · 200MB · Microphone required
        </motion.p>

        {/* Version Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
          style={{
            display: 'inline-block',
            marginTop: '1rem',
          }}
        >
          <span
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '9999px',
              padding: '0.4rem 1.2rem',
              fontSize: '0.8rem',
              color: '#A0A0A0',
              fontWeight: 500,
            }}
          >
            {releaseDetails}
          </span>
        </motion.div>
      </div>
    </section>
  )
}
