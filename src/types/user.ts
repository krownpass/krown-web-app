export interface User {
  user_id: string;
  name: string;
  email?: string;
  phone: string;
  profile_image?: string;
  referral_code?: string;
  krown_points?: number;
  has_krown_pass?: boolean;
  krown_pass_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  device_id: string;
  device_name: string;
  device_type: string;
  last_active: string;
  is_current: boolean;
  ip_address?: string;
}

export interface Transaction {
  transaction_id: string;
  type: 'dining' | 'krown' | 'reward' | 'refund';
  amount: number;
  description: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  created_at: string;
  cafe_name?: string;
  event_name?: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  referral_code?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  profile_image?: string;
}
