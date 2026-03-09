'use client';

import { useQuery } from '@tanstack/react-query';
import { homeService } from '@/services/home.service';
import { STALE_TIME, GC_TIME } from '@/lib/constants';

export function useHomeData() {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => homeService.getHomeData(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
  });
}
