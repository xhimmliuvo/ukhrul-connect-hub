import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Package, IndianRupee, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';

interface AgentProfile {
  id: string;
  agent_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  vehicle_type: string;
  total_deliveries: number;
  total_earnings: number;
  rating: number | null;
  is_verified: boolean;
}

export default function AgentProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    avatar_url: '',
    vehicle_type: 'bike',
  });

  useEffect(() => {
    if (user) {
      fetchAgentProfile();
    }
  }, [user]);

  async function fetchAgentProfile() {
    if (!user) return;

    const { data, error } = await supabase
      .from('delivery_agents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      toast.error('Failed to load profile');
      console.error('Error fetching agent profile:', error);
    } else if (data) {
      setAgent(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        email: data.email || '',
        avatar_url: data.avatar_url || '',
        vehicle_type: data.vehicle_type || 'bike',
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!agent) return;
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('delivery_agents')
      .update({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        avatar_url: formData.avatar_url || null,
        vehicle_type: formData.vehicle_type,
      })
      .eq('id', agent.id);

    if (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } else {
      toast.success('Profile updated successfully');
      fetchAgentProfile();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No agent profile found</p>
        <Button onClick={() => navigate('/agent')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/agent')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">My Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Profile Overview Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar Upload */}
              <div className="flex-shrink-0">
                <Label className="text-sm text-muted-foreground mb-2 block">Profile Photo</Label>
                <div className="w-32">
                  <ImageUpload
                    value={formData.avatar_url}
                    onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                    folder="agents"
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Agent Code:</span>
                  <span className="font-mono font-semibold text-foreground">{agent.agent_code}</span>
                  {agent.is_verified && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">{agent.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Package className="h-4 w-4" />
                      <span className="font-semibold">{agent.total_deliveries}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Deliveries</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <IndianRupee className="h-4 w-4" />
                      <span className="font-semibold">{agent.total_earnings.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="agent@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Motorcycle / Bike</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="foot">On Foot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
