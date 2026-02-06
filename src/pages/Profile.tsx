import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { LocationBanner } from '@/components/LocationBanner';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  Truck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const menuItems = [
  { icon: ShoppingBag, label: 'My Orders', path: '/orders' },
  { icon: Heart, label: 'Saved Items', path: '/saved' },
  { icon: Star, label: 'My Reviews', path: '/reviews' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isAgent } = useUserRoles();
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);

  // Fetch and update streak/points on profile visit
  useEffect(() => {
    async function updateVisitStats() {
      if (!user) return;

      // Fetch current profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('visit_streak, points, last_visit_date')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastVisit = profile?.last_visit_date;
      let newStreak = profile?.visit_streak || 0;
      let newPoints = profile?.points || 0;

      // Check if this is a new day visit
      if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastVisit === yesterdayStr) {
          // Consecutive day - increment streak
          newStreak += 1;
        } else if (!lastVisit) {
          // First visit ever
          newStreak = 1;
        } else {
          // Streak broken - reset to 1
          newStreak = 1;
        }

        // Add points for daily visit
        newPoints += 10;

        // Update the database
        await supabase
          .from('profiles')
          .update({
            visit_streak: newStreak,
            points: newPoints,
            last_visit_date: today,
          })
          .eq('id', user.id);
      }

      setStreak(newStreak);
      setPoints(newPoints);
    }

    if (!loading && user) {
      updateVisitStats();
    }
  }, [user, loading]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
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

  if (!user) {
    return null;
  }

  const userInitials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background pb-20">
      <LocationBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {user.user_metadata?.full_name || 'User'}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Panel Card - Only show for agents */}
        {isAgent && (
          <Link to="/agent">
            <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Agent Dashboard</p>
                    <p className="text-sm text-muted-foreground">Manage deliveries & earnings</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{points}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <Card>
          <CardContent className="p-0">
            {menuItems.map(({ icon: Icon, label, path }, index) => (
              <div key={path}>
                <Link to={path}>
                  <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
                {index < menuItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          className="w-full gap-2 text-destructive hover:text-destructive"
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
