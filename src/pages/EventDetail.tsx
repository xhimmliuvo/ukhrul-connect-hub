import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  Phone,
  Share2,
  Ticket
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Event {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image: string | null;
  images: string[];
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  entry_fee: number | null;
  organizer: string | null;
  organizer_contact: string | null;
  featured: boolean;
}

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching event:', error);
      }
      
      setEvent(data);
      setLoading(false);
    }

    fetchEvent();
  }, [slug]);

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.name,
          text: event.short_description || `Check out ${event.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const openMaps = () => {
    if (event?.location_lat && event?.location_lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${event.location_lat},${event.location_lng}`,
        '_blank'
      );
    } else if (event?.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-64 w-full" />
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Event not found</h1>
          <Link to="/events">
            <Button variant="outline">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate >= new Date();

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero Image */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
        {event.cover_image && (
          <img
            src={event.cover_image}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Back Button */}
        <Link to="/events" className="absolute top-4 left-4">
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        {/* Share Button */}
        <Button 
          variant="secondary" 
          size="icon" 
          className="absolute top-4 right-4 rounded-full shadow-lg"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 -mt-16 relative z-10 space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Date Box */}
              <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {format(eventDate, 'd')}
                </span>
                <span className="text-xs text-primary uppercase">
                  {format(eventDate, 'MMM')}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-start gap-2 flex-wrap">
                  {event.featured && (
                    <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                  )}
                  {!isUpcoming && (
                    <Badge variant="secondary">Past Event</Badge>
                  )}
                </div>
                <h1 className="text-xl font-bold text-foreground mt-2">
                  {event.name}
                </h1>
                {event.short_description && (
                  <p className="text-muted-foreground mt-1">
                    {event.short_description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Event Details</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {format(eventDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  {(event.start_time || event.end_time) && (
                    <p className="text-sm text-muted-foreground">
                      {event.start_time?.slice(0, 5)}
                      {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                    </p>
                  )}
                </div>
              </div>

              {event.venue && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{event.venue}</p>
                    {event.address && (
                      <p className="text-sm text-muted-foreground">{event.address}</p>
                    )}
                  </div>
                </div>
              )}

              {event.entry_fee !== null && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {event.entry_fee > 0 ? `₹${event.entry_fee}` : 'Free Entry'}
                    </p>
                    <p className="text-sm text-muted-foreground">Entry Fee</p>
                  </div>
                </div>
              )}

              {event.organizer && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{event.organizer}</p>
                    <p className="text-sm text-muted-foreground">Organizer</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {event.description && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-foreground mb-3">About This Event</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {event.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {(event.address || (event.location_lat && event.location_lng)) && (
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={openMaps}
            >
              <MapPin className="h-4 w-4" />
              Get Directions
            </Button>
          )}
          {event.organizer_contact && (
            <Button 
              className="flex-1 gap-2"
              onClick={() => window.open(`tel:${event.organizer_contact}`, '_self')}
            >
              <Phone className="h-4 w-4" />
              Contact Organizer
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
