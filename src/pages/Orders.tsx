import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  business_name: string;
  business_type: string;
  order_type: string;
  status: string;
  user_contact: string;
  details: any;
  created_at: string;
}

export default function Orders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
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

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('dropee_orders')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'in_progress': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
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

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No orders yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                When you place orders through Dropee, they'll appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
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
      </main>

      <BottomNav />
    </div>
  );
}
