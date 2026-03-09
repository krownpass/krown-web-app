export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'booking' | 'event' | 'promo' | 'system' | 'reward';
  title: string;
  body: string;
  data?: Record<string, string>;
  is_read: boolean;
  created_at: string;
}
