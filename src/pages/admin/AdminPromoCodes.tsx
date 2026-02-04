import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, Percent, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

type DiscountType = 'percentage' | 'fixed';

interface FormData {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

const initialFormData: FormData = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_value: 0,
  max_uses: null,
  valid_from: '',
  valid_until: '',
  is_active: true,
};

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  async function fetchPromoCodes() {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promo codes',
        variant: 'destructive',
      });
    } else {
      setPromoCodes(data || []);
    }
    setLoading(false);
  }

  function openCreateDialog() {
    setSelectedCode(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  }

  function openEditDialog(code: PromoCode) {
    setSelectedCode(code);
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type as DiscountType,
      discount_value: code.discount_value,
      min_order_value: code.min_order_value || 0,
      max_uses: code.max_uses,
      valid_from: code.valid_from ? code.valid_from.split('T')[0] : '',
      valid_until: code.valid_until ? code.valid_until.split('T')[0] : '',
      is_active: code.is_active,
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(code: PromoCode) {
    setSelectedCode(code);
    setDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.code.trim()) {
      toast({
        title: 'Error',
        description: 'Promo code is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    const payload = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_order_value: formData.min_order_value || 0,
      max_uses: formData.max_uses || null,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
    };

    let error;

    if (selectedCode) {
      const { error: updateError } = await supabase
        .from('promo_codes')
        .update(payload)
        .eq('id', selectedCode.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('promo_codes')
        .insert(payload);
      error = insertError;
    }

    setSaving(false);

    if (error) {
      console.error('Error saving promo code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save promo code',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: selectedCode ? 'Promo code updated' : 'Promo code created',
      });
      setDialogOpen(false);
      fetchPromoCodes();
    }
  }

  async function handleDelete() {
    if (!selectedCode) return;

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', selectedCode.id);

    if (error) {
      console.error('Error deleting promo code:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete promo code',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Promo code deleted',
      });
      setDeleteDialogOpen(false);
      fetchPromoCodes();
    }
  }

  async function toggleActive(code: PromoCode) {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: !code.is_active })
      .eq('id', code.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } else {
      fetchPromoCodes();
    }
  }

  const columns: Column<PromoCode>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-semibold">{item.code}</span>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      cell: (item) => (
        <div className="flex items-center gap-1">
          {item.discount_type === 'percentage' ? (
            <>
              <Percent className="h-4 w-4 text-primary" />
              <span>{item.discount_value}%</span>
            </>
          ) : (
            <>
              <span>₹{item.discount_value}</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      cell: (item) => (
        <span>
          {item.current_uses}
          {item.max_uses ? ` / ${item.max_uses}` : ''}
        </span>
      ),
    },
    {
      key: 'validity',
      header: 'Valid Until',
      cell: (item) =>
        item.valid_until
          ? format(new Date(item.valid_until), 'dd MMM yyyy')
          : 'No expiry',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Promo Codes"
      description="Manage coupon and promo codes"
    >
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Promo Code
        </Button>
      </div>

      <AdminDataTable
        data={promoCodes}
        columns={columns}
        searchKey="code"
        searchPlaceholder="Search promo codes..."
        loading={loading}
        actions={(item) => (
          <div className="flex items-center gap-2">
            <Switch
              checked={item.is_active}
              onCheckedChange={() => toggleActive(item)}
            />
            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openDeleteDialog(item)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCode ? 'Edit Promo Code' : 'Create Promo Code'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code *</Label>
              <Input
                id="code"
                placeholder="e.g., SAVE20"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description for internal use"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: DiscountType) =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">Discount Value *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_value: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_value">Min Order Value (₹)</Label>
                <Input
                  id="min_order_value"
                  type="number"
                  min="0"
                  value={formData.min_order_value || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_order_value: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses">Max Uses (leave empty for unlimited)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_uses: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the promo code "{selectedCode?.code}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
