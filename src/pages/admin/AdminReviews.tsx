import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Star, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user_id: string;
  business_id: string | null;
  created_at: string | null;
  helpful_count: number | null;
  images: string[] | null;
  user_name?: string;
  business_name?: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load reviews');
      setLoading(false);
      return;
    }

    // Fetch business and user names
    const reviewsWithNames = await Promise.all(
      (data || []).map(async (review) => {
        let businessName = 'Unknown Business';
        let userName = 'Unknown User';

        if (review.business_id) {
          const { data: business } = await supabase
            .from('businesses')
            .select('name')
            .eq('id', review.business_id)
            .single();
          if (business) businessName = business.name;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', review.user_id)
          .single();
        if (profile?.full_name) userName = profile.full_name;

        return {
          ...review,
          business_name: businessName,
          user_name: userName,
        };
      })
    );

    setReviews(reviewsWithNames);
    setLoading(false);
  }

  async function handleDelete() {
    if (!selectedReview) return;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', selectedReview.id);

    if (error) {
      toast.error('Failed to delete review');
    } else {
      toast.success('Review deleted');
      setDeleteDialogOpen(false);
      fetchReviews();
    }
  }

  function openViewDialog(review: Review) {
    setSelectedReview(review);
    setDialogOpen(true);
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const columns: Column<Review>[] = [
    {
      key: 'review',
      header: 'Review',
      cell: (item) => (
        <div className="max-w-md">
          <p className="line-clamp-2 text-foreground">{item.comment || 'No comment'}</p>
          <p className="text-sm text-muted-foreground">by {item.user_name}</p>
        </div>
      ),
    },
    {
      key: 'business',
      header: 'Business',
      cell: (item) => <span className="text-foreground">{item.business_name}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (item) => renderStars(item.rating),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (item) => (
        <span className="text-muted-foreground">
          {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title="Reviews" description="Moderate user reviews">
      <div className="space-y-4">
        <AdminDataTable
          data={reviews}
          columns={columns}
          searchKey="comment"
          searchPlaceholder="Search reviews..."
          loading={loading}
          actions={(item) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openViewDialog(item)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedReview(item);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Rating:</span>
                {renderStars(selectedReview.rating)}
              </div>

              <div>
                <span className="font-medium text-foreground">Business:</span>
                <p className="text-muted-foreground">{selectedReview.business_name}</p>
              </div>

              <div>
                <span className="font-medium text-foreground">User:</span>
                <p className="text-muted-foreground">{selectedReview.user_name}</p>
              </div>

              <div>
                <span className="font-medium text-foreground">Comment:</span>
                <p className="mt-1 rounded-lg border border-border bg-muted/50 p-3 text-foreground">
                  {selectedReview.comment || 'No comment provided'}
                </p>
              </div>

              {selectedReview.images && selectedReview.images.length > 0 && (
                <div>
                  <span className="font-medium text-foreground">Images:</span>
                  <div className="mt-2 flex gap-2">
                    {selectedReview.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Review image ${index + 1}`}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Helpful: {selectedReview.helpful_count || 0}
                </span>
                <span className="text-muted-foreground">
                  {selectedReview.created_at
                    ? format(new Date(selectedReview.created_at), 'MMM d, yyyy HH:mm')
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDialogOpen(false);
                setDeleteDialogOpen(true);
              }}
            >
              Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
