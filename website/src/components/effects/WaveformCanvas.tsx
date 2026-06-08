'use client';

import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  className?: string;
  barCount?: number;
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ className, barCount = 32 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let time = 0;
    let isVisible = true;
    let isRunning = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height };
    };

    const drawFrame = () => {
      const { width: w, height: h } = sizeRef.current;
      if (w <= 1 || h <= 1) return;

      ctx.clearRect(0, 0, w, h);

      // Highly fluid responsive time step
      time += reducedMotion.matches ? 0 : 0.04;

      // Narrower multiplier for sleek and elegant bar structure
      const barWidth = Math.max(2, (w / barCount) * 0.38);
      const gap = (w - barWidth * barCount) / (barCount + 1);

      // Organic speech activity pacing
      const speechVolume = 0.6 + 0.4 * Math.sin(time * 0.9) * Math.cos(time * 0.35);

      for (let i = 0; i < barCount; i++) {
        const x = gap + i * (barWidth + gap);
        
        // Symmetrical envelope that keeps edges beautifully active
        const envelope = Math.sin((i / (barCount - 1)) * Math.PI) * 0.82 + 0.18;

        // Multiple overlapping sine waves for high-fidelity physics
        const wave1 = Math.sin(time * 3.4 + i * 0.3) * 0.45;
        const wave2 = Math.sin(time * 1.8 - i * 0.18) * 0.35;
        const wave3 = Math.cos(time * 5.2 + i * 0.5) * 0.2;

        const amplitude = Math.abs(wave1 + wave2 + wave3) * envelope * speechVolume;
        
        // Dynamic scaled bar height
        const barHeight = Math.max(3, amplitude * h * 0.85);
        const y = (h - barHeight) / 2;

        // Layer 1: Sleek outer pink neon glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#FF2D7A';
        ctx.fillStyle = 'rgba(255, 45, 122, 0.08)';
        ctx.beginPath();
        ctx.roundRect(x - 1, y - 1, barWidth + 2, barHeight + 2, barWidth / 2);
        ctx.fill();
        ctx.restore();

        // Layer 2: Sleek mid neon blue glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#66AAFF';
        ctx.fillStyle = 'rgba(102, 170, 255, 0.18)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
        ctx.restore();

        // Layer 3: High-contrast Core gradient (white-hot center with pink top and blue bottom)
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#FF2D7A');    // Pink peak
        gradient.addColorStop(0.35, '#FFFFFF'); // White core
        gradient.addColorStop(0.65, '#FFFFFF'); // White core
        gradient.addColorStop(1, '#66AAFF');    // Blue base

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Slightly inset by 0.5px for crisp subpixel grid-alignment
        ctx.roundRect(x + 0.5, y + 0.5, barWidth - 1, barHeight - 1, (barWidth - 1) / 2);
        ctx.fill();
        ctx.restore();
      }
    };

    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      drawFrame();
    });
    resizeObserver.observe(canvas);

    const stop = () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
    };

    const start = () => {
      if (animFrameRef.current || !isRunning || reducedMotion.matches || !isVisible || document.hidden) {
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    const animate = () => {
      animFrameRef.current = 0;
      if (!isRunning || reducedMotion.matches || !isVisible || document.hidden) {
        return;
      }

      drawFrame();
      start();
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        drawFrame();
        start();
      } else {
        stop();
      }
    });

    const handleDocumentVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        drawFrame();
        start();
      }
    };

    const handleReducedMotionChange = () => {
      stop();
      drawFrame();
      start();
    };

    visibilityObserver.observe(canvas);
    document.addEventListener('visibilitychange', handleDocumentVisibility);
    reducedMotion.addEventListener('change', handleReducedMotionChange);

    drawFrame();
    start();

    return () => {
      isRunning = false;
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', handleDocumentVisibility);
      reducedMotion.removeEventListener('change', handleReducedMotionChange);
    };
  }, [barCount]);

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none',
  };

  return <canvas ref={canvasRef} className={className} style={canvasStyle} />;
};

export default WaveformCanvas;
