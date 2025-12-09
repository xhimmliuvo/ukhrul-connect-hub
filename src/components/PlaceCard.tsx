import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, Mountain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
}

export function PlaceCard({ place, variant = 'default' }: PlaceCardProps) {
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

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'easy': return 'bg-green-500/10 text-green-600';
      case 'moderate': return 'bg-yellow-500/10 text-yellow-600';
      case 'challenging': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Link to={`/places/${place.slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow group">
        {/* Image */}
        <div className={cn("relative bg-muted", isCompact ? "h-24" : "h-36")}>
          {place.cover_image ? (
            <img
              src={place.cover_image}
              alt={place.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Mountain className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          {/* Save button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleSaveClick}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                saved ? "fill-destructive text-destructive" : "text-foreground"
              )}
            />
          </Button>

          {/* Featured badge */}
          {place.featured && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}

          {/* Entry fee badge */}
          {!isCompact && place.entry_fee && place.entry_fee > 0 && (
            <Badge variant="secondary" className="absolute bottom-2 left-2">
              ₹{place.entry_fee}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className={cn("p-3", isCompact && "p-2")}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-foreground truncate",
                isCompact ? "text-sm" : "text-base"
              )}>
                {place.name}
              </h3>
              
              {place.categories && (
                <p className="text-xs text-muted-foreground">
                  {place.categories.name}
                </p>
              )}
            </div>

            {/* Rating */}
            {(place.review_count ?? 0) > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {Number(place.rating).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({place.review_count})
                </span>
              </div>
            )}
          </div>

          {!isCompact && place.short_description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {place.short_description}
            </p>
          )}

          {!isCompact && (
            <div className="flex items-center gap-2 mt-2">
              {place.difficulty_level && (
                <Badge variant="outline" className={cn("text-xs", getDifficultyColor(place.difficulty_level))}>
                  {place.difficulty_level}
                </Badge>
              )}
              {place.address && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{place.address}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
