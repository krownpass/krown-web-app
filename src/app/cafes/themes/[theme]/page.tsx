'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useCafesByTheme } from '@/queries/useCafes';

export default function ThemeCafesPage() {
  const params = useParams<{ theme: string }>();
  const router = useRouter();
  const themeName = params.theme.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const { data: cafes = [], isLoading } = useCafesByTheme(params.theme);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">{themeName}</h1>
          <p className="text-white/40 text-sm">{cafes.length} cafés</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : cafes.length === 0 ? (
        <EmptyState icon="Coffee" title="No cafés in this theme" subtitle="Check back later for more" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cafes.map((cafe, i) => (
            <motion.div key={cafe.cafe_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <CafeCard cafe={cafe} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
