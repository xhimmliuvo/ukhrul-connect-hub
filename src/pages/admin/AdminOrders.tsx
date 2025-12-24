import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface Order {
  id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  order_type: string;
  user_contact: string;
  status: string | null;
  details: Json;
  created_at: string | null;
}

const orderStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('dropee_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  function openOrderDialog(order: Order) {
    setSelectedOrder(order);
    setNewStatus(order.status || 'pending');
    setDialogOpen(true);
  }

  async function handleUpdateStatus() {
    if (!selectedOrder) return;
    setSaving(true);

    const { error } = await supabase
      .from('dropee_orders')
      .update({ status: newStatus })
      .eq('id', selectedOrder.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Order status updated');
      setDialogOpen(false);
      fetchOrders();
    }
    setSaving(false);
  }

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      pending: 'secondary',
      confirmed: 'default',
      processing: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: 'Order',
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground">{item.business_name}</p>
          <p className="text-sm text-muted-foreground">{item.order_type}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (item) => <span className="text-foreground">{item.user_contact}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge variant={getStatusBadgeVariant(item.status || 'pending')}>
          {item.status || 'pending'}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (item) => (
        <span className="text-muted-foreground">
          {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy HH:mm') : 'N/A'}
        </span>
      ),
    },
  ];

  const renderOrderDetails = (details: Json) => {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      return <p className="text-muted-foreground">No details available</p>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-border py-2">
            <span className="font-medium capitalize text-foreground">{key.replace(/_/g, ' ')}:</span>
            <span className="text-muted-foreground">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout title="Orders" description="View and manage customer orders">
      <div className="space-y-4">
        <AdminDataTable
          data={orders}
          columns={columns}
          searchKey="business_name"
          searchPlaceholder="Search orders..."
          loading={loading}
          actions={(item) => (
            <Button variant="ghost" size="icon" onClick={() => openOrderDialog(item)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Business:</span>
                  <span className="text-muted-foreground">{selectedOrder.business_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Type:</span>
                  <span className="text-muted-foreground">{selectedOrder.order_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Contact:</span>
                  <span className="text-muted-foreground">{selectedOrder.user_contact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Date:</span>
                  <span className="text-muted-foreground">
                    {selectedOrder.created_at
                      ? format(new Date(selectedOrder.created_at), 'MMM d, yyyy HH:mm')
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <Label className="mb-2 block">Order Details</Label>
                {renderOrderDetails(selectedOrder.details)}
              </div>

              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        <span className="capitalize">{status}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleUpdateStatus} disabled={saving}>
              {saving ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
