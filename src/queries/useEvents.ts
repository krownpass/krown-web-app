'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { eventService } from '@/services/event.service';
import { queryKeys } from '@/queries/queryKeys';
import type { Event, EventFilters } from '@/types/event';
import { STALE_TIME, GC_TIME } from '@/lib/constants';

const retryConfig = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
};

export function useEvents(filters?: EventFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: ({ pageParam }) =>
      eventService.getEvents({ ...filters, page: pageParam as number, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((acc, p) => acc + p.events.length, 0);
      if (fetched >= lastPage.total) return undefined;
      return allPages.length + 1;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useUpcomingEvents() {
  return useQuery<Event[]>({
    queryKey: queryKeys.events.upcoming(),
    queryFn: () => eventService.getUpcomingEvents(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useFeaturedEvents() {
  return useQuery<Event[]>({
    queryKey: queryKeys.events.featured(),
    queryFn: () => eventService.getFeaturedEvents(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}
