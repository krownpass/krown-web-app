'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatTime, getCapacityPercent } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { Event } from '@/types/event';

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const capacityPercent = getCapacityPercent(
    event.current_registrations,
    event.max_capacity
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('group', className)}
    >
      <Link href={`/events/${event.slug ?? event.event_id}`}>
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden hover:border-[#3A3A3A] hover:shadow-2xl hover:shadow-black/40 transition-all duration-300">
          {/* Cover image */}
          <div className="relative aspect-[16/9] overflow-hidden">
            <ImageWithFallback
              src={event.cover_image ?? '/placeholder-event.jpg'}
              fallbackSrc="/placeholder-event.jpg"
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Category badge */}
            {event.category && (
              <div className="absolute top-3 left-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#800020]/90 text-white">
                  {event.category}
                </span>
              </div>
            )}

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
          <div className="p-3">
            <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2">
              {event.title}
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Calendar size={11} className="shrink-0" />
                <span>
                  {formatDate(event.start_time)} · {formatTime(event.start_time)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{event.venue_name}</span>
              </div>
            </div>

            {/* Capacity bar */}
            {event.max_capacity != null && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Users size={10} />
                    <span>{event.seats_left != null ? `${event.seats_left} left` : `${capacityPercent}% filled`}</span>
                  </div>
                  {event.seats_left != null && event.seats_left <= 10 && (
                    <span className="text-xs text-[#C11E38] font-medium">Almost full!</span>
                  )}
                </div>
                <ProgressBar
                  value={capacityPercent}
                  height={4}
                  color={capacityPercent >= 80 ? '#C11E38' : '#800020'}
                />
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
