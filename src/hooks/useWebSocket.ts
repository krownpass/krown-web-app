'use client';

import { useEffect, useState } from 'react';
import { wsClient } from '@/lib/websocket';
import { useAuthStore } from '@/stores/authStore';

interface EventRoomData {
  seatsLeft?: number;
  registrationCount?: number;
  isUpdating: boolean;
  eventUpdates: Record<string, any>;
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
    eventUpdates: {},
  });

  useEffect(() => {
    if (!eventId) return;

    // We don't need the string prefix, just the UUID
    wsClient.joinRoom(eventId);

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

    const handleEventUpdated = (message: { type: string; payload?: unknown }) => {
      console.log("[useEventRoom] Received EVENT_UPDATED:", message);
      const payload = message.payload as { field: string | string[]; value: any } | undefined;
      
      if (payload && payload.field) {
        setRoomData((prev) => {
          const updates = { ...prev.eventUpdates };
          
          // If the server sent a complete object representation rather than a single field value
          if (typeof payload.value === 'object' && payload.value !== null) {
             Object.assign(updates, payload.value);
          } else {
             // Fallback for single field updates
             const fieldStr = Array.isArray(payload.field) ? payload.field[0] : payload.field;
             updates[fieldStr] = payload.value;
          }

          return {
            ...prev,
            eventUpdates: updates,
            isUpdating: false,
          };
        });
      }
    };

    const handleRoomJoined = (message: any) => {
      console.log(`[useEventRoom] Successfully joined room for event: ${eventId}`, message);
    };

    const handleError = (message: any) => {
      console.error(`[useEventRoom] Received WebSocket Error:`, message.code, message.message, message);
    };

    const handleSeatLocked = () => {
      setRoomData((prev) => ({ ...prev, isUpdating: true }));
    };

    wsClient.on('SEAT_LOCKED', handleSeatLocked);
    wsClient.on('SEAT_UNLOCKED', handleSeatUpdate);
    wsClient.on('REGISTRATION_COUNT', handleRegistrationCount);
    wsClient.on('REGISTRATION_NEW', handleRegistrationCount);
    wsClient.on('EVENT_UPDATED', handleEventUpdated);
    wsClient.on('ROOM_JOINED', handleRoomJoined);
    wsClient.on('ERROR', handleError);

    return () => {
      wsClient.leaveRoom(eventId);
      wsClient.off('SEAT_LOCKED', handleSeatLocked);
      wsClient.off('SEAT_UNLOCKED', handleSeatUpdate);
      wsClient.off('REGISTRATION_COUNT', handleRegistrationCount);
      wsClient.off('REGISTRATION_NEW', handleRegistrationCount);
      wsClient.off('EVENT_UPDATED', handleEventUpdated);
      wsClient.off('ROOM_JOINED', handleRoomJoined);
      wsClient.off('ERROR', handleError);
    };
  }, [eventId]);

  return roomData;
}
