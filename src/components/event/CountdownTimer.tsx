'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const formatted = value.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-16 overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={formatted}
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="text-2xl font-bold text-white font-mono absolute"
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const isOver = Object.values(timeLeft).every((v) => v === 0);

  if (isOver) {
    return (
      <div className={className}>
        <span className="text-sm text-[#C11E38] font-semibold">Event has started!</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Starts In</p>
      <div className="flex items-center gap-2">
        <FlipUnit value={timeLeft.days} label="Days" />
        <span className="text-2xl font-bold text-white/30 mb-4">:</span>
        <FlipUnit value={timeLeft.hours} label="Hours" />
        <span className="text-2xl font-bold text-white/30 mb-4">:</span>
        <FlipUnit value={timeLeft.minutes} label="Mins" />
        <span className="text-2xl font-bold text-white/30 mb-4">:</span>
        <FlipUnit value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
}
