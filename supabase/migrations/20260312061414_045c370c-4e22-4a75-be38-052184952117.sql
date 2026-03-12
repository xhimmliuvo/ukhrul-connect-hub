
-- Allow business owners to view their own businesses regardless of active status
CREATE POLICY "Owners can view own businesses" ON public.businesses
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Allow events managers to manage events they created via manager_id
CREATE POLICY "Event managers can manage their events" ON public.events
  FOR ALL TO authenticated
  USING (manager_id = auth.uid());
