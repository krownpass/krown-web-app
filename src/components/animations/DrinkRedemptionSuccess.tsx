'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrinkRedemptionSuccessProps {
  show: boolean;
  onComplete?: () => void;
  /** Duration in ms before auto-dismissing. Default 3600 */
  duration?: number;
}

/* ────────────────────────────────────────────
   Wine Glass SVG — elegant stemmed glass
   ──────────────────────────────────────────── */
function WineGlassIcon({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* Bowl */}
      <path
        d="M16 12C16 12 14 52 20 66C26 80 34 84 40 86C46 84 54 80 60 66C66 52 64 12 64 12Z"
        fill="currentColor"
        opacity={0.15}
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {/* Wine liquid */}
      <path
        d="M20 40C20 40 19 58 24 68C29 76 34 80 40 82C46 80 51 76 56 68C61 58 60 40 60 40Z"
        fill="currentColor"
        opacity={0.6}
      />
      {/* Rim highlight */}
      <ellipse cx="40" cy="12" rx="24" ry="4" fill="currentColor" opacity={0.25} />
      {/* Stem */}
      <rect x="37" y="86" width="6" height="32" rx="3" fill="currentColor" opacity={0.5} />
      {/* Base */}
      <ellipse cx="40" cy="124" rx="18" ry="5" fill="currentColor" opacity={0.35} />
    </svg>
  );
}

/* ── Liquid splash droplet ── */
function SplashDrop({
  delay,
  x,
  y,
  size,
  angle,
}: {
  delay: number;
  x: number;
  y: number;
  size: number;
  angle: number;
}) {
  const rad = (angle * Math.PI) / 180;
  const dist = 30 + Math.random() * 50;
  const targetX = x + Math.cos(rad) * dist;
  const targetY = y + Math.sin(rad) * dist + 20; // gravity pull

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle, #C11E38 0%, #800020 100%)',
        left: '50%',
        top: '50%',
        boxShadow: '0 0 6px rgba(193, 30, 56, 0.5)',
      }}
      initial={{ opacity: 0, x, y, scale: 0 }}
      animate={{
        opacity: [0, 0.9, 0.7, 0],
        scale: [0, 1.2, 0.8, 0.3],
        x: [x, targetX],
        y: [y, targetY],
      }}
      transition={{
        duration: 0.9,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

/* ── Sparkle particle ── */
function Sparkle({
  delay,
  x,
  y,
  size,
}: {
  delay: number;
  x: number;
  y: number;
  size: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{ width: size, height: size }}
      initial={{ opacity: 0, x, y, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        y: y - 30 - Math.random() * 40,
        x: x + (Math.random() - 0.5) * 80,
      }}
      transition={{ duration: 1.0, delay, ease: 'easeOut' }}
    />
  );
}

/* ── Ring ripple from the clink point ── */
function ClinkRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full border-2 border-[#C11E38]/40"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '42%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: [0, 0.6, 0], scale: [0.2, 1.8, 2.4] }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
    />
  );
}

/* ── Main component ── */
export function DrinkRedemptionSuccess({
  show,
  onComplete,
  duration = 3600,
}: DrinkRedemptionSuccessProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  // Liquid splash droplets — burst outward from clink point
  const splashDrops = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: 0.7 + Math.random() * 0.15,
    x: (Math.random() - 0.5) * 20,
    y: -20 + Math.random() * 10,
    size: 4 + Math.random() * 6,
    angle: -150 + (i / 11) * 300, // fan out
  }));

  // White sparkles — from impact
  const sparkles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    delay: 0.72 + Math.random() * 0.4,
    x: (Math.random() - 0.5) * 120,
    y: (Math.random() - 0.5) * 60 - 20,
    size: 2 + Math.random() * 3,
  }));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="drink-redemption-success"
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* ── Dark vignette backdrop ── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.94) 100%)',
            }}
          />

          {/* ── Deep red ambient glow ── */}
          <motion.div
            className="absolute w-80 h-80 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(193,30,56,0.25) 0%, rgba(128,0,32,0.10) 45%, transparent 70%)',
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1.3 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.9, delay: 0.1 }}
          />

          {/* ── Centre stage ── */}
          <div className="relative flex flex-col items-center">
            {/* Clink rings — ripple from impact point */}
            <ClinkRing delay={0.72} size={80} />
            <ClinkRing delay={0.88} size={120} />
            <ClinkRing delay={1.04} size={160} />

            {/* Liquid splash droplets */}
            {splashDrops.map((d) => (
              <SplashDrop
                key={`splash-${d.id}`}
                delay={d.delay}
                x={d.x}
                y={d.y}
                size={d.size}
                angle={d.angle}
              />
            ))}

            {/* White sparkles */}
            {sparkles.map((s) => (
              <Sparkle
                key={`sparkle-${s.id}`}
                delay={s.delay}
                x={s.x}
                y={s.y}
                size={s.size}
              />
            ))}

            {/* ── WINE GLASSES ── */}
            <div className="relative w-72 h-44 flex items-center justify-center">
              {/* Left glass — slides in from left, tilts inward, then clinks */}
              <motion.div
                className="absolute text-[#C11E38] w-24 h-36"
                style={{ originX: 0.5, originY: 1 }}
                initial={{ opacity: 0, x: -160, rotate: -25 }}
                animate={{
                  opacity: 1,
                  x: 10,
                  rotate: [null, -25, 12, 8],
                }}
                exit={{ opacity: 0, x: -80 }}
                transition={{
                  x: {
                    type: 'spring',
                    stiffness: 160,
                    damping: 16,
                    delay: 0.2,
                  },
                  rotate: {
                    times: [0, 0.4, 0.7, 1],
                    duration: 1.2,
                    delay: 0.2,
                    ease: 'easeInOut',
                  },
                  opacity: { duration: 0.3, delay: 0.15 },
                }}
              >
                <WineGlassIcon className="w-full h-full drop-shadow-[0_0_20px_rgba(193,30,56,0.5)]" />
              </motion.div>

              {/* Right glass — slides in from right, tilts inward, then clinks */}
              <motion.div
                className="absolute text-[#C11E38] w-24 h-36"
                style={{ originX: 0.5, originY: 1 }}
                initial={{ opacity: 0, x: 160, rotate: 25 }}
                animate={{
                  opacity: 1,
                  x: -10,
                  rotate: [null, 25, -12, -8],
                }}
                exit={{ opacity: 0, x: 80 }}
                transition={{
                  x: {
                    type: 'spring',
                    stiffness: 160,
                    damping: 16,
                    delay: 0.25,
                  },
                  rotate: {
                    times: [0, 0.4, 0.7, 1],
                    duration: 1.2,
                    delay: 0.25,
                    ease: 'easeInOut',
                  },
                  opacity: { duration: 0.3, delay: 0.2 },
                }}
              >
                <WineGlassIcon
                  className="w-full h-full drop-shadow-[0_0_20px_rgba(193,30,56,0.5)]"
                  flip
                />
              </motion.div>

              {/* Clink flash — bright white+red burst at impact point */}
              <motion.div
                className="absolute"
                style={{
                  left: '50%',
                  top: '28%',
                  marginLeft: -20,
                  marginTop: -20,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(193,30,56,0.6) 40%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 2.2, 0.5],
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.7,
                  ease: 'easeOut',
                }}
              />
            </div>

            {/* ── Liquid drip trail — two streams falling from clink point ── */}
            {[
              { xStart: -8, xEnd: -30, delay: 0.78 },
              { xStart: 8, xEnd: 30, delay: 0.82 },
              { xStart: 0, xEnd: 4, delay: 0.85 },
            ].map((drip, i) => (
              <motion.div
                key={`drip-${i}`}
                className="absolute"
                style={{
                  width: 3,
                  height: 18,
                  borderRadius: 3,
                  background:
                    'linear-gradient(to bottom, rgba(193,30,56,0.8), rgba(128,0,32,0.4))',
                  left: '50%',
                  top: '32%',
                  marginLeft: drip.xStart,
                }}
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{
                  opacity: [0, 0.8, 0.5, 0],
                  y: [0, 40, 70, 100],
                  x: [0, drip.xEnd - drip.xStart],
                  scaleY: [1, 1.5, 2, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  delay: drip.delay,
                  ease: 'easeIn',
                }}
              />
            ))}

            {/* ── Text ── */}
            <motion.p
              className="mt-4 text-white text-xl font-bold tracking-tight text-center z-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              Cheers!
            </motion.p>
            <motion.p
              className="mt-2 text-white/40 text-sm text-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
            >
              Your drink has been redeemed
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
