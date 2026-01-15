-- Create agent_order_responses table for tracking accept/decline/counter offers
CREATE TABLE public.agent_order_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.delivery_agents(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('accepted', 'declined', 'counter_offer')),
  proposed_fee NUMERIC,
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, agent_id)
);

-- Add agent_adjusted_fee column to delivery_orders
ALTER TABLE public.delivery_orders 
ADD COLUMN agent_adjusted_fee NUMERIC,
ADD COLUMN fee_adjustment_reason TEXT;

-- Enable RLS
ALTER TABLE public.agent_order_responses ENABLE ROW LEVEL SECURITY;

-- Agents can view and create their own responses
CREATE POLICY "Agents can view their responses"
  ON public.agent_order_responses FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can create responses"
  ON public.agent_order_responses FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM public.delivery_agents WHERE user_id = auth.uid()
    )
  );

-- Users can view responses to their orders
CREATE POLICY "Users can view responses to their orders"
  ON public.agent_order_responses FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.delivery_orders WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all responses
CREATE POLICY "Admins can manage all responses"
  ON public.agent_order_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Enable realtime for agent_order_responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_order_responses;