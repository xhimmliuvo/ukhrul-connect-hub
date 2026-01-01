import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  requiresAuth?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: User, label: 'My Profile', path: '/profile', requiresAuth: true },
  { icon: Truck, label: 'Dropee Services', path: '/services' },
  { icon: ShoppingBag, label: 'My Orders', path: '/orders', requiresAuth: true },
  { icon: Star, label: 'My Reviews', path: '/reviews', requiresAuth: true },
  { icon: Settings, label: 'Settings', path: '/settings', requiresAuth: true },
];

export function HamburgerMenu() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        {/* User Section */}
        <div className="px-6 pb-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)}>
              <Button className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        <Separator />

        {/* Menu Items */}
        <nav className="py-2">
          {filteredMenuItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-6 py-3 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">{label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </nav>

        {/* Admin Section - Only show for admins */}
        {user && isAdmin && (
          <>
            <Separator />
            <nav className="py-2">
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-6 py-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">Admin Panel</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </nav>
          </>
        )}

        {/* Sign Out */}
        {user && (
          <>
            <Separator />
            <div className="p-6">
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
