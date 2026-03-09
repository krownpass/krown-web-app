'use client';

import { useEffect, useState } from 'react';
import { wsClient } from '@/lib/websocket';
import { useAuthStore } from '@/stores/authStore';

interface EventRoomData {
  seatsLeft?: number;
  registrationCount?: number;
  isUpdating: boolean;
}

export function useWebSocket() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && token) {
      wsClient.connect(token);
    }

    return () => {
      // Don't disconnect on component unmount — keep connection alive app-wide
    };
  }, [isAuthenticated, token]);
}

export function useEventRoom(eventId: string) {
  const [roomData, setRoomData] = useState<EventRoomData>({
    seatsLeft: undefined,
    registrationCount: undefined,
    isUpdating: false,
  });

  useEffect(() => {
    if (!eventId) return;

    const room = `event:${eventId}`;
    wsClient.joinRoom(room);

    const handleSeatUpdate = (message: { type: string; payload?: unknown }) => {
      const payload = message.payload as { seats_left?: number } | undefined;
      setRoomData((prev) => ({
        ...prev,
        seatsLeft: payload?.seats_left ?? prev.seatsLeft,
        isUpdating: false,
      }));
    };

    const handleRegistrationCount = (message: { type: string; payload?: unknown }) => {
      const payload = message.payload as { count?: number } | undefined;
      setRoomData((prev) => ({
        ...prev,
        registrationCount: payload?.count ?? prev.registrationCount,
        isUpdating: false,
      }));
    };

    const handleSeatLocked = () => {
      setRoomData((prev) => ({ ...prev, isUpdating: true }));
    };

    wsClient.on('SEAT_LOCKED', handleSeatLocked);
    wsClient.on('SEAT_UNLOCKED', handleSeatUpdate);
    wsClient.on('REGISTRATION_COUNT', handleRegistrationCount);
    wsClient.on('REGISTRATION_NEW', handleRegistrationCount);

    return () => {
      wsClient.leaveRoom(room);
      wsClient.off('SEAT_LOCKED', handleSeatLocked);
      wsClient.off('SEAT_UNLOCKED', handleSeatUpdate);
      wsClient.off('REGISTRATION_COUNT', handleRegistrationCount);
      wsClient.off('REGISTRATION_NEW', handleRegistrationCount);
    };
  }, [eventId]);

  return roomData;
}
