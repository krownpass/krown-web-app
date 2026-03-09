'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
  badge?: string;
}

const defaultSlides: HeroSlide[] = [
  {
    id: '1',
    title: 'Discover Chennai\'s Finest Cafés',
    subtitle: 'Book a table, attend events, earn rewards — all with Krown Pass',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1400&q=80',
    ctaLabel: 'Explore Cafés',
    ctaHref: '/cafes',
    badge: 'New',
  },
  {
    id: '2',
    title: 'Exclusive Events This Week',
    subtitle: 'Comedy nights, live music, immersive dining — don\'t miss out',
    image: 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=1400&q=80',
    ctaLabel: 'Browse Events',
    ctaHref: '/events',
    badge: 'Hot',
  },
  {
    id: '3',
    title: 'Unlock Premium Benefits',
    subtitle: '15% off at all partner cafés, priority bookings, and exclusive perks',
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1400&q=80',
    ctaLabel: 'Get Krown Pass',
    ctaHref: '/krown-pass',
    badge: 'Premium',
  },
];

interface HeroBannerProps {
  slides?: HeroSlide[];
}

export function HeroBanner({ slides = defaultSlides }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[380px] md:h-[480px] lg:h-[560px] overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].image}
            alt={slides[current].title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slides[current].id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            {slides[current].badge && (
              <span className="inline-block mb-3 text-xs font-bold px-3 py-1 rounded-full bg-[#800020] text-white uppercase tracking-wide">
                {slides[current].badge}
              </span>
            )}
            <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight max-w-xl">
              {slides[current].title}
            </h1>
            <p className="text-white/70 text-sm md:text-base mb-6 max-w-md">
              {slides[current].subtitle}
            </p>
            <Link
              href={slides[current].ctaHref}
              className="inline-flex items-center gap-2 bg-[#800020] hover:bg-[#C11E38] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[#800020]/30 active:scale-95"
            >
              {slides[current].ctaLabel}
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 right-6 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
