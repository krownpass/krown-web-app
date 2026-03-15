'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookingCard } from '@/components/booking/BookingCard';
import { TicketCard } from '@/components/event/TicketCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useMyBookings, useCancelBooking } from '@/queries/useBookings';
import { useMyTickets } from '@/queries/useEventDetail';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// ── Café booking_status DB enum filter ──
const CAFE_STATUS_FILTERS = [
  { label: 'All',       value: 'all'       },
  { label: 'Pending',   value: 'pending'   },
  { label: 'Accepted',  value: 'accepted'  },
  { label: 'Cancelled', value: 'cancelled' },
];

// ── Event registration_status DB enum filter ──
const EVENT_STATUS_FILTERS = [
  { label: 'All',       value: 'all'       },
  { label: 'Pending',   value: 'PENDING'   },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const TABS = [
  { label: 'Café Tables',  value: 'cafe'  },
  { label: 'Experiences',  value: 'event' },
];

// Upcoming = pending / confirmed statuses with future event date
const CAFE_UPCOMING = new Set(['pending', 'accepted']);
const EVENT_UPCOMING = new Set(['PENDING', 'CONFIRMED']);

function isCafeUpcoming(booking: any): boolean {
  return CAFE_UPCOMING.has(booking.status);
}

function isEventUpcoming(ticket: any): boolean {
  if (!EVENT_UPCOMING.has(ticket.status)) return false;
  const event = ticket.event;
  if (!event) return true;
  const cutoff = event.end_time
    ? new Date(event.end_time)
    : event.start_time
      ? new Date(event.start_time)
      : null;
  return cutoff ? cutoff > new Date() : true;
}

export default function BookingsPage() {
  const router = useRouter();
  const [tabType, setTabType] = useState<'cafe' | 'event'>('cafe');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: bookings = [], isLoading: isLoadingBookings } = useMyBookings('cafe');
  const { data: tickets = [], isLoading: isLoadingTickets } = useMyTickets();
  const cancelBooking = useCancelBooking();

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking.mutateAsync(id);
      toast.success('Booking cancelled');
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const currentList = tabType === 'cafe' ? bookings : tickets;
  const isLoading   = tabType === 'cafe' ? isLoadingBookings : isLoadingTickets;
  const filters     = tabType === 'cafe' ? CAFE_STATUS_FILTERS : EVENT_STATUS_FILTERS;

  // Apply status filter
  const statusFiltered = currentList.filter((item: any) => {
    if (statusFilter === 'all') return true;
    
    // Grouping logic for Cafe 
    if (tabType === 'cafe') {
      if (statusFilter === 'cancelled') {
        return ['cancelled', 'rejected'].includes(item.status);
      }
    }

    // If we're looking at events, grouping some statuses into "Confirmed" and "Cancelled"
    if (tabType === 'event') {
      if (statusFilter === 'CONFIRMED') {
        return ['CONFIRMED', 'CHECKED_IN'].includes(item.status);
      }
      if (statusFilter === 'CANCELLED') {
        return ['CANCELLED', 'REJECTED'].includes(item.status);
      }
    }
    
    return item.status === statusFilter;
  });

  // Split into upcoming and past sections
  const upcoming = statusFiltered.filter((item: any) =>
    tabType === 'cafe' ? isCafeUpcoming(item) : isEventUpcoming(item)
  );
  const past = statusFiltered.filter((item: any) =>
    tabType === 'cafe' ? !isCafeUpcoming(item) : !isEventUpcoming(item)
  );

  const renderCard = (item: any, i: number) => (
    <motion.div
      key={item.booking_id || item.registration_id || item.ticket_id || i}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
    >
      {tabType === 'cafe' ? (
        <BookingCard booking={item} onCancel={handleCancel} />
      ) : (
        <Link href={`/events/my-tickets/${item.event_id}`}>
          <TicketCard ticket={item} className="hover:border-[#800020]/50 transition-colors cursor-pointer" />
        </Link>
      )}
    </motion.div>
  );

  return (
    <ProtectedRoute>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-10 min-h-screen bg-[#050505]">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full">

          {/* ── Sidebar ── */}
          <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-24 space-y-8">

              {/* Header */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="font-playfair text-2xl font-bold text-white leading-tight">My Bookings</h1>
                  <p className="text-white/40 text-xs mt-1 uppercase tracking-wider font-bold">Manage Reservations</p>
                </motion.div>
              </div>

              {/* Booking Type */}
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest pl-2 mb-3 md:block hidden">Booking Type</p>
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => { setTabType(tab.value as 'cafe' | 'event'); setStatusFilter('all'); }}
                      className={`whitespace-nowrap w-auto md:w-full shrink-0 text-left px-4 py-2 rounded-lg text-sm transition-all flex items-center justify-between gap-3 ${
                        tabType === tab.value
                          ? 'bg-[#800020]/10 text-white font-medium border border-[#800020]/20'
                          : 'text-white/60 hover:bg-white/[0.02] border border-transparent hover:text-white bg-white/[0.02] md:bg-transparent'
                      }`}
                    >
                      {tab.label}
                      {tabType === tab.value && <span className="w-1.5 h-1.5 rounded-full bg-[#800020] hidden md:block" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filter */}
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest pl-2 mb-3 md:block hidden">Status</p>
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {filters.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={`whitespace-nowrap w-auto md:w-full shrink-0 text-left px-4 py-2 rounded-lg text-sm transition-all flex items-center justify-between gap-3 ${
                        statusFilter === f.value
                          ? 'bg-white/[0.05] text-white font-medium border border-white/10'
                          : 'text-white/60 hover:bg-white/[0.02] border border-transparent hover:text-white bg-white/[0.02] md:bg-transparent'
                      }`}
                    >
                      {f.label}
                      {statusFilter === f.value && <span className="w-1.5 h-1.5 rounded-full bg-white/50 hidden md:block" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[240px] rounded-2xl bg-[#0A0A0A] border border-white/[0.05]" />
                ))}
              </div>
            ) : statusFiltered.length === 0 ? (
              <div className="mt-12 bg-[#0A0A0A] border border-white/[0.05] rounded-3xl p-12 flex items-center justify-center">
                <EmptyState
                  icon="CalendarX"
                  title={tabType === 'cafe' ? 'No café bookings found' : 'No event registrations found'}
                  subtitle={statusFilter !== 'all' ? 'Try changing the filter' : tabType === 'cafe' ? 'Book a table at one of our cafés' : 'Register for upcoming events'}
                  actionLabel={tabType === 'cafe' ? 'Explore Cafés' : 'Explore Events'}
                  onAction={() => window.location.href = tabType === 'cafe' ? '/cafes' : '/events'}
                />
              </div>
            ) : (
              <div className="space-y-14">

                {/* ── Upcoming section ── */}
                {upcoming.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h2 className="text-xs font-bold text-white/60 uppercase tracking-widest">
                          {tabType === 'cafe' ? 'Upcoming Reservations' : 'Upcoming Events'}
                        </h2>
                      </div>
                      <div className="flex-1 h-px bg-white/[0.05]" />
                      <span className="text-xs text-white/30">{upcoming.length}</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {upcoming.map((item: any, i) => renderCard(item, i))}
                    </div>
                  </section>
                )}

                {/* ── Past section ── */}
                {past.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white/20" />
                        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                          {tabType === 'cafe' ? 'Past Reservations' : 'Past Tickets'}
                        </h2>
                      </div>
                      <div className="flex-1 h-px bg-white/[0.05]" />
                      <span className="text-xs text-white/20">{past.length}</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-70">
                      {past.map((item: any, i) => renderCard(item, i))}
                    </div>
                  </section>
                )}

              </div>
            )}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}