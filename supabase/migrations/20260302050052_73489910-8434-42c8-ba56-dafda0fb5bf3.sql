
-- Create a table for guide profiles
CREATE TABLE public.guide_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  bio text,
  languages text[] DEFAULT '{}',
  specialties text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  is_available boolean DEFAULT false,
  rating numeric DEFAULT 0,
  total_tours integer DEFAULT 0,
  service_area_id uuid REFERENCES public.service_areas(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.guide_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all guides" ON public.guide_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Guides can view own profile" ON public.guide_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Guides can update own profile" ON public.guide_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Guides can insert own profile" ON public.guide_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view verified guides" ON public.guide_profiles FOR SELECT USING (is_verified = true);

-- Create managed events table
CREATE TABLE public.managed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role text DEFAULT 'manager',
  created_at timestamptz DEFAULT now(),
  UNIQUE(manager_id, event_id)
);

ALTER TABLE public.managed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all" ON public.managed_events FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can view own" ON public.managed_events FOR SELECT USING (auth.uid() = manager_id);
CREATE POLICY "Managers can insert own" ON public.managed_events FOR INSERT WITH CHECK (auth.uid() = manager_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type text DEFAULT 'general',
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Enable realtime for notifications only (delivery_orders already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger for guide profile on role assignment
CREATE OR REPLACE FUNCTION public.create_guide_on_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  IF NEW.role = 'tourist_guide' THEN
    SELECT full_name, phone, avatar_url INTO profile_record
    FROM public.profiles WHERE id = NEW.user_id;
    
    INSERT INTO public.guide_profiles (user_id, full_name, phone, avatar_url)
    VALUES (NEW.user_id, COALESCE(profile_record.full_name, 'Guide'), profile_record.phone, profile_record.avatar_url)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tourist_guide_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_guide_on_role_assignment();
