import { useState, useEffect } from 'react';
import { Bike, Car, Footprints, Star, Check, X, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DeliveryAgent {
  id: string;
  user_id: string;
  agent_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  vehicle_type: string;
  is_available: boolean;
  is_verified: boolean;
  is_active: boolean;
  rating: number | null;
  total_deliveries: number;
  total_earnings: number;
  created_at: string;
  agent_availability: {
    status: string;
  } | null;
}

interface ServiceArea {
  id: string;
  name: string;
}

const vehicleIcons: Record<string, React.ElementType> = {
  bike: Bike,
  car: Car,
  foot: Footprints,
};

export default function AdminAgents() {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    vehicle_type: 'bike',
    service_area_id: '',
  });

  useEffect(() => {
    fetchAgents();
    fetchServiceAreas();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_agents')
      .select(`
        *,
        agent_availability (status)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load agents');
    } else {
      setAgents(data || []);
    }
    setLoading(false);
  }

  async function fetchServiceAreas() {
    const { data } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('active', true);
    setServiceAreas(data || []);
  }

  async function toggleVerified(agent: DeliveryAgent) {
    const { error } = await supabase
      .from('delivery_agents')
      .update({ is_verified: !agent.is_verified })
      .eq('id', agent.id);

    if (error) {
      toast.error('Failed to update agent');
    } else {
      toast.success(agent.is_verified ? 'Agent unverified' : 'Agent verified');
      fetchAgents();
    }
  }

  async function toggleActive(agent: DeliveryAgent) {
    const { error } = await supabase
      .from('delivery_agents')
      .update({ is_active: !agent.is_active })
      .eq('id', agent.id);

    if (error) {
      toast.error('Failed to update agent');
    } else {
      toast.success(agent.is_active ? 'Agent deactivated' : 'Agent activated');
      fetchAgents();
    }
  }

  function openCreateDialog() {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      vehicle_type: 'bike',
      service_area_id: '',
    });
    setIsCreating(true);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);

    // For now, we'll show a message that agents need to be created via user role assignment
    toast.info('To create an agent, assign the "agent" role to a user in the Users section.');
    setSaving(false);
    setDialogOpen(false);
  }

  const columns: Column<DeliveryAgent>[] = [
    {
      key: 'agent',
      header: 'Agent',
      cell: (item) => {
        const VehicleIcon = vehicleIcons[item.vehicle_type] || Bike;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {item.full_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{item.full_name}</p>
                <Badge variant="outline" className="text-xs">{item.agent_code}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <VehicleIcon className="h-3 w-3" />
                <span>{item.vehicle_type}</span>
                {item.phone && <span>• {item.phone}</span>}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => {
        const status = item.agent_availability?.status || 'offline';
        const statusColors: Record<string, string> = {
          online: 'bg-green-500',
          busy: 'bg-yellow-500',
          offline: 'bg-muted',
        };
        return (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
            <span className="capitalize text-foreground">{status}</span>
          </div>
        );
      },
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (item) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-foreground">{item.rating?.toFixed(1) || '0.0'}</span>
        </div>
      ),
    },
    {
      key: 'deliveries',
      header: 'Deliveries',
      cell: (item) => (
        <span className="text-foreground">{item.total_deliveries}</span>
      ),
    },
    {
      key: 'earnings',
      header: 'Earnings',
      cell: (item) => (
        <span className="text-foreground font-medium">
          ${item.total_earnings.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'verified',
      header: 'Verified',
      cell: (item) => (
        <Badge variant={item.is_verified ? 'default' : 'secondary'}>
          {item.is_verified ? 'Verified' : 'Unverified'}
        </Badge>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      cell: (item) => (
        <Badge variant={item.is_active ? 'default' : 'destructive'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Delivery Agents" description="Manage delivery agents and their status">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            <Shield className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>

        <AdminDataTable
          data={agents}
          columns={columns}
          searchKey="full_name"
          searchPlaceholder="Search agents..."
          loading={loading}
          actions={(item) => (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleVerified(item)}
                title={item.is_verified ? 'Unverify' : 'Verify'}
              >
                {item.is_verified ? (
                  <X className="h-4 w-4 text-destructive" />
                ) : (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleActive(item)}
                title={item.is_active ? 'Deactivate' : 'Activate'}
              >
                <Shield className={`h-4 w-4 ${item.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Delivery Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              To add a delivery agent, go to <strong>Users</strong> section and assign the <strong>"agent"</strong> role to a user. 
              The system will automatically create their agent profile.
            </p>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Agent's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Motorcycle</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="foot">On Foot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_area">Service Area</Label>
              <Select
                value={formData.service_area_id || "all"}
                onValueChange={(value) => setFormData({ ...formData, service_area_id: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  {serviceAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}