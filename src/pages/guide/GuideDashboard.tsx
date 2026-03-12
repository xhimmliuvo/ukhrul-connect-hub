import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Map, Star, Users, Globe, Home, LogOut, Edit, Save, X,
  MessageSquare, DollarSign, Check, Clock, Send, BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  phone: string | null;
}

interface TourBooking {
  id: string;
  tourist_user_id: string;
  tour_date: string;
  tour_time: string | null;
  group_size: number;
  notes: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  tourist_profile?: { full_name: string | null; phone: string | null } | null;
}

interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function GuideDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, loading: rolesLoading, isAdmin } = useUserRoles();
  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', languages: '', specialties: '', phone: '' });
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'chat' | 'earnings'>('profile');
  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isGuide = roles.includes('tourist_guide') || isAdmin;

  useEffect(() => {
    if (!rolesLoading && !isGuide) { navigate('/'); return; }
    if (user && isGuide) { fetchProfile(); fetchBookings(); }
  }, [user, isGuide, rolesLoading]);

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('guide_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (error) {
      toast.error('Failed to load guide profile');
    } else {
      setGuide(data as GuideProfile);
      setEditForm({
        bio: data.bio || '',
        languages: (data.languages || []).join(', '),
        specialties: (data.specialties || []).join(', '),
        phone: data.phone || '',
      });
    }
    setLoading(false);
  }

  async function fetchBookings() {
    if (!guide && !user) return;
    // Get guide profile id first
    const { data: gp } = await supabase
      .from('guide_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    if (!gp) return;

    const { data, error } = await supabase
      .from('tour_bookings')
      .select('*')
      .eq('guide_id', gp.id)
      .order('tour_date', { ascending: false });

    if (!error && data) {
      // Fetch tourist profiles
      const touristIds = [...new Set(data.map(b => b.tourist_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', touristIds);

      const profileMap = new Map<string, { id: string; full_name: string | null; phone: string | null }>((profiles || []).map(p => [p.id, p] as const));
      setBookings(data.map(b => ({
        ...b,
        tourist_profile: profileMap.get(b.tourist_user_id) || null,
      })));
    }
  }

  useEffect(() => {
    if (guide) fetchBookings();
  }, [guide]);

  async function toggleAvailability() {
    if (!guide) return;
    const { error } = await supabase
      .from('guide_profiles')
      .update({ is_available: !guide.is_available })
      .eq('id', guide.id);
    if (error) toast.error('Failed to update');
    else { toast.success(guide.is_available ? 'Set to unavailable' : 'Set to available'); fetchProfile(); }
  }

  async function saveProfile() {
    if (!guide) return;
    const { error } = await supabase
      .from('guide_profiles')
      .update({
        bio: editForm.bio,
        languages: editForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        specialties: editForm.specialties.split(',').map(s => s.trim()).filter(Boolean),
        phone: editForm.phone || null,
      })
      .eq('id', guide.id);
    if (error) toast.error('Failed to save');
    else { toast.success('Profile updated'); setEditing(false); fetchProfile(); }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    const { error } = await supabase
      .from('tour_bookings')
      .update({ status })
      .eq('id', bookingId);
    if (error) toast.error('Failed to update');
    else { toast.success(`Booking ${status}`); fetchBookings(); }
  }

  async function openChat(bookingId: string) {
    setChatBookingId(bookingId);
    setChatOpen(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    setChatMessages(data || []);
    // Mark as read
    await supabase.from('chat_messages').update({ read: true })
      .eq('booking_id', bookingId).neq('sender_id', user!.id);
  }

  async function sendChatMessage() {
    if (!newMessage.trim() || !chatBookingId) return;
    const { error } = await supabase.from('chat_messages').insert({
      booking_id: chatBookingId,
      sender_id: user!.id,
      message: newMessage.trim(),
    });
    if (error) toast.error('Failed to send');
    else {
      setNewMessage('');
      const { data } = await supabase.from('chat_messages').select('*')
        .eq('booking_id', chatBookingId).order('created_at', { ascending: true });
      setChatMessages(data || []);
    }
  }

  // Realtime chat subscription
  useEffect(() => {
    if (!chatBookingId) return;
    const channel = supabase
      .channel(`chat-${chatBookingId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `booking_id=eq.${chatBookingId}` }, (payload) => {
        setChatMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatBookingId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (rolesLoading || loading) {
    return <div className="min-h-screen bg-background p-4 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const tabs = [
    { key: 'profile', label: 'Profile', icon: Users },
    { key: 'bookings', label: 'Bookings', icon: Clock },
    { key: 'chat', label: 'Chat', icon: MessageSquare },
    { key: 'earnings', label: 'Earnings', icon: DollarSign },
  ] as const;

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
                <Badge variant="outline" className="text-primary-foreground border-primary-foreground/50">Guide</Badge>
                {guide?.is_verified && <Badge variant="outline" className="text-primary-foreground border-primary-foreground/50">✓ Verified</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate('/admin')}>
                <BarChart3 className="h-5 w-5" />
              </Button>
            )}
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

      {/* Tab Nav */}
      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-3 text-xs font-medium text-center flex flex-col items-center gap-1 transition-colors ${activeTab === t.key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            <t.icon className="h-4 w-4" />{t.label}
            {t.key === 'bookings' && pendingBookings.length > 0 && (
              <Badge className="text-[10px] h-4 px-1">{pendingBookings.length}</Badge>
            )}
          </button>
        ))}
      </div>

      <main className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card><CardContent className="p-3 text-center">
            <Star className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
            <p className="text-lg font-bold">{guide?.rating?.toFixed(1) || '0.0'}</p>
            <p className="text-[10px] text-muted-foreground">Rating</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{guide?.total_tours || 0}</p>
            <p className="text-[10px] text-muted-foreground">Tours</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{pendingBookings.length}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <DollarSign className="h-4 w-4 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">₹{totalEarnings}</p>
            <p className="text-[10px] text-muted-foreground">Earned</p>
          </CardContent></Card>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">My Profile</CardTitle>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={saveProfile}><Save className="h-4 w-4 mr-1" /> Save</Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div><Label>Bio</Label><Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell tourists about yourself..." /></div>
                  <div><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." /></div>
                  <div><Label>Languages (comma separated)</Label><Input value={editForm.languages} onChange={e => setEditForm(f => ({ ...f, languages: e.target.value }))} placeholder="English, Hindi, Tangkhul" /></div>
                  <div><Label>Specialties (comma separated)</Label><Input value={editForm.specialties} onChange={e => setEditForm(f => ({ ...f, specialties: e.target.value }))} placeholder="Trekking, Cultural Tours" /></div>
                </>
              ) : (
                <>
                  <div><p className="text-sm text-muted-foreground mb-1">Bio</p><p className="text-sm">{guide?.bio || 'No bio added yet'}</p></div>
                  <div><p className="text-sm text-muted-foreground mb-1">Phone</p><p className="text-sm">{guide?.phone || 'Not set'}</p></div>
                  <div><p className="text-sm text-muted-foreground mb-1">Languages</p>
                    <div className="flex flex-wrap gap-1">{guide?.languages?.length ? guide.languages.map(l => <Badge key={l} variant="secondary">{l}</Badge>) : <p className="text-sm text-muted-foreground">None</p>}</div>
                  </div>
                  <div><p className="text-sm text-muted-foreground mb-1">Specialties</p>
                    <div className="flex flex-wrap gap-1">{guide?.specialties?.length ? guide.specialties.map(s => <Badge key={s} variant="outline">{s}</Badge>) : <p className="text-sm text-muted-foreground">None</p>}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {pendingBookings.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base text-yellow-600">Pending Requests ({pendingBookings.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {pendingBookings.map(b => (
                    <div key={b.id} className="p-3 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{b.tourist_profile?.full_name || 'Tourist'}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(b.tour_date), 'MMM d, yyyy')} • {b.group_size} people</p>
                          {b.notes && <p className="text-xs mt-1">{b.notes}</p>}
                        </div>
                        <Badge variant="outline">₹{b.total_amount}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => updateBookingStatus(b.id, 'confirmed')}><Check className="h-3 w-3 mr-1" />Accept</Button>
                        <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => updateBookingStatus(b.id, 'rejected')}>Decline</Button>
                        <Button size="sm" variant="ghost" onClick={() => openChat(b.id)}><MessageSquare className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Confirmed Bookings ({confirmedBookings.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {confirmedBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No confirmed bookings</p>
                ) : confirmedBookings.map(b => (
                  <div key={b.id} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-sm">{b.tourist_profile?.full_name || 'Tourist'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(b.tour_date), 'MMM d, yyyy')} • {b.group_size} people</p>
                      </div>
                      <Badge variant="secondary">₹{b.total_amount}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => updateBookingStatus(b.id, 'completed')}><Check className="h-3 w-3 mr-1" />Complete</Button>
                      <Button size="sm" variant="ghost" onClick={() => openChat(b.id)}><MessageSquare className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {completedBookings.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Completed ({completedBookings.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {completedBookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex justify-between items-center p-2 rounded-lg border border-border opacity-70">
                      <div>
                        <p className="text-sm font-medium">{b.tourist_profile?.full_name || 'Tourist'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(b.tour_date), 'MMM d')}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600">₹{b.total_amount}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Conversations</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {bookings.filter(b => b.status !== 'rejected').length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
              ) : bookings.filter(b => b.status !== 'rejected').map(b => (
                <button key={b.id} onClick={() => openChat(b.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left">
                  <div>
                    <p className="font-medium text-sm">{b.tourist_profile?.full_name || 'Tourist'}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(b.tour_date), 'MMM d, yyyy')} • {b.status}</p>
                  </div>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* EARNINGS TAB */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-3xl font-bold text-foreground">₹{totalEarnings}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Earning History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {completedBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No earnings yet</p>
                ) : completedBookings.map(b => (
                  <div key={b.id} className="flex justify-between items-center p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-sm">{b.tourist_profile?.full_name || 'Tourist'}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(b.tour_date), 'MMM d, yyyy')} • {b.group_size} people</p>
                    </div>
                    <p className="font-bold text-green-600">₹{b.total_amount}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-md h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-base">Chat</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user!.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${msg.sender_id === user!.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {msg.message}
                    <p className="text-[10px] opacity-60 mt-1">{format(new Date(msg.created_at), 'HH:mm')}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border flex gap-2">
            <Input value={newMessage} onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..." className="flex-1"
              onKeyDown={e => e.key === 'Enter' && sendChatMessage()} />
            <Button size="icon" onClick={sendChatMessage}><Send className="h-4 w-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
