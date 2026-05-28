'use client';

import React, { useRef, useState, useCallback } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePos(null);
  }, []);

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    background: 'rgba(20, 20, 20, 0.6)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${isHovered ? 'rgba(255, 69, 0, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '24px',
    padding: '2.5rem',
    transition: 'border-color 0.3s ease',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: mousePos ? 1 : 0,
    transition: 'opacity 0.3s ease',
    background: mousePos
      ? `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 69, 0, 0.1), transparent 40%)`
      : 'none',
    borderRadius: '24px',
  };

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
  };

  return (
    <div
      ref={cardRef}
      className={className}
      style={cardStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={overlayStyle} />
      <div style={contentStyle}>{children}</div>
    </div>
  );
};

export default SpotlightCard;
