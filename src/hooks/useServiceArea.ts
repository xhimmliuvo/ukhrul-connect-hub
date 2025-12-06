import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from './useGeolocation';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceArea {
  id: string;
  name: string;
  slug: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const STORAGE_KEY = 'discover_ukhrul_service_area';

export function useServiceArea() {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [currentArea, setCurrentArea] = useState<ServiceArea | null>(null);
  const [mode, setMode] = useState<'auto' | 'manual' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(true);
  
  const { coords, status: geoStatus, requestLocation } = useGeolocation();
  const { user } = useAuth();

  // Fetch all service areas
  useEffect(() => {
    async function fetchServiceAreas() {
      const { data, error } = await supabase
        .from('service_areas')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error fetching service areas:', error);
        return;
      }

      setServiceAreas(data || []);
      
      // Check localStorage for saved area
      const savedAreaId = localStorage.getItem(STORAGE_KEY);
      if (savedAreaId && data) {
        const savedArea = data.find((a: ServiceArea) => a.id === savedAreaId);
        if (savedArea) {
          setCurrentArea(savedArea);
          setMode('manual');
          setLoading(false);
          return;
        }
      }
      
      setLoading(false);
    }

    fetchServiceAreas();
  }, []);

  // Find nearest service area when coords change
  useEffect(() => {
    if (coords && serviceAreas.length > 0 && mode !== 'manual') {
      let nearestArea: ServiceArea | null = null;
      let minDistance = Infinity;

      for (const area of serviceAreas) {
        const distance = calculateDistance(
          coords.lat,
          coords.lng,
          Number(area.center_lat),
          Number(area.center_lng)
        );
        
        if (distance < minDistance && distance <= Number(area.radius_km)) {
          minDistance = distance;
          nearestArea = area;
        }
      }

      // If within a service area, use it; otherwise use closest one
      if (nearestArea) {
        setCurrentArea(nearestArea);
        setMode('auto');
      } else if (serviceAreas.length > 0) {
        // Find absolutely closest area
        for (const area of serviceAreas) {
          const distance = calculateDistance(
            coords.lat,
            coords.lng,
            Number(area.center_lat),
            Number(area.center_lng)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestArea = area;
          }
        }
        if (nearestArea) {
          setCurrentArea(nearestArea);
          setMode('auto');
        }
      }
    }
  }, [coords, serviceAreas, mode]);

  // Change area manually
  const changeArea = useCallback(async (areaId: string) => {
    const area = serviceAreas.find(a => a.id === areaId);
    if (!area) return;

    setCurrentArea(area);
    setMode('manual');
    localStorage.setItem(STORAGE_KEY, areaId);

    // Sync with profile if logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ service_area_id: areaId })
        .eq('id', user.id);
    }
  }, [serviceAreas, user]);

  // Detect location automatically
  const detectLocation = useCallback(() => {
    setMode('unknown');
    localStorage.removeItem(STORAGE_KEY);
    requestLocation();
  }, [requestLocation]);

  return {
    serviceAreas,
    currentArea,
    mode,
    loading,
    geoStatus,
    changeArea,
    detectLocation,
    requestLocation,
  };
}
