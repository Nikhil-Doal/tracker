'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);

  // Fetch analytics data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics-dashboard', days],
    queryFn: () => analyticsAPI.getDashboard(days),
  });

  const { data: timeSpentData, isLoading: timeSpentLoading } = useQuery({
    queryKey: ['time-spent', days],
    queryFn: () => analyticsAPI.getTimeSpent(days),
  });

  const { data: productivityData, isLoading: productivityLoading } = useQuery({
    queryKey: ['analytics-productivity', days],
    queryFn: () => analyticsAPI.getProductivity(days),
  });

  // Format data for charts
  const eventTypesData = dashboardData?.event_types?.map(item => ({
    name: item.type.replace(/_/g, ' '),
    value: item.count,
  })) || [];

  const hourlyActivityData = dashboardData?.hourly_activity?.map(item => ({
    name: `${item.hour}:00`,
    value: item.count,
  })) || [];

  const timeSpentChartData = timeSpentData?.time_spent?.slice(0, 10).map(item => ({
    name: item.domain,
    value: item.hours,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-slate-500 mt-2">
            Detailed insights into your browsing patterns
          </p>
        </div>
        
        {/* Time Period Selector */}
        <Tabs value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
          <TabsList>
            <TabsTrigger value="7">7 days</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
            <TabsTrigger value="90">90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Productivity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {productivityLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {Math.round(productivityData?.score || 0)}%
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Based on {productivityData?.total_events || 0} events
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productive Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {productivityLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {productivityData?.productive_percentage || 0}%
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {productivityData?.productive_events || 0} productive events
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {timeSpentLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {Math.round(timeSpentData?.total_minutes || 0 / 60)}h
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Active browsing time
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
            <p className="text-sm text-slate-500">Distribution of browser events</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dashboardLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <PieChart data={eventTypesData} />
            )}
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activity by Hour</CardTitle>
            <p className="text-sm text-slate-500">When you&apos;re most active</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dashboardLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <BarChart data={hourlyActivityData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Spent */}
      <Card>
        <CardHeader>
          <CardTitle>Time Spent by Domain</CardTitle>
          <p className="text-sm text-slate-500">Top 10 domains by time spent</p>
        </CardHeader>
        <CardContent className="h-[400px]">
          {timeSpentLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <BarChart 
              data={timeSpentChartData}
              dataKey="value"
              color="#667eea"
            />
          )}
        </CardContent>
      </Card>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-slate-500">Total Events</h4>
              <p className="text-2xl font-bold">{dashboardData?.total_events?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-slate-500">Unique Domains</h4>
              <p className="text-2xl font-bold">{dashboardData?.top_domains?.length || 0}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-slate-500">Productive Events</h4>
              <p className="text-2xl font-bold">{productivityData?.productive_events || 0}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-slate-500">Social Events</h4>
              <p className="text-2xl font-bold">{productivityData?.social_events || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}