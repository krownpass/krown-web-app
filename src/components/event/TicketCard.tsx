import React from 'react';
import Image from 'next/image';
import { Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Ticket } from '@/types/event';

interface TicketCardProps {
  ticket: Ticket;
  showQR?: boolean;
  className?: string;
}

const statusVariantMap: Record<Ticket['status'], 'success' | 'default' | 'error'> = {
  active: 'success',
  used: 'default',
  cancelled: 'error',
  refunded: 'default',
};

export function TicketCard({ ticket, showQR = false, className }: TicketCardProps) {
  const event = ticket.event;

  return (
    <div
      className={cn(
        'bg-[#1E1E1E] rounded-2xl overflow-hidden border border-[#2A2A2A]',
        className
      )}
    >
      {/* Event image header */}
      {event?.cover_image && (
        <div className="relative h-36 overflow-hidden">
          <Image
            src={event.cover_image}
            alt={event.title ?? 'Event'}
            fill
            className="object-cover"
            sizes="400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-black/40 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <Badge variant={statusVariantMap[ticket.status]}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </Badge>
          </div>
        </div>
      )}

      {/* Event info */}
      <div className="p-4">
        {event && (
          <>
            <h3 className="font-playfair text-lg font-bold text-white mb-2">{event.title}</h3>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Calendar size={13} />
                <span>
                  {formatDate(event.start_time)} · {formatTime(event.start_time)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin size={13} />
                <span>{event.venue_name}</span>
              </div>
            </div>
          </>
        )}

        {/* Perforated divider */}
        <div className="relative my-4">
          <div className="border-t border-dashed border-[#3A3A3A]" />
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#111]" />
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#111]" />
        </div>

        {/* Ticket number */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/30 mb-0.5">Ticket #</p>
            <p className="text-sm font-mono font-semibold text-white">{ticket.ticket_number}</p>
          </div>
          {ticket.seat_number && (
            <div className="text-right">
              <p className="text-xs text-white/30 mb-0.5">Seat</p>
              <p className="text-sm font-mono font-semibold text-white">{ticket.seat_number}</p>
            </div>
          )}
          {!event?.cover_image && (
            <Badge variant={statusVariantMap[ticket.status]}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
