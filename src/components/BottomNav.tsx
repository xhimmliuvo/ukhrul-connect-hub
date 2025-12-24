import { Link, useLocation } from 'react-router-dom';
import { Compass, Mountain, Calendar, Heart, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HamburgerMenu } from './HamburgerMenu';

const navItems = [
  { path: '/', icon: Compass, label: 'Explore' },
  { path: '/businesses', icon: Store, label: 'Shops' },
  { path: '/places', icon: Mountain, label: 'Places' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/saved', icon: Heart, label: 'Saved' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-current')} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
        <div className="flex flex-col items-center justify-center h-full px-2">
          <HamburgerMenu />
          <span className="text-xs mt-0.5 font-medium text-muted-foreground">More</span>
        </div>
      </div>
    </nav>
  );
}
