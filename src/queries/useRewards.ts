'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsService } from '@/services/rewards.service';
import { queryKeys } from '@/queries/queryKeys';
import type { RewardsInfo, RedemptionOption, RedemptionRecord } from '@/types/rewards';
import { STALE_TIME, GC_TIME } from '@/lib/constants';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const retryConfig = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
};

export function useRewardsInfo() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<RewardsInfo>({
    queryKey: queryKeys.user.rewards,
    queryFn: () => rewardsService.getRewardsInfo(),
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useRedemptionOptions() {
  return useQuery<RedemptionOption[]>({
    queryKey: queryKeys.user.redemptionOptions,
    queryFn: () => rewardsService.getRedemptionOptions(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useRedemptionHistory() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<RedemptionRecord[]>({
    queryKey: queryKeys.user.redemptionHistory,
    queryFn: () => rewardsService.getRedemptionHistory(),
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useRedeemPoints() {
  const queryClient = useQueryClient();
  return useMutation<{ voucher_code?: string; message: string }, Error, string>({
    mutationFn: (optionId: string) => rewardsService.redeemPoints(optionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.rewards });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.redemptionHistory });
      toast.success(data.message ?? 'Points redeemed successfully!');
    },
    onError: () => {
      toast.error('Failed to redeem points. Please try again.');
    },
  });
}
