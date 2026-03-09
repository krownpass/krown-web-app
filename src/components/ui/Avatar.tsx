import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig: Record<NonNullable<AvatarProps['size']>, { px: number; text: string }> = {
  sm: { px: 28, text: 'text-xs' },
  md: { px: 36, text: 'text-sm' },
  lg: { px: 48, text: 'text-base' },
  xl: { px: 80, text: 'text-2xl' },
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const { px, text } = sizeConfig[size];
  const initials = name ? getInitials(name) : '?';

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden bg-[#800020] flex items-center justify-center shrink-0',
        className
      )}
      style={{ width: px, height: px }}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? 'Avatar'}
          width={px}
          height={px}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className={cn('font-semibold text-white', text)}>{initials}</span>
      )}
    </div>
  );
}
