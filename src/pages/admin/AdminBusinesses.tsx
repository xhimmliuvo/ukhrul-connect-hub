import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { ImageUpload } from '@/components/admin/ImageUpload';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface Business {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  category_id: string | null;
  business_type: string | null;
  active: boolean | null;
  featured: boolean | null;
  verified: boolean | null;
  rating: number | null;
  review_count: number | null;
}

interface Category {
  id: string;
  name: string;
}

interface ServiceArea {
  id: string;
  name: string;
}

const emptyBusiness = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category_id: '',
  service_area_id: '',
  business_type: 'product',
  address: '',
  phone: '',
  email: '',
  website: '',
  whatsapp: '',
  cover_image: '',
  active: true,
  featured: false,
  verified: false,
  has_products: false,
  can_take_bookings: false,
};

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState(emptyBusiness);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBusinesses();
    fetchCategories();
    fetchServiceAreas();
  }, []);

  async function fetchBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, slug, short_description, category_id, business_type, active, featured, verified, rating, review_count')
      .order('name');

    if (error) {
      toast.error('Failed to load businesses');
    } else {
      setBusinesses(data || []);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'business')
      .order('name');
    setCategories(data || []);
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
    setSaving(true);
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
    
    if (selectedBusiness) {
      const { error } = await supabase
        .from('businesses')
        .update({ ...formData, slug })
        .eq('id', selectedBusiness.id);

      if (error) {
        toast.error('Failed to update business');
      } else {
        toast.success('Business updated');
        setDialogOpen(false);
        fetchBusinesses();
      }
    } else {
      const { error } = await supabase
        .from('businesses')
        .insert({ ...formData, slug });

      if (error) {
        toast.error('Failed to create business');
      } else {
        toast.success('Business created');
        setDialogOpen(false);
        fetchBusinesses();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedBusiness) return;

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', selectedBusiness.id);

    if (error) {
      toast.error('Failed to delete business');
    } else {
      toast.success('Business deleted');
      setDeleteDialogOpen(false);
      fetchBusinesses();
    }
  }

  async function toggleActive(business: Business) {
    const { error } = await supabase
      .from('businesses')
      .update({ active: !business.active })
      .eq('id', business.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      fetchBusinesses();
    }
  }

  async function toggleFeatured(business: Business) {
    const { error } = await supabase
      .from('businesses')
      .update({ featured: !business.featured })
      .eq('id', business.id);

    if (error) {
      toast.error('Failed to update featured status');
    } else {
      fetchBusinesses();
    }
  }

  function openEditDialog(business: Business) {
    setSelectedBusiness(business);
    supabase
      .from('businesses')
      .select('*')
      .eq('id', business.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            short_description: data.short_description || '',
            description: data.description || '',
            category_id: data.category_id || '',
            service_area_id: data.service_area_id || '',
            business_type: data.business_type || 'product',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            whatsapp: data.whatsapp || '',
            cover_image: data.cover_image || '',
            active: data.active ?? true,
            featured: data.featured ?? false,
            verified: data.verified ?? false,
            has_products: data.has_products ?? false,
            can_take_bookings: data.can_take_bookings ?? false,
          });
          setDialogOpen(true);
        }
      });
  }

  const columns: Column<Business>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.short_description}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (item) => <Badge variant="outline">{item.business_type || 'N/A'}</Badge>,
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (item) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{item.rating?.toFixed(1) || '0.0'}</span>
          <span className="text-muted-foreground">({item.review_count || 0})</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <div className="flex gap-2">
          <Badge variant={item.active ? 'default' : 'secondary'}>
            {item.active ? 'Active' : 'Inactive'}
          </Badge>
          {item.featured && <Badge variant="outline">Featured</Badge>}
          {item.verified && <Badge variant="outline">Verified</Badge>}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Businesses" description="Manage all businesses on the platform">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setSelectedBusiness(null);
              setFormData(emptyBusiness);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Business
          </Button>
        </div>

        <AdminDataTable
          data={businesses}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search businesses..."
          loading={loading}
          actions={(item) => (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleActive(item)}
                title={item.active ? 'Deactivate' : 'Activate'}
              >
                {item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFeatured(item)}
                title={item.featured ? 'Unfeature' : 'Feature'}
              >
                <Star className={`h-4 w-4 ${item.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedBusiness(item);
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBusiness ? 'Edit Business' : 'Add Business'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_area">Service Area *</Label>
                <Select
                  value={formData.service_area_id}
                  onValueChange={(value) => setFormData({ ...formData, service_area_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service area" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Select
                value={formData.business_type}
                onValueChange={(value) => setFormData({ ...formData, business_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <ImageUpload
                value={formData.cover_image}
                onChange={(url) => setFormData({ ...formData, cover_image: url })}
                folder="businesses"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.verified}
                  onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
                />
                <Label>Verified</Label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_products}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_products: checked })}
                />
                <Label>Has Products</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.can_take_bookings}
                  onCheckedChange={(checked) => setFormData({ ...formData, can_take_bookings: checked })}
                />
                <Label>Can Take Bookings</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.service_area_id}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBusiness?.name}"? This action cannot be undone.
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
