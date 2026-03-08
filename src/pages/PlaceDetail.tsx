import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedItems } from '@/hooks/useSavedItems';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Star,
  Heart,
  MapPin,
  Share2,
  Navigation,
  Calendar,
  Ticket,
  Mountain,
  Info,
  Car,
  Utensils,
  User,
  Droplets,
  Pencil,
  Trash2,
} from 'lucide-react';
import { ReviewForm, ReviewData } from '@/components/ReviewForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  images: string[] | null;
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
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating, comment, images, created_at, user_id')
          .eq('place_id', data.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (reviewsData && reviewsData.length > 0) {
          const userIds = reviewsData.map(r => r.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
          setReviews(reviewsData.map(r => ({ ...r, reviewer_name: profileMap.get(r.user_id) || null })));
        } else {
          setReviews([]);
        }
      }
      
      setLoading(false);
    }

    fetchPlace();
  }, [slug]);

  const handleSave = async () => {
    if (!user) { toast.error('Please sign in to save places'); return; }
    if (!place) return;
    const { error } = await toggleSave('place', place.id);
    if (error) { toast.error('Failed to update saved items'); } else { toast.success(isSaved('place', place.id) ? 'Removed from saved' : 'Saved!'); }
  };

  const handleDirections = () => {
    if (place?.location_lat && place?.location_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.location_lat},${place.location_lng}`, '_blank');
    } else if (place?.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: place?.name, text: place?.short_description || '', url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'moderate': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'challenging': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const refreshReviews = async () => {
    if (!place) return;
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment, images, created_at, user_id')
      .eq('place_id', place.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (reviewsData && reviewsData.length > 0) {
      const userIds = reviewsData.map(r => r.user_id);
      const { data: profilesData } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      setReviews(reviewsData.map(r => ({ ...r, reviewer_name: profileMap.get(r.user_id) || null })));
    } else { setReviews([]); }
  };

  const allImages = place ? [place.cover_image, ...(place.images || [])].filter(Boolean) as string[] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-80 w-full" />
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-foreground">Place not found</h1>
          <Link to="/places">
            <Button variant="outline" className="rounded-xl">Browse places</Button>
          </Link>
        </div>
      </div>
    );
  }

  const saved = isSaved('place', place.id);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Hero */}
      <div className="relative h-80 bg-muted overflow-hidden">
        {allImages.length > 0 ? (
          <img
            src={allImages[activeImageIndex] || allImages[0]}
            alt={place.name}
            className="w-full h-full object-cover transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Mountain className="h-20 w-20 text-muted-foreground/40" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />

        {/* Floating nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Link to="/places">
            <Button variant="ghost" size="icon" className="glass rounded-xl h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="glass rounded-xl h-10 w-10" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="glass rounded-xl h-10 w-10" onClick={handleSave}>
              <Heart className={cn("h-5 w-5 transition-all", saved && "fill-destructive text-destructive scale-110")} />
            </Button>
          </div>
        </div>

        {/* Image dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, i) => (
              <button key={i} onClick={() => setActiveImageIndex(i)} className={cn("h-1.5 rounded-full transition-all", i === activeImageIndex ? "w-6 bg-primary" : "w-1.5 bg-foreground/40")} />
            ))}
          </div>
        )}

        {/* Hero bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {place.categories && (
                  <Badge variant="secondary" className="rounded-lg text-xs font-semibold backdrop-blur-sm bg-secondary/80">
                    {place.categories.name}
                  </Badge>
                )}
                {place.difficulty_level && (
                  <Badge variant="outline" className={cn("rounded-lg text-xs", getDifficultyColor(place.difficulty_level))}>
                    {place.difficulty_level}
                  </Badge>
                )}
                {place.service_areas && (
                  <Badge variant="outline" className="rounded-lg text-xs backdrop-blur-sm bg-background/40 border-border/40">
                    <MapPin className="h-3 w-3 mr-1" />
                    {place.service_areas.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{place.name}</h1>
            </div>
            {place.review_count > 0 && (
              <div className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 shrink-0">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-foreground">{Number(place.rating).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({place.review_count})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 space-y-5 mt-5">
        {/* Description */}
        {place.short_description && (
          <p className="text-muted-foreground leading-relaxed">{place.short_description}</p>
        )}

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          {place.best_time_to_visit && (
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Best Time</p>
                <p className="text-sm font-semibold text-foreground">{place.best_time_to_visit}</p>
              </div>
            </div>
          )}
          {place.entry_fee !== null && (
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Entry Fee</p>
                <p className="text-sm font-semibold text-foreground">{place.entry_fee > 0 ? `₹${place.entry_fee}` : 'Free'}</p>
              </div>
            </div>
          )}
          {place.difficulty_level && (
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mountain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Difficulty</p>
                <p className="text-sm font-semibold text-foreground capitalize">{place.difficulty_level}</p>
              </div>
            </div>
          )}
          {place.address && (
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Location</p>
                <p className="text-sm font-semibold text-foreground truncate">{place.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button className="rounded-xl h-12 gap-2 font-semibold" onClick={handleDirections}>
            <Navigation className="h-4 w-4" />
            Get Directions
          </Button>
          <Button variant="outline" className="rounded-xl h-12 gap-2 font-semibold" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* About */}
        {place.description && (
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-bold text-foreground">About</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{place.description}</p>
          </section>
        )}

        {/* Facilities */}
        {place.facilities && place.facilities.length > 0 && (
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Facilities</h2>
            <div className="flex flex-wrap gap-2">
              {place.facilities.map((facility) => {
                const Icon = facilityIcons[facility] || Info;
                return (
                  <div key={facility} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground capitalize">{facility}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tips */}
        {place.tips && (
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Tips
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{place.tips}</p>
          </section>
        )}

        {/* Location */}
        <section className="glass rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Location</h2>
          {place.address && (
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{place.address}</p>
                {place.service_areas && <p className="text-xs text-muted-foreground">{place.service_areas.name}</p>}
              </div>
            </div>
          )}
          <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleDirections}>
            <Navigation className="h-4 w-4" />
            Open in Google Maps
          </Button>
        </section>

        {/* Reviews */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Reviews</h2>
            {user && (
              <Button variant="outline" size="sm" className="rounded-xl font-semibold" onClick={() => { setEditingReview(null); setReviewModalOpen(true); }}>
                Write a review
              </Button>
            )}
          </div>

          {/* Rating summary */}
          {place.review_count > 0 && (
            <div className="glass rounded-2xl p-5 flex items-center gap-5">
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">{Number(place.rating).toFixed(1)}</p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(place.rating) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{place.review_count} reviews</p>
              </div>
              <Separator orientation="vertical" className="h-16" />
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-3">{star}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to share your experience</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 rounded-xl">
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                        {review.reviewer_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{review.reviewer_name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={cn("h-3 w-3", i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                            ))}
                          </div>
                          {user?.id === review.user_id && (
                            <div className="flex items-center gap-0.5 ml-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => { setEditingReview(review); setReviewModalOpen(true); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Review</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
                                      const { error } = await supabase.from('reviews').delete().eq('id', review.id);
                                      if (error) { toast.error('Failed to delete review'); } else { toast.success('Review deleted'); setReviews(reviews.filter(r => r.id !== review.id)); }
                                    }}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                      )}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((img, idx) => (
                            <img key={idx} src={img} alt={`Review photo ${idx + 1}`} className="h-16 w-16 object-cover rounded-xl border border-border" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {place && (
        <ReviewForm
          open={reviewModalOpen}
          onOpenChange={(open) => { setReviewModalOpen(open); if (!open) setEditingReview(null); }}
          placeId={place.id}
          itemName={place.name}
          editReview={editingReview}
          onSuccess={refreshReviews}
        />
      )}
    </div>
  );
}
