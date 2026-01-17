'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TopDomainsProps {
  domains?: Array<{ domain: string; count: number }>;
  loading?: boolean;
}

export function TopDomains({ domains = [], loading = false }: TopDomainsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getColorClass = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
    ];
    return colors[index % colors.length];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Domains</CardTitle>
        <p className="text-sm text-slate-500">Most visited websites this week</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {domains.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Globe className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No data available yet</p>
            </div>
          ) : (
            domains.map((domain, index) => (
              <div
                key={domain.domain}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getColorClass(index)}`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {domain.domain}
                    </p>
                    <p className="text-xs text-slate-500">
                      {domain.count} visits
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  #{index + 1}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}