import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BottomNav } from '@/components/BottomNav';
import { LocationBanner } from '@/components/LocationBanner';
import {
  Store, Upload, X, ArrowLeft, CheckCircle, Image as ImageIcon, Phone, Mail, Globe, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ServiceArea {
  id: string;
  name: string;
}

export default function AddBusiness() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', short_description: '',
    address: '', phone: '', whatsapp: '', email: '', website: '',
    category_id: '', service_area_id: '', business_type: 'product',
  });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    async function fetchData() {
      const [catRes, saRes] = await Promise.all([
        supabase.from('categories').select('id, name, slug').eq('type', 'business').eq('active', true),
        supabase.from('service_areas').select('id, name').eq('active', true),
      ]);
      setCategories(catRes.data || []);
      setServiceAreas(saRes.data || []);
    }
    fetchData();
  }, []);

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `businesses/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('images').upload(fileName, file);
    setUploading(false);
    if (error) { toast.error('Upload failed'); return null; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicUrl;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setCoverImage(url);
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) setImages(prev => [...prev, url]);
    }
  }

  function removeGalleryImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error('Business name is required'); return; }
    if (!user) return;

    setSubmitting(true);
    const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);

    const { error } = await supabase.from('businesses').insert({
      name: form.name,
      slug,
      description: form.description || null,
      short_description: form.short_description || null,
      address: form.address || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      website: form.website || null,
      category_id: form.category_id || null,
      service_area_id: form.service_area_id || null,
      business_type: form.business_type,
      cover_image: coverImage,
      images: images,
      owner_id: user.id,
      active: false, // Hidden until admin approves
      approval_status: 'pending',
      verified: false,
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      toast.error('Failed to submit business');
    } else {
      // Notify admins
      const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
      if (adminRoles) {
        const notifications = adminRoles.map(r => ({
          user_id: r.user_id,
          title: '🏪 New Business Submission',
          body: `${form.name} has been submitted for review by ${user.email}`,
          type: 'business_submission',
        }));
        await supabase.from('notifications').insert(notifications);
      }
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <LocationBanner />
        <div className="container mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Business Submitted!</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your business "{form.name}" has been submitted for review. Our admin team will verify and approve it shortly.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/')}>Go Home</Button>
            <Button variant="outline" onClick={() => navigate('/my-businesses')}>My Businesses</Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add Your Business</h1>
            <p className="text-sm text-muted-foreground">Submit your business for listing</p>
          </div>
        </div>

        {/* Logo / Cover Image */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />Business Logo / Cover</CardTitle></CardHeader>
          <CardContent>
            {coverImage ? (
              <div className="relative">
                <img src={coverImage} alt="Cover" className="w-full h-48 object-cover rounded-xl" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => setCoverImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
                <Store className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Upload logo or cover image</p>
                <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
            )}
            {uploading && <p className="text-xs text-muted-foreground mt-2">Uploading...</p>}
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" />Photo Gallery</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover rounded-lg" />
                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeGalleryImage(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground mt-1">Add Photos</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Business Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your Business Name" /></div>
            <div><Label>Short Description</Label><Input value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="Brief tagline..." /></div>
            <div><Label>Full Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell people about your business..." rows={4} /></div>
            <div><Label>Business Type</Label>
              <Select value={form.business_type} onValueChange={v => setForm(f => ({ ...f, business_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product Store</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Service Area</Label>
              <Select value={form.service_area_id} onValueChange={v => setForm(f => ({ ...f, service_area_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {serviceAreas.map(sa => <SelectItem key={sa.id} value={sa.id}>{sa.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" />Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+91..." /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="business@email.com" /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
          </CardContent>
        </Card>

        <Button className="w-full h-12 text-base" onClick={handleSubmit} disabled={submitting || !form.name.trim()}>
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
