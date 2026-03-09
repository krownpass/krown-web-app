'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, BookOpen, Calendar, Tag, Info } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/queries/useNotifications';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types/notification';

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const map: Record<Notification['type'], React.ReactNode> = {
    booking: <BookOpen size={16} className="text-[#800020]" />,
    event: <Calendar size={16} className="text-blue-400" />,
    promo: <Tag size={16} className="text-[#D4AF37]" />,
    system: <Info size={16} className="text-white/50" />,
    reward: <Bell size={16} className="text-green-400" />,
  };
  return <>{map[type]}</>;
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && <p className="text-white/40 text-sm">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="flex items-center gap-1.5 text-xs text-[#800020] hover:text-[#C11E38] transition-colors"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon="Bell" title="No notifications" subtitle="You're all caught up!" />
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.notification_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { if (!notif.is_read) markAsRead.mutate(notif.notification_id); }}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  notif.is_read
                    ? 'bg-[#1E1E1E] border-[#2A2A2A] hover:border-[#3A3A3A]'
                    : 'bg-[#1E1E1E] border-[#800020]/20 hover:border-[#800020]/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.is_read ? 'bg-[#2A2A2A]' : 'bg-[#800020]/10'}`}>
                  <NotificationIcon type={notif.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${notif.is_read ? 'text-white/70' : 'text-white'}`}>{notif.title}</p>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-[#800020] flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{notif.body}</p>
                  <p className="text-white/25 text-xs mt-1">{formatRelativeTime(notif.created_at)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
