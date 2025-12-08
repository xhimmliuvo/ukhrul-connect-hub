-- Add new columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'product',
ADD COLUMN IF NOT EXISTS has_products boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_take_bookings boolean DEFAULT false;

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  discount_price NUMERIC(10,2),
  image TEXT,
  category TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create popular_packages table for agencies
CREATE TABLE public.popular_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  starting_price NUMERIC(10,2),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create dropee_orders table
CREATE TABLE public.dropee_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('product', 'food', 'booking', 'tour')),
  details JSONB NOT NULL DEFAULT '{}',
  user_contact TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropee_orders ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, owner write)
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (available = true);

CREATE POLICY "Business owners can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Popular packages policies (public read, owner write)
CREATE POLICY "Packages are viewable by everyone" ON public.popular_packages
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage packages" ON public.popular_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Dropee orders policies
CREATE POLICY "Users can view own orders" ON public.dropee_orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create orders" ON public.dropee_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all orders" ON public.dropee_orders
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update orders" ON public.dropee_orders
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_packages_business_id ON public.popular_packages(business_id);
CREATE INDEX idx_dropee_orders_business_id ON public.dropee_orders(business_id);
CREATE INDEX idx_dropee_orders_user_id ON public.dropee_orders(user_id);
CREATE INDEX idx_dropee_orders_status ON public.dropee_orders(status);

-- Trigger for updated_at on products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on dropee_orders
CREATE TRIGGER update_dropee_orders_updated_at
  BEFORE UPDATE ON public.dropee_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing businesses with appropriate types based on category
UPDATE public.businesses b
SET 
  business_type = CASE 
    WHEN c.slug IN ('cafes', 'coffee-shops') THEN 'cafe'
    WHEN c.slug IN ('restaurants', 'food', 'eateries') THEN 'restaurant'
    WHEN c.slug IN ('hotels', 'homestays', 'lodging', 'accommodation') THEN 'hotel'
    WHEN c.slug IN ('travel', 'tourism', 'tours', 'agencies') THEN 'agency'
    ELSE 'product'
  END,
  has_products = CASE 
    WHEN c.slug IN ('shops', 'retail', 'grocery', 'cafes', 'restaurants') THEN true
    ELSE false
  END,
  can_take_bookings = CASE 
    WHEN c.slug IN ('hotels', 'homestays', 'cafes', 'restaurants', 'travel', 'tourism') THEN true
    ELSE false
  END
FROM public.categories c
WHERE b.category_id = c.id;