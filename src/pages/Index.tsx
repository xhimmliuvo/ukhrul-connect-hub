import { useState, useEffect } from 'react';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useServiceAreaContext } from '@/contexts/ServiceAreaContext';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { LocationSelector } from '@/components/LocationSelector';
import { BusinessCard } from '@/components/BusinessCard';
import { PlaceCard } from '@/components/PlaceCard';
import { EventCard } from '@/components/EventCard';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, 
  MapPin, 
  Store, 
  Mountain, 
  Calendar, 
  Truck,
  Loader2
} from 'lucide-react';

const quickActions = [
  { icon: Store, label: 'Businesses', path: '/businesses', color: 'bg-primary/10 text-primary' },
  { icon: Mountain, label: 'Places', path: '/places', color: 'bg-primary/10 text-primary' },
  { icon: Calendar, label: 'Events', path: '/events', color: 'bg-primary/10 text-primary' },
  { icon: Truck, label: 'Dropee', path: '/services', color: 'bg-primary/10 text-primary' },
];

interface Business {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  cover_image: string | null;
  rating: number;
  review_count: number;
  verified: boolean;
  featured: boolean;
  address: string | null;
  categories: { name: string; color: string | null } | null;
  service_areas: { name: string } | null;
}

interface Place {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  cover_image: string | null;
  rating: number | null;
  review_count: number | null;
  featured: boolean;
  address: string | null;
  entry_fee: number | null;
  categories: { name: string; color: string | null } | null;
  service_areas: { name: string } | null;
}

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

export default function Index() {
  const { currentArea, loading: areaLoading, geoStatus, detectLocation } = useServiceAreaContext();
  useRealtimeOrders();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (!areaLoading && !currentArea && geoStatus === 'idle') {
      detectLocation();
    }
  }, [areaLoading, currentArea, geoStatus, detectLocation]);

  useEffect(() => {
    if (geoStatus === 'denied' || geoStatus === 'error') {
      setShowLocationSelector(true);
    }
  }, [geoStatus]);

  // Fetch all items globally with location info
  useEffect(() => {
    async function fetchData() {
      setLoadingBusinesses(true);
      setLoadingPlaces(true);
      setLoadingEvents(true);
      
      const businessQuery = supabase
        .from('businesses')
        .select(`
          id, name, slug, short_description, cover_image,
          rating, review_count, verified, featured, address,
          categories (name, color),
          service_areas (name)
        `)
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(6);

      const placeQuery = supabase
        .from('places')
        .select(`
          id, name, slug, short_description, cover_image,
          rating, review_count, featured, address, entry_fee,
          categories (name, color),
          service_areas (name)
        `)
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(4);

      const today = new Date().toISOString().split('T')[0];
      const eventQuery = supabase
        .from('events')
        .select('id, name, slug, short_description, cover_image, event_date, start_time, venue, featured, entry_fee, service_areas (name)')
        .eq('active', true)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(3);

      const [businessRes, placeRes, eventRes] = await Promise.all([
        businessQuery,
        placeQuery,
        eventQuery
      ]);

      setBusinesses((businessRes.data as any) || []);
      setPlaces((placeRes.data as any) || []);
      setEvents((eventRes.data as any) || []);
      setLoadingBusinesses(false);
      setLoadingPlaces(false);
      setLoadingEvents(false);
    }

    fetchData();
  }, []);

  if (areaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />
      <LocationSelector 
        open={showLocationSelector} 
        onOpenChange={setShowLocationSelector} 
      />

      <main className="container mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Discover Ukhrul
          </h1>
          <p className="text-muted-foreground text-sm">
            Shop, Explore & Travel Locally
          </p>
        </div>

        <Link to="/search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search businesses, products, places..."
              className="pl-10 h-12 bg-secondary border-0"
              readOnly
            />
          </div>
        </Link>

        <div className="grid grid-cols-4 gap-3">
          {quickActions.map(({ icon: Icon, label, path, color }) => (
            <Link key={path} to={path}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <PromotionalBanner page="explore" />

        {currentArea && (
          <Card className="bg-secondary/50 border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Your location: {currentArea.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Showing results from all areas
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowLocationSelector(true)}
              >
                Change
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Near You Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Businesses</h2>
            <Link to="/businesses">
              <Button variant="link" size="sm" className="text-primary">
                View all
              </Button>
            </Link>
          </div>
          
          {loadingBusinesses ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No businesses yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {businesses.slice(0, 4).map((business) => (
                <BusinessCard 
                  key={business.id} 
                  business={business} 
                  variant="compact"
                  locationName={business.service_areas?.name}
                />
              ))}
            </div>
          )}
        </section>

        {/* Featured Businesses */}
        {businesses.some(b => b.featured) && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Featured</h2>
            <div className="space-y-4">
              {businesses.filter(b => b.featured).slice(0, 2).map((business) => (
                <BusinessCard 
                  key={business.id} 
                  business={business}
                  locationName={business.service_areas?.name}
                />
              ))}
            </div>
          </section>
        )}

        {/* Tourist Places */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Tourist Places</h2>
            <Link to="/places">
              <Button variant="link" size="sm" className="text-primary">
                View all
              </Button>
            </Link>
          </div>
          
          {loadingPlaces ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : places.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Mountain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No places yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {places.slice(0, 4).map((place) => (
                <PlaceCard 
                  key={place.id} 
                  place={place} 
                  variant="compact"
                  locationName={place.service_areas?.name}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
            <Link to="/events">
              <Button variant="link" size="sm" className="text-primary">
                View all
              </Button>
            </Link>
          </div>
          
          {loadingEvents ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming events</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event}
                  locationName={event.service_areas?.name}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
