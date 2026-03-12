import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  User,
  Truck,
  Settings,
  ShoppingBag,
  Star,
  LogIn,
  LogOut,
  Shield,
  ChevronRight,
  Map,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  requiresAuth?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: User, label: 'My Profile', path: '/profile', requiresAuth: true },
  { icon: Store, label: 'My Businesses', path: '/my-businesses', requiresAuth: true },
  { icon: Truck, label: 'Dropee Services', path: '/services' },
  { icon: ShoppingBag, label: 'My Orders', path: '/orders', requiresAuth: true },
  { icon: Star, label: 'My Reviews', path: '/reviews', requiresAuth: true },
  { icon: Settings, label: 'Settings', path: '/settings', requiresAuth: true },
];

export function HamburgerMenu() {
  const { user, signOut } = useAuth();
  const { isAdmin, isAgent, isTouristGuide, isEventsManager } = useUserRoles();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    setOpen(false);
  };

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  const filteredMenuItems = menuItems.filter(item => 
    !item.requiresAuth || (item.requiresAuth && user)
  );

  const RoleLink = ({ to, icon: Icon, label, badge }: { to: string; icon: React.ElementType; label: string; badge?: string }) => (
    <Link to={to} onClick={() => setOpen(false)}>
      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors mx-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-foreground text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant="secondary" className="text-[10px] rounded-md">{badge}</Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0 border-0">
        {/* Gradient Header */}
        <div className="gradient-hero p-6 pb-8">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-primary-foreground/30">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-lg font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-primary-foreground truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-sm text-primary-foreground/70 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <p className="font-bold text-primary-foreground text-lg">Discover Ukhrul</p>
              <p className="text-sm text-primary-foreground/70">Sign in to get started</p>
            </div>
          )}
        </div>

        {/* Sign in button for guests */}
        {!user && (
          <div className="px-4 -mt-4">
            <Link to="/auth" onClick={() => setOpen(false)}>
              <Button className="w-full gap-2 rounded-xl shadow-premium h-11">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </div>
        )}

        {/* Menu Items */}
        <nav className="py-4 space-y-0.5">
          {filteredMenuItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors mx-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground text-sm">{label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </nav>

        {/* Role-specific sections */}
        {user && (isAgent || isTouristGuide || isEventsManager || isAdmin) && (
          <div className="px-4 pb-2">
            <div className="h-px bg-border mb-3" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Dashboards</p>
            <div className="space-y-0.5">
              {isAgent && <RoleLink to="/agent" icon={Truck} label="Agent Panel" badge="Agent" />}
              {isTouristGuide && <RoleLink to="/guide" icon={Map} label="Guide Dashboard" badge="Guide" />}
              {isEventsManager && <RoleLink to="/events-manager" icon={Calendar} label="Events Manager" badge="Manager" />}
              {isAdmin && <RoleLink to="/admin" icon={Shield} label="Admin Panel" badge="Admin" />}
            </div>
          </div>
        )}

        {/* Sign Out */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive rounded-xl"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
