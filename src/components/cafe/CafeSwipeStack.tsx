'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Heart, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cafe } from '@/types/cafe';
import { RatingStars } from '@/components/shared/RatingStars';
import { useHomeData } from '@/queries/useHome';

interface CafeSwipeStackProps {
  cafes?: Cafe[];
  onLike?: (cafe: Cafe) => void;
  onSkip?: (cafe: Cafe) => void;
}

function SwipeCard({
  cafe,
  isTop,
  stackIndex,
  onLike,
  onSkip,
}: {
  cafe: Cafe;
  isTop: boolean;
  stackIndex: number;
  onLike: () => void;
  onSkip: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [20, 80], [0, 1]);
  const skipOpacity = useTransform(x, [-80, -20], [1, 0]);

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number } }
  ) => {
    if (info.offset.x > 120) {
      onLike();
    } else if (info.offset.x < -120) {
      onSkip();
    }
  };

  const scale = 1 - stackIndex * 0.05;
  const translateY = stackIndex * 8;

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl"
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          zIndex: 10 - stackIndex,
        }}
      />
    );
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, zIndex: 20 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="w-full h-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
        {/* Image */}
        <div className="relative h-3/4">
          <Image
            src={cafe.cover_image ?? '/placeholder-cafe.jpg'}
            alt={cafe.name}
            fill
            className="object-cover"
            sizes="400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Like overlay */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-6 px-4 py-2 rounded-xl border-4 border-green-400 rotate-[-15deg]"
          >
            <span className="text-2xl font-black text-green-400">LIKE</span>
          </motion.div>

          {/* Skip overlay */}
          <motion.div
            style={{ opacity: skipOpacity }}
            className="absolute top-8 right-6 px-4 py-2 rounded-xl border-4 border-red-400 rotate-[15deg]"
          >
            <span className="text-2xl font-black text-red-400">SKIP</span>
          </motion.div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-playfair text-xl font-bold text-white mb-1">{cafe.name}</h3>
          <div className="flex items-center gap-3 text-sm text-white/50">
            <div className="flex items-center gap-1">
              <MapPin size={13} />
              <span>{cafe.area ?? cafe.city}</span>
            </div>
            <RatingStars rating={cafe.rating ?? 0} size={13} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CafeSwipeStack({ cafes: cafesProp, onLike, onSkip }: CafeSwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const { data: homeData } = useHomeData();
  const cafes = cafesProp ?? homeData?.recommendedCafes ?? [];

  const visibleCafes = cafes.slice(currentIndex, currentIndex + 3);

  const handleLike = () => {
    const cafe = cafes[currentIndex];
    if (cafe) {
      setDirection('right');
      onLike?.(cafe);
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }
  };

  const handleSkip = () => {
    const cafe = cafes[currentIndex];
    if (cafe) {
      setDirection('left');
      onSkip?.(cafe);
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }
  };

  if (currentIndex >= cafes.length || visibleCafes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[420px] text-white/40 text-sm">
        No more cafés to discover
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-[340px] h-[380px]">
        <AnimatePresence>
          {visibleCafes.map((cafe, i) => (
            <SwipeCard
              key={cafe.cafe_id}
              cafe={cafe}
              isTop={i === 0}
              stackIndex={i}
              onLike={handleLike}
              onSkip={handleSkip}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-8">
        <button
          onClick={handleSkip}
          className="w-14 h-14 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center hover:border-red-500/50 hover:bg-red-500/10 transition-all active:scale-90"
        >
          <X size={22} className="text-red-400" />
        </button>
        <button
          onClick={handleLike}
          className="w-16 h-16 rounded-full bg-[#800020] hover:bg-[#C11E38] flex items-center justify-center shadow-lg shadow-[#800020]/30 transition-all active:scale-90"
        >
          <Heart size={24} className="text-white" fill="white" />
        </button>
      </div>
    </div>
  );
}
