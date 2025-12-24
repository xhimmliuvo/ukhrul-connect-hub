import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { format } from 'date-fns';
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

interface Event {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  event_date: string;
  venue: string | null;
  active: boolean | null;
  featured: boolean | null;
}

interface Category {
  id: string;
  name: string;
}

const emptyEvent = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category_id: '',
  event_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  address: '',
  organizer: '',
  organizer_contact: '',
  entry_fee: 0,
  cover_image: '',
  active: true,
  featured: false,
};

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState(emptyEvent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug, short_description, event_date, venue, active, featured')
      .order('event_date', { ascending: false });

    if (error) {
      toast.error('Failed to load events');
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'event')
      .order('name');
    setCategories(data || []);
  }

  async function handleSave() {
    setSaving(true);
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (selectedEvent) {
      const { error } = await supabase
        .from('events')
        .update({ ...formData, slug })
        .eq('id', selectedEvent.id);

      if (error) {
        toast.error('Failed to update event');
      } else {
        toast.success('Event updated');
        setDialogOpen(false);
        fetchEvents();
      }
    } else {
      const { error } = await supabase
        .from('events')
        .insert({ ...formData, slug });

      if (error) {
        toast.error('Failed to create event');
      } else {
        toast.success('Event created');
        setDialogOpen(false);
        fetchEvents();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedEvent) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', selectedEvent.id);

    if (error) {
      toast.error('Failed to delete event');
    } else {
      toast.success('Event deleted');
      setDeleteDialogOpen(false);
      fetchEvents();
    }
  }

  async function toggleActive(event: Event) {
    const { error } = await supabase
      .from('events')
      .update({ active: !event.active })
      .eq('id', event.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      fetchEvents();
    }
  }

  async function toggleFeatured(event: Event) {
    const { error } = await supabase
      .from('events')
      .update({ featured: !event.featured })
      .eq('id', event.id);

    if (error) {
      toast.error('Failed to update featured status');
    } else {
      fetchEvents();
    }
  }

  function openEditDialog(event: Event) {
    setSelectedEvent(event);
    supabase
      .from('events')
      .select('*')
      .eq('id', event.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            short_description: data.short_description || '',
            description: data.description || '',
            category_id: data.category_id || '',
            event_date: data.event_date || '',
            start_time: data.start_time || '',
            end_time: data.end_time || '',
            venue: data.venue || '',
            address: data.address || '',
            organizer: data.organizer || '',
            organizer_contact: data.organizer_contact || '',
            entry_fee: data.entry_fee || 0,
            cover_image: data.cover_image || '',
            active: data.active ?? true,
            featured: data.featured ?? false,
          });
          setDialogOpen(true);
        }
      });
  }

  const columns: Column<Event>[] = [
    {
      key: 'name',
      header: 'Event',
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.venue}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (item) => (
        <span className="text-foreground">
          {item.event_date ? format(new Date(item.event_date), 'MMM d, yyyy') : 'N/A'}
        </span>
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
    <AdminLayout title="Events" description="Manage events and happenings">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setSelectedEvent(null);
              setFormData(emptyEvent);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        <AdminDataTable
          data={events}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search events..."
          loading={loading}
          actions={(item) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => toggleActive(item)}>
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
                  setSelectedEvent(item);
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
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
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
                  placeholder="auto-generated"
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>
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
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizer_contact">Organizer Contact</Label>
                <Input
                  id="organizer_contact"
                  value={formData.organizer_contact}
                  onChange={(e) => setFormData({ ...formData, organizer_contact: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entry_fee">Entry Fee</Label>
                <Input
                  id="entry_fee"
                  type="number"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
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
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.event_date}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.name}"? This action cannot be undone.
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
