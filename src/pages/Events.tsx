import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Calendar } from 'lucide-react';

export default function Events() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Events</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-10 h-12 bg-secondary border-0"
          />
        </div>

        {/* Placeholder content */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>
          <Card className="border-dashed">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No upcoming events
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Check back soon for festivals, markets, and community events in your area.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
