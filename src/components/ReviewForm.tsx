import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReviewImageUpload } from './ReviewImageUpload';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  user_id: string;
}

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId?: string;
  placeId?: string;
  itemName: string;
  onSuccess?: () => void;
  editReview?: ReviewData | null;
}

export function ReviewForm({ 
  open, 
  onOpenChange, 
  businessId, 
  placeId, 
  itemName, 
  onSuccess,
  editReview 
}: ReviewFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
      images: [],
    },
  });

  // Reset form when editReview changes
  useEffect(() => {
    if (editReview) {
      form.reset({
        rating: editReview.rating,
        comment: editReview.comment || '',
        images: editReview.images || [],
      });
    } else {
      form.reset({
        rating: 0,
        comment: '',
        images: [],
      });
    }
  }, [editReview, form]);

  const watchedRating = form.watch('rating');
  const watchedImages = form.watch('images') || [];

  const handleSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast.error('Please sign in to submit a review');
      return;
    }

    setIsSubmitting(true);

    if (editReview) {
      // Update existing review
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: data.rating,
          comment: data.comment || null,
          images: data.images || [],
        })
        .eq('id', editReview.id);

      setIsSubmitting(false);

      if (error) {
        toast.error('Failed to update review');
        return;
      }

      toast.success('Review updated!');
    } else {
      // Insert new review
      const { error } = await supabase.from('reviews').insert({
        business_id: businessId || null,
        place_id: placeId || null,
        user_id: user.id,
        rating: data.rating,
        comment: data.comment || null,
        images: data.images || [],
      });

      setIsSubmitting(false);

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this');
        } else {
          toast.error('Failed to submit review');
        }
        return;
      }

      toast.success('Review submitted!');
    }

    form.reset();
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editReview ? 'Edit Review' : 'Write a Review'}</DialogTitle>
          <DialogDescription>
            Share your experience at {itemName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-1 transition-transform hover:scale-110"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => field.onChange(star)}
                        >
                          <Star
                            className={cn(
                              "h-8 w-8 transition-colors",
                              (hoveredRating || watchedRating) >= star
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share details about your experience..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photos (Optional)</FormLabel>
                  <FormControl>
                    <ReviewImageUpload
                      images={watchedImages}
                      onChange={field.onChange}
                      maxImages={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editReview ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  editReview ? 'Update Review' : 'Submit Review'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
