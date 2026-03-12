import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BottomNav } from '@/components/BottomNav';
import {
  ArrowLeft, Save, Package, Plus, Edit, Trash2, Upload, X, Store, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  description: string | null;
  image: string | null;
  category: string | null;
  available: boolean;
}

export default function ManageBusiness() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', discount_price: '', description: '', image: '', category: ''
  });

  const [editForm, setEditForm] = useState({
    name: '', description: '', short_description: '', address: '',
    phone: '', whatsapp: '', email: '', website: '',
  });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!id || !user) return;
    async function fetch() {
      const [bizRes, prodRes] = await Promise.all([
        supabase.from('businesses').select('*').eq('id', id).eq('owner_id', user!.id).single(),
        supabase.from('products').select('*').eq('business_id', id!).order('created_at', { ascending: false }),
      ]);
      if (bizRes.data) {
        setBusiness(bizRes.data);
        setEditForm({
          name: bizRes.data.name, description: bizRes.data.description || '',
          short_description: bizRes.data.short_description || '', address: bizRes.data.address || '',
          phone: bizRes.data.phone || '', whatsapp: bizRes.data.whatsapp || '',
          email: bizRes.data.email || '', website: bizRes.data.website || '',
        });
        setCoverImage(bizRes.data.cover_image);
        setImages(bizRes.data.images || []);
      }
      setProducts((prodRes.data as Product[]) || []);
      setLoading(false);
    }
    fetch();
  }, [id, user]);

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `businesses/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    setUploading(false);
    if (error) { toast.error('Upload failed'); return null; }
    return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
  }

  async function saveBusiness() {
    setSaving(true);
    const { error } = await supabase.from('businesses').update({
      name: editForm.name, description: editForm.description || null,
      short_description: editForm.short_description || null, address: editForm.address || null,
      phone: editForm.phone || null, whatsapp: editForm.whatsapp || null,
      email: editForm.email || null, website: editForm.website || null,
      cover_image: coverImage, images,
    }).eq('id', id!);
    setSaving(false);
    if (error) toast.error('Failed to save');
    else toast.success('Business updated!');
  }

  async function saveProduct() {
    const payload = {
      business_id: id!,
      name: productForm.name,
      price: parseFloat(productForm.price),
      discount_price: productForm.discount_price ? parseFloat(productForm.discount_price) : null,
      description: productForm.description || null,
      image: productForm.image || null,
      category: productForm.category || null,
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (error) toast.error('Failed to update product');
      else toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) toast.error('Failed to add product');
      else toast.success('Product added');
    }
    setProductOpen(false);
    setEditingProduct(null);
    setProductForm({ name: '', price: '', discount_price: '', description: '', image: '', category: '' });
    // Refresh
    const { data } = await supabase.from('products').select('*').eq('business_id', id!).order('created_at', { ascending: false });
    setProducts((data as Product[]) || []);
  }

  async function deleteProduct(productId: string) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Product deleted');
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductForm({
      name: p.name, price: p.price.toString(),
      discount_price: p.discount_price?.toString() || '',
      description: p.description || '', image: p.image || '',
      category: p.category || '',
    });
    setProductOpen(true);
  }

  if (loading) return <div className="min-h-screen bg-background p-4"><div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div></div>;

  if (!business) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Business not found</p></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">Manage Business</h1>
            <p className="text-sm opacity-80">{business.name}</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-4">
        {/* Cover Image */}
        <Card>
          <CardContent className="p-4">
            {coverImage ? (
              <div className="relative">
                <img src={coverImage} alt="Cover" className="w-full h-40 object-cover rounded-xl" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => setCoverImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-xl cursor-pointer">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">Upload Cover</p>
                <input type="file" accept="image/*" className="hidden" onChange={async e => {
                  const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setCoverImage(u); }
                }} />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Photos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={img} className="w-full h-full object-cover rounded-lg" />
                  <Button variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <label className="aspect-square flex items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                  const files = e.target.files; if (!files) return;
                  for (const f of Array.from(files)) { const u = await uploadImage(f); if (u) setImages(prev => [...prev, u]); }
                }} />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Business Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Name</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Short Description</Label><Input value={editForm.short_description} onChange={e => setEditForm(f => ({ ...f, short_description: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Address</Label><Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>WhatsApp</Label><Input value={editForm.whatsapp} onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Website</Label><Input value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} /></div>
          </CardContent>
        </Card>

        <Button className="w-full gap-2" onClick={saveBusiness} disabled={saving}>
          <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}
        </Button>

        {/* Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />Products ({products.length})</CardTitle>
            <Button size="sm" className="gap-1" onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', discount_price: '', description: '', image: '', category: '' }); setProductOpen(true); }}>
              <Plus className="h-3 w-3" />Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                {p.image ? <img src={p.image} className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{p.price}{p.discount_price && <span className="ml-1 line-through">₹{p.discount_price}</span>}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEditProduct(p)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      {/* Product Dialog */}
      <Dialog open={productOpen} onOpenChange={setProductOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Price *</Label><Input type="number" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Discount Price</Label><Input type="number" value={productForm.discount_price} onChange={e => setProductForm(f => ({ ...f, discount_price: e.target.value }))} /></div>
            </div>
            <div><Label>Category</Label><Input value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div>
              <Label>Image</Label>
              {productForm.image && <img src={productForm.image} className="h-20 w-full object-cover rounded-lg mb-2" />}
              <Input type="file" accept="image/*" onChange={async e => {
                const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setProductForm(prev => ({ ...prev, image: u })); }
              }} />
            </div>
            <Button className="w-full" onClick={saveProduct} disabled={!productForm.name || !productForm.price}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
