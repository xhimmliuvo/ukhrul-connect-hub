import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { EventCard } from '@/components/EventCard';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  service_areas: { name: string } | null;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select('id, name, slug, short_description, cover_image, event_date, start_time, venue, featured, entry_fee, service_areas (name)')
        .eq('active', true)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
      }

      setEvents((data as any) || []);
      setLoading(false);
    }

    fetchEvents();
  }, []);

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

  const featuredUpcoming = filteredUpcoming.filter(e => e.featured);
  const regularUpcoming = filteredUpcoming.filter(e => !e.featured);

  const renderEmptyState = (message: string, sub: string) => (
    <Card className="border-dashed border-border/50 bg-card/50">
      <CardContent className="p-12 flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-2xl bg-muted mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{sub}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Events</h1>
          <Button variant="outline" size="icon" className="rounded-xl">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Sticky glass search */}
        <div className="sticky top-12 z-40">
          <div className="glass rounded-2xl p-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card border-0 rounded-xl text-base shadow-none"
              />
            </div>
          </div>
        </div>

        <PromotionalBanner page="events" />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border/50">
                <Skeleton className="h-20 w-20 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <Skeleton className="h-3 w-1/3 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl h-11 p-1 bg-muted/60">
              <TabsTrigger value="upcoming" className="rounded-lg font-semibold text-sm">
                Upcoming ({filteredUpcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-lg font-semibold text-sm">
                Past ({filteredPast.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-5 space-y-6">
              {filteredUpcoming.length === 0 ? (
                renderEmptyState('No upcoming events', 'Check back soon for festivals, markets, and community events.')
              ) : (
                <>
                  {featuredUpcoming.length > 0 && (
                    <section className="space-y-4">
                      <h2 className="text-lg font-bold text-foreground">Featured</h2>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                        {featuredUpcoming.map((event) => (
                          <div key={event.id} className="min-w-[300px] max-w-[340px] flex-shrink-0">
                            <EventCard event={event} locationName={event.service_areas?.name} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground">All Upcoming</h2>
                    <div className="space-y-3">
                      {regularUpcoming.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          locationName={event.service_areas?.name}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-5 space-y-4">
              {filteredPast.length === 0 ? (
                renderEmptyState('No past events', 'Past events will appear here.')
              ) : (
                <div className="space-y-3">
                  {filteredPast.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      locationName={event.service_areas?.name}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
