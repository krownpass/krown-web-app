'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { cafeService } from '@/services/cafe.service';
import { queryKeys } from '@/queries/queryKeys';
import type { Cafe, CafeFilters } from '@/types/cafe';
import { STALE_TIME, GC_TIME } from '@/lib/constants';

const retryConfig = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
};

export function useCafes(filters?: CafeFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.cafes.list(filters),
    queryFn: ({ pageParam }) =>
      cafeService.getCafes({ ...filters, page: pageParam as number, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((acc, p) => acc + p.cafes.length, 0);
      if (fetched >= lastPage.total) return undefined;
      return allPages.length + 1;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useFeaturedCafes(options?: Partial<UseQueryOptions<Cafe[]>>) {
  return useQuery<Cafe[]>({
    queryKey: queryKeys.cafes.featured(),
    queryFn: () => cafeService.getFeaturedCafes(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
    ...options,
  });
}

export function useNearbyCafes(lat: number, lng: number) {
  return useQuery<Cafe[]>({
    queryKey: queryKeys.cafes.nearby(lat, lng),
    queryFn: () => cafeService.getNearbyCafes(lat, lng),
    enabled: lat !== 0 && lng !== 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useCafesByTheme(themeSlug: string) {
  return useQuery<Cafe[]>({
    queryKey: queryKeys.cafes.theme(themeSlug),
    queryFn: () => cafeService.getCafesByTheme(themeSlug),
    enabled: !!themeSlug,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

/** Fetches all cafes and shuffles them for the swipe deck (mirrors krown-app useSwipeCafes). */
export function useSwipeCafes() {
  const { data: allCafes = [], isLoading } = useQuery<Cafe[]>({
    queryKey: queryKeys.cafes.swipe(),
    queryFn: () => cafeService.getAllCafes(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });

  const [shuffled, setShuffled] = useState<Cafe[]>([]);

  useEffect(() => {
    if (allCafes.length > 0) {
      const copy = [...allCafes];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      setShuffled(copy);
    }
  }, [allCafes]);

  const refresh = useCallback(() => {
    if (allCafes.length > 0) {
      const copy = [...allCafes];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      setShuffled(copy);
    }
  }, [allCafes]);

  return { cafes: shuffled, isLoading, refresh };
}
