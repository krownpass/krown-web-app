
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
  const capacityPercent = getCapacityPercent(
    event.current_registrations,
    event.max_capacity
  );

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

  const startDate = new Date(event.start_time);
  const month = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate();

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('group relative block', className)}
    >
      <Link href={`/events/${event.slug ?? event.event_id}`}>
        <div className="flex flex-col md:flex-row bg-[#0A0A0A] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-[#800020]/50 hover:shadow-[0_0_30px_rgba(128,0,32,0.15)] transition-all duration-500">
          
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

            {/* Category badge */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
              {event.category && (
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-sm bg-white text-black uppercase tracking-wider border border-white/20 shadow-lg">
                  {event.category}
                </span>
              )}
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

            {/* Price badge */}
            <div className="absolute top-3 right-3">
              <span
                className={cn(
                  'text-xs font-bold px-2.5 py-1 rounded-full',
                  event.is_paid
                    ? 'bg-black/60 text-white backdrop-blur-sm'
                    : 'bg-green-500/90 text-white'
                )}
              >
                {event.is_paid ? `₹${event.base_price}` : 'Free'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 md:p-8 flex flex-col justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-xs font-medium text-white/50 tracking-wide uppercase">
                     <span className="flex items-center gap-1.5 border border-white/10 px-2.5 py-1 rounded-md bg-white/[0.02]">
                       <Clock size={12} className="text-[#800020]" />
                       {formatTime(event.start_time)}
                     </span>
                     {event.is_paid ? (
                       <span className="text-white shrink-0 block border border-[#800020]/30 bg-[#800020]/10 px-2.5 py-1 rounded-md text-[11px] uppercase">₹{event.base_price}</span>
                     ) : (
                       <span className="text-white/70 block shrink-0 border border-white/10 px-2.5 py-1 rounded-md bg-white/[0.02]">Free</span>
                     )}
                  </div>
                </div>

                <h3 className="font-playfair font-bold text-white text-2xl md:text-3xl leading-tight mb-3 group-hover:text-[#800020] transition-colors duration-300">
                  {event.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin size={14} className="shrink-0 text-[#800020]/70" />
                  <span className="truncate">{event.venue_name}</span>
                </div>
              </div>

              {/* Action & Capacity Row */}
              <div className="flex items-end justify-between mt-auto pt-5 border-t border-white/[0.05]">
                <div className="flex-1 max-w-[220px]">
                  {event.max_capacity != null && (
                    <div className="space-y-2.5">
                       <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-widest">
                         <span>Tickets Sold</span>
                         <span>{capacityPercent}%</span>
                       </div>
                       <ProgressBar
                         value={capacityPercent}
                         height={3}
                         color={capacityPercent >= 80 ? '#C11E38' : '#800020'}
                       />
                       {event.seats_left != null && event.seats_left <= 10 && (
                         <p className="text-[10px] text-[#C11E38] font-bold tracking-widest uppercase">Almost Sold Out</p>
                       )}
                    </div>
                  )}
                </div>
                
                <div className="ml-4 shrink-0">
                  <span className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-sm font-medium text-white group-hover:bg-[#800020] group-hover:border-[#800020] transition-all duration-300 shadow-lg">
                    Get Tickets
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
