import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowLeft,
  MapPin, 
  Package, 
  Phone,
  Clock,
  AlertTriangle,
  Check,
  X,
  DollarSign,
  Loader2,
  User,
  Navigation
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DeliveryOrder {
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
  weather_condition: string;
  urgency: string;
  distance_km: number;
  total_fee: number;
  agent_adjusted_fee: number | null;
  status: string;
  created_at: string;
  preferred_agent_id: string | null;
  assigned_agent_id: string | null;
  dropee_services: { name: string } | null;
}

export default function AgentOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAgent, loading: rolesLoading } = useUserRoles();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'decline' | 'adjust'>('accept');
  const [adjustedFee, setAdjustedFee] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!rolesLoading && !isAgent) {
      navigate('/');
      return;
    }
    if (user && isAgent) {
      fetchAgentId();
    }
  }, [user, isAgent, rolesLoading]);

  useEffect(() => {
    if (agentId) {
      fetchOrders();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('agent-orders')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'delivery_orders',
        }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [agentId, activeTab]);

  async function fetchAgentId() {
    if (!user) return;
    
    const { data } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setAgentId(data.id);
    }
  }

  async function fetchOrders() {
    if (!agentId) return;
    setLoading(true);

    let query = supabase
      .from('delivery_orders')
      .select(`
        id, pickup_address, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_contact_name, delivery_contact_phone,
        package_description, weight_kg, is_fragile, weather_condition,
        urgency, distance_km, total_fee, agent_adjusted_fee, status,
        created_at, preferred_agent_id, assigned_agent_id,
        dropee_services (name)
      `)
      .order('created_at', { ascending: false });

    if (activeTab === 'pending') {
      // Show unassigned orders or orders preferred to this agent
      query = query.eq('status', 'pending');
    } else if (activeTab === 'active') {
      query = query
        .eq('assigned_agent_id', agentId)
        .in('status', ['agent_assigned', 'picked_up', 'in_transit']);
    } else if (activeTab === 'completed') {
      query = query
        .eq('assigned_agent_id', agentId)
        .eq('status', 'delivered')
        .limit(20);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data as DeliveryOrder[]);
    }
    setLoading(false);
  }

  function openOrderAction(order: DeliveryOrder, action: 'accept' | 'decline' | 'adjust') {
    setSelectedOrder(order);
    setActionType(action);
    setAdjustedFee(order.total_fee?.toString() || '');
    setAdjustmentReason('');
  }

  async function handleAcceptOrder() {
    if (!selectedOrder || !agentId) return;
    setProcessing(true);

    try {
      // Check if adjusting fee
      const fee = adjustedFee ? parseFloat(adjustedFee) : selectedOrder.total_fee;
      const hasAdjustment = fee !== selectedOrder.total_fee;

      // Update order with agent assignment
      const { error: orderError } = await supabase
        .from('delivery_orders')
        .update({
          assigned_agent_id: agentId,
          status: 'agent_assigned',
          agent_adjusted_fee: hasAdjustment ? fee : null,
          fee_adjustment_reason: hasAdjustment ? adjustmentReason : null,
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // Create response record
      const { error: responseError } = await supabase
        .from('agent_order_responses')
        .insert({
          order_id: selectedOrder.id,
          agent_id: agentId,
          action: hasAdjustment ? 'counter_offer' : 'accepted',
          proposed_fee: hasAdjustment ? fee : null,
          response_message: adjustmentReason || null,
        });

      if (responseError) throw responseError;

      toast.success('Order accepted!');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error('Failed to accept order', { description: err.message });
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeclineOrder() {
    if (!selectedOrder || !agentId) return;
    setProcessing(true);

    try {
      // Create decline response
      const { error } = await supabase
        .from('agent_order_responses')
        .insert({
          order_id: selectedOrder.id,
          agent_id: agentId,
          action: 'declined',
          response_message: adjustmentReason || null,
        });

      if (error) throw error;

      toast.success('Order declined');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error('Failed to decline order', { description: err.message });
    } finally {
      setProcessing(false);
    }
  }

  async function handleUpdateStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('delivery_orders')
      .update({ 
        status: newStatus,
        ...(newStatus === 'picked_up' ? { pickup_time: new Date().toISOString() } : {}),
      })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Order marked as ${newStatus.replace('_', ' ')}`);
      fetchOrders();
    }
  }

  const renderOrderCard = (order: DeliveryOrder) => {
    const isPreferred = order.preferred_agent_id === agentId;
    const isAssigned = order.assigned_agent_id === agentId;

    return (
      <Card key={order.id} className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={order.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                  {order.urgency}
                </Badge>
                {isPreferred && (
                  <Badge variant="outline" className="text-primary border-primary">
                    Preferred
                  </Badge>
                )}
                {order.is_fragile && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Fragile
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(order.created_at), 'dd MMM, h:mm a')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-primary">
                ₹{order.agent_adjusted_fee || order.total_fee}
              </p>
              {order.agent_adjusted_fee && (
                <p className="text-xs text-muted-foreground line-through">
                  ₹{order.total_fee}
                </p>
              )}
            </div>
          </div>

          {/* Service */}
          {order.dropee_services && (
            <p className="text-sm font-medium text-foreground">
              {order.dropee_services.name}
            </p>
          )}

          {/* Locations */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{order.pickup_address}</p>
                <p className="text-muted-foreground">{order.pickup_contact_name}</p>
              </div>
            </div>
            <div className="ml-2.5 border-l-2 border-dashed border-muted h-4" />
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="h-3 w-3 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{order.delivery_address}</p>
                <p className="text-muted-foreground">{order.delivery_contact_name}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{order.distance_km?.toFixed(1)} km</span>
            <span>{order.weight_kg} kg</span>
            {order.package_description && (
              <span className="truncate">{order.package_description}</span>
            )}
          </div>

          {/* Actions */}
          {activeTab === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => openOrderAction(order, 'decline')}
              >
                <X className="h-4 w-4 mr-1" /> Decline
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => openOrderAction(order, 'accept')}
              >
                <Check className="h-4 w-4 mr-1" /> Accept
              </Button>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${order.pickup_contact_phone}`)}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${order.delivery_contact_phone}`)}
              >
                <User className="h-4 w-4" />
              </Button>
              {order.status === 'agent_assigned' && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUpdateStatus(order.id, 'picked_up')}
                >
                  Mark Picked Up
                </Button>
              )}
              {order.status === 'picked_up' && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUpdateStatus(order.id, 'in_transit')}
                >
                  Start Delivery
                </Button>
              )}
              {order.status === 'in_transit' && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/agent/complete/${order.id}`)}
                >
                  Complete Delivery
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          <h1 className="font-bold text-lg">Orders</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-background h-12 p-0">
          <TabsTrigger 
            value="pending" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Pending
          </TabsTrigger>
          <TabsTrigger 
            value="active"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Active
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Completed
          </TabsTrigger>
        </TabsList>

        <div className="p-4 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No {activeTab} orders</p>
              </CardContent>
            </Card>
          ) : (
            orders.map(renderOrderCard)
          )}
        </div>
      </Tabs>

      {/* Accept/Decline Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' ? 'Accept Order' : 'Decline Order'}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Current Fee</span>
                  <span className="font-bold">₹{selectedOrder.total_fee}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.distance_km?.toFixed(1)} km • {selectedOrder.weight_kg} kg
                </p>
              </div>

              {actionType === 'accept' && (
                <div className="space-y-3">
                  <div>
                    <Label>Adjust Fee (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={adjustedFee}
                        onChange={(e) => setAdjustedFee(e.target.value)}
                        placeholder={selectedOrder.total_fee?.toString()}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave as-is to accept at current fee
                    </p>
                  </div>
                  {adjustedFee && parseFloat(adjustedFee) !== selectedOrder.total_fee && (
                    <div>
                      <Label>Reason for Adjustment</Label>
                      <Textarea
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="e.g., Steep hill, heavy traffic area..."
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              )}

              {actionType === 'decline' && (
                <div>
                  <Label>Reason (Optional)</Label>
                  <Textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Why are you declining this order?"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Cancel
            </Button>
            {actionType === 'accept' ? (
              <Button onClick={handleAcceptOrder} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Accept Order
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleDeclineOrder} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Decline Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
