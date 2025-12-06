import { MapPin, ChevronDown, Navigation, Loader2 } from 'lucide-react';
import { useServiceAreaContext } from '@/contexts/ServiceAreaContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LocationBanner() {
  const { 
    currentArea, 
    serviceAreas, 
    mode, 
    geoStatus, 
    changeArea, 
    detectLocation 
  } = useServiceAreaContext();

  const isLoading = geoStatus === 'loading';

  return (
    <div className="sticky top-0 z-50 bg-secondary border-b border-border">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto py-1.5">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <MapPin className="h-4 w-4 text-primary" />
              )}
              <span className="font-medium text-foreground">
                {currentArea ? currentArea.name : 'Select Location'}
              </span>
              {mode === 'auto' && (
                <span className="text-xs text-muted-foreground">(detected)</span>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={detectLocation} className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              <span>Detect my location</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {serviceAreas.map((area) => (
              <DropdownMenuItem
                key={area.id}
                onClick={() => changeArea(area.id)}
                className={currentArea?.id === area.id ? 'bg-accent' : ''}
              >
                {area.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {geoStatus === 'denied' && (
          <span className="text-xs text-muted-foreground">
            Location access denied
          </span>
        )}
      </div>
    </div>
  );
}
