-- Create delivery_tracking table for real-time location updates
CREATE TABLE public.delivery_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.delivery_agents(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  heading numeric DEFAULT 0,
  speed numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'en_route_pickup',
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_delivery_tracking_order_id ON public.delivery_tracking(order_id);
CREATE INDEX idx_delivery_tracking_agent_id ON public.delivery_tracking(agent_id);
CREATE INDEX idx_delivery_tracking_timestamp ON public.delivery_tracking(timestamp DESC);

-- Enable RLS
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Order owners can view tracking for their orders
CREATE POLICY "Order owners can view tracking"
  ON public.delivery_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.delivery_orders WHERE user_id = auth.uid()
    )
  );

-- Assigned agents can insert tracking for their orders
CREATE POLICY "Agents can insert tracking for their orders"
  ON public.delivery_tracking
  FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
    AND order_id IN (
      SELECT id FROM public.delivery_orders WHERE assigned_agent_id = agent_id
    )
  );

-- Agents can view their own tracking records
CREATE POLICY "Agents can view their tracking"
  ON public.delivery_tracking
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to tracking"
  ON public.delivery_tracking
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Enable Realtime for delivery_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;