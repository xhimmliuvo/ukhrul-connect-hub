import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Clock, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveLocationCardProps {
  location: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    status: string;
    timestamp: string;
  } | null;
  pickupAddress: string;
  deliveryAddress: string;
}

const STATUS_LABELS: Record<string, string> = {
  en_route_pickup: 'Heading to pickup',
  at_pickup: 'At pickup location',
  en_route_delivery: 'On the way to you',
  at_delivery: 'Arriving now',
};

export function LiveLocationCard({ location, pickupAddress, deliveryAddress }: LiveLocationCardProps) {
  const openInMaps = () => {
    if (location) {
      window.open(
        `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        '_blank'
      );
    }
  };

  const openDirections = (address: string) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      '_blank'
    );
  };

  if (!location) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Location tracking will begin when delivery starts</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(location.timestamp), { addSuffix: true });

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Live indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="h-4 w-4 text-green-500" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />
            </div>
            <span className="text-sm font-medium text-green-600">Live Tracking</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </div>
        </div>

        {/* Current status */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-sm">
            {STATUS_LABELS[location.status] || 'In transit'}
          </p>
          {location.speed > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Moving at {Math.round(location.speed)} km/h
            </p>
          )}
        </div>

        {/* Coordinates */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Current coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={openInMaps}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Open in Maps
          </Button>
        </div>

        {/* Addresses */}
        <div className="space-y-3 pt-2 border-t">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-muted-foreground">PICKUP</span>
            </div>
            <p className="text-sm truncate">{pickupAddress}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-muted-foreground">DELIVERY</span>
            </div>
            <p className="text-sm truncate">{deliveryAddress}</p>
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 mt-1"
              onClick={() => openDirections(deliveryAddress)}
            >
              Get directions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
