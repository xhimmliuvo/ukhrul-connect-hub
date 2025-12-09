import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: {
    id: string;
    name: string;
    slug: string;
    short_description: string | null;
    cover_image: string | null;
    event_date: string;
    start_time: string | null;
    venue: string | null;
    featured: boolean;
    entry_fee: number | null;
  };
  variant?: 'default' | 'compact';
}

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate >= new Date();

  if (variant === 'compact') {
    return (
      <Link to={`/events/${event.slug}`}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
          <div className="relative h-24">
            {event.cover_image ? (
              <img
                src={event.cover_image}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-primary/50" />
              </div>
            )}
            {event.featured && (
              <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs">
                Featured
              </Badge>
            )}
          </div>
          <CardContent className="p-3">
            <h3 className="font-medium text-foreground text-sm line-clamp-1">
              {event.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(eventDate, 'MMM d, yyyy')}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/events/${event.slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-4 p-4">
          {/* Date Box */}
          <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {format(eventDate, 'd')}
            </span>
            <span className="text-xs text-primary uppercase">
              {format(eventDate, 'MMM')}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {event.name}
              </h3>
              {event.featured && (
                <Badge className="bg-accent text-accent-foreground text-xs flex-shrink-0">
                  Featured
                </Badge>
              )}
            </div>

            {event.short_description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {event.short_description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              {event.start_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{event.start_time.slice(0, 5)}</span>
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{event.venue}</span>
                </div>
              )}
              {event.entry_fee && event.entry_fee > 0 && (
                <Badge variant="outline" className="text-xs">
                  ₹{event.entry_fee}
                </Badge>
              )}
              {!isUpcoming && (
                <Badge variant="secondary" className="text-xs">
                  Past Event
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
