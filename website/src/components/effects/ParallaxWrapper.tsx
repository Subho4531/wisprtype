'use client'
import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface ParallaxWrapperProps {
  children: React.ReactNode
  offset?: number
  className?: string
  zIndex?: number
  style?: React.CSSProperties
}

export default function ParallaxWrapper({ children, offset = 50, className = '', zIndex = 0, style = {} }: ParallaxWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  // When offset is positive, element moves up slower than scroll
  // When offset is negative, element moves up faster than scroll
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset])

  return (
    <motion.div
      ref={ref}
      style={{ y, zIndex, ...style }}
      className={`parallax-layer ${className}`}
    >
      {children}
    </motion.div>
  )
}
