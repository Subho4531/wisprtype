'use client';

import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  className?: string;
  barCount?: number;
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ className, barCount = 32 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      time += 0.02;

      const barWidth = Math.max(2, (w / barCount) * 0.5);
      const gap = (w - barWidth * barCount) / (barCount + 1);

      for (let i = 0; i < barCount; i++) {
        const x = gap + i * (barWidth + gap);
        const centerX = barCount / 2;
        const distFromCenter = Math.abs(i - centerX) / centerX;

        // Multiple sine frequencies for organic movement
        const wave1 = Math.sin(time * 2.5 + i * 0.3) * 0.4;
        const wave2 = Math.sin(time * 1.8 + i * 0.5) * 0.3;
        const wave3 = Math.cos(time * 3.2 + i * 0.2) * 0.2;
        const envelope = 1 - distFromCenter * 0.6;

        const amplitude = Math.abs(wave1 + wave2 + wave3) * envelope;
        const barHeight = Math.max(4, amplitude * h * 0.7);

        const y = (h - barHeight) / 2;

        // Layer 1: Outer glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.roundRect(x - 2, y - 2, barWidth + 4, barHeight + 4, barWidth);
        ctx.fill();
        ctx.restore();

        // Layer 2: Mid glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#66AAFF';
        ctx.fillStyle = 'rgba(102, 170, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
        ctx.restore();

        // Layer 3: Core (white-hot center)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.3, '#FFFFFF');
        gradient.addColorStop(0.7, '#FFFFFF');
        gradient.addColorStop(1, '#66AAFF');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, barWidth - 2, barHeight - 2, barWidth / 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
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
