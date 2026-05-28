'use client'

import React from 'react'

interface StarBorderProps {
  children: React.ReactNode
  className?: string
  color?: string
}

export default function StarBorder({ children, className = '', color = '#FF8C00' }: StarBorderProps) {
  return (
    <div className={`star-border-wrapper ${className}`} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', padding: '1px' }}>
      <div 
        className="star-border-animated" 
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `conic-gradient(from 0deg, transparent 70%, ${color} 100%)`,
          animation: 'spin-slow 4s linear infinite',
          zIndex: 0
        }} 
      />
      <div 
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '23px',
          height: '100%',
          width: '100%'
        }}
      >
        {children}
      </div>
    </div>
  )
}
