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

type CategoryType = 'business' | 'product' | 'place' | 'event';

interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  active: boolean | null;
}

const emptyCategory = {
  name: '',
  slug: '',
  type: 'business' as CategoryType,
  icon: '',
  color: '',
  active: true,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(emptyCategory);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type')
      .order('name');

    if (error) {
      toast.error('Failed to load categories');
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (selectedCategory) {
      const { error } = await supabase
        .from('categories')
        .update({ ...formData, slug })
        .eq('id', selectedCategory.id);

      if (error) {
        toast.error('Failed to update category');
      } else {
        toast.success('Category updated');
        setDialogOpen(false);
        fetchCategories();
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert({ ...formData, slug });

      if (error) {
        toast.error('Failed to create category');
      } else {
        toast.success('Category created');
        setDialogOpen(false);
        fetchCategories();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedCategory) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', selectedCategory.id);

    if (error) {
      toast.error('Failed to delete category');
    } else {
      toast.success('Category deleted');
      setDeleteDialogOpen(false);
      fetchCategories();
    }
  }

  async function toggleActive(category: Category) {
    const { error } = await supabase
      .from('categories')
      .update({ active: !category.active })
      .eq('id', category.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      fetchCategories();
    }
  }

  function openEditDialog(category: Category) {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      type: category.type,
      icon: category.icon || '',
      color: category.color || '',
      active: category.active ?? true,
    });
    setDialogOpen(true);
  }

  const getTypeBadgeColor = (type: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const colors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      business: 'default',
      product: 'secondary',
      place: 'outline',
      event: 'destructive',
    };
    return colors[type] || 'default';
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.color && (
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          )}
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (item) => <Badge variant={getTypeBadgeColor(item.type)}>{item.type}</Badge>,
    },
    {
      key: 'icon',
      header: 'Icon',
      cell: (item) => <span className="text-muted-foreground">{item.icon || 'None'}</span>,
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
    <AdminLayout title="Categories" description="Manage categories for businesses, places, and events">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setFormData(emptyCategory);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <AdminDataTable
          data={categories}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search categories..."
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
                  setSelectedCategory(item);
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
            <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
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

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as CategoryType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="place">Place</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., Store"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color || '#000000'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This may affect items using this category.
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
