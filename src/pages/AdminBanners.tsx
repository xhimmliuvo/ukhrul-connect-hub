import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, GripVertical, Edit, Loader2 } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  banner_type: 'featured' | 'ad' | 'event';
  page_placement: 'explore' | 'places' | 'events' | 'all';
  display_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

const emptyBanner: Omit<Banner, 'id'> = {
  title: '',
  subtitle: null,
  image_url: null,
  link_url: null,
  link_text: 'Learn More',
  banner_type: 'featured',
  page_placement: 'explore',
  display_order: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
};

export default function AdminBanners() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<Omit<Banner, 'id'>>(emptyBanner);
  const [selectedPage, setSelectedPage] = useState<string>('all');

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!data) {
        toast({ title: 'Access denied', description: 'Admin privileges required', variant: 'destructive' });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    }

    checkAdmin();
  }, [user, navigate, toast]);

  // Fetch banners
  useEffect(() => {
    if (!isAdmin) return;

    async function fetchBanners() {
      let query = supabase
        .from('promotional_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (selectedPage !== 'all') {
        query = query.or(`page_placement.eq.${selectedPage},page_placement.eq.all`);
      }

      const { data, error } = await query;

      if (error) {
        toast({ title: 'Error', description: 'Failed to fetch banners', variant: 'destructive' });
      } else {
        setBanners(data as Banner[]);
      }
      setLoading(false);
    }

    fetchBanners();
  }, [isAdmin, selectedPage, toast]);

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle,
        image_url: banner.image_url,
        link_url: banner.link_url,
        link_text: banner.link_text,
        banner_type: banner.banner_type,
        page_placement: banner.page_placement,
        display_order: banner.display_order,
        is_active: banner.is_active,
        starts_at: banner.starts_at,
        ends_at: banner.ends_at,
      });
    } else {
      setEditingBanner(null);
      setFormData({ ...emptyBanner, display_order: banners.length });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      if (editingBanner) {
        const { error } = await supabase
          .from('promotional_banners')
          .update(formData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        setBanners(banners.map(b => b.id === editingBanner.id ? { ...b, ...formData } : b));
        toast({ title: 'Success', description: 'Banner updated' });
      } else {
        const { data, error } = await supabase
          .from('promotional_banners')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        setBanners([...banners, data as Banner]);
        toast({ title: 'Success', description: 'Banner created' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save banner', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    const { error } = await supabase.from('promotional_banners').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete banner', variant: 'destructive' });
    } else {
      setBanners(banners.filter(b => b.id !== id));
      toast({ title: 'Success', description: 'Banner deleted' });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('promotional_banners')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update banner', variant: 'destructive' });
    } else {
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: isActive } : b));
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex(b => b.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === banners.length - 1)) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newBanners = [...banners];
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];

    // Update display_order for both
    const updates = [
      { id: newBanners[index].id, display_order: index },
      { id: newBanners[newIndex].id, display_order: newIndex },
    ];

    for (const update of updates) {
      await supabase.from('promotional_banners').update({ display_order: update.display_order }).eq('id', update.id);
    }

    setBanners(newBanners.map((b, i) => ({ ...b, display_order: i })));
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Promotional Banners</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters and Add button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              <SelectItem value="explore">Explore</SelectItem>
              <SelectItem value="places">Places</SelectItem>
              <SelectItem value="events">Events</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Banner title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value || null })}
                    placeholder="Optional subtitle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value || null })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="link_url">Link URL</Label>
                    <Input
                      id="link_url"
                      value={formData.link_url || ''}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value || null })}
                      placeholder="/places"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link_text">Link Text</Label>
                    <Input
                      id="link_text"
                      value={formData.link_text || ''}
                      onChange={(e) => setFormData({ ...formData, link_text: e.target.value || null })}
                      placeholder="Learn More"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.banner_type}
                      onValueChange={(value: 'featured' | 'ad' | 'event') => setFormData({ ...formData, banner_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="ad">Sponsored/Ad</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Page Placement</Label>
                    <Select
                      value={formData.page_placement}
                      onValueChange={(value: 'explore' | 'places' | 'events' | 'all') => setFormData({ ...formData, page_placement: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pages</SelectItem>
                        <SelectItem value="explore">Explore Only</SelectItem>
                        <SelectItem value="places">Places Only</SelectItem>
                        <SelectItem value="events">Events Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="starts_at">Starts At</Label>
                    <Input
                      id="starts_at"
                      type="datetime-local"
                      value={formData.starts_at?.slice(0, 16) || ''}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ends_at">Ends At</Label>
                    <Input
                      id="ends_at"
                      type="datetime-local"
                      value={formData.ends_at?.slice(0, 16) || ''}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingBanner ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Banners list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : banners.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No banners found</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, index) => (
              <Card key={banner.id} className={!banner.is_active ? 'opacity-50' : ''}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleReorder(banner.id, 'up')}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleReorder(banner.id, 'down')}
                      disabled={index === banners.length - 1}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </Button>
                  </div>

                  {banner.image_url && (
                    <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {banner.banner_type}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {banner.page_placement}
                      </span>
                    </div>
                    <p className="font-medium text-foreground truncate">{banner.title}</p>
                    {banner.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(checked) => handleToggleActive(banner.id, checked)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(banner)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
