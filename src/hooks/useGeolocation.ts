import { useState, useCallback } from 'react';

interface GeolocationState {
  status: 'idle' | 'loading' | 'success' | 'error' | 'denied';
  coords: { lat: number; lng: number } | null;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    status: 'idle',
    coords: null,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: 'error',
        coords: null,
        error: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'success',
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        let status: GeolocationState['status'] = 'error';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            status = 'denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        setState({
          status,
          coords: null,
          error: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      status: 'idle',
      coords: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation,
  };
}
