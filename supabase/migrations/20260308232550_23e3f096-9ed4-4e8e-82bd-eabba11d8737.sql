ALTER TABLE public.delivery_orders ADD COLUMN hub_order_id text;
ALTER TABLE public.delivery_orders ADD COLUMN hub_status text DEFAULT 'pending';