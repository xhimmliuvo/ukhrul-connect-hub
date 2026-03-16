
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send WhatsApp notification via edge function
CREATE OR REPLACE FUNCTION public.notify_admin_whatsapp_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/notify-admin-whatsapp',
    body := jsonb_build_object(
      'order_type', 'delivery',
      'order_id', NEW.id,
      'details', 'From: ' || NEW.pickup_address || E'\nTo: ' || NEW.delivery_address || E'\nContact: ' || NEW.pickup_contact_phone
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )::jsonb
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_whatsapp_dropee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/notify-admin-whatsapp',
    body := jsonb_build_object(
      'order_type', 'dropee',
      'order_id', NEW.id,
      'details', 'Business: ' || NEW.business_name || E'\nType: ' || NEW.order_type || E'\nContact: ' || NEW.user_contact
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )::jsonb
  );
  RETURN NEW;
END;
$$;

-- Triggers for WhatsApp notifications
CREATE TRIGGER on_new_delivery_order_whatsapp
  AFTER INSERT ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_whatsapp_delivery();

CREATE TRIGGER on_new_dropee_order_whatsapp
  AFTER INSERT ON public.dropee_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_whatsapp_dropee();
