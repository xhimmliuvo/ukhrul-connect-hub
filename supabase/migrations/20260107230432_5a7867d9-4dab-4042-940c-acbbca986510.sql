-- Add place_id column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN place_id uuid REFERENCES public.places(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_reviews_place_id ON public.reviews(place_id);

-- Create trigger to update place rating when reviews change
CREATE OR REPLACE FUNCTION public.update_place_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.place_id IS NOT NULL THEN
      UPDATE public.places
      SET 
        rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE place_id = OLD.place_id), 0),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE place_id = OLD.place_id)
      WHERE id = OLD.place_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.place_id IS NOT NULL THEN
      UPDATE public.places
      SET 
        rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE place_id = NEW.place_id), 0),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE place_id = NEW.place_id)
      WHERE id = NEW.place_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER update_place_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_place_rating();