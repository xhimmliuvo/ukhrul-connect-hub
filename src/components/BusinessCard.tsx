import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Business {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  cover_image: string | null;
  rating: number;
  review_count: number;
  verified: boolean;
  featured: boolean;
  address: string | null;
  categories?: {
    name: string;
    color: string | null;
  } | null;
}

interface BusinessCardProps {
  business: Business;
  variant?: 'default' | 'compact';
  locationName?: string;
}

export function BusinessCard({ business, variant = 'default', locationName }: BusinessCardProps) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedItems();
  const saved = isSaved('business', business.id);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to save businesses');
      return;
    }
    
    const { error } = await toggleSave('business', business.id);
    if (error) {
      toast.error('Failed to update saved items');
    } else {
      toast.success(saved ? 'Removed from saved' : 'Saved!');
    }
  };

  const isCompact = variant === 'compact';

  return (
    <Link to={`/businesses/${business.slug}`}>
      <div className={cn(
        "group rounded-2xl overflow-hidden bg-card border border-border/50 card-hover",
        isCompact ? "" : ""
      )}>
        {/* Image */}
        <div className={cn("relative bg-muted overflow-hidden", isCompact ? "h-28" : "h-44")}>
          {business.cover_image ? (
            <img
              src={business.cover_image}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />

          {/* Save button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2.5 right-2.5 h-9 w-9 rounded-xl glass hover:scale-110 transition-transform"
            onClick={handleSaveClick}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                saved ? "fill-destructive text-destructive scale-110" : "text-foreground"
              )}
            />
          </Button>

          {/* Featured badge */}
          {business.featured && (
            <Badge className="absolute top-2.5 left-2.5 rounded-lg gradient-warm text-primary-foreground border-0 font-semibold text-xs shadow-premium">
              ★ Featured
            </Badge>
          )}

          {/* Location badge */}
          {locationName && (
            <Badge variant="secondary" className="absolute bottom-2.5 left-2.5 rounded-lg text-xs glass border-0">
              <MapPin className="h-3 w-3 mr-1" />
              {locationName}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className={cn("p-3.5", isCompact && "p-2.5")}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className={cn(
                  "font-bold text-foreground truncate",
                  isCompact ? "text-sm" : "text-base"
                )}>
                  {business.name}
                </h3>
                {business.verified && (
                  <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
              
              {business.categories && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {business.categories.name}
                </p>
              )}
            </div>

            {/* Rating */}
            {business.review_count > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0 bg-accent/10 rounded-lg px-2 py-1">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                <span className="text-sm font-bold text-foreground">
                  {business.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {!isCompact && business.short_description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {business.short_description}
            </p>
          )}

          {!isCompact && business.address && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{business.address}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
