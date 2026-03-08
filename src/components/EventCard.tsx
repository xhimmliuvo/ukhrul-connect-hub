import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  locationName?: string;
}

export function EventCard({ event, variant = 'default', locationName }: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate >= new Date();

  if (variant === 'compact') {
    return (
      <Link to={`/events/${event.slug}`}>
        <div className="overflow-hidden rounded-2xl card-hover bg-card border border-border/50 h-full">
          <div className="relative h-28">
            {event.cover_image ? (
              <img
                src={event.cover_image}
                alt={event.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-primary/50" />
              </div>
            )}
            {event.featured && (
              <Badge className="absolute top-2 left-2 rounded-lg gradient-warm text-primary-foreground border-0 text-xs font-semibold">
                ★ Featured
              </Badge>
            )}
            {/* Date pill */}
            <div className="absolute bottom-2 right-2 glass rounded-xl px-2 py-1 text-center min-w-[44px]">
              <span className="text-xs font-bold text-foreground block leading-tight">
                {format(eventDate, 'd')}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase leading-tight">
                {format(eventDate, 'MMM')}
              </span>
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-bold text-foreground text-sm line-clamp-1">
              {event.name}
            </h3>
            {locationName && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{locationName}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/events/${event.slug}`}>
      <div className="rounded-2xl overflow-hidden card-hover bg-card border border-border/50">
        <div className="flex gap-4 p-4">
          {/* Date pill */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl gradient-primary flex flex-col items-center justify-center shadow-premium">
            <span className="text-2xl font-extrabold text-primary-foreground leading-none">
              {format(eventDate, 'd')}
            </span>
            <span className="text-[10px] font-bold text-primary-foreground/80 uppercase mt-0.5">
              {format(eventDate, 'MMM')}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-foreground line-clamp-1">
                {event.name}
              </h3>
              <div className="flex gap-1.5 flex-shrink-0">
                {event.featured && (
                  <Badge className="rounded-lg gradient-warm text-primary-foreground border-0 text-xs font-semibold">
                    ★ Featured
                  </Badge>
                )}
              </div>
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
              {locationName && (
                <Badge variant="secondary" className="text-xs rounded-md">
                  {locationName}
                </Badge>
              )}
              {event.entry_fee && event.entry_fee > 0 && (
                <Badge variant="outline" className="text-xs rounded-md">
                  ₹{event.entry_fee}
                </Badge>
              )}
              {!isUpcoming && (
                <Badge variant="secondary" className="text-xs rounded-md">
                  Past Event
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
