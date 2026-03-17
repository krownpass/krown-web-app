'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X, Clock, Star, MapPin, Sparkles, Wifi, RefreshCw, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSearchKeywords } from '@/queries/useSearchKeywords';
import { SearchTrie } from '@/lib/SearchTrie';
import { aiSearch, AiCafe, AiEvent } from '@/services/ai.search.service';

// ─── Trending chips ───────────────────────────────────────────────────────────

const TRENDING = [
  'Cozy cafes near me',
  'Live music tonight',
  'Rooftop vibes',
  'Best brunch spots',
  'Open mic events',
  'Quiet work spots',
  'DJ nights this week',
  'Coffee & laptops',
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`animate-pulse bg-[#1A1A1A] rounded-2xl overflow-hidden ${wide ? 'h-52' : 'h-48'}`}>
      <div className="bg-[#252525] h-32 w-full" />
      <div className="p-3 space-y-2">
        <div className="bg-[#252525] h-3 w-3/4 rounded-full" />
        <div className="bg-[#252525] h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonEventRow() {
  return (
    <div className="animate-pulse flex gap-3 bg-[#1A1A1A] rounded-2xl p-4">
      <div className="bg-[#252525] w-12 h-14 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="bg-[#252525] h-3 w-3/4 rounded-full" />
        <div className="bg-[#252525] h-3 w-1/2 rounded-full" />
        <div className="flex gap-2 mt-2">
          <div className="bg-[#252525] h-5 w-16 rounded-full" />
          <div className="bg-[#252525] h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="bg-[#252525] w-14 h-14 rounded-xl flex-shrink-0" />
    </div>
  );
}

// ─── Cafe Card ────────────────────────────────────────────────────────────────

function AiCafeCard({ cafe }: { cafe: AiCafe }) {
  return (
    <Link href={`/cafes/${cafe.cafe_id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-[#2A2A2A] hover:border-[#C11E38]/40 transition-colors group cursor-pointer"
      >
        <div className="relative h-40 overflow-hidden">
          {cafe.cover_img ? (
            <Image
              src={cafe.cover_img}
              alt={cafe.cafe_name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-[#252525] flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-white/15">
                <path d="M17 8h1a4 4 0 0 1 0 8h-1"/>
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
                <line x1="6" x2="6" y1="2" y2="4"/>
                <line x1="10" x2="10" y1="2" y2="4"/>
                <line x1="14" x2="14" y1="2" y2="4"/>
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {cafe.editors_pick && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-[10px] font-semibold">Editor&apos;s Pick</span>
            </div>
          )}
          {cafe.distance_label && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#C11E38]/80 backdrop-blur-sm px-2 py-1 rounded-full">
              <MapPin size={10} className="text-white" />
              <span className="text-white text-[10px] font-medium">{cafe.distance_label}</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-white font-semibold text-sm truncate">{cafe.cafe_name}</h3>
          <p className="text-white/40 text-xs mt-0.5 truncate flex items-center gap-1">
            <MapPin size={10} /> {cafe.cafe_location}
          </p>

          {cafe.ratings != null && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-xs font-semibold">{cafe.ratings.toFixed(1)}</span>
              {cafe.area && <span className="text-white/30 text-xs">· {cafe.area}</span>}
            </div>
          )}

          {cafe.keywords && cafe.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {cafe.keywords.slice(0, 3).map((kw, i) => (
                <span key={i} className="text-[10px] text-white/40 bg-[#252525] px-2 py-0.5 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Event Row ────────────────────────────────────────────────────────────────

function AiEventRow({ event }: { event: AiEvent }) {
  const start = new Date(event.start_time);
  const day = start.getDate().toString().padStart(2, '0');
  const mon = start.toLocaleString('en', { month: 'short' }).toUpperCase();

  return (
    <Link href={`/events/${event.slug}`}>
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.15 }}
        className="flex items-start gap-3 bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A] hover:border-[#C11E38]/40 transition-colors cursor-pointer group"
      >
        {/* Date box */}
        <div className="w-12 h-14 bg-[#C11E38] rounded-xl flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg leading-none">{day}</span>
          <span className="text-white/80 text-[10px] font-medium">{mon}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-white/90">
            {event.title}
          </h4>
          {event.venue_name && (
            <p className="text-white/40 text-xs mt-1 truncate flex items-center gap-1">
              <MapPin size={10} /> {event.venue_name}
            </p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="text-[10px] text-white/40 bg-[#252525] px-2 py-0.5 rounded-full capitalize">
              {event.event_type}
            </span>
            {event.is_paid ? (
              <span className="text-[10px] text-green-400 font-semibold">₹{event.base_price}</span>
            ) : (
              <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-semibold">FREE</span>
            )}
            {event.spots_left != null && event.spots_left <= 10 && (
              <span className="text-[10px] text-orange-400 font-medium">{event.spots_left} spots left</span>
            )}
          </div>
        </div>

        {/* Cover thumbnail */}
        {event.cover_image ? (
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            <Image src={event.cover_image} alt={event.title} width={56} height={56} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-[#252525] flex-shrink-0 flex items-center justify-center">
            <Calendar size={18} className="text-white/20" />
          </div>
        )}
      </motion.div>
    </Link>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-[#C11E38] text-white' : 'text-white/50 hover:text-white/80'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'all' | 'cafes' | 'events';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as Tab | null;

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(typeParam ?? 'all');
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('krown_recent_searches', []);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [aiCafes, setAiCafes] = useState<AiCafe[]>([]);
  const [aiEvents, setAiEvents] = useState<AiEvent[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [searchError, setSearchError] = useState(false);

  const trie = React.useMemo(() => new SearchTrie(), []);
  const { data: keywords } = useSearchKeywords();

  useEffect(() => {
    if (keywords) keywords.forEach((w) => trie.insert(w));
  }, [keywords, trie]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const runAiSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setIsSearching(true);
    setSearchError(false);
    setAiCafes([]);
    setAiEvents([]);
    setHasResults(false);

    try {
      const result = await aiSearch(
        q.trim(),
        undefined,
        undefined,
        typeParam === 'cafes' ? 'cafes' : typeParam === 'events' ? 'events' : 'all'
      );
      setAiCafes(result.cafes);
      setAiEvents(result.events);
      setHasResults(result.has_results);
      const refined = result.refined_query?.toLowerCase().trim();
      setRefinedQuery(refined && refined !== q.trim().toLowerCase() ? result.refined_query : null);
      setFallbackMessage(result.is_fallback ? result.fallback_message : null);
      setActiveTab('all');
    } catch {
      setSearchError(true);
    } finally {
      setIsSearching(false);
    }
  }, [typeParam]);

  const handleInput = (text: string) => {
    setQuery(text);
    setSuggestions(text.trim() ? trie.search(text) : []);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length >= 2) {
      searchTimeout.current = setTimeout(() => runAiSearch(text), 600);
    } else {
      setAiCafes([]);
      setAiEvents([]);
      setHasResults(false);
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setRecentSearches((prev) => [query.trim(), ...prev.filter((s) => s !== query.trim())].slice(0, 8));
    runAiSearch(query);
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setSuggestions([]);
    runAiSearch(term);
  };

  const displayCafes = activeTab === 'events' ? [] : aiCafes;
  const displayEvents = activeTab === 'cafes' ? [] : aiEvents;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 pb-16">
      {/* Search Header */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 hover:text-white flex-shrink-0 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl px-4 py-2.5 focus-within:border-[#C11E38]/60 transition-colors">
          <Search size={16} className="text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={
              typeParam === 'cafes' ? 'Search cafés…' :
              typeParam === 'events' ? 'Search events…' :
              'Cafes, events, vibes…'
            }
            className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-white/30 font-medium"
          />
          {query && (
            <button type="button" onClick={() => handleInput('')} className="text-white/40 hover:text-white/70 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        {query.trim().length > 1 && (
          <button type="submit" className="px-5 py-2.5 bg-[#C11E38] text-white text-sm font-semibold rounded-xl hover:bg-[#A01830] transition-colors flex-shrink-0">
            Search
          </button>
        )}
      </form>

      <AnimatePresence mode="wait">
        {query.length > 0 ? (
          <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Trie suggestions */}
            {suggestions.length > 0 && !isSearching && !hasResults && (
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 8).map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSuggestionClick(term)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-full text-white/70 text-sm hover:border-[#C11E38]/50 hover:text-white transition-all"
                  >
                    <Search size={12} className="text-white/40" />
                    {term}
                  </button>
                ))}
              </div>
            )}

            {/* Loading skeletons */}
            {isSearching && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C11E38] animate-pulse" />
                  <span className="text-[#C11E38] text-xs font-semibold uppercase tracking-wider">Searching Krown…</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonEventRow key={i} />)}
                </div>
              </div>
            )}

            {/* Error state */}
            {searchError && (
              <div className="flex flex-col items-center py-16 gap-4">
                <Wifi size={40} className="text-white/10" />
                <div className="text-center">
                  <p className="text-white/60 font-semibold">Search failed</p>
                  <p className="text-white/30 text-sm mt-1">Check your connection and try again</p>
                </div>
                <button
                  onClick={() => runAiSearch(query)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#C11E38] text-white text-sm font-semibold rounded-xl hover:bg-[#A01830] transition-colors"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            )}

            {/* Results */}
            {!isSearching && hasResults && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
                {/* Refined query banner */}
                {refinedQuery && !fallbackMessage && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles size={13} className="text-[#C11E38] flex-shrink-0" />
                    <span className="text-white/40">Showing results for</span>
                    <span className="text-[#C11E38] font-semibold">&ldquo;{refinedQuery}&rdquo;</span>
                  </div>
                )}

                {/* Fallback banner */}
                {fallbackMessage && (
                  <div className="flex items-start gap-3 bg-[#1A1A1A] border-l-4 border-[#444] rounded-xl px-4 py-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 mt-0.5 shrink-0">
                      <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
                    </svg>
                    <p className="text-white/50 text-sm leading-relaxed">{fallbackMessage}</p>
                  </div>
                )}
                {/* Tab bar */}
                <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-xl w-fit">
                  <TabButton
                    label={`All (${aiCafes.length + aiEvents.length})`}
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                  />
                  {aiCafes.length > 0 && (
                    <TabButton
                      label={`Cafés (${aiCafes.length})`}
                      active={activeTab === 'cafes'}
                      onClick={() => setActiveTab('cafes')}
                    />
                  )}
                  {aiEvents.length > 0 && (
                    <TabButton
                      label={`Events (${aiEvents.length})`}
                      active={activeTab === 'events'}
                      onClick={() => setActiveTab('events')}
                    />
                  )}
                </div>

                {/* Cafes grid */}
                {displayCafes.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider">Cafés</h3>
                        <Link href={`/cafes?search=${encodeURIComponent(query)}`} className="text-[#C11E38] text-xs font-semibold hover:text-[#E02040] transition-colors">
                          View all →
                        </Link>
                      </div>
                    )}
                    <motion.div
                      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                        hidden: {},
                      }}
                    >
                      {displayCafes.map((cafe) => (
                        <motion.div
                          key={cafe.cafe_id}
                          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                        >
                          <AiCafeCard cafe={cafe} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* Events list */}
                {displayEvents.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider">Events</h3>
                        <Link href={`/events?search=${encodeURIComponent(query)}`} className="text-[#C11E38] text-xs font-semibold hover:text-[#E02040] transition-colors">
                          View all →
                        </Link>
                      </div>
                    )}
                    <motion.div
                      className="space-y-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.06 } },
                        hidden: {},
                      }}
                    >
                      {displayEvents.map((event) => (
                        <motion.div
                          key={event.event_id}
                          variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                        >
                          <AiEventRow event={event} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Empty state */}
            {!isSearching && !hasResults && !searchError && query.trim().length >= 2 && (
              <div className="flex flex-col items-center py-16 gap-3">
                <Search size={40} className="text-white/10" />
                <div className="text-center">
                  <p className="text-white/60 font-semibold">No results for &quot;{query}&quot;</p>
                  <p className="text-white/30 text-sm mt-1">Try different keywords or explore trending searches below</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Discover state */
          <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* AI Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[#C11E38]/20 bg-gradient-to-br from-[#1a0a0e] to-[#2d0f18] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-[#C11E38]" />
                  <div className="absolute inset-0 rounded-full bg-[#C11E38] animate-ping opacity-40" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">AI-powered search</p>
                  <p className="text-white/40 text-xs mt-0.5">Describe what you&apos;re looking for in natural language</p>
                </div>
              </div>
              <Sparkles size={22} className="text-[#C11E38] flex-shrink-0" />
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider">Recent</h3>
                  <button onClick={() => setRecentSearches([])} className="text-white/30 text-xs hover:text-white/50 transition-colors">
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSuggestionClick(term)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-full text-white/60 text-sm hover:border-[#C11E38]/40 hover:text-white/80 transition-all"
                    >
                      <Clock size={12} className="text-white/30" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Trending searches</h3>
              <motion.div
                className="flex flex-wrap gap-2"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } }, hidden: {} }}
              >
                {TRENDING.map((chip) => (
                  <motion.button
                    key={chip}
                    variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                    onClick={() => handleSuggestionClick(chip)}
                    className="px-4 py-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-full text-white/60 text-sm hover:border-[#C11E38]/50 hover:text-white hover:bg-[#1E1E1E] transition-all"
                  >
                    {chip}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
