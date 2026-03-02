import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Pending',
  agent_assigned: 'Agent Assigned',
  picked_up: 'Package Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function useRealtimeOrders() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          const label = STATUS_LABELS[newStatus] || newStatus;
          toast.info(`Order Update: ${label}`, {
            description: 'Your delivery order status has changed.',
          });

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new window.Notification('Order Update', {
              body: label,
              icon: '/favicon.ico',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
