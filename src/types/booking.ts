export interface Booking {
  booking_id: string;
  user_id: string;
  cafe_id?: string;
  event_id?: string;
  booking_type: 'standard' | 'priority';
  status: 'pending' | 'accepted' | 'cancelled' | 'rejected';
  date: string;
  time_slot: string;
  guest_count: number;
  special_requests?: string;
  payment_id?: string;
  payment_amount?: number;
  payment_status?: 'pending' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
  cafe?: {
    cafe_id: string;
    name: string;
    address: string;
    cover_image?: string;
    phone?: string;
    rating?: number;
  };
  event?: {
    event_id: string;
    title: string;
    cover_image?: string;
    venue_name: string;
    start_time: string;
  };
}

export interface CreateBookingData {
  cafe_id: string;
  booking_type: 'standard' | 'priority';
  date: string;
  time_slot: string;
  guest_count: number;
  special_requests?: string;
}

export interface TimeSlot {
  slot_id: string;
  time: string;
  is_available: boolean;
  max_capacity?: number;
  current_bookings?: number;
}
