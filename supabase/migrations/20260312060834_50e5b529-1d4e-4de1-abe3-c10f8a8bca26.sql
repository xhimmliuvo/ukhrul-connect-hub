
-- Tour bookings table for guide panel
CREATE TABLE public.tour_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES public.guide_profiles(id) ON DELETE CASCADE,
  tourist_user_id UUID NOT NULL,
  tour_date DATE NOT NULL,
  tour_time TIME,
  group_size INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view their bookings" ON public.tour_bookings
  FOR SELECT TO authenticated
  USING (guide_id IN (SELECT id FROM public.guide_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Guides can update their bookings" ON public.tour_bookings
  FOR UPDATE TO authenticated
  USING (guide_id IN (SELECT id FROM public.guide_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tourists can view their bookings" ON public.tour_bookings
  FOR SELECT TO authenticated
  USING (tourist_user_id = auth.uid());

CREATE POLICY "Tourists can create bookings" ON public.tour_bookings
  FOR INSERT TO authenticated
  WITH CHECK (tourist_user_id = auth.uid());

CREATE POLICY "Admins full access to bookings" ON public.tour_bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Chat messages table for guide-tourist communication
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can view messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    booking_id IN (
      SELECT tb.id FROM public.tour_bookings tb
      JOIN public.guide_profiles gp ON gp.id = tb.guide_id
      WHERE gp.user_id = auth.uid() OR tb.tourist_user_id = auth.uid()
    )
  );

CREATE POLICY "Booking participants can send messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    booking_id IN (
      SELECT tb.id FROM public.tour_bookings tb
      JOIN public.guide_profiles gp ON gp.id = tb.guide_id
      WHERE gp.user_id = auth.uid() OR tb.tourist_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (
    booking_id IN (
      SELECT tb.id FROM public.tour_bookings tb
      JOIN public.guide_profiles gp ON gp.id = tb.guide_id
      WHERE gp.user_id = auth.uid() OR tb.tourist_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access to messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_bookings;

-- Add event_manager_id to events for direct event management
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS manager_id UUID;

-- Add verified column to businesses for approval workflow
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
