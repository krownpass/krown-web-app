export interface Review {
  review_id: string;
  cafe_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  images?: string[];
  is_verified_visit?: boolean;
  helpful_count?: number;
  created_at: string;
  user?: {
    user_id: string;
    name: string;
    profile_image?: string;
  };
}

export interface CreateReviewData {
  cafe_id: string;
  rating: number;
  comment?: string;
  images?: string[];
}
