import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { BusinessCard } from '@/components/BusinessCard';
import { PlaceCard } from '@/components/PlaceCard';
import { EventCard } from '@/components/EventCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Mountain, Calendar, Search as SearchIcon } from 'lucide-react';

interface SearchResults {
  businesses: any[];
  places: any[];
  events: any[];
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResults>({ businesses: [], places: [], events: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setHasSearched(true);

    const searchPattern = `%${searchQuery}%`;

    // Search all three tables in parallel
    const [businessesRes, placesRes, eventsRes] = await Promise.all([
      supabase
        .from('businesses')
        .select('*, categories(name, color)')
        .eq('active', true)
        .or(`name.ilike.${searchPattern},short_description.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(20),
      supabase
        .from('places')
        .select('*, categories(name, color)')
        .eq('active', true)
        .or(`name.ilike.${searchPattern},short_description.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(20),
      supabase
        .from('events')
        .select('*')
        .eq('active', true)
        .or(`name.ilike.${searchPattern},short_description.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(20),
    ]);

    setResults({
      businesses: businessesRes.data || [],
      places: placesRes.data || [],
      events: eventsRes.data || [],
    });

    setLoading(false);
  };

  const handleSearch = (newQuery: string) => {
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      setSearchParams({});
      setResults({ businesses: [], places: [], events: [] });
      setHasSearched(false);
    }
  };

  const totalResults = results.businesses.length + results.places.length + results.events.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-4">Search</h1>
          <SearchBar 
            defaultValue={query} 
            onSearch={handleSearch} 
            autoFocus={!query}
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : hasSearched ? (
          totalResults === 0 ? (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try searching for something else
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
              </p>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="all" className="text-xs">
                    All ({totalResults})
                  </TabsTrigger>
                  <TabsTrigger value="businesses" className="text-xs">
                    <Store className="h-3 w-3 mr-1" />
                    ({results.businesses.length})
                  </TabsTrigger>
                  <TabsTrigger value="places" className="text-xs">
                    <Mountain className="h-3 w-3 mr-1" />
                    ({results.places.length})
                  </TabsTrigger>
                  <TabsTrigger value="events" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    ({results.events.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6 space-y-6">
                  {results.businesses.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Businesses
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {results.businesses.slice(0, 4).map((business) => (
                          <BusinessCard key={business.id} business={business} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.places.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Mountain className="h-4 w-4" />
                        Places
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {results.places.slice(0, 4).map((place) => (
                          <PlaceCard key={place.id} place={place} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.events.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Events
                      </h3>
                      <div className="space-y-3">
                        {results.events.slice(0, 3).map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="businesses" className="mt-6">
                  {results.businesses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No businesses found</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {results.businesses.map((business) => (
                        <BusinessCard key={business.id} business={business} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="places" className="mt-6">
                  {results.places.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No places found</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {results.places.map((place) => (
                        <PlaceCard key={place.id} place={place} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  {results.events.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No events found</p>
                  ) : (
                    <div className="space-y-3">
                      {results.events.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Search Ukhrul</h3>
            <p className="text-muted-foreground">
              Find businesses, places to visit, and events
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
