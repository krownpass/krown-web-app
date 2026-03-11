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
  id: string;
  source: 'subscription' | 'dineout' | string;
  amount: string | number;
  title: string;
  status: string;
  txn_date: string;
  razorpay_payment_id?: string | null;
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
  profile_image?: File | null;
}
