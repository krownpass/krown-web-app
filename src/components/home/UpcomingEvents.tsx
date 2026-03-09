'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EventCard } from '@/components/event/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUpcomingEvents } from '@/queries/useEvents';

export function UpcomingEvents() {
  const { data: events = [], isLoading } = useUpcomingEvents();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-playfair text-xl font-bold text-white">Upcoming Hotspots</h2>
        <Link
          href="/events"
          className="flex items-center gap-1 text-sm text-[#800020] hover:text-[#C11E38] transition-colors"
        >
          See all <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-72 space-y-2">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : events.map((event, i) => (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex-shrink-0 w-72"
              >
                <EventCard event={event} />
              </motion.div>
            ))}
      </div>
    </section>
  );
}
