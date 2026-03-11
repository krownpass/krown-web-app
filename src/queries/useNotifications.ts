'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { queryKeys } from '@/queries/queryKeys';
import type { Notification } from '@/types/notification';
import { STALE_TIME, GC_TIME } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

const retryConfig = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
};

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<Notification[]>({
    queryKey: queryKeys.user.notifications,
    queryFn: () => notificationService.getNotifications(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 min — more dynamic
    gcTime: GC_TIME,
    ...retryConfig,
  });
}

export function useUnreadCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<number>({
    queryKey: queryKeys.user.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 sec
    gcTime: GC_TIME,
    refetchInterval: 60 * 1000, // poll every 60s
    ...retryConfig,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { prevNotifs: Notification[] | undefined, prevCount: number | undefined }>({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.notifications });
      await queryClient.cancelQueries({ queryKey: queryKeys.user.unreadCount });
      
      const prevNotifs = queryClient.getQueryData<Notification[]>(queryKeys.user.notifications);
      const prevCount = queryClient.getQueryData<number>(queryKeys.user.unreadCount);

      queryClient.setQueryData<Notification[]>(queryKeys.user.notifications, (old) => {
        if (!old) return old;
        return old.map(n => n.id === id ? { ...n, is_read: true } : n);
      });
      queryClient.setQueryData<number>(queryKeys.user.unreadCount, (old) => {
        return old ? Math.max(0, old - 1) : 0;
      });

      return { prevNotifs, prevCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.unreadCount });
    },
    onError: (err, id, context) => {
      if (context?.prevNotifs) queryClient.setQueryData(queryKeys.user.notifications, context.prevNotifs);
      if (context?.prevCount !== undefined) queryClient.setQueryData(queryKeys.user.unreadCount, context.prevCount);
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void, { prevNotifs: Notification[] | undefined, prevCount: number | undefined }>({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.notifications });
      await queryClient.cancelQueries({ queryKey: queryKeys.user.unreadCount });
      
      const prevNotifs = queryClient.getQueryData<Notification[]>(queryKeys.user.notifications);
      const prevCount = queryClient.getQueryData<number>(queryKeys.user.unreadCount);

      queryClient.setQueryData<Notification[]>(queryKeys.user.notifications, (old) => {
        if (!old) return old;
        return old.map(n => ({ ...n, is_read: true }));
      });
      queryClient.setQueryData<number>(queryKeys.user.unreadCount, 0);

      return { prevNotifs, prevCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.notifications });
      queryClient.setQueryData(queryKeys.user.unreadCount, 0);
    },
    onError: (err, _, context) => {
      if (context?.prevNotifs) queryClient.setQueryData(queryKeys.user.notifications, context.prevNotifs);
      if (context?.prevCount !== undefined) queryClient.setQueryData(queryKeys.user.unreadCount, context.prevCount);
    },
  });
}
