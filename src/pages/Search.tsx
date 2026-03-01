import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { BusinessCard } from '@/components/BusinessCard';
import { PlaceCard } from '@/components/PlaceCard';
import { EventCard } from '@/components/EventCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, Mountain, Calendar, Search as SearchIcon, ShoppingBag, Clock, X } from 'lucide-react';

const RECENT_SEARCHES_KEY = 'discover_ukhrul_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch { return []; }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter(s => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

interface SearchResults {
  businesses: any[];
  places: any[];
  events: any[];
  products: any[];
}

// Rank results: exact name match first, then name contains, then description
function rankResults<T extends { name: string; description?: string | null; short_description?: string | null }>(items: T[], query: string): T[] {
  const q = query.toLowerCase();
  return [...items].sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aExact = aName === q ? 0 : aName.includes(q) ? 1 : 2;
    const bExact = bName === q ? 0 : bName.includes(q) ? 1 : 2;
    return aExact - bExact;
  });
}

const quickFilters = [
  { label: 'Restaurants', query: 'restaurant' },
  { label: 'Hotels', query: 'hotel' },
  { label: 'Cafes', query: 'cafe' },
  { label: 'Waterfalls', query: 'waterfall' },
  { label: 'Trekking', query: 'trek' },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResults>({ businesses: [], places: [], events: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setHasSearched(true);
    saveRecentSearch(searchQuery);
    setRecentSearches(getRecentSearches());

    const searchPattern = `%${searchQuery}%`;

    const [businessesRes, placesRes, eventsRes, productsRes] = await Promise.all([
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
      supabase
        .from('products')
        .select('*, businesses!inner(name, slug)')
        .eq('available', true)
        .or(`name.ilike.${searchPattern},description.ilike.${searchPattern},category.ilike.${searchPattern}`)
        .limit(20),
    ]);

    setResults({
      businesses: rankResults(businessesRes.data || [], searchQuery),
      places: rankResults(placesRes.data || [], searchQuery),
      events: rankResults(eventsRes.data || [], searchQuery),
      products: rankResults(productsRes.data || [], searchQuery),
    });

    setLoading(false);
  };

  const handleSearch = (newQuery: string) => {
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      setSearchParams({});
      setResults({ businesses: [], places: [], events: [], products: [] });
      setHasSearched(false);
    }
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const totalResults = results.businesses.length + results.places.length + results.events.length + results.products.length;

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

        {/* Quick Filters */}
        {!hasSearched && (
          <div className="flex gap-2 flex-wrap">
            {quickFilters.map(f => (
              <Badge
                key={f.query}
                variant="secondary"
                className="cursor-pointer hover:bg-accent px-3 py-1.5"
                onClick={() => handleSearch(f.query)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Recent Searches */}
        {!hasSearched && recentSearches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Searches
              </p>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleClearRecent}>
                Clear all
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {recentSearches.map(s => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent px-3 py-1.5"
                  onClick={() => handleSearch(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

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
              <p className="text-muted-foreground">Try searching for something else</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
              </p>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="all" className="text-xs">All ({totalResults})</TabsTrigger>
                  <TabsTrigger value="businesses" className="text-xs">
                    <Store className="h-3 w-3 mr-1" />({results.businesses.length})
                  </TabsTrigger>
                  <TabsTrigger value="products" className="text-xs">
                    <ShoppingBag className="h-3 w-3 mr-1" />({results.products.length})
                  </TabsTrigger>
                  <TabsTrigger value="places" className="text-xs">
                    <Mountain className="h-3 w-3 mr-1" />({results.places.length})
                  </TabsTrigger>
                  <TabsTrigger value="events" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />({results.events.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6 space-y-6">
                  {results.businesses.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Store className="h-4 w-4" /> Businesses
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {results.businesses.slice(0, 4).map((business) => (
                          <BusinessCard key={business.id} business={business} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.products.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" /> Products
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {results.products.slice(0, 4).map((product: any) => (
                          <div key={product.id} className="border border-border rounded-lg overflow-hidden">
                            {product.image && (
                              <div className="aspect-square overflow-hidden bg-muted">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="p-3 space-y-1">
                              <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {product.businesses?.name}
                              </p>
                              <p className="text-sm font-semibold text-primary">
                                ₹{product.discount_price || product.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.places.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Mountain className="h-4 w-4" /> Places
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
                        <Calendar className="h-4 w-4" /> Events
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

                <TabsContent value="products" className="mt-6">
                  {results.products.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No products found</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {results.products.map((product: any) => (
                        <div key={product.id} className="border border-border rounded-lg overflow-hidden">
                          {product.image && (
                            <div className="aspect-square overflow-hidden bg-muted">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="p-3 space-y-1">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{product.businesses?.name}</p>
                            <p className="text-sm font-semibold text-primary">₹{product.discount_price || product.price}</p>
                          </div>
                        </div>
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
            <p className="text-muted-foreground">Find businesses, products, places, and events</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
