import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DropeeService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  price: string;
  active: boolean;
  display_order: number;
  service_area_id: string | null;
}

interface ServiceArea {
  id: string;
  name: string;
}

const iconOptions = [
  'UtensilsCrossed',
  'ShoppingBasket',
  'FileText',
  'Package',
  'Truck',
  'Bike',
  'Car',
  'Gift',
  'Box',
  'ShoppingCart',
  'Coffee',
  'Pill',
  'Newspaper',
  'Mail',
];

const emptyService = {
  name: '',
  slug: '',
  description: '',
  icon: 'Package',
  price: '',
  active: true,
  display_order: 0,
  service_area_id: '',
};

export default function AdminServices() {
  const [services, setServices] = useState<DropeeService[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<DropeeService | null>(null);
  const [formData, setFormData] = useState(emptyService);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchServiceAreas();
  }, []);

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from('dropee_services')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('Failed to load services');
    } else {
      setServices(data || []);
    }
    setLoading(false);
  }

  async function fetchServiceAreas() {
    const { data } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('active', true)
      .order('name');
    setServiceAreas(data || []);
  }

  async function handleSave() {
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    setSaving(true);
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

    const serviceData = {
      name: formData.name,
      slug,
      description: formData.description || null,
      icon: formData.icon,
      price: formData.price,
      active: formData.active,
      display_order: formData.display_order,
      service_area_id: formData.service_area_id || null,
    };

    let error;
    if (selectedService) {
      ({ error } = await supabase
        .from('dropee_services')
        .update(serviceData)
        .eq('id', selectedService.id));
    } else {
      ({ error } = await supabase
        .from('dropee_services')
        .insert(serviceData));
    }

    if (error) {
      toast.error('Failed to save service');
    } else {
      toast.success(selectedService ? 'Service updated' : 'Service created');
      setDialogOpen(false);
      fetchServices();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedService) return;

    const { error } = await supabase
      .from('dropee_services')
      .delete()
      .eq('id', selectedService.id);

    if (error) {
      toast.error('Failed to delete service');
    } else {
      toast.success('Service deleted');
      setDeleteDialogOpen(false);
      fetchServices();
    }
  }

  function openCreateDialog() {
    setSelectedService(null);
    setFormData(emptyService);
    setDialogOpen(true);
  }

  function openEditDialog(service: DropeeService) {
    setSelectedService(service);
    setFormData({
      name: service.name,
      slug: service.slug,
      description: service.description || '',
      icon: service.icon,
      price: service.price,
      active: service.active,
      display_order: service.display_order,
      service_area_id: service.service_area_id || '',
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(service: DropeeService) {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (service: DropeeService) => (
        <div>
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-muted-foreground">{service.slug}</p>
        </div>
      ),
    },
    {
      key: 'icon',
      header: 'Icon',
      cell: (service: DropeeService) => (
        <Badge variant="outline">{service.icon}</Badge>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      cell: (service: DropeeService) => service.price,
    },
    {
      key: 'display_order',
      header: 'Order',
      cell: (service: DropeeService) => service.display_order,
    },
    {
      key: 'active',
      header: 'Status',
      cell: (service: DropeeService) => (
        <Badge variant={service.active ? 'default' : 'secondary'}>
          {service.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Dropee Services">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>

        <AdminDataTable
          data={services}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search services..."
          loading={loading}
          actions={(service) => (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(service)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(service)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? 'Edit Service' : 'Add Service'}
            </DialogTitle>
            <DialogDescription>
              {selectedService
                ? 'Update the service details below.'
                : 'Fill in the details to create a new service.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Service name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Service description"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon *</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="e.g., Starting from ₹30"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_area">Service Area</Label>
                <Select
                  value={formData.service_area_id || "all"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, service_area_id: value === "all" ? "" : value })
                  }
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

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.price}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedService?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
