import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Star, Bike, Car, Truck } from 'lucide-react';

interface AgentInfoCardProps {
  agent: {
    id: string;
    full_name: string;
    agent_code: string;
    phone: string | null;
    avatar_url: string | null;
    vehicle_type: string;
    rating: number | null;
  };
}

const vehicleIcons: Record<string, typeof Bike> = {
  bike: Bike,
  motorcycle: Bike,
  car: Car,
  truck: Truck,
  van: Truck,
};

export function AgentInfoCard({ agent }: AgentInfoCardProps) {
  const VehicleIcon = vehicleIcons[agent.vehicle_type.toLowerCase()] || Bike;
  const initials = agent.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={agent.avatar_url || undefined} alt={agent.full_name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{agent.full_name}</h3>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {agent.agent_code}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {agent.rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {agent.rating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1 capitalize">
                <VehicleIcon className="h-3.5 w-3.5" />
                {agent.vehicle_type}
              </span>
            </div>
          </div>
        </div>

        {agent.phone && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`tel:${agent.phone}`)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
