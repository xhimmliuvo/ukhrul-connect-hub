-- Add promo_code column to delivery_orders table
ALTER TABLE public.delivery_orders
ADD COLUMN promo_code text;