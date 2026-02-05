import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Percent, Tag as TagIcon } from 'lucide-react';
import { format } from 'date-fns';

interface BusinessOffer {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  offer_type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  image: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  business?: { name: string };
}

interface Business {
  id: string;
  name: string;
}

const offerTypes = [
  { value: 'daily', label: 'Daily Deal' },
  { value: 'weekly', label: 'Weekly Special' },
  { value: 'monthly', label: 'Monthly Offer' },
  { value: 'flash', label: 'Flash Sale' },
];

export default function AdminOffers() {
  const [offers, setOffers] = useState<BusinessOffer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BusinessOffer | null>(null);
  const [filterBusinessId, setFilterBusinessId] = useState<string>('all');
  const [formData, setFormData] = useState({
    business_id: '',
    title: '',
    description: '',
    offer_type: 'daily',
    discount_percentage: '',
    discount_amount: '',
    image: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    fetchOffers();
    fetchBusinesses();
  }, [filterBusinessId]);

  async function fetchOffers() {
    setLoading(true);
    let query = supabase
      .from('business_offers')
      .select(`
        *,
        business:businesses (name)
      `)
      .order('created_at', { ascending: false });

    if (filterBusinessId !== 'all') {
      query = query.eq('business_id', filterBusinessId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load offers');
      console.error(error);
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  }

  async function fetchBusinesses() {
    const { data } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('active', true)
      .order('name');
    setBusinesses(data || []);
  }

  function openCreateDialog() {
    setEditingOffer(null);
    setFormData({
      business_id: filterBusinessId !== 'all' ? filterBusinessId : '',
      title: '',
      description: '',
      offer_type: 'daily',
      discount_percentage: '',
      discount_amount: '',
      image: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
    });
    setDialogOpen(true);
  }

  function openEditDialog(offer: BusinessOffer) {
    setEditingOffer(offer);
    setFormData({
      business_id: offer.business_id,
      title: offer.title,
      description: offer.description || '',
      offer_type: offer.offer_type,
      discount_percentage: offer.discount_percentage?.toString() || '',
      discount_amount: offer.discount_amount?.toString() || '',
      image: offer.image || '',
      valid_from: offer.valid_from ? format(new Date(offer.valid_from), "yyyy-MM-dd'T'HH:mm") : '',
      valid_until: offer.valid_until ? format(new Date(offer.valid_until), "yyyy-MM-dd'T'HH:mm") : '',
      is_active: offer.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.business_id) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!formData.discount_percentage && !formData.discount_amount) {
      toast.error('Please provide either discount percentage or amount');
      return;
    }

    setSaving(true);

    const offerData = {
      business_id: formData.business_id,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      offer_type: formData.offer_type,
      discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
      discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
      image: formData.image || null,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      is_active: formData.is_active,
    };

    if (editingOffer) {
      const { error } = await supabase
        .from('business_offers')
        .update(offerData)
        .eq('id', editingOffer.id);

      if (error) {
        toast.error('Failed to update offer');
        console.error(error);
      } else {
        toast.success('Offer updated');
        fetchOffers();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from('business_offers').insert(offerData);

      if (error) {
        toast.error('Failed to create offer');
        console.error(error);
      } else {
        toast.success('Offer created');
        fetchOffers();
        setDialogOpen(false);
      }
    }

    setSaving(false);
  }

  async function handleDelete(offer: BusinessOffer) {
    const { error } = await supabase.from('business_offers').delete().eq('id', offer.id);

    if (error) {
      toast.error('Failed to delete offer');
    } else {
      toast.success('Offer deleted');
      fetchOffers();
    }
  }

  async function toggleActive(offer: BusinessOffer) {
    const { error } = await supabase
      .from('business_offers')
      .update({ is_active: !offer.is_active })
      .eq('id', offer.id);

    if (error) {
      toast.error('Failed to update offer');
    } else {
      fetchOffers();
    }
  }

  const getOfferTypeLabel = (type: string) => {
    return offerTypes.find(t => t.value === type)?.label || type;
  };

  const columns: Column<BusinessOffer>[] = [
    {
      key: 'offer',
      header: 'Offer',
      cell: (item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            <img src={item.image} alt={item.title} className="h-12 w-12 object-cover rounded-lg" />
          ) : (
            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
              <TagIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{item.title}</p>
            <Badge variant="outline" className="text-xs mt-1">{getOfferTypeLabel(item.offer_type)}</Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'business',
      header: 'Business',
      cell: (item) => (
        <span className="text-foreground">{item.business?.name || '—'}</span>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      cell: (item) => (
        <div className="flex items-center gap-1">
          {item.discount_percentage ? (
            <>
              <Percent className="h-4 w-4 text-green-500" />
              <span className="text-foreground font-medium">{item.discount_percentage}% off</span>
            </>
          ) : item.discount_amount ? (
            <span className="text-foreground font-medium">₹{item.discount_amount} off</span>
          ) : '—'}
        </div>
      ),
    },
    {
      key: 'validity',
      header: 'Valid Until',
      cell: (item) => (
        <span className="text-foreground">
          {item.valid_until ? format(new Date(item.valid_until), 'MMM d, yyyy') : 'No expiry'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      cell: (item) => (
        <Switch
          checked={item.is_active}
          onCheckedChange={() => toggleActive(item)}
        />
      ),
    },
  ];

  return (
    <AdminLayout title="Business Offers" description="Create and manage promotional offers for businesses">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Select value={filterBusinessId} onValueChange={setFilterBusinessId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by business" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Offer
          </Button>
        </div>

        <AdminDataTable
          data={offers}
          columns={columns}
          searchKey="title"
          searchPlaceholder="Search offers..."
          loading={loading}
          actions={(item) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Offer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{item.title}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(item)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="business_id">Business *</Label>
              <Select
                value={formData.business_id}
                onValueChange={(value) => setFormData({ ...formData, business_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Offer Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Weekend Special - 20% Off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Offer details..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer_type">Offer Type</Label>
              <Select
                value={formData.offer_type}
                onValueChange={(value) => setFormData({ ...formData, offer_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {offerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_percentage">Discount %</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_amount">Or Fixed Amount (₹)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  placeholder="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Offer Banner Image</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="offers"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
