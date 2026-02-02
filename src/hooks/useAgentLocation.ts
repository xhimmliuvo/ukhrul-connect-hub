import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationState {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
}

interface UseAgentLocationOptions {
  orderId: string;
  agentId: string;
  isActive: boolean;
  trackingStatus: 'en_route_pickup' | 'at_pickup' | 'en_route_delivery' | 'at_delivery';
  intervalMs?: number;
}

interface UseAgentLocationReturn {
  location: LocationState | null;
  isTracking: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  startTracking: () => void;
  stopTracking: () => void;
}

export function useAgentLocation({
  orderId,
  agentId,
  isActive,
  trackingStatus,
  intervalMs = 15000,
}: UseAgentLocationOptions): UseAgentLocationReturn {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUploadRef = useRef<number>(0);

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        };
      }).catch(() => {
        setPermissionStatus('unknown');
      });
    }
  }, []);

  // Upload location to database
  const uploadLocation = useCallback(async (position: GeolocationPosition) => {
    const now = Date.now();
    
    // Throttle uploads to intervalMs
    if (now - lastUploadRef.current < intervalMs - 1000) {
      return;
    }
    
    lastUploadRef.current = now;

    const locationData = {
      order_id: orderId,
      agent_id: agentId,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      heading: position.coords.heading || 0,
      speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // Convert m/s to km/h
      status: trackingStatus,
      timestamp: new Date().toISOString(),
    };

    setLocation({
      lat: locationData.lat,
      lng: locationData.lng,
      heading: locationData.heading,
      speed: locationData.speed,
      accuracy: position.coords.accuracy,
      timestamp: now,
    });

    const { error: insertError } = await supabase
      .from('delivery_tracking')
      .insert(locationData);

    if (insertError) {
      console.error('Failed to upload location:', insertError);
      setError('Failed to upload location');
    } else {
      setError(null);
    }
  }, [orderId, agentId, trackingStatus, intervalMs]);

  // Handle position update
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    uploadLocation(position);
  }, [uploadLocation]);

  // Handle position error
  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError('Location permission denied');
        setPermissionStatus('denied');
        break;
      case err.POSITION_UNAVAILABLE:
        setError('Location unavailable');
        break;
      case err.TIMEOUT:
        setError('Location request timed out');
        break;
      default:
        setError('Unknown location error');
    }
  }, []);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );

    // Backup interval for regular updates
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        handlePositionError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }, intervalMs);
  }, [handlePositionUpdate, handlePositionError, intervalMs]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Auto start/stop based on isActive
  useEffect(() => {
    if (isActive && !isTracking) {
      startTracking();
    } else if (!isActive && isTracking) {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    location,
    isTracking,
    error,
    permissionStatus,
    startTracking,
    stopTracking,
  };
}
