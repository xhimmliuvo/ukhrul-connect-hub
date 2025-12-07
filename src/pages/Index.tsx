import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceAreaContext } from '@/contexts/ServiceAreaContext';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { LocationSelector } from '@/components/LocationSelector';
import { BusinessCard } from '@/components/BusinessCard';
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
  LogIn,
  User,
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
  categories: {
    name: string;
    color: string | null;
  } | null;
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { currentArea, loading: areaLoading, geoStatus, detectLocation } = useServiceAreaContext();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  // Show location selector if no area selected after initial load
  useEffect(() => {
    if (!areaLoading && !currentArea && geoStatus === 'idle') {
      detectLocation();
    }
  }, [areaLoading, currentArea, geoStatus, detectLocation]);

  // Show manual selector if geolocation fails
  useEffect(() => {
    if (geoStatus === 'denied' || geoStatus === 'error') {
      setShowLocationSelector(true);
    }
  }, [geoStatus]);

  // Fetch businesses for current area
  useEffect(() => {
    async function fetchBusinesses() {
      setLoadingBusinesses(true);
      
      let query = supabase
        .from('businesses')
        .select(`
          id, name, slug, short_description, cover_image,
          rating, review_count, verified, featured, address,
          categories (name, color)
        `)
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(6);

      if (currentArea) {
        query = query.eq('service_area_id', currentArea.id);
      }

      const { data } = await query;
      setBusinesses(data || []);
      setLoadingBusinesses(false);
    }

    fetchBusinesses();
  }, [currentArea]);

  if (authLoading || areaLoading) {
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
      {/* Location Banner */}
      <LocationBanner />

      {/* Location Selector Dialog */}
      <LocationSelector 
        open={showLocationSelector} 
        onOpenChange={setShowLocationSelector} 
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Header with Auth */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Discover Ukhrul
            </h1>
            <p className="text-muted-foreground text-sm">
              Shop, Explore & Travel Locally
            </p>
          </div>
          {user ? (
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <Link to="/businesses">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search businesses, products, places..."
              className="pl-10 h-12 bg-secondary border-0"
              readOnly
            />
          </div>
        </Link>

        {/* Quick Actions */}
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

        {/* Current Location Info */}
        {currentArea && (
          <Card className="bg-secondary/50 border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Showing results for {currentArea.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentArea.radius_km}km service radius
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
            <h2 className="text-lg font-semibold text-foreground">Near You</h2>
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
                <p className="text-muted-foreground">No businesses in this area yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try selecting a different location
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {businesses.slice(0, 4).map((business) => (
                <BusinessCard 
                  key={business.id} 
                  business={business} 
                  variant="compact"
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
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </section>
        )}

        {/* Placeholder sections */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Tourist Places</h2>
            <Button variant="link" size="sm" className="text-primary">
              View all
            </Button>
          </div>
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Mountain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Coming soon</p>
              <p className="text-sm text-muted-foreground mt-1">
                Discover waterfalls, peaks, and cultural sites
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
            <Link to="/events">
              <Button variant="link" size="sm" className="text-primary">
                View all
              </Button>
            </Link>
          </div>
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming events</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back for festivals and community events
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
