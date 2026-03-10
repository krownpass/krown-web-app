'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookingCard } from '@/components/booking/BookingCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useMyBookings, useCancelBooking } from '@/queries/useBookings';
import { toast } from 'sonner';

const STATUS_FILTERS = ['All', 'Pending', 'Accepted', 'Cancelled', 'Rejected'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const TABS = [
  { label: 'Café Tables', value: 'tables' },
  { label: 'Experiences', value: 'experiences' },
];

export default function BookingsPage() {
  const [tabType, setTabType] = useState<'tables' | 'experiences'>('tables');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const { data: bookings = [], isLoading } = useMyBookings();
  const cancelBooking = useCancelBooking();

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking.mutateAsync(id);
      toast.success('Booking cancelled');
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter === 'All') return true;
    return b.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-playfair text-2xl font-bold text-white">My Bookings</h1>
          <p className="text-white/40 text-sm">Manage your reservations</p>
        </motion.div>

        <Tabs tabs={TABS} activeTab={tabType} onChange={(v) => setTabType(v as 'tables' | 'experiences')} className="mb-4" />

        {/* Status filters */}
        {tabType === 'tables' && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${statusFilter === f ? 'bg-[#800020] border-[#800020] text-white' : 'border-[#2A2A2A] text-white/50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : tabType === 'experiences' ? (
          <EmptyState
            icon="CalendarX"
            title="No experiences yet"
            subtitle="Explore our experiences and book a spot"
            actionLabel="Explore Experiences"
            onAction={() => window.location.href = '/events'}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="CalendarX"
            title="No bookings found"
            subtitle={statusFilter !== 'All' ? 'Try changing the filter' : 'Book a table at one of our cafés'}
            actionLabel="Explore Cafés"
            onAction={() => window.location.href = '/cafes'}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((booking, i) => (
              <motion.div key={booking.booking_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <BookingCard booking={booking} onCancel={handleCancel} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
