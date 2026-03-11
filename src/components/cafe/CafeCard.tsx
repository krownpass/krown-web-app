'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDistance, getPriceRange } from '@/lib/utils';
import { RatingStars } from '@/components/shared/RatingStars';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { Cafe } from '@/types/cafe';

interface CafeCardProps {
  cafe: Cafe;
  onBookmark?: (cafeId: string, bookmarked: boolean) => void;
  className?: string;
  aspectRatio?: 'tall' | 'square' | 'video' | 'standard';
}

export function CafeCard({ cafe, onBookmark, className, aspectRatio = 'standard' }: CafeCardProps) {
  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmark?.(cafe.cafe_id, !cafe.is_bookmarked);
  };

  const aspectClass = {
    tall: 'aspect-[3/4]',
    square: 'aspect-square',
    video: 'aspect-video',
    standard: 'aspect-[4/3]',
  }[aspectRatio];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('group block h-full', className)}
    >
      <Link href={`/cafes/${cafe.slug ?? cafe.cafe_id}`} className="block h-full">
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl md:rounded-3xl overflow-hidden hover:border-white/10 hover:shadow-2xl hover:shadow-[#800020]/20 transition-all duration-500 h-full flex flex-col relative">
          {/* Glowing inner shadow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

          {/* Cover image */}
          <div className={cn('relative overflow-hidden shrink-0', aspectClass)}>
            <ImageWithFallback
              src={cafe.cover_image ?? '/placeholder-cafe.jpg'}
              fallbackSrc="/placeholder-cafe.jpg"
              alt={cafe.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Open/Closed badge */}
            <div className="absolute top-3 left-3">
              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full',
                  cafe.is_open
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                )}
              >
                {cafe.is_open ? 'Open' : 'Closed'}
              </span>
            </div>

            {/* Bookmark button */}
            <button
              onClick={handleBookmark}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all"
            >
              {cafe.is_bookmarked ? (
                <BookmarkCheck size={16} className="text-[#800020]" fill="#800020" />
              ) : (
                <Bookmark size={16} className="text-white" />
              )}
            </button>

            {/* Krown Pass badge */}
            {cafe.has_krown_pass_benefit && (
              <div className="absolute bottom-3 left-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  {cafe.discount_percent ? `${cafe.discount_percent}% off` : 'Krown Pass'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-semibold text-white text-base md:text-lg mb-1 leading-tight">{cafe.name}</h3>

            {/* Rating */}
            <RatingStars
              rating={cafe.rating ?? 0}
              showCount
              count={cafe.total_reviews}
              size={12}
              className="mb-2"
            />

            {/* Meta info */}
            <div className="flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center gap-1">
                <MapPin size={11} />
                <span>{cafe.area ?? cafe.city}</span>
                {cafe.distance && (
                  <span className="ml-1 text-white/30">· {getDistance(cafe.distance)}</span>
                )}
              </div>
              {cafe.price_range && (
                <span className="text-white/50">{getPriceRange(cafe.price_range)}</span>
              )}
            </div>

            {/* Vibe tags */}
            {cafe.vibes && cafe.vibes.length > 0 && (
              <div className="flex gap-1 mt-auto pt-3 flex-wrap">
                {cafe.vibes.slice(0, 3).map((vibe) => (
                  <span
                    key={vibe}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] text-white/60 border border-white/[0.08]"
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
