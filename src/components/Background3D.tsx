/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Particle3D } from '../types';

interface BackgroundProps {
  scrollIndex: number;
  scrollProgress: number; // 0 to 4 representing real-time float position
}

export function Background3D({ scrollIndex, scrollProgress }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle3D[]>([]);
  const scrollProgressRef = useRef(scrollProgress);
  const mouseRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  });

  scrollProgressRef.current = scrollProgress;

  // Initialize beautiful particles
  useEffect(() => {
    const particles: Particle3D[] = [];
    const colors = ['#00F5FF', '#FF00AA', '#39FF14', '#8B5CF6'];
    
    for (let i = 0; i < 120; i++) {
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
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const canvas = canvasRef.current;
    if (!canvas) {
      return () => window.removeEventListener('mousemove', onMouseMove);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return () => window.removeEventListener('mousemove', onMouseMove);
    }

    let animId: number;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      // Create rich cosmic backdrop with absolute dark voids (#0A0A0C to #111116)
      ctx.fillStyle = '#07070A';
      ctx.fillRect(0, 0, width, height);

      // Render subtle perspective horizontal digital laser grids
      const centerY = height * 0.55;
      const centerX = width * 0.5;
      
      // We alter grid angle and depth based on current scroll progress for cinematic traveling feel!
      // ScrollProgress has range 0 to 4
      const scrollProgress = scrollProgressRef.current;
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const gridTranslateZ = (scrollProgress * 250) % 50; 
      
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.04)';
      ctx.lineWidth = 1;

      // Draw horizontal digital perspective lines
      for (let d = 10; d < height * 0.5; d += 25) {
        // Adjust coordinate depth based on scroll progress
        const yOffset = (d + gridTranslateZ) * (d + gridTranslateZ) * 0.003;
        const lineY = centerY + yOffset;
        if (lineY < height) {
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(width, lineY);
          ctx.stroke();
        }
      }

      // Draw vertical vanishing lines
      for (let x = -width * 0.8; x <= width * 1.8; x += 100) {
        ctx.beginPath();
        ctx.moveTo(centerX + (mouseX - width/2) * 0.03, centerY);
        ctx.lineTo(x + (mouseX - width/2) * 0.15, height);
        ctx.stroke();
      }

      // Render flowing digital matrix binary text streams on edges
      ctx.fillStyle = 'rgba(0, 245, 255, 0.12)';
      ctx.font = '8px monospace';
      const matrixColumns = Math.floor(width / 120);
      for (let c = 0; c < matrixColumns; c++) {
        if (c % 4 !== 0) continue; // Sparse streams
        const xPos = c * 130 + 30;
        const speed = (c % 3 + 1) * 0.8;
        const streamY = (Date.now() * 0.05 * speed) % height;
        ctx.fillText(`0x7FA${c.toString(16).toUpperCase()}: COMPILING_PIXELS`, xPos, streamY);
        ctx.fillText(`PIXEL_ENGINE: ACTIVE`, xPos, (streamY + 120) % height);
      }

      // Render 3D Traveling particle matrix
      const particles = particlesRef.current;
      const cameraZ = -scrollProgressRef.current * 400; // Deep zoom through cameras

      particles.forEach((p) => {
        // Update physics positions
        p.z += p.vz;
        if (p.z < 1) {
          p.z = 2000; // Recycle particle back to outer depth
        }

        p.x += p.vx;
        p.y += p.vy;

        // Projection mapping calculations
        // Translate world coordinate system in relation to Camera focus + Mouse parallax
        const worldX = p.x - (mouseX - width / 2) * 0.15;
        const worldY = p.y - (mouseY - height / 2) * 0.15;
        
        // Relative depth
        const relativeZ = p.z - cameraZ;
        const scale = 300 / (relativeZ < 1 ? 1 : relativeZ);

        const projectX = centerX + worldX * scale;
        const projectY = centerY + worldY * scale;

        // Render point inside screen boundaries
        if (projectX > 0 && projectX < width && projectY > 0 && projectY < height && relativeZ > 50) {
          // Glow intensity maps closer particles to brighter colors
          const pulse = Math.sin(Date.now() * 0.003 + p.z) * 0.2 + 0.8;
          ctx.beginPath();
          ctx.arc(projectX, projectY, p.size * scale * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * pulse * Math.min(1, relativeZ / 400);
          ctx.fill();
          
          // Connect close particles with thin holographic laser threads
          particles.forEach((other) => {
            if (other === p) return;
            const distZ = Math.abs(other.z - p.z);
            if (distZ < 20) {
              const distX = Math.abs(other.x - p.x);
              const distY = Math.abs(other.y - p.y);
              const distance = Math.sqrt(distX * distX + distY * distY);
              
              if (distance < 50) {
                const otherRelZ = other.z - cameraZ;
                const otherScale = 300 / otherRelZ;
                const otherProjX = centerX + (other.x - (mouseX - width / 2) * 0.15) * otherScale;
                const otherProjY = centerY + (other.y - (mouseY - height / 2) * 0.15) * otherScale;

                ctx.beginPath();
                ctx.moveTo(projectX, projectY);
                ctx.lineTo(otherProjX, otherProjY);
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = 0.06 * (1 - distance / 50);
                ctx.stroke();
              }
            }
          });
        }
      });

      // Reset global alpha
      ctx.globalAlpha = 1.0;

      // Draw subtle retro CRT scanline raster grids overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
      for (let s = 0; s < height; s += 4) {
        ctx.fillRect(0, s, width, 1.5);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
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
