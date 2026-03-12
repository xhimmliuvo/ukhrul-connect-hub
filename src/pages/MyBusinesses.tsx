import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/BottomNav';
import { LocationBanner } from '@/components/LocationBanner';
import {
  Store, Plus, ArrowLeft, Edit, Eye, Package, Settings, Image
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MyBusiness {
  id: string;
  name: string;
  slug: string;
  cover_image: string | null;
  active: boolean;
  approval_status: string | null;
  verified: boolean;
  rating: number;
  review_count: number;
  business_type: string | null;
}

export default function MyBusinesses() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<MyBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      // Need to query all businesses owned by user, including inactive ones
      // Since RLS only shows active=true for public, we use the business_owner policy
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, slug, cover_image, active, approval_status, verified, rating, review_count, business_type')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        // Try without active filter - the owner policies should allow
      }
      setBusinesses((data as any) || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const getStatusBadge = (b: MyBusiness) => {
    if (b.approval_status === 'pending') return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending Review</Badge>;
    if (b.approval_status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    if (b.active && b.verified) return <Badge className="bg-green-600">Verified & Live</Badge>;
    if (b.active) return <Badge variant="secondary">Live</Badge>;
    return <Badge variant="outline">Inactive</Badge>;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <LocationBanner />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">My Businesses</h1>
          </div>
          <Button size="sm" className="gap-2" onClick={() => navigate('/add-business')}>
            <Plus className="h-4 w-4" />Add
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Store className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-bold text-foreground">No businesses yet</h2>
            <p className="text-sm text-muted-foreground">Add your business to get discovered</p>
            <Button onClick={() => navigate('/add-business')} className="gap-2">
              <Plus className="h-4 w-4" />Add Your Business
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map(b => (
              <Card key={b.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {b.cover_image ? (
                      <img src={b.cover_image} alt={b.name} className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Store className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h3 className="font-bold text-foreground truncate">{b.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{b.business_type || 'Business'}</p>
                      </div>
                      {getStatusBadge(b)}
                      {b.active && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => navigate(`/businesses/${b.slug}`)}>
                            <Eye className="h-3 w-3" />View
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => navigate(`/manage-business/${b.id}`)}>
                            <Edit className="h-3 w-3" />Manage
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
