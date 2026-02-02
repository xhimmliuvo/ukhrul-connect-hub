import { CheckCircle, Circle, Package, Truck, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStatusTimelineProps {
  status: string;
  pickupTime?: string | null;
  deliveryTime?: string | null;
}

const STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'agent_assigned', label: 'Agent Assigned', icon: User },
  { key: 'picked_up', label: 'Picked Up', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  agent_assigned: 1,
  picked_up: 2,
  in_transit: 3,
  delivered: 4,
};

export function OrderStatusTimeline({ status, pickupTime, deliveryTime }: OrderStatusTimelineProps) {
  const currentIndex = STATUS_ORDER[status] ?? 0;

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Order Status</h3>
      
      {/* Horizontal timeline for larger screens */}
      <div className="hidden sm:flex items-center justify-between">
        {STATUSES.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div 
                    className={cn(
                      "flex-1 h-1 transition-colors",
                      index <= currentIndex ? "bg-primary" : "bg-muted"
                    )} 
                  />
                )}
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20"
                  )}
                >
                  {isCompleted && index < currentIndex ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {index < STATUSES.length - 1 && (
                  <div 
                    className={cn(
                      "flex-1 h-1 transition-colors",
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    )} 
                  />
                )}
              </div>
              <span 
                className={cn(
                  "text-xs mt-2 text-center",
                  isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Vertical timeline for mobile */}
      <div className="sm:hidden space-y-3">
        {STATUSES.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-all shrink-0",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20"
                  )}
                >
                  {isCompleted && index < currentIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {index < STATUSES.length - 1 && (
                  <div 
                    className={cn(
                      "w-0.5 h-6 mt-1 transition-colors",
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    )} 
                  />
                )}
              </div>
              <div className="pt-1">
                <p 
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.key === 'picked_up' && pickupTime && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(pickupTime).toLocaleTimeString()}
                  </p>
                )}
                {step.key === 'delivered' && deliveryTime && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(deliveryTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
