import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { BusinessCard } from '@/components/BusinessCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

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

export default function Businesses() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, icon')
        .eq('type', 'business')
        .eq('active', true);
      setCategories(data || []);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true);
      
      let query = supabase
        .from('businesses')
        .select(`
          id, name, slug, short_description, cover_image,
          rating, review_count, verified, featured, address, category_id,
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
        console.error('Error fetching businesses:', error);
      } else {
        setBusinesses((data as any) || []);
      }
      
      setLoading(false);
    }

    fetchBusinesses();
  }, [selectedCategory, searchQuery]);

  const featuredBusinesses = businesses.filter(b => b.featured);
  const regularBusinesses = businesses.filter(b => !b.featured);

  return (
    <div className="min-h-screen bg-background pb-24">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Businesses</h1>
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
                placeholder="Search businesses..."
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
        ) : businesses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-medium">No businesses found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try changing your search terms
            </p>
          </div>
        ) : (
          <>
            {featuredBusinesses.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">Featured</h2>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                  {featuredBusinesses.map((business) => (
                    <div key={business.id} className="min-w-[280px] max-w-[320px] flex-shrink-0">
                      <BusinessCard 
                        business={business}
                        locationName={business.service_areas?.name}
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
                  : 'All Businesses'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {regularBusinesses.map((business) => (
                  <BusinessCard 
                    key={business.id} 
                    business={business} 
                    variant="compact"
                    locationName={business.service_areas?.name}
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
