import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Loader2, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

type AppRole = 'admin' | 'moderator' | 'user' | 'business_owner' | 'agent' | 'tourist_guide' | 'events_manager';

const ADMIN_ROLES: AppRole[] = ['admin', 'moderator', 'business_owner', 'agent', 'tourist_guide', 'events_manager'];

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function checkRoles() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking roles:', error);
        setUserRoles([]);
      } else {
        setUserRoles((data || []).map(r => r.role as AppRole));
      }
      setLoading(false);
    }

    if (!authLoading) {
      checkRoles();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const hasAccess = userRoles.some(role => ADMIN_ROLES.includes(role));

  if (!hasAccess) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-4">
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
        <Button asChild>
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const isAdmin = userRoles.includes('admin');

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRoles={userRoles}
        />
      )}

      {/* Mobile sidebar sheet */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <AdminSidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              mobile
              onNavigate={() => setMobileOpen(false)}
              userRoles={userRoles}
            />
          </SheetContent>
        </Sheet>
      )}
      
      <div className={cn(
        'transition-all duration-300',
        !isMobile && (sidebarCollapsed ? 'ml-16' : 'ml-64')
      )}>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-foreground md:text-xl">{title}</h1>
              {description && <p className="text-xs text-muted-foreground md:text-sm">{description}</p>}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Site
            </Link>
          </Button>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
