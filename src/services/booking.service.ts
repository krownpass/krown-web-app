import api from "./api";
import type { Booking, CreateBookingData, TimeSlot } from "@/types/booking";

// Normalizes any time string to HH:MM (24-hour, zero-padded)
// Handles ISO time with tz: "10:00:00+05:30" → "10:00"
// Handles time with seconds: "10:00:00" → "10:00"
// Handles 12-hour: "9:00 AM" → "09:00", "2:30 PM" → "14:30"
// Handles bare: "9:00" → "09:00"
export function toHHMM(time: string): string {
  const t = time.trim();
  // ISO time with timezone offset: "10:00:00+05:30" or "10:00:00-05:30"
  const isoTz = t.match(/^(\d{2}):(\d{2}):\d{2}[+-]\d{2}:\d{2}$/);
  if (isoTz) return `${isoTz[1]}:${isoTz[2]}`;
  // Time with seconds: "10:00:00"
  const withSec = t.match(/^(\d{2}):(\d{2}):\d{2}$/);
  if (withSec) return `${withSec[1]}:${withSec[2]}`;
  // 12-hour or plain HH:MM
  const plain = t.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!plain) return t;
  let hours = parseInt(plain[1], 10);
  const minutes = plain[2];
  const period = plain[3]?.toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

function mapBooking(raw: any): Booking {
  return {
    booking_id: String(raw.booking_id ?? raw.id ?? ""),
    user_id: raw.user_id ?? "",
    cafe_id: raw.cafe_id,
    event_id: raw.event_id,
    booking_type: raw.booking_type ?? "standard",
    status: raw.booking_status ?? raw.status ?? "pending",
    date: raw.booking_date ?? raw.date ?? "",
    time_slot: raw.booking_start_time ?? raw.time_slot ?? "",
    guest_count: raw.num_of_guests ?? raw.guest_count ?? 1,
    special_requests: raw.special_request ?? raw.special_requests,
    payment_id: raw.payment_id,
    payment_amount: raw.payment_amount,
    payment_status: raw.payment_status,
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
    cafe: raw.cafe || (raw.cafe_name ? {
      cafe_id: raw.cafe_id,
      name: raw.cafe_name,
      address: raw.cafe_location,
      cover_image: raw.cover_img
    } : undefined),
    event: raw.event,
  };
}

export const bookingService = {
  // POST /api/bookings/create
  async createBooking(data: CreateBookingData): Promise<Booking> {
    const res = await api.post("/bookings/create", {
      cafe_id: data.cafe_id,
      booking_date: data.date,
      booking_start_time: toHHMM(data.time_slot),
      num_of_guests: data.guest_count,
      special_request: data.special_requests ?? null,
    });
    const raw = res.data.data ?? res.data;
    return mapBooking(raw);
  },

  // POST /api/bookings/create-with-payment (priority bookings)
  async createBookingWithPayment(data: CreateBookingData, amount: number): Promise<{
    transaction_id: string;
    sdkPayload: { keyId: string; orderId: string; amount: number; currency: string; transactionId: string };
    data: Booking;
  }> {
    const res = await api.post("/bookings/create-with-payment", {
      cafe_id: data.cafe_id,
      booking_date: data.date,
      booking_start_time: toHHMM(data.time_slot),
      num_of_guests: data.guest_count,
      special_request: data.special_requests ?? null,
      transaction_amount: amount,
    });
    return res.data.data ?? res.data;
  },

  // POST /api/bookings/payment/verify
  async verifyBookingPayment(params: {
    transaction_id: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Promise<void> {
    await api.post("/bookings/payment/verify", params);
  },

  // GET /api/bookings/user
  async getMyBookings(type?: "cafe" | "event"): Promise<Booking[]> {
    const res = await api.get("/bookings/user", { params: type ? { type } : undefined });
    const data = res.data.data ?? res.data;
    const raw: any[] = Array.isArray(data) ? data : data.bookings ?? [];
    return raw.map(mapBooking);
  },

  // No per-ID endpoint — fetch all and find by booking_id
  async getBookingById(id: string): Promise<Booking> {
    const res = await api.get("/bookings/user");
    const data = res.data.data ?? res.data;
    const raw: any[] = Array.isArray(data) ? data : data.bookings ?? [];
    const found = raw.find((b) => String(b.booking_id) === String(id));
    return mapBooking(found ?? raw[0] ?? {});
  },

  // PATCH /api/bookings/user/cancel/:bookingId
  async cancelBooking(id: string): Promise<void> {
    await api.patch(`/bookings/user/cancel/${id}`);
  },

  // GET /api/bookings/cafe-slots/:cafeId?date=YYYY-MM-DD
  // Returns normalized categories: [{ name, hours: ["HH:MM", ...] }]
  async getSlotCategories(cafeId: string, date: string): Promise<{ name: string; hours: string[] }[]> {
    const res = await api.get(`/bookings/cafe-slots/${cafeId}`, { params: { date } });
    const data = res.data.data ?? res.data;
    const raw: { name: string; hours: string[] }[] = data?.categories ?? [];
    return raw.map((cat) => ({
      name: cat.name,
      // normalize to HH:MM and deduplicate
      hours: [...new Set((cat.hours ?? []).map(toHHMM))],
    }));
  },

  async getAvailableSlots(cafeId: string, date: string): Promise<TimeSlot[]> {
    const res = await api.get(`/bookings/cafe-slots/${cafeId}`, { params: { date } });
    const data = res.data.data ?? res.data;
    const cats: { name: string; hours: string[] }[] = data?.categories ?? [];
    return cats.flatMap((cat) =>
      cat.hours.map((time) => ({
        slot_id: `${cafeId}-${date}-${time}`,
        time,
        is_available: true,
      }))
    );
  },
};
