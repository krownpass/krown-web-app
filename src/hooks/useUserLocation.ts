'use client';

import { useState, useEffect } from 'react';

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  hasPermission: boolean;
}

export function useUserLocation(): UserLocation {
  const [location, setLocation] = useState<UserLocation>({
    latitude: null,
    longitude: null,
    isLoading: true,
    hasPermission: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          isLoading: false,
          hasPermission: true,
        });
      },
      () => {
        setLocation((prev) => ({ ...prev, isLoading: false }));
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  return location;
}
