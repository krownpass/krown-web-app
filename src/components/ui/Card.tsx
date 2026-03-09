'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: boolean;
}

export function Card({ children, className, onClick, hoverable = false, padding = true }: CardProps) {
  const Comp = hoverable ? motion.div : 'div';

  const motionProps = hoverable
    ? {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98 },
        transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
      }
    : {};

  return (
    <Comp
      onClick={onClick}
      className={cn(
        'bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl',
        padding && 'p-4',
        onClick && 'cursor-pointer',
        hoverable && 'hover:border-[#3A3A3A] hover:shadow-xl hover:shadow-black/30',
        className
      )}
      {...motionProps}
    >
      {children}
    </Comp>
  );
}
