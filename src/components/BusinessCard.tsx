import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
}

export function BusinessCard({ business, variant = 'default' }: BusinessCardProps) {
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
      <Card className="overflow-hidden hover:shadow-md transition-shadow group">
        {/* Image */}
        <div className={cn("relative bg-muted", isCompact ? "h-24" : "h-36")}>
          {business.cover_image ? (
            <img
              src={business.cover_image}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
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
          {business.featured && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className={cn("p-3", isCompact && "p-2")}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className={cn(
                  "font-semibold text-foreground truncate",
                  isCompact ? "text-sm" : "text-base"
                )}>
                  {business.name}
                </h3>
                {business.verified && (
                  <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
              
              {business.categories && (
                <p className="text-xs text-muted-foreground">
                  {business.categories.name}
                </p>
              )}
            </div>

            {/* Rating */}
            {business.review_count > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {business.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({business.review_count})
                </span>
              </div>
            )}
          </div>

          {!isCompact && business.short_description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {business.short_description}
            </p>
          )}

          {!isCompact && business.address && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{business.address}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
