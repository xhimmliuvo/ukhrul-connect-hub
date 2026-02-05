-- Create business_offers table for daily/weekly/monthly promotions
CREATE TABLE public.business_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  offer_type text NOT NULL DEFAULT 'daily',
  discount_percentage numeric,
  discount_amount numeric,
  image text,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add constraint to ensure at least one discount type is set
ALTER TABLE public.business_offers ADD CONSTRAINT check_discount_type 
  CHECK (discount_percentage IS NOT NULL OR discount_amount IS NOT NULL);

-- Enable RLS
ALTER TABLE public.business_offers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage all offers"
  ON public.business_offers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Business owners can manage their offers"
  ON public.business_offers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = business_offers.business_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active offers"
  ON public.business_offers
  FOR SELECT
  USING (
    is_active = true 
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  );

-- Add trigger for updated_at
CREATE TRIGGER update_business_offers_updated_at
  BEFORE UPDATE ON public.business_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();