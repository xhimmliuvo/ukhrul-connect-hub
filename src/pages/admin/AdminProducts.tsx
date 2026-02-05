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
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  image: string | null;
  category: string | null;
  available: boolean;
  business_id: string;
  business?: { name: string };
}

interface Business {
  id: string;
  name: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterBusinessId, setFilterBusinessId] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    image: '',
    category: '',
    available: true,
    business_id: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchBusinesses();
  }, [filterBusinessId]);

  async function fetchProducts() {
    setLoading(true);
    let query = supabase
      .from('products')
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
      toast.error('Failed to load products');
    } else {
      setProducts(data || []);
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
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      discount_price: '',
      image: '',
      category: '',
      available: true,
      business_id: filterBusinessId !== 'all' ? filterBusinessId : '',
    });
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      discount_price: product.discount_price?.toString() || '',
      image: product.image || '',
      category: product.category || '',
      available: product.available ?? true,
      business_id: product.business_id,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.price || !formData.business_id) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price),
      discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
      image: formData.image || null,
      category: formData.category.trim() || null,
      available: formData.available,
      business_id: formData.business_id,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast.error('Failed to update product');
      } else {
        toast.success('Product updated');
        fetchProducts();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from('products').insert(productData);

      if (error) {
        toast.error('Failed to create product');
      } else {
        toast.success('Product created');
        fetchProducts();
        setDialogOpen(false);
      }
    }

    setSaving(false);
  }

  async function handleDelete(product: Product) {
    const { error } = await supabase.from('products').delete().eq('id', product.id);

    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      fetchProducts();
    }
  }

  async function toggleAvailable(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ available: !product.available })
      .eq('id', product.id);

    if (error) {
      toast.error('Failed to update product');
    } else {
      fetchProducts();
    }
  }

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            <img src={item.image} alt={item.name} className="h-12 w-12 object-cover rounded-lg" />
          ) : (
            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            {item.category && (
              <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
            )}
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
      key: 'price',
      header: 'Price',
      cell: (item) => (
        <div>
          {item.discount_price ? (
            <>
              <span className="text-foreground font-medium">₹{item.discount_price}</span>
              <span className="text-muted-foreground line-through ml-2">₹{item.price}</span>
            </>
          ) : (
            <span className="text-foreground font-medium">₹{item.price}</span>
          )}
        </div>
      ),
    },
    {
      key: 'available',
      header: 'Available',
      cell: (item) => (
        <Switch
          checked={item.available}
          onCheckedChange={() => toggleAvailable(item)}
        />
      ),
    },
  ];

  return (
    <AdminLayout title="Products" description="Manage products across all businesses">
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
            Add Product
          </Button>
        </div>

        <AdminDataTable
          data={products}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search products..."
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
                    <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{item.name}". This action cannot be undone.
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
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
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
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_price">Discount Price</Label>
                <Input
                  id="discount_price"
                  type="number"
                  value={formData.discount_price}
                  onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Electronics, Clothing"
              />
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="products"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="available">Available for sale</Label>
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
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
