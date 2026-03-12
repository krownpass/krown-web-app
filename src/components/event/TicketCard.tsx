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

const statusVariantMap: Record<string, 'success' | 'default' | 'error'> = {
  active: 'success',
  confirmed: 'success',
  CONFIRMED: 'success',
  used: 'default',
  CHECKED_IN: 'default',
  cancelled: 'error',
  CANCELLED: 'error',
  refunded: 'default',
  PENDING: 'default'
};

export function TicketCard({ ticket, showQR = false, className }: TicketCardProps) {
  // Gracefully handle if ticket acts as registration object
  const event = ticket.event || (ticket as any);
  const statusStr = ticket.status ? String(ticket.status).toLowerCase() : 'unknown';

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
          <Image quality={90}
            src={event.cover_image}
            alt={event.title ?? 'Event'}
            fill
            className="object-cover"
            sizes="400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-black/40 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <Badge variant={statusVariantMap[ticket.status] || 'default'}>
              {statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
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
          {/* QR Code Section */}
          {showQR && ticket.qr_code && (
            <div className="flex flex-col items-center justify-center my-6">
              <div className="p-3 bg-white rounded-xl">
                <img 
                  src={ticket.qr_code} 
                  alt="Ticket QR Code" 
                  width={150} 
                  height={150}
                  className="rounded-lg"
                />
              </div>
              <p className="text-xs text-white/50 mt-3 text-center">
                Show this QR code at the entrance
              </p>
            </div>
          )}
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
            <Badge variant={statusVariantMap[ticket.status] || 'default'}>
              {statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
