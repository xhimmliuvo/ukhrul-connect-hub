import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react';
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

interface Place {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  category_id: string | null;
  active: boolean | null;
  featured: boolean | null;
  rating: number | null;
  review_count: number | null;
}

interface Category {
  id: string;
  name: string;
}

const emptyPlace = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category_id: '',
  address: '',
  cover_image: '',
  best_time_to_visit: '',
  difficulty_level: '',
  tips: '',
  entry_fee: 0,
  active: true,
  featured: false,
};

export default function AdminPlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState(emptyPlace);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlaces();
    fetchCategories();
  }, []);

  async function fetchPlaces() {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, slug, short_description, category_id, active, featured, rating, review_count')
      .order('name');

    if (error) {
      toast.error('Failed to load places');
    } else {
      setPlaces(data || []);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'place')
      .order('name');
    setCategories(data || []);
  }

  async function handleSave() {
    setSaving(true);
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (selectedPlace) {
      const { error } = await supabase
        .from('places')
        .update({ ...formData, slug })
        .eq('id', selectedPlace.id);

      if (error) {
        toast.error('Failed to update place');
      } else {
        toast.success('Place updated');
        setDialogOpen(false);
        fetchPlaces();
      }
    } else {
      const { error } = await supabase
        .from('places')
        .insert({ ...formData, slug });

      if (error) {
        toast.error('Failed to create place');
      } else {
        toast.success('Place created');
        setDialogOpen(false);
        fetchPlaces();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedPlace) return;

    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', selectedPlace.id);

    if (error) {
      toast.error('Failed to delete place');
    } else {
      toast.success('Place deleted');
      setDeleteDialogOpen(false);
      fetchPlaces();
    }
  }

  async function toggleActive(place: Place) {
    const { error } = await supabase
      .from('places')
      .update({ active: !place.active })
      .eq('id', place.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      fetchPlaces();
    }
  }

  async function toggleFeatured(place: Place) {
    const { error } = await supabase
      .from('places')
      .update({ featured: !place.featured })
      .eq('id', place.id);

    if (error) {
      toast.error('Failed to update featured status');
    } else {
      fetchPlaces();
    }
  }

  function openEditDialog(place: Place) {
    setSelectedPlace(place);
    supabase
      .from('places')
      .select('*')
      .eq('id', place.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            short_description: data.short_description || '',
            description: data.description || '',
            category_id: data.category_id || '',
            address: data.address || '',
            cover_image: data.cover_image || '',
            best_time_to_visit: data.best_time_to_visit || '',
            difficulty_level: data.difficulty_level || '',
            tips: data.tips || '',
            entry_fee: data.entry_fee || 0,
            active: data.active ?? true,
            featured: data.featured ?? false,
          });
          setDialogOpen(true);
        }
      });
  }

  const columns: Column<Place>[] = [
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
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Places" description="Manage tourist places and attractions">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setSelectedPlace(null);
              setFormData(emptyPlace);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Place
          </Button>
        </div>

        <AdminDataTable
          data={places}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search places..."
          loading={loading}
          actions={(item) => (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleActive(item)}
              >
                {item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => toggleFeatured(item)}>
                <Star className={`h-4 w-4 ${item.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedPlace(item);
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
            <DialogTitle>{selectedPlace ? 'Edit Place' : 'Add Place'}</DialogTitle>
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
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="difficult">Difficult</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="best_time">Best Time to Visit</Label>
                <Input
                  id="best_time"
                  value={formData.best_time_to_visit}
                  onChange={(e) => setFormData({ ...formData, best_time_to_visit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry_fee">Entry Fee</Label>
                <Input
                  id="entry_fee"
                  type="number"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tips">Tips</Label>
              <Textarea
                id="tips"
                rows={3}
                value={formData.tips}
                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover Image URL</Label>
              <Input
                id="cover_image"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            <AlertDialogTitle>Delete Place</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPlace?.name}"? This action cannot be undone.
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
