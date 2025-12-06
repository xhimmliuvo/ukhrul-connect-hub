import React, { createContext, useContext, ReactNode } from 'react';
import { useServiceArea } from '@/hooks/useServiceArea';

interface ServiceArea {
  id: string;
  name: string;
  slug: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

interface ServiceAreaContextType {
  serviceAreas: ServiceArea[];
  currentArea: ServiceArea | null;
  mode: 'auto' | 'manual' | 'unknown';
  loading: boolean;
  geoStatus: 'idle' | 'loading' | 'success' | 'error' | 'denied';
  changeArea: (areaId: string) => Promise<void>;
  detectLocation: () => void;
  requestLocation: () => void;
}

const ServiceAreaContext = createContext<ServiceAreaContextType | undefined>(undefined);

export function ServiceAreaProvider({ children }: { children: ReactNode }) {
  const serviceAreaState = useServiceArea();

  return (
    <ServiceAreaContext.Provider value={serviceAreaState}>
      {children}
    </ServiceAreaContext.Provider>
  );
}

export function useServiceAreaContext() {
  const context = useContext(ServiceAreaContext);
  if (context === undefined) {
    throw new Error('useServiceAreaContext must be used within a ServiceAreaProvider');
  }
  return context;
}
