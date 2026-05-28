'use client';

import React, { useId } from 'react';

interface GlowButtonProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  size?: 'default' | 'large';
  onClick?: () => void;
}

const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  href,
  className,
  size = 'default',
  onClick,
}) => {
  const id = useId();
  const animationName = `glowPulse_${id.replace(/:/g, '_')}`;

  const keyframes = `
    @keyframes ${animationName} {
      0%, 100% {
        box-shadow: 0 0 20px rgba(255, 69, 0, 0.3), 0 0 40px rgba(255, 69, 0, 0.1);
      }
      50% {
        box-shadow: 0 0 30px rgba(255, 69, 0, 0.6), 0 0 60px rgba(255, 69, 0, 0.2);
      }
    }
  `;

  const isLarge = size === 'large';

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: isLarge ? '1rem 2.5rem' : '0.75rem 1.75rem',
    fontSize: isLarge ? '1.125rem' : '0.9375rem',
    fontWeight: 700,
    fontFamily: "'Outfit', sans-serif",
    color: '#FFFFFF',
    background: 'linear-gradient(135deg, #FF4500, #FF8C00)',
    border: 'none',
    borderRadius: '9999px',
    cursor: 'pointer',
    textDecoration: 'none',
    animationName,
    animationDuration: '2.5s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    letterSpacing: '0.01em',
    lineHeight: 1.2,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'scale(1.03)';
    el.style.boxShadow = '0 0 40px rgba(255, 69, 0, 0.6), 0 0 80px rgba(255, 69, 0, 0.3)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'scale(1)';
    el.style.boxShadow = '';
  };

  const commonProps = {
    className,
    style: buttonStyle,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return (
    <>
      <style>{keyframes}</style>
      {href ? (
        <a href={href} {...commonProps}>
          {children}
        </a>
      ) : (
        <button onClick={onClick} {...commonProps}>
          {children}
        </button>
      )}
    </>
  );
};

export default GlowButton;
