import { Check, Clock, Package, Truck, MapPin, ChefHat } from 'lucide-react';
import { HUB_STATUS_LABELS, getHubStatusIndex, type HubStatus } from '@/hooks/useHubTracking';

const HUB_STAGES: { key: HubStatus; icon: React.ElementType }[] = [
  { key: 'pending', icon: Clock },
  { key: 'confirmed', icon: Check },
  { key: 'preparing', icon: ChefHat },
  { key: 'picked_up', icon: Package },
  { key: 'on_the_way', icon: Truck },
  { key: 'delivered', icon: MapPin },
];

interface HubStatusTimelineProps {
  status: string;
}

export function HubStatusTimeline({ status }: HubStatusTimelineProps) {
  const currentIndex = getHubStatusIndex(status);

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold mb-3">Hub Delivery Status</h4>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: currentIndex >= 0
              ? `${(currentIndex / (HUB_STAGES.length - 1)) * (100 - (8 / HUB_STAGES.length))}%`
              : '0%',
          }}
        />

        {HUB_STAGES.map((stage, index) => {
          const isCompleted = currentIndex >= index;
          const isCurrent = currentIndex === index;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex flex-col items-center z-10 relative">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] mt-1 text-center max-w-[60px] leading-tight ${
                  isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {HUB_STATUS_LABELS[stage.key]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
