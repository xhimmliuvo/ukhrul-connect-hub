-- Create delivery_pricing table for dynamic fee calculation
CREATE TABLE public.delivery_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.dropee_services(id) ON DELETE CASCADE,
  base_price NUMERIC NOT NULL DEFAULT 30,
  price_per_km NUMERIC NOT NULL DEFAULT 10,
  price_per_kg NUMERIC NOT NULL DEFAULT 5,
  fragile_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  rain_multiplier NUMERIC NOT NULL DEFAULT 1.3,
  urgent_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  min_fee NUMERIC NOT NULL DEFAULT 30,
  max_fee NUMERIC NOT NULL DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_orders table (separate from dropee_orders for proper delivery tracking)
CREATE TABLE public.delivery_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  service_id UUID REFERENCES public.dropee_services(id),
  
  -- Pickup info
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  
  -- Delivery info
  delivery_address TEXT NOT NULL,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  delivery_contact_name TEXT NOT NULL,
  delivery_contact_phone TEXT NOT NULL,
  
  -- Package details
  package_description TEXT,
  weight_kg NUMERIC DEFAULT 1,
  is_fragile BOOLEAN DEFAULT false,
  
  -- Conditions
  weather_condition TEXT DEFAULT 'clear' CHECK (weather_condition IN ('clear', 'rain', 'heavy_rain')),
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'scheduled')),
  scheduled_pickup_time TIMESTAMP WITH TIME ZONE,
  
  -- Pricing breakdown (calculated by edge function)
  distance_km NUMERIC,
  base_fee NUMERIC,
  distance_fee NUMERIC,
  weight_fee NUMERIC,
  fragile_fee NUMERIC,
  weather_fee NUMERIC,
  urgency_fee NUMERIC,
  total_fee NUMERIC,
  
  -- Agent assignment
  preferred_agent_id UUID REFERENCES public.delivery_agents(id),
  assigned_agent_id UUID REFERENCES public.delivery_agents(id),
  
  -- Status and timing
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'agent_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  pickup_time TIMESTAMP WITH TIME ZONE,
  delivery_time TIMESTAMP WITH TIME ZONE,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  
  -- Proof of delivery
  proof_of_delivery_images TEXT[],
  delivery_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.delivery_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

-- Pricing policies (public read, admin write)
CREATE POLICY "Anyone can view pricing"
  ON public.delivery_pricing FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pricing"
  ON public.delivery_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Delivery orders policies
CREATE POLICY "Users can view their own orders"
  ON public.delivery_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create orders"
  ON public.delivery_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending orders"
  ON public.delivery_orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Agents can view assigned orders"
  ON public.delivery_orders FOR SELECT
  USING (
    assigned_agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
    OR
    preferred_agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update their assigned orders"
  ON public.delivery_orders FOR UPDATE
  USING (
    assigned_agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all orders"
  ON public.delivery_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_pricing_updated_at
  BEFORE UPDATE ON public.delivery_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at
  BEFORE UPDATE ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pricing for existing services
INSERT INTO public.delivery_pricing (service_id, base_price, price_per_km, price_per_kg)
SELECT id, 30, 10, 5 FROM public.dropee_services;

-- Enable realtime for delivery_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;