'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/event.service';
import { queryKeys } from '@/queries/queryKeys';
import type { Event, Ticket, EventRegistration } from '@/types/event';
import { STALE_TIME, GC_TIME } from '@/lib/constants';
import { toast } from 'sonner';

const retryConfig = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
};

export function useEventDetail(slug: string) {
  return useQuery<Event>({
    queryKey: queryKeys.events.detail(slug),
    queryFn: () => eventService.getEventBySlug(slug),
    enabled: !!slug,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useUserRegistration(eventId: string | undefined) {
  return useQuery<any>({
    queryKey: ['event-registration', eventId],
    queryFn: () => eventId ? eventService.getUserRegistration(eventId) : null,
    enabled: !!eventId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1, // Only retry once since a 404 is a valid state if not registered
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  return useMutation<EventRegistration, Error, { eventId: string; ticketCount?: number; tierId?: string }>({
    mutationFn: ({ eventId, ticketCount, tierId }) => 
      eventService.registerForEvent(eventId, ticketCount, tierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.tickets() });
      toast.success('Successfully registered for event!');
    },
    onError: () => {
      toast.error('Failed to register for event. Please try again.');
    },
  });
}

export function useJoinWaitlist() {
  const queryClient = useQueryClient();
  return useMutation<{ position: number; message: string }, Error, string>({
    mutationFn: (eventId: string) => eventService.joinWaitlist(eventId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      toast.success(data.message ?? `You're on the waitlist!`);
    },
    onError: () => {
      toast.error('Failed to join waitlist. Please try again.');
    },
  });
}

export function useMyTickets() {
  return useQuery<Ticket[]>({
    queryKey: queryKeys.events.tickets(),
    queryFn: () => eventService.getMyTickets(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useTicketDetail(id: string) {
  return useQuery<Ticket>({
    queryKey: queryKeys.events.ticket(id),
    queryFn: () => eventService.getTicketById(id),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}
