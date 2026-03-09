'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHomeData } from '@/queries/useHome';

export function FeaturedCafes() {
  const { data, isLoading } = useHomeData();
  const cafes = data?.cafeWithOffers ?? [];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-playfair text-xl font-bold text-white">Fun Brewing Nearby</h2>
        <Link
          href="/cafes"
          className="flex items-center gap-1 text-sm text-[#800020] hover:text-[#C11E38] transition-colors"
        >
          See all <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-56 space-y-2">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : cafes.map((cafe, i) => (
              <motion.div
                key={cafe.cafe_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex-shrink-0 w-56"
              >
                <CafeCard cafe={cafe} />
              </motion.div>
            ))}
      </div>
    </section>
  );
}
