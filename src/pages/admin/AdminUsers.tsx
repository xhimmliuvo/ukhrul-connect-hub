import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldX, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  points: number | null;
  created_at: string | null;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

const allRoles: AppRole[] = ['admin', 'moderator', 'user', 'business_owner'];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error('Failed to load users');
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      toast.error('Failed to load user roles');
      setLoading(false);
      return;
    }

    const rolesMap = new Map<string, AppRole[]>();
    (roles as UserRole[]).forEach((r) => {
      const existing = rolesMap.get(r.user_id) || [];
      rolesMap.set(r.user_id, [...existing, r.role]);
    });

    const usersWithRoles: UserWithRoles[] = (profiles || []).map((p) => ({
      ...p,
      roles: rolesMap.get(p.id) || [],
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  }

  function openRoleDialog(user: UserWithRoles) {
    setSelectedUser(user);
    setSelectedRoles(user.roles);
    setDialogOpen(true);
  }

  async function handleSaveRoles() {
    if (!selectedUser) return;
    setSaving(true);

    // Get current roles for user
    const { data: currentRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', selectedUser.id);

    const currentRoleNames = (currentRoles || []).map((r) => r.role as AppRole);

    // Roles to add
    const rolesToAdd = selectedRoles.filter((r) => !currentRoleNames.includes(r));
    // Roles to remove
    const rolesToRemove = currentRoleNames.filter((r) => !selectedRoles.includes(r));

    // Add new roles
    for (const role of rolesToAdd) {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser.id, role });

      if (error) {
        toast.error(`Failed to add ${role} role`);
        setSaving(false);
        return;
      }
    }

    // Remove old roles
    for (const role of rolesToRemove) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('role', role);

      if (error) {
        toast.error(`Failed to remove ${role} role`);
        setSaving(false);
        return;
      }
    }

    toast.success('User roles updated');
    setDialogOpen(false);
    fetchUsers();
    setSaving(false);
  }

  function toggleRole(role: AppRole) {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  }

  const getRoleBadgeVariant = (role: AppRole): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const variants: Record<AppRole, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      admin: 'destructive',
      moderator: 'default',
      business_owner: 'secondary',
      user: 'outline',
    };
    return variants[role];
  };

  const columns: Column<UserWithRoles>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={item.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{item.full_name || 'Unnamed User'}</p>
            <p className="text-sm text-muted-foreground">{item.phone || 'No phone'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      cell: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.roles.length === 0 ? (
            <Badge variant="outline">No roles</Badge>
          ) : (
            item.roles.map((role) => (
              <Badge key={role} variant={getRoleBadgeVariant(role)}>
                {role.replace('_', ' ')}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'points',
      header: 'Points',
      cell: (item) => <span className="text-foreground">{item.points || 0}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (item) => (
        <span className="text-muted-foreground">
          {item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title="Users" description="Manage user accounts and roles">
      <div className="space-y-4">
        <AdminDataTable
          data={users}
          columns={columns}
          searchKey="full_name"
          searchPlaceholder="Search users..."
          loading={loading}
          actions={(item) => (
            <Button variant="ghost" size="icon" onClick={() => openRoleDialog(item)}>
              <Shield className="h-4 w-4" />
            </Button>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser?.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{selectedUser?.full_name || 'Unnamed User'}</p>
                <p className="text-sm text-muted-foreground">ID: {selectedUser?.id.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Roles</Label>
              {allRoles.map((role) => (
                <div key={role} className="flex items-center gap-3">
                  <Checkbox
                    id={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <Label htmlFor={role} className="flex items-center gap-2 cursor-pointer">
                    {role === 'admin' && <ShieldCheck className="h-4 w-4 text-destructive" />}
                    {role === 'moderator' && <Shield className="h-4 w-4 text-primary" />}
                    {role === 'business_owner' && <ShieldX className="h-4 w-4 text-muted-foreground" />}
                    {role === 'user' && <User className="h-4 w-4 text-muted-foreground" />}
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles} disabled={saving}>
              {saving ? 'Saving...' : 'Save Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
