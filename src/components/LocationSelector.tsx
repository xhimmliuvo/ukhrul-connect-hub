import { useEffect } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useServiceAreaContext } from '@/contexts/ServiceAreaContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LocationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationSelector({ open, onOpenChange }: LocationSelectorProps) {
  const { 
    serviceAreas, 
    currentArea, 
    geoStatus, 
    changeArea, 
    detectLocation 
  } = useServiceAreaContext();

  const isLoading = geoStatus === 'loading';

  // Close dialog when area is selected
  useEffect(() => {
    if (currentArea && open) {
      onOpenChange(false);
    }
  }, [currentArea, open, onOpenChange]);

  const handleAreaSelect = async (areaId: string) => {
    await changeArea(areaId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Select Your Area
          </DialogTitle>
          <DialogDescription>
            Choose your service area to see relevant businesses, places, and events near you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Auto-detect button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={detectLocation}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5 text-primary" />
            )}
            <span>Use my current location</span>
          </Button>

          {geoStatus === 'denied' && (
            <p className="text-sm text-destructive">
              Location access was denied. Please select manually.
            </p>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or select manually
              </span>
            </div>
          </div>

          {/* Service area list */}
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {serviceAreas.map((area) => (
              <Button
                key={area.id}
                variant={currentArea?.id === area.id ? 'secondary' : 'ghost'}
                className="w-full justify-start h-12"
                onClick={() => handleAreaSelect(area.id)}
              >
                <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                {area.name}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
