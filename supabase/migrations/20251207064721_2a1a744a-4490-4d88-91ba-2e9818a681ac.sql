-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_area_id UUID REFERENCES public.service_areas(id),
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  images TEXT[] DEFAULT '{}',
  cover_image TEXT,
  opening_hours JSONB DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved items table (for bookmarks)
CREATE TABLE public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('business', 'product', 'place', 'event')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Businesses Policies
CREATE POLICY "Businesses are viewable by everyone"
  ON public.businesses FOR SELECT
  USING (active = true);

CREATE POLICY "Business owners can update their business"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Business owners can insert business"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all businesses"
  ON public.businesses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Saved Items Policies
CREATE POLICY "Users can view own saved items"
  ON public.saved_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can save items"
  ON public.saved_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave items"
  ON public.saved_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update business rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.businesses
    SET 
      rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE business_id = OLD.business_id), 0),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE business_id = OLD.business_id)
    WHERE id = OLD.business_id;
    RETURN OLD;
  ELSE
    UPDATE public.businesses
    SET 
      rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE business_id = NEW.business_id), 0),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE business_id = NEW.business_id)
    WHERE id = NEW.business_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger for rating updates
CREATE TRIGGER update_business_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_rating();

-- Trigger for business updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_businesses_service_area ON public.businesses(service_area_id);
CREATE INDEX idx_businesses_category ON public.businesses(category_id);
CREATE INDEX idx_businesses_rating ON public.businesses(rating DESC);
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_reviews_business ON public.reviews(business_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_saved_items_user ON public.saved_items(user_id);
CREATE INDEX idx_saved_items_item ON public.saved_items(item_type, item_id);