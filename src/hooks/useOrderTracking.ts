import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DeliveryOrder {
  id: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  package_description: string | null;
  weight_kg: number;
  is_fragile: boolean;
  distance_km: number;
  total_fee: number;
  agent_adjusted_fee: number | null;
  pickup_time: string | null;
  delivery_time: string | null;
  estimated_delivery_time: string | null;
  created_at: string;
  assigned_agent_id: string | null;
}

interface TrackingLocation {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  timestamp: string;
}

interface AgentInfo {
  id: string;
  full_name: string;
  agent_code: string;
  phone: string | null;
  avatar_url: string | null;
  vehicle_type: string;
  rating: number | null;
}

interface UseOrderTrackingReturn {
  order: DeliveryOrder | null;
  agent: AgentInfo | null;
  latestLocation: TrackingLocation | null;
  locationHistory: TrackingLocation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrderTracking(orderId: string): UseOrderTrackingReturn {
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [latestLocation, setLatestLocation] = useState<TrackingLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<TrackingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch agent if assigned
      if (orderData.assigned_agent_id) {
        const { data: agentData, error: agentError } = await supabase
          .from('delivery_agents')
          .select('id, full_name, agent_code, phone, avatar_url, vehicle_type, rating')
          .eq('id', orderData.assigned_agent_id)
          .single();

        if (!agentError && agentData) {
          setAgent(agentData);
        }
      }

      // Fetch latest tracking location
      const { data: trackingData, error: trackingError } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!trackingError && trackingData && trackingData.length > 0) {
        setLatestLocation(trackingData[0] as TrackingLocation);
        setLocationHistory(trackingData as TrackingLocation[]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!orderId) return;

    fetchOrder();

    // Subscribe to order status changes
    const channel: RealtimeChannel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, ...payload.new } : payload.new as DeliveryOrder);
          
          // Refetch agent if agent changed
          const newOrder = payload.new as DeliveryOrder;
          if (newOrder.assigned_agent_id && (!agent || agent.id !== newOrder.assigned_agent_id)) {
            supabase
              .from('delivery_agents')
              .select('id, full_name, agent_code, phone, avatar_url, vehicle_type, rating')
              .eq('id', newOrder.assigned_agent_id)
              .single()
              .then(({ data }) => {
                if (data) setAgent(data);
              });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_tracking',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newLocation = payload.new as TrackingLocation;
          setLatestLocation(newLocation);
          setLocationHistory((prev) => [newLocation, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return {
    order,
    agent,
    latestLocation,
    locationHistory,
    loading,
    error,
    refetch: fetchOrder,
  };
}
