'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { CafeCard } from '@/components/cafe/CafeCard';
import { EventCard } from '@/components/event/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCafes } from '@/queries/useCafes';
import { useEvents } from '@/queries/useEvents';
import { useSearchKeywords } from '@/queries/useSearchKeywords';
import { SearchTrie } from '@/lib/SearchTrie';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hideSugg, setHideSugg] = useState(false);
  const [activeTab, setActiveTab] = useState(typeParam === 'events' ? 'events' : 'cafes');
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('krown_recent_searches', []);
  const debouncedQuery = useDebounce(query, 400);
  
  const trie = React.useMemo(() => new SearchTrie(), []);
  const { data: keywords } = useSearchKeywords();

  useEffect(() => {
    if (keywords) {
      keywords.forEach((word) => trie.insert(word));
    }
  }, [keywords, trie]);

  const handleSearchInput = (text: string) => {
    setQuery(text);
    setHideSugg(false);
    if (text.trim().length > 0) {
      setSuggestions(trie.search(text));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setHideSugg(true);
    setSuggestions([]);
  };

  const isSearching = debouncedQuery.length >= 1;
  const { data: cafeData, isLoading: cafesLoading } = useCafes(isSearching && typeParam !== 'events' ? { search: debouncedQuery, limit: 4 } : undefined);
  const { data: eventData, isLoading: eventsLoading } = useEvents(isSearching && typeParam !== 'cafes' ? { search: debouncedQuery, limit: 4 } : undefined);

  const cafes = cafeData?.pages.flatMap((p) => p.cafes) ?? [];
  const events = eventData?.pages.flatMap((p) => p.events) ?? [];
  const isLoading = (typeParam !== 'events' ? cafesLoading : false) || (typeParam !== 'cafes' ? eventsLoading : false);

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
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
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
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder={
              typeParam === 'cafes' ? 'Search cafés...' :
              typeParam === 'events' ? 'Search events...' :
              'Search cafés, events...'
            }
            className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-white/30"
          />
          {query && (
            <button type="button" onClick={() => handleSearchInput('')}>
              <X size={14} className="text-white/40" />
            </button>
          )}
        </div>
      </form>

      <AnimatePresence mode="wait">
        {query.length > 0 ? (
          <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            
            {/* Suggestions */}
            {!hideSugg && suggestions.length > 0 && (
              <div>
                <h3 className="text-white/60 text-sm font-medium mb-3">Suggestions</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 10).map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSuggestionClick(term)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-full text-white/80 text-sm hover:border-[#800020] transition-all text-left"
                    >
                      <Search size={14} className="text-white/40 flex-shrink-0" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {isSearching && (
              <div>
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!typeParam && (
                      <Tabs
                        tabs={[
                          { label: `Cafés ${cafes.length > 0 ? `(${cafes.length})` : ''}`, value: 'cafes' },
                          { label: `Events ${events.length > 0 ? `(${events.length})` : ''}`, value: 'events' }
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                      />
                    )}

                    <div className="mt-4">
                      {activeTab === 'cafes' && (
                        cafes.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <Link href={`/cafes?search=${debouncedQuery}`} className="text-[#800020] text-xs font-semibold hover:text-[#C11E38] transition-colors bg-[#800020]/10 px-3 py-1.5 rounded-full">
                                View all cafés
                              </Link>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {cafes.map((cafe) => <CafeCard key={cafe.cafe_id} cafe={cafe} />)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-[#1E1E1E]/50 rounded-2xl border border-[#2A2A2A]/50">
                            <p className="text-white/40 text-sm">No cafés found for &quot;{debouncedQuery}&quot;</p>
                          </div>
                        )
                      )}

                      {activeTab === 'events' && (
                        events.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <Link href={`/events?search=${debouncedQuery}`} className="text-[#800020] text-xs font-semibold hover:text-[#C11E38] transition-colors bg-[#800020]/10 px-3 py-1.5 rounded-full">
                                View all events
                              </Link>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {events.map((event) => <EventCard key={event.event_id} event={event} />)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-[#1E1E1E]/50 rounded-2xl border border-[#2A2A2A]/50">
                            <p className="text-white/40 text-sm">No events found for &quot;{debouncedQuery}&quot;</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
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
        )}
      </AnimatePresence>
    </div>
  );
}
