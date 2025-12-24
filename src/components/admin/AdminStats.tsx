import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-card-foreground">{value}</p>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          {trend && (
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                trend.positive ? 'text-green-600' : 'text-destructive'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

interface AdminStatsProps {
  stats: StatCardProps[];
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
