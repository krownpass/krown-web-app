'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { Event } from '@/types/event';
import { useAuthStore } from '@/stores/authStore';
import { useAddEventBookmark, useRemoveEventBookmark, useEventBookmarks } from '@/queries/useUser';
import { toast } from 'sonner';

interface EventCardCompactProps {
  event: Event;
  className?: string;
}

export function EventCardCompact({ event, className }: EventCardCompactProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: userBookmarks = [] } = useEventBookmarks();
  const { mutate: addBookmark } = useAddEventBookmark();
  const { mutate: removeBookmark } = useRemoveEventBookmark();

  const isServerBookmarked = event.is_bookmarked || userBookmarks.some((b: any) => b.event_id === event.event_id);
  const [isBookmarked, setIsBookmarked] = useState(isServerBookmarked);

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
      removeBookmark(event.event_id, { onError: () => setIsBookmarked(true) });
    } else {
      setIsBookmarked(true);
      addBookmark(event.event_id, { onError: () => setIsBookmarked(false) });
    }
  };

  const isPastEvent = event.end_time ? new Date(event.end_time).getTime() < Date.now() : new Date(event.start_time).getTime() < Date.now();
  const startDate = new Date(event.start_time);
  const month = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate();
  const weekday = startDate.toLocaleString('en-US', { weekday: 'short' });
  const time = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <Link href={`/events/${event.slug ?? event.event_id}`} className={cn('group block h-full', className)}>
      <div className="relative h-full flex flex-col rounded-2xl overflow-hidden bg-[#111] border border-white/[0.06] hover:border-[#800020]/40 transition-all duration-400">
        
        {/* Cover Image */}
        <div className="relative w-full aspect-[4/3] overflow-hidden shrink-0">
          <ImageWithFallback
            src={event.cover_image ?? '/placeholder-event.jpg'}
            fallbackSrc="/placeholder-event.jpg"
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="380px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-80" />

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-all"
          >
            <Heart
              size={16}
              className={cn(
                'transition-all',
                isBookmarked ? 'fill-[#C11E38] text-[#C11E38]' : 'fill-transparent text-white/70'
              )}
            />
          </button>

          {/* Price pill */}
          <div className="absolute top-3 left-3 z-10">
            <span className={cn(
              'text-[11px] font-bold px-2.5 py-1 rounded-full',
              event.is_paid ? 'bg-white/90 text-black' : 'bg-green-500 text-white'
            )}>
              {event.is_paid ? `₹${event.base_price}` : 'Free'}
            </span>
          </div>
        </div>

        {/* Content — spacious and clean */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Date row */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-center bg-[#800020]/10 border border-[#800020]/20 rounded-lg px-2.5 py-1.5 min-w-[48px]">
              <span className="text-[9px] font-bold text-[#800020] uppercase leading-none">{month}</span>
              <span className="text-base font-black text-white leading-tight">{day}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white/40 text-[11px] font-medium">{weekday} • {time}</span>
              {event.venue_name && (
                <span className="text-white/50 text-xs flex items-center gap-1 truncate mt-0.5">
                  <MapPin size={10} className="shrink-0 text-[#800020]/60" />
                  {event.venue_name}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-playfair font-bold text-white text-[17px] leading-snug line-clamp-2 group-hover:text-[#ff6b81] transition-colors duration-300">
            {event.title}
          </h3>

          <div className="flex-1" />

          {/* Category + Status */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04] mt-2">
            {event.seats_left != null && !isPastEvent ? (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[#800020]/20 text-[#ff6b81] border border-[#800020]/30 tracking-widest uppercase">
                {event.seats_left} {event.seats_left === 1 ? 'Seat' : 'Seats'} Left
              </span>
            ) : event.category ? (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.04] text-white/50 border border-white/[0.06] uppercase tracking-wider truncate">
                {event.category}
              </span>
            ) : <span />}
            {isPastEvent ? (
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider shrink-0">Ended</span>
            ) : (
              <span className="text-[10px] font-bold text-[#800020] uppercase tracking-wider shrink-0">Get Tickets →</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
