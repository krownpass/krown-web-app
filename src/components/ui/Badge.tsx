import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'gold' | 'burgundy';
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-white/10 text-white/70',
  success: 'bg-green-500/15 text-green-400 border border-green-500/20',
  error: 'bg-red-500/15 text-red-400 border border-red-500/20',
  warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  gold: 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20',
  burgundy: 'bg-[#800020]/20 text-[#C11E38] border border-[#800020]/30',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
