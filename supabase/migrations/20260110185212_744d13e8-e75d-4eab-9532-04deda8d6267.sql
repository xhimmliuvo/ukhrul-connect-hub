-- Create dropee_services table
CREATE TABLE public.dropee_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Package',
  price TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  service_area_id UUID REFERENCES public.service_areas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dropee_services ENABLE ROW LEVEL SECURITY;

-- Public read access for active services
CREATE POLICY "Anyone can view active services"
ON public.dropee_services
FOR SELECT
USING (active = true);

-- Admin full access
CREATE POLICY "Admins can manage services"
ON public.dropee_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_dropee_services_updated_at
BEFORE UPDATE ON public.dropee_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial services
INSERT INTO public.dropee_services (name, slug, description, icon, price, display_order) VALUES
('Food Delivery', 'food-delivery', 'Get food from your favorite restaurants delivered to your doorstep', 'UtensilsCrossed', 'Starting from ₹30', 1),
('Grocery Pickup', 'grocery-pickup', 'We pick up groceries from the market and deliver to you', 'ShoppingBasket', 'Starting from ₹50', 2),
('Document Delivery', 'document-delivery', 'Safe and secure document pickup and delivery service', 'FileText', 'Starting from ₹40', 3),
('Parcel Service', 'parcel-service', 'Send packages within Ukhrul district quickly and safely', 'Package', 'Starting from ₹60', 4);