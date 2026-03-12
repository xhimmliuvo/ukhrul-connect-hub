import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar, Home, LogOut, Plus, Eye, Edit, Trash2, Users, Image, Bell, BarChart3, Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ManagedEvent {
  id: string;
  event_id: string;
  role: string;
  event: {
    id: string;
    name: string;
    slug: string;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    venue: string | null;
    address: string | null;
    cover_image: string | null;
    description: string | null;
    short_description: string | null;
    entry_fee: number | null;
    active: boolean;
    organizer: string | null;
    organizer_contact: string | null;
  };
}

export default function EventsManagerDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, loading: rolesLoading, isAdmin } = useUserRoles();
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isManager = roles.includes('events_manager') || isAdmin;

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '', slug: '', event_date: '', start_time: '', end_time: '',
    venue: '', address: '', description: '', short_description: '',
    entry_fee: '', organizer: '', organizer_contact: '', cover_image: ''
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '', event_date: '', start_time: '', end_time: '',
    venue: '', address: '', description: '', short_description: '',
    entry_fee: '', organizer: '', organizer_contact: '', cover_image: ''
  });

  useEffect(() => {
    if (!rolesLoading && !isManager) {
      navigate('/');
      return;
    }
    if (user && isManager) fetchManagedEvents();
  }, [user, isManager, rolesLoading]);

  async function fetchManagedEvents() {
    if (isAdmin) {
      // Admins see all events
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) {
        toast.error('Failed to load events');
      } else {
        setEvents((data || []).map(e => ({
          id: e.id,
          event_id: e.id,
          role: 'admin',
          event: e
        })));
      }
    } else {
      const { data, error } = await supabase
        .from('managed_events')
        .select(`
          id, event_id, role,
          event:events (id, name, slug, event_date, start_time, end_time, venue, address, cover_image, description, short_description, entry_fee, active, organizer, organizer_contact)
        `)
        .eq('manager_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load managed events');
      } else {
        setEvents((data || []) as unknown as ManagedEvent[]);
      }
    }
    setLoading(false);
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `events/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('images').upload(fileName, file);
    setUploading(false);
    if (error) {
      toast.error('Image upload failed');
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicUrl;
  }

  async function handleCreate() {
    const slug = createForm.slug || createForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase.from('events').insert({
      name: createForm.name,
      slug,
      event_date: createForm.event_date,
      start_time: createForm.start_time || null,
      end_time: createForm.end_time || null,
      venue: createForm.venue || null,
      address: createForm.address || null,
      description: createForm.description || null,
      short_description: createForm.short_description || null,
      entry_fee: createForm.entry_fee ? parseFloat(createForm.entry_fee) : 0,
      organizer: createForm.organizer || null,
      organizer_contact: createForm.organizer_contact || null,
      cover_image: createForm.cover_image || null,
      manager_id: user!.id,
    }).select().single();

    if (error) {
      toast.error('Failed to create event');
    } else {
      // Link to managed_events if not admin
      if (!isAdmin && data) {
        await supabase.from('managed_events').insert({
          manager_id: user!.id,
          event_id: data.id,
          role: 'creator',
        });
      }
      toast.success('Event created!');
      setCreateOpen(false);
      setCreateForm({ name: '', slug: '', event_date: '', start_time: '', end_time: '', venue: '', address: '', description: '', short_description: '', entry_fee: '', organizer: '', organizer_contact: '', cover_image: '' });
      fetchManagedEvents();
    }
  }

  async function handleUpdate() {
    if (!editingEvent) return;
    const { error } = await supabase.from('events').update({
      name: editForm.name,
      event_date: editForm.event_date,
      start_time: editForm.start_time || null,
      end_time: editForm.end_time || null,
      venue: editForm.venue || null,
      address: editForm.address || null,
      description: editForm.description || null,
      short_description: editForm.short_description || null,
      entry_fee: editForm.entry_fee ? parseFloat(editForm.entry_fee) : 0,
      organizer: editForm.organizer || null,
      organizer_contact: editForm.organizer_contact || null,
      cover_image: editForm.cover_image || null,
    }).eq('id', editingEvent.event.id);

    if (error) {
      toast.error('Failed to update event');
    } else {
      toast.success('Event updated');
      setEditOpen(false);
      fetchManagedEvents();
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const { error } = await supabase.from('events').update({ active: false }).eq('id', eventId);
    if (error) toast.error('Failed to delete');
    else { toast.success('Event removed'); fetchManagedEvents(); }
  }

  async function sendNotification(eventName: string) {
    // Send notification to all users about event update
    const { data: profiles } = await supabase.from('profiles').select('id');
    if (profiles && profiles.length > 0) {
      const notifications = profiles.map(p => ({
        user_id: p.id,
        title: '📅 Event Update',
        body: `${eventName} has been updated. Check it out!`,
        type: 'event_update',
      }));
      await supabase.from('notifications').insert(notifications);
      toast.success('Notifications sent to all users!');
    }
  }

  function openEdit(ev: ManagedEvent) {
    setEditingEvent(ev);
    setEditForm({
      name: ev.event.name,
      event_date: ev.event.event_date,
      start_time: ev.event.start_time || '',
      end_time: ev.event.end_time || '',
      venue: ev.event.venue || '',
      address: ev.event.address || '',
      description: ev.event.description || '',
      short_description: ev.event.short_description || '',
      entry_fee: ev.event.entry_fee?.toString() || '',
      organizer: ev.event.organizer || '',
      organizer_contact: ev.event.organizer_contact || '',
      cover_image: ev.event.cover_image || '',
    });
    setEditOpen(true);
  }

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.event.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event.event_date) < new Date());

  const EventFormFields = ({ form, setForm, onImageUpload }: { form: any; setForm: (f: any) => void; onImageUpload?: (url: string) => void }) => (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <div><Label>Event Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label>Date *</Label><Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
        <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
      </div>
      <div><Label>Venue</Label><Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></div>
      <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
      <div><Label>Short Description</Label><Input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} /></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div><Label>Entry Fee (₹)</Label><Input type="number" value={form.entry_fee} onChange={e => setForm({ ...form, entry_fee: e.target.value })} /></div>
      <div><Label>Organizer</Label><Input value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} /></div>
      <div><Label>Organizer Contact</Label><Input value={form.organizer_contact} onChange={e => setForm({ ...form, organizer_contact: e.target.value })} /></div>
      <div>
        <Label>Cover Image</Label>
        {form.cover_image && <img src={form.cover_image} alt="Cover" className="h-24 w-full object-cover rounded-lg mb-2" />}
        <Input type="file" accept="image/*" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = await uploadImage(file);
            if (url) setForm({ ...form, cover_image: url });
          }
        }} />
        {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Events Manager</h1>
            <p className="text-sm opacity-80">Create, edit & manage events</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate('/admin')}>
                <BarChart3 className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate('/')}>
              <Home className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{upcomingEvents.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{pastEvents.length}</p>
            <p className="text-xs text-muted-foreground">Past</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{events.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
        </div>

        {/* Create Event */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2"><Plus className="h-4 w-4" />Create New Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <EventFormFields form={createForm} setForm={setCreateForm} />
            <Button onClick={handleCreate} disabled={!createForm.name || !createForm.event_date}>Create Event</Button>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
            <EventFormFields form={editForm} setForm={setEditForm} />
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogContent>
        </Dialog>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Upcoming Events</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
            ) : (
              upcomingEvents.map((item) => (
                <div key={item.event.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  {item.event.cover_image ? (
                    <img src={item.event.cover_image} alt={item.event.name} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.event.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(item.event.event_date), 'MMM d, yyyy')}</p>
                    {item.event.venue && <p className="text-xs text-muted-foreground truncate">{item.event.venue}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => sendNotification(item.event.name)}><Bell className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${item.event.slug}`)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.event.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Past Events</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pastEvents.map((item) => (
                <div key={item.event.id} className="flex items-center gap-3 p-3 rounded-lg border border-border opacity-60">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.event.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(item.event.event_date), 'MMM d, yyyy')}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
