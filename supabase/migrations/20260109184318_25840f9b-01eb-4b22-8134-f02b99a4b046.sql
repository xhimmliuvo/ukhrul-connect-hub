-- Assign admin role to hashtagdropee@gmail.com
-- This uses a trigger approach so it works even if the account is created later

CREATE OR REPLACE FUNCTION public.assign_admin_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'hashtagdropee@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role_on_signup();

-- Also assign admin role if the user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'hashtagdropee@gmail.com'
ON CONFLICT DO NOTHING;