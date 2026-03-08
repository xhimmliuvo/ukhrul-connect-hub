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
    <div className="sticky top-0 z-50 glass">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto py-1.5 rounded-xl hover:bg-muted/50">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                  <MapPin className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <span className="font-semibold text-foreground text-sm">
                {currentArea ? currentArea.name : 'Select Location'}
              </span>
              {mode === 'auto' && (
                <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">(detected)</span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl">
            <DropdownMenuItem onClick={detectLocation} className="flex items-center gap-2 rounded-lg">
              <Navigation className="h-4 w-4" />
              <span>Detect my location</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {serviceAreas.map((area) => (
              <DropdownMenuItem
                key={area.id}
                onClick={() => changeArea(area.id)}
                className={`rounded-lg ${currentArea?.id === area.id ? 'bg-primary/10 text-primary font-semibold' : ''}`}
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
