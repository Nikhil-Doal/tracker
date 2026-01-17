'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, eventsAPI } from '@/lib/api';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { TopDomains } from '@/components/dashboard/TopDomains';
import { RecentEvents } from '@/components/dashboard/RecentEvents';

export default function DashboardPage() {
  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsAPI.getDashboard(7),
  });

  // Fetch productivity data
  const { data: productivityData, isLoading: productivityLoading } = useQuery({
    queryKey: ['productivity'],
    queryFn: () => analyticsAPI.getProductivity(7),
  });

  // Fetch recent events
  const { data: recentEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['recentEvents'],
    queryFn: () => eventsAPI.getRecent(24),
  });

  // Calculate active time (simplified)
  const activeTimeHours = dashboardData?.total_events 
    ? Math.round((dashboardData.total_events * 2) / 60) // Rough estimate
    : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-2">
          Overview of your browsing activity and productivity
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalEvents={dashboardData?.total_events}
        activeTime={`${activeTimeHours}h`}
        productivityScore={Math.round(productivityData?.score || 0)}
        topDomain={dashboardData?.top_domains?.[0]?.domain}
        loading={dashboardLoading || productivityLoading}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart 
          data={dashboardData?.daily_events}
          loading={dashboardLoading}
        />
        <TopDomains
          domains={dashboardData?.top_domains}
          loading={dashboardLoading}
        />
      </div>

      {/* Recent Events */}
      <RecentEvents
        events={recentEvents?.events}
        loading={eventsLoading}
      />
    </div>
  );
}