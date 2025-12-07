import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useServiceAreaContext } from '@/contexts/ServiceAreaContext';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { BusinessCard } from '@/components/BusinessCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter } from 'lucide-react';

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
  categories: {
    name: string;
    color: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function Businesses() {
  const { currentArea } = useServiceAreaContext();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch categories
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

  // Fetch businesses
  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true);
      
      let query = supabase
        .from('businesses')
        .select(`
          id, name, slug, short_description, cover_image,
          rating, review_count, verified, featured, address, category_id,
          categories (name, color)
        `)
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (currentArea) {
        query = query.eq('service_area_id', currentArea.id);
      }

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
        setBusinesses(data || []);
      }
      
      setLoading(false);
    }

    fetchBusinesses();
  }, [currentArea, selectedCategory, searchQuery]);

  const featuredBusinesses = businesses.filter(b => b.featured);
  const regularBusinesses = businesses.filter(b => !b.featured);

  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Businesses</h1>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            className="pl-10 h-12 bg-secondary border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category chips */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
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
              <div key={i} className="space-y-2">
                <Skeleton className="h-36 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No businesses found</p>
            {currentArea && (
              <p className="text-sm text-muted-foreground mt-1">
                Try changing your location or search terms
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Featured section */}
            {featuredBusinesses.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Featured</h2>
                <div className="grid grid-cols-1 gap-4">
                  {featuredBusinesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
              </section>
            )}

            {/* All businesses */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
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
