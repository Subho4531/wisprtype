'use client';

import React, { useState, useCallback } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, hover = true }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (hover) setIsHovered(true);
  }, [hover]);

  const handleMouseLeave = useCallback(() => {
    if (hover) setIsHovered(false);
  }, [hover]);

  const cardStyle: React.CSSProperties = {
    background: 'rgba(20, 20, 20, 0.6)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${isHovered ? 'rgba(255, 69, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '24px',
    padding: '2rem',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered
      ? '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 69, 0, 0.08)'
      : '0 4px 20px rgba(0, 0, 0, 0.2)',
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default GlassCard;
