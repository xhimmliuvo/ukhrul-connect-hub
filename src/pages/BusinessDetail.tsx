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
  Phone,
  MessageCircle,
  MapPin,
  Globe,
  BadgeCheck,
  Share2,
  Navigation,
  Truck,
  Pencil,
  Trash2,
  Clock,
  ChevronRight,
} from 'lucide-react';
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
import { ProductsSection } from '@/components/business/ProductsSection';
import { BookingSection } from '@/components/business/BookingSection';
import { AgencyWorkflowSection } from '@/components/business/AgencyWorkflowSection';
import { DropeeOrderModal } from '@/components/business/DropeeOrderModal';
import { ReviewForm, ReviewData } from '@/components/ReviewForm';

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image: string | null;
  images: string[];
  rating: number;
  review_count: number;
  verified: boolean;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  location_lat: number | null;
  location_lng: number | null;
  business_type: string;
  has_products: boolean;
  can_take_bookings: boolean;
  categories: {
    name: string;
    slug: string;
    color: string | null;
  } | null;
  service_areas: {
    name: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  image: string | null;
  category: string | null;
}

interface Package {
  id: string;
  name: string;
  description: string | null;
  starting_price: number | null;
  image: string | null;
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

interface BusinessOffer {
  id: string;
  title: string;
  description: string | null;
  offer_type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  image: string | null;
  valid_until: string | null;
}

export default function BusinessDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedItems();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [offers, setOffers] = useState<BusinessOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropeeModalOpen, setDropeeModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function fetchBusiness() {
      if (!slug) return;

      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id, name, slug, description, short_description, cover_image, images,
          rating, review_count, verified, address, phone, whatsapp, email, website,
          location_lat, location_lng, business_type, has_products, can_take_bookings,
          categories (name, slug, color),
          service_areas (name)
        `)
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business:', error);
        toast.error('Failed to load business');
        return;
      }

      if (data) {
        setBusiness(data as Business);

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating, comment, images, created_at, user_id')
          .eq('business_id', data.id)
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

        if (data.has_products) {
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name, description, price, discount_price, image, category')
            .eq('business_id', data.id)
            .eq('available', true);
          setProducts(productsData || []);
        }

        if (data.business_type === 'agency') {
          const { data: packagesData } = await supabase
            .from('popular_packages')
            .select('id, name, description, starting_price, image')
            .eq('business_id', data.id);
          setPackages(packagesData || []);
        }

        const { data: offersData } = await supabase
          .from('business_offers')
          .select('id, title, description, offer_type, discount_percentage, discount_amount, image, valid_until')
          .eq('business_id', data.id)
          .eq('is_active', true)
          .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        setOffers(offersData || []);
      }
      
      setLoading(false);
    }

    fetchBusiness();
  }, [slug]);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save businesses');
      return;
    }
    if (!business) return;
    const { error } = await toggleSave('business', business.id);
    if (error) {
      toast.error('Failed to update saved items');
    } else {
      toast.success(isSaved('business', business.id) ? 'Removed from saved' : 'Saved!');
    }
  };

  const handleCall = () => {
    if (business?.phone) window.location.href = `tel:${business.phone}`;
  };

  const handleWhatsApp = () => {
    if (business?.whatsapp) {
      const phone = business.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  const handleDirections = () => {
    if (business?.location_lat && business?.location_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.location_lat},${business.location_lng}`, '_blank');
    } else if (business?.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: business?.name, text: business?.short_description || '', url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleProductOrder = () => setDropeeModalOpen(true);

  const handleBookSlot = (booking: { date: Date; timeSlot: string; people: number; rooms?: number }) => {
    toast.success(`Booking request for ${booking.people} people on ${booking.date.toLocaleDateString()}`);
  };

  const allImages = business ? [business.cover_image, ...(business.images || [])].filter(Boolean) as string[] : [];

  const renderDynamicSection = () => {
    if (!business) return null;
    const businessType = business.business_type as 'product' | 'cafe' | 'restaurant' | 'hotel' | 'agency';

    if (businessType === 'product' || business.has_products) {
      return (
        <section className="glass rounded-2xl p-5">
          <ProductsSection 
            products={products} 
            onOrderProduct={handleProductOrder}
            businessName={business.name}
            businessPhone={business.phone}
            businessWhatsapp={business.whatsapp}
          />
        </section>
      );
    }

    if (['cafe', 'restaurant', 'hotel'].includes(businessType) && business.can_take_bookings) {
      return (
        <section className="glass rounded-2xl p-5">
          <BookingSection 
            businessType={businessType as 'cafe' | 'restaurant' | 'hotel'}
            onBookSlot={handleBookSlot}
            businessName={business.name}
            businessPhone={business.phone}
            businessWhatsapp={business.whatsapp}
            onBookViaDropee={() => setDropeeModalOpen(true)}
          />
        </section>
      );
    }

    if (businessType === 'agency') {
      return (
        <section className="glass rounded-2xl p-5">
          <AgencyWorkflowSection
            packages={packages}
            onContactAgency={() => setDropeeModalOpen(true)}
            onSelectPackage={() => setDropeeModalOpen(true)}
          />
        </section>
      );
    }

    return null;
  };

  const refreshReviews = async () => {
    if (!business) return;
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment, images, created_at, user_id')
      .eq('business_id', business.id)
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
  };

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

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-foreground">Business not found</h1>
          <Link to="/businesses">
            <Button variant="outline" className="rounded-xl">Browse businesses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const saved = isSaved('business', business.id);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Hero */}
      <div className="relative h-80 bg-muted overflow-hidden">
        {allImages.length > 0 ? (
          <img
            src={allImages[activeImageIndex] || allImages[0]}
            alt={business.name}
            className="w-full h-full object-cover transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <MapPin className="h-20 w-20 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />

        {/* Floating nav bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Link to="/businesses">
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
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === activeImageIndex ? "w-6 bg-primary" : "w-1.5 bg-foreground/40"
                )}
              />
            ))}
          </div>
        )}

        {/* Hero bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {business.categories && (
                  <Badge variant="secondary" className="rounded-lg text-xs font-semibold backdrop-blur-sm bg-secondary/80">
                    {business.categories.name}
                  </Badge>
                )}
                {business.service_areas && (
                  <Badge variant="outline" className="rounded-lg text-xs backdrop-blur-sm bg-background/40 border-border/40">
                    <MapPin className="h-3 w-3 mr-1" />
                    {business.service_areas.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                {business.name}
                {business.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
              </h1>
            </div>
            {business.review_count > 0 && (
              <div className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 shrink-0">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-foreground">{Number(business.rating).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({business.review_count})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 space-y-5 mt-5">
        {/* Description */}
        {business.short_description && (
          <p className="text-muted-foreground leading-relaxed">{business.short_description}</p>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {business.phone && (
            <button onClick={handleCall} className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:bg-primary/5 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Call</span>
            </button>
          )}
          {business.whatsapp && (
            <button onClick={handleWhatsApp} className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:bg-primary/5 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-foreground">Chat</span>
            </button>
          )}
          <button onClick={handleDirections} className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:bg-primary/5 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-foreground">Map</span>
          </button>
          <button onClick={() => setDropeeModalOpen(true)} className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:bg-accent/10 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Dropee</span>
          </button>
        </div>

        {/* Active Offers */}
        {offers.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">🎉 Special Offers</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
              {offers.map((offer) => (
                <div 
                  key={offer.id}
                  className="glass rounded-2xl p-4 min-w-[260px] max-w-[300px] flex-shrink-0 border-primary/10"
                >
                  <div className="flex items-start gap-3">
                    {offer.image && (
                      <img src={offer.image} alt={offer.title} className="h-14 w-14 object-cover rounded-xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm truncate">{offer.title}</h4>
                      {offer.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{offer.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-primary text-primary-foreground text-xs rounded-lg">
                          {offer.discount_percentage ? `${offer.discount_percentage}% OFF` : `₹${offer.discount_amount} OFF`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {business.description && (
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-bold text-foreground">About</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{business.description}</p>
          </section>
        )}

        {/* Dynamic Section */}
        {renderDynamicSection()}

        {/* Contact & Location */}
        <section className="glass rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Contact & Location</h2>
          <div className="space-y-3">
            {business.address && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{business.address}</p>
                  {business.service_areas && (
                    <p className="text-xs text-muted-foreground">{business.service_areas.name}</p>
                  )}
                </div>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <a href={`tel:${business.phone}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  {business.phone}
                </a>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                  Visit website
                </a>
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full rounded-xl gap-2 mt-2" onClick={handleDirections}>
            <Navigation className="h-4 w-4" />
            Open in Google Maps
          </Button>
        </section>

        {/* Reviews Section */}
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
          {business.review_count > 0 && (
            <div className="glass rounded-2xl p-5 flex items-center gap-5">
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">{Number(business.rating).toFixed(1)}</p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(business.rating) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{business.review_count} reviews</p>
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
              <p className="text-sm text-muted-foreground mt-1">Be the first to review!</p>
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

      <DropeeOrderModal
        isOpen={dropeeModalOpen}
        onClose={() => setDropeeModalOpen(false)}
        business={{ id: business.id, name: business.name, business_type: business.business_type }}
        products={products}
        packages={packages}
      />

      <ReviewForm
        open={reviewModalOpen}
        onOpenChange={(open) => { setReviewModalOpen(open); if (!open) setEditingReview(null); }}
        businessId={business.id}
        itemName={business.name}
        editReview={editingReview}
        onSuccess={refreshReviews}
      />
    </div>
  );
}
