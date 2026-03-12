
'use client';

import React, { useState, useMemo, useCallback, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, ChevronLeft, Sparkles, Calendar } from 'lucide-react';
import { EventCardCompact } from '@/components/event/EventCardCompact';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useEvents, useFeaturedEvents } from '@/queries/useEvents';
import type { EventFilters } from '@/types/event';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

function EventsContent() {
  const searchParams = useSearchParams();
  const urlSearchParams = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearchParams);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [upcomingLimit, setUpcomingLimit] = useState(15);
  const [pastLimit, setPastLimit] = useState(15);
  const [exclusiveLimit, setExclusiveLimit] = useState(15);

  const apiFilters: EventFilters = {
    search: search || urlSearchParams || undefined,
  };

  const { data: featuredEvents = [] } = useFeaturedEvents();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useEvents(apiFilters);
  
  const rawEvents = data?.pages.flatMap((p) => p.events) ?? [];

  const { allUpcoming, allPast } = useMemo(() => {
    const now = Date.now();
    const isPast = (e: any) => e.end_time ? new Date(e.end_time).getTime() < now : new Date(e.start_time).getTime() < now;
    return {
      allUpcoming: rawEvents.filter(e => !isPast(e)),
      allPast: rawEvents.filter(e => isPast(e)).sort((a, b) => {
        const timeA = a.end_time ? new Date(a.end_time).getTime() : new Date(a.start_time).getTime();
        const timeB = b.end_time ? new Date(b.end_time).getTime() : new Date(b.start_time).getTime();
        return timeB - timeA;
      })
    };
  }, [rawEvents]);

  const topUpcoming = useMemo(() => {
    return [...allUpcoming]
      .sort((a, b) => (b.confirmed_registrations || b.current_registrations || 0) - (a.confirmed_registrations || a.current_registrations || 0))
      .slice(0, 5);
  }, [allUpcoming]);

  // Carousel events: deduplicated unique events for the top carousel
  const carouselEvents = useMemo(() => {
    const seen = new Set<string>();
    const unique: typeof rawEvents = [];
    for (const e of rawEvents) {
      if (!seen.has(e.event_id)) {
        seen.add(e.event_id);
        unique.push(e);
      }
      if (unique.length >= 10) break;
    }
    return unique;
  }, [rawEvents]);

  const scrollCarousel = useCallback((dir: 'left' | 'right') => {
    if (dir === 'right') {
      setCarouselIndex(prev => (prev + 1) % Math.max(carouselEvents.length, 1));
    } else {
      setCarouselIndex(prev => (prev - 1 + carouselEvents.length) % Math.max(carouselEvents.length, 1));
    }
  }, [carouselEvents.length]);

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (carouselEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % carouselEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselEvents.length]);

  return (
    <div className="min-h-screen bg-[#050505]">

      {/* ═══════════════════════════════════════════════════════
          1. EVENTS CAROUSEL — Content-first, full width
         ═══════════════════════════════════════════════════════ */}
      {carouselEvents.length > 0 && (
        <section className="relative pt-6 pb-10 md:pt-10 md:pb-14">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="font-playfair text-4xl md:text-5xl font-bold text-white mb-2"
                >
                  Events
                </motion.h1>
                <p className="text-white/40 text-sm md:text-base">Discover what&apos;s happening around you</p>
              </div>
              {/* Carousel nav arrows */}
              <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={() => scrollCarousel('left')} 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => scrollCarousel('right')} 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Single card carousel — 70% width, 60vh height */}
            <div className="flex items-center justify-center w-full">
              <AnimatePresence mode="wait">
                {carouselEvents[carouselIndex] && (() => {
                  const event = carouselEvents[carouselIndex];
                  return (
                    <Link 
                      key={event.event_id} 
                      href={`/events/${event.slug ?? event.event_id}`}
                      className="block w-[85%] md:w-[70%] group"
                    >
                      <motion.div
                        key={event.event_id}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="relative h-[55vh] md:h-[60vh] max-h-[600px] rounded-2xl overflow-hidden border border-white/[0.05] hover:border-[#800020]/40 transition-all duration-500"
                      >
                        <Image
                          src={event.cover_image ?? '/placeholder-event.jpg'}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="70vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        
                        {/* Price */}
                        <div className="absolute top-4 right-4">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-lg ${event.is_paid ? 'bg-black/70 text-white backdrop-blur-md border border-white/10' : 'bg-green-500/90 text-white'}`}>  
                            {event.is_paid ? `₹${event.base_price}` : 'Free'}
                          </span>
                        </div>

                        {/* Category */}
                        {event.category && (
                          <div className="absolute top-4 left-4">
                            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#800020]/80 text-white uppercase tracking-wider backdrop-blur-sm border border-white/10">
                              {event.category}
                            </span>
                          </div>
                        )}

                        {/* Bottom content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
                            {new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' • '}
                            {new Date(event.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <h3 className="font-playfair text-2xl md:text-4xl font-bold text-white mb-3 leading-tight line-clamp-2 group-hover:text-[#ff6b81] transition-colors duration-300">
                            {event.title}
                          </h3>
                          <p className="text-white/50 text-sm md:text-base flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />
                            {event.venue_name}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })()}
              </AnimatePresence>
            </div>

            {/* Carousel dots */}
            {carouselEvents.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                {carouselEvents.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`rounded-full transition-all duration-300 ${i === carouselIndex ? 'w-6 h-2 bg-[#800020]' : 'w-2 h-2 bg-white/15 hover:bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          2. UPCOMING EVENTS — Full-width list
         ═══════════════════════════════════════════════════════ */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-12">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8 border-t border-white/[0.06] pt-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={18} className="text-[#800020]" />
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white">Upcoming Events</h2>
            </div>
            <p className="text-white/40 text-sm">Don&apos;t miss out on what&apos;s coming next</p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={16} className="text-white/30" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search upcoming events..."
              className="w-full bg-[#0A0A0A] border border-white/[0.05] rounded-xl pl-11 pr-10 py-3 text-sm text-white focus:outline-none focus:border-[#800020]/50 focus:ring-1 focus:ring-[#800020]/50 transition-all placeholder:text-white/30"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-[#0A0A0A] border border-white/[0.05]">
                <Skeleton className="w-full md:w-[35%] h-[200px] rounded-xl shrink-0" />
                <div className="flex-1 py-4 flex flex-col justify-center space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allUpcoming.length === 0 ? (
          <div className="py-12">
            <EmptyState icon="Calendar" title="No upcoming events" subtitle="Check back soon for new happenings." />
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            <AnimatePresence mode="popLayout">
              {allUpcoming.slice(0, upcomingLimit).map((event, i) => (
                <motion.div 
                  layout
                  key={event.event_id} 
                  initial={{ opacity: 0, scale: 0.98, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.98, y: -20 }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                  className="flex-none w-[320px] md:w-[380px]"
                >
                  <EventCardCompact event={event} className="h-full" />
                </motion.div>
              ))}
              {(upcomingLimit < allUpcoming.length || hasNextPage) && (
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-none w-[160px] md:w-[200px] flex items-stretch py-2 pr-4">
                  <button 
                    onClick={() => {
                      setUpcomingLimit(prev => prev + 15);
                      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
                    disabled={isFetchingNextPage}
                    className="w-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-[#111] border border-white/[0.05] rounded-2xl hover:border-[#800020]/40 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#800020]/20 group-hover:scale-110 transition-all">
                      {isFetchingNextPage ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[#800020] border-t-transparent animate-spin" />
                      ) : (
                        <ChevronRight size={20} className="text-white/40 group-hover:text-[#800020]" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">
                      {isFetchingNextPage ? 'Loading...' : 'See More'}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          3. PAST EVENTS — Latest 10
         ═══════════════════════════════════════════════════════ */}
      {allPast.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-12">
          <div className="border-t border-white/[0.06] pt-10">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={18} className="text-white/40" />
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white">Past Events</h2>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 uppercase tracking-widest">Latest 10</span>
            </div>
            <p className="text-white/40 text-sm mb-8">Recently concluded events you may have missed</p>

            <div className="flex gap-5 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="popLayout">
                {allPast
                  .slice(0, pastLimit)
                  .map((event, i) => (
                    <motion.div 
                      layout
                      key={event.event_id} 
                      initial={{ opacity: 0, scale: 0.98, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.98, y: -20 }}
                      transition={{ duration: 0.4, delay: i * 0.04, ease: "easeOut" }}
                      className="flex-none w-[320px] md:w-[380px] opacity-80 hover:opacity-100 transition-opacity duration-300"
                    >
                      <EventCardCompact event={event} className="h-full" />
                    </motion.div>
                  ))}
                  {(pastLimit < allPast.length || hasNextPage) && (
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-none w-[160px] md:w-[200px] flex items-stretch py-2 pr-4">
                      <button 
                        onClick={() => {
                          setPastLimit(prev => prev + 15);
                          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                        }}
                        disabled={isFetchingNextPage}
                        className="w-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-[#111] border border-white/[0.05] rounded-2xl hover:border-[#800020]/40 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#800020]/20 group-hover:scale-110 transition-all">
                          {isFetchingNextPage ? (
                            <div className="w-5 h-5 rounded-full border-2 border-[#800020] border-t-transparent animate-spin" />
                          ) : (
                            <ChevronRight size={20} className="text-white/40 group-hover:text-[#800020]" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">
                          {isFetchingNextPage ? 'Loading...' : 'See More'}
                        </span>
                      </button>
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          4. YOUR EXCLUSIVE — Top registered upcoming events
         ═══════════════════════════════════════════════════════ */}
      {topUpcoming.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-20">
          <div className="border-t border-white/[0.06] pt-10">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={18} className="text-[#800020]" />
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white">Your Exclusive</h2>
            </div>
            <p className="text-white/40 text-sm mb-8">Top registered upcoming events you can't miss</p>

            <div className="flex gap-5 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="popLayout">
                {topUpcoming.map((event, i) => (
                  <motion.div 
                    layout
                    key={event.event_id} 
                    initial={{ opacity: 0, scale: 0.98, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.98, y: -20 }}
                    transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                    className="flex-none w-[320px] md:w-[380px] opacity-80 hover:opacity-100 transition-opacity duration-300"
                  >
                    <EventCardCompact event={event} className="h-full" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventsContent />
    </Suspense>
  );
}
