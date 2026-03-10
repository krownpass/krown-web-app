import api from "./api";
import type { RewardsInfo, RedemptionOption, RedemptionRecord } from "@/types/rewards";

export const rewardsService = {
  // GET /api/users/me — points/tier info lives on the user object
  async getRewardsInfo(): Promise<RewardsInfo> {
    const res = await api.get("/users/me");
    return res.data.data ?? res.data;
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
