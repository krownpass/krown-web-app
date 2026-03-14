export interface Event {
  event_id: string;
  slug?: string;
  title: string;
  description?: string;
  cover_image?: string;
  event_type: string;
  category?: string;
  tags?: string[];
  status: 'active' | 'cancelled' | 'completed' | 'draft';
  start_time: string;
  end_time?: string;
  gates_open_time?: string;
  venue_name: string;
  venue_address?: string;
  venue_city?: string;
  venue_latitude?: number;
  venue_longitude?: number;
  reveal_time?: string | null;
  reveal_fields?: string[];
  is_paid: boolean;
  base_price?: number;
  max_capacity?: number;
  current_registrations?: number;
  seats_left?: number;
  is_registration_open?: boolean;
  is_waitlist_open?: boolean;
  waitlist_count?: number;
  is_bookmarked?: boolean;
  cafe_id?: string;
  cafe_name?: string;
  organizer_name?: string;
  organizer_image?: string;
  schedule?: ScheduleItem[];
  faq?: FaqItem[];
  gallery_images?: string[];
  instructions?: string[];
  ticket_tiers?: TicketTier[];
  is_revealed?: boolean;
  confirmed_registrations?: number;
  requires_krown_subscription?: boolean;
  favorite_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TicketTier {
  tier_id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold_count: number;
}

export interface ScheduleItem {
  time: string;
  activity: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Ticket {
  ticket_id: string;
  event_id: string;
  user_id: string;
  ticket_number: string;
  qr_code: string;
  /** DB registration_status enum values */
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'REJECTED' | 'CANCELLED';
  seat_number?: string;
  ticket_type?: string;
  amount_paid?: number;
  registered_at: string;
  event?: Event & { end_time?: string; event_status?: string };
}

export interface EventRegistration {
  registration_id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'waitlisted' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'refunded';
  payment_id?: string;
  ticket?: Ticket;
  waitlist_position?: number;
  created_at: string;
}

export interface EventSeat {
  seat_id: string;
  seat_number: string;
  row?: string;
  section?: string;
  status: 'available' | 'locked' | 'booked';
  locked_by?: string;
  price?: number;
}

export interface EventFilters {
  search?: string;
  category?: string;
  event_type?: string;
  is_paid?: boolean;
  date_from?: string;
  date_to?: string;
  city?: string;
  sort_by?: 'date' | 'popularity' | 'price';
  page?: number;
  limit?: number;
}
