import { useState, useEffect } from 'react';
import { Send, Users, User, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('general');
  const [target, setTarget] = useState('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRole, setTargetRole] = useState('user');
  const [sending, setSending] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchRecent();
  }, []);

  async function fetchRecent() {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, type, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(20);
    setRecentNotifications(data || []);
  }

  async function handleSend() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSending(true);

    try {
      if (target === 'specific' && targetUserId) {
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          title,
          body,
          type,
        });
        toast.success('Notification sent to user');
      } else if (target === 'role') {
        const { data: roleUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', targetRole as any);

        if (roleUsers && roleUsers.length > 0) {
          const notifications = roleUsers.map(u => ({
            user_id: u.user_id,
            title,
            body,
            type,
          }));
          await supabase.from('notifications').insert(notifications);
          toast.success(`Notification sent to ${roleUsers.length} ${targetRole}(s)`);
        } else {
          toast.info('No users found with that role');
        }
      } else {
        // Send to all users
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id');

        if (allProfiles && allProfiles.length > 0) {
          const notifications = allProfiles.map(p => ({
            user_id: p.id,
            title,
            body,
            type,
          }));
          // Insert in batches of 100
          for (let i = 0; i < notifications.length; i += 100) {
            await supabase.from('notifications').insert(notifications.slice(i, i + 100));
          }
          toast.success(`Notification sent to ${allProfiles.length} users`);
        }
      }

      setTitle('');
      setBody('');
      fetchRecent();
    } catch (err) {
      toast.error('Failed to send notification');
    }

    setSending(false);
  }

  return (
    <AdminLayout title="Notifications" description="Send notifications to users">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Send Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Users
                    </div>
                  </SelectItem>
                  <SelectItem value="role">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      By Role
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Specific User
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {target === 'role' && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="business_owner">Business Owner</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="tourist_guide">Tourist Guide</SelectItem>
                    <SelectItem value="events_manager">Events Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {target === 'specific' && (
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Enter user UUID"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
              />
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="promo">Promotional</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="order">Order Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSend} disabled={sending || !title.trim()} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications sent yet</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {recentNotifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border border-border">
                    <p className="font-medium text-sm text-foreground">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
