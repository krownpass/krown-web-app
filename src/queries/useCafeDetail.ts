'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cafeService } from '@/services/cafe.service';
import { queryKeys } from '@/queries/queryKeys';
import type { Cafe, MenuCategory } from '@/types/cafe';
import type { Review, CreateReviewData } from '@/types/review';
import { STALE_TIME, GC_TIME } from '@/lib/constants';
import { toast } from 'sonner';

const retryConfig = {
  retry: 1,
  retryDelay: () => 2000,
};

export function useCafeDetail(slug: string) {
  return useQuery<Cafe>({
    queryKey: queryKeys.cafes.detail(slug),
    queryFn: () => cafeService.getCafeBySlug(slug),
    enabled: !!slug,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useCafeMenu(cafeId: string) {
  return useQuery<MenuCategory[]>({
    queryKey: queryKeys.cafes.menu(cafeId),
    queryFn: () => cafeService.getCafeMenu(cafeId),
    enabled: !!cafeId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useCafeReviews(cafeId: string) {
  return useQuery<Review[]>({
    queryKey: queryKeys.cafes.reviews(cafeId),
    queryFn: () => cafeService.getCafeReviews(cafeId),
    enabled: !!cafeId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReviewData) => cafeService.createReview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cafes.reviews(variables.cafe_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cafes.details() });
      toast.success('Review submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit review. Please try again.');
    },
  });
}

export function useCafeImages(cafeId: string) {
  return useQuery({
    queryKey: queryKeys.cafes.images(cafeId),
    queryFn: () => cafeService.getCafeImages(cafeId),
    enabled: !!cafeId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}
