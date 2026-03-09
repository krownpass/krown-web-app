'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, Mic } from 'lucide-react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { StoriesRow } from '@/components/home/StoriesRow';
import { FeaturedCafes } from '@/components/home/FeaturedCafes';
import { UpcomingEvents } from '@/components/home/UpcomingEvents';
import { WhatsOnYourMind } from '@/components/home/WhatsOnYourMind';
import { PromoBanner } from '@/components/home/PromoBanner';
import { CafeSwipeStack } from '@/components/cafe/CafeSwipeStack';
import { KROWN_VIBES } from '@/lib/constants';
import { useHomeData } from '@/queries/useHome';

function SectionReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const { data: homeData } = useHomeData();

  // Map server stories to StoriesRow format
  const stories = (homeData?.stories ?? []).map((s) => ({
    id: s.story_id,
    label: s.title,
    image: s.cover_img,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 space-y-10">
      {/* Hero */}
      <SectionReveal>
        <HeroBanner />
      </SectionReveal>

      {/* Search bar */}
      <SectionReveal delay={0.05}>
        <Link href="/search">
          <div className="flex items-center gap-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl px-4 py-3 hover:border-[#3A3A3A] transition-all cursor-text group">
            <Search size={18} className="text-white/40 group-hover:text-white/60 transition-colors" />
            <span className="text-white/40 text-sm flex-1">Search cafés, events, vibes...</span>
            <Mic size={16} className="text-white/30" />
          </div>
        </Link>
      </SectionReveal>

      {/* Vibe categories */}
      <SectionReveal delay={0.08}>
        <section>
          <h2 className="font-playfair text-xl font-bold text-white mb-4">
            What&apos;s your current vibe?
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {KROWN_VIBES.map((vibe, i) => (
              <motion.div
                key={vibe.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <Link href={`/cafes?vibe=${vibe.id}`}>
                  <div className="flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl hover:border-[#800020]/30 transition-all min-w-[90px]">
                    <span className="text-2xl">{vibe.emoji}</span>
                    <span className="text-[11px] text-white/60 text-center whitespace-nowrap">{vibe.label}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </SectionReveal>

      {/* Stories */}
      <SectionReveal delay={0.1}>
        <section>
          <h2 className="font-playfair text-xl font-bold text-white mb-4">KROWN Stories</h2>
          <StoriesRow stories={stories.length > 0 ? stories : undefined} />
        </section>
      </SectionReveal>

      {/* Swipe to discover */}
      <SectionReveal delay={0.12}>
        <section>
          <h2 className="font-playfair text-xl font-bold text-white mb-2">Up For An Adventure?</h2>
          <p className="text-white/40 text-sm mb-5">Swipe to discover cafés near you</p>
          <CafeSwipeStack />
        </section>
      </SectionReveal>

      {/* Featured Cafés */}
      <SectionReveal delay={0.14}>
        <FeaturedCafes />
      </SectionReveal>

      {/* Promo Banner */}
      <SectionReveal delay={0.16}>
        <PromoBanner />
      </SectionReveal>

      {/* What's on your mind */}
      <SectionReveal delay={0.18}>
        <WhatsOnYourMind />
      </SectionReveal>

      {/* Upcoming Events */}
      <SectionReveal delay={0.2}>
        <UpcomingEvents />
      </SectionReveal>
    </div>
  );
}
