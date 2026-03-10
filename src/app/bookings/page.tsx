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

const CAFE_STATUS_FILTERS = ['All', 'Pending', 'Accepted', 'Cancelled', 'Rejected'];
const EVENT_STATUS_FILTERS = ['All', 'Active', 'Used', 'Cancelled', 'Refunded'];

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
    return item.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-playfair text-2xl font-bold text-white">My Bookings</h1>
            <p className="text-white/40 text-sm">Manage your reservations</p>
          </motion.div>
        </div>

        <Tabs tabs={TABS} activeTab={tabType} onChange={(v) => { setTabType(v as 'cafe' | 'event'); setStatusFilter('All'); }} className="mb-4" />

        {/* Status filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {(tabType === 'cafe' ? CAFE_STATUS_FILTERS : EVENT_STATUS_FILTERS).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${statusFilter === f ? 'bg-[#800020] border-[#800020] text-white' : 'border-[#2A2A2A] text-white/50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : tabType === 'event' && filtered.length === 0 ? (
          <EmptyState
            icon="CalendarX"
            title="No events yet"
            subtitle="Explore our events and book a spot"
            actionLabel="Explore Events"
            onAction={() => window.location.href = '/events'}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="CalendarX"
            title={tabType === 'cafe' ? 'No cafe bookings found' : 'No event bookings found'}
            subtitle={statusFilter !== 'All' ? 'Try changing the filter' : tabType === 'cafe' ? 'Book a table at one of our cafés' : 'Register for upcoming events'}
            actionLabel={tabType === 'cafe' ? 'Explore Cafés' : 'Explore Events'}
            onAction={() => window.location.href = tabType === 'cafe' ? '/cafes' : '/events'}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((item: any, i) => (
              <motion.div key={item.booking_id || item.registration_id || item.id || item.ticket_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
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
    </ProtectedRoute>
  );
}
