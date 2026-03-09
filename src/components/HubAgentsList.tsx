import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentCard } from '@/components/AgentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users } from 'lucide-react';

interface HubAgent {
  id: string;
  agent_code: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  vehicle_type: string;
  rating: number | null;
  total_deliveries: number;
  agent_availability: { status: string } | null;
}

interface HubAgentsListProps {
  onRequestAgent?: (agentId: string) => void;
}

export function HubAgentsList({ onRequestAgent }: HubAgentsListProps) {
  const [agents, setAgents] = useState<HubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('delivery_agents')
        .select('id, agent_code, full_name, phone, avatar_url, vehicle_type, rating, total_deliveries, agent_availability(status)')
        .eq('is_active', true)
        .eq('is_verified', true);

      if (dbError) throw dbError;

      setAgents((data as unknown as HubAgent[]) || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" /> Available Agents
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" /> Available Agents
        </h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </section>
    );
  }

  if (agents.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" /> Available Agents
        </h2>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No delivery agents available at the moment.
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Users className="h-5 w-5" /> Available Agents
      </h2>
      <div className="space-y-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onRequestAgent={onRequestAgent} />
        ))}
      </div>
    </section>
  );
}
