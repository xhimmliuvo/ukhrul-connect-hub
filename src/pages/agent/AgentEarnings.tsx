import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { format, startOfWeek, startOfMonth, subDays } from 'date-fns';

interface EarningEntry {
  id: string;
  total_fee: number;
  agent_adjusted_fee: number | null;
  delivery_time: string;
  pickup_address: string;
  delivery_address: string;
}

interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  total: number;
  deliveriesToday: number;
  deliveriesWeek: number;
  deliveriesMonth: number;
}

export default function AgentEarnings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAgent, loading: rolesLoading } = useUserRoles();
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    today: 0, week: 0, month: 0, total: 0,
    deliveriesToday: 0, deliveriesWeek: 0, deliveriesMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    if (!rolesLoading && !isAgent) {
      navigate('/');
      return;
    }
    if (user && isAgent) {
      fetchEarnings();
    }
  }, [user, isAgent, rolesLoading, period]);

  async function fetchEarnings() {
    if (!user) return;
    setLoading(true);

    // Get agent id
    const { data: agentData } = await supabase
      .from('delivery_agents')
      .select('id, total_earnings')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      setLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = startOfWeek(today);
    const monthStart = startOfMonth(today);

    // Fetch all completed orders
    const { data: orders } = await supabase
      .from('delivery_orders')
      .select('id, total_fee, agent_adjusted_fee, delivery_time, pickup_address, delivery_address')
      .eq('assigned_agent_id', agentData.id)
      .eq('status', 'delivered')
      .not('delivery_time', 'is', null)
      .order('delivery_time', { ascending: false });

    if (orders) {
      // Calculate summaries
      let todayEarnings = 0, weekEarnings = 0, monthEarnings = 0;
      let todayCount = 0, weekCount = 0, monthCount = 0;

      orders.forEach(order => {
        const fee = order.agent_adjusted_fee || order.total_fee || 0;
        const deliveryDate = new Date(order.delivery_time);

        if (deliveryDate >= today) {
          todayEarnings += fee;
          todayCount++;
        }
        if (deliveryDate >= weekStart) {
          weekEarnings += fee;
          weekCount++;
        }
        if (deliveryDate >= monthStart) {
          monthEarnings += fee;
          monthCount++;
        }
      });

      setSummary({
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        total: agentData.total_earnings || 0,
        deliveriesToday: todayCount,
        deliveriesWeek: weekCount,
        deliveriesMonth: monthCount,
      });

      // Filter orders based on period
      let filteredOrders = orders;
      if (period === 'today') {
        filteredOrders = orders.filter(o => new Date(o.delivery_time) >= today);
      } else if (period === 'week') {
        filteredOrders = orders.filter(o => new Date(o.delivery_time) >= weekStart);
      } else if (period === 'month') {
        filteredOrders = orders.filter(o => new Date(o.delivery_time) >= monthStart);
      }

      setEarnings(filteredOrders as EarningEntry[]);
    }

    setLoading(false);
  }

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
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
          <h1 className="font-bold text-lg">Earnings</h1>
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Today</span>
              </div>
              <p className="text-2xl font-bold text-foreground">₹{summary.today}</p>
              <p className="text-xs text-muted-foreground">{summary.deliveriesToday} deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">This Week</span>
              </div>
              <p className="text-2xl font-bold text-foreground">₹{summary.week}</p>
              <p className="text-xs text-muted-foreground">{summary.deliveriesWeek} deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">This Month</span>
              </div>
              <p className="text-2xl font-bold text-foreground">₹{summary.month}</p>
              <p className="text-xs text-muted-foreground">{summary.deliveriesMonth} deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-sm">All Time</span>
              </div>
              <p className="text-2xl font-bold text-primary">₹{summary.total.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Period Tabs */}
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="w-full">
            <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
            <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
            <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Earnings List */}
        <div className="space-y-2">
          {earnings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No earnings for this period</p>
              </CardContent>
            </Card>
          ) : (
            earnings.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.pickup_address} → {entry.delivery_address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.delivery_time), 'dd MMM, h:mm a')}
                      </p>
                    </div>
                    <p className="font-bold text-primary ml-2">
                      ₹{entry.agent_adjusted_fee || entry.total_fee}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
