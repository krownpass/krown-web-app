import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Bell, Bookmark, BookOpen, Calendar, Coffee, Gift, Image, Receipt,
  Smartphone, Star, Ticket, UtensilsCrossed, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Bell, Bookmark, BookOpen, Calendar, Coffee, Gift, Image, Receipt,
  Smartphone, Star, Ticket, UtensilsCrossed,
};

interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction, className }: EmptyStateProps) {
  let iconNode: React.ReactNode = null;
  if (typeof icon === 'string') {
    const Icon = ICON_MAP[icon];
    iconNode = Icon ? <Icon size={32} /> : null;
  } else {
    iconNode = icon ?? null;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {iconNode && (
        <div className="mb-4 p-4 rounded-full bg-white/5 text-white/30">
          {iconNode}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-white/50 max-w-xs mb-6">{subtitle}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
