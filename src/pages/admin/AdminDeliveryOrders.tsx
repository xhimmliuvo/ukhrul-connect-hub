import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  MapPin,
  Phone,
  Clock,
  User,
  Truck,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Zap,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryOrder {
  id: string;
  status: string;
  pickup_address: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  delivery_address: string;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  package_description: string | null;
  weight_kg: number | null;
  distance_km: number | null;
  total_fee: number | null;
  urgency: string | null;
  is_fragile: boolean | null;
  promo_code: string | null;
  proof_of_delivery_images: string[] | null;
  created_at: string;
  pickup_time: string | null;
  delivery_time: string | null;
  estimated_delivery_time: string | null;
  assigned_agent_id: string | null;
  preferred_agent_id: string | null;
  user_id: string | null;
  assigned_agent?: {
    id: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    agent_code: string;
    agent_availability: { status: string } | null;
  };
  preferred_agent?: {
    id: string;
    full_name: string;
    agent_code: string;
    agent_availability: { status: string } | null;
  };
}

interface Agent {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  agent_code: string;
  is_active: boolean;
  is_verified: boolean;
  agent_availability: { status: string } | null;
  active_orders_count?: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-600',
  agent_assigned: 'bg-blue-500/20 text-blue-600',
  picked_up: 'bg-purple-500/20 text-purple-600',
  in_transit: 'bg-cyan-500/20 text-cyan-600',
  delivered: 'bg-green-500/20 text-green-600',
  cancelled: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  agent_assigned: 'Agent Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function calculateETA(distanceKm: number | null, status: string): string {
  if (!distanceKm) return 'Unknown';
  const avgSpeed = 25;
  const baseTime = (distanceKm / avgSpeed) * 60;
  
  const buffers: Record<string, number> = {
    'pending': 15,
    'agent_assigned': 10,
    'picked_up': 5,
    'in_transit': 0,
  };
  
  const totalMins = Math.ceil(baseTime + (buffers[status] || 0));
  
  if (totalMins < 60) return `~${totalMins} mins`;
  return `~${Math.floor(totalMins/60)}h ${totalMins%60}m`;
}

export default function AdminDeliveryOrders() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');

  useEffect(() => {
    fetchOrders();
    fetchAgents();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_orders')
      .select(`
        *,
        assigned_agent:delivery_agents!delivery_orders_assigned_agent_id_fkey (
          id, full_name, phone, avatar_url, agent_code,
          agent_availability (status)
        ),
        preferred_agent:delivery_agents!delivery_orders_preferred_agent_id_fkey (
          id, full_name, agent_code,
          agent_availability (status)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  async function fetchAgents() {
    const { data, error } = await supabase
      .from('delivery_agents')
      .select(`
        id, full_name, phone, avatar_url, agent_code, is_active, is_verified,
        agent_availability (status)
      `)
      .eq('is_active', true)
      .eq('is_verified', true);

    if (error) {
      console.error('Error fetching agents:', error);
      return;
    }

    // Count active orders for each agent
    const agentsWithCounts: Agent[] = [];
    for (const agent of data || []) {
      const { count } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_agent_id', agent.id)
        .in('status', ['agent_assigned', 'picked_up', 'in_transit']);
      
      agentsWithCounts.push({
        ...agent,
        active_orders_count: count || 0,
      });
    }

    setAgents(agentsWithCounts);
  }

  async function autoAssignAgent(orderId: string) {
    setAssigning(true);
    
    // Find first online agent with no active orders
    const freeAgent = agents.find(
      a => a.agent_availability?.status === 'online' && a.active_orders_count === 0
    );

    if (!freeAgent) {
      toast.error('No free agents available');
      setAssigning(false);
      return;
    }

    await assignAgent(orderId, freeAgent.id);
  }

  async function assignAgent(orderId: string, agentId: string) {
    setAssigning(true);
    
    const { error } = await supabase
      .from('delivery_orders')
      .update({
        assigned_agent_id: agentId,
        status: 'agent_assigned',
      })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to assign agent');
      console.error(error);
    } else {
      toast.success('Agent assigned successfully');
      fetchOrders();
      fetchAgents();
      setDialogOpen(false);
    }
    setAssigning(false);
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('delivery_orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order status');
    } else {
      toast.success('Order status updated');
      fetchOrders();
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pickup_contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.delivery_contact_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'new':
        return order.status === 'pending';
      case 'active':
        return ['agent_assigned', 'picked_up', 'in_transit'].includes(order.status);
      case 'completed':
        return order.status === 'delivered';
      case 'cancelled':
        return order.status === 'cancelled';
      default:
        return true;
    }
  });

  const getAgentStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  function openOrderDetail(order: DeliveryOrder) {
    setSelectedOrder(order);
    setSelectedAgentId(order.assigned_agent_id || '');
    setDialogOpen(true);
  }

  return (
    <AdminLayout title="Delivery Orders" description="Manage all delivery orders, assign agents, and track deliveries">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="new">
              New ({orders.filter(o => o.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({orders.filter(o => ['agent_assigned', 'picked_up', 'in_transit'].includes(o.status)).length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({orders.filter(o => o.status === 'delivered').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({orders.filter(o => o.status === 'cancelled').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No orders found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openOrderDetail(order)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                        <span className="text-lg font-bold text-foreground">
                          ₹{order.total_fee?.toFixed(0) || '—'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-foreground line-clamp-1">{order.pickup_address}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <span className="text-foreground line-clamp-1">{order.delivery_address}</span>
                        </div>
                      </div>

                      {/* Agent Info */}
                      {order.assigned_agent ? (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={order.assigned_agent.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {order.assigned_agent.full_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {order.assigned_agent.full_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={`h-2 w-2 rounded-full ${getAgentStatusColor(order.assigned_agent.agent_availability?.status)}`} />
                              <span className="capitalize">{order.assigned_agent.agent_availability?.status || 'offline'}</span>
                            </div>
                          </div>
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <span className="text-xs text-muted-foreground">
                              ETA: {calculateETA(order.distance_km, order.status)}
                            </span>
                          )}
                        </div>
                      ) : order.preferred_agent ? (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Preferred: {order.preferred_agent.full_name} ({order.preferred_agent.agent_code})
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button size="sm" variant="default" onClick={(e) => { e.stopPropagation(); autoAssignAgent(order.id); }}>
                            <Zap className="h-3 w-3 mr-1" />
                            Auto
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}>
                            Manual
                          </Button>
                        </div>
                      )}

                      {/* Completed order extras */}
                      {order.status === 'delivered' && order.proof_of_delivery_images && order.proof_of_delivery_images.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                          <ImageIcon className="h-3 w-3" />
                          <span>{order.proof_of_delivery_images.length} proof image(s)</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                        <span>{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
                        {order.urgency === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Order Details</span>
                  <Badge className={statusColors[selectedOrder.status]}>
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Pickup & Delivery */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        Pickup
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p className="font-medium text-foreground">{selectedOrder.pickup_contact_name}</p>
                      <p className="text-muted-foreground">{selectedOrder.pickup_address}</p>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.pickup_contact_phone}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        Delivery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p className="font-medium text-foreground">{selectedOrder.delivery_contact_name}</p>
                      <p className="text-muted-foreground">{selectedOrder.delivery_address}</p>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.delivery_contact_phone}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Package Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Package Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="text-foreground">{selectedOrder.package_description || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Weight</Label>
                        <p className="text-foreground">{selectedOrder.weight_kg || 1} kg</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Distance</Label>
                        <p className="text-foreground">{selectedOrder.distance_km?.toFixed(1) || '—'} km</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Total Fee</Label>
                        <p className="text-foreground font-bold">₹{selectedOrder.total_fee?.toFixed(0) || '—'}</p>
                      </div>
                      {selectedOrder.is_fragile && (
                        <div>
                          <Badge variant="secondary">Fragile</Badge>
                        </div>
                      )}
                      {selectedOrder.promo_code && (
                        <div>
                          <Label className="text-muted-foreground">Promo Code</Label>
                          <p className="text-foreground">{selectedOrder.promo_code}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Assignment */}
                {selectedOrder.status === 'pending' && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Assign Agent
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedOrder.preferred_agent && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">User's Preferred Agent:</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{selectedOrder.preferred_agent.full_name}</span>
                            <Badge variant="outline">{selectedOrder.preferred_agent.agent_code}</Badge>
                            <span className={`h-2 w-2 rounded-full ${getAgentStatusColor(selectedOrder.preferred_agent.agent_availability?.status)}`} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {selectedOrder.preferred_agent.agent_availability?.status || 'offline'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Select Agent</Label>
                        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an agent..." />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${getAgentStatusColor(agent.agent_availability?.status)}`} />
                                  <span>{agent.full_name} ({agent.agent_code})</span>
                                  <span className="text-muted-foreground">
                                    • {agent.active_orders_count} active
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => autoAssignAgent(selectedOrder.id)}
                          disabled={assigning}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Auto-Assign Free Agent
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => selectedAgentId && assignAgent(selectedOrder.id, selectedAgentId)}
                          disabled={!selectedAgentId || assigning}
                        >
                          Assign Selected
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Agent */}
                {selectedOrder.assigned_agent && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Assigned Agent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedOrder.assigned_agent.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {selectedOrder.assigned_agent.full_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{selectedOrder.assigned_agent.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{selectedOrder.assigned_agent.agent_code}</Badge>
                            <span className={`h-2 w-2 rounded-full ${getAgentStatusColor(selectedOrder.assigned_agent.agent_availability?.status)}`} />
                            <span className="capitalize">{selectedOrder.assigned_agent.agent_availability?.status || 'offline'}</span>
                          </div>
                          {selectedOrder.assigned_agent.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {selectedOrder.assigned_agent.phone}
                            </p>
                          )}
                        </div>
                        {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                          <div className="ml-auto text-right">
                            <p className="text-sm text-muted-foreground">ETA</p>
                            <p className="font-medium text-foreground">
                              {calculateETA(selectedOrder.distance_km, selectedOrder.status)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Proof of Delivery Images */}
                {selectedOrder.proof_of_delivery_images && selectedOrder.proof_of_delivery_images.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Delivery Proof
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 overflow-x-auto">
                        {selectedOrder.proof_of_delivery_images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Proof ${i + 1}`}
                            className="h-24 w-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timestamps */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-foreground">{format(new Date(selectedOrder.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    {selectedOrder.pickup_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Picked Up</span>
                        <span className="text-foreground">{format(new Date(selectedOrder.pickup_time), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivered</span>
                        <span className="text-foreground">{format(new Date(selectedOrder.delivery_time), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                {selectedOrder.status === 'pending' && (
                  <Button variant="destructive" onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
                {selectedOrder.status === 'in_transit' && (
                  <Button onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Delivered
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
