-- Create places table for tourism locations
CREATE TABLE public.places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES public.categories(id),
  service_area_id UUID REFERENCES public.service_areas(id),
  address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  difficulty_level TEXT,
  best_time_to_visit TEXT,
  entry_fee NUMERIC DEFAULT 0,
  opening_hours JSONB DEFAULT '{}',
  facilities TEXT[] DEFAULT '{}',
  tips TEXT,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Places are viewable by everyone"
  ON public.places FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage places"
  ON public.places FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_places_service_area ON public.places(service_area_id);
CREATE INDEX idx_places_category ON public.places(category_id);
CREATE INDEX idx_places_slug ON public.places(slug);

-- Insert sample places using existing categories
INSERT INTO public.places (name, slug, short_description, description, cover_image, category_id, service_area_id, address, rating, review_count, difficulty_level, best_time_to_visit, entry_fee, facilities, tips, featured) VALUES
  ('Shirui Peak', 'shirui-peak', 'Home of the rare Shirui Lily, offering breathtaking views', 'Shirui Peak is famous for the Shirui Lily (Lilium mackliniae), a rare flower found only here. The peak offers panoramic views of the surrounding hills and valleys. Best visited during the Shirui Lily Festival in May.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', (SELECT id FROM categories WHERE slug = 'peaks-hills'), (SELECT id FROM service_areas WHERE slug = 'shirui'), 'Shirui Village, Ukhrul', 4.9, 45, 'moderate', 'April - June', 0, ARRAY['parking', 'guide', 'restroom'], 'Start early morning for the best views. Bring warm clothes as it can be cold at the top.', true),
  ('Khayang Lake', 'khayang-lake', 'Serene natural lake surrounded by pine forests', 'A beautiful natural lake located in the heart of Ukhrul district. The crystal-clear waters reflect the surrounding pine trees, creating a picturesque setting perfect for photography and relaxation.', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', (SELECT id FROM categories WHERE slug = 'lakes'), (SELECT id FROM service_areas WHERE slug = 'hundung'), 'Hundung Area', 4.7, 28, 'easy', 'October - March', 0, ARRAY['parking', 'food', 'restroom'], 'Perfect for picnics. The lake is most beautiful during sunrise.', true),
  ('Khangkhui Cave', 'khangkhui-cave', 'Historic limestone cave with stalactites', 'An ancient limestone cave that served as a shelter during World War II. The cave features impressive stalactite and stalagmite formations and holds historical significance for the local community.', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', (SELECT id FROM categories WHERE slug = 'caves'), (SELECT id FROM service_areas WHERE slug = 'ukhrul-town'), 'Near Phungcham', 4.5, 32, 'easy', 'Year-round', 50, ARRAY['parking', 'guide', 'restroom'], 'Hire a local guide for the full historical experience. Bring a flashlight.', false),
  ('Lunghar Waterfall', 'lunghar-waterfall', 'Majestic waterfall cascading through lush greenery', 'A stunning waterfall surrounded by dense forest. The falls are most spectacular during and after the monsoon season when water flow is at its peak.', 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800', (SELECT id FROM categories WHERE slug = 'waterfalls'), (SELECT id FROM service_areas WHERE slug = 'longpi'), 'Longpi Village', 4.6, 18, 'moderate', 'July - October', 0, ARRAY['parking'], 'The trail can be slippery during monsoon. Wear appropriate footwear.', false),
  ('Nillai Tea Estate Viewpoint', 'nillai-viewpoint', 'Panoramic views of tea gardens and valleys', 'A stunning viewpoint overlooking the tea estates and surrounding valleys. Perfect spot for photography and enjoying the serene landscape of Ukhrul.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', (SELECT id FROM categories WHERE slug = 'viewpoints'), (SELECT id FROM service_areas WHERE slug = 'ukhrul-town'), 'Nillai Area', 4.4, 15, 'easy', 'Year-round', 0, ARRAY['parking', 'food'], 'Visit during sunset for the best photography opportunities.', false);