import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useServiceAreaContext } from '@/contexts/ServiceAreaContext';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { EventCard } from '@/components/EventCard';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  cover_image: string | null;
  event_date: string;
  start_time: string | null;
  venue: string | null;
  featured: boolean;
  entry_fee: number | null;
}

export default function Events() {
  const { currentArea } = useServiceAreaContext();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      
      let query = supabase
        .from('events')
        .select('id, name, slug, short_description, cover_image, event_date, start_time, venue, featured, entry_fee')
        .eq('active', true)
        .order('event_date', { ascending: true });

      if (currentArea) {
        query = query.eq('service_area_id', currentArea.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
      }

      setEvents(data || []);
      setLoading(false);
    }

    fetchEvents();
  }, [currentArea]);

  const today = new Date().toISOString().split('T')[0];
  
  const upcomingEvents = events.filter(e => e.event_date >= today);
  const pastEvents = events.filter(e => e.event_date < today);

  const filteredUpcoming = upcomingEvents.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPast = pastEvents.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Events</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-secondary border-0"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">
                Upcoming ({filteredUpcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({filteredPast.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4 space-y-4">
              {filteredUpcoming.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No upcoming events
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Check back soon for festivals, markets, and community events in your area.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredUpcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4 space-y-4">
              {filteredPast.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No past events
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Past events will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredPast.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
