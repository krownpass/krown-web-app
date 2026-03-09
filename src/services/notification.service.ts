import api from "./api";
import type { Notification } from "@/types/notification";

export const notificationService = {
  // GET /api/push/notifications
  async getNotifications(): Promise<Notification[]> {
    const res = await api.get("/push/notifications");
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.notifications ?? [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch("/notifications/read-all");
  },

  async getUnreadCount(): Promise<number> {
    // No dedicated unread-count endpoint; derive from notification list
    try {
      const res = await api.get("/push/notifications");
      const data = res.data.data ?? res.data;
      const list: any[] = Array.isArray(data) ? data : data.notifications ?? [];
      return list.filter((n) => !n.is_read).length;
    } catch {
      return 0;
    }
  },
};
