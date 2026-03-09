import api from "./api";
import type { RazorpayOrder, RazorpayPaymentResponse } from "@/types/payment";

export const paymentService = {
  // POST /api/events/:event_id/payment/initiate
  // Body: { idempotency_key, amount }
  // Note: amount must be a number (pg returns numeric columns as strings — coerce explicitly)
  async initiateEventPayment(eventId: string, amount: number | string): Promise<RazorpayOrder> {
    const idempotency_key = crypto.randomUUID();
    const res = await api.post(`/events/${eventId}/payment/initiate`, {
      idempotency_key,
      amount: Number(amount),
    });
    return res.data.data ?? res.data;
  },

  // POST /api/events/:event_id/payment/verify
  // Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  async verifyEventPayment(eventId: string, data: RazorpayPaymentResponse): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`/events/${eventId}/payment/verify`, data);
    return res.data;
  },

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },
};
