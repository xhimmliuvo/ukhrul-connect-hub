import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedItems } from '@/hooks/useSavedItems';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Star,
  Heart,
  MapPin,
  Share2,
  Navigation,
  Clock,
  Calendar,
  Ticket,
  Mountain,
  Info,
  Car,
  Utensils,
  User,
  Droplets,
} from 'lucide-react';
import { ReviewForm } from '@/components/ReviewForm';

interface Place {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image: string | null;
  images: string[];
  rating: number;
  review_count: number;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  difficulty_level: string | null;
  best_time_to_visit: string | null;
  entry_fee: number | null;
  facilities: string[];
  tips: string | null;
  categories: {
    name: string;
    slug: string;
    color: string | null;
  } | null;
  service_areas: {
    name: string;
  } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  reviewer_name?: string | null;
}

const facilityIcons: Record<string, React.ElementType> = {
  parking: Car,
  food: Utensils,
  restroom: Droplets,
  guide: User,
};

export default function PlaceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedItems();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    async function fetchPlace() {
      if (!slug) return;

      const { data, error } = await supabase
        .from('places')
        .select(`
          id, name, slug, description, short_description, cover_image, images,
          rating, review_count, address, location_lat, location_lng,
          difficulty_level, best_time_to_visit, entry_fee, facilities, tips,
          categories (name, slug, color),
          service_areas (name)
        `)
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching place:', error);
        toast.error('Failed to load place');
        return;
      }

      if (data) {
        setPlace(data as Place);

        // Fetch reviews for this place
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, user_id')
          .eq('place_id', data.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch profile names for reviewers
        if (reviewsData && reviewsData.length > 0) {
          const userIds = reviewsData.map(r => r.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          
          const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
          setReviews(reviewsData.map(r => ({
            ...r,
            reviewer_name: profileMap.get(r.user_id) || null
          })));
        } else {
          setReviews([]);
        }
      }
      
      setLoading(false);
    }

    fetchPlace();
  }, [slug]);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save places');
      return;
    }
    if (!place) return;

    const { error } = await toggleSave('place', place.id);
    if (error) {
      toast.error('Failed to update saved items');
    } else {
      toast.success(isSaved('place', place.id) ? 'Removed from saved' : 'Saved!');
    }
  };

  const handleDirections = () => {
    if (place?.location_lat && place?.location_lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${place.location_lat},${place.location_lng}`,
        '_blank'
      );
    } else if (place?.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`,
        '_blank'
      );
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place?.name,
          text: place?.short_description || '',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'moderate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'challenging': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-64 w-full" />
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Place not found</h1>
          <Link to="/places">
            <Button variant="outline">Browse places</Button>
          </Link>
        </div>
      </div>
    );
  }

  const saved = isSaved('place', place.id);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Hero Image */}
      <div className="relative h-64 bg-muted">
        {place.cover_image ? (
          <img
            src={place.cover_image}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Mountain className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Back button */}
        <Link to="/places" className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
            onClick={handleSave}
          >
            <Heart className={saved ? "h-5 w-5 fill-destructive text-destructive" : "h-5 w-5"} />
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 -mt-12 relative z-10 space-y-6">
        {/* Place Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{place.name}</h1>
                
                <div className="flex items-center gap-2 mt-2">
                  {place.categories && (
                    <Badge variant="secondary">
                      {place.categories.name}
                    </Badge>
                  )}
                  {place.difficulty_level && (
                    <Badge variant="outline" className={cn(getDifficultyColor(place.difficulty_level))}>
                      {place.difficulty_level}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Rating */}
              {place.review_count > 0 && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    <span className="text-xl font-bold text-foreground">
                      {Number(place.rating).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {place.review_count} reviews
                  </span>
                </div>
              )}
            </div>

            {place.short_description && (
              <p className="mt-4 text-muted-foreground">
                {place.short_description}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 mt-6">
              <Button className="flex-1 gap-2" onClick={handleDirections}>
                <Navigation className="h-4 w-4" />
                Get Directions
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {place.best_time_to_visit && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Best Time</p>
                    <p className="text-sm font-medium text-foreground">{place.best_time_to_visit}</p>
                  </div>
                </div>
              )}

              {place.entry_fee !== null && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entry Fee</p>
                    <p className="text-sm font-medium text-foreground">
                      {place.entry_fee > 0 ? `₹${place.entry_fee}` : 'Free'}
                    </p>
                  </div>
                </div>
              )}

              {place.difficulty_level && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mountain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                    <p className="text-sm font-medium text-foreground capitalize">{place.difficulty_level}</p>
                  </div>
                </div>
              )}

              {place.address && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium text-foreground">{place.address}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {place.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground whitespace-pre-line">
                {place.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Facilities */}
        {place.facilities && place.facilities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Facilities</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-3">
                {place.facilities.map((facility) => {
                  const Icon = facilityIcons[facility] || Info;
                  return (
                    <div
                      key={facility}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground capitalize">{facility}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {place.tips && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground">
                {place.tips}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {place.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-foreground">{place.address}</p>
                  {place.service_areas && (
                    <p className="text-sm text-muted-foreground">
                      {place.service_areas.name}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <Button variant="outline" className="w-full gap-2" onClick={handleDirections}>
              <Navigation className="h-4 w-4" />
              Open in Google Maps
            </Button>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Reviews</CardTitle>
            {user && (
              <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(true)}>
                Write a review
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No reviews yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to share your experience
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {review.reviewer_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {review.reviewer_name || 'Anonymous'}
                          </span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3 w-3",
                                  i < review.rating ? "fill-primary text-primary" : "text-muted"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-muted-foreground text-sm">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Review Modal */}
      {place && (
        <ReviewForm
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          placeId={place.id}
          itemName={place.name}
          onSuccess={async () => {
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('id, rating, comment, created_at, user_id')
              .eq('place_id', place.id)
              .order('created_at', { ascending: false })
              .limit(10);
            
            if (reviewsData && reviewsData.length > 0) {
              const userIds = reviewsData.map(r => r.user_id);
              const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);
              
              const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
              setReviews(reviewsData.map(r => ({
                ...r,
                reviewer_name: profileMap.get(r.user_id) || null
              })));
            } else {
              setReviews([]);
            }
          }}
        />
      )}
    </div>
  );
}
