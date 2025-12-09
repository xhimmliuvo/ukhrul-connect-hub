-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue TEXT,
  address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  entry_fee NUMERIC DEFAULT 0,
  organizer TEXT,
  organizer_contact TEXT,
  category_id UUID REFERENCES public.categories(id),
  service_area_id UUID REFERENCES public.service_areas(id),
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_events_service_area ON public.events(service_area_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_featured ON public.events(featured) WHERE featured = true;
CREATE INDEX idx_events_slug ON public.events(slug);

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample events
INSERT INTO public.events (name, slug, short_description, description, event_date, start_time, venue, address, organizer, featured, service_area_id)
SELECT 
  'Shirui Lily Festival 2025',
  'shirui-lily-festival-2025',
  'Annual celebration of the rare Shirui Lily flower',
  'The Shirui Lily Festival celebrates the blooming of the rare Shirui Lily (Lilium mackliniae), found only on Shirui Peak. Enjoy cultural performances, local cuisine, and guided treks to see the lilies.',
  '2025-05-15',
  '09:00',
  'Shirui Village Ground',
  'Shirui Village, Ukhrul',
  'Ukhrul District Administration',
  true,
  id
FROM public.service_areas WHERE slug = 'ukhrul' LIMIT 1;

INSERT INTO public.events (name, slug, short_description, description, event_date, start_time, venue, address, organizer, featured, service_area_id)
SELECT 
  'Tangkhul Naga Community Feast',
  'tangkhul-naga-community-feast',
  'Traditional community gathering with authentic Tangkhul cuisine',
  'Experience the warmth of Tangkhul hospitality at this community feast. Taste traditional dishes, witness cultural performances, and connect with the local community.',
  '2025-03-20',
  '11:00',
  'Community Hall',
  'Ukhrul Town',
  'Tangkhul Naga Long',
  false,
  id
FROM public.service_areas WHERE slug = 'ukhrul' LIMIT 1;

INSERT INTO public.events (name, slug, short_description, description, event_date, start_time, venue, address, organizer, service_area_id)
SELECT 
  'Local Farmers Market',
  'local-farmers-market-march',
  'Weekly farmers market featuring fresh local produce',
  'Shop for fresh organic vegetables, traditional spices, handmade crafts, and local delicacies directly from farmers and artisans.',
  '2025-03-15',
  '07:00',
  'Main Market Area',
  'Ukhrul Town Center',
  'Ukhrul Farmers Cooperative',
  id
FROM public.service_areas WHERE slug = 'ukhrul' LIMIT 1;