import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  variant?: 'line' | 'circle' | 'card' | 'rectangle';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

function SkeletonItem({
  variant = 'rectangle',
  width,
  height,
  className,
}: Omit<SkeletonProps, 'count'>) {
  const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
    line: 'h-4 rounded-full',
    circle: 'rounded-full',
    card: 'rounded-xl h-48',
    rectangle: 'rounded-lg',
  };

  return (
    <div
      className={cn('shimmer', variantClasses[variant], className)}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  );
}

export function Skeleton({ count = 1, ...props }: SkeletonProps) {
  if (count === 1) {
    return <SkeletonItem {...props} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} {...props} />
      ))}
    </div>
  );
}
