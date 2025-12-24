import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
      setLoading(false);
    }

    if (!authLoading) {
      checkAdminRole();
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

  if (!isAdmin) {
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

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64')}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Site
            </Link>
          </Button>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
