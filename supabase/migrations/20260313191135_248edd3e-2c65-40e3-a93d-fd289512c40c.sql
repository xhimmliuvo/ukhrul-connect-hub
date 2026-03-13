
-- Add tourist_guide and events_manager to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tourist_guide';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'events_manager';
