'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useCafes } from '@/queries/useCafes';
import { useDebounce } from '@/hooks/useDebounce';
import type { CafeFilters } from '@/types/cafe';

const vibeFilters = ['Fun & Wild', 'Cozy & Comfy', 'Date Night', 'Work & Study', 'Brunch Gang'];

export default function CafesPage() {
  const [search, setSearch] = useState('');
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
  const cafes = data?.pages.flatMap((p) => p.cafes) ?? [];

  const clearFilters = () => {
    setSearch('');
    setSelectedVibe('');
    setOpenNow(false);
  };

  const hasFilters = search || selectedVibe || openNow;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-playfair text-3xl font-bold text-white mb-1">Explore Cafés</h1>
        <p className="text-white/40 text-sm">Discover Chennai&apos;s finest cafés</p>
      </motion.div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl px-4 py-2.5 focus-within:border-[#800020] transition-colors">
          <Search size={16} className="text-white/40 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cafés..."
            className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-white/30"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={14} className="text-white/40 hover:text-white" />
            </button>
          )}
        </div>
        <button className="p-2.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl hover:border-[#800020] transition-colors">
          <SlidersHorizontal size={18} className="text-white/60" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setOpenNow(!openNow)}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
            openNow ? 'bg-[#800020] border-[#800020] text-white' : 'border-[#2A2A2A] text-white/50 hover:border-[#3A3A3A]'
          }`}
        >
          Open Now
        </button>
        {vibeFilters.map((vibe) => (
          <button
            key={vibe}
            onClick={() => setSelectedVibe(selectedVibe === vibe ? '' : vibe)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
              selectedVibe === vibe
                ? 'bg-[#800020] border-[#800020] text-white'
                : 'border-[#2A2A2A] text-white/50 hover:border-[#3A3A3A]'
            }`}
          >
            {vibe}
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-6 text-sm text-white/40">
        <span>Sort:</span>
        {(['rating', 'distance', 'newest'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`capitalize transition-colors ${sortBy === s ? 'text-[#800020]' : 'hover:text-white/60'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : cafes.length === 0 ? (
        <EmptyState
          icon="Coffee"
          title="No cafés found"
          subtitle="Try adjusting your filters or search term"
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cafes.map((cafe, i) => (
              <motion.div
                key={cafe.cafe_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <CafeCard cafe={cafe} />
              </motion.div>
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-8">
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
