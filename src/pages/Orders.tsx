import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, ArrowLeft, Loader2, Package, MapPin, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DropeeOrder {
  id: string;
  business_name: string;
  business_type: string;
  order_type: string;
  status: string;
  user_contact: string;
  details: any;
  created_at: string;
}

interface DeliveryOrder {
  id: string;
  pickup_address: string;
  delivery_address: string;
  status: string;
  total_fee: number;
  agent_adjusted_fee: number | null;
  distance_km: number;
  weight_kg: number;
  created_at: string;
  dropee_services: { name: string } | null;
  delivery_agents: { full_name: string; agent_code: string } | null;
}

export default function Orders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [dropeeOrders, setDropeeOrders] = useState<DropeeOrder[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  // Real-time subscription for delivery orders
  useEffect(() => {
    if (!user) return;

    const channel: RealtimeChannel = supabase
      .channel('delivery-orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchDeliveryOrders();
          } else if (payload.eventType === 'UPDATE') {
            setDeliveryOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? { ...order, ...payload.new }
                  : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    await Promise.all([fetchDropeeOrders(), fetchDeliveryOrders()]);
    setLoading(false);
  };

  const fetchDropeeOrders = async () => {
    const { data, error } = await supabase
      .from('dropee_orders')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setDropeeOrders(data || []);
    }
  };

  const fetchDeliveryOrders = async () => {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select(`
        id, pickup_address, delivery_address, status, total_fee,
        agent_adjusted_fee, distance_km, weight_kg, created_at,
        dropee_services (name),
        delivery_agents!delivery_orders_assigned_agent_id_fkey (full_name, agent_code)
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setDeliveryOrders(data as DeliveryOrder[] || []);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'agent_assigned': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'picked_up': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'in_progress': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'in_transit': return 'bg-indigo-500/10 text-indigo-600 border-indigo-200';
      case 'delivered': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isActiveDeliveryStatus = (status: string) => {
    return ['pending', 'agent_assigned', 'picked_up', 'in_transit'].includes(status);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">My Orders</h1>
        </div>

        <Tabs defaultValue="delivery" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Delivery
              {deliveryOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {deliveryOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Business
              {dropeeOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {dropeeOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Delivery Orders Tab */}
          <TabsContent value="delivery" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : deliveryOrders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No delivery orders yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Request a delivery from the Services page
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/services')}>
                    Browse Services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {deliveryOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {order.dropee_services?.name || 'Delivery'}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status?.replace(/_/g, ' ') || 'Pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                          <p className="text-muted-foreground line-clamp-1">
                            {order.pickup_address}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <p className="text-muted-foreground line-clamp-1">
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            ₹{order.agent_adjusted_fee || order.total_fee}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {order.distance_km?.toFixed(1)} km
                          </span>
                        </div>
                        {order.delivery_agents && (
                          <span className="text-xs text-muted-foreground">
                            Agent: {order.delivery_agents.agent_code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                        {isActiveDeliveryStatus(order.status) ? (
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/track/${order.id}`)}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Track
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/track/${order.id}`)}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Business Orders Tab */}
          <TabsContent value="business" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : dropeeOrders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No business orders yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    When you place orders through Dropee businesses, they'll appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {dropeeOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{order.business_name}</CardTitle>
                          <p className="text-sm text-muted-foreground capitalize">
                            {order.order_type.replace('_', ' ')}
                          </p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(order.status || 'pending')}>
                          {order.status?.replace('_', ' ') || 'Pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Contact: {order.user_contact}</p>
                        <p>Ordered: {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
