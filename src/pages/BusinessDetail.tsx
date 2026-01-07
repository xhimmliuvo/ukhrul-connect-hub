import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedItems } from '@/hooks/useSavedItems';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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
} from 'lucide-react';
import { ProductsSection } from '@/components/business/ProductsSection';
import { BookingSection } from '@/components/business/BookingSection';
import { AgencyWorkflowSection } from '@/components/business/AgencyWorkflowSection';
import { DropeeOrderModal } from '@/components/business/DropeeOrderModal';
import { ReviewForm } from '@/components/ReviewForm';

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
  created_at: string;
  user_id: string;
}

export default function BusinessDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedItems();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropeeModalOpen, setDropeeModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

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

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, user_id')
          .eq('business_id', data.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setReviews(reviewsData || []);

        // Fetch products if applicable
        if (data.has_products) {
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name, description, price, discount_price, image, category')
            .eq('business_id', data.id)
            .eq('available', true);

          setProducts(productsData || []);
        }

        // Fetch packages for agencies
        if (data.business_type === 'agency') {
          const { data: packagesData } = await supabase
            .from('popular_packages')
            .select('id, name, description, starting_price, image')
            .eq('business_id', data.id);

          setPackages(packagesData || []);
        }
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
    if (business?.phone) {
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (business?.whatsapp) {
      const phone = business.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  const handleDirections = () => {
    if (business?.location_lat && business?.location_lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${business.location_lat},${business.location_lng}`,
        '_blank'
      );
    } else if (business?.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`,
        '_blank'
      );
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business?.name,
          text: business?.short_description || '',
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

  const handleProductOrder = (product: Product) => {
    setDropeeModalOpen(true);
  };

  const handleBookSlot = (booking: { date: Date; timeSlot: string; people: number; rooms?: number }) => {
    toast.success(`Booking request for ${booking.people} people on ${booking.date.toLocaleDateString()}`);
  };

  const renderDynamicSection = () => {
    if (!business) return null;

    const businessType = business.business_type as 'product' | 'cafe' | 'restaurant' | 'hotel' | 'agency';

    // Products section for product businesses or businesses with products
    if (businessType === 'product' || business.has_products) {
      return (
        <Card>
          <CardContent className="p-6">
            <ProductsSection 
              products={products} 
              onOrderProduct={handleProductOrder}
            />
          </CardContent>
        </Card>
      );
    }

    // Booking section for cafes, restaurants, hotels
    if (['cafe', 'restaurant', 'hotel'].includes(businessType) && business.can_take_bookings) {
      return (
        <Card>
          <CardContent className="p-6">
            <BookingSection 
              businessType={businessType as 'cafe' | 'restaurant' | 'hotel'}
              onBookSlot={handleBookSlot}
            />
          </CardContent>
        </Card>
      );
    }

    // Agency workflow section
    if (businessType === 'agency') {
      return (
        <Card>
          <CardContent className="p-6">
            <AgencyWorkflowSection
              packages={packages}
              onContactAgency={() => setDropeeModalOpen(true)}
              onSelectPackage={() => setDropeeModalOpen(true)}
            />
          </CardContent>
        </Card>
      );
    }

    return null;
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

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Business not found</h1>
          <Link to="/businesses">
            <Button variant="outline">Browse businesses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const saved = isSaved('business', business.id);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Hero Image */}
      <div className="relative h-64 bg-muted">
        {business.cover_image ? (
          <img
            src={business.cover_image}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Back button */}
        <Link to="/businesses" className="absolute top-4 left-4">
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
        {/* Business Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-foreground">{business.name}</h1>
                  {business.verified && (
                    <BadgeCheck className="h-6 w-6 text-primary" />
                  )}
                </div>
                
                {business.categories && (
                  <Badge variant="secondary" className="mt-2">
                    {business.categories.name}
                  </Badge>
                )}
              </div>

              {/* Rating */}
              {business.review_count > 0 && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    <span className="text-xl font-bold text-foreground">
                      {Number(business.rating).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {business.review_count} reviews
                  </span>
                </div>
              )}
            </div>

            {business.short_description && (
              <p className="mt-4 text-muted-foreground">
                {business.short_description}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 mt-6 flex-wrap">
              {business.phone && (
                <Button className="flex-1 min-w-[100px] gap-2" onClick={handleCall}>
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
              )}
              {business.whatsapp && (
                <Button variant="outline" className="flex-1 min-w-[100px] gap-2" onClick={handleWhatsApp}>
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              )}
              <Button 
                variant="default" 
                className="flex-1 min-w-[140px] gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => setDropeeModalOpen(true)}
              >
                <Truck className="h-4 w-4" />
                Order with #Dropee
              </Button>
              <Button variant="outline" size="icon" onClick={handleDirections}>
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {business.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground whitespace-pre-line">
                {business.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Section based on business type */}
        {renderDynamicSection()}

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact & Location</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {business.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-foreground">{business.address}</p>
                  {business.service_areas && (
                    <p className="text-sm text-muted-foreground">
                      {business.service_areas.name}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {business.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a href={`tel:${business.phone}`} className="text-foreground hover:text-primary">
                  {business.phone}
                </a>
              </div>
            )}

            {business.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Visit website
                </a>
              </div>
            )}
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
              <p className="text-muted-foreground text-center py-6">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id}>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">User</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="text-sm font-medium">{review.rating}</span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dropee Order Modal */}
      <DropeeOrderModal
        isOpen={dropeeModalOpen}
        onClose={() => setDropeeModalOpen(false)}
        business={{
          id: business.id,
          name: business.name,
          business_type: business.business_type,
        }}
        products={products}
        packages={packages}
      />

      {/* Review Modal */}
      <ReviewForm
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        businessId={business.id}
        businessName={business.name}
        onSuccess={async () => {
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at, user_id')
            .eq('business_id', business.id)
            .order('created_at', { ascending: false })
            .limit(10);
          setReviews(reviewsData || []);
        }}
      />
    </div>
  );
}
