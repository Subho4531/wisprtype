'use client'

import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface TiltedCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function TiltedCard({ children, className = '', style = {} }: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth out the mouse values
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })

  // Map mouse position to rotation (-5 to 5 degrees)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['5deg', '-5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-5deg', '5deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    // Normalized coordinates from -0.5 to 0.5
    const mouseX = (e.clientX - rect.left) / width - 0.5
    const mouseY = (e.clientY - rect.top) / height - 0.5
    
    x.set(mouseX)
    y.set(mouseY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        ...style
      }}
      className={className}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
