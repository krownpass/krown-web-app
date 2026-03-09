export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.krownpass.com";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "wss://api.krownpass.com/ws";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://krownpass.com";
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
export const PRIORITY_BOOKING_FEE = 50; // ₹50 priority booking fee

export const KROWN_VIBES = [
  { id: "fun-wild", label: "Fun & Wild", emoji: "🔥", color: "#FF6B35" },
  { id: "cozy-comfy", label: "Cozy & Comfy", emoji: "☕", color: "#6B4226" },
  { id: "date-night", label: "Date Night", emoji: "💕", color: "#800020" },
  { id: "work-study", label: "Work & Study", emoji: "💻", color: "#2563EB" },
  { id: "brunch-gang", label: "Brunch Gang", emoji: "🥞", color: "#D97706" },
  { id: "late-night", label: "Late Night", emoji: "🌙", color: "#7C3AED" },
];

export const BOOKING_TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM",
];

export const EVENT_CATEGORIES = [
  "Comedy", "Music", "Food & Drinks", "Art", "Networking",
  "Fitness", "Gaming", "Workshop", "Cultural", "Outdoor",
];

export const KROWN_PASS_BENEFITS = [
  {
    title: "15% Off on Bills",
    description: "Get 15% discount on your total bill at all partner cafes",
    icon: "Percent",
  },
  {
    title: "Priority Reservations",
    description: "Skip the queue with guaranteed priority table bookings",
    icon: "Crown",
  },
  {
    title: "Exclusive Events",
    description: "Early access to exclusive Krown member-only events",
    icon: "Star",
  },
  {
    title: "Free Drink Redemptions",
    description: "Redeem complimentary drinks at partner locations",
    icon: "Coffee",
  },
  {
    title: "Krown Points Boost",
    description: "Earn 2x Krown points on every visit and booking",
    icon: "Zap",
  },
  {
    title: "Member Concierge",
    description: "Dedicated support for all your Krown experiences",
    icon: "Headphones",
  },
];

export const PAGINATION_LIMIT = 10;
export const STALE_TIME = 5 * 60 * 1000; // 5 min
export const GC_TIME = 30 * 60 * 1000; // 30 min
