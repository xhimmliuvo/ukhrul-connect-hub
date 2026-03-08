import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, Mountain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Place {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  cover_image: string | null;
  rating: number | null;
  review_count: number | null;
  featured: boolean;
  address: string | null;
  difficulty_level?: string | null;
  entry_fee: number | null;
  categories?: {
    name: string;
    color: string | null;
  } | null;
}

interface PlaceCardProps {
  place: Place;
  variant?: 'default' | 'compact';
  locationName?: string;
}

export function PlaceCard({ place, variant = 'default', locationName }: PlaceCardProps) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedItems();
  const saved = isSaved('place', place.id);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to save places');
      return;
    }
    
    const { error } = await toggleSave('place', place.id);
    if (error) {
      toast.error('Failed to update saved items');
    } else {
      toast.success(saved ? 'Removed from saved' : 'Saved!');
    }
  };

  const isCompact = variant === 'compact';

  return (
    <Link to={`/places/${place.slug}`}>
      <div className={cn(
        "group rounded-2xl overflow-hidden relative card-hover",
        isCompact ? "h-44" : "h-56"
      )}>
        {/* Full-bleed image */}
        {place.cover_image ? (
          <img
            src={place.cover_image}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Mountain className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Gradient overlay from bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

        {/* Save button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2.5 right-2.5 h-9 w-9 rounded-xl glass hover:scale-110 transition-transform z-10"
          onClick={handleSaveClick}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all",
              saved ? "fill-destructive text-destructive scale-110" : "text-primary-foreground"
            )}
          />
        </Button>

        {/* Featured badge */}
        {place.featured && (
          <Badge className="absolute top-2.5 left-2.5 rounded-lg gradient-warm text-primary-foreground border-0 font-semibold text-xs shadow-premium z-10">
            ★ Featured
          </Badge>
        )}

        {/* Bottom overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
          {/* Glass info bar */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-bold text-primary-foreground truncate",
                isCompact ? "text-sm" : "text-base"
              )}>
                {place.name}
              </h3>
              {(place.review_count ?? 0) > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <span className="text-xs font-bold text-primary-foreground">
                    {Number(place.rating).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {locationName && (
                <span className="text-xs text-primary-foreground/80 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {locationName}
                </span>
              )}
              {place.entry_fee && place.entry_fee > 0 && (
                <Badge variant="secondary" className="text-xs rounded-md bg-primary-foreground/20 text-primary-foreground border-0">
                  ₹{place.entry_fee}
                </Badge>
              )}
              {!isCompact && place.difficulty_level && (
                <Badge variant="secondary" className="text-xs rounded-md bg-primary-foreground/20 text-primary-foreground border-0 capitalize">
                  {place.difficulty_level}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
