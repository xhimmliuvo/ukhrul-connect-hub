import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, 
  Package, 
  DollarSign, 
  Star, 
  Clock, 
  CheckCircle,
  XCircle,
  Bell,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';

interface AgentProfile {
  id: string;
  agent_code: string;
  full_name: string;
  avatar_url: string | null;
  vehicle_type: string;
  rating: number | null;
  total_deliveries: number;
  total_earnings: number;
  is_available: boolean;
  agent_availability: { status: string } | null;
}

interface OrderStats {
  pending: number;
  active: number;
  completedToday: number;
  earningsToday: number;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAgent, loading: rolesLoading } = useUserRoles();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [stats, setStats] = useState<OrderStats>({ pending: 0, active: 0, completedToday: 0, earningsToday: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!rolesLoading && !isAgent) {
      navigate('/');
      return;
    }
    if (user && isAgent) {
      fetchAgentProfile();
      fetchStats();
    }
  }, [user, isAgent, rolesLoading, navigate]);

  async function fetchAgentProfile() {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('delivery_agents')
      .select(`
        id, agent_code, full_name, avatar_url, vehicle_type,
        rating, total_deliveries, total_earnings, is_available,
        agent_availability (status)
      `)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching agent:', error);
      toast.error('Failed to load agent profile');
    } else {
      setAgent(data as AgentProfile);
    }
    setLoading(false);
  }

  async function fetchStats() {
    if (!user) return;

    // Get agent id first
    const { data: agentData } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agentData) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch pending orders (orders with no assigned agent or preferred to this agent)
    const { count: pendingCount } = await supabase
      .from('delivery_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .or(`assigned_agent_id.is.null,preferred_agent_id.eq.${agentData.id}`);

    // Fetch active orders for this agent
    const { count: activeCount } = await supabase
      .from('delivery_orders')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_agent_id', agentData.id)
      .in('status', ['agent_assigned', 'picked_up', 'in_transit']);

    // Fetch completed orders today
    const { data: completedOrders } = await supabase
      .from('delivery_orders')
      .select('total_fee, agent_adjusted_fee')
      .eq('assigned_agent_id', agentData.id)
      .eq('status', 'delivered')
      .gte('delivery_time', today.toISOString());

    const completedToday = completedOrders?.length || 0;
    const earningsToday = completedOrders?.reduce((sum, o) => {
      return sum + (o.agent_adjusted_fee || o.total_fee || 0);
    }, 0) || 0;

    setStats({
      pending: pendingCount || 0,
      active: activeCount || 0,
      completedToday,
      earningsToday,
    });
  }

  async function toggleOnlineStatus() {
    if (!agent) return;
    
    setUpdatingStatus(true);
    const newStatus = agent.agent_availability?.status === 'online' ? 'offline' : 'online';
    
    const { error } = await supabase
      .from('agent_availability')
      .update({ status: newStatus, last_seen_at: new Date().toISOString() })
      .eq('agent_id', agent.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`You are now ${newStatus}`);
      fetchAgentProfile();
    }
    setUpdatingStatus(false);
  }

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const isOnline = agent?.agent_availability?.status === 'online';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-lg">
              {agent?.full_name?.slice(0, 2).toUpperCase() || 'AG'}
            </div>
            <div>
              <h1 className="font-bold text-lg">{agent?.full_name}</h1>
              <Badge variant="outline" className="text-primary-foreground border-primary-foreground/50">
                {agent?.agent_code}
              </Badge>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Online Toggle */}
        <Card className="bg-primary-foreground/10 border-primary-foreground/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-muted'}`} />
              <span className="font-medium">
                {isOnline ? 'Online - Accepting Orders' : 'Offline'}
              </span>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={toggleOnlineStatus}
              disabled={updatingStatus}
            />
          </CardContent>
        </Card>
      </div>

      <main className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Pending</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Truck className="h-4 w-4" />
                <span className="text-sm">Active</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Today</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.completedToday}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Earnings</span>
              </div>
              <p className="text-2xl font-bold text-primary">₹{stats.earningsToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lifetime Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lifetime Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                <Star className="h-5 w-5 fill-yellow-500" />
                <span className="font-bold text-lg">{agent?.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">{agent?.total_deliveries || 0}</p>
              <p className="text-xs text-muted-foreground">Deliveries</p>
            </div>
            <div>
              <p className="font-bold text-lg text-primary">₹{agent?.total_earnings?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate('/agent/orders')}
          >
            <Package className="h-6 w-6" />
            <span>View Orders</span>
            {stats.pending > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2">
                {stats.pending}
              </Badge>
            )}
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate('/agent/active')}
          >
            <Truck className="h-6 w-6" />
            <span>Active Delivery</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate('/agent/earnings')}
          >
            <DollarSign className="h-6 w-6" />
            <span>Earnings</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate('/agent/profile')}
          >
            <User className="h-6 w-6" />
            <span>Profile</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
