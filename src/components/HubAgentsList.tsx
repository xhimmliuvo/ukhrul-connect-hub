import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentCard } from '@/components/AgentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users, RefreshCw, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HubAgent {
  id: string;
  agent_code: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  vehicle_type: string;
  rating: number | null;
  total_deliveries: number;
  agent_availability?: { status: string } | null;
}

interface HubAgentsListProps {
  onRequestAgent?: (agentId: string) => void;
}

export function HubAgentsList({ onRequestAgent }: HubAgentsListProps) {
  const [agents, setAgents] = useState<HubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchAgents();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAgents() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('hub-agents');

      if (fnError) throw fnError;

      setAgents(data?.agents || []);
    } catch (e: any) {
      console.error('Hub agents error:', e);
      setError(e.message || 'Failed to load agents from hub');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" /> Live Hub Agents
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
          <Users className="h-5 w-5" /> Live Hub Agents
        </h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchAgents}>
              <RefreshCw className="h-4 w-4 mr-1" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  if (agents.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" /> Live Hub Agents
          </h2>
          <Button variant="ghost" size="sm" onClick={fetchAgents}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No delivery agents available from the hub at the moment.
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" /> Live Hub Agents
        </h2>
        <Button variant="ghost" size="sm" onClick={fetchAgents}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onRequestAgent={onRequestAgent} />
        ))}
      </div>
    </section>
  );
}
