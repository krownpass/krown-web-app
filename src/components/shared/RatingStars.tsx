import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number; // 0-5
  size?: number;
  showCount?: boolean;
  count?: number;
  className?: string;
}

export function RatingStars({ rating, size = 14, showCount = false, count, className }: RatingStarsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;

          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star
                size={size}
                className="text-white/15"
                fill="currentColor"
              />
              {(filled || partial) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: partial ? `${(rating % 1) * 100}%` : '100%' }}
                >
                  <Star
                    size={size}
                    className="text-[#D4AF37]"
                    fill="currentColor"
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showCount && count != null && (
        <span className="text-xs text-white/40 ml-1">({count})</span>
      )}
      {!showCount && (
        <span className="text-xs text-white/60 font-medium">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
