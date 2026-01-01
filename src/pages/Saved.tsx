import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedItems } from '@/hooks/useSavedItems';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { BusinessCard } from '@/components/BusinessCard';
import { PlaceCard } from '@/components/PlaceCard';
import { EventCard } from '@/components/EventCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Heart, Store, Mountain, Calendar, ShoppingBag, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Saved() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { savedItems, loading: savedLoading } = useSavedItems();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (savedLoading || !user) return;

    async function fetchSavedDetails() {
      setLoading(true);

      const businessIds = savedItems.filter(i => i.item_type === 'business').map(i => i.item_id);
      const placeIds = savedItems.filter(i => i.item_type === 'place').map(i => i.item_id);
      const eventIds = savedItems.filter(i => i.item_type === 'event').map(i => i.item_id);
      const productIds = savedItems.filter(i => i.item_type === 'product').map(i => i.item_id);

      const [businessesRes, placesRes, eventsRes, productsRes] = await Promise.all([
        businessIds.length > 0
          ? supabase.from('businesses').select('*, categories(name, color)').in('id', businessIds)
          : { data: [] },
        placeIds.length > 0
          ? supabase.from('places').select('*, categories(name, color)').in('id', placeIds)
          : { data: [] },
        eventIds.length > 0
          ? supabase.from('events').select('*').in('id', eventIds)
          : { data: [] },
        productIds.length > 0
          ? supabase.from('products').select('*, businesses(name, slug)').in('id', productIds)
          : { data: [] },
      ]);

      setBusinesses(businessesRes.data || []);
      setPlaces(placesRes.data || []);
      setEvents(eventsRes.data || []);
      setProducts(productsRes.data || []);
      setLoading(false);
    }

    fetchSavedDetails();
  }, [savedItems, savedLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isLoading = loading || savedLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Saved Items</h1>

        <Tabs defaultValue="businesses" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="businesses" className="text-xs">
              <Store className="h-4 w-4 mr-1" />
              Shops
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs">
              <ShoppingBag className="h-4 w-4 mr-1" />
              Products
            </TabsTrigger>
            <TabsTrigger value="places" className="text-xs">
              <Mountain className="h-4 w-4 mr-1" />
              Places
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs">
              <Calendar className="h-4 w-4 mr-1" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="mt-6">
            {isLoading ? (
              <LoadingSkeleton />
            ) : businesses.length === 0 ? (
              <EmptyState type="businesses" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {businesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            {isLoading ? (
              <LoadingSkeleton />
            ) : products.length === 0 ? (
              <EmptyState type="products" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="h-24 bg-muted">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-foreground text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.businesses?.name}</p>
                      <p className="text-sm font-semibold text-primary mt-1">₹{product.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="places" className="mt-6">
            {isLoading ? (
              <LoadingSkeleton />
            ) : places.length === 0 ? (
              <EmptyState type="places" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {isLoading ? (
              <LoadingSkeleton />
            ) : events.length === 0 ? (
              <EmptyState type="events" />
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-40 rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No saved {type} yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tap the heart icon on any {type.slice(0, -1)} to save it here for quick access.
        </p>
      </CardContent>
    </Card>
  );
}
