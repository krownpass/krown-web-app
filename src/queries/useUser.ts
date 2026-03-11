'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/queries/queryKeys';
import type { User, UserDevice, Transaction, UpdateProfileData } from '@/types/user';
import type { Cafe } from '@/types/cafe';
import { STALE_TIME, GC_TIME } from '@/lib/constants';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const retryConfig = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
};

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<User>({
    queryKey: queryKeys.user.profile,
    queryFn: () => userService.getProfile(),
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useBookmarks() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<Cafe[]>({
    queryKey: queryKeys.user.bookmarks,
    queryFn: () => userService.getFavourites(),
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useDevices() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<UserDevice[]>({
    queryKey: queryKeys.user.devices,
    queryFn: () => userService.getDevices(),
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useTransactions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<Transaction[]>({
    queryKey: queryKeys.user.transactions,
    queryFn: () => userService.getTransactions(),
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useReferral() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<{ code: string; total_referrals: number; points_earned: number }>({
    queryKey: queryKeys.user.referral,
    queryFn: () => userService.getReferralInfo(),
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const token = useAuthStore((s) => s.token);
  return useMutation<User, Error, UpdateProfileData>({
    mutationFn: (data: UpdateProfileData) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.user.profile, updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      if (token) setUser(updatedUser, token);
      toast.success('Profile updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update profile. Please try again.');
    },
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (cafeId: string) => userService.addFavourite(cafeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.bookmarks });
      toast.success('Cafe saved to bookmarks!');
    },
    onError: () => {
      toast.error('Failed to bookmark cafe.');
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (cafeId: string) => userService.removeFavourite(cafeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.bookmarks });
      toast.success('Removed from bookmarks.');
    },
    onError: () => {
      toast.error('Failed to remove bookmark.');
    },
  });
}

export function useEventBookmarks() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<any[]>({
    queryKey: queryKeys.user.eventBookmarks,
    queryFn: () => userService.getEventFavourites(),
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useAddEventBookmark() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (eventId: string) => userService.addEventFavourite(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.eventBookmarks });
      toast.success('Event saved to bookmarks!');
    },
    onError: () => {
      toast.error('Failed to bookmark event.');
    },
  });
}

export function useRemoveEventBookmark() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (eventId: string) => userService.removeEventFavourite(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.eventBookmarks });
      toast.success('Removed from bookmarks.');
    },
    onError: () => {
      toast.error('Failed to remove bookmark.');
    },
  });
}

export function useRemoveDevice() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (deviceId: string) => userService.removeDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.devices });
      toast.success('Session removed.');
    },
    onError: () => {
      toast.error('Failed to remove session.');
    },
  });
}
