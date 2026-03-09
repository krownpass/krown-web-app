import { create } from "zustand";
import type { EventSeat } from "@/types/event";

interface EventState {
  lockedSeats: Record<string, EventSeat[]>;
  liveRegistrations: Record<string, number>;
  wsConnected: boolean;

  setLockedSeats: (eventId: string, seats: EventSeat[]) => void;
  lockSeat: (eventId: string, seat: EventSeat) => void;
  unlockSeat: (eventId: string, seatId: string) => void;
  setLiveRegistrations: (eventId: string, count: number) => void;
  setWsConnected: (connected: boolean) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  lockedSeats: {},
  liveRegistrations: {},
  wsConnected: false,

  setLockedSeats: (eventId, seats) =>
    set((s) => ({ lockedSeats: { ...s.lockedSeats, [eventId]: seats } })),

  lockSeat: (eventId, seat) =>
    set((s) => ({
      lockedSeats: {
        ...s.lockedSeats,
        [eventId]: [...(s.lockedSeats[eventId] ?? []), seat],
      },
    })),

  unlockSeat: (eventId, seatId) =>
    set((s) => ({
      lockedSeats: {
        ...s.lockedSeats,
        [eventId]: (s.lockedSeats[eventId] ?? []).filter((s) => s.seat_id !== seatId),
      },
    })),

  setLiveRegistrations: (eventId, count) =>
    set((s) => ({
      liveRegistrations: { ...s.liveRegistrations, [eventId]: count },
    })),

  setWsConnected: (connected) => set({ wsConnected: connected }),
}));

// Fix type reference
type EventStore = EventState;
