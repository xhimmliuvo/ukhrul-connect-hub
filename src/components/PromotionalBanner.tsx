import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Sparkles, Megaphone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromotionalBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  banner_type: 'featured' | 'ad' | 'event';
  page_placement: string;
  display_order: number;
}

interface PromotionalBannerProps {
  page: 'explore' | 'places' | 'events';
  className?: string;
}

const bannerTypeConfig = {
  featured: { icon: Sparkles, label: 'Featured', color: 'bg-primary/10 text-primary' },
  ad: { icon: Megaphone, label: 'Sponsored', color: 'bg-accent/10 text-accent-foreground' },
  event: { icon: Calendar, label: 'Event', color: 'bg-secondary text-secondary-foreground' },
};

export function PromotionalBanner({ page, className }: PromotionalBannerProps) {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanners() {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .or(`page_placement.eq.${page},page_placement.eq.all`)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setBanners(data as PromotionalBanner[]);
      }
      setLoading(false);
    }

    fetchBanners();
  }, [page]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const { icon: Icon, label, color } = bannerTypeConfig[currentBanner.banner_type];

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const BannerContent = (
    <div className={cn(
      "relative overflow-hidden rounded-lg bg-card border transition-all duration-300 hover:shadow-md",
      className
    )}>
      <div className="flex items-center gap-4 p-4">
        {/* Image */}
        {currentBanner.image_url && (
          <div className="hidden sm:block flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", color)}>
              <Icon className="h-3 w-3" />
              {label}
            </span>
          </div>
          <h3 className="font-medium text-foreground truncate">{currentBanner.title}</h3>
          {currentBanner.subtitle && (
            <p className="text-sm text-muted-foreground truncate">{currentBanner.subtitle}</p>
          )}
        </div>

        {/* CTA */}
        {currentBanner.link_text && (
          <Button variant="ghost" size="sm" className="flex-shrink-0 text-primary">
            {currentBanner.link_text}
          </Button>
        )}
      </div>

      {/* Navigation dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                idx === currentIndex ? "bg-primary w-3" : "bg-muted-foreground/30"
              )}
              aria-label={`Go to banner ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Arrow navigation for multiple banners */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background/80 hover:bg-background shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background/80 hover:bg-background shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next banner"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </>
      )}
    </div>
  );

  if (currentBanner.link_url) {
    return (
      <Link to={currentBanner.link_url} className="block group">
        {BannerContent}
      </Link>
    );
  }

  return <div className="group">{BannerContent}</div>;
}
