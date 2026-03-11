'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, ArrowRight, Sparkles, Play, Crown, X } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { EventCard } from '@/components/event/EventCard';
import { KROWN_VIBES } from '@/lib/constants';
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
  const dbStories = homeData?.stories?.slice(0, 4) ?? [];
  const defaultStories: any[] = [
    { story_id: 'd1', title: 'The Rise of Chennai Speakeasies', description: 'Hidden doors, crafted cocktails, and jazz all night.', cover_img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80' },
    { story_id: 'd2', title: 'Late Night Coffee Run', description: 'Best spots open past 2 AM.', cover_img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80' },
    { story_id: 'd3', title: 'Rooftop Season is Here', description: 'Cool breezes and panoramic views.', cover_img: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80' },
    { story_id: 'd4', title: 'Weekend Brunch Guide', description: 'Pancakes, mimosas, and good vibes.', cover_img: 'https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?w=800&q=80' }
  ];
  const stories = dbStories.length > 0 ? dbStories : defaultStories;
  const events = eventsData?.pages[0]?.events?.slice(0, 3) ?? [];

  // Auto-advance stories
  useEffect(() => {
    if (activeStoryIndex === null || !dbStories) return;
    
    const currentStory = stories[activeStoryIndex];
    const mediaCount = currentStory?.media?.length || 1;

    const timer = setTimeout(() => {
      if (activeMediaIndex < mediaCount - 1) {
        // Next slide in current story
        setActiveMediaIndex(prev => prev + 1);
      } else {
        // Next story group
        setActiveStoryIndex(prev => {
          if (prev === null) return null;
          if (prev < stories.slice(0, 8).length - 1) {
            setActiveMediaIndex(0); // Reset for new story
            return prev + 1;
          } else {
            return null; // Close at end
          }
        });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [activeStoryIndex, activeMediaIndex, dbStories, stories]);

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
            <Image 
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
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70 tracking-tight leading-[1.1] mb-6">
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
              <Link href="/search" className="block relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 md:p-3 hover:border-white/20 hover:bg-black/60 transition-all duration-300">
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
      <div className="max-w-[1400px] mx-auto px-6 space-y-32">
        
        {/* 2. THE VIBE BENTO (Apple Style Grid) */}
        <SectionReveal>
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="font-playfair text-4xl font-bold tracking-tight text-white mb-3">Curated by Vibe</h2>
              <p className="text-white/50 text-lg">Select exactly how you want to feel today.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {KROWN_VIBES.map((vibe, i) => (
              <Link key={vibe.id} href={`/cafes?vibe=${vibe.id}`}>
                <motion.div 
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/5 bg-[#0A0A0A] flex flex-col justify-end p-5 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_40px_rgba(128,0,32,0.15)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent z-10" />
                  {/* Subtle color glow based on vibe color */}
                  <div 
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" 
                    style={{ backgroundColor: vibe.color }}
                  />
                  
                  <div className="relative z-20 flex flex-col gap-2">
                    <span className="text-4xl filter drop-shadow-md mb-2">{vibe.emoji}</span>
                    <span className="font-semibold text-white/90 group-hover:text-white transition-colors">{vibe.label}</span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </SectionReveal>

        {/* 3. KROWN PASS PLATINUM PRESENTATION */}
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

        {/* 4. TRENDING PLACES (Editorial Layout) */}
        {withOffers.length > 0 && (
          <SectionReveal>
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
              <div className="max-w-xl">
                <span className="text-[#800020] font-semibold tracking-wider text-sm uppercase mb-2 block">Featured Collection</span>
                <h2 className="font-playfair text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Places with Perks</h2>
                <p className="text-white/50 text-xl font-light">Exclusive discounts and priority seating available right now.</p>
              </div>
              <Link href="/cafes" className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors group">
                <span className="text-sm font-medium">View All Venues</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {withOffers.map((cafe, i) => (
                <motion.div key={cafe.cafe_id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <CafeCard cafe={cafe} aspectRatio="tall" />
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        )}

                {/* 5. CINEMATIC STORIES (Full bleed grid) */}
        {stories.length >= 3 && (
          <SectionReveal>
            <div className="flex items-center gap-3 mb-10">
              <Play className="w-6 h-6 text-[#800020] fill-[#800020]" />
              <h2 className="font-playfair text-4xl font-bold text-white">The Nightlife Journal</h2>
            </div>
            
                       <div className="flex overflow-x-auto gap-6 pb-12 pt-4 w-full scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {stories.slice(0, 8).map((story, i) => (
                <div 
                  key={story?.story_id || i} 
                  onClick={() => { setActiveStoryIndex(i); setActiveMediaIndex(0); }}
                  className="relative flex-none w-[280px] md:w-[320px] h-[400px] md:h-[460px] rounded-2xl overflow-hidden cursor-pointer group snap-center border border-white/5 bg-[#0A0A0A] shadow-2xl"
                >
                  <Image 
                    src={story?.cover_img || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'} 
                    alt={story?.title || 'Story'}
                    fill
                    sizes="(max-width: 768px) 280px, 320px"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90 group-hover:to-black/80 transition-all duration-500 z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#800020]/90 via-[#800020]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
                  
                  <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
                    <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                        <span className="text-amber-500 text-[10px] font-bold tracking-widest uppercase">Featured</span>
                      </div>
                      <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-2 leading-tight drop-shadow-md">
                        {story?.title || `Story ${i + 1}`}
                      </h3>
                      <div className="overflow-hidden max-h-0 group-hover:max-h-24 transition-all duration-500 ease-in-out">
                        <p className="text-white/80 text-sm line-clamp-2 mt-2 font-light">
                          {story?.description || 'Discover the most exclusive nightlife experiences and insider stories.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionReveal>
        )}

        {/* 6. UPCOMING EVENTS */}
        {events.length > 0 && (
          <SectionReveal>
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-t border-white/10 pt-20">
              <div>
                <h2 className="font-playfair text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Tonight\'s Agenda</h2>
                <p className="text-white/50 text-xl font-light">The most anticipated gatherings happening around you.</p>
              </div>
              <Link href="/events" className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#800020] text-white hover:bg-[#a00028] transition-colors group">
                <span className="text-sm font-medium">All Events</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((event, i) => (
                <motion.div key={event.event_id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        )}

      {/* Full Screen Story Viewer */}
      {activeStoryIndex !== null && stories && stories.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button 
            onClick={() => setActiveStoryIndex(null)}
            className="absolute top-6 right-6 md:top-10 md:right-10 z-[110] text-white hover:text-white/70 p-2 bg-black/20 backdrop-blur-md rounded-full transition-colors"
          >
            <X className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          {/* Previous/Next Click Areas */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-[30%] z-[120] cursor-w-resize md:hover:bg-white/5 transition-colors"
            onClick={() => {
              if (activeMediaIndex > 0) {
                setActiveMediaIndex(prev => prev - 1);
              } else if (activeStoryIndex > 0) {
                setActiveStoryIndex(prev => prev! - 1);
                const prevStoryMediaCount = stories[activeStoryIndex - 1]?.media?.length || 1;
                setActiveMediaIndex(prevStoryMediaCount - 1);
              }
            }}
          />
          <div 
            className="absolute right-0 top-0 bottom-0 w-[70%] z-[120] cursor-e-resize md:hover:bg-white/5 transition-colors"
            onClick={() => {
              const currentMediaCount = stories[activeStoryIndex]?.media?.length || 1;
              if (activeMediaIndex < currentMediaCount - 1) {
                setActiveMediaIndex(prev => prev + 1);
              } else if (activeStoryIndex < stories.slice(0, 8).length - 1) {
                setActiveStoryIndex(prev => prev! + 1);
                setActiveMediaIndex(0);
              } else {
                setActiveStoryIndex(null);
              }
            }}
          />

          <div className="relative w-full h-full max-w-[500px] max-h-[900px] md:rounded-[24px] overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full z-[105] p-4 flex gap-2">
              {Array.from({ length: stories[activeStoryIndex]?.media?.length || 1 }).map((_, i) => (
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
            {stories[activeStoryIndex]?.media?.[activeMediaIndex]?.type === 'video' ? (
              <video 
                src={stories[activeStoryIndex]?.media[activeMediaIndex]?.uri}
                autoPlay 
                playsInline 
                muted 
                loop 
                className="absolute inset-0 w-full h-full object-cover -z-10"
              />
            ) : (
              <Image 
                src={stories[activeStoryIndex]?.media?.[activeMediaIndex]?.uri || stories[activeStoryIndex]?.cover_img || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'} 
                alt={stories[activeStoryIndex]?.title || 'Story segment'}
                fill
                sizes="100vw, (min-width: 500px) 500px"
                className="object-cover -z-10"
                priority
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 -z-10" />

            <div className="px-6 pb-12 md:pb-16 mt-auto z-[105] pointer-events-none">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block px-3 py-1 bg-[#800020] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">Krown Story</span>
                <span className="text-white/60 text-xs font-medium">Recently</span>
              </div>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">{stories[activeStoryIndex]?.title}</h2>
              <p className="text-white/90 text-sm md:text-base leading-relaxed drop-shadow-md pb-2 pt-2 pointer-events-auto">
                
                {stories[activeStoryIndex]?.description || 'Swipe to see more updates, exclusive nightlife drops, and premium Krown events happening near you.'}
              
              </p>
            </div>
          </div>
        </div>
      )}      </div>
    </div>
  );
}
