import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  UtensilsCrossed, 
  ShoppingBasket, 
  FileText, 
  Package,
  ArrowRight
} from 'lucide-react';

const services = [
  {
    icon: UtensilsCrossed,
    title: 'Food Delivery',
    description: 'Get food from your favorite restaurants delivered to your doorstep',
    price: 'Starting from ₹30',
  },
  {
    icon: ShoppingBasket,
    title: 'Grocery Pickup',
    description: 'We pick up groceries from the market and deliver to you',
    price: 'Starting from ₹50',
  },
  {
    icon: FileText,
    title: 'Document Delivery',
    description: 'Safe and secure document pickup and delivery service',
    price: 'Starting from ₹40',
  },
  {
    icon: Package,
    title: 'Parcel Service',
    description: 'Send packages within Ukhrul district quickly and safely',
    price: 'Starting from ₹60',
  },
];

export default function Services() {
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
            {services.map((service) => (
              <Card key={service.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    <p className="text-sm font-medium text-primary mt-1">{service.price}</p>
                  </div>
                  <Button size="icon" variant="ghost">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
