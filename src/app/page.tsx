'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, ArrowRight, ArrowLeft, Sparkles, Play, Crown, X, ChevronRight, ChevronLeft, Clock, Eye } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { EventCardCompact } from '@/components/event/EventCardCompact';
import { useHomeData } from '@/queries/useHome';
import { useEvents } from '@/queries/useEvents';

function SectionReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const { data: homeData, isLoading: isHomeLoading } = useHomeData();
  const { data: eventsData } = useEvents();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);

  const recommended = homeData?.recommendedCafes?.slice(0, 3) ?? [];
  const withOffers = homeData?.cafeWithOffers?.slice(0, 4) ?? [];
  const dbStories = homeData?.stories ?? [];
  const defaultStories: any[] = [
    { story_id: 'd1', title: 'The Rise of Chennai Speakeasies', description: 'Hidden doors, crafted cocktails, and jazz all night.', cover_img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80', created_at: new Date().toISOString() },
    { story_id: 'd2', title: 'Late Night Coffee Run', description: 'Best spots open past 2 AM.', cover_img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', created_at: new Date().toISOString() },
    { story_id: 'd3', title: 'Rooftop Season is Here', description: 'Cool breezes and panoramic views.', cover_img: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80', created_at: new Date().toISOString() },
    { story_id: 'd4', title: 'Weekend Brunch Guide', description: 'Pancakes, mimosas, and good vibes.', cover_img: 'https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?w=800&q=80', created_at: new Date().toISOString() },
    { story_id: 'd5', title: 'Underground DJ Sets', description: 'Where the real beats drop after midnight.', cover_img: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80', created_at: new Date().toISOString() },
    { story_id: 'd6', title: 'Artisan Cocktail Trail', description: 'Handcrafted drinks, bespoke experiences.', cover_img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80', created_at: new Date().toISOString() }
  ];
  const allStories = dbStories.length > 0 ? dbStories : defaultStories;
  
  const upcomingEvents = eventsData?.pages[0]?.events?.filter(
    (event) => new Date(event.start_time).getTime() > Date.now()
  ) ?? [];
  const events = upcomingEvents.slice(0, 5);

  // Stories carousel state
  const STORIES_PER_PAGE = 15;
  const [storyPage, setStoryPage] = useState(0);
  const storiesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredStory, setHoveredStory] = useState<number | null>(null);

  const totalStoryPages = Math.ceil(allStories.length / STORIES_PER_PAGE);
  const visibleStories = allStories.slice(0, (storyPage + 1) * STORIES_PER_PAGE);

  const updateScrollButtons = useCallback(() => {
    const el = storiesScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scrollStories = useCallback((direction: 'left' | 'right') => {
    const el = storiesScrollRef.current;
    if (!el) return;
    const cardWidth = 340;
    const scrollAmount = cardWidth * 3;
    el.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = storiesScrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [updateScrollButtons, visibleStories.length]);

  const loadMoreStories = () => {
    if (storyPage < totalStoryPages - 1) {
      setStoryPage(prev => prev + 1);
      // Scroll to reveal new stories after a brief delay
      setTimeout(() => {
        const el = storiesScrollRef.current;
        if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      }, 100);
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  // Auto-advance stories
  useEffect(() => {
    if (activeStoryIndex === null) return;
    
    const currentStory = visibleStories[activeStoryIndex];
    const mediaCount = currentStory?.media?.length || 1;

    const timer = setTimeout(() => {
      if (activeMediaIndex < mediaCount - 1) {
        setActiveMediaIndex(prev => prev + 1);
      } else {
        setActiveStoryIndex(prev => {
          if (prev === null) return null;
          if (prev < visibleStories.length - 1) {
            setActiveMediaIndex(0);
            return prev + 1;
          } else {
            return null;
          }
        });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [activeStoryIndex, activeMediaIndex, visibleStories]);

  return (
    <div className="bg-[#000000] min-h-screen text-white selection:bg-[#800020] selection:text-white pb-32">
      
      {/* 1. CINEMATIC HERO */}
      <section className="relative w-full h-[90vh] min-h-[700px] flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Subtle slow zooming background */}
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            className="w-full h-full relative"
          >
            <Image quality={90} 
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=2400&q=80"
              alt="Premium Cafe Experience"
              fill
              sizes="100vw"
              className="object-cover opacity-40 mix-blend-luminosity"
              priority
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black z-0" />
        </div>

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 text-center mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-white/80 mb-6 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-[#800020]" /> Welcome to Krown
            </span>
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-[6rem] font-black text-white tracking-tight leading-[1.05] mb-6 drop-shadow-2xl">
              Elevate Your <br className="hidden md:block"/> 
              <span className="italic text-[#800020]">Nightlife</span> Standard.
            </h1>
            <p className="text-lg md:text-xl text-white/50 font-light max-w-2xl mx-auto mb-10">
              Discover unparalleled café experiences, exclusive events, and premium rewards. 
              The city's best, curated just for you.
            </p>

            {/* Premium Search Bar */}
            <div className="w-full max-w-3xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#800020]/20 via-white/5 to-[#800020]/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500 opacity-50" />
              <Link href="/search" className="block relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-[2rem] p-3 md:p-4 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.02] shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 px-4 py-2">
                  <Search className="w-6 h-6 text-white/40" />
                  <div className="flex-1 text-left">
                    <p className="text-white/80 text-lg">Where are we going tonight?</p>
                    <p className="text-white/40 text-sm">Search venues, events, or vibes...</p>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white/70 group-hover:bg-[#800020] group-hover:text-white group-hover:border-[#800020] transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Constrainer */}
      <div className="max-w-[1400px] mx-auto px-6 space-y-14 md:space-y-20">
        
        {/* 2. THE NIGHTLIFE JOURNAL — Rounded Story Bubbles */}
        {visibleStories.length > 0 && (
          <SectionReveal>
            {/* Section Header */}
            <div className="flex items-end justify-between gap-6 mb-10">
              <div className="flex items-start gap-5">
                <div>
                  <p className="text-[#800020] text-xs font-bold tracking-[0.3em] uppercase mb-2">Stories &middot; Editorial</p>
                  <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white tracking-tight">The Nightlife Journal</h2>
                  <p className="text-white/40 text-base mt-2 font-light max-w-md">
                    Swipe through immersive stories from the city&apos;s after-dark culture.
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Stories Track */}
            <div className="relative -mx-6">
              {/* Left fade */}
              {canScrollLeft && <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />}
              {/* Right fade */}
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />

              <div
                ref={storiesScrollRef}
                className="flex gap-8 md:gap-14 overflow-x-auto px-6 pb-6 pt-4 scroll-smooth mx-auto max-w-full [justify-content:safe_center]"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {visibleStories.map((story, i) => (
                  <motion.div
                    key={story?.story_id || i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-10px' }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                    onClick={() => { setActiveStoryIndex(i); setActiveMediaIndex(0); }}
                    onMouseEnter={() => setHoveredStory(i)}
                    onMouseLeave={() => setHoveredStory(null)}
                    className="relative flex-none cursor-pointer group flex flex-col items-center justify-start gap-4 md:gap-5 w-[100px] md:w-[150px]"
                  >
                    {/* Premium Circle Container */}
                    <div className="relative rounded-full p-[4px] md:p-[5px] bg-gradient-to-tr from-white/10 via-white/5 to-[#800020]/30 group-hover:from-[#800020] group-hover:via-[#ff3355] group-hover:to-[#800020] transition-colors duration-500 shadow-2xl">
                      <div className="relative w-[90px] h-[90px] md:w-[140px] md:h-[140px] rounded-full overflow-hidden border-[3px] md:border-[4px] border-[#0a0a0a] bg-[#111] group-hover:scale-[0.96] transition-transform duration-300">
                        <Image
                          src={story?.cover_img || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80'}
                          alt={story?.title || 'Story'}
                          fill
                          sizes="(max-width: 768px) 90px, 140px"
                          className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                        />
                        {/* Play Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                           <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                              <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-1" />
                           </div>
                        </div>
                      </div>

                      {/* Media Count Badge */}
                      {story?.media && story.media.length > 1 && (
                        <div className="absolute bottom-0 right-0 md:bottom-1 md:right-1 z-10">
                          <span className="flex items-center justify-center h-6 md:h-6 px-2.5 md:px-2.5 rounded-full bg-[#800020] border-[3px] border-[#0a0a0a] text-[11px] md:text-[12px] font-bold text-white shadow-lg">
                            {story.media.length}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Text Area */}
                    <div className="text-center w-full px-1 md:px-2">
                      <h3 className="font-semibold text-[12px] md:text-[14px] leading-tight text-white/90 group-hover:text-white transition-colors line-clamp-2">
                        {story?.title || `Story ${i + 1}`}
                      </h3>
                      <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-2">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#800020] animate-pulse" />
                        <p className="text-white/50 text-[9px] md:text-[11px] font-bold tracking-wider uppercase">
                          {formatTimeAgo(story?.created_at)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Show More Bubble */}
                {storyPage < totalStoryPages - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="relative flex-none cursor-pointer group flex flex-col items-center justify-start gap-5 w-[110px] md:w-[200px]"
                    onClick={(e) => { e.stopPropagation(); loadMoreStories(); }}
                  >
                    <div className="relative rounded-full p-[4px] md:p-[5px] bg-white/[0.05] group-hover:bg-gradient-to-tr group-hover:from-white/20 group-hover:via-white/30 group-hover:to-white/20 transition-all duration-500">
                      <div className="relative w-[100px] h-[100px] md:w-[180px] md:h-[180px] rounded-full flex flex-col items-center justify-center border-[3px] md:border-[4px] border-[#0a0a0a] bg-[#111] group-hover:scale-[0.96] transition-transform duration-300 gap-2">
                        <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white/40 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <span className="block text-white/50 text-[13px] md:text-[16px] font-bold tracking-widest uppercase mb-1.5 group-hover:text-white transition-colors">More</span>
                      <span className="block text-white/30 text-[10px] md:text-[12px] font-medium">
                        +{allStories.length - visibleStories.length} stories
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Page indicator */}
            {totalStoryPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                {Array.from({ length: totalStoryPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStoryPage(i)}
                    className={`h-1.5 rounded-full transition-all duration-400 ${
                      i <= storyPage
                        ? 'bg-[#800020] w-5'
                        : 'bg-white/10 w-1.5 hover:bg-white/25'
                    }`}
                  />
                ))}
                <span className="text-white/20 text-[10px] ml-2 font-medium">
                  {visibleStories.length} / {allStories.length}
                </span>
              </div>
            )}
          </SectionReveal>
        )}

        {/* 3. THE MOOD EXPLORER */}
        <SectionReveal>
          <div className="flex flex-col mb-10 gap-2">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold tracking-tight text-white">What's on your mind?</h2>
            <p className="text-white/50 text-lg md:text-xl font-light">Select exactly how you want to feel today.</p>
          </div>
          
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: "1", label: "I want to meet", emphasis: "new people", image: "/vibes/Wildvibe.png", search: "social meetup" },
              { id: "2", label: "I want a", emphasis: "chill night", image: "/vibes/Cozyvibe.png", search: "chill lounge" },
              { id: "3", label: "Take me on a", emphasis: "date night", image: "/vibes/Datenight.png", search: "date night" },
              { id: "4", label: "I want to", emphasis: "dance & party", image: "/vibes/ExploreDance.png", search: "party dance" },
              { id: "5", label: "Show me some", emphasis: "live music", image: "/vibes/ExploreCup.png", search: "live music" },
            ].map((card, i) => (
              <Link key={card.id} href={`/events?search=${encodeURIComponent(card.search)}`}>
                <motion.div 
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex-none w-[200px] h-[260px] md:w-[280px] md:h-[340px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/[0.05] transition-all duration-500 hover:border-white/20 hover:shadow-[0_15px_40px_-10px_rgba(139,26,58,0.5)]"
                  style={{
                    background: 'linear-gradient(135deg, #2A0812 0%, #1A050B 50%, #0D0205 100%)'
                  }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(139,26,58,0.2)_0%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                    <div className="z-10">
                      <h3 className="text-white/80 text-sm md:text-base font-medium leading-tight mb-1">
                        {card.label}
                      </h3>
                      <p className="text-white text-2xl md:text-3xl font-playfair font-bold italic tracking-tight group-hover:text-[#ff6b8b] transition-colors duration-300">
                        {card.emphasis}
                      </p>
                    </div>
                    <div className="relative w-full h-[120px] md:h-[180px] mt-auto flex items-end justify-end">
                      <Image 
                        src={card.image} 
                        alt={card.emphasis} 
                        fill
                        className="object-contain object-right-bottom drop-shadow-2xl group-hover:scale-110 transition-transform duration-700 ease-out origin-bottom-right" 
                      />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </SectionReveal>

        {/* 4. TRENDING PLACES (Editorial Layout) */}
        {withOffers.length > 0 && (
          <SectionReveal>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[#800020] font-semibold tracking-[0.2em] text-xs uppercase">Featured Collection</span>
                <h2 className="font-playfair text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">Places with Perks</h2>
                <p className="text-white/50 text-lg md:text-xl font-light">Exclusive discounts and priority seating available right now.</p>
              </div>
              <Link href="/cafes" className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all duration-300 group shrink-0">
                <span className="text-sm font-medium">View All Venues</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              {withOffers.map((cafe, i) => (
                <motion.div 
                  key={cafe.cafe_id} 
                  initial={{ opacity: 0, x: 20 }} 
                  whileInView={{ opacity: 1, x: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
                  className="flex-none w-[260px] md:w-[320px] transition-transform duration-500 hover:scale-[1.02]"
                >
                  <CafeCard cafe={cafe} aspectRatio="tall" />
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        )}

        {/* 5. UPCOMING EVENTS */}
        {events.length > 0 && (
          <SectionReveal className="-mt-4 md:-mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-t border-white/[0.05] pt-12 md:pt-20">
              <div className="flex flex-col gap-2">
                <span className="text-[#800020] font-semibold tracking-[0.2em] text-xs uppercase">Curated For You</span>
                <h2 className="font-playfair text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">Upcoming Agenda</h2>
                <p className="text-white/50 text-lg md:text-xl font-light">The most anticipated gatherings happening around you.</p>
              </div>
              <Link href="/events" className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all duration-300 group shrink-0">
                <span className="text-sm font-medium tracking-wide">Browse Agenda</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden items-stretch" style={{ scrollbarWidth: 'none' }}>
              {events.map((event, i) => (
                <motion.div 
                  key={event.event_id} 
                  initial={{ opacity: 0, x: 20 }} 
                  whileInView={{ opacity: 1, x: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1], duration: 0.6 }} 
                  className="flex-none w-[280px] md:w-[350px] transition-transform duration-500 hover:scale-[1.02]"
                >
                    <EventCardCompact event={event} className="h-full" />
                </motion.div>
              ))}
              {/* See More Card */}
              {upcomingEvents.length > 5 && (
                <Link href="/events" className="flex-none w-[200px] md:w-[250px] h-full flex group my-auto py-4">
                  <div className="w-full h-[calc(100%-2rem)] min-h-[300px] rounded-2xl border border-white/[0.05] bg-white/[0.02] flex flex-col items-center justify-center gap-4 transition-all duration-500 group-hover:bg-[#800020]/10 group-hover:border-[#800020]/30 group-hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#800020] transition-colors duration-500">
                      <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                      <span className="block text-white/80 font-semibold mb-1">See All Events</span>
                      <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">Discover {upcomingEvents.length} more</span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </SectionReveal>
        )}

      {/* 6. KROWN PASS PLATINUM PRESENTATION */}
        <SectionReveal>
          <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#111] via-[#050505] to-[#1a0006] border border-white/5 p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 group">
            {/* Ambient metallic effect */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-8 h-8 text-[#800020]" />
                <span className="text-xl font-medium tracking-[0.2em] text-white/70 uppercase">Krown Pass</span>
              </div>
              <h2 className="font-playfair text-4xl md:text-6xl font-bold leading-tight mb-6">
                The key to the city's <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#800020] to-[#ff3355]">hidden gems.</span>
              </h2>
              <p className="text-lg text-white/60 mb-10 leading-relaxed font-light">
                Skip the queues, unlock massive 15% discounts, and get priority access to the most exclusive events in town. Your nightlife, upgraded.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/krown-pass">
                  <button className="px-8 py-4 bg-white text-black rounded-full font-semibold text-sm hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
                    Unlock Premium <Crown size={16} />
                  </button>
                </Link>
                <Link href="/krown-pass#benefits">
                  <button className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-medium text-sm hover:bg-white/10 transition-colors">
                    See Benefits
                  </button>
                </Link>
              </div>
            </div>

            {/* Apple Card style visual representation */}
            <div className="relative z-10 w-full max-w-sm aspect-[1.58/1] rounded-2xl bg-gradient-to-tr from-[#1a1a1a] via-[#2a2a2a] to-[#404040] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 p-6 flex flex-col justify-between transform perspective-[1000px] rotate-y-[-10deg] rotate-x-[5deg] group-hover:rotate-y-0 group-hover:rotate-x-0 transition-transform duration-700 ease-out">
              <div className="flex justify-between items-start">
                <Crown className="w-8 h-8 text-white/80" />
                <span className="text-white/40 tracking-widest text-sm">ELITE</span>
              </div>
              <div>
                <p className="text-white/90 font-mono tracking-[0.3em] text-lg mb-2">**** **** **** 9021</p>
                <div className="flex justify-between items-end">
                  <p className="text-white/60 text-sm tracking-wider uppercase font-medium">Member</p>
                  <p className="text-[#800020] font-bold text-xl font-playfair italic">Krown</p>
                </div>
              </div>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ transform: 'translateZ(1px)' }} />
            </div>
          </div>
        </SectionReveal>

        {/* Full Screen Story Viewer */}
      {activeStoryIndex !== null && visibleStories && visibleStories.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          onClick={() => setActiveStoryIndex(null)}
        >
          {/* Close button - Top right */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveStoryIndex(null);
            }}
            className="absolute top-6 right-6 md:top-10 md:right-10 z-[110] text-white hover:text-white p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-300 hover:scale-110 active:scale-95 border border-white/20"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Desktop visible Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (activeMediaIndex > 0) {
                setActiveMediaIndex(prev => prev - 1);
              } else if (activeStoryIndex > 0) {
                setActiveStoryIndex(prev => prev! - 1);
                const prevStoryMediaCount = visibleStories[activeStoryIndex - 1]?.media?.length || 1;
                setActiveMediaIndex(prevStoryMediaCount - 1);
              }
            }}
            className={`hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-[110] w-14 h-14 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 ${
              (activeStoryIndex === 0 && activeMediaIndex === 0) ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:border-white/40'
            }`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentMediaCount = visibleStories[activeStoryIndex]?.media?.length || 1;
              if (activeMediaIndex < currentMediaCount - 1) {
                setActiveMediaIndex(prev => prev + 1);
              } else if (activeStoryIndex < visibleStories.length - 1) {
                setActiveStoryIndex(prev => prev! + 1);
                setActiveMediaIndex(0);
              } else {
                setActiveStoryIndex(null);
              }
            }}
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-[110] w-14 h-14 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer hover:border-white/40"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Main Story Content Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full max-w-[420px] max-h-[850px] md:rounded-[24px] overflow-hidden shadow-2xl border md:border-white/10 flex flex-col justify-between bg-[#0A0A0A]" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Invisible Mobile Tap Zones */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-[40%] z-[80] cursor-pointer"
              onClick={() => {
                if (activeMediaIndex > 0) {
                  setActiveMediaIndex(prev => prev - 1);
                } else if (activeStoryIndex > 0) {
                  setActiveStoryIndex(prev => prev! - 1);
                  const prevStoryMediaCount = visibleStories[activeStoryIndex - 1]?.media?.length || 1;
                  setActiveMediaIndex(prevStoryMediaCount - 1);
                }
              }}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-[60%] z-[80] cursor-pointer"
              onClick={() => {
                const currentMediaCount = visibleStories[activeStoryIndex]?.media?.length || 1;
                if (activeMediaIndex < currentMediaCount - 1) {
                  setActiveMediaIndex(prev => prev + 1);
                } else if (activeStoryIndex < visibleStories.length - 1) {
                  setActiveStoryIndex(prev => prev! + 1);
                  setActiveMediaIndex(0);
                } else {
                  setActiveStoryIndex(null);
                }
              }}
            />

            {/* Progress Bars */}
            <div className="absolute top-0 left-0 w-full z-[105] p-3 md:p-5 flex gap-1.5">
              {Array.from({ length: visibleStories[activeStoryIndex]?.media?.length || 1 }).map((_, i) => (
                <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  {i < activeMediaIndex ? (
                    <div className="h-full bg-white w-full" />
                  ) : i === activeMediaIndex ? (
                    <motion.div 
                      key={activeStoryIndex + '-' + activeMediaIndex} 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 10, ease: "linear" }}
                      className="h-full bg-white" 
                    />
                  ) : (
                    <div className="h-full bg-white w-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Smart Viewer: Shows Native Video or Optimized Image for current media index */}
            <div className="absolute inset-0 w-full h-full z-0">
              {visibleStories[activeStoryIndex]?.media?.[activeMediaIndex]?.type === 'video' ? (
                <video 
                  src={visibleStories[activeStoryIndex]?.media[activeMediaIndex]?.uri}
                  autoPlay 
                  playsInline 
                  muted 
                  loop 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image 
                  src={visibleStories[activeStoryIndex]?.media?.[activeMediaIndex]?.uri || visibleStories[activeStoryIndex]?.cover_img || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'} 
                  alt={visibleStories[activeStoryIndex]?.title || 'Story segment'}
                  fill
                  sizes="100vw, (min-width: 500px) 500px"
                  className="object-cover"
                  priority
                />
              )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 z-10 pointer-events-none" />

            <div className="px-6 pb-12 md:pb-16 mt-auto z-[105] pointer-events-none">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block px-3 py-1 bg-[#800020] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">Krown Story</span>
                <span className="text-white/60 text-xs font-medium">{formatTimeAgo(visibleStories[activeStoryIndex]?.created_at)}</span>
              </div>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">{visibleStories[activeStoryIndex]?.title}</h2>
              <p className="text-white/90 text-sm md:text-base leading-relaxed drop-shadow-md pb-2 pt-2 pointer-events-auto">
                {visibleStories[activeStoryIndex]?.description || 'Swipe to see more updates, exclusive nightlife drops, and premium Krown events happening near you.'}
              </p>
            </div>
          </motion.div>
        </div>
      )}      </div>
    </div>
  );
}
