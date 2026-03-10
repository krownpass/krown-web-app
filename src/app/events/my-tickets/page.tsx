'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TicketCard } from '@/components/event/TicketCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useMyTickets } from '@/queries/useEventDetail';

export default function MyTicketsPage() {
  const { data: tickets = [], isLoading } = useMyTickets();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const now = new Date();
  const filtered = tickets.filter((t) => {
    if (filter === 'all') return true;
    const event = t.event || (t as any);
    const eventDate = event?.start_time ? new Date(event.start_time) : null;
    if (filter === 'upcoming') return eventDate ? eventDate > now : true;
    if (filter === 'past') return eventDate ? eventDate <= now : false;
    return true;
  });

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-playfair text-2xl font-bold text-white">My Tickets</h1>
          <p className="text-white/40 text-sm">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {(['all', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${filter === f ? 'bg-[#800020] border-[#800020] text-white' : 'border-[#2A2A2A] text-white/50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="Ticket" title="No tickets found" subtitle="Register for events to see your tickets here" actionLabel="Explore Events" onAction={() => window.location.href = '/events'} />
        ) : (
          <div className="space-y-4">
            {filtered.map((ticket, i) => (
              <motion.div key={(ticket as any).registration_id || ticket.ticket_id || i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Link href={`/events/my-tickets/${ticket.event_id}`}>
                  <TicketCard ticket={ticket} className="hover:border-[#800020] transition-colors cursor-pointer" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
