import api from "./api";
import type { RewardsInfo, RedemptionOption, RedemptionRecord } from "@/types/rewards";

export const rewardsService = {
  // Fetch both user profile for basis/tier and loyalty-history for actual points logic
  async getRewardsInfo(userId?: string): Promise<RewardsInfo> {
    const res = await api.get("/users/me");
    let rewardsData = res.data.data ?? res.data;

    // Correcting logic by getting dynamic loyalty points from server
    if (userId) {
      try {
        const balanceRes = await api.get(`/users/${userId}/loyalty-balance`);
        const balanceData = balanceRes.data.data?.balance ?? balanceRes.data.balance;
        if (balanceData !== undefined && balanceData !== null) {
          rewardsData = { ...rewardsData, krown_points: Number(balanceData) };
        } else {
          rewardsData = { ...rewardsData, krown_points: 0 };
        }
      } catch (err) {
        console.error("Failed to fetch loyalty balance:", err);
      }
    }

    return rewardsData;
  },

  // GET /api/redeems/user/plans
  async getRedemptionOptions(): Promise<RedemptionOption[]> {
    const res = await api.get("/redeems/user/plans");
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.plans ?? data.options ?? [];
  },

  // POST /api/redeems  body: { plan_id }
  async redeemPoints(optionId: string): Promise<{ voucher_code?: string; message: string }> {
    const res = await api.post("/redeems", { plan_id: optionId });
    return res.data.data ?? res.data;
  },

  // POST /api/redeems
  async redeemDrink(data: { cafeId: string; itemId: string; userSubscriptionId: string }): Promise<any> {
    const res = await api.post("/redeems", data);
    return res.data.data ?? res.data;
  },

  // GET /api/redeems/user — returns items with is_redeemed flag
  async getRedemptionHistory(): Promise<RedemptionRecord[]> {
    const res = await api.get("/redeems/user");
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.items ?? [];
  },
};
