import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | undefined | null, formatStr = "MMM d, yyyy"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: string | Date | undefined | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats a plain time string (e.g. "14:30", "9:00", "14:30-15:30") to
 * 12-hour AM/PM notation: "02:30 PM". Handles range slots by formatting
 * both ends: "02:30 PM – 03:30 PM".
 */
export function formatTimeSlot(slot: string | undefined | null): string {
  if (!slot) return "";

  const formatSingle = (t: string): string => {
    const [hStr, mStr] = t.trim().split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr ?? "0", 10);
    if (isNaN(h)) return t.trim();
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  };

  // Handle range like "14:00-15:00" or "14:00 - 15:00"
  const parts = slot.split(/-(?=\d)/);
  if (parts.length === 2) {
    return `${formatSingle(parts[0])} – ${formatSingle(parts[1])}`;
  }

  return formatSingle(slot);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getPriceRange(range?: number): string {
  if (!range) return "";
  return "₹".repeat(range);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function getDistance(km?: number): string {
  if (!km) return "";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function getDistanceFromLatLon(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCapacityPercent(current?: number, max?: number): number {
  if (!current || !max) return 0;
  return Math.min(Math.round((current / max) * 100), 100);
}

export function isEventUpcoming(startTime: string): boolean {
  return new Date(startTime) > new Date();
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    confirmed: "text-green-400 bg-green-400/10",
    pending: "text-yellow-400 bg-yellow-400/10",
    completed: "text-blue-400 bg-blue-400/10",
    cancelled: "text-red-400 bg-red-400/10",
    no_show: "text-gray-400 bg-gray-400/10",
    active: "text-green-400 bg-green-400/10",
    used: "text-gray-400 bg-gray-400/10",
    waitlisted: "text-orange-400 bg-orange-400/10",
    refunded: "text-purple-400 bg-purple-400/10",
  };
  return map[status] ?? "text-gray-400 bg-gray-400/10";
}
