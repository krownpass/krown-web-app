'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { BookingStatusBadge } from './BookingStatusBadge';
import { formatTime } from '@/lib/utils';
import type { Booking } from '@/types/booking';

interface BookingCardProps {
  booking: any;
  onCancel?: (id: string) => void;
  className?: string;
  isEvent?: boolean;
}

const SNAP_THRESHOLD = -72;

export function BookingCard({ booking, onCancel, className, isEvent = false }: BookingCardProps) {
  const cafe = booking.cafe;
  const event = booking.event;
  const name = cafe?.name ?? event?.title ?? 'Booking';
  const image = cafe?.cover_image ?? event?.cover_image;
  const location = cafe?.address ?? (event ? event.venue_name : '');
  const dateStr = event ? event.start_time : booking.date;
  const timeSlot = isEvent ? (event?.start_time ? formatTime(event.start_time) : '') : booking.time_slot;
  const guestCount = isEvent ? booking.ticket_count || 1 : booking.guest_count;
  const id = isEvent ? booking.ticket_id : booking.booking_id;
  const linkHref = isEvent ? `/events/my-tickets/${booking.event_id}` : `/bookings/${id}`;

  return (
    <div className={cn("group block", className)}>
      <Link href={linkHref}>
        <div className="relative bg-[#0A0A0A] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-[#800020]/50 hover:shadow-[0_0_30px_rgba(128,0,32,0.15)] transition-all duration-500 h-full flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative w-full sm:w-[35%] h-[180px] sm:h-auto min-h-[160px] overflow-hidden shrink-0">
            {image ? (
              <Image quality={90} 
                src={image} 
                alt={name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                sizes="(max-width: 640px) 100vw, 35vw" 
              />
            ) : (
              <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                <span className="text-white/20 text-3xl font-playfair">K</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#0A0A0A] via-black/40 to-transparent opacity-90" />
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 md:p-6 flex flex-col justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full gap-4">
              <div>
                <h3 className="font-playfair font-bold text-white text-xl leading-tight mb-2 group-hover:text-[#800020] transition-colors duration-300">
                  {name}
                </h3>
  
                {location && (
                  <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
                    <MapPin size={14} className="shrink-0 text-[#800020]/70" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-white/[0.05]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Date</span>
                  <div className="flex items-center gap-1.5 text-sm text-white/80">
                    <Calendar size={14} className="text-[#D4AF37]/70" />
                    <span>{formatDate(dateStr)}</span>
                  </div>
                </div>
                
                {timeSlot && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Time</span>
                    <div className="flex items-center gap-1.5 text-sm text-white/80">
                      <Clock size={14} className="text-[#D4AF37]/70" />
                      <span>{timeSlot}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Party</span>
                  <div className="flex items-center gap-1.5 text-sm text-white/80">
                    <Users size={14} className="text-[#D4AF37]/70" />
                    <span>{guestCount} {guestCount === 1 ? (isEvent ? 'ticket' : 'guest') : (isEvent ? 'tickets' : 'guests')}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
