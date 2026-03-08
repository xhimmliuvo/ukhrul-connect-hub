import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type HubStatus = 'pending' | 'confirmed' | 'preparing' | 'picked_up' | 'on_the_way' | 'delivered';

const HUB_STATUS_ORDER: HubStatus[] = [
  'pending', 'confirmed', 'preparing', 'picked_up', 'on_the_way', 'delivered'
];

export const HUB_STATUS_LABELS: Record<HubStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  picked_up: 'Picked Up',
  on_the_way: 'On The Way',
  delivered: 'Delivered',
};

export function getHubStatusIndex(status: string): number {
  return HUB_STATUS_ORDER.indexOf(status as HubStatus);
}

interface UseHubTrackingReturn {
  hubStatus: string | null;
  loading: boolean;
  error: string | null;
}

export function useHubTracking(hubOrderId: string | null): UseHubTrackingReturn {
  const [hubStatus, setHubStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const pollStatus = useCallback(async () => {
    if (!hubOrderId) return;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('hub-check-status', {
        body: { hub_order_id: hubOrderId },
      });

      if (fnError) {
        console.error('Hub status poll error:', fnError);
        return;
      }

      if (data?.hub_status) {
        setHubStatus(data.hub_status);
        // Stop polling if delivered
        if (data.hub_status === 'delivered' && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Hub poll error:', err);
    }
  }, [hubOrderId]);

  useEffect(() => {
    if (!hubOrderId) return;

    setLoading(true);
    setError(null);

    // Try WebSocket first
    let wsConnected = false;
    try {
      // WebSocket URL derived from HUB_URL — will fail with placeholder, falls back to polling
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      // We don't expose HUB_URL to client; just use polling
      wsConnected = false;
    } catch {
      wsConnected = false;
    }

    // Start polling as primary mechanism (WebSocket would require exposing HUB_URL to client)
    pollStatus().finally(() => setLoading(false));

    intervalRef.current = setInterval(pollStatus, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [hubOrderId, pollStatus]);

  return { hubStatus, loading, error };
}
