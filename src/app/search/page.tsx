'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { CafeCard } from '@/components/cafe/CafeCard';
import { EventCard } from '@/components/event/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCafes } from '@/queries/useCafes';
import { useEvents } from '@/queries/useEvents';

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('krown_recent_searches', []);
  const debouncedQuery = useDebounce(query, 400);

  const isSearching = debouncedQuery.length >= 2;
  const { data: cafeData, isLoading: cafesLoading } = useCafes(isSearching ? { search: debouncedQuery, limit: 4 } : undefined);
  const { data: eventData, isLoading: eventsLoading } = useEvents(isSearching ? { search: debouncedQuery, limit: 4 } : undefined);

  const cafes = cafeData?.pages.flatMap((p) => p.cafes) ?? [];
  const events = eventData?.pages.flatMap((p) => p.events) ?? [];
  const isLoading = cafesLoading || eventsLoading;

  useEffect(() => { inputRef.current?.focus(); }, []);

  const addToRecent = (term: string) => {
    setRecentSearches((prev) => [term, ...prev.filter((s) => s !== term)].slice(0, 8));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) addToRecent(query.trim());
  };

  const clearRecent = () => setRecentSearches([]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
      {/* Search header */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 flex-shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl px-4 py-2.5 focus-within:border-[#800020] transition-colors">
          <Search size={16} className="text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cafés, events..."
            className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-white/30"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}>
              <X size={14} className="text-white/40" />
            </button>
          )}
        </div>
      </form>

      <AnimatePresence mode="wait">
        {!isSearching ? (
          /* Recent searches */
          <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/60 text-sm font-medium">Recent Searches</h3>
                  <button onClick={clearRecent} className="text-white/30 text-xs hover:text-white/50">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-full text-white/60 text-sm hover:border-[#800020] transition-all"
                    >
                      <Clock size={12} />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentSearches.length === 0 && (
              <div className="text-center py-16">
                <Search size={40} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Search for cafés, events, and more</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* Results */
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : (
              <>
                {/* Cafés */}
                {cafes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">Cafés</h3>
                      <Link href={`/cafes?search=${debouncedQuery}`} className="text-[#800020] text-xs hover:text-[#C11E38]">See all</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cafes.map((cafe) => <CafeCard key={cafe.cafe_id} cafe={cafe} />)}
                    </div>
                  </div>
                )}

                {/* Events */}
                {events.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">Events</h3>
                      <Link href={`/events?search=${debouncedQuery}`} className="text-[#800020] text-xs hover:text-[#C11E38]">See all</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {events.map((event) => <EventCard key={event.event_id} event={event} />)}
                    </div>
                  </div>
                )}

                {cafes.length === 0 && events.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-white/30 text-sm">No results for &quot;{debouncedQuery}&quot;</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
