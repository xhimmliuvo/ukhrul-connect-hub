import { useState, useEffect } from 'react';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, 
  UtensilsCrossed, 
  ShoppingBasket, 
  FileText, 
  Package,
  ArrowRight,
  Bike,
  Car,
  Gift,
  Box,
  ShoppingCart,
  Coffee,
  Pill,
  Newspaper,
  Mail,
  LucideIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useServiceAreaContext } from '@/contexts/ServiceAreaContext';

interface DropeeService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  price: string;
}

const iconMap: Record<string, LucideIcon> = {
  Truck,
  UtensilsCrossed,
  ShoppingBasket,
  FileText,
  Package,
  Bike,
  Car,
  Gift,
  Box,
  ShoppingCart,
  Coffee,
  Pill,
  Newspaper,
  Mail,
};

export default function Services() {
  const [services, setServices] = useState<DropeeService[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentArea } = useServiceAreaContext();

  useEffect(() => {
    fetchServices();
  }, [currentArea]);

  async function fetchServices() {
    setLoading(true);
    let query = supabase
      .from('dropee_services')
      .select('id, name, slug, description, icon, price')
      .eq('active', true)
      .order('display_order', { ascending: true });

    // Filter by service area if available, or show all if no area-specific services
    if (currentArea) {
      query = query.or(`service_area_id.eq.${currentArea.id},service_area_id.is.null`);
    }

    const { data } = await query;
    setServices(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary-foreground/20">
                <Truck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dropee Services</h1>
                <p className="text-primary-foreground/80">
                  Fast & reliable local delivery
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">How it works</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold text-sm">
                1
              </div>
              <p className="text-xs text-muted-foreground">Choose service</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold text-sm">
                2
              </div>
              <p className="text-xs text-muted-foreground">Enter details</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold text-sm">
                3
              </div>
              <p className="text-xs text-muted-foreground">We deliver</p>
            </div>
          </div>
        </section>

        {/* Services List */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Our Services</h2>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : services.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No services available at the moment.
                </CardContent>
              </Card>
            ) : (
              services.map((service) => {
                const IconComponent = iconMap[service.icon] || Package;
                return (
                  <Card key={service.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <p className="text-sm font-medium text-primary mt-1">{service.price}</p>
                      </div>
                      <Button size="icon" variant="ghost">
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
