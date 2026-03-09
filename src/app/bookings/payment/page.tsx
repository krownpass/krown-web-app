'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { Crown, CreditCard, Loader2 } from 'lucide-react';
import { useBookingDetail } from '@/queries/useBookings';
import { paymentService } from '@/services/payment.service';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { RAZORPAY_KEY_ID } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id') ?? '';
  const { data: booking } = useBookingDetail(bookingId);
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      const loaded = await paymentService.loadRazorpayScript();
      if (!loaded) { toast.error('Payment service unavailable'); return; }

      // Priority booking payment is now handled inline on the book page.
      // This page is kept as a fallback but should not normally be reached.
      toast.error('Please use the booking form to initiate payment.');
      router.back();
    } catch {
      toast.error('Failed to initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-sm mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#800020]/10 flex items-center justify-center mx-auto mb-4">
              <CreditCard size={28} className="text-[#800020]" />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-white mb-1">Complete Payment</h1>
            <p className="text-white/40 text-sm">Priority table booking</p>
          </div>

          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 space-y-3 text-sm">
            {booking && (
              <>
                <div className="flex justify-between">
                  <span className="text-white/50">Café</span>
                  <span className="text-white font-medium">{booking.cafe?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Date</span>
                  <span className="text-white">{formatDate(booking.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Time</span>
                  <span className="text-white">{booking.time_slot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Guests</span>
                  <span className="text-white">{booking.guest_count}</span>
                </div>
              </>
            )}
            <div className="border-t border-[#2A2A2A] pt-3 flex justify-between font-semibold">
              <span className="text-white/60">Priority Fee</span>
              <span className="text-[#D4AF37]">{formatCurrency(50)}</span>
            </div>
          </div>

          <div className="bg-[#800020]/10 border border-[#800020]/20 rounded-xl p-3 flex items-center gap-2">
            <Crown size={16} className="text-[#D4AF37]" />
            <p className="text-white/60 text-xs">Priority bookings guarantee your table and get Krown Points</p>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] disabled:opacity-50 text-white py-4 rounded-xl font-semibold transition-all"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
            {loading ? 'Opening payment...' : 'Pay ₹50'}
          </button>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
