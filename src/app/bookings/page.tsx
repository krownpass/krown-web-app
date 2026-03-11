'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookingCard } from '@/components/booking/BookingCard';
import { TicketCard } from '@/components/event/TicketCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useMyBookings, useCancelBooking } from '@/queries/useBookings';
import { useMyTickets } from '@/queries/useEventDetail';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const CAFE_STATUS_FILTERS = ['All', 'Pending', 'Accepted', 'Rejected'];
const EVENT_STATUS_FILTERS = ['All', 'Active', 'Used', 'Past Tickets'];

const TABS = [
  { label: 'Café Tables', value: 'cafe' },
  { label: 'Experiences', value: 'event' },
];

export default function BookingsPage() {
  const router = useRouter();
  const [tabType, setTabType] = useState<'cafe' | 'event'>('cafe');
  const [statusFilter, setStatusFilter] = useState('All');

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
  const isLoading = tabType === 'cafe' ? isLoadingBookings : isLoadingTickets;

  const filtered = currentList.filter((item: any) => {
    if (statusFilter === 'All') return true;

    if (tabType === 'event' && statusFilter === 'Past Tickets') {
      const event = item.event;
      if (!event) return false;
      const isPast = event.end_time 
        ? new Date(event.end_time).getTime() < Date.now() 
        : new Date(event.start_time).getTime() < Date.now();
      return isPast || item.status.toLowerCase() === 'used' || item.status.toLowerCase() === 'cancelled' || item.status.toLowerCase() === 'refunded';
    }

    if (tabType === 'event' && statusFilter === 'Active') {
      const event = item.event;
      if (event) {
        const isPast = event.end_time 
          ? new Date(event.end_time).getTime() < Date.now() 
          : new Date(event.start_time).getTime() < Date.now();
        if (isPast) return false;
      }
    }

    return item.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <ProtectedRoute>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-10 min-h-screen bg-[#050505]">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-8">
            <div className="sticky top-24">
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="font-playfair text-2xl font-bold text-white leading-tight">My Bookings</h1>
                  <p className="text-white/40 text-xs mt-1 uppercase tracking-wider font-bold">Manage Reservations</p>
                </motion.div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest pl-2 mb-3">Booking Type</p>
                <div className="flex flex-col gap-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => { setTabType(tab.value as 'cafe' | 'event'); setStatusFilter('All'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${tabType === tab.value ? 'bg-[#800020]/10 text-white font-medium border border-[#800020]/20' : 'text-white/60 hover:bg-white/[0.02] border border-transparent hover:text-white'}`}
                    >
                      {tab.label}
                      {tabType === tab.value && <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest pl-2 mb-3">Status</p>
                <div className="flex flex-col gap-2">
                  {(tabType === 'cafe' ? CAFE_STATUS_FILTERS : EVENT_STATUS_FILTERS).map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${statusFilter === f ? 'bg-white/[0.05] text-white font-medium border border-white/10' : 'text-white/60 hover:bg-white/[0.02] border border-transparent hover:text-white'}`}
                    >
                      {f}
                      {statusFilter === f && <span className="w-1.5 h-1.5 rounded-full bg-white/50" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[240px] rounded-2xl bg-[#0A0A0A] border border-white/[0.05]" />)}
              </div>
            ) : tabType === 'event' && filtered.length === 0 ? (
              <div className="mt-12 bg-[#0A0A0A] border border-white/[0.05] rounded-3xl p-12 flex items-center justify-center">
                <EmptyState
                  icon="CalendarX"
                  title="No events yet"
                  subtitle="Explore our events and book a spot"
                  actionLabel="Explore Events"
                  onAction={() => window.location.href = '/events'}
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-12 bg-[#0A0A0A] border border-white/[0.05] rounded-3xl p-12 flex items-center justify-center">
                <EmptyState
                  icon="CalendarX"
                  title={tabType === 'cafe' ? 'No cafe bookings found' : 'No event bookings found'}
                  subtitle={statusFilter !== 'All' ? 'Try changing the filter' : tabType === 'cafe' ? 'Book a table at one of our cafés' : 'Register for upcoming events'}
                  actionLabel={tabType === 'cafe' ? 'Explore Cafés' : 'Explore Events'}
                  onAction={() => window.location.href = tabType === 'cafe' ? '/cafes' : '/events'}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filtered.map((item: any, i) => (
                  <motion.div key={item.booking_id || item.registration_id || item.id || item.ticket_id} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}>
                    {tabType === 'cafe' ? (
                      <BookingCard booking={item} onCancel={handleCancel} />
                    ) : (
                      <BookingCard booking={item} onCancel={handleCancel} isEvent={true} />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}