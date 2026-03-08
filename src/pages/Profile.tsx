import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  ShoppingBag, 
  Heart, 
  Star, 
  LogOut,
  ChevronRight,
  Flame,
  Loader2,
  Truck,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: ShoppingBag, label: 'My Orders', path: '/orders', description: 'Track your orders' },
  { icon: Heart, label: 'Saved Items', path: '/saved', description: 'Your favorites' },
  { icon: Star, label: 'My Reviews', path: '/reviews', description: 'Rate & review' },
  { icon: Settings, label: 'Settings', path: '/settings', description: 'App preferences' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isAgent } = useUserRoles();
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const streakUpdated = useRef(false);

  useEffect(() => {
    async function updateVisitStats() {
      if (!user || streakUpdated.current) return;
      streakUpdated.current = true;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('visit_streak, points, last_visit_date')
        .eq('id', user.id)
        .single();

      if (error) return;

      const today = new Date().toISOString().split('T')[0];
      const lastVisit = profile?.last_visit_date;
      let newStreak = profile?.visit_streak || 0;
      let newPoints = profile?.points || 0;

      if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastVisit === yesterdayStr) {
          newStreak += 1;
        } else if (!lastVisit) {
          newStreak = 1;
        } else {
          newStreak = 1;
        }

        newPoints += 10;

        await supabase
          .from('profiles')
          .update({ visit_streak: newStreak, points: newPoints, last_visit_date: today })
          .eq('id', user.id);
      }

      setStreak(newStreak);
      setPoints(newPoints);
    }

    if (!loading && user) updateVisitStats();
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const userInitials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Gradient Profile Header */}
      <div className="gradient-hero px-4 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/4" />
        <div className="container mx-auto relative">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-primary-foreground/30 shadow-elevated">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xl font-bold bg-primary-foreground/20 text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary-foreground">
                {user.user_metadata?.full_name || 'User'}
              </h2>
              <p className="text-sm text-primary-foreground/70">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 -mt-8 space-y-5 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-warm flex items-center justify-center shadow-premium flex-shrink-0">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{streak}</p>
              <p className="text-xs text-muted-foreground font-medium">Day Streak</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-premium flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{points}</p>
              <p className="text-xs text-muted-foreground font-medium">Points</p>
            </div>
          </div>
        </div>

        {/* Agent Panel */}
        {isAgent && (
          <Link to="/agent">
            <div className="glass rounded-2xl p-4 flex items-center justify-between card-hover border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-premium">
                  <Truck className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Agent Dashboard</p>
                  <p className="text-xs text-muted-foreground">Manage deliveries & earnings</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        )}

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map(({ icon: Icon, label, path, description }) => (
            <Link key={path} to={path}>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/50 card-hover">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground text-sm">{label}</span>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full gap-2 text-destructive hover:text-destructive rounded-xl h-11"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
