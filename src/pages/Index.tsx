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
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const quickActions = [
  { icon: Store, label: 'Shops', path: '/businesses', gradient: 'gradient-primary' },
  { icon: Mountain, label: 'Places', path: '/places', gradient: 'gradient-primary' },
  { icon: Calendar, label: 'Events', path: '/events', gradient: 'gradient-primary' },
  { icon: Truck, label: 'Dropee', path: '/services', gradient: 'gradient-warm' },
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

function SectionHeader({ title, href, icon: Icon }: { title: string; href: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
      </div>
      <Link to={href}>
        <Button variant="ghost" size="sm" className="text-primary gap-1 font-medium">
          View all
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
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
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 animate-float">
            <MapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Discovering your area...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <LocationBanner />
      <LocationSelector 
        open={showLocationSelector} 
        onOpenChange={setShowLocationSelector} 
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden gradient-hero px-4 pt-8 pb-14">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary-foreground/5 translate-y-1/2 -translate-x-1/4" />
        
        <div className="container mx-auto relative">
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-primary-foreground/80 text-sm font-medium">Welcome to</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground leading-tight tracking-tight">
              Discover<br />Ukhrul
            </h1>
            <p className="text-primary-foreground/70 mt-2 text-sm max-w-xs">
              Shop, explore & travel — your local guide to everything around you.
            </p>
          </div>

          {/* Floating Search Bar */}
          <Link to="/search" className="block mt-6">
            <div className="glass rounded-2xl p-1 shadow-elevated">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search businesses, places, events..."
                  className="pl-12 h-13 bg-card border-0 rounded-xl text-base shadow-none"
                  readOnly
                />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Actions - overlapping hero */}
      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map(({ icon: Icon, label, path, gradient }) => (
            <Link key={path} to={path}>
              <div className="flex flex-col items-center gap-2 card-hover">
                <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-premium`}>
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 pt-8 space-y-10">
        <PromotionalBanner page="explore" />

        {/* Location context */}
        {currentArea && (
          <div className="glass rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">
                {currentArea.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Showing results from all areas
              </p>
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="rounded-xl flex-shrink-0"
              onClick={() => setShowLocationSelector(true)}
            >
              Change
            </Button>
          </div>
        )}

        {/* Businesses Section */}
        <section className="space-y-5 animate-slide-up">
          <SectionHeader title="Businesses" href="/businesses" icon={Store} />
          
          {loadingBusinesses ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <Card className="border-dashed border-2 rounded-2xl">
              <CardContent className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Store className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No businesses yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Featured - horizontal scroll */}
              {businesses.some(b => b.featured) && (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                  {businesses.filter(b => b.featured).map((business) => (
                    <div key={business.id} className="min-w-[280px] max-w-[320px] flex-shrink-0">
                      <BusinessCard 
                        business={business}
                        locationName={business.service_areas?.name}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {businesses.filter(b => !b.featured).slice(0, 4).map((business) => (
                  <BusinessCard 
                    key={business.id} 
                    business={business} 
                    variant="compact"
                    locationName={business.service_areas?.name}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Tourist Places */}
        <section className="space-y-5 animate-slide-up">
          <SectionHeader title="Tourist Places" href="/places" icon={Mountain} />
          
          {loadingPlaces ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                </div>
              ))}
            </div>
          ) : places.length === 0 ? (
            <Card className="border-dashed border-2 rounded-2xl">
              <CardContent className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Mountain className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No places yet</p>
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
        <section className="space-y-5 animate-slide-up">
          <SectionHeader title="Upcoming Events" href="/events" icon={Calendar} />
          
          {loadingEvents ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-2xl">
                  <Skeleton className="h-16 w-16 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card className="border-dashed border-2 rounded-2xl">
              <CardContent className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No upcoming events</p>
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
