import { Bike, Car, Footprints, Star, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AgentCardProps {
  agent: {
    id: string;
    agent_code: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    vehicle_type: string;
    rating: number | null;
    total_deliveries: number;
    agent_availability?: {
      status: string;
    } | null;
  };
  onRequestAgent?: (agentId: string) => void;
}

const vehicleIcons: Record<string, React.ElementType> = {
  bike: Bike,
  car: Car,
  foot: Footprints,
};

const vehicleLabels: Record<string, string> = {
  bike: 'Motorcycle',
  car: 'Car',
  foot: 'On Foot',
};

export function AgentCard({ agent, onRequestAgent }: AgentCardProps) {
  const VehicleIcon = vehicleIcons[agent.vehicle_type] || Bike;
  const status = agent.agent_availability?.status || 'offline';
  const isOnline = status === 'online';
  const isBusy = status === 'busy';

  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online' },
    offline: { color: 'bg-muted', label: 'Offline' },
    busy: { color: 'bg-yellow-500', label: 'Busy' },
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14">
              <AvatarImage src={agent.avatar_url || undefined} alt={agent.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {agent.full_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${currentStatus.color}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{agent.full_name}</h3>
              <Badge variant="outline" className="shrink-0 text-xs">
                {agent.agent_code}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{agent.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex items-center gap-1">
                <VehicleIcon className="h-4 w-4" />
                <span>{vehicleLabels[agent.vehicle_type]}</span>
              </div>
              <span>{agent.total_deliveries} deliveries</span>
            </div>

            <div className="flex items-center justify-between">
              <Badge
                variant={isOnline ? 'default' : 'secondary'}
                className={isOnline ? 'bg-green-500 hover:bg-green-600' : isBusy ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                {currentStatus.label}
              </Badge>

              {isOnline && onRequestAgent && (
                <Button size="sm" onClick={() => onRequestAgent(agent.id)}>
                  Request Agent
                </Button>
              )}

              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="text-muted-foreground hover:text-foreground">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}