/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Particle3D } from '../types';
import { getLastMinigameClientX, getLastMinigameClientY } from '../utils/headerMinigameInput';

interface BackgroundProps {
  scrollIndex: number;
  scrollProgress: number;
}

const PARTICLE_COUNT = 48;

export function Background3D({ scrollIndex, scrollProgress }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle3D[]>([]);
  const scrollProgressRef = useRef(scrollProgress);
  const scrollIndexRef = useRef(scrollIndex);

  scrollProgressRef.current = scrollProgress;
  scrollIndexRef.current = scrollIndex;

  useEffect(() => {
    const particles: Particle3D[] = [];
    const colors = ['#00F5FF', '#FF00AA', '#39FF14', '#8B5CF6'];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 1200,
        z: Math.random() * 2000,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: -Math.random() * 1.5 - 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.4,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let lastFrame = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = (ts: number) => {
      animId = requestAnimationFrame(render);

      if (document.hidden) return;
      if (ts - lastFrame < 32) return;
      lastFrame = ts;

      const mouseX = getLastMinigameClientX() ?? width / 2;
      const mouseY = getLastMinigameClientY() ?? height / 2;
      const scrollProgress = scrollProgressRef.current;

      ctx.fillStyle = '#07070A';
      ctx.fillRect(0, 0, width, height);

      const centerY = height * 0.55;
      const centerX = width * 0.5;
      const gridTranslateZ = (scrollProgress * 250) % 50;

      ctx.strokeStyle = 'rgba(0, 245, 255, 0.04)';
      ctx.lineWidth = 1;

      for (let d = 10; d < height * 0.5; d += 32) {
        const yOffset = (d + gridTranslateZ) * (d + gridTranslateZ) * 0.003;
        const lineY = centerY + yOffset;
        if (lineY < height) {
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(width, lineY);
          ctx.stroke();
        }
      }

      for (let x = -width * 0.8; x <= width * 1.8; x += 120) {
        ctx.beginPath();
        ctx.moveTo(centerX + (mouseX - width / 2) * 0.03, centerY);
        ctx.lineTo(x + (mouseX - width / 2) * 0.15, height);
        ctx.stroke();
      }

      const particles = particlesRef.current;
      const cameraZ = -scrollProgressRef.current * 400;

      for (const p of particles) {
        p.z += p.vz;
        if (p.z < 1) p.z = 2000;
        p.x += p.vx;
        p.y += p.vy;

        const worldX = p.x - (mouseX - width / 2) * 0.15;
        const worldY = p.y - (mouseY - height / 2) * 0.15;
        const relativeZ = p.z - cameraZ;
        if (relativeZ < 50) continue;

        const scale = 300 / relativeZ;
        const projectX = centerX + worldX * scale;
        const projectY = centerY + worldY * scale;

        if (
          projectX <= 0 ||
          projectX >= width ||
          projectY <= 0 ||
          projectY >= height
        ) {
          continue;
        }

        ctx.beginPath();
        ctx.arc(projectX, projectY, p.size * scale * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * Math.min(1, relativeZ / 400);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      id="cosmic-canvas"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
