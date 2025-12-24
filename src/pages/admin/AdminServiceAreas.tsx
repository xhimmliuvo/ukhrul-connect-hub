import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { toast } from 'sonner';

interface ServiceArea {
  id: string;
  name: string;
  slug: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  active: boolean | null;
}

const emptyServiceArea = {
  name: '',
  slug: '',
  center_lat: 0,
  center_lng: 0,
  radius_km: 5,
  active: true,
};

export default function AdminServiceAreas() {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);
  const [formData, setFormData] = useState(emptyServiceArea);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServiceAreas();
  }, []);

  async function fetchServiceAreas() {
    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to load service areas');
    } else {
      setServiceAreas(data || []);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (selectedArea) {
      const { error } = await supabase
        .from('service_areas')
        .update({ ...formData, slug })
        .eq('id', selectedArea.id);

      if (error) {
        toast.error('Failed to update service area');
      } else {
        toast.success('Service area updated');
        setDialogOpen(false);
        fetchServiceAreas();
      }
    } else {
      const { error } = await supabase
        .from('service_areas')
        .insert({ ...formData, slug });

      if (error) {
        toast.error('Failed to create service area');
      } else {
        toast.success('Service area created');
        setDialogOpen(false);
        fetchServiceAreas();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedArea) return;

    const { error } = await supabase
      .from('service_areas')
      .delete()
      .eq('id', selectedArea.id);

    if (error) {
      toast.error('Failed to delete service area');
    } else {
      toast.success('Service area deleted');
      setDeleteDialogOpen(false);
      fetchServiceAreas();
    }
  }

  async function toggleActive(area: ServiceArea) {
    const { error } = await supabase
      .from('service_areas')
      .update({ active: !area.active })
      .eq('id', area.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      fetchServiceAreas();
    }
  }

  function openEditDialog(area: ServiceArea) {
    setSelectedArea(area);
    setFormData({
      name: area.name,
      slug: area.slug,
      center_lat: area.center_lat,
      center_lng: area.center_lng,
      radius_km: area.radius_km,
      active: area.active ?? true,
    });
    setDialogOpen(true);
  }

  const columns: Column<ServiceArea>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.slug}</p>
        </div>
      ),
    },
    {
      key: 'coordinates',
      header: 'Coordinates',
      cell: (item) => (
        <span className="text-muted-foreground">
          {item.center_lat.toFixed(4)}, {item.center_lng.toFixed(4)}
        </span>
      ),
    },
    {
      key: 'radius',
      header: 'Radius',
      cell: (item) => <span className="text-foreground">{item.radius_km} km</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge variant={item.active ? 'default' : 'secondary'}>
          {item.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Service Areas" description="Manage service areas and coverage zones">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setSelectedArea(null);
              setFormData(emptyServiceArea);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service Area
          </Button>
        </div>

        <AdminDataTable
          data={serviceAreas}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search service areas..."
          loading={loading}
          actions={(item) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => toggleActive(item)}>
                {item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedArea(item);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedArea ? 'Edit Service Area' : 'Add Service Area'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated from name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="center_lat">Center Latitude *</Label>
                <Input
                  id="center_lat"
                  type="number"
                  step="any"
                  value={formData.center_lat}
                  onChange={(e) => setFormData({ ...formData, center_lat: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="center_lng">Center Longitude *</Label>
                <Input
                  id="center_lng"
                  type="number"
                  step="any"
                  value={formData.center_lng}
                  onChange={(e) => setFormData({ ...formData, center_lng: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius_km">Radius (km) *</Label>
              <Input
                id="radius_km"
                type="number"
                value={formData.radius_km}
                onChange={(e) => setFormData({ ...formData, radius_km: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedArea?.name}"? This may affect items in this area.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
