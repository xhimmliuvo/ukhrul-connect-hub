-- Add 'agent' value to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'agent';

-- Create delivery_agents table
CREATE TABLE public.delivery_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  vehicle_type TEXT NOT NULL DEFAULT 'bike' CHECK (vehicle_type IN ('bike', 'car', 'foot')),
  is_available BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_lat NUMERIC,
  current_lng NUMERIC,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  service_area_id UUID REFERENCES public.service_areas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_availability table
CREATE TABLE public.agent_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.delivery_agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shift_start TIME,
  shift_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

-- Enable RLS
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_agents
CREATE POLICY "Anyone can view active verified agents"
  ON public.delivery_agents FOR SELECT
  USING (is_active = true AND is_verified = true);

CREATE POLICY "Agents can view their own profile"
  ON public.delivery_agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Agents can update their own profile"
  ON public.delivery_agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all agents"
  ON public.delivery_agents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own agent profile"
  ON public.delivery_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agent_availability
CREATE POLICY "Anyone can view agent availability"
  ON public.agent_availability FOR SELECT
  USING (true);

CREATE POLICY "Agents can update their own availability"
  ON public.agent_availability FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can insert their own availability"
  ON public.agent_availability FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all availability"
  ON public.agent_availability FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to generate unique agent code
CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_code := 'DRP' || LPAD(counter::TEXT, 3, '0');
    SELECT EXISTS(SELECT 1 FROM public.delivery_agents WHERE agent_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
    counter := counter + 1;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate agent_code on insert
CREATE OR REPLACE FUNCTION public.set_agent_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_code IS NULL OR NEW.agent_code = '' THEN
    NEW.agent_code := public.generate_agent_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_set_agent_code
  BEFORE INSERT ON public.delivery_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agent_code();

-- Trigger to auto-create availability record when agent is created
CREATE OR REPLACE FUNCTION public.create_agent_availability()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agent_availability (agent_id, status)
  VALUES (NEW.id, 'offline');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_agent_availability
  AFTER INSERT ON public.delivery_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.create_agent_availability();

-- Update timestamp trigger
CREATE TRIGGER update_delivery_agents_updated_at
  BEFORE UPDATE ON public.delivery_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_availability_updated_at
  BEFORE UPDATE ON public.agent_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for agent availability
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_availability;