
-- Function to notify admin users when a new delivery order is created
CREATE OR REPLACE FUNCTION public.notify_admin_new_delivery_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      admin_record.user_id,
      'New Delivery Order',
      'From: ' || NEW.pickup_address || ' → ' || NEW.delivery_address,
      'order',
      jsonb_build_object('order_id', NEW.id, 'order_type', 'delivery', 'status', NEW.status)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Function to notify admin users when a new dropee order is created
CREATE OR REPLACE FUNCTION public.notify_admin_new_dropee_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      admin_record.user_id,
      'New Order: ' || NEW.business_name,
      NEW.order_type || ' order from ' || NEW.user_contact,
      'order',
      jsonb_build_object('order_id', NEW.id, 'order_type', 'dropee', 'business_name', NEW.business_name)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger on delivery_orders
CREATE TRIGGER on_new_delivery_order_notify_admin
  AFTER INSERT ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_delivery_order();

-- Trigger on dropee_orders
CREATE TRIGGER on_new_dropee_order_notify_admin
  AFTER INSERT ON public.dropee_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_dropee_order();
