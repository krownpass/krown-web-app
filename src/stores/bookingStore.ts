import { create } from "zustand";
import type { Cafe } from "@/types/cafe";

interface BookingState {
  selectedCafe: Cafe | null;
  bookingType: "standard" | "priority";
  selectedDate: string;
  selectedTimeSlot: string;
  guestCount: number;
  specialRequests: string;

  setSelectedCafe: (cafe: Cafe) => void;
  setBookingType: (type: "standard" | "priority") => void;
  setSelectedDate: (date: string) => void;
  setSelectedTimeSlot: (slot: string) => void;
  setGuestCount: (count: number) => void;
  setSpecialRequests: (text: string) => void;
  resetBooking: () => void;
}

const defaultState = {
  selectedCafe: null,
  bookingType: "standard" as const,
  selectedDate: "",
  selectedTimeSlot: "",
  guestCount: 2,
  specialRequests: "",
};

export const useBookingStore = create<BookingState>((set) => ({
  ...defaultState,

  setSelectedCafe: (cafe) => set({ selectedCafe: cafe }),
  setBookingType: (type) => set({ bookingType: type }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTimeSlot: (slot) => set({ selectedTimeSlot: slot }),
  setGuestCount: (count) => set({ guestCount: count }),
  setSpecialRequests: (text) => set({ specialRequests: text }),
  resetBooking: () => set(defaultState),
}));
