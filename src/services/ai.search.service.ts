import api from './api';

export interface AiCafe {
  cafe_id: string;
  cafe_name: string;
  cafe_location: string;
  city: string | null;
  area: string | null;
  cafe_description: string | null;
  ratings: number | null;
  cover_img: string | null;
  editors_pick: boolean | null;
  editors_tag: string | null;
  keywords: string[] | null;
  distance_km: number | null;
  distance_label: string | null;
}

export interface AiEvent {
  event_id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  venue_name: string | null;
  venue_city: string | null;
  is_paid: boolean;
  base_price: number;
  spots_left: number | null;
  distance_label: string | null;
}

export interface AiSearchResponse {
  cafes: AiCafe[];
  events: AiEvent[];
  intent: 'cafe' | 'event' | 'all';
  query_used: string;
  refined_query: string;
  has_results: boolean;
  is_fallback: boolean;
  fallback_message: string | null;
}

export async function aiSearch(
  query: string,
  userLat?: number,
  userLon?: number,
  type?: 'cafes' | 'events' | 'all'
): Promise<AiSearchResponse> {
  const { data } = await api.post<{ success: boolean; data: AiSearchResponse }>('/ai/search', {
    query,
    user_lat: userLat,
    user_lon: userLon,
    type,
  });
  return data.data;
}
