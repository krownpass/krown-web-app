'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useBookmarks, useRemoveBookmark } from '@/queries/useUser';
import { toast } from 'sonner';

export default function BookmarksPage() {
  const router = useRouter();
  const { data: cafes = [], isLoading } = useBookmarks();
  const removeBookmark = useRemoveBookmark();

  const handleRemoveBookmark = async (cafeId: string) => {
    try {
      await removeBookmark.mutateAsync(cafeId);
      toast.success('Removed from saved cafés');
    } catch {
      toast.error('Failed to remove bookmark');
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
            <h1 className="font-playfair text-xl font-bold text-white">Saved Cafés</h1>
            <p className="text-white/40 text-sm">{cafes.length} saved</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : cafes.length === 0 ? (
          <EmptyState icon="Bookmark" title="No saved cafés" subtitle="Bookmark cafés to find them here" actionLabel="Explore Cafés" onAction={() => router.push('/cafes')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cafes.map((cafe, i) => (
              <motion.div key={cafe.cafe_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <CafeCard
                  cafe={{ ...cafe, is_bookmarked: true }}
                  onBookmark={(cafeId) => handleRemoveBookmark(cafeId)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
