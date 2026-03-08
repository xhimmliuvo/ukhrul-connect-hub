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
  featured: { icon: Sparkles, label: 'Featured' },
  ad: { icon: Megaphone, label: 'Sponsored' },
  event: { icon: Calendar, label: 'Event' },
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

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const { icon: Icon, label } = bannerTypeConfig[currentBanner.banner_type];

  const BannerContent = (
    <div className={cn(
      "relative overflow-hidden rounded-2xl transition-all duration-300 group",
      currentBanner.image_url ? "h-40" : "gradient-primary p-5",
      className
    )}>
      {currentBanner.image_url ? (
        <>
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-foreground/20 text-primary-foreground backdrop-blur-sm">
                <Icon className="h-3 w-3" />
                {label}
              </span>
            </div>
            <h3 className="font-bold text-primary-foreground text-lg leading-tight">{currentBanner.title}</h3>
            {currentBanner.subtitle && (
              <p className="text-sm text-primary-foreground/80 mt-0.5">{currentBanner.subtitle}</p>
            )}
            {currentBanner.link_text && (
              <span className="text-sm font-semibold text-primary-foreground mt-2 inline-flex items-center gap-1">
                {currentBanner.link_text}
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-foreground/20 text-primary-foreground">
              <Icon className="h-3 w-3" />
              {label}
            </span>
          </div>
          <h3 className="font-bold text-primary-foreground text-lg">{currentBanner.title}</h3>
          {currentBanner.subtitle && (
            <p className="text-sm text-primary-foreground/80 mt-1">{currentBanner.subtitle}</p>
          )}
          {currentBanner.link_text && (
            <Button size="sm" variant="secondary" className="mt-3 rounded-xl font-semibold">
              {currentBanner.link_text}
            </Button>
          )}
        </div>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === currentIndex ? "bg-primary-foreground w-4" : "bg-primary-foreground/40 w-1.5"
              )}
              aria-label={`Go to banner ${idx + 1}`}
            />
          ))}
        </div>
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
