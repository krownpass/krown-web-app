'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { useBookingDetail, useCancelBooking } from '@/queries/useBookings';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: booking, isLoading } = useBookingDetail(params.id);
  const cancelBooking = useCancelBooking();
  const [showConfirm, setShowConfirm] = useState(false);

  const canCancel = booking && ['pending', 'accepted'].includes(booking.status);

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync(params.id);
      toast.success('Booking cancelled');
      setShowConfirm(false);
      router.push('/bookings');
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Booking Details</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : !booking ? null : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Café card */}
            <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden">
              {booking.cafe?.cover_image && (
                <div className="relative h-36">
                  <Image quality={90} src={booking.cafe.cover_image} alt={booking.cafe.name ?? ''} fill className="object-cover" sizes="768px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] to-transparent" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-white text-lg">{booking.cafe?.name ?? booking.event?.title}</h2>
                  <BookingStatusBadge status={booking.status} />
                </div>

                <div className="space-y-2 text-sm text-white/60">
                  {booking.cafe?.address && (
                    <div className="flex items-center gap-2"><MapPin size={14} className="text-[#800020]" />{booking.cafe.address}</div>
                  )}
                  <div className="flex items-center gap-2"><Clock size={14} className="text-[#800020]" />{formatDate(booking.date)} · {booking.time_slot}</div>
                  <div className="flex items-center gap-2"><Users size={14} className="text-[#800020]" />{booking.guest_count} Guests</div>
                  {booking.booking_type === 'priority' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#D4AF37] text-xs font-semibold">Priority Booking</span>
                    </div>
                  )}
                </div>

                {booking.special_requests && (
                  <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
                    <div className="flex items-start gap-2 text-sm text-white/50">
                      <MessageSquare size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{booking.special_requests}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking ID */}
            <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Booking ID</p>
              <p className="text-white font-mono text-sm">{booking.booking_id}</p>
            </div>

            {canCancel && (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-3 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-500/10 transition-all"
              >
                Cancel Booking
              </button>
            )}
          </motion.div>
        )}

        {/* Confirm cancel modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60"
              onClick={() => setShowConfirm(false)}
            >
              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={20} className="text-red-400" />
                  <h3 className="font-semibold text-white">Cancel Booking?</h3>
                </div>
                <p className="text-white/50 text-sm mb-6">This action cannot be undone. Your booking will be cancelled.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 border border-[#2A2A2A] text-white/60 rounded-xl text-sm hover:border-[#3A3A3A]">
                    Keep Booking
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelBooking.isPending}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-500 disabled:opacity-50"
                  >
                    {cancelBooking.isPending ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
