'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from 'framer-motion';
import { Star, MapPin, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { Cafe } from '@/types/cafe';

// ─── Layout constants (matching krown-app SwipeDeck) ──────────────────────────

const MAX_CARD_WIDTH = 420;
const CARD_ASPECT_RATIO = 420 / (0.85 * 390);
const SWIPE_THRESHOLD_FRACTION = 0.45;
const SWIPE_VELOCITY_THRESHOLD = 600;
const ROTATE_DEG = 8;

const SECOND_TX_FRAC = 0.09;
const SECOND_TY_FRAC = 0.07;
const SECOND_ROTATE = 10;
const SECOND_SCALE = 0.92;

const THIRD_TX_FRAC = -0.09;
const THIRD_TY_FRAC = 0.13;
const THIRD_ROTATE = -10;
const THIRD_SCALE = 0.85;

// ─── SwipeCard ────────────────────────────────────────────────────────────────

function SwipeCard({ cafe, onClick }: { cafe: Cafe; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="w-full select-none cursor-pointer group/card">
      {/* Gradient border */}
      <div
        className="rounded-[22px] p-[2.5px] shadow-[0_8px_40px_rgba(149,19,52,0.25)]"
        style={{
          background:
            'linear-gradient(135deg, #FF658B 0%, #951334 62%, #FF658B 100%)',
        }}
      >
        <div className="rounded-[20px] bg-[#951334] overflow-hidden flex flex-col">
          {/* Image */}
          <div className="p-3.5 pb-0">
            <div className="relative w-full aspect-[275/230] rounded-[14px] overflow-hidden">
              <ImageWithFallback
                src={cafe.cover_image ?? '/placeholder-cafe.jpg'}
                fallbackSrc="/placeholder-cafe.jpg"
                alt={cafe.name}
                fill
                className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                sizes="(max-width: 768px) 85vw, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>

          {/* Content */}
          <div className="px-[18px] pt-3.5 pb-[18px] flex flex-col">
            {/* Title + Rating */}
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-semibold truncate flex-1 mr-2">
                {cafe.name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <Star size={16} className="text-[#FFD700]" fill="#FFD700" />
                <span className="text-[#FFD700] text-[15px] font-medium">
                  {cafe.rating ?? '4.4'}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin size={14} className="text-white/80 shrink-0" />
              <span className="text-white/80 text-sm truncate">
                {cafe.area ?? cafe.city ?? 'Location unavailable'}
              </span>
            </div>

            {/* Tagline */}
            <p className="mt-3 text-white text-[15px] font-semibold leading-5 truncate">
              {cafe.vibes?.[0] ?? 'Global Brews, Local Vibe.'}
            </p>

            {/* Description */}
            <p className="mt-1 text-white/70 text-sm leading-5 line-clamp-2">
              {cafe.description ?? 'Perfect for chill catch-ups and coffee breaks.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Arrow Button ─────────────────────────────────────────────────────────────

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center
        bg-white/[0.04] border border-white/10 backdrop-blur-sm
        hover:bg-[#800020]/30 hover:border-[#800020]/50 hover:shadow-[0_0_20px_rgba(128,0,32,0.3)]
        active:bg-[#800020]/50 transition-all duration-300
        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/[0.04] disabled:hover:border-white/10 disabled:hover:shadow-none"
    >
      <Icon size={22} className="text-white/80" />
    </motion.button>
  );
}

// ─── Card Counter Dots ────────────────────────────────────────────────────────

function CardCounter({ total, currentIndex }: { total: number; currentIndex: number }) {
  const maxDots = 5;
  const start = Math.max(0, Math.min(currentIndex - Math.floor(maxDots / 2), total - maxDots));
  const visibleRange = Array.from(
    { length: Math.min(maxDots, total) },
    (_, i) => start + i,
  );

  return (
    <div className="flex items-center gap-1.5">
      {visibleRange.map((idx) => (
        <motion.div
          key={idx}
          animate={{
            width: idx === currentIndex ? 20 : 6,
            opacity: idx === currentIndex ? 1 : 0.3,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="h-1.5 rounded-full"
          style={{
            background:
              idx === currentIndex
                ? 'linear-gradient(90deg, #FF658B, #800020)'
                : '#ffffff',
          }}
        />
      ))}
    </div>
  );
}

// ─── CafeSwipeStack ───────────────────────────────────────────────────────────

interface CafeSwipeStackProps {
  cafes: Cafe[];
  onCardPress?: (cafe: Cafe) => void;
}

export function CafeSwipeStack({ cafes, onCardPress }: CafeSwipeStackProps) {
  const [cardWidth, setCardWidth] = useState(340);
  const [deck, setDeck] = useState(cafes);
  const [isDismissing, setIsDismissing] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const lastClickRef = useRef(0);
  const dismissingRef = useRef(false);
  const pendingNavRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasDragRef = useRef(false);

  useEffect(() => {
    setDeck(cafes);
  }, [cafes]);

  // Responsive card width
  useEffect(() => {
    const update = () =>
      setCardWidth(Math.min(window.innerWidth * 0.85, MAX_CARD_WIDTH));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const cardHeight = cardWidth * CARD_ASPECT_RATIO;
  const swipeThreshold = cardWidth * SWIPE_THRESHOLD_FRACTION;

  const secondTX = cardWidth * SECOND_TX_FRAC;
  const secondTY = cardHeight * SECOND_TY_FRAC;
  const thirdTX = cardWidth * THIRD_TX_FRAC;
  const thirdTY = cardHeight * THIRD_TY_FRAC;

  // ── Motion values ────────────────────────────────────────────────────────────
  const x = useMotionValue(0);

  const dismissProgress = useTransform(x, (v) =>
    Math.min(Math.abs(v) / (cardWidth * 0.6), 1),
  );

  const topRotate = useTransform(
    x,
    [-cardWidth, 0, cardWidth],
    [-ROTATE_DEG, 0, ROTATE_DEG],
  );

  const secondScale = useTransform(dismissProgress, [0, 1], [SECOND_SCALE, 1]);
  const secondTranslateX = useTransform(dismissProgress, [0, 1], [secondTX, 0]);
  const secondTranslateY = useTransform(dismissProgress, [0, 1], [secondTY, 0]);
  const secondRotate = useTransform(dismissProgress, [0, 1], [SECOND_ROTATE, 0]);

  const thirdScale = useTransform(
    dismissProgress,
    [0, 1],
    [THIRD_SCALE, SECOND_SCALE],
  );
  const thirdTranslateX = useTransform(
    dismissProgress,
    [0, 1],
    [thirdTX, secondTX],
  );
  const thirdTranslateY = useTransform(
    dismissProgress,
    [0, 1],
    [thirdTY, secondTY],
  );
  const thirdRotate = useTransform(
    dismissProgress,
    [0, 1],
    [THIRD_ROTATE, SECOND_ROTATE],
  );

  // ── Deck rotation ───────────────────────────────────────────────────────────
  const commitRotation = useCallback(() => {
    setDeck((prev) => {
      const next = [...prev];
      const first = next.shift();
      if (first) next.push(first);
      return next;
    });
    setSwipeCount((c) => c + 1);
    setIsDismissing(false);
  }, []);

  // ── Cancel pending navigation ────────────────────────────────────────────
  const cancelPendingNav = useCallback(() => {
    if (pendingNavRef.current) {
      clearTimeout(pendingNavRef.current);
      pendingNavRef.current = null;
    }
  }, []);

  // ── Dismiss ─────────────────────────────────────────────────────────────────
  const dismiss = useCallback(
    (direction: 1 | -1) => {
      if (dismissingRef.current) return;
      dismissingRef.current = true;
      setIsDismissing(true);
      cancelPendingNav();
      lastClickRef.current = 0;
      const target = direction * (window.innerWidth + cardWidth);

      animate(x, target, {
        type: 'tween',
        duration: 0.28,
        ease: [0.32, 0, 0.67, 0],
        onComplete: () => {
          x.set(0);
          dismissingRef.current = false;
          commitRotation();
        },
      });
    },
    [cardWidth, x, commitRotation, cancelPendingNav],
  );

  // ── Arrow handlers ──────────────────────────────────────────────────────────
  const handlePrev = useCallback(() => dismiss(-1), [dismiss]);
  const handleNext = useCallback(() => dismiss(1), [dismiss]);

  // ── Double-click to swipe left ──────────────────────────────────────────────
  const handleCardClick = useCallback(
    (cafe: Cafe) => {
      // Ignore clicks that resulted from a drag gesture
      if (wasDragRef.current) {
        wasDragRef.current = false;
        return;
      }
      // Ignore clicks while dismissing
      if (dismissingRef.current) return;

      const now = Date.now();
      if (now - lastClickRef.current < 400) {
        // Double-click detected → cancel any pending navigation, swipe left
        lastClickRef.current = 0;
        cancelPendingNav();
        dismiss(-1);
      } else {
        lastClickRef.current = now;
        // Cancel any prior pending navigation
        cancelPendingNav();
        // Single click → navigate only after delay to rule out double-click
        pendingNavRef.current = setTimeout(() => {
          pendingNavRef.current = null;
          if (!dismissingRef.current) {
            onCardPress?.(cafe);
          }
          lastClickRef.current = 0;
        }, 420);
      }
    },
    [dismiss, onCardPress, cancelPendingNav],
  );

  // ── Keyboard arrows ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrev, handleNext]);

  // ── Drag end ────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (
      _: unknown,
      info: { offset: { x: number }; velocity: { x: number } },
    ) => {
      // Any drag end means the next click event should be ignored
      wasDragRef.current = true;
      cancelPendingNav();

      if (dismissingRef.current) return;

      const draggedFarEnough = Math.abs(info.offset.x) > swipeThreshold;
      const flickedFastEnough =
        Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;

      if (draggedFarEnough || flickedFastEnough) {
        dismiss(info.offset.x > 0 ? 1 : -1);
      } else {
        animate(x, 0, { type: 'spring', damping: 20, stiffness: 200 });
      }
    },
    [swipeThreshold, dismiss, x, cancelPendingNav],
  );

  if (deck.length < 3) return null;

  const [top, second, third] = deck;
  const currentIndex = swipeCount % cafes.length;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Deck + arrows */}
      <div className="flex items-center gap-4 md:gap-8 w-full justify-center">
        {/* Left arrow */}
        <ArrowButton direction="left" onClick={handlePrev} disabled={isDismissing} />

        {/* Card stack */}
        <div
          className="relative flex-shrink-0"
          style={{ width: cardWidth, height: cardHeight + thirdTY + 10 }}
        >
          {/* Ambient glow behind deck */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full blur-[80px] pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle, #951334 0%, transparent 70%)' }}
          />

          {/* Third card */}
          <motion.div
            key={`third-${third.cafe_id}`}
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: cardWidth,
              zIndex: 1,
              x: thirdTranslateX,
              y: thirdTranslateY,
              rotate: thirdRotate,
              scale: thirdScale,
            }}
          >
            <SwipeCard cafe={third} />
          </motion.div>

          {/* Second card */}
          <motion.div
            key={`second-${second.cafe_id}`}
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: cardWidth,
              zIndex: 2,
              x: secondTranslateX,
              y: secondTranslateY,
              rotate: secondRotate,
              scale: secondScale,
            }}
          >
            <SwipeCard cafe={second} />
          </motion.div>

          {/* Top card — draggable */}
          <motion.div
            key={`top-${top.cafe_id}`}
            drag="x"
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="absolute left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
            style={{
              width: cardWidth,
              zIndex: 3,
              x,
              rotate: topRotate,
            }}
          >
            <SwipeCard
              cafe={top}
              onClick={() => handleCardClick(top)}
            />
          </motion.div>
        </div>

        {/* Right arrow */}
        <ArrowButton direction="right" onClick={handleNext} disabled={isDismissing} />
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-3">
        <CardCounter total={cafes.length} currentIndex={currentIndex} />
        <p className="text-white/30 text-xs tracking-wide">
          Drag, click arrows, or double-click to swipe
        </p>
      </div>
    </div>
  );
}
