'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCafeDetail } from '@/queries/useCafeDetail';
import { useCreateBooking } from '@/queries/useBookings';
import { BookingForm } from '@/components/cafe/BookingForm';
import { RatingStars } from '@/components/shared/RatingStars';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { toast } from 'sonner';
import type { BookingFormData } from '@/components/cafe/BookingForm';
import Image from 'next/image';
import { bookingService } from '@/services/booking.service';
import { paymentService } from '@/services/payment.service';
import { useAuthStore } from '@/stores/authStore';
import { RAZORPAY_KEY_ID, PRIORITY_BOOKING_FEE } from '@/lib/constants';

export default function BookCafePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: cafe, isLoading } = useCafeDetail(params.slug);
  const createBooking = useCreateBooking();
  const { user } = useAuthStore();

  const handleBook = async (data: BookingFormData) => {
    if (!cafe) return;

    const bookingData = {
      cafe_id: cafe.cafe_id,
      booking_type: data.bookingType,
      date: data.date,
      time_slot: data.timeSlot,
      guest_count: data.guestCount,
      special_requests: data.specialRequests || undefined,
    };

    if (data.bookingType === 'priority') {
      // Priority booking: create with payment
      try {
        const loaded = await paymentService.loadRazorpayScript();
        if (!loaded) { toast.error('Payment service unavailable'); return; }

        const result = await bookingService.createBookingWithPayment(bookingData, PRIORITY_BOOKING_FEE);
        const { sdkPayload, transaction_id } = result;

        const rzp = new window.Razorpay({
          key: sdkPayload.keyId ?? RAZORPAY_KEY_ID,
          amount: sdkPayload.amount,
          currency: sdkPayload.currency,
          name: 'Krown',
          description: 'Priority Table Booking',
          order_id: sdkPayload.orderId,
          prefill: { name: user?.name, contact: user?.phone, email: user?.email },
          theme: { color: '#800020' },
          handler: async (response) => {
            try {
              await bookingService.verifyBookingPayment({
                transaction_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success('Priority booking confirmed!');
              router.push(`/bookings/confirmed?id=${result.data.booking_id}`);
            } catch {
              toast.error('Payment verification failed.');
            }
          },
          modal: { ondismiss: () => {} },
        });
        rzp.open();
      } catch {
        toast.error('Failed to create priority booking. Please try again.');
      }
    } else {
      // Standard free booking
      createBooking.mutate(bookingData, {
        onSuccess: (booking) => router.push(`/bookings/confirmed?id=${booking.booking_id}`),
        onError: () => toast.error('Failed to create booking. Please try again.'),
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Book a Table</h1>
        </div>

        {/* Café info card */}
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl mb-6" />
        ) : cafe ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl mb-6"
          >
            {cafe.cover_image && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={cafe.cover_image} alt={cafe.name} fill className="object-cover" sizes="64px" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-white text-sm">{cafe.name}</h2>
              <RatingStars rating={cafe.rating ?? 0} size={11} className="my-0.5" />
              <p className="text-white/40 text-xs">{cafe.area ?? cafe.city}</p>
            </div>
          </motion.div>
        ) : null}

        {/* Booking form */}
        {cafe && (
          <BookingForm
            cafeId={cafe.cafe_id}
            onSubmit={handleBook}
            isLoading={createBooking.isPending}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
