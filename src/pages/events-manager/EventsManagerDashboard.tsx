import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar, Home, LogOut, Plus, Eye
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
    event_date: string;
    venue: string | null;
    cover_image: string | null;
    slug: string;
    active: boolean;
  };
}

export default function EventsManagerDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const isManager = roles.includes('events_manager');

  useEffect(() => {
    if (!rolesLoading && !isManager) {
      navigate('/');
      return;
    }
    if (user && isManager) fetchManagedEvents();
  }, [user, isManager, rolesLoading]);

  async function fetchManagedEvents() {
    const { data, error } = await supabase
      .from('managed_events')
      .select(`
        id, event_id, role,
        event:events (id, name, event_date, venue, cover_image, slug, active)
      `)
      .eq('manager_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      toast.error('Failed to load managed events');
    } else {
      setEvents((data || []) as unknown as ManagedEvent[]);
    }
    setLoading(false);
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Events Manager</h1>
            <p className="text-sm opacity-80">Manage your assigned events</p>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{upcomingEvents.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{events.length}</p>
              <p className="text-xs text-muted-foreground">Total Managed</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming events assigned to you yet.
              </p>
            ) : (
              upcomingEvents.map(({ event }) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  {event.cover_image ? (
                    <img src={event.cover_image} alt={event.name} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </p>
                    {event.venue && (
                      <p className="text-xs text-muted-foreground truncate">{event.venue}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${event.slug}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Past Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pastEvents.map(({ event }) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border border-border opacity-60">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Browse Events */}
        <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/events')}>
          <Calendar className="h-4 w-4" />
          Browse All Events
        </Button>
      </main>
    </div>
  );
}
