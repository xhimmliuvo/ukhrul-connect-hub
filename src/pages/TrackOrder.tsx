import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { OrderStatusTimeline } from '@/components/tracking/OrderStatusTimeline';
import { AgentInfoCard } from '@/components/tracking/AgentInfoCard';
import { LiveLocationCard } from '@/components/tracking/LiveLocationCard';
import { format } from 'date-fns';

export default function TrackOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { order, agent, latestLocation, loading, error, refetch } = useOrderTracking(orderId || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded bg-primary-foreground/20" />
            <Skeleton className="h-6 w-40 bg-primary-foreground/20" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground"
              onClick={() => navigate('/orders')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Track Order</h1>
          </div>
        </div>
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="font-semibold text-lg mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-4">
                {error || "We couldn't find this order. It may have been deleted or you don't have permission to view it."}
              </p>
              <Button onClick={() => navigate('/orders')}>
                Go to My Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const orderNumber = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/orders">
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Track Order</h1>
              <p className="text-xs text-primary-foreground/80">#{orderNumber}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground"
            onClick={refetch}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* Status Badge */}
        {isDelivered && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Delivered!</p>
                {order.delivery_time && (
                  <p className="text-sm text-green-600">
                    {format(new Date(order.delivery_time), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isCancelled && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-10 w-10 text-red-500" />
              <div>
                <p className="font-semibold text-red-800">Order Cancelled</p>
                <p className="text-sm text-red-600">This order has been cancelled</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        <Card>
          <CardContent className="p-4">
            <OrderStatusTimeline 
              status={order.status}
              pickupTime={order.pickup_time}
              deliveryTime={order.delivery_time}
            />
          </CardContent>
        </Card>

        {/* Agent Info */}
        {agent && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">Your Agent</h3>
            <AgentInfoCard agent={agent} />
          </div>
        )}

        {!agent && order.status === 'pending' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <div>
                  <p className="font-medium text-foreground">Waiting for agent</p>
                  <p className="text-sm">An agent will be assigned soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Location */}
        {agent && !isDelivered && !isCancelled && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">Live Location</h3>
            <LiveLocationCard 
              location={latestLocation}
              pickupAddress={order.pickup_address}
              deliveryAddress={order.delivery_address}
            />
          </div>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Fee</span>
              <span className="font-bold text-lg">
                ₹{order.agent_adjusted_fee || order.total_fee}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">PICKUP</p>
                  <p>{order.pickup_address}</p>
                  <p className="text-muted-foreground">{order.pickup_contact_name}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">DELIVERY</p>
                  <p>{order.delivery_address}</p>
                  <p className="text-muted-foreground">{order.delivery_contact_name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Badge variant="outline">{order.distance_km?.toFixed(1)} km</Badge>
              <Badge variant="outline">{order.weight_kg} kg</Badge>
              {order.is_fragile && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Fragile
                </Badge>
              )}
            </div>

            {order.package_description && (
              <p className="text-sm text-muted-foreground pt-2 border-t">
                {order.package_description}
              </p>
            )}

            <p className="text-xs text-muted-foreground pt-2 border-t">
              Ordered on {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
