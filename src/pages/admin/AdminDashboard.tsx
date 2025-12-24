import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Calendar, Users, ShoppingBag, MessageSquare, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStats } from '@/components/admin/AdminStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  businesses: number;
  places: number;
  events: number;
  users: number;
  orders: number;
  reviews: number;
}

interface RecentOrder {
  id: string;
  business_name: string;
  order_type: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    businesses: 0,
    places: 0,
    events: 0,
    users: 0,
    orders: 0,
    reviews: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [businesses, places, events, profiles, orders, reviews] = await Promise.all([
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('places').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('dropee_orders').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        businesses: businesses.count || 0,
        places: places.count || 0,
        events: events.count || 0,
        users: profiles.count || 0,
        orders: orders.count || 0,
        reviews: reviews.count || 0,
      });

      const { data: ordersData } = await supabase
        .from('dropee_orders')
        .select('id, business_name, order_type, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(ordersData || []);
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statsConfig = [
    { title: 'Total Businesses', value: stats.businesses, icon: Store },
    { title: 'Total Places', value: stats.places, icon: MapPin },
    { title: 'Total Events', value: stats.events, icon: Calendar },
    { title: 'Total Users', value: stats.users, icon: Users },
  ];

  const quickLinks = [
    { label: 'Manage Businesses', path: '/admin/businesses', icon: Store },
    { label: 'Manage Places', path: '/admin/places', icon: MapPin },
    { label: 'Manage Events', path: '/admin/events', icon: Calendar },
    { label: 'View Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Moderate Reviews', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Manage Users', path: '/admin/users', icon: Users },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <AdminLayout title="Dashboard" description="Overview of your platform">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AdminStats stats={statsConfig} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Orders</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/orders">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">{order.business_name}</p>
                          <p className="text-sm text-muted-foreground">{order.order_type}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quickLinks.map((link) => (
                    <Button
                      key={link.path}
                      variant="outline"
                      className="justify-start"
                      asChild
                    >
                      <Link to={link.path}>
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
