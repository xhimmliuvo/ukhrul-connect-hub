import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Store, Mountain, Calendar, ShoppingBag } from 'lucide-react';

export default function Saved() {
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
            <EmptyState type="businesses" />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <EmptyState type="products" />
          </TabsContent>

          <TabsContent value="places" className="mt-6">
            <EmptyState type="places" />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <EmptyState type="events" />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
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
