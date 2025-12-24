import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  page_placement: string;
  banner_type: string;
  display_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

const emptyBanner = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  link_text: 'Learn More',
  page_placement: 'explore',
  banner_type: 'featured',
  display_order: 0,
  is_active: true,
  starts_at: '',
  ends_at: '',
};

const pagePlacements = [
  { value: 'explore', label: 'Explore Page' },
  { value: 'places', label: 'Places Page' },
  { value: 'events', label: 'Events Page' },
  { value: 'businesses', label: 'Businesses Page' },
];

const bannerTypes = [
  { value: 'featured', label: 'Featured' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'announcement', label: 'Announcement' },
];

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState(emptyBanner);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>('all');

  useEffect(() => {
    fetchBanners();
  }, [selectedPage]);

  async function fetchBanners() {
    let query = supabase
      .from('promotional_banners')
      .select('*')
      .order('display_order');

    if (selectedPage !== 'all') {
      query = query.eq('page_placement', selectedPage);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load banners');
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);

    const bannerData = {
      ...formData,
      starts_at: formData.starts_at || null,
      ends_at: formData.ends_at || null,
    };

    if (selectedBanner) {
      const { error } = await supabase
        .from('promotional_banners')
        .update(bannerData)
        .eq('id', selectedBanner.id);

      if (error) {
        toast.error('Failed to update banner');
      } else {
        toast.success('Banner updated');
        setDialogOpen(false);
        fetchBanners();
      }
    } else {
      const { error } = await supabase
        .from('promotional_banners')
        .insert(bannerData);

      if (error) {
        toast.error('Failed to create banner');
      } else {
        toast.success('Banner created');
        setDialogOpen(false);
        fetchBanners();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedBanner) return;

    const { error } = await supabase
      .from('promotional_banners')
      .delete()
      .eq('id', selectedBanner.id);

    if (error) {
      toast.error('Failed to delete banner');
    } else {
      toast.success('Banner deleted');
      setDeleteDialogOpen(false);
      fetchBanners();
    }
  }

  async function toggleActive(banner: Banner) {
    const { error } = await supabase
      .from('promotional_banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      fetchBanners();
    }
  }

  async function handleReorder(banner: Banner, direction: 'up' | 'down') {
    const currentIndex = banners.findIndex((b) => b.id === banner.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const targetBanner = banners[targetIndex];

    await Promise.all([
      supabase
        .from('promotional_banners')
        .update({ display_order: targetBanner.display_order })
        .eq('id', banner.id),
      supabase
        .from('promotional_banners')
        .update({ display_order: banner.display_order })
        .eq('id', targetBanner.id),
    ]);

    fetchBanners();
  }

  function openEditDialog(banner: Banner) {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      link_text: banner.link_text || 'Learn More',
      page_placement: banner.page_placement,
      banner_type: banner.banner_type,
      display_order: banner.display_order,
      is_active: banner.is_active,
      starts_at: banner.starts_at ? banner.starts_at.split('T')[0] : '',
      ends_at: banner.ends_at ? banner.ends_at.split('T')[0] : '',
    });
    setDialogOpen(true);
  }

  return (
    <AdminLayout title="Banners" description="Manage promotional banners across pages">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              {pagePlacements.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              setSelectedBanner(null);
              setFormData(emptyBanner);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Banner
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">No banners found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, index) => (
              <Card key={banner.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  {banner.image_url && (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="h-16 w-24 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{banner.title}</p>
                      <Badge variant="outline">{banner.page_placement}</Badge>
                      <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {banner.subtitle && (
                      <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReorder(banner, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReorder(banner, 'down')}
                      disabled={index === banners.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(banner)}>
                      {banner.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(banner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedBanner(banner);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                rows={2}
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="page_placement">Page Placement *</Label>
                <Select
                  value={formData.page_placement}
                  onValueChange={(value) => setFormData({ ...formData, page_placement: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pagePlacements.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner_type">Banner Type</Label>
                <Select
                  value={formData.banner_type}
                  onValueChange={(value) => setFormData({ ...formData, banner_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bannerTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="link_url">Link URL</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link_text">Link Text</Label>
                <Input
                  id="link_text"
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Starts At</Label>
                <Input
                  id="starts_at"
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Ends At</Label>
                <Input
                  id="ends_at"
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.title}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBanner?.title}"? This action cannot be undone.
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
