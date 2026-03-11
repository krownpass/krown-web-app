'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { EventCard } from '@/components/event/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Tabs } from '@/components/ui/Tabs';
import { useBookmarks, useRemoveBookmark, useEventBookmarks, useRemoveEventBookmark } from '@/queries/useUser';
import { toast } from 'sonner';

const TABS = [
  { label: 'Cafés', value: 'cafes' },
  { label: 'Events', value: 'events' },
];

export default function BookmarksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('cafes');

  // Cafes hooks
  const { data: cafes = [], isLoading: isLoadingCafes } = useBookmarks();
  const removeCafeBookmark = useRemoveBookmark();

  // Events hooks
  const { data: events = [], isLoading: isLoadingEvents } = useEventBookmarks();
  const removeEventBookmark = useRemoveEventBookmark();

  const handleRemoveCafe = async (cafeId: string) => {
    try {
      await removeCafeBookmark.mutateAsync(cafeId);
    } catch {
      // Error handled in mutation
    }
  };

  const handleRemoveEvent = async (eventId: string) => {
    try {
      await removeEventBookmark.mutateAsync(eventId);
    } catch {
      // Error handled in mutation
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-playfair text-xl font-bold text-white">Saved Items</h1>
            <p className="text-white/40 text-sm">
              {activeTab === 'cafes' ? `${cafes.length} cafés` : `${events.length} events`}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === 'cafes' && (
          <>
            {isLoadingCafes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
              </div>
            ) : cafes.length === 0 ? (
              <EmptyState icon="Bookmark" title="No saved cafés" subtitle="Bookmark cafés to find them here" actionLabel="Explore Cafés" onAction={() => router.push('/cafes')} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(new Map(cafes.map(cafe => [cafe.cafe_id, cafe])).values()).map((cafe, i) => (
                  <motion.div key={cafe.cafe_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <CafeCard
                      cafe={{ ...cafe, is_bookmarked: true }}
                      onBookmark={(cafeId) => handleRemoveCafe(cafeId)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'events' && (
          <>
            {isLoadingEvents ? (
              <div className="flex flex-col gap-6">
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
              <EmptyState icon="Bookmark" title="No saved events" subtitle="Bookmark events to find them here" actionLabel="Explore Events" onAction={() => router.push('/events')} />
            ) : (
              <div className="flex flex-col gap-6">
                {Array.from(new Map(events.map(event => [event.event_id, event])).values()).map((event, i) => (
                  <motion.div key={event.event_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <EventCard
                      event={{ ...event, is_bookmarked: true }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
