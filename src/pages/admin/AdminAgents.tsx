import { useState, useEffect } from 'react';
import { Bike, Car, Footprints, Star, Check, X, Shield, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { ImageUpload } from '@/components/admin/ImageUpload';
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
import { Card, CardContent } from '@/components/ui/card';

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
  service_area_id: string | null;
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
  const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    avatar_url: '',
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

  function openEditDialog(agent: DeliveryAgent) {
    setEditingAgent(agent);
    setFormData({
      full_name: agent.full_name,
      phone: agent.phone || '',
      email: agent.email || '',
      avatar_url: agent.avatar_url || '',
      vehicle_type: agent.vehicle_type,
      service_area_id: agent.service_area_id || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editingAgent) return;
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('delivery_agents')
      .update({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        avatar_url: formData.avatar_url || null,
        vehicle_type: formData.vehicle_type,
        service_area_id: formData.service_area_id || null,
      })
      .eq('id', editingAgent.id);

    if (error) {
      toast.error('Failed to update agent');
      console.error(error);
    } else {
      toast.success('Agent updated');
      fetchAgents();
      setDialogOpen(false);
    }

    setSaving(false);
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
                onClick={() => openEditDialog(item)}
                title="Edit Agent"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleVerified(item)}
                title={item.is_verified ? 'Unverify' : 'Verify'}
              >
                {item.is_verified ? (
                  <X className="h-4 w-4 text-destructive" />
                ) : (
                  <Check className="h-4 w-4 text-primary" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {editingAgent && (
              <>
                {/* Agent Stats Card */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={formData.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {formData.full_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{editingAgent.agent_code}</span>
                          <Badge variant={editingAgent.is_verified ? 'default' : 'secondary'}>
                            {editingAgent.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Deliveries</p>
                            <p className="font-medium text-foreground">{editingAgent.total_deliveries}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Earnings</p>
                            <p className="font-medium text-foreground">₹{editingAgent.total_earnings.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <p className="font-medium text-foreground flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              {editingAgent.rating?.toFixed(1) || '0.0'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Image Upload */}
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <ImageUpload
                    value={formData.avatar_url}
                    onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                    folder="agents"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
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
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="agent@email.com"
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
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}