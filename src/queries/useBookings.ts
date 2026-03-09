'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/queries/queryKeys';
import type { Booking, CreateBookingData, TimeSlot } from '@/types/booking';
import { STALE_TIME, GC_TIME } from '@/lib/constants';
import { toast } from 'sonner';

const retryConfig = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
};

export function useMyBookings(type?: 'cafe' | 'event') {
  return useQuery<Booking[]>({
    queryKey: queryKeys.bookings.list(type),
    queryFn: () => bookingService.getMyBookings(type),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useBookingDetail(id: string) {
  return useQuery<Booking>({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, CreateBookingData>({
    mutationFn: (data: CreateBookingData) => bookingService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      toast.success('Booking confirmed!');
    },
    onError: () => {
      toast.error('Failed to create booking. Please try again.');
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => bookingService.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      toast.success('Booking cancelled successfully.');
    },
    onError: () => {
      toast.error('Failed to cancel booking. Please try again.');
    },
  });
}

export function useAvailableSlots(cafeId: string, date: string) {
  return useQuery<TimeSlot[]>({
    queryKey: queryKeys.bookings.slots(cafeId, date),
    queryFn: () => bookingService.getAvailableSlots(cafeId, date),
    enabled: !!cafeId && !!date,
    staleTime: 60 * 1000, // 1 min for slots (more dynamic)
    gcTime: GC_TIME,
    ...retryConfig,
  });
}
