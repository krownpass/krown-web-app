import api from "./api";
import type { User, SignupData } from "@/types/user";
import fpPromise from "@fingerprintjs/fingerprintjs";
import { UAParser } from "ua-parser-js";

let fpInstance: any = null;

async function getDeviceMetadata() {
  try {
    if (!fpInstance) {
      fpInstance = await fpPromise.load();
    }
    const result = await fpInstance.get();
    const parser = new UAParser();
    const resultUa = parser.getResult();
    
    // Fallbacks if UAParser isn't available
    const browserName = resultUa.browser.name || 'Web Browser';
    const osName = resultUa.os.name || 'Unknown OS';
    
    return {
      device_id: result.visitorId, // Hardware fingerprint
      device_name: `${browserName} on ${osName}`,
      platform: "web"
    };
  } catch (error) {
    console.error("Failed to generate fingerprint:", error);
    // Graceful fallback purely on localStorage
    let localDeviceId = localStorage.getItem("krown_web_device_id");
    if (!localDeviceId) {
      localDeviceId = `web_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem("krown_web_device_id", localDeviceId);
    }
    return {
      device_id: localDeviceId,
      device_name: "Krown Web App",
      platform: "web"
    };
  }
}

export function mapUser(raw: any): User {
  return {
    user_id: raw.user_id,
    name: raw.user_name ?? raw.name ?? "",
    email: raw.user_email ?? raw.email,
    phone: raw.user_mobile_no ?? raw.phone ?? "",
    profile_image: raw.avatar_url ?? raw.profile_image ?? raw.user_profile_image,
    referral_code: raw.referral_code,
    krown_points: raw.krown_points,
    has_krown_pass: raw.is_krown_subscriber ?? raw.has_krown_pass,
    krown_pass_expiry: raw.subscription_expires_at ?? raw.krown_pass_expiry,
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
  };
}

export const authService = {
  // POST /api/auth/otp/send — phone must be E.164 e.g. "+919876543210"
  async sendOtp(phone: string): Promise<{ session_id: string }> {
    const formatted = phone.startsWith("+91") ? phone : `+91${phone}`;
    const res = await api.post("/auth/otp/send", { phone: formatted });
    return res.data.data ?? res.data;
  },

  // POST /api/auth/otp/verify
  async verifyOtp(
    phone: string,
    otp: string,
    session_id?: string
  ): Promise<{ token: string; refresh_token: string; user: User }> {
    const formatted = phone.startsWith("+91") ? phone : `+91${phone}`;
    const deviceMeta = await getDeviceMetadata();
    
    const res = await api.post("/auth/otp/verify", {
      phone: formatted,
      otp,
      ...(session_id ? { session_id } : {})
      // ...deviceMeta
    });
    const d = res.data.data ?? res.data;
    return { token: d.token, refresh_token: d.refresh_token, user: mapUser(d.user ?? d) };
  },

  // POST /api/auth/signup
  async signup(data: SignupData): Promise<{ token: string; refresh_token: string; user: User }> {
    const res = await api.post("/auth/signup", data);
    const d = res.data.data ?? res.data;
    return { token: d.token, refresh_token: d.refresh_token, user: mapUser(d.user ?? d) };
  },

  // GET /api/users/me
  async getMe(): Promise<User> {
    const res = await api.get("/users/me");
    const raw = res.data.data ?? res.data.user ?? res.data;
    return mapUser(raw);
  },

  // POST /api/auth/logout
  async logout(): Promise<void> {
    const refreshToken = typeof window !== "undefined"
      ? localStorage.getItem("krown_refresh_token")
      : null;
    await api.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {});
    if (typeof window !== "undefined") {
      localStorage.removeItem("krown_token");
      localStorage.removeItem("krown_refresh_token");
      localStorage.removeItem("krown_user");
    }
  },

  async deleteAccount(): Promise<void> {
    await api.delete("/auth/account");
    if (typeof window !== "undefined") {
      localStorage.removeItem("krown_token");
      localStorage.removeItem("krown_refresh_token");
      localStorage.removeItem("krown_user");
    }
  },
};
