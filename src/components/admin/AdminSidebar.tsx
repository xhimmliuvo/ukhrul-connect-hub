import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  MapPin,
  Calendar,
  Tag,
  Globe,
  Image,
  Users,
  ShoppingBag,
  MessageSquare,
  ChevronLeft,
  Menu,
  Truck,
  Package,
  Percent,
  Home,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type AppRole = 'admin' | 'moderator' | 'user' | 'business_owner' | 'agent' | 'tourist_guide' | 'events_manager';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
  userRoles?: AppRole[];
}

const allMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', roles: ['admin', 'moderator', 'business_owner', 'agent', 'tourist_guide', 'events_manager'] },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications', roles: ['admin'] },
  { icon: Truck, label: 'Dropee Services', path: '/admin/services', roles: ['admin', 'moderator'] },
  { icon: ShoppingBag, label: 'Delivery Orders', path: '/admin/delivery-orders', roles: ['admin', 'moderator', 'agent'] },
  { icon: Store, label: 'Businesses', path: '/admin/businesses', roles: ['admin', 'moderator', 'business_owner'] },
  { icon: Package, label: 'Products', path: '/admin/products', roles: ['admin', 'moderator', 'business_owner'] },
  { icon: Percent, label: 'Offers', path: '/admin/offers', roles: ['admin', 'moderator', 'business_owner'] },
  { icon: MapPin, label: 'Places', path: '/admin/places', roles: ['admin', 'moderator', 'tourist_guide'] },
  { icon: Calendar, label: 'Events', path: '/admin/events', roles: ['admin', 'moderator', 'events_manager'] },
  { icon: Tag, label: 'Categories', path: '/admin/categories', roles: ['admin'] },
  { icon: Globe, label: 'Service Areas', path: '/admin/service-areas', roles: ['admin'] },
  { icon: Image, label: 'Banners', path: '/admin/banners', roles: ['admin'] },
  { icon: Users, label: 'Users', path: '/admin/users', roles: ['admin'] },
  { icon: Users, label: 'Agents', path: '/admin/agents', roles: ['admin'] },
  { icon: ShoppingBag, label: 'Commerce Orders', path: '/admin/orders', roles: ['admin', 'moderator'] },
  { icon: MessageSquare, label: 'Reviews', path: '/admin/reviews', roles: ['admin', 'moderator'] },
  { icon: Tag, label: 'Promo Codes', path: '/admin/promo-codes', roles: ['admin'] },
];

export function AdminSidebar({ collapsed, onToggle, mobile, onNavigate, userRoles = [] }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = allMenuItems.filter(item =>
    userRoles.some(role => item.roles.includes(role))
  );

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        'h-screen border-r border-border bg-sidebar-background transition-all duration-300',
        mobile ? 'w-full' : 'fixed left-0 top-0 z-40',
        !mobile && (collapsed ? 'w-16' : 'w-64')
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4 md:h-16">
        {(!collapsed || mobile) && (
          <Link to="/admin" className="text-lg font-semibold text-sidebar-foreground" onClick={() => onNavigate?.()}>
            Admin Panel
          </Link>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav className="space-y-1 p-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  !mobile && collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {(!collapsed || mobile) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent',
            !mobile && collapsed && 'justify-center px-2'
          )}
          onClick={() => { navigate('/'); onNavigate?.(); }}
        >
          <Home className="h-5 w-5 shrink-0" />
          {(!collapsed || mobile) && <span className="ml-3">Back to Site</span>}
        </Button>
      </div>
    </aside>
  );
}
