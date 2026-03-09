'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Calendar, Clock, Users, MapPin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { BookingStatusBadge } from './BookingStatusBadge';
import type { Booking } from '@/types/booking';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: string) => void;
  className?: string;
}

const SNAP_THRESHOLD = -72;

export function BookingCard({ booking, onCancel, className }: BookingCardProps) {
  const x = useMotionValue(0);
  const actionOpacity = useTransform(x, [0, SNAP_THRESHOLD], [0, 1]);

  const canCancel = ['pending', 'accepted'].includes(booking.status);

  const cafe = booking.cafe;
  const event = booking.event;
  const name = cafe?.name ?? event?.title ?? 'Booking';
  const image = cafe?.cover_image ?? event?.cover_image;
  const location = cafe?.address ?? (event ? event.venue_name : '');
  const dateStr = event ? event.start_time : booking.date;

  const snapBack = () => animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
  const snapOpen = () => animate(x, SNAP_THRESHOLD, { type: 'spring', stiffness: 500, damping: 35 });

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const shouldOpen = info.offset.x < SNAP_THRESHOLD / 2 || info.velocity.x < -300;
    if (shouldOpen && canCancel) {
      snapOpen();
    } else {
      snapBack();
    }
  };

  const handleCancel = () => {
    animate(x, -400, { duration: 0.25, ease: 'easeIn' }).then(() => {
      onCancel?.(booking.booking_id);
    });
  };

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      {/* Red action panel behind card */}
      {canCancel && (
        <motion.div
          style={{ opacity: actionOpacity }}
          className="absolute inset-y-0 right-0 w-20 bg-red-600 flex flex-col items-center justify-center gap-1 rounded-r-xl"
          onClick={handleCancel}
        >
          <Trash2 size={18} className="text-white" />
          <span className="text-white text-[10px] font-medium">Cancel</span>
        </motion.div>
      )}

      {/* Swipeable card */}
      <motion.div
        style={{ x }}
        drag={canCancel ? 'x' : false}
        dragConstraints={{ left: SNAP_THRESHOLD, right: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        className="relative bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden touch-pan-y select-none"
      >
        <Link
          href={`/bookings/${booking.booking_id}`}
          onClick={(e) => { if (x.get() !== 0) { e.preventDefault(); snapBack(); } }}
        >
          <div className="flex items-stretch">
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
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>{booking.time_slot}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Users size={11} />
                  <span>{booking.guest_count} {booking.guest_count === 1 ? 'guest' : 'guests'}</span>
                </div>
              </div>

              {canCancel && (
                <p className="text-white/20 text-[10px] mt-1.5">swipe left to cancel</p>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
