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
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      <Link href={linkHref}>
        <div className="relative bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden touch-pan-y select-none flex items-stretch">
          {/* Image */}
          <div className="relative w-24 shrink-0">
            {image ? (
              <Image src={image} alt={name} fill className="object-cover" sizes="96px" />
            ) : (
              <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                <span className="text-white/20 text-2xl font-playfair">K</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-white truncate">{name}</h3>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="space-y-1">
              {location && (
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <MapPin size={11} />
                  <span className="truncate">{location}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-white/40">
                <div className="flex items-center gap-1">
                  <Calendar size={11} />
                  <span>{formatDate(dateStr)}</span>
                </div>
                {timeSlot && (
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>{timeSlot}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-white/40">
                <Users size={11} />
                <span>{guestCount} {guestCount === 1 ? (isEvent ? 'ticket' : 'guest') : (isEvent ? 'tickets' : 'guests')}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
