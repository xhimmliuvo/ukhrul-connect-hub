import { Link, useLocation } from 'react-router-dom';
import { Compass, Mountain, Calendar, Heart, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HamburgerMenu } from './HamburgerMenu';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', icon: Compass, label: 'Explore' },
  { path: '/businesses', icon: Store, label: 'Shops' },
  { path: '/places', icon: Mountain, label: 'Places' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/saved', icon: Heart, label: 'Saved' },
];

export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="mx-3 mb-3 glass rounded-2xl shadow-elevated">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  "text-[10px] mt-1 font-semibold transition-all",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                )}
              </Link>
            );
          })}
          {user && (
            <div className="flex flex-col items-center justify-center h-full px-1">
              <NotificationBell />
            </div>
          )}
          <div className="flex flex-col items-center justify-center h-full px-2">
            <HamburgerMenu />
            <span className="text-[10px] mt-0.5 font-semibold text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
