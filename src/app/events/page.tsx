'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { EventCard } from '@/components/event/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useEvents, useFeaturedEvents } from '@/queries/useEvents';
import { useDebounce } from '@/hooks/useDebounce';
import type { EventFilters } from '@/types/event';
import { EVENT_CATEGORIES } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const debouncedSearch = useDebounce(search, 400);
  const filters: EventFilters = {
    search: debouncedSearch || undefined,
    category: category || undefined,
  };

  const { data: featuredEvents = [] } = useFeaturedEvents();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useEvents(filters);
  const events = data?.pages.flatMap((p) => p.events) ?? [];
  const featuredEvent = featuredEvents[0];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-playfair text-3xl font-bold text-white mb-1">Explore Events</h1>
        <p className="text-white/40 text-sm">Experiences worth remembering</p>
      </motion.div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl px-4 py-2.5 focus-within:border-[#800020] transition-colors">
        <Search size={16} className="text-white/40 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-white/30"
        />
        {search && <button onClick={() => setSearch('')}><X size={14} className="text-white/40" /></button>}
      </div>

      {/* Featured hero */}
      {featuredEvent && (
        <Link href={`/events/${featuredEvent.slug ?? featuredEvent.event_id}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-56 md:h-72 rounded-2xl overflow-hidden group cursor-pointer"
          >
            {featuredEvent.cover_image && (
              <Image src={featuredEvent.cover_image} alt={featuredEvent.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="100vw" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              {featuredEvent.category && (
                <span className="inline-block mb-2 text-xs font-bold px-2.5 py-1 bg-[#800020] text-white rounded-full w-fit uppercase tracking-wide">
                  {featuredEvent.category}
                </span>
              )}
              <h2 className="font-playfair text-2xl font-bold text-white mb-1">{featuredEvent.title}</h2>
              <p className="text-white/60 text-sm">{featuredEvent.venue_name}</p>
            </div>
          </motion.div>
        </Link>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setCategory('')}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${!category ? 'bg-[#800020] border-[#800020] text-white' : 'border-[#2A2A2A] text-white/50 hover:border-[#3A3A3A]'}`}
        >
          All
        </button>
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? '' : cat)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${category === cat ? 'bg-[#800020] border-[#800020] text-white' : 'border-[#2A2A2A] text-white/50 hover:border-[#3A3A3A]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon="Calendar" title="No events found" subtitle="Try a different search or category" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, i) => (
              <motion.div key={event.event_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-3 bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 rounded-xl text-sm hover:border-[#800020] transition-all disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
