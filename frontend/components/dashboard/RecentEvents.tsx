'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

interface RecentEventsProps {
  events?: Event[];
  loading?: boolean;
}

export function RecentEvents({ events = [], loading = false }: RecentEventsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      TAB_ACTIVATED: 'bg-blue-500',
      TAB_UPDATED: 'bg-green-500',
      TAB_CREATED: 'bg-purple-500',
      TAB_REMOVED: 'bg-red-500',
      WINDOW_FOCUS_CHANGED: 'bg-orange-500',
      IDLE_STATE_CHANGED: 'bg-slate-500',
    };
    return colors[type] || 'bg-slate-500';
  };

  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-slate-500">Latest browser events</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No recent activity</p>
            </div>
          ) : (
            events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${getEventColor(event.type)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {formatEventType(event.type)}
                    </Badge>
                  </div>
                  {event.title && (
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate mt-1">
                      {event.title}
                    </p>
                  )}
                  {event.domain && (
                    <p className="text-xs text-slate-500 truncate">
                      {event.domain}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}