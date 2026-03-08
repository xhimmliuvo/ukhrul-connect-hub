import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { PlaceCard } from '@/components/PlaceCard';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal } from 'lucide-react';

interface Place {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  cover_image: string | null;
  rating: number;
  review_count: number;
  featured: boolean;
  address: string | null;
  difficulty_level: string | null;
  entry_fee: number | null;
  category_id: string | null;
  categories: { name: string; color: string | null } | null;
  service_areas: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function Places() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, icon')
        .eq('type', 'place')
        .eq('active', true);
      setCategories(data || []);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchPlaces() {
      setLoading(true);

      let query = supabase
        .from('places')
        .select(`
          id, name, slug, short_description, cover_image,
          rating, review_count, featured, address, difficulty_level,
          entry_fee, category_id,
          categories (name, color),
          service_areas (name)
        `)
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching places:', error);
      } else {
        setPlaces((data as any) || []);
      }

      setLoading(false);
    }

    fetchPlaces();
  }, [selectedCategory, searchQuery]);

  const featuredPlaces = places.filter(p => p.featured);
  const regularPlaces = places.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-background pb-24">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Places to Visit</h1>
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
                placeholder="Search places..."
                className="pl-12 h-12 bg-card border-0 rounded-xl text-base shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category pills */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-xl font-semibold"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-xl font-semibold"
              >
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <PromotionalBanner page="places" />

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-medium">No places found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try changing your search terms
            </p>
          </div>
        ) : (
          <>
            {featuredPlaces.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">Featured</h2>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                  {featuredPlaces.map((place) => (
                    <div key={place.id} className="min-w-[280px] max-w-[320px] flex-shrink-0">
                      <PlaceCard
                        place={place}
                        locationName={place.service_areas?.name}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">
                {selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name
                  : 'All Places'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {regularPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    variant="compact"
                    locationName={place.service_areas?.name}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
