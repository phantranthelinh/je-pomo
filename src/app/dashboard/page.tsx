'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { StatsCard } from '@/components/social/stats-card';
import { HistoryChart } from '@/components/social/history-chart';
import { trpc } from '@/lib/trpc-client';

export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const statsQuery = trpc.timer.stats.useQuery();
  const historyQuery = trpc.timer.history.useQuery({ limit: 50 });

  const weekData = buildWeekData(historyQuery.data?.items ?? []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">Dashboard</h1>

      {statsQuery.data && (
        <StatsCard
          todaySessions={statsQuery.data.today.sessions}
          todayFocusSec={statsQuery.data.today.totalSec}
          streak={statsQuery.data.streak}
          totalSessions={statsQuery.data.total.sessions}
        />
      )}

      <HistoryChart data={weekData} label="This Week" />

      <GlassCard>
        <p className="text-sm font-medium text-brand-text mb-3">Recent Sessions</p>
        <div className="space-y-2">
          {historyQuery.data?.items.slice(0, 10).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="capitalize text-brand-text">{item.preset}</span>
                <span className="text-brand-text/40 ml-2">
                  {item.rounds} round{item.rounds > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-right">
                <span className="text-brand-text font-medium">
                  {Math.round(item.totalFocusSec / 60)}m
                </span>
                <span className="text-brand-text/30 ml-2 text-xs">
                  {new Date(item.completedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {historyQuery.data?.items.length === 0 && (
            <p className="text-brand-text/40 text-center py-4">
              No sessions yet. Start a timer to track your progress!
            </p>
          )}
        </div>
      </GlassCard>
    </main>
  );
}

type SessionItem = {
  id: string;
  completedAt: Date | string;
  totalFocusSec: number;
};

function buildWeekData(sessions: SessionItem[]) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0] as string,
      totalSec: 0,
    };
  });

  for (const item of sessions) {
    const sessionDate = new Date(item.completedAt).toISOString().split('T')[0];
    const day = days.find((d) => d.date === sessionDate);
    if (day) {
      day.totalSec += item.totalFocusSec;
    }
  }

  return days;
}
