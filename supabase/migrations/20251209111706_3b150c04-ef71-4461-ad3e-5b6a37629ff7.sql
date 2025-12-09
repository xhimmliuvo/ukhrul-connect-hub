-- Create promotional_banners table
CREATE TABLE public.promotional_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Learn More',
  banner_type TEXT NOT NULL DEFAULT 'featured' CHECK (banner_type IN ('featured', 'ad', 'event')),
  page_placement TEXT NOT NULL DEFAULT 'explore' CHECK (page_placement IN ('explore', 'places', 'events', 'all')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Banners are viewable by everyone" 
ON public.promotional_banners 
FOR SELECT 
USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

CREATE POLICY "Admins can manage banners" 
ON public.promotional_banners 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_promotional_banners_active ON public.promotional_banners(is_active, page_placement, display_order);

-- Add trigger for updated_at
CREATE TRIGGER update_promotional_banners_updated_at
BEFORE UPDATE ON public.promotional_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample banners
INSERT INTO public.promotional_banners (title, subtitle, image_url, link_url, banner_type, page_placement, display_order) VALUES
('Discover Hidden Gems', 'Explore the unexplored trails of Ukhrul', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', '/places', 'featured', 'explore', 1),
('Shirui Lily Festival 2024', 'Join us for the annual celebration', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800', '/events', 'event', 'explore', 2),
('Local Artisan Crafts', 'Support local businesses', 'https://images.unsplash.com/photo-1528396518501-b53b655eb9b3?w=800', '/businesses', 'ad', 'places', 1);