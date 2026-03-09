export interface RewardsInfo {
  user_id: string;
  krown_points: number;
  lifetime_points?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  next_tier_points?: number;
}

export interface RedemptionOption {
  option_id: string;
  title: string;
  description?: string;
  points_required: number;
  value?: number;
  image_url?: string;
  partner_name?: string;
  type: 'voucher' | 'discount' | 'free_item';
  is_available: boolean;
}

export interface RedemptionRecord {
  redemption_id: string;
  user_id: string;
  option_id?: string;
  points_used: number;
  status: 'pending' | 'completed' | 'cancelled';
  voucher_code?: string;
  redeemed_at: string;
  option?: RedemptionOption;
}
