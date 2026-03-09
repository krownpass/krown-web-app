export interface Cafe {
  cafe_id: string;
  slug?: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  rating?: number;
  total_reviews?: number;
  price_range?: 1 | 2 | 3 | 4;
  cuisine_types?: string[];
  vibes?: string[];
  opening_hours?: OpeningHours;
  is_open?: boolean;
  distance?: number;
  is_bookmarked?: boolean;
  has_krown_pass_benefit?: boolean;
  discount_percent?: number;
  special_offers?: SpecialOffer[];
  krown_recommended?: MenuItem[];
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  is_closed: boolean;
}

export interface MenuItem {
  item_id: string;
  cafe_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_recommended?: boolean;
  is_available: boolean;
  dietary_tags?: string[];
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface SpecialOffer {
  offer_id: string;
  cafe_id: string;
  title: string;
  description?: string;
  discount_percent?: number;
  discount_amount?: number;
  status: 'active' | 'expired' | 'upcoming';
  starts_at: string;
  ends_at: string;
  terms?: string;
  image_url?: string;
}

export interface CafeTheme {
  theme_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  cafe_count?: number;
}

export interface CafeFilters {
  search?: string;
  vibe?: string;
  rating?: number;
  price_range?: number;
  open_now?: boolean;
  area?: string;
  sort_by?: 'rating' | 'distance' | 'newest';
  page?: number;
  limit?: number;
}
