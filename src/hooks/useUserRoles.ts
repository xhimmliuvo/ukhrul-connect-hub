import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'moderator' | 'user' | 'business_owner' | 'agent';

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    async function fetchRoles() {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } else {
        setRoles((data || []).map(r => r.role));
      }
      setLoading(false);
    }

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isModerator = hasRole('moderator') || isAdmin;
  const isBusinessOwner = hasRole('business_owner');
  const isAgent = hasRole('agent');

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isBusinessOwner,
    isAgent,
  };
}
