import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Store, label: 'Businesses', path: '/admin/businesses' },
  { icon: MapPin, label: 'Places', path: '/admin/places' },
  { icon: Calendar, label: 'Events', path: '/admin/events' },
  { icon: Tag, label: 'Categories', path: '/admin/categories' },
  { icon: Globe, label: 'Service Areas', path: '/admin/service-areas' },
  { icon: Image, label: 'Banners', path: '/admin/banners' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
  { icon: MessageSquare, label: 'Reviews', path: '/admin/reviews' },
];

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link to="/admin" className="text-lg font-semibold text-sidebar-foreground">
            Admin Panel
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <nav className="space-y-1 p-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
