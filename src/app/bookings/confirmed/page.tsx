'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, MapPin, Clock, Users, Crown, ArrowRight } from 'lucide-react';
import { useBookingDetail } from '@/queries/useBookings';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import { ReservationSuccess } from '@/components/animations/ReservationSuccess';

export default function BookingConfirmedPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id') ?? '';
  const { data: booking, isLoading } = useBookingDetail(bookingId);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
    setShowContent(true);
  }, []);

  return (
    <>
      {/* Celebration animation — plays first, then fades out */}
      <ReservationSuccess show={showAnimation} onComplete={handleAnimationComplete} duration={3200} />

      {/* Page content — appears after animation completes */}
      <motion.div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
      <div className="max-w-sm w-full">
        {/* Checkmark animation */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative"
          >
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              >
                <CheckCircle size={48} className="text-green-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-6"
        >
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">Your table is reserved!</h1>
          <p className="text-white/50 text-sm">We&apos;ve sent you a confirmation</p>
        </motion.div>

        {isLoading ? (
          <Skeleton className="h-48 rounded-xl mb-4" />
        ) : booking ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl overflow-hidden mb-4"
          >
            {booking.cafe?.cover_image && (
              <div className="relative h-32">
                <Image src={booking.cafe.cover_image} alt={booking.cafe.name ?? ''} fill className="object-cover" sizes="384px" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] to-transparent" />
              </div>
            )}
            <div className="p-4">
              <h2 className="font-semibold text-white mb-3">{booking.cafe?.name}</h2>
              <div className="space-y-2 text-sm text-white/60">
                {booking.cafe?.address && (
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-[#800020]" />{booking.cafe.address}</div>
                )}
                <div className="flex items-center gap-2"><Clock size={14} className="text-[#800020]" />{formatDate(booking.date)} · {booking.time_slot}</div>
                <div className="flex items-center gap-2"><Users size={14} className="text-[#800020]" />{booking.guest_count} Guest{booking.guest_count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Krown Pass card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#800020]/10 border border-[#800020]/20 rounded-xl p-4 flex items-center gap-3 mb-6"
        >
          <Crown size={18} className="text-[#D4AF37] flex-shrink-0" />
          <p className="text-white/60 text-xs">
            <span className="text-[#D4AF37] font-semibold">Krown Pass: </span>
            Show your pass at the café to enjoy exclusive benefits
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <Link
            href="/bookings"
            className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] text-white py-3 rounded-xl font-semibold text-sm transition-all"
          >
            View My Bookings <ArrowRight size={16} />
          </Link>
          <Link href="/" className="w-full flex items-center justify-center text-white/40 text-sm hover:text-white/60 transition-colors py-2">
            Back to Home
          </Link>
        </motion.div>
      </div>
    </motion.div>
    </>
  );
}
