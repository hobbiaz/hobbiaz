"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#e76262", "#4A81EF", "#F06328", "#FCBC05", "#3DA950", "#DF4843", "#a78bfa"];
const DURATION_MS = 4000;

/** Canvas confetti shown on the onboarding success step. Runs for 4s while `active`. */
export function Confetti({ active, sizeFrom }: { active: boolean; sizeFrom: () => HTMLElement | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) return;
    const host = sizeFrom();
    canvas.width = host?.offsetWidth ?? 400;
    canvas.height = host?.offsetHeight ?? 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      r: 4 + Math.random() * 5,
      d: 2 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * 12 - 6,
      tiltIncr: 0.1 + Math.random() * 0.2,
      tiltAngle: 0,
    }));

    let running = true;
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!running) return;
      for (const p of particles) {
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 5);
        ctx.stroke();
        p.tiltAngle += p.tiltIncr;
        p.y += p.d;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    const start = setTimeout(draw, 200);
    const stop = setTimeout(() => { running = false; }, DURATION_MS + 200);
    return () => {
      running = false;
      clearTimeout(start);
      clearTimeout(stop);
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, sizeFrom]);

  return <canvas ref={canvasRef} id="auth-confetti-canvas" className="auth-confetti-canvas" />;
}
