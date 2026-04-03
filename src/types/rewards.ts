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
  item_name: string;
  cafe_name: string;
  image_url: string;
  redeem_code: string;
  redeem_code_exp_time: string | null;
  is_redeemed: boolean;
  updated_at: string;
  points_used?: number;
  voucher_code?: string;
}
