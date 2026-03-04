
CREATE TABLE public.api_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events text[] NOT NULL DEFAULT '{order_status_changed}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.api_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhooks" ON public.api_webhooks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active webhooks" ON public.api_webhooks
  FOR SELECT TO anon
  USING (active = true);
