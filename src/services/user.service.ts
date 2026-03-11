import api from "./api";
import type { User, UserDevice, Transaction, UpdateProfileData } from "@/types/user";
import type { Cafe } from "@/types/cafe";
import { mapUser } from "./auth.service";
import { mapCafe } from "./cafe.service";

export const userService = {
  // GET /api/users/me  or  GET /api/users
  async getProfile(): Promise<User> {
    const res = await api.get("/users/me");
    return mapUser(res.data.data ?? res.data);
  },

  // PATCH /api/users/update-profile
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const formData = new FormData();
    if (data.name) formData.append("user_name", data.name);
    if (data.email) formData.append("user_email", data.email);
    if (data.profile_image instanceof File) {
      formData.append("file", data.profile_image);
    }
    
    const res = await api.patch("/users/update-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      }
    });

    const user = mapUser(res.data.data ?? res.data);
    if (user.profile_image && data.profile_image instanceof File) {
      // Append timestamp to bust browser cache for the newly uploaded image
      const separator = user.profile_image.includes("?") ? "&" : "?";
      user.profile_image = `${user.profile_image}${separator}t=${Date.now()}`;
    }
    return user;
  },

  // GET /api/users/favourites
  async getFavourites(): Promise<Cafe[]> {
    const res = await api.get("/users/favourites");
    const data = res.data.data ?? res.data;
    const rawArray = Array.isArray(data) ? data : data.cafes ?? [];
    return rawArray.map(mapCafe);
  },

  // POST /api/users/favourites  body: { cafeId }
  async addFavourite(cafeId: string): Promise<void> {
    await api.post("/users/favourites", { cafeId });
  },

  // DELETE /api/users/favourites  body: { cafeId }
  async removeFavourite(cafeId: string): Promise<void> {
    await api.delete("/users/favourites", { data: { cafeId } });
  },

  // GET /api/events/favourites
  async getEventFavourites(): Promise<any[]> {
    const res = await api.get("/events/favourites");
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.events ?? [];
  },

  // POST /api/events/favourites  body: { event_id }
  async addEventFavourite(eventId: string): Promise<void> {
    await api.post("/events/favourites", { event_id: eventId });
  },

  // DELETE /api/events/favourites  body: { event_id }
  async removeEventFavourite(eventId: string): Promise<void> {
    await api.delete("/events/favourites", { data: { event_id: eventId } });
  },

  // GET /api/auth/devices
  async getDevices(): Promise<UserDevice[]> {
    const res = await api.get("/auth/devices");
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.devices ?? [];
  },

  // POST /api/auth/device/logout  body: { device_id }
  async removeDevice(deviceId: string): Promise<void> {
    await api.post("/auth/device/logout", { device_id: deviceId });
  },

  // GET /api/users/unified/transactions
  async getTransactions(): Promise<Transaction[]> {
    const res = await api.get("/users/unified/transactions", { params: { limit: 50, offset: 0 } });
    const data = res.data.data ?? res.data;
    return data.items ?? (Array.isArray(data) ? data : []);
  },

  // GET /api/users/referrals — returns { referred_by, referred_users }
  // GET /api/users for referral_code
  async getReferralInfo(): Promise<{ code: string; total_referrals: number; points_earned: number }> {
    const [userRes, refRes] = await Promise.all([
      api.get("/users"),
      api.get("/users/referrals"),
    ]);
    const user = userRes.data.data ?? userRes.data;
    const ref = refRes.data.data ?? refRes.data;
    return {
      code: user.referral_code ?? "",
      total_referrals: (ref.referred_users ?? []).length,
      points_earned: 0,
    };
  },

  async uploadProfileImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await api.post("/users/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data ?? res.data;
  },
};
