
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Clock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatTime, getCapacityPercent } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { Event } from '@/types/event';
import { useAuthStore } from '@/stores/authStore';
import { useAddEventBookmark, useRemoveEventBookmark, useEventBookmarks } from '@/queries/useUser';
import { toast } from 'sonner';

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: userBookmarks = [] } = useEventBookmarks();
  const { mutate: addBookmark } = useAddEventBookmark();
  const { mutate: removeBookmark } = useRemoveEventBookmark();

  const isServerBookmarked = event.is_bookmarked || userBookmarks.some((b: any) => b.event_id === event.event_id);
  const [isBookmarked, setIsBookmarked] = useState(isServerBookmarked);

  // Sync state if server data changes
  useEffect(() => {
    setIsBookmarked(isServerBookmarked);
  }, [isServerBookmarked]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to save events');
      return;
    }

    if (isBookmarked) {
      setIsBookmarked(false);
      removeBookmark(event.event_id, {
        onError: () => setIsBookmarked(true),
      });
    } else {
      setIsBookmarked(true);
      addBookmark(event.event_id, {
        onError: () => setIsBookmarked(false),
      });
    }
  };

  const isPastEvent = event.end_time ? new Date(event.end_time).getTime() < Date.now() : new Date(event.start_time).getTime() < Date.now();
  const startDate = new Date(event.start_time);
  const month = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate();

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('group relative block h-full', className)}
    >
      <Link href={`/events/${event.slug ?? event.event_id}`} className="block h-full">
        <div className="flex flex-col md:flex-row bg-[#0A0A0A] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-[#800020]/50 hover:shadow-[0_0_30px_rgba(128,0,32,0.15)] transition-all duration-500 h-full">
          
          {/* Image & Date Block */}
          <div className="relative w-full md:w-[35%] h-[240px] md:h-auto md:min-h-[260px] overflow-hidden shrink-0">
            <ImageWithFallback
              src={event.cover_image ?? '/placeholder-event.jpg'}
              fallbackSrc="/placeholder-event.jpg"
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 35vw"
            />
            {/* Dramatic overlay */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0A0A0A] via-black/40 to-transparent opacity-90" />
            
            {/* Prominent Date Block */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[65px] shadow-2xl">
              <span className="text-[#800020] text-[10px] font-bold tracking-widest uppercase mb-0.5">{month}</span>
              <span className="text-white text-2xl font-black font-playfair leading-none">{day}</span>
            </div>

            {/* Favorite / Bookmark Button */}
            <button
              onClick={handleBookmark}
              className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all duration-300 z-20 group/btn"
            >
              <Heart
                size={18}
                className={cn(
                  "transition-all duration-300",
                  isBookmarked
                    ? "fill-[#C11E38] text-[#C11E38] scale-110"
                    : "fill-transparent text-white group-hover/btn:text-[#C11E38] group-hover/btn:scale-110"
                )}
              />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 p-5 md:p-8 flex flex-col justify-center relative">
            
            {/* Type/Price badge (moved from image to top right of content) */}
            <div className="absolute top-5 right-5 z-20">
              <span
                className={cn(
                  'text-xs font-bold px-2.5 py-1.5 rounded-full shadow-lg border border-white/10',
                  event.is_paid
                    ? 'bg-black/80 text-white backdrop-blur-md'
                    : 'bg-green-500/90 text-white'
                )}
              >
                {event.is_paid ? `₹${event.base_price}` : 'Free'}
              </span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6 w-full min-w-0">
              <div className="w-full min-w-0 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4 pr-16 w-full">
                  <div className="flex items-center gap-3 text-xs font-medium text-white/50 tracking-wide uppercase shrink-0">
                     <span className="flex items-center gap-1.5 border border-white/10 px-2.5 py-1 rounded-md bg-white/[0.02]">
                       <Clock size={12} className="text-[#800020]" />
                       {formatTime(event.start_time)}
                     </span>
                  </div>
                </div>

                <h3 className="font-playfair font-bold text-white text-2xl md:text-3xl leading-tight mb-2 group-hover:text-[#800020] transition-colors duration-300 w-full break-words">
                  {event.title}
                </h3>
                
                {/* Scrollable Category */}
                {event.category && (
                  <div className="flex overflow-x-auto w-full max-w-full mb-4 pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#800020]/15 text-[#ff6b81] uppercase tracking-wider whitespace-nowrap border border-[#800020]/30 shadow-sm shrink-0">
                      {event.category}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-white/60 w-full">
                  <MapPin size={14} className="shrink-0 text-[#800020]/70" />
                  <span className="truncate">{event.venue_name}</span>
                </div>
              </div>

              {/* Action & Capacity Row */}
              <div className="flex items-end justify-between mt-auto pt-5 border-t border-white/[0.05]">
                <div className="flex-1 max-w-[220px]">
                  {event.seats_left != null && !isPastEvent && (
                    <div className="space-y-1.5 hover:-translate-y-0.5 transition-transform">
                       <span className="inline-block px-3 py-1.5 rounded-lg bg-[#800020]/20 border border-[#800020]/30 shadow-[0_0_15px_rgba(128,0,32,0.15)]">
                         <span className="text-[11px] text-[#ff6b8b] font-bold tracking-widest uppercase">
                           {event.seats_left} {event.seats_left === 1 ? 'Seat' : 'Seats'} Remaining
                         </span>
                       </span>
                    </div>
                  )}
                </div>

                <div className="ml-4 shrink-0">
                  {isPastEvent ? (
                    <span className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/50 cursor-not-allowed uppercase tracking-wider text-[10px]">
                      Event Ended
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-sm font-medium text-white group-hover:bg-[#800020] group-hover:border-[#800020] transition-all duration-300 shadow-lg">
                      Get Tickets
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
