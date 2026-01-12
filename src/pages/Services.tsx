import { useState, useEffect } from 'react';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { AgentCard } from '@/components/AgentCard';
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
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useServiceAreaContext } from '@/contexts/ServiceAreaContext';
import { toast } from 'sonner';

interface DropeeService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  price: string;
}

interface DeliveryAgent {
  id: string;
  agent_code: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  vehicle_type: string;
  rating: number | null;
  total_deliveries: number;
  agent_availability: {
    status: string;
  } | null;
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
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const { currentArea } = useServiceAreaContext();

  useEffect(() => {
    fetchServices();
    fetchAgents();
  }, [currentArea]);

  async function fetchServices() {
    setLoading(true);
    let query = supabase
      .from('dropee_services')
      .select('id, name, slug, description, icon, price')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (currentArea) {
      query = query.or(`service_area_id.eq.${currentArea.id},service_area_id.is.null`);
    }

    const { data } = await query;
    setServices(data || []);
    setLoading(false);
  }

  async function fetchAgents() {
    setAgentsLoading(true);
    let query = supabase
      .from('delivery_agents')
      .select(`
        id,
        agent_code,
        full_name,
        phone,
        avatar_url,
        vehicle_type,
        rating,
        total_deliveries,
        agent_availability (status)
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false });

    if (currentArea) {
      query = query.or(`service_area_id.eq.${currentArea.id},service_area_id.is.null`);
    }

    const { data } = await query;
    
    // Sort agents: online first, then busy, then offline
    const sortedAgents = (data || []).sort((a, b) => {
      const statusOrder: Record<string, number> = { online: 0, busy: 1, offline: 2 };
      const statusA = a.agent_availability?.status || 'offline';
      const statusB = b.agent_availability?.status || 'offline';
      return (statusOrder[statusA] || 2) - (statusOrder[statusB] || 2);
    });
    
    setAgents(sortedAgents as DeliveryAgent[]);
    setAgentsLoading(false);
  }

  function handleRequestAgent(agentId: string) {
    toast.info('Agent request feature coming soon!', {
      description: 'This feature will be available in Phase 2.',
    });
  }

  const onlineAgentsCount = agents.filter(
    a => a.agent_availability?.status === 'online'
  ).length;

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

        {/* Available Agents Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Available Agents</h2>
            </div>
            {onlineAgentsCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {onlineAgentsCount} online
              </span>
            )}
          </div>

          <div className="space-y-3">
            {agentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : agents.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No agents available in your area yet.</p>
                  <p className="text-sm mt-1">Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onRequestAgent={handleRequestAgent}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
