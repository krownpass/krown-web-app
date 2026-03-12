'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface EventBookingSuccessProps {
  show: boolean;
  onComplete?: () => void;
  /** Duration in ms before auto-dismissing. Default 4200 */
  duration?: number;
}

/* ────────────────────────────────────────────
   Ticket SVG — sleek admission ticket
   ──────────────────────────────────────────── */
function TicketIcon({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* Ticket body */}
      <path
        d="M8 8h96a4 4 0 0 1 4 4v20a8 8 0 0 0 0 16v20a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V48a8 8 0 0 0 0-16V12a4 4 0 0 1 4-4z"
        fill="currentColor"
        opacity={0.2}
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Perforated line */}
      <line
        x1="82" y1="14" x2="82" y2="66"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity={0.4}
      />
      {/* Star / badge icon on left section */}
      <path
        d="M40 32l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
        fill="currentColor"
        opacity={0.6}
      />
      {/* Small lines */}
      <rect x="28" y="52" width="24" height="2" rx="1" fill="currentColor" opacity={0.3} />
      <rect x="28" y="57" width="16" height="2" rx="1" fill="currentColor" opacity={0.2} />
      {/* Barcode area */}
      <rect x="90" y="24" width="3" height="32" rx="1" fill="currentColor" opacity={0.25} />
      <rect x="95" y="24" width="2" height="32" rx="1" fill="currentColor" opacity={0.2} />
      <rect x="99" y="24" width="3" height="32" rx="1" fill="currentColor" opacity={0.15} />
    </svg>
  );
}

/* ── Twinkle star ── */
function Twinkle({
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
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        width: size,
        height: size,
      }}
      initial={{ opacity: 0, x, y, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 0.8, 0],
        scale: [0, 1.4, 0.6, 0],
        rotate: [0, 90, 180],
        x: [x, x + (Math.random() - 0.5) * 30],
        y: [y, y - 15 - Math.random() * 20],
      }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
    >
      {/* Four-point star shape */}
      <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
        <path
          d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8Z"
          fill="white"
          opacity={0.9}
        />
      </svg>
    </motion.div>
  );
}

/* ── Shimmer particle ── */
function Shimmer({
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
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle, rgba(193,30,56,0.9) 0%, rgba(128,0,32,0.4) 100%)',
        left: '50%',
        top: '50%',
        boxShadow: '0 0 8px rgba(193, 30, 56, 0.6)',
      }}
      initial={{ opacity: 0, x, y, scale: 0 }}
      animate={{
        opacity: [0, 0.9, 0],
        scale: [0, 1.3, 0],
        y: [y, y - 30 - Math.random() * 40],
        x: [x, x + (Math.random() - 0.5) * 60],
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    />
  );
}

/* ── Main component ── */
export function EventBookingSuccess({
  show,
  onComplete,
  duration = 4200,
}: EventBookingSuccessProps) {
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

  // Twinkle stars — appear after tickets meet
  const twinkles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    delay: 2.0 + Math.random() * 0.6,
    x: (Math.random() - 0.5) * 240,
    y: (Math.random() - 0.5) * 140,
    size: 8 + Math.random() * 10,
  }));

  // Red shimmer particles
  const shimmers = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: 2.1 + Math.random() * 0.5,
    x: (Math.random() - 0.5) * 180,
    y: (Math.random() - 0.5) * 100,
    size: 3 + Math.random() * 5,
  }));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="event-booking-success"
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* ── Dark radial backdrop ── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.92) 100%)',
            }}
          />

          {/* ── Subtle red ambient glow ── */}
          <motion.div
            className="absolute w-96 h-96 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(128,0,32,0.20) 0%, rgba(193,30,56,0.06) 50%, transparent 70%)',
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0.6], scale: [0.3, 1.4, 1.2] }}
            transition={{ duration: 2.5, delay: 0.1, ease: 'easeOut' }}
          />

          {/* ── Centre stage ── */}
          <div className="relative flex flex-col items-center">
            {/* Twinkle stars */}
            {twinkles.map((t) => (
              <Twinkle
                key={`twinkle-${t.id}`}
                delay={t.delay}
                x={t.x}
                y={t.y}
                size={t.size}
              />
            ))}

            {/* Red shimmer particles */}
            {shimmers.map((s) => (
              <Shimmer
                key={`shimmer-${s.id}`}
                delay={s.delay}
                x={s.x}
                y={s.y}
                size={s.size}
              />
            ))}

            {/* ── KROWN LOGO — rises from bottom to center, then fades out ── */}
            <motion.div
              className="relative w-24 h-24 z-20"
              initial={{ opacity: 0, y: 200, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [200, 0, 0, -20],
                scale: [0.5, 1, 1, 0.8],
              }}
              transition={{
                duration: 2.4,
                times: [0, 0.3, 0.7, 1],
                ease: 'easeInOut',
              }}
            >
              <Image quality={90}
                src="/krown-icon.png"
                alt="Krown"
                width={96}
                height={96}
                className="rounded-2xl"
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(193, 30, 56, 0.5)) drop-shadow(0 0 60px rgba(128, 0, 32, 0.3))',
                }}
              />
              {/* Glow ring around logo */}
              <motion.div
                className="absolute inset-[-8px] rounded-3xl border-2 border-[#C11E38]/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.6, 0.4, 0],
                  scale: [0.8, 1.1, 1.2, 1.3],
                }}
                transition={{
                  duration: 2.4,
                  times: [0, 0.3, 0.7, 1],
                  ease: 'easeOut',
                }}
              />
            </motion.div>

            {/* ── TEXT — "Enjoy your every moment with KROWN" — fades up ── */}
            <motion.p
              className="mt-6 text-white/90 text-lg font-medium tracking-wide text-center z-20 max-w-[280px] leading-relaxed"
              initial={{ opacity: 0, y: 24 }}
              animate={{
                opacity: [0, 0, 1, 1, 0],
                y: [24, 24, 0, 0, -10],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.2, 0.35, 0.65, 0.85],
                ease: 'easeInOut',
              }}
            >
              Enjoy your every moment with{' '}
              <span className="font-bold text-[#C11E38]">KROWN</span>
            </motion.p>

            {/* ── TICKETS — fly in from left and right to center ── */}
            <div className="absolute top-[-10px] w-80 flex items-center justify-center pointer-events-none z-30">
              {/* Left ticket */}
              <motion.div
                className="absolute text-[#C11E38] w-32 h-[88px]"
                initial={{ opacity: 0, x: -280, rotate: -20, scale: 0.7 }}
                animate={{
                  opacity: [0, 0, 0, 1, 1],
                  x: [-280, -280, -280, 20, 14],
                  rotate: [-20, -20, -20, -6, -4],
                  scale: [0.7, 0.7, 0.7, 1, 1],
                }}
                exit={{ opacity: 0, x: -100 }}
                transition={{
                  duration: 3.2,
                  times: [0, 0.3, 0.5, 0.75, 1],
                  ease: 'easeInOut',
                }}
              >
                <TicketIcon className="w-full h-full drop-shadow-[0_0_24px_rgba(193,30,56,0.5)]" />
              </motion.div>

              {/* Right ticket */}
              <motion.div
                className="absolute text-[#C11E38] w-32 h-[88px]"
                initial={{ opacity: 0, x: 280, rotate: 20, scale: 0.7 }}
                animate={{
                  opacity: [0, 0, 0, 1, 1],
                  x: [280, 280, 280, -20, -14],
                  rotate: [20, 20, 20, 6, 4],
                  scale: [0.7, 0.7, 0.7, 1, 1],
                }}
                exit={{ opacity: 0, x: 100 }}
                transition={{
                  duration: 3.2,
                  times: [0, 0.3, 0.5, 0.75, 1],
                  ease: 'easeInOut',
                }}
              >
                <TicketIcon
                  className="w-full h-full drop-shadow-[0_0_24px_rgba(193,30,56,0.5)]"
                  flip
                />
              </motion.div>
            </div>

            {/* ── Impact flash when tickets meet ── */}
            <motion.div
              className="absolute"
              style={{
                left: '50%',
                top: '10%',
                marginLeft: -24,
                marginTop: -24,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(193,30,56,0.5) 40%, transparent 70%)',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0, 0, 1, 0],
                scale: [0, 0, 0, 2.5, 0.5],
              }}
              transition={{
                duration: 3.2,
                times: [0, 0.5, 0.72, 0.78, 1],
                ease: 'easeOut',
              }}
            />

            {/* ── Expanding ring pulses from ticket meeting point ── */}
            {[
              { size: 100, delay: 2.5, borderOpacity: 0.35 },
              { size: 140, delay: 2.65, borderOpacity: 0.25 },
              { size: 180, delay: 2.8, borderOpacity: 0.15 },
            ].map((ring, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute rounded-full"
                style={{
                  width: ring.size,
                  height: ring.size,
                  left: '50%',
                  top: '10%',
                  marginLeft: -ring.size / 2,
                  marginTop: -ring.size / 2,
                  border: `2px solid rgba(193, 30, 56, ${ring.borderOpacity})`,
                }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{
                  opacity: [0, 0.7, 0],
                  scale: [0.3, 1.6, 2.2],
                }}
                transition={{
                  duration: 1.4,
                  delay: ring.delay,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* ── Final confirmation text ── */}
            <motion.p
              className="mt-4 text-white text-xl font-bold tracking-tight text-center z-20"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: [0, 0, 1], y: [16, 16, 0] }}
              exit={{ opacity: 0, y: 8 }}
              transition={{
                duration: 3.4,
                times: [0, 0.75, 1],
                ease: 'easeOut',
              }}
            >
              You&apos;re In!
            </motion.p>
            <motion.p
              className="mt-2 text-white/40 text-sm text-center z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3.6,
                times: [0, 0.8, 1],
                ease: 'easeOut',
              }}
            >
              Your ticket is confirmed
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
