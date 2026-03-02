import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Map, Star, Users, Globe, Home, LogOut, Edit, Save, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';

interface GuideProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  languages: string[];
  specialties: string[];
  is_verified: boolean;
  is_available: boolean;
  rating: number | null;
  total_tours: number;
}

export default function GuideDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', languages: '', specialties: '' });

  const isGuide = roles.includes('tourist_guide');

  useEffect(() => {
    if (!rolesLoading && !isGuide) {
      navigate('/');
      return;
    }
    if (user && isGuide) fetchProfile();
  }, [user, isGuide, rolesLoading]);

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('guide_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (error) {
      console.error('Error:', error);
      toast.error('Failed to load guide profile');
    } else {
      setGuide(data as GuideProfile);
      setEditForm({
        bio: data.bio || '',
        languages: (data.languages || []).join(', '),
        specialties: (data.specialties || []).join(', '),
      });
    }
    setLoading(false);
  }

  async function toggleAvailability() {
    if (!guide) return;
    const { error } = await supabase
      .from('guide_profiles')
      .update({ is_available: !guide.is_available })
      .eq('id', guide.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(guide.is_available ? 'Set to unavailable' : 'Set to available');
      fetchProfile();
    }
  }

  async function saveProfile() {
    if (!guide) return;
    const { error } = await supabase
      .from('guide_profiles')
      .update({
        bio: editForm.bio,
        languages: editForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        specialties: editForm.specialties.split(',').map(s => s.trim()).filter(Boolean),
      })
      .eq('id', guide.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Profile updated');
      setEditing(false);
      fetchProfile();
    }
  }

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-lg">
              {guide?.full_name?.slice(0, 2).toUpperCase() || 'TG'}
            </div>
            <div>
              <h1 className="font-bold text-lg">{guide?.full_name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary-foreground border-primary-foreground/50">
                  Tourist Guide
                </Badge>
                {guide?.is_verified && (
                  <Badge variant="outline" className="text-primary-foreground border-primary-foreground/50">
                    ✓ Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate('/')}>
              <Home className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Card className="bg-primary-foreground/10 border-primary-foreground/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${guide?.is_available ? 'bg-green-400 animate-pulse' : 'bg-muted'}`} />
              <span className="font-medium text-primary-foreground">
                {guide?.is_available ? 'Available for Tours' : 'Unavailable'}
              </span>
            </div>
            <Switch checked={guide?.is_available || false} onCheckedChange={toggleAvailability} />
          </CardContent>
        </Card>
      </div>

      <main className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
              <p className="text-xl font-bold">{guide?.rating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{guide?.total_tours || 0}</p>
              <p className="text-xs text-muted-foreground">Tours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Globe className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{guide?.languages?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Languages</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">My Profile</CardTitle>
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={saveProfile}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell tourists about yourself..."
                  />
                </div>
                <div>
                  <Label>Languages (comma separated)</Label>
                  <Input
                    value={editForm.languages}
                    onChange={e => setEditForm(f => ({ ...f, languages: e.target.value }))}
                    placeholder="English, Hindi, Tangkhul"
                  />
                </div>
                <div>
                  <Label>Specialties (comma separated)</Label>
                  <Input
                    value={editForm.specialties}
                    onChange={e => setEditForm(f => ({ ...f, specialties: e.target.value }))}
                    placeholder="Trekking, Cultural Tours, Wildlife"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{guide?.bio || 'No bio added yet'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {guide?.languages?.length ? guide.languages.map(l => (
                      <Badge key={l} variant="secondary">{l}</Badge>
                    )) : <p className="text-sm text-muted-foreground">None added</p>}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {guide?.specialties?.length ? guide.specialties.map(s => (
                      <Badge key={s} variant="outline">{s}</Badge>
                    )) : <p className="text-sm text-muted-foreground">None added</p>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/places')}>
            <Map className="h-6 w-6" />
            <span>Browse Places</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/events')}>
            <Users className="h-6 w-6" />
            <span>Upcoming Events</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
