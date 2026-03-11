
'use client';

import React, { useState, useMemo, Suspense, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight } from 'lucide-react';
import { EventCard } from '@/components/event/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useEvents, useFeaturedEvents } from '@/queries/useEvents';
import type { EventFilters } from '@/types/event';
import { EVENT_CATEGORIES } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

function EventsContent() {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(loadMoreRef, { threshold: 0.1 });
  const searchParams = useSearchParams();
  const urlSearchParams = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearchParams);
  const [category, setCategory] = useState('');

  const apiFilters: EventFilters = {
    search: search || urlSearchParams || undefined,
  };

  const { data: featuredEvents = [] } = useFeaturedEvents();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useEvents(apiFilters);

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  const rawEvents = data?.pages.flatMap((p) => p.events) ?? [];
  const events = useMemo(() => {
    if (!category) return rawEvents;
    const lowerCat = category.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return rawEvents.filter(e => {
        const eCat = (e.category || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
        const eType = (e.event_type || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
        const eTags = (e.tags || []).map(t => t.toLowerCase().replace(/[^a-z0-9]/g, "_"));
        return (
            eCat.includes(lowerCat) ||
            eType.includes(lowerCat) ||
            eTags.some(t => t.includes(lowerCat)) ||
            lowerCat.split("_").some(part => part.length > 2 && (eCat.includes(part) || eType.includes(part)))
        );
    });
  }, [rawEvents, category]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = Date.now();
    const isPast = (e: any) => e.end_time ? new Date(e.end_time).getTime() < now : new Date(e.start_time).getTime() < now;
    
    const upcoming = events.filter(e => !isPast(e));
    const past = events.filter(e => isPast(e))
      .sort((a, b) => {
        const timeA = a.end_time ? new Date(a.end_time).getTime() : new Date(a.start_time).getTime();
        const timeB = b.end_time ? new Date(b.end_time).getTime() : new Date(b.start_time).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
      
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  const featuredEvent = useMemo(() => {
    const now = Date.now();
    const activeFeatured = featuredEvents.find(e => {
      const isPast = e.end_time ? new Date(e.end_time).getTime() < now : new Date(e.start_time).getTime() < now;
      return !isPast;
    });
    return activeFeatured || featuredEvents[0];
  }, [featuredEvents]);

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Featured hero */}
      {featuredEvent && (
        <div className="relative w-full h-[45vh] md:h-[60vh] max-h-[800px] bg-[#0A0A0A]">
          <Image 
            src={featuredEvent.cover_image ?? '/placeholder-event.jpg'} 
            alt={featuredEvent.title} 
            fill 
            className="object-cover opacity-60" 
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-end max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-12 md:pb-24">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#800020] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">
                  Featured Event
                </span>
                {featuredEvent.category && (
                  <span className="text-[10px] text-white/60 font-medium uppercase tracking-widest border border-white/10 px-3 py-1 rounded-sm backdrop-blur-sm">
                    {featuredEvent.category}
                  </span>
                )}
              </div>
              <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-[1.1]">
                {featuredEvent.title}
              </h1>
              <div className="flex items-center gap-4 text-white/70 text-sm md:text-base mb-8">
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />
                  {featuredEvent.venue_name}
                </p>
                <span className="text-white/30">•</span>
                <p>{new Date(featuredEvent.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              
              <Link href={`/events/${featuredEvent.slug ?? featuredEvent.event_id}`}>
                {(() => {
                  const isPast = featuredEvent.end_time 
                    ? new Date(featuredEvent.end_time).getTime() < Date.now() 
                    : new Date(featuredEvent.start_time).getTime() < Date.now();
                  
                  return isPast ? (
                    <button disabled className="group relative px-8 py-4 bg-white/10 text-white/50 cursor-not-allowed overflow-hidden rounded-full font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 backdrop-blur-md">
                      <span className="relative z-10">Event Ended</span>
                    </button>
                  ) : (
                    <button className="group relative px-8 py-4 bg-white text-black hover:text-white overflow-hidden rounded-full font-bold text-sm uppercase tracking-wider transition-colors duration-300 inline-flex items-center gap-2">
                      <span className="relative z-10">Get Tickets</span>
                      <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                      <div className="absolute inset-0 bg-[#800020] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    </button>
                  );
                })()}
              </Link>
            </motion.div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Sticky Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-8">
          <div className="sticky top-24">
            <h2 className="text-white font-playfair text-2xl font-bold mb-6">Upcoming</h2>
            
            {/* Search */}
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={16} className="text-white/30" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-[#0A0A0A] border border-white/[0.05] rounded-xl pl-11 pr-10 py-3.5 text-sm text-white focus:outline-none focus:border-[#800020]/50 focus:ring-1 focus:ring-[#800020]/50 transition-all placeholder:text-white/30"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest pl-2 mb-3">Categories</p>
              <button
                onClick={() => setCategory('')}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${!category ? 'bg-[#800020]/10 text-white font-medium border border-[#800020]/20' : 'text-white/60 hover:bg-white/[0.02] border border-transparent'}`}
              >
                All Events
                {!category && <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />}
              </button>
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${category === cat ? 'bg-[#800020]/10 text-white font-medium border border-[#800020]/20' : 'text-white/60 hover:bg-white/[0.02] border border-transparent hover:text-white'}`}
                >
                  {cat}
                  {category === cat && <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Wide List */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex flex-col gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-[#0A0A0A] border border-white/[0.05]">
                  <Skeleton className="w-full md:w-[35%] h-[200px] rounded-xl shrink-0" />
                  <div className="flex-1 py-4 flex flex-col justify-center space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="mt-auto pt-4">
                      <Skeleton className="h-8 w-32 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="mt-12">
              <EmptyState icon="Calendar" title="No events found" subtitle="Try adjusting your search or filters to find what you're looking for." />
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {upcomingEvents.length > 0 && (
                <div className="flex flex-col gap-6">
                  {pastEvents.length > 0 && <h3 className="text-white font-playfair text-3xl font-bold mb-2">Upcoming Events</h3>}
                  <AnimatePresence mode="popLayout">
                    {upcomingEvents.map((event, i) => (
                      <motion.div 
                        layout
                        key={event.event_id} 
                        initial={{ opacity: 0, scale: 0.98, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.98, y: -20 }}
                        transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                      >
                        <EventCard event={event} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 mt-8 mb-2 border-t border-white/10 pt-8">
                    <h3 className="text-white/60 font-playfair text-3xl font-bold">Past Events</h3>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 uppercase tracking-widest">Recent 5</span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    {pastEvents.map((event, i) => (
                      <motion.div 
                        layout
                        key={event.event_id} 
                        initial={{ opacity: 0, scale: 0.98, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.98, y: -20 }}
                        transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                        className="opacity-75 hover:opacity-100 transition-opacity duration-300"
                      >
                        <EventCard event={event} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {hasNextPage && (
                <div ref={loadMoreRef} className="pt-12 flex justify-center h-10 w-full mb-10">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-3 text-[#D4AF37]">
                      <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      <span className="font-medium text-sm tracking-widest uppercase">Loading More...</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
