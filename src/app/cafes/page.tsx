'use client';

import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useCafes } from '@/queries/useCafes';
import { useAddBookmark, useRemoveBookmark, useBookmarks } from '@/queries/useUser';
import { useAuthStore } from '@/stores/authStore';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import type { CafeFilters } from '@/types/cafe';
import { useSearchParams } from 'next/navigation';

const vibeFilters = ['Fun & Wild', 'Cozy & Comfy', 'Date Night', 'Work & Study', 'Brunch Gang'];

function CafesContent() {
  const { isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const urlSearchParams = searchParams.get('search') || '';

  const [search, setSearch] = useState(urlSearchParams);
  const [selectedVibe, setSelectedVibe] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'newest'>('rating');

  const debouncedSearch = useDebounce(search, 400);

  const filters: CafeFilters = {
    search: debouncedSearch || undefined,
    vibe: selectedVibe || undefined,
    open_now: openNow || undefined,
    sort_by: sortBy,
  };

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useCafes(filters);
  const { data: userBookmarks = [] } = useBookmarks();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const cafes = data?.pages.flatMap((p) => p.cafes) ?? [];

  const handleBookmarkToggle = (cafeId: string, isAdding: boolean) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save cafes');
      return;
    }
    if (isAdding) {
      addBookmark.mutate(cafeId);
    } else {
      removeBookmark.mutate(cafeId);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedVibe('');
    setOpenNow(false);
  };

  const hasFilters = search || selectedVibe || openNow;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-12">
      {/* Header */}
      <div className="w-full bg-[#121212] border-b border-[#2A2A2A] filter drop-shadow">
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 lg:px-8 py-10 md:py-16">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50">
              Explore Cafés
            </h1>
            <p className="text-white/40 text-sm md:text-base">
              Discover Chennai&apos;s finest premium spots
            </p>
          </motion.div>
        </div>
      </div>

      {/* Toolbar Strip */}
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 lg:px-8 -mt-8 relative z-10 mb-10">
        <div className="bg-white/[0.02] border border-white/[0.05] shadow-sm backdrop-blur-md rounded-2xl p-4 flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
          {/* Search */}
          <div className="w-full xl:w-80 flex-shrink-0 flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 focus-within:border-[#800020] transition-colors">
            <Search size={16} className="text-white/40 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cafés..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-white/30 min-w-0"
            />
            <button
              onClick={() => setSearch('')}
              tabIndex={search ? 0 : -1}
              className={`flex-shrink-0 p-1 flex items-center justify-center transition-opacity ${
                search ? 'opacity-100 cursor-pointer' : 'opacity-0 cursor-default pointer-events-none'
              }`}
            >
              <X size={14} className="text-white/40 hover:text-white transition-colors" />
            </button>
          </div>

          <div className="flex-1 w-full min-w-0 flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
            {/* Filter chips (Scrollable) */}
            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 xl:pb-0">
              <button
                onClick={() => setOpenNow(!openNow)}
                className={`flex-shrink-0 text-sm px-4 py-2 rounded-full border transition-all ${
                  openNow
                    ? 'bg-[#800020] border-[#800020] text-white shadow-[0_0_15px_rgba(128,0,32,0.3)]'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-white/60 hover:border-[#3A3A3A] hover:text-white'
                }`}
              >
                Open Now
              </button>
              {vibeFilters.map((vibe) => (
                <button
                  key={vibe}
                  onClick={() => setSelectedVibe(selectedVibe === vibe ? '' : vibe)}
                  className={`flex-shrink-0 text-sm px-4 py-2 rounded-full border transition-all ${
                    selectedVibe === vibe
                      ? 'bg-[#800020] border-[#800020] text-white shadow-[0_0_15px_rgba(128,0,32,0.3)]'
                      : 'bg-[#1A1A1A] border-[#2A2A2A] text-white/60 hover:border-[#3A3A3A] hover:text-white'
                  }`}
                >
                  {vibe}
                </button>
              ))}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex-shrink-0 text-sm px-4 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Options (Pinned) */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="hidden xl:block w-px h-6 bg-white/10 mx-1"></div>
              <div className="flex items-center gap-3 text-sm text-white/40">
                <SlidersHorizontal size={14} />
                {(['rating', 'distance', 'newest'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`capitalize transition-colors ${sortBy === s ? 'text-[#800020] font-medium' : 'hover:text-white/80'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 md:px-6 lg:px-8">
        {/* Grid */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-4 break-inside-avoid">
                <Skeleton className={`w-full rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/[0.05] ${i % 4 === 0 ? 'h-[300px]' : 'h-[200px]'}`} />
                <div className="space-y-2 px-2">
                  <Skeleton className="h-5 w-3/4 bg-white/[0.02]" />
                  <Skeleton className="h-4 w-1/2 bg-white/[0.02]" />
                </div>
              </div>
            ))}
          </div>
        ) : cafes.length === 0 ? (
          <div className="pt-10">
            <EmptyState
              icon="Coffee"
              title="No cafés found"
              subtitle="Try adjusting your filters or search term"
              actionLabel={hasFilters ? 'Clear filters' : undefined}
              onAction={hasFilters ? clearFilters : undefined}
            />
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-6">
              {cafes.map((cafe, i) => {
                const _isBookmarked =
                  cafe.is_bookmarked ||
                  userBookmarks.some((b) => b.cafe_id === cafe.cafe_id);

                const aspect = i % 5 === 0 ? 'tall' as const : i % 3 === 0 ? 'square' as const : 'standard' as const;

                return (
                  <motion.div
                    key={cafe.cafe_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.4) }}
                    className="break-inside-avoid"
                  >
                    <CafeCard
                      cafe={{ ...cafe, is_bookmarked: _isBookmarked }}
                      onBookmark={handleBookmarkToggle}
                      aspectRatio={aspect}
                    />
                  </motion.div>
                );
              })}
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-12 mb-8">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#800020] to-[#A00020] rounded-xl text-white font-medium shadow-[0_0_20px_rgba(128,0,32,0.3)] hover:shadow-[0_0_30px_rgba(128,0,32,0.5)] transition-all disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CafesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white/40">Loading cafes...</div>}>
      <CafesContent />
    </Suspense>
  );
}
