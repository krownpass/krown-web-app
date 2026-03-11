'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReservationSuccessProps {
  show: boolean;
  onComplete?: () => void;
  /** Duration in ms before auto-dismissing. Default 3200 */
  duration?: number;
}

/* ────────────────────────────────────────────────────────────
   Inline SVGs — all stroked / filled in currentColor so we
   can tint them with Tailwind's text-* utilities.
   ──────────────────────────────────────────────────────────── */

function TableIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* table top — rounded rectangle */}
      <rect x="10" y="20" width="100" height="12" rx="6" fill="currentColor" />
      {/* left leg */}
      <rect x="24" y="32" width="8" height="36" rx="4" fill="currentColor" opacity={0.7} />
      {/* right leg */}
      <rect x="88" y="32" width="8" height="36" rx="4" fill="currentColor" opacity={0.7} />
      {/* centre support */}
      <rect x="56" y="32" width="8" height="30" rx="4" fill="currentColor" opacity={0.5} />
    </svg>
  );
}

function CupIcon({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* steam wisps */}
      <path
        d="M22 8c0-4 4-6 4-10M32 6c0-4 4-6 4-10M42 8c0-4 4-6 4-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.35}
      />
      {/* cup body */}
      <path
        d="M12 18h40l-4 40a6 6 0 01-6 5.5H22a6 6 0 01-6-5.5L12 18z"
        fill="currentColor"
      />
      {/* handle */}
      <path
        d="M52 24c6 0 10 4 10 10s-4 10-10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      {/* saucer */}
      <ellipse cx="32" cy="66" rx="24" ry="5" fill="currentColor" opacity={0.25} />
    </svg>
  );
}

/* ── Floating particle (small dot / sparkle) ── */
function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-[#C11E38]"
      style={{ width: size, height: size }}
      initial={{ opacity: 0, x, y, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.2, 0],
        y: y - 40 - Math.random() * 30,
        x: x + (Math.random() - 0.5) * 60,
      }}
      transition={{ duration: 1.6, delay, ease: 'easeOut' }}
    />
  );
}

/* ── Main component ── */
export function ReservationSuccess({ show, onComplete, duration = 3200 }: ReservationSuccessProps) {
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

  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    delay: 0.6 + Math.random() * 0.8,
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 100,
    size: 3 + Math.random() * 5,
  }));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="reservation-success"
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
                'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.70) 50%, rgba(0,0,0,0.92) 100%)',
            }}
          />

          {/* ── Soft burgundy glow behind the table ── */}
          <motion.div
            className="absolute w-72 h-72 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(128,0,32,0.30) 0%, rgba(128,0,32,0.08) 50%, transparent 70%)',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          />

          {/* ── Centre stage ── */}
          <div className="relative flex flex-col items-center">
            {/* Particles */}
            {particles.map((p) => (
              <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} size={p.size} />
            ))}

            {/* ── TABLE — rises from below ── */}
            <motion.div
              className="text-[#C11E38] w-28 h-20 relative z-10"
              initial={{ opacity: 0, y: 120, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 16,
                delay: 0.15,
              }}
            >
              <TableIcon className="w-full h-full drop-shadow-[0_0_24px_rgba(193,30,56,0.45)]" />
            </motion.div>

            {/* ── CUPS — fly in from sides ── */}
            <div className="absolute top-[-8px] w-64 flex justify-between pointer-events-none z-20">
              {/* Left cup */}
              <motion.div
                className="text-[#C11E38] w-12 h-14"
                initial={{ opacity: 0, x: -100, rotate: -20 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 18,
                  delay: 0.45,
                }}
              >
                <CupIcon className="w-full h-full drop-shadow-[0_0_16px_rgba(193,30,56,0.4)]" />
              </motion.div>

              {/* Right cup */}
              <motion.div
                className="text-[#C11E38] w-12 h-14"
                initial={{ opacity: 0, x: 100, rotate: 20 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 18,
                  delay: 0.55,
                }}
              >
                <CupIcon className="w-full h-full drop-shadow-[0_0_16px_rgba(193,30,56,0.4)]" flip />
              </motion.div>
            </div>

            {/* ── Glow ring pulse ── */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-[#C11E38]/30 z-0"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.3, 1.6, 2] }}
              transition={{ duration: 1.6, delay: 0.7, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-[#C11E38]/20 z-0"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 0.5, 0], scale: [0.3, 1.8, 2.4] }}
              transition={{ duration: 1.8, delay: 0.9, ease: 'easeOut' }}
            />

            {/* ── Text ── */}
            <motion.p
              className="mt-8 text-white text-xl font-bold tracking-tight text-center z-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.85, duration: 0.5 }}
            >
              Table Reserved!
            </motion.p>
            <motion.p
              className="mt-2 text-white/40 text-sm text-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.05, duration: 0.4 }}
            >
              Your spot is confirmed
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
