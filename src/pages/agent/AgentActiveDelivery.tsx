import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  MapPin, 
  Phone,
  Navigation,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ActiveOrder {
  id: string;
  pickup_address: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  delivery_address: string;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  package_description: string | null;
  weight_kg: number;
  is_fragile: boolean;
  distance_km: number;
  total_fee: number;
  agent_adjusted_fee: number | null;
  status: string;
  pickup_time: string | null;
  created_at: string;
  dropee_services: { name: string } | null;
}

export default function AgentActiveDelivery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAgent, loading: rolesLoading } = useUserRoles();
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rolesLoading && !isAgent) {
      navigate('/');
      return;
    }
    if (user && isAgent) {
      fetchActiveOrder();
    }
  }, [user, isAgent, rolesLoading]);

  async function fetchActiveOrder() {
    if (!user) return;

    // Get agent id
    const { data: agentData } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      setLoading(false);
      return;
    }

    // Fetch active order
    const { data, error } = await supabase
      .from('delivery_orders')
      .select(`
        id, pickup_address, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_contact_name, delivery_contact_phone,
        package_description, weight_kg, is_fragile, distance_km,
        total_fee, agent_adjusted_fee, status, pickup_time, created_at,
        dropee_services (name)
      `)
      .eq('assigned_agent_id', agentData.id)
      .in('status', ['agent_assigned', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setActiveOrder(data as ActiveOrder);
    }
    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    if (!activeOrder) return;

    const updates: any = { status: newStatus };
    if (newStatus === 'picked_up') {
      updates.pickup_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from('delivery_orders')
      .update(updates)
      .eq('id', activeOrder.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      if (newStatus === 'in_transit') {
        fetchActiveOrder();
      } else {
        fetchActiveOrder();
      }
    }
  }

  const getStatusStep = () => {
    switch (activeOrder?.status) {
      case 'agent_assigned': return 0;
      case 'picked_up': return 1;
      case 'in_transit': return 2;
      default: return 0;
    }
  };

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground"
              onClick={() => navigate('/agent')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Active Delivery</h1>
          </div>
        </div>

        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="font-semibold text-lg mb-2">No Active Delivery</h2>
              <p className="text-muted-foreground mb-4">
                Accept an order to start delivering
              </p>
              <Button onClick={() => navigate('/agent/orders')}>
                View Pending Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusStep = getStatusStep();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground"
            onClick={() => navigate('/agent')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Active Delivery</h1>
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* Status Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {['Accepted', 'Picked Up', 'In Transit', 'Delivered'].map((step, i) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      i <= statusStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i <= statusStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Order Details</CardTitle>
              <div className="text-right">
                <p className="font-bold text-lg text-primary">
                  ₹{activeOrder.agent_adjusted_fee || activeOrder.total_fee}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service */}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{activeOrder.dropee_services?.name || 'Delivery'}</span>
              {activeOrder.is_fragile && (
                <Badge variant="outline" className="text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Fragile
                </Badge>
              )}
            </div>

            {/* Package info */}
            <div className="text-sm text-muted-foreground">
              {activeOrder.distance_km?.toFixed(1)} km • {activeOrder.weight_kg} kg
              {activeOrder.package_description && ` • ${activeOrder.package_description}`}
            </div>

            {activeOrder.pickup_time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Picked up at {format(new Date(activeOrder.pickup_time), 'h:mm a')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pickup Location */}
        <Card className={statusStep >= 1 ? 'opacity-60' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <CardTitle className="text-base">Pickup</CardTitle>
              {statusStep >= 1 && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{activeOrder.pickup_address}</p>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-sm font-medium">{activeOrder.pickup_contact_name}</p>
                <p className="text-sm text-muted-foreground">{activeOrder.pickup_contact_phone}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(`tel:${activeOrder.pickup_contact_phone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(activeOrder.pickup_address)}`)}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Location */}
        <Card className={statusStep < 1 ? 'opacity-60' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="h-3 w-3 text-red-500" />
              </div>
              <CardTitle className="text-base">Delivery</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{activeOrder.delivery_address}</p>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-sm font-medium">{activeOrder.delivery_contact_name}</p>
                <p className="text-sm text-muted-foreground">{activeOrder.delivery_contact_phone}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(`tel:${activeOrder.delivery_contact_phone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(activeOrder.delivery_address)}`)}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        {activeOrder.status === 'agent_assigned' && (
          <Button 
            className="w-full h-12 text-lg"
            onClick={() => updateStatus('picked_up')}
          >
            <Package className="h-5 w-5 mr-2" />
            Mark as Picked Up
          </Button>
        )}
        {activeOrder.status === 'picked_up' && (
          <Button 
            className="w-full h-12 text-lg"
            onClick={() => updateStatus('in_transit')}
          >
            <Truck className="h-5 w-5 mr-2" />
            Start Delivery
          </Button>
        )}
        {activeOrder.status === 'in_transit' && (
          <Button 
            className="w-full h-12 text-lg"
            onClick={() => navigate(`/agent/complete/${activeOrder.id}`)}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Complete Delivery
          </Button>
        )}
      </div>
    </div>
  );
}
